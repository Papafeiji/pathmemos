import request, { createCancelToken } from './request';
import { getVipInfo, fetchVipInfo } from './vip';
import { isIOS } from './util';
import { logger } from './logger';


const CENTROID_CALC_INTERVAL_MS = 30_000;     
const BACKGROUND_CENTROID_CALC_INTERVAL_MS = 120_000; // 后台降低计算频率，省电
const CENTROID_WINDOW_TIME_MS = 60_000;       
const CENTROID_MIN_POINTS = 3;                
const CENTROID_MAX_POINTS = 200;              
const BACKGROUND_CENTROID_MAX_POINTS = 50;    // 后台保留更少点，降低内存与计算
const STATIONARY_THRESHOLD_METERS = 300;
const STATIONARY_THRESHOLD_METERS_SQ = STATIONARY_THRESHOLD_METERS * STATIONARY_THRESHOLD_METERS;
const STATIONARY_EXIT_CONFIRM_COUNT = 2;
const BACKGROUND_STATIONARY_CHECK_INTERVAL_MS = 60_000; // 后台已保存驻留点后，每分钟检查是否离开
const STAY_POINT_MATURE_MS = 10 * 60 * 1000;  

const STORAGE_MAX_SIZE = 50;                  
const COORD_PRECISION = 4;                    
const getAccuracyFilter = (): number => isIOS() ? 3000 : 500;  


const VIP_CHECK_INTERVAL_MS = 5 * 60 * 1000; // VIP 状态前台运行时 5 分钟缓存，及时反映订阅/退订变化

const IOS_RESUME_GET_LOCATION_DELAY_MS = 300;
const FALLBACK_INTERVAL_MS = 300_000; // 后台系统定位回调丢失时，5 分钟兜底调 getLocation，避免静止用户误告警

interface LocationPoint {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface StayPoint {
  lat: number;
  lon: number;
  recordedAt: string;
}

const STORAGE_KEY_ENABLED = 'papafeiji:autoRecordEnabled';      
export { STORAGE_KEY_ENABLED };
const STORAGE_KEY_STAY_POINTS = 'papafeiji:autoRecordStayPoints'; 


let _window: LocationPoint[] = [];
let _lastCentroidCalcTime = 0;
let _state: 'stationary' | 'moving' = 'moving';
let _stationaryStartTime: number | null = null;
let _stationarySaved = false;
let _stableCentroid: { lat: number; lon: number } | null = null;
let _exitConfirmCount = 0;
let _lastStationaryCheckTime = 0; // 后台静止已保存时，控制离开检测频率
let _stayPointQueue: StayPoint[] = [];


let _enabledInMemory: boolean | null = null;


let _lastVipCheckTime = 0;
let _lastVipResult = false;


let _opening = false;
let _restoring = false;
let _closingGeneration = 0;
let _lifecycleCancelToken: any = null;
let _activeCancelToken: any = null;


let _appBackgroundedAt = 0;


let _reportBatchSeq = 0;
let _lastSystemCallbackAt = 0;
let _reportFailureCount = 0;
let _lastReportFailureTime = 0;


const ACTIVE_TOUCH_INTERVAL_MS = 30 * 60 * 1000;
let _lastActiveTouchTime = 0;
let _fallbackTimer: any = null;
let _fallbackPending = false;
let _iosResumeTimer: any = null;


const _nextReportBatchSeq = (): number => {
  _reportBatchSeq++;
  return _reportBatchSeq;
};


const _roundCoord = (v: number): number => {
  return Math.round(v * Math.pow(10, COORD_PRECISION)) / Math.pow(10, COORD_PRECISION);
};


// 返回平方距离（米²），避免每次比较都调用 Math.sqrt
const _distanceMetersSq = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const avgLat = ((lat1 + lat2) * 0.5) * Math.PI / 180;
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const metersPerDegLat = 111320;
  const metersPerDegLon = 111320 * Math.cos(avgLat);
  return (dLat * metersPerDegLat) ** 2 + (dLon * metersPerDegLon) ** 2;
};


