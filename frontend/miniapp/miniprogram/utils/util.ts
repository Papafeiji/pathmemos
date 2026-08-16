import { get } from './http';
import dayjs from '../lib/dayjs';
import { logger, sanitizeUrlForLog } from './logger';
import { i18n } from './i18n';


export const safeDayjs = (input: any) => {
  if (input == null || input === '') return null;
  const d = dayjs(input);
  return d.isValid() ? d : null;
};

let _systemInfoCache: any = null;

export const clearSystemInfoCache = () => {
  _systemInfoCache = null;
};

export const isIOS = (): boolean => {
  const info = getSystemInfo();
  return /iOS|iPhone|iPad|iPod/i.test(info?.system || '');
};

export const getSystemInfo = () => {
  if (_systemInfoCache) {
    return _systemInfoCache;
  }
  let windowInfo: any = {};
  let deviceInfo: any = {};
  let appBaseInfo: any = {};
  if (typeof wx.getWindowInfo === 'function') {
    try { windowInfo = wx.getWindowInfo(); } catch (e) { logger.warn('getWindowInfo failed', e); }
  }
  if (typeof wx.getDeviceInfo === 'function') {
    try { deviceInfo = wx.getDeviceInfo(); } catch (e) { logger.warn('getDeviceInfo failed', e); }
  }
  // getAppBaseInfo 是获取 theme（深色模式）的唯一新 API 途径
  if (typeof wx.getAppBaseInfo === 'function') {
    try { appBaseInfo = wx.getAppBaseInfo(); } catch (e) { logger.warn('getAppBaseInfo failed', e); }
  }
  // 低版本基础库没有上述新 API 时，回退到 getSystemInfoSync
  if ((!windowInfo.screenWidth || !appBaseInfo.theme) && typeof wx.getSystemInfoSync === 'function') {
    try {
      const legacy = wx.getSystemInfoSync();
      windowInfo = { ...legacy, ...windowInfo };
      deviceInfo = { ...legacy, ...deviceInfo };
      appBaseInfo = { ...legacy, ...appBaseInfo };
    } catch (e) { logger.warn('getSystemInfoSync fallback failed', e); }
  }

  const result = { ...windowInfo, ...deviceInfo, ...appBaseInfo } as any;
  const statusBarHeight = result.statusBarHeight || 20;

  let capsuleInfo: any = { top: statusBarHeight + 4, height: 32, width: 0, left: 0, right: 0, bottom: 0 };
  if (typeof wx.getMenuButtonBoundingClientRect === 'function') {
    try { capsuleInfo = wx.getMenuButtonBoundingClientRect() || capsuleInfo; } catch (e) { logger.warn('getMenuButtonBoundingClientRect failed', e); }
  }
  const navbarHeight = (capsuleInfo.top - statusBarHeight) * 2 + capsuleInfo.height;

  const safeArea = result.safeArea || {};
  // 直接用 screenHeight：横屏时取 max(高,宽) 会拿到宽度导致底部安全区算错。
  const screenHeight = result.screenHeight || 667;
  const safeAreaHeight = Math.max(safeArea.height || 0, safeArea.width || 0);
  const bottomSafeHeight = safeAreaHeight && screenHeight
    ? Math.max(screenHeight - safeAreaHeight - statusBarHeight, 0)
    : 0;

  result.statusBarHeight = statusBarHeight;
  result.navbarHeight = navbarHeight;
  result.headerHeight = statusBarHeight + navbarHeight;
  result.bottomSafeHeight = bottomSafeHeight;
  result.capsuleInfo = capsuleInfo;

  _systemInfoCache = result;
  return result;
};


// formatTimeLabel 统一的"时段+时间"展示（NoteEdit 与 TimePicker 共用）。
// 曾有两份实现且映射漂移（9-11 点上午 vs 9-12 点中午），此处收敛为单一来源。
export const formatTimeLabel = (hour: number, minute: number): string => {
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return '';
  let periodKey = '';
  if (hour === 0) {
    periodKey = 'timePicker.period.midnight';
  } else if (hour >= 1 && hour <= 4) {
    periodKey = 'timePicker.period.earlyMorning';
  } else if (hour >= 5 && hour <= 8) {
    periodKey = 'timePicker.period.morning';
  } else if (hour >= 9 && hour <= 11) {
    periodKey = 'timePicker.period.forenoon';
  } else if (hour === 12) {
    periodKey = 'timePicker.period.noon';
  } else if (hour >= 13 && hour <= 18) {
    periodKey = 'timePicker.period.afternoon';
  } else {
    periodKey = 'timePicker.period.evening';
  }
  const period = i18n.t(periodKey);
  const displayHour = hour === 0 ? 12 : (hour <= 12 ? hour : hour - 12);
  const displayMinute = minute < 10 ? `0${minute}` : `${minute}`;
  return `${period} ${displayHour}:${displayMinute}`;
};

export interface ReverseAddressResult {
  address: string;
  detailAddress: string;
  landmark: string;
  areaCode: string;
  areaName: string;
  location: { lat: number; lng: number };
  pois?: { id: string; title: string; address: string; distance: number; lat: number; lng: number }[];
}

export const getReverseAddress = async (latitude: string | number, longitude: string | number, withPois = true): Promise<ReverseAddressResult | null> => {
  try {
    const params: any = { latitude, longitude };
    if (!withPois) params.pois = '0';
    const { data } = await get('/location/reverse', { params }, true);
    return {
      address: data?.address || '',
      detailAddress: data?.detailAddress || '',
      landmark: data?.landmark || '',
      areaCode: data?.areaCode || '',
      areaName: data?.areaName || '',
      location: { lat: Number(latitude), lng: Number(longitude) },
      pois: (data?.pois || []).slice(0, 6).map((p: any) => ({
        id: p.id || '',
        title: p.title || '',
        address: p.address || '',
        distance: p.distance || 0,
        lat: p.lat || 0,
        lng: p.lng || 0,
      })),
    };
  } catch (e) {
    logger.error('getReverseAddress error', e);
    return null;
  }
};

export const openUrl = (url: string, complete?: () => void) => {
  wx.navigateTo({
    url: `/pages/sub/WebPage/WebPage?url=${encodeURIComponent(url)}`,
    complete,
    fail: (err: any) => {
      logger.error('openUrl navigateTo failed', { url: sanitizeUrlForLog(url), err });
      wx.showToast({ title: i18n.t('error.openFail'), icon: 'none' });
    },
  });
};

export const flatDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const metersPerDegLat = 111320.0;
  const avgLat = ((lat1 + lat2) * 0.5 * Math.PI) / 180;
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const dy = dLat * metersPerDegLat;
  const dx = dLon * metersPerDegLat * Math.cos(avgLat);
  return Math.sqrt(dx * dx + dy * dy);
};
