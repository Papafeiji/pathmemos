import '../polyfills/textDecoder';
import { get, post, type CancelToken } from './http';
import { logger } from './logger';
import {
  getSessionId, setSessionId, clearSessionId,
  setBaseInfo, getBaseInfo,
  getAvatar, needShowXPa, setNeedShowXPa,
  getPendingLinkId, getPendingInviter, clearPendingInviter,
} from './storage';
import { fetchVipInfo, claimNewUserFreeVip } from './vip';


const LOGIN_API = '/auth/login';


let _isLogining = false;
let _loginFlight: Promise<void> | null = null;
let _loginInitiatorPage: any | null = null;

export const notifyLoginSuccess = () => {
  _isLogining = false;
  _loginFlight = null;
};

export const isLogin = (): boolean => {
  return !!getSessionId();
};

export const getFamilyConfig = async (cancelToken?: CancelToken) => {
  const { data } = await get('/auto-record/config', { cancelToken }, true);
  const enabled = data?.enabled ?? false;
  setBaseInfo({ familyConfig: { autoRecordEnabled: enabled } });
  return { autoRecordEnabled: enabled };
};

const _applyLoginResult = async (data: any, cancelToken?: CancelToken) => {
  if (cancelToken?.isCancelled()) return;
  const userInfo = data?.userInfo || {};
  if (data?.sessionId) {
    setSessionId(data.sessionId);
  }
  setBaseInfo({
    avatar: userInfo.avatarUrl || '',
    userId: userInfo.id || '',
    nickName: userInfo.nickName || '',
  });

  const app = getApp() as any;
  if (app && app.globalData) {
    app.globalData._needRefreshIndexList = true;
  }
  getFamilyConfig().catch((e) => {
    logger.error('获取家庭配置失败', e);
  });

  if (data.newUser) {
    setNeedShowXPa(true);
  }

  if (cancelToken?.isCancelled()) return;

  const pendingLinkId = getPendingLinkId();

  const _isInitiatorPageValid = () => {
    const pages = getCurrentPages();
    const currentPage = pages.length > 0 ? pages[pages.length - 1] : null;
    if (!currentPage || !!(currentPage as any)._isDestroyed || !!(currentPage as any)._isDetached || !!(currentPage as any)._isHidden) {
      return false;
    }
    return _loginInitiatorPage === currentPage;
  };


  if (data.newUser) {
    if (cancelToken?.isCancelled()) return;
    try {
      await claimNewUserFreeVip();
    } catch (err: any) {
      // TRIAL_VIP_ALREADY_CLAIMED 已在 claimNewUserFreeVip 内部收敛为成功，此处不会收到该码。
      logger.error('新用户自动领取免费 VIP 失败', err);
    }
  }


  if (pendingLinkId) {
    const pages = getCurrentPages();
    const currentPage = pages.length > 0 ? pages[pages.length - 1] : null;
    if (currentPage && currentPage.route === 'pages/Family/Family') {
      notifyLoginSuccess();
      return;
    }
    if (!_isInitiatorPageValid()) {
      notifyLoginSuccess();
      return;
    }
    notifyLoginSuccess();
    wx.redirectTo({ url: '/pages/Family/Family' });
    return;
  }
  if (data.newUser) {
    // FI57：claim 期间登录发起页可能已销毁/用户已跳走，跳转前补一次取消校验，避免强制重定向。
    if (cancelToken?.isCancelled()) return;
    notifyLoginSuccess();
    wx.redirectTo({ url: '/pages/Guide/Guide' });
    return;
  }
  notifyLoginSuccess();
};

const _doWxLogin = async (cancelToken?: CancelToken) => {
  const res: any = await new Promise((resolve, reject) => {
    wx.login({
      success: resolve,
      fail: reject,
    });
  });

  if (cancelToken?.isCancelled()) return;

  const pendingInviter = getPendingInviter();
  const payload: any = { code: res.code };
  if (pendingInviter) {
    payload.inviter = pendingInviter;
  }
  const { data } = await post(
    LOGIN_API,
    {
      data: payload,
      cancelToken,
    },
    true,
    20000,
    true
  );
  if (pendingInviter) {
    clearPendingInviter();
  }
  await _applyLoginResult(data, cancelToken);
};

export const login = async (cancelToken?: CancelToken): Promise<void> => {
  if (getSessionId()) {
    try {
      await get('/user/profile', { cancelToken }, true);
      notifyLoginSuccess();
      fetchVipInfo().catch((e) => {
        logger.error('获取 VIP 信息失败', e);
      });
      return;
    } catch {
      clearSessionId();
    }
  }

  if (_isLogining && _loginFlight) {
    return _loginFlight;
  }
  _isLogining = true;
  const pages = getCurrentPages();
  _loginInitiatorPage = pages.length > 0 ? pages[pages.length - 1] : null;
  _loginFlight = (async () => {
    try {
      await _doWxLogin(cancelToken);
    } catch (error) {
      _isLogining = false;
      _loginFlight = null;
      _loginInitiatorPage = null;
      throw error;
    }
    _isLogining = false;
    _loginFlight = null;
    _loginInitiatorPage = null;
  })();
  return _loginFlight;
};

export {
  getSessionId,
  setSessionId,
  clearSessionId,
  setBaseInfo,
  getBaseInfo,
  getAvatar,
  needShowXPa,
  setNeedShowXPa,
};