const _calcCentroid = (points: LocationPoint[]): { lat: number; lon: number } => {
  let latSum = 0;
  let lonSum = 0;
  for (const p of points) {
    latSum += p.latitude;
    lonSum += p.longitude;
  }
  return {
    lat: latSum / points.length,
    lon: lonSum / points.length,
  };
};


const _isBackground = (): boolean => _appBackgroundedAt > 0;

const _getCentroidCalcInterval = (): number =>
  _isBackground() ? BACKGROUND_CENTROID_CALC_INTERVAL_MS : CENTROID_CALC_INTERVAL_MS;

const _getCentroidMaxPoints = (): number =>
  _isBackground() ? BACKGROUND_CENTROID_MAX_POINTS : CENTROID_MAX_POINTS;

const _updateVipCache = (isVip: boolean) => {
  _lastVipResult = isVip;
  _lastVipCheckTime = Date.now();
};

const _isVipFromCache = (): boolean => {
  if (_lastVipCheckTime > 0 && Date.now() - _lastVipCheckTime < VIP_CHECK_INTERVAL_MS) {
    return _lastVipResult;
  }
  const vipInfo = getVipInfo();
  const isVip = vipInfo?.isVip > 0;
  _updateVipCache(isVip);
  return isVip;
};

const _pushStayPoint = (lat: number, lon: number, timestamp: number) => {
  const point: StayPoint = {
    lat: _roundCoord(lat),
    lon: _roundCoord(lon),
    recordedAt: new Date(timestamp).toISOString(),
  };
  _stayPointQueue.push(point);
  
  _serialFlushAndReport().catch(() => {});
};


let _flushPromise: Promise<void> | null = null;

let _reportPromise: Promise<void> | null = null;

const _shouldSkipReportDueToBackoff = (): boolean => {
  if (_reportFailureCount === 0) return false;
  // 指数退避：30s、60s、120s、240s... 最大 5 分钟
  const backoffMs = Math.min(30_000 * Math.pow(2, _reportFailureCount - 1), 5 * 60 * 1000);
  return Date.now() - _lastReportFailureTime < backoffMs;
};

const _serialFlushAndReport = async (cancelToken?: any): Promise<void> => {
  if (_reportPromise) {
    return _reportPromise;
  }
  _reportPromise = (async () => {
    await _flushToStorage();
    if (_shouldSkipReportDueToBackoff()) {
      return;
    }
    try {
      await _tryReportStorage(cancelToken);
    } catch (e) {
      console.error('try report storage failed', e);
    }
  })();
  try {
    await _reportPromise;
  } finally {
    _reportPromise = null;
  }
};


const _flushToStorage = async (): Promise<void> => {
  if (_flushPromise) {
    return _flushPromise;
  }
  if (_stayPointQueue.length === 0) {
    return;
  }
  _flushPromise = (async () => {
    let pointsToFlush: StayPoint[] = [];
    try {
      pointsToFlush = _stayPointQueue.splice(0);
      const existing = await _loadFromStorage(true);
      const combined = existing.concat(pointsToFlush);
      if (combined.length > STORAGE_MAX_SIZE) {
        combined.splice(0, combined.length - STORAGE_MAX_SIZE);
      }
      await new Promise<void>((resolve, reject) => {
        wx.setStorage({
          key: STORAGE_KEY_STAY_POINTS,
          data: combined,
          success: () => resolve(),
          fail: reject,
        });
      });
    } catch {
      // 写存储失败时，把尚未持久化的点放回队列头部，避免静默丢失
      if (pointsToFlush.length > 0) {
        _stayPointQueue.unshift(...pointsToFlush);
      }
    }
  })();
  try {
    await _flushPromise;
  } finally {
    _flushPromise = null;
  }
};


