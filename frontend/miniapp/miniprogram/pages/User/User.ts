
import request, { createCancelToken } from '../../utils/request';
import type { CancelToken } from '../../utils/http';
import { formatVipInfo } from '../../utils/vip';
import { openUrl } from '../../utils/util';
import { logger } from '../../utils/logger';
import { getHelpBaseURL } from '../../config/index';
import { getBackendMode } from '../../utils/storage';
import themeBehavior from '../../behaviors/theme';
import i18nBehavior from '../../behaviors/i18n';

Page({
  behaviors: [themeBehavior, i18nBehavior],
  data: {
    vipInfo: formatVipInfo(request.getVipInfo()),
    brandName: '',
    isPrivateBackend: false,
  },

  _isDestroyed: false,
  _isHidden: false,
  _cancelToken: null as CancelToken | null,

  onUnload() {
    (this as any)._isDestroyed = true;
    (this as any)._isHidden = true;
    if ((this as any)._cancelToken) {
      try { (this as any)._cancelToken.cancel(); } catch {}
      (this as any)._cancelToken = null;
    }
    (this as any).unsubscribeTheme?.();
  },

  onHide() {
    (this as any)._isHidden = true;
    // request.login 会创建服务端 session，带写语义；不在 onHide 中取消，
    // 避免切后台后 session 未建立成功。旧 token 在 onShow/onUnload 中处理。
  },

  _navigateTo(url: string, redirect = false) {
    if (redirect) {
      wx.redirectTo({ url });
    } else {
      wx.navigateTo({ url });
    }
  },

  _openWeb(url: string) {
    openUrl(url);
  },

  async onShow() {
    (this as any)._isDestroyed = false;
    (this as any)._isHidden = false;
    (this as any)._applyPendingSetData();
    if ((this as any)._cancelToken) {
      try { (this as any)._cancelToken.cancel(); } catch {}
    }
    (this as any)._cancelToken = createCancelToken();
    (this as any)._safeSetData({ isPrivateBackend: getBackendMode() === 'private' });
    try {
      await request.login((this as any)._cancelToken);
    } catch (e) {
      logger.error('user page login failed', e);
      if (!this._isDestroyed && !this._isHidden) {
        wx.showToast({ title: (this as any).$t('error.DEFAULT'), icon: 'none', duration: 2000 });
      }
    }
    if (this._isDestroyed || this._isHidden) return;
    const newVipInfo = formatVipInfo(request.getVipInfo());
    const old = this.data.vipInfo;
    if (!old || old.isVip !== newVipInfo?.isVip || old.vipExpireTime !== newVipInfo?.vipExpireTime || old.receivedFreeVip !== newVipInfo?.receivedFreeVip) {
      (this as any)._safeSetData({ vipInfo: newVipInfo });
    }
  },

  updateNavTitle() {
    wx.setNavigationBarTitle({ title: (this as any).$t('profile.title') });
  },

  onLocaleChange() {
    (this as any)._safeSetData({ brandName: (this as any).$t('brand.name') });
  },

  toGuidePage() {
    (this as any)._navigateTo('/pages/Guide/Guide', true);
  },

  toSet() {
    (this as any)._navigateTo('/pages/Set/Set');
  },

  goBackendConfig() {
    (this as any)._navigateTo('/pages/sub/BackendConfig/BackendConfig');
  },

  toFamily() {
    (this as any)._navigateTo('/pages/Family/Family');
  },

  toInvite() {
    (this as any)._navigateTo('/pages/Invite/Invite');
  },

  toExport() {
    (this as any)._openWeb('https://www.xiaohongshu.com/explore/66362ab7000000001e038b66');
  },

  toChat() {
    (this as any)._openWeb(`${getHelpBaseURL()}/tutorial/about/`);
  },

  toMcp() {
    (this as any)._navigateTo('/pages/sub/Mcp/Mcp');
  },

  toAbout() {
    (this as any)._navigateTo('/pages/sub/About/About');
  },

  gotoVip() {
    (this as any)._navigateTo('/pages/sub/Vip/Vip');
  },
});
