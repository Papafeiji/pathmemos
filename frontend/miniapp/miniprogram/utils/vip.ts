import { get, post } from './http';
import { NEW_USER_FREE_VIP_ID } from '../config/index';
import { logger } from './logger';


export const formatVipInfo = (vipInfo: any) => {
  if (!vipInfo) return vipInfo;
  return {
    ...vipInfo,
    vipExpireTime: vipInfo.vipExpireTime ? vipInfo.vipExpireTime.substring(0, 10) : '',
  };
};

let _fetchVipPromise: Promise<any> | null = null;
const VIP_CACHE_TTL_MS = 60 * 1000;

let _vipInfoCache: any = null;
let _vipInfoCacheAt = 0;

const _setVipCache = (info: any) => {
  _vipInfoCache = info;
  _vipInfoCacheAt = Date.now();
  try {
    wx.setStorageSync('papafeiji:vipInfo', JSON.stringify(info));
  } catch {
  }
};

export const fetchVipInfo = async () => {
  
  if (_fetchVipPromise) {
    return _fetchVipPromise;
  }

  _fetchVipPromise = (async () => {
    const { data: vipInfo } = await get('/user/vip', {}, true);
    const info = {
      receivedFreeVip: false,
      isVip: vipInfo?.isVip ?? 0,
      vipExpireTime: vipInfo?.expireTime ?? '',
      _fetchTime: Date.now(),
    };
    try {
      const { data: receivedFreeVip } = await get('/vip/free/check', { params: { vipId: NEW_USER_FREE_VIP_ID } }, true);
      info.receivedFreeVip = !!receivedFreeVip?.claimed;
    } catch (e) {
      logger.error('查询免费 VIP 领取状态失败', e);
    }
    _setVipCache(info);
    return info;
  })();

  try {
    return await _fetchVipPromise;
  } finally {
    _fetchVipPromise = null;
  }
};

export const claimNewUserFreeVip = async () => {
  try {
    await post('/vip/new-user', {}, true);
    
    await fetchVipInfo();
  } catch (error: any) {
    const code = error?.data?.biz_code || '';
    if (code === 'TRIAL_VIP_ALREADY_CLAIMED') {
      await fetchVipInfo();
      return;
    }
    logger.error('领取新用户免费 VIP 失败', error);
    throw error;
  }
};

export const getVipInfo = () => {
  const now = Date.now();
  if (_vipInfoCache && (now - _vipInfoCacheAt) < VIP_CACHE_TTL_MS) {
    return _vipInfoCache;
  }
  const vipInfo = wx.getStorageSync('papafeiji:vipInfo');
  try {
    _vipInfoCache = JSON.parse(vipInfo);
    _vipInfoCacheAt = now;
    return _vipInfoCache;
  } catch {
    wx.removeStorageSync('papafeiji:vipInfo');
    _vipInfoCache = null;
    _vipInfoCacheAt = 0;
    return null;
  }
};