const _loadFromStorage = async (throwOnError = false): Promise<StayPoint[]> => {
  try {
    return await new Promise<StayPoint[]>((resolve, reject) => {
      wx.getStorage({
        key: STORAGE_KEY_STAY_POINTS,
        success: (res) => resolve((res.data as StayPoint[]) || []),
        fail: (err) => {
          // 只有"数据不存在"才视为空；其他读取错误需要让上层感知，避免用空数据覆盖已有数据
          if (err?.errMsg?.includes('data not found')) {
            resolve([]);
          } else if (throwOnError) {
            reject(err);
          } else {
            resolve([]);
          }
        },
      });
    });
  } catch (e) {
    if (throwOnError) throw e;
    return [];
  }
};


const _isRecordingEnabled = (): boolean => {
  if (_enabledInMemory != null) return _enabledInMemory;
  try {
    _enabledInMemory = !!wx.getStorageSync(STORAGE_KEY_ENABLED);
    return _enabledInMemory;
  } catch {
    return false;
  }
};


const _setRecordingState = (enabled: boolean) => {
  _enabledInMemory = enabled;
  try {
    wx.setStorageSync(STORAGE_KEY_ENABLED, enabled);
  } catch {
  }
  try {
    const app = getApp() as any;
    if (app && app.globalData) {
      app.globalData.openAutoRecorded = enabled;
    }
  } catch {
    
  }
};


const _syncBackendConfig = async (enabled: boolean, cancelToken?: any) => {
  await request.put('/auto-record/config', { data: { enabled }, cancelToken }, true, 8000);
};


const _isTokenExpiredError = (error: any): boolean => {
  const code = error?.data?.code || '';
  const bizCode = error?.data?.biz_code || '';
  return code === '1006' || code === '9300' || code === '1011' ||
         bizCode === '1006' || bizCode === '9300' || bizCode === '1011' ||
         error?.message === '登录已过期' ||
         error?.message === '__ppfj_session_expired__';
};


const _stopLocationUpdateBackground = () => {
  // 优先调用 stopLocationUpdateBackground 停止由 startLocationUpdateBackground 启动的后台监听；
  // 部分基础库可能不存在该 API，此时回退到 stopLocationUpdate。
  try {
    if (typeof (wx as any).stopLocationUpdateBackground === 'function') {
      (wx as any).stopLocationUpdateBackground();
    }
  } catch {}
  if (typeof wx.stopLocationUpdate === 'function') {
    wx.stopLocationUpdate();
  }
};


const _postTrajectoriesWithSilentRefresh = async (data: any, cancelToken?: any): Promise<any> => {
  try {
    return await request.post('/auto-record/trajectories', { data, cancelToken }, true, 10000, true);
  } catch (error: any) {
    if (!_isTokenExpiredError(error)) {
      throw error;
    }
    await request.login(cancelToken);
    return await request.post('/auto-record/trajectories', { data, cancelToken }, true, 10000, true);
  }
};


const _startFallbackTimer = () => {
  if (!_isRecordingEnabled() || _fallbackTimer != null) return;
  const intervalMs = FALLBACK_INTERVAL_MS;
  const tick = () => {
    if (!_isRecordingEnabled()) return;
    if (!_isBackground()) return;
    if (_fallbackPending) return;
    let desired = intervalMs;
    if (_stationarySaved && _state === 'stationary') {
      const stationaryMs = Date.now() - (_stationaryStartTime || 0);
      desired = stationaryMs > 30 * 60 * 1000 ? 5 * 60 * 1000 : 60_000;
    }
    if (Date.now() - _lastSystemCallbackAt < desired - 5000) {
      return;
    }
    _fallbackPending = true;
    _getCurrentLocation(LOCATION_TIMEOUT_MS)
      .then((res: any) => {
        _fallbackPending = false;
        res.__fromPlatformFallback = true;
        onLocationChange(res);
      })
      .catch(() => {
        _fallbackPending = false;
      });
  };
  _fallbackTimer = setInterval(tick, intervalMs);
};

