
import './polyfills/textDecoder';
import request from './utils/request';
import { tryRestoreAutoRecord, onAppShow, onAppHide, STORAGE_KEY_ENABLED } from './utils/autoRecord';
import { getSystemInfo, clearSystemInfoCache } from './utils/util';
import { logger } from './utils/logger';
import { themeManager } from './utils/theme';
import { i18n } from './utils/i18n';
import { setPendingInviter } from './utils/storage';

const t = (key: string) => i18n.t(key);

App<IAppOption>({
  globalData: {
    openAutoRecorded: false,
    _needRefreshIndexList: true,
    _lastAutoRecordRestoreTime: 0,
  },
  onLaunch(options?: WechatMiniprogram.App.LaunchShowOption) {
    const systemInfo = getSystemInfo();
    (this as any).globalData._systemInfo = systemInfo;
    (this as any).globalData.theme = systemInfo.theme || 'light';

    i18n.init();

    themeManager.init();
    themeManager.onChange((theme) => {
      (this as any).globalData.theme = theme;
    });

    if (!(this as any)._windowResizeRegistered) {
      (this as any)._windowResizeRegistered = true;
      wx.onWindowResize(() => {
        clearSystemInfoCache();
      });
    }

    const enabled = !!wx.getStorageSync(STORAGE_KEY_ENABLED);
    (this as any).globalData.openAutoRecorded = enabled;

    const doLogin = () => {
      request.login()
        .then(() => request.isLogin())
        .then((loggedIn) => {
          if (loggedIn) {
            
            (this as any).globalData._needRefreshIndexList = true;
            (this as any).globalData._lastAutoRecordRestoreTime = Date.now();
            tryRestoreAutoRecord();
            request.put('/user/lang', { data: { lang: i18n.getLocale() } }).catch(() => {});
          }
        })
        .catch((err: any) => {
          logger.warn('启动登录或恢复自动记录失败', err);
        });
    };

    const inviter = options?.query?.inviter;
    const scene = options?.query?.scene;

    if (inviter) {
      setPendingInviter(inviter);
      doLogin();
    } else if (scene) {
      this._resolveSceneAndLogin(scene, doLogin);
    } else {
      doLogin();
    }

    this.checkForUpdate();
  },

  _resolveSceneAndLogin(sceneValue: string, doLogin: () => void) {
    try {
      const decoded = decodeURIComponent(sceneValue);
      const shortCode = decoded.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (shortCode.length < 6) {
        doLogin();
        return;
      }
      request.get('/invite/resolve', { params: { code: shortCode } }, false)
        .then(({ data }: any) => {
          if (data?.userId) {
            setPendingInviter(data.userId);
          }
        })
        .catch((err: any) => {
          logger.warn('场景码解析失败', err);
        })
        .finally(() => {
          doLogin();
        });
    } catch (e) {
      logger.warn('场景码处理失败', e);
      doLogin();
    }
  },
  onShow() {
    const loggedIn = request.isLogin();
    if (loggedIn) {
      const app = this as any;
      (async () => {
        const lastRestoreTime = app.globalData._lastAutoRecordRestoreTime || 0;
        const now = Date.now();
        if (now - lastRestoreTime > 30000) {
          app.globalData._lastAutoRecordRestoreTime = now;
          await tryRestoreAutoRecord();
        }
        onAppShow();
        const vipInfo = (request as any).getVipInfo?.();
        const needRefresh = !vipInfo || (Date.now() - (vipInfo._fetchTime || 0) > 5 * 60 * 1000);
        if (needRefresh) {
          request.fetchVipInfo().catch((err: any) => {
            logger.error('onShow 刷新 VIP 信息失败', err);
          });
        }
      })();
    }
  },
  onHide() {
    onAppHide();
  },
  onError(err: any) {
    const pages = getCurrentPages();
    const route = pages.length > 0 ? pages[pages.length - 1].route : '';
    const msg = typeof err === 'string' ? err : (err?.message || String(err));
    logger.error('未捕获小程序异常', { message: msg, route });
  },
  onUnhandledRejection(res: any) {
    const pages = getCurrentPages();
    const route = pages.length > 0 ? pages[pages.length - 1].route : '';
    const reason = res?.reason || res;
    const msg = typeof reason === 'string' ? reason : (reason?.message || String(reason));
    logger.error('未捕获 Promise 拒绝', { message: msg, route });
  },
  checkForUpdate() {
    const updateManager = wx.getUpdateManager();
    updateManager.onCheckForUpdate((res) => {
      if (res.hasUpdate) {
        updateManager.onUpdateReady(() => {
          wx.showModal({
            title: t('app.updateTitle'),
            content: t('app.updateContent'),
            success: (res) => {
              if (res.confirm) {
                updateManager.applyUpdate();
              }
            },
          });
        });
        updateManager.onUpdateFailed(() => {
          wx.showModal({
            title: t('app.updateFailTitle'),
            content: t('app.updateFailContent'),
            showCancel: false,
          });
        });
      }
    });
  },
});
