
import request, { getBaseInfo, createCancelToken, resetLoading } from '../../utils/request';
import { logger } from '../../utils/logger';
import themeBehavior from '../../behaviors/theme';
import i18nBehavior from '../../behaviors/i18n';

Page({
  behaviors: [themeBehavior, i18nBehavior],
  data: {
    baseInfo: getBaseInfo(),
    list: [] as any[],
    loading: false,
    shareImageUrl: '',
    generating: false,
    inviteLinkId: '',
    shareReady: false,
  },

  _isDestroyed: false,
  _isHidden: false,
  _creatingInviteLink: false,

  _downloadTask: null as any,
  _cancelToken: null as any,
  _loginCancelToken: null as any,
  _qrCancelToken: null as any,

  async onShow() {
    (this as any)._isDestroyed = false;
    (this as any)._isHidden = false;
    (this as any)._applyPendingSetData();
    if ((this as any)._cancelToken) {
      try { (this as any)._cancelToken.cancel(); } catch {  }
    }
    (this as any)._cancelToken = createCancelToken();
    (this as any)._safeSetData({ baseInfo: getBaseInfo() });
    let isLogin = await request.isLogin();
    if (!isLogin && !(this as any)._loggingIn) {
      (this as any)._loggingIn = true;
      if ((this as any)._loginCancelToken) {
        try { (this as any)._loginCancelToken.cancel(); } catch {  }
      }
      (this as any)._loginCancelToken = createCancelToken();
      try {
        await request.login((this as any)._loginCancelToken);
      } catch {
        logger.error('邀请页登录失败');
      } finally {
        (this as any)._loggingIn = false;
      }
      isLogin = await request.isLogin();
    }
    if (!isLogin) return;
    this.fetch();
    this.ensureQRCode();
  },

  onHide() {
    (this as any)._isHidden = true;
    if ((this as any)._cancelToken) {
      try { (this as any)._cancelToken.cancel(); } catch {  }
      (this as any)._cancelToken = null;
    }
    // 登录是写操作，不在 onHide 取消，避免系统调用触发 onHide 后登录中断。
    // 图片下载是保存分享图写操作的一部分，不在 onHide 中止，避免系统调用返回后 _savingImage 卡住。
    (this as any)._forceSetData({ loading: false });
    resetLoading();
  },

  onUnload() {
    // 先执行必须持久化的 UI 清理，再标记销毁；否则 _forceSetData 会因 _isDestroyed 直接返回。
    (this as any)._forceSetData({ loading: false });
    (this as any)._isDestroyed = true;
    (this as any)._isHidden = true;
    if ((this as any)._cancelToken) {
      try { (this as any)._cancelToken.cancel(); } catch {  }
      (this as any)._cancelToken = null;
    }
    if ((this as any)._loginCancelToken) {
      try { (this as any)._loginCancelToken.cancel(); } catch {  }
      (this as any)._loginCancelToken = null;
    }
    if ((this as any)._qrCancelToken) {
      try { (this as any)._qrCancelToken.cancel(); } catch {  }
      (this as any)._qrCancelToken = null;
    }
    if ((this as any)._downloadTask) {
      try { (this as any)._downloadTask.abort(); } catch {}
      (this as any)._downloadTask = null;
    }
    resetLoading();
    (this as any).unsubscribeTheme?.();
  },

  async fetch() {
    (this as any)._safeSetData({ loading: true });
    const cancelToken = (this as any)._cancelToken;
    try {
      const { data } = await request.get('/invite/list', { cancelToken }, false);
      (this as any)._safeSetData({ list: (data?.list || []).slice(0, 50) });
      if (!this.data.inviteLinkId && !(this as any)._creatingInviteLink) {
        await this.createInviteLink();
      }
      (this as any)._safeSetData({ shareReady: !!this.data.inviteLinkId });
    } catch (e: any) {
      logger.error('邀请列表加载失败', e);
      if (e?.message === 'request:abort' || (this as any)._isDestroyed || (this as any)._isHidden) return;
      wx.showToast({ title: (this as any).$t('invite.loadFail'), icon: 'none' });
    } finally {
      (this as any)._safeSetData({ loading: false });
    }
  },

  async ensureQRCode() {
    if (this.data.shareImageUrl || this.data.generating) return;
    (this as any)._safeSetData({ generating: true });
    if ((this as any)._qrCancelToken) {
      try { (this as any)._qrCancelToken.cancel(); } catch {  }
    }
    (this as any)._qrCancelToken = createCancelToken();
    const cancelToken = (this as any)._qrCancelToken;
    try {
      const { data } = await request.post('/invite/qrcode', { cancelToken }, false);
      if (data?.url) {
        (this as any)._safeSetData({ shareImageUrl: data.url });
      }
    } catch (e: any) {
      logger.warn('预生成邀请图失败', e);
    } finally {
      (this as any)._safeSetData({ generating: false });
    }
  },

  async createInviteLink(): Promise<string> {
    if (this.data.inviteLinkId) return '';
    (this as any)._creatingInviteLink = true;
    const cancelToken = (this as any)._cancelToken;
    try {
      const { data } = await request.post('/family/invite-link', { cancelToken }, false);
      if (data?.linkId) {
        (this as any)._safeSetData({ inviteLinkId: data.linkId });
        return data.linkId;
      }
    } catch (e) {
      logger.warn('创建家庭邀请链接失败', e);
    } finally {
      (this as any)._creatingInviteLink = false;
    }
    return '';
  },

  onShareAppMessage(e: any) {
    if (this.data.inviteLinkId && e?.target?.dataset?.shareType === 'family') {
      const baseInfo = this.data.baseInfo || {};
      return {
        title: (this as any).$t('family.inviteTitle', { name: baseInfo.nickName || (this as any).$t('invite.me') }),
        path: `/pages/Family/Family?linkId=${encodeURIComponent(this.data.inviteLinkId)}`,
        imageUrl: '/image/family_invite.png',
      };
    }

    const baseInfo = this.data.baseInfo || {};
    const userId = baseInfo.userId || '';
    return {
      title: (this as any).$t('invite.shareTitle', {
        name: baseInfo.nickName || (this as any).$t('invite.me'),
        brand: (this as any).$t('brand.name'),
      }),
      path: `/pages/index/index?inviter=${encodeURIComponent(userId)}`,
      imageUrl: '/image/person_invite.png',
    };
  },

  async saveShareImage() {
    await this._doSaveShareImage();
  },

  async _doSaveShareImage() {
    if (!this.data.shareImageUrl) {
      wx.showLoading({ title: (this as any).$t('invite.generating'), mask: true });
      try {
        await this.ensureQRCode();
      } finally {
        if (!(this as any)._isDestroyed && !(this as any)._isHidden) wx.hideLoading();
      }
    }
    const imageUrl = this.data.shareImageUrl;
    if (!imageUrl) {
      if (!(this as any)._isDestroyed && !(this as any)._isHidden) {
        wx.showToast({ title: (this as any).$t('invite.generateFail'), icon: 'none' });
      }
      return;
    }

    wx.showLoading({ title: (this as any).$t('common.loading'), mask: true });
    try {
      const download: any = await new Promise((resolve, reject) => {
        (this as any)._downloadTask = wx.downloadFile({
          url: imageUrl,
          success: resolve,
          fail: (err) => reject(new Error(err?.errMsg || (this as any).$t('invite.downloadFail'))),
        });
      });
      (this as any)._downloadTask = null;
      if ((this as any)._isDestroyed || (this as any)._isHidden) return;
      if (download.statusCode !== 200) {
        throw new Error(`${(this as any).$t('invite.downloadFail')}: ${download.statusCode}`);
      }
      wx.showShareImageMenu({
        path: download.tempFilePath,
        needShowEntrance: true as any,
        entrancePath: `/pages/index/index?inviter=${encodeURIComponent(this.data.baseInfo?.userId || '')}`,
        fail: (err) => {
          if ((this as any)._isDestroyed || (this as any)._isHidden) return;
          const msg = err?.errMsg || '';
          if (/cancel/i.test(msg)) return;
          wx.showModal({
            title: (this as any).$t('invite.shareFail'),
            content: msg || (this as any).$t('invite.unknownError'),
            showCancel: false,
          });
        },
      });
    } catch (e: any) {
      if ((this as any)._isDestroyed || (this as any)._isHidden) return;
      const msg = e?.message || String(e);
      if (/abort|cancel/i.test(msg)) return;
      wx.showModal({
        title: (this as any).$t('invite.loadFail'),
        content: msg,
        showCancel: false,
      });
    } finally {
      if (!(this as any)._isDestroyed && !(this as any)._isHidden) wx.hideLoading();
    }
  },

});