const _restartFallbackTimer = () => {
  _stopFallbackTimer();
  if (_isRecordingEnabled()) {
    _startFallbackTimer();
  }
};

const _stopFallbackTimer = () => {
  if (_fallbackTimer != null) {
    clearInterval(_fallbackTimer);
    _fallbackTimer = null;
  }
  _fallbackPending = false;
};


const _reportStayPoints = async (points: StayPoint[], cancelToken?: any): Promise<boolean> => {
  if (points.length === 0) return true;
  const batchSeq = _nextReportBatchSeq();
  try {
    const payload: any = { points, batchSeq };
    await _postTrajectoriesWithSilentRefresh(payload, cancelToken);
    _reportFailureCount = 0;
    _lastReportFailureTime = 0;
    return true;
  } catch (error: any) {
    _reportFailureCount++;
    _lastReportFailureTime = Date.now();
    if (_isTokenExpiredError(error)) {
      // token 过期后停止监听，但保留本地 storage 开关，重新登录后 tryRestoreAutoRecord
      // 会自动恢复，避免用户手动重新开启（AGENTS.md §3.7）。
      _resetState(true);
      return false;
    }
    return false;
  }
};


const _tryReportStorage = async (cancelToken?: any): Promise<boolean> => {
  const points = await _loadFromStorage();
  if (points.length === 0) return true;
  const ok = await _reportStayPoints(points, cancelToken);
  if (!ok) return false;
  try {
    await new Promise<void>((resolve, reject) => {
      wx.setStorage({ key: STORAGE_KEY_STAY_POINTS, data: [], success: () => resolve(), fail: reject });
    });
  } catch (e) {
    // 已上报但清理失败：记录错误、进入退避并返回 false，让同批数据在退避后重试，
    // 避免返回 true 后重复上传导致后端轨迹/日记重复（AGENTS.md §3.7）。
    logger.error('autoRecord clear storage failed after report', e);
    _reportFailureCount++;
    _lastReportFailureTime = Date.now();
    return false;
  }
  return true;
};

const LOCATION_TIMEOUT_MS = 15000;

interface _GetCurrentLocationOptions {
  highAccuracyExpireTime?: number;
}

const _getCurrentLocation = (
  timeoutMs: number = LOCATION_TIMEOUT_MS,
  opts: _GetCurrentLocationOptions = {}
): Promise<{ latitude: number; longitude: number }> => {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timeoutTimer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject({ errMsg: 'getLocation: timeout' });
    }, timeoutMs);
    wx.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      highAccuracyExpireTime: opts.highAccuracyExpireTime ?? 5000,
      success: (res) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutTimer);
        resolve(res);
      },
      fail: (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutTimer);
        reject(err);
      },
    });
  });
};


const _saveFirstRecord = async (cancelToken?: any): Promise<string | null> => {
  const loc = await _getCurrentLocation();
  const res: any = await request.post('/diary/details/auto', {
    data: {
      lat: _roundCoord(loc.latitude),
      lon: _roundCoord(loc.longitude),
    },
    cancelToken,
  }, true, 10000, true);
  const entryID = res?.data?.id || null;
  _refreshIndexList();
  return entryID;
};


const _refreshIndexList = () => {
  const app = getApp() as any;
  if (app && app.globalData) {
    app.globalData._needRefreshIndexList = true;
  }
};


export const onLocationChange = (res: any) => {
  const now = Date.now();
  if (!res.__fromPlatformFallback) {
    _lastSystemCallbackAt = now;
  }

  try {
    if (!_isRecordingEnabled()) {
      return;
    }

    if (!_isVipFromCache()) {
      closeAutoRecord().catch(() => {});
      return;
    }

    // 心跳：每 30 分钟上报一次存活信号，跟随 onLocationChange 触发，不增加独立定时器耗电。
    // 用于小程序订阅消息和服务号消息的异常告警检测。
    if (now - _lastActiveTouchTime >= ACTIVE_TOUCH_INTERVAL_MS) {
      _lastActiveTouchTime = now;
      _touchActive();
    }

    const accuracy = typeof res.accuracy === 'number' ? res.accuracy : 0;
    if (accuracy > getAccuracyFilter()) {
      return;
    }

    const lat = res.latitude;
    const lon = res.longitude;
    if (lat == null || lon == null) {
      return;
    }

    const rawTs = res.timestamp;
    const pointTimestampRaw = typeof rawTs === 'number' && rawTs > 0
      ? rawTs
      : rawTs
        ? new Date(rawTs).getTime()
        : Date.now();
    const pointTimestamp = Number.isFinite(pointTimestampRaw) ? pointTimestampRaw : Date.now();

    const isBackgroundStationarySaved =
      _isBackground() && _state === 'stationary' && _stationarySaved && _stableCentroid != null;

    // 后台且已保存驻留点的静止状态：不维护完整窗口，只保留最后一个点用于离开检测
    if (!isBackgroundStationarySaved) {
      _window.push({ latitude: lat, longitude: lon, accuracy, timestamp: pointTimestamp });

      const cutoff = pointTimestamp - CENTROID_WINDOW_TIME_MS;
      while (_window.length > 0 && _window[0].timestamp < cutoff) {
        _window.shift();
      }

      const maxPoints = _getCentroidMaxPoints();
      while (_window.length > maxPoints) {
        _window.shift();
      }
    }

    // 后台且已保存驻留点的静止状态：只做轻量离开检测，大幅降低计算
    const stableCentroid = _stableCentroid;
    if (isBackgroundStationarySaved && stableCentroid) {
      if (now - _lastStationaryCheckTime < BACKGROUND_STATIONARY_CHECK_INTERVAL_MS) {
        return;
      }
      _lastStationaryCheckTime = now;
      const distSq = _distanceMetersSq(lat, lon, stableCentroid.lat, stableCentroid.lon);
      if (distSq < STATIONARY_THRESHOLD_METERS_SQ) {
        _exitConfirmCount = 0;
        return;
      }
      _exitConfirmCount++;
      if (_exitConfirmCount < STATIONARY_EXIT_CONFIRM_COUNT) {
        return;
      }
      _state = 'moving';
      _stationaryStartTime = null;
      _stationarySaved = false;
      _stableCentroid = { lat, lon };
      _exitConfirmCount = 0;
      // 恢复窗口计算，把当前离开点作为窗口起点，避免从头积累
      _window.length = 0;
      _window.push({ latitude: lat, longitude: lon, accuracy, timestamp: pointTimestamp });
      _lastCentroidCalcTime = now;
      return;
    }

    if (now - _lastCentroidCalcTime < _getCentroidCalcInterval() || _window.length < CENTROID_MIN_POINTS) {
      return;
    }

    _lastCentroidCalcTime = now;
    const centroid = _calcCentroid(_window);
    const stable = _stableCentroid || centroid;
    const distSq = _distanceMetersSq(centroid.lat, centroid.lon, stable.lat, stable.lon);
    const isStationary = distSq < STATIONARY_THRESHOLD_METERS_SQ;

    if (isStationary) {
      _exitConfirmCount = 0;
      if (_state === 'moving') {
        _state = 'stationary';
        _stationaryStartTime = now;
        _stationarySaved = false;
        _stableCentroid = centroid;
      }
      if (_stationaryStartTime == null) {
        _stationaryStartTime = now;
      }
      if (_stableCentroid == null) {
        _stableCentroid = centroid;
      }

      const stationaryDuration = now - _stationaryStartTime;
      if (!_stationarySaved && stationaryDuration >= STAY_POINT_MATURE_MS) {
        _pushStayPoint(_stableCentroid.lat, _stableCentroid.lon, now);
        _stationarySaved = true;
      }
    } else {
      if (_state === 'stationary') {
        _exitConfirmCount++;
        if (_exitConfirmCount < STATIONARY_EXIT_CONFIRM_COUNT) {
          return;
        }
        _state = 'moving';
        _stationaryStartTime = null;
        _stationarySaved = false;
        _stableCentroid = centroid;
        _exitConfirmCount = 0;
      } else {
        
        _stableCentroid = centroid;
      }
    }

  } catch (e) {
    logger.error('autoRecord onLocationChange error', e);
  }
};


const _iosResumeGetLocation = () => {
  if (!isIOS() || !_isRecordingEnabled()) return;
  if (_iosResumeTimer) clearTimeout(_iosResumeTimer);
  _iosResumeTimer = setTimeout(() => {
    _iosResumeTimer = null;
    if (_fallbackPending) return;
    _fallbackPending = true;
    _getCurrentLocation(LOCATION_TIMEOUT_MS, { highAccuracyExpireTime: 4000 })
      .then((res) => {
        _fallbackPending = false;
        onLocationChange(res);
      })
      .catch(() => {
        _fallbackPending = false;
      });
  }, IOS_RESUME_GET_LOCATION_DELAY_MS);
};


const _startLocationUpdate = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    wx.startLocationUpdateBackground({
      success: () => {
        wx.offLocationChange(onLocationChange);
        wx.onLocationChange(onLocationChange);
        _startFallbackTimer();
        resolve();
      },
      fail: (err) => {
        reject(err);
      },
    });
  });
};


const _doOpenAutoRecord = async (onDone: (ok: boolean) => void, startGeneration: number) => {
  if (_lifecycleCancelToken) {
    try { _lifecycleCancelToken.cancel(); } catch {}
  }
  const token = createCancelToken();
  _lifecycleCancelToken = token;
  const _checkAborted = () => {
    if (!_opening || _closingGeneration !== startGeneration) {
      throw new Error('openAutoRecord aborted by close');
    }
  };

  try {
    try { await _syncBackendConfig(true, token); } catch (e) { logger.error('autoRecord step1 syncBackendConfig failed', e); throw e; }
    _checkAborted();
    try { await request.get('/auto-record/config', { cancelToken: token }); } catch (e) { logger.error('autoRecord step2 getConfig failed', e); throw e; }
    _checkAborted();
    try { await _saveFirstRecord(token); } catch (e) { logger.error('autoRecord step3 saveFirstRecord failed', e); throw e; }
    _checkAborted();
    try { await _startLocationUpdate(); } catch (e) { logger.error('autoRecord step4 startLocationUpdate failed', e); throw e; }
    _checkAborted();

    _setRecordingState(true);
    onDone(true);
  } catch {
    try {
      await _syncBackendConfig(false);
    } catch {
    }
    _resetState();
    onDone(false);
  } finally {
    if (_lifecycleCancelToken === token) {
      _lifecycleCancelToken = null;
    }
  }
};


export const openAutoRecord = (): Promise<boolean> => {
  if (_opening) {
    return Promise.reject(new Error('openAutoRecord in progress'));
  }
  _opening = true;
  const startGeneration = ++_closingGeneration;
  return new Promise((resolve, reject) => {
    let timeoutFired = false;
    const timeout = setTimeout(() => {
      timeoutFired = true;
      _opening = false;
      // 超时后立即取消进行中的请求并停止定位，避免后台偷偷运行
      if (_lifecycleCancelToken) {
        try { _lifecycleCancelToken.cancel(); } catch {}
      }
      _resetState();
      reject(new Error('openAutoRecord timeout'));
    }, 30000);

    const finish = (ok: boolean) => {
      clearTimeout(timeout);
      if (timeoutFired) {
        return;
      }
      _opening = false;
      if (ok) {
        resolve(true);
      } else {
        reject(new Error('openAutoRecord failed'));
      }
    };

    if (!(getVipInfo()?.isVip > 0)) {
      finish(false);
      return;
    }

    wx.getSetting({
      success(res) {
        const bgAuth = (res.authSetting as any)['scope.userLocationBackground'];
        if (bgAuth === true) {
          _doOpenAutoRecord(finish, startGeneration);
        } else {
          _showLocationSettingModal(finish, startGeneration);
        }
      },
      fail: () => {
        finish(false);
      },
    });
  });
};


function _showLocationSettingModal(onDone: (ok: boolean) => void, startGeneration: number) {
  wx.showModal({
    title: '需要后台定位权限',
    content: '请开启"离开后允许"定位权限，以便后台记录行程',
    confirmText: '去开启',
    cancelText: '取消',
    success: (modalRes) => {
      if (modalRes.confirm) {
        let settingTimedOut = false;
        const openTimeout = setTimeout(() => {
          settingTimedOut = true;
          _opening = false;
          onDone(false);
        }, 15000);
        wx.openSetting({
          success: (settingRes) => {
            clearTimeout(openTimeout);
            if (settingTimedOut) return;
            if (!_opening) return;
            if ((settingRes.authSetting as any)['scope.userLocationBackground']) {
              _doOpenAutoRecord(onDone, startGeneration);
            } else {
              _opening = false;
              onDone(false);
            }
          },
          fail: () => {
            clearTimeout(openTimeout);
            if (settingTimedOut) return;
            if (!_opening) return;
            _opening = false;
            onDone(false);
          },
        });
      } else {
        _opening = false;
        onDone(false);
      }
    },
    fail: () => {
      _opening = false;
      onDone(false);
    },
  });
}


const _resetState = (preserveStorage = false) => {
  if (_iosResumeTimer != null) {
    clearTimeout(_iosResumeTimer);
    _iosResumeTimer = null;
  }
  if (_activeCancelToken) {
    try { _activeCancelToken.cancel(); } catch {}
    _activeCancelToken = null;
  }
  _appBackgroundedAt = 0;
  // VIP 查询等瞬时失败场景需要保留本地 storage 开关，网络恢复后可自动恢复（AGENTS.md §3.7）。
  if (!preserveStorage) {
    _setRecordingState(false);
  } else {
    _enabledInMemory = null;
  }
  _stopFallbackTimer();
  wx.offLocationChange(onLocationChange);
  _stopLocationUpdateBackground();
  _window.length = 0;
  // 注意：不在这里清空 _stayPointQueue；关闭流程中 flush 失败时，点会被加回队列，
  // 需要保留到下次 flush。flush 成功时队列已被 splice(0) 清空。
  _stableCentroid = null;
  _lastCentroidCalcTime = 0;
  _state = 'moving';
  _stationaryStartTime = null;
  _stationarySaved = false;
  _exitConfirmCount = 0;
  _reportBatchSeq = 0;
  _lastSystemCallbackAt = 0;
  _lastStationaryCheckTime = 0;
  _reportFailureCount = 0;
  _lastReportFailureTime = 0;
  _lastActiveTouchTime = 0;
  _lastVipResult = false;
  _lastVipCheckTime = 0;
  _fallbackPending = false;
};


export const closeAutoRecord = async (): Promise<void> => {
  _closingGeneration++;
  if (_lifecycleCancelToken) {
    try { _lifecycleCancelToken.cancel(); } catch {}
    _lifecycleCancelToken = null;
  }
  if (_activeCancelToken) {
    try { _activeCancelToken.cancel(); } catch {}
    _activeCancelToken = null;
  }
  const closeToken = createCancelToken();
  try {
    if (!_isRecordingEnabled()) {
      _resetState();
      return;
    }

    try {
      await _syncBackendConfig(false);
    } catch {
    }

    try {
      await _serialFlushAndReport(closeToken);
    } catch {
    }
  } catch {
  } finally {
    try {
      _resetState();
    } catch {
    }
  }
};


const _touchActive = () => {
  if (_activeCancelToken) {
    try { _activeCancelToken.cancel(); } catch {}
  }
  const token = createCancelToken();
  _activeCancelToken = token;
  request.put('/auto-record/active', { cancelToken: token }, true, 5000)
    .catch(() => {})
    .finally(() => {
      if (_activeCancelToken === token) {
        _activeCancelToken = null;
      }
    });
};

export const tryRestoreAutoRecord = async () => {
  if (_opening) {
    return;
  }
  if (!_isRecordingEnabled()) {
    _resetState();
    return;
  }
  if (_restoring) {
    return;
  }
  _restoring = true;
  const startGeneration = _closingGeneration;
  if (_lifecycleCancelToken) {
    try { _lifecycleCancelToken.cancel(); } catch {}
  }
  const token = createCancelToken();
  _lifecycleCancelToken = token;
  try {
    await _tryReportStorage(token);

    let vipInfo;
    try {
      vipInfo = await fetchVipInfo();
    } catch (error) {
      // VIP 查询失败时不清空本地 storage 开关，但停止监听并清空内存状态，
      // 避免 _enabledInMemory 与实际后台监听不一致（AGENTS.md §3.7）。
      logger.warn('fetch vip failed during restore', error);
      _resetState(true);
      return;
    }
    if (_closingGeneration !== startGeneration) {
      _resetState();
      return;
    }
    const isVip = vipInfo?.isVip > 0;
    _updateVipCache(isVip);
    if (!isVip) {
      await closeAutoRecord();
      return;
    }

    const { data } = await request.get('/auto-record/config', { cancelToken: token });
    if (_closingGeneration !== startGeneration) {
      _resetState();
      return;
    }
    const enabled = data?.enabled ?? false;

    if (enabled) {
      wx.offLocationChange(onLocationChange);
      await new Promise<void>((resolve) => {
        wx.startLocationUpdateBackground({
          success: () => {
            if (_closingGeneration !== startGeneration) {
              _resetState();
              resolve();
              return;
            }
            _setRecordingState(true);
            wx.onLocationChange(onLocationChange);
            _startFallbackTimer();
            resolve();
          },
          fail: () => {
            _resetState();
            _syncBackendConfig(false).catch(() => {});
            resolve();
          },
        });
      });
    } else {
      // 后端已关闭自动记录，必须确保本地后台定位停止，避免定位残留
      _resetState();
    }
  } catch {
    // 除 VIP 信息查询失败外，其余步骤失败统一走关闭兜底，避免后台定位残留。
    await closeAutoRecord().catch(() => {});
  } finally {
    if (_lifecycleCancelToken === token) {
      _lifecycleCancelToken = null;
    }
    _restoring = false;
    if (_isRecordingEnabled()) {
      _lastActiveTouchTime = Date.now();
      _touchActive();
    }
  }
};


export const onAppShow = async () => {
  _appBackgroundedAt = 0;

  if (!_isRecordingEnabled()) return;

  try {
    const vipInfo = await fetchVipInfo();
    if (!(vipInfo?.isVip > 0)) {
      await closeAutoRecord();
      return;
    }
  } catch (e) {
    // VIP 查询失败不阻断 iOS 兜底恢复，避免切回前台后 fallback 定时器丢失。
    logger.warn('fetch vip failed on app show', e);
  }

  _iosResumeGetLocation();
  _restartFallbackTimer();

  await _serialFlushAndReport();

  _lastActiveTouchTime = Date.now();
  _touchActive();
};


export const onAppHide = () => {
  if (_iosResumeTimer != null) {
    clearTimeout(_iosResumeTimer);
    _iosResumeTimer = null;
  }
  _appBackgroundedAt = Date.now();
  if (!_isRecordingEnabled()) return;
  _serialFlushAndReport().catch(() => {});
};
