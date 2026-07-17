
import { setNeedShowXPa } from '../../utils/storage';

import { OSS_PUBLIC_URL } from '../../config/index';
import i18n from '../../utils/i18n';
import themeBehavior from '../../behaviors/theme';
import i18nBehavior from '../../behaviors/i18n';

const OSS_TUTORIAL = `${OSS_PUBLIC_URL}/system/tutorial`;

Page({
  behaviors: [themeBehavior, i18nBehavior],
  data: {
    step: 0,
    showEditDrawer: false,
    showAIDrawer: false,
    images: [
      `${OSS_TUTORIAL}/guide-1.png`,
      `${OSS_TUTORIAL}/guide-2.png`,
      `${OSS_TUTORIAL}/guide-3.png`,
      `${OSS_TUTORIAL}/guide-4.png`,
    ],
  },

  onLocaleChange() {
    this._syncImages();
  },

  _isDestroyed: false,
  _isHidden: false,

  onShow() {
    (this as any)._isDestroyed = false;
    (this as any)._isHidden = false;
    (this as any)._applyPendingSetData();
    this.updateNavTitle();
    this._syncImages();
  },

  updateNavTitle() {
    wx.setNavigationBarTitle({ title: (this as any).$t('brand.name') });
  },

  onUnload() {
    (this as any)._forceSetData({ showEditDrawer: false, showAIDrawer: false });
    (this as any)._isDestroyed = true;
    (this as any)._isHidden = true;
    (this as any).unsubscribeTheme?.();
  },

  onHide() {
    (this as any)._isHidden = true;
    // 编辑抽屉在 onHide 中保留，避免系统调用触发 onHide 后返回抽屉消失；
    // 仅在 onUnload 中关闭。AI 抽屉可关闭。
    (this as any)._forceSetData({ showAIDrawer: false });
  },

  toUser() {
    wx.navigateTo({ url: '/pages/User/User' });
  },

  toIndex() {
    wx.redirectTo({ url: '/pages/index/index' });
  },

  next() {
    if (this.data.step === 3) {
      setNeedShowXPa(false);
      wx.redirectTo({ url: '/pages/index/index' });
    } else {
      (this as any)._safeSetData({ step: this.data.step + 1 });
    }
  },

  _syncImages() {
    const suffix = i18n.getLocale() === 'en' ? '_en' : '';
    (this as any)._safeSetData({
      images: [
        `${OSS_TUTORIAL}/guide-1${suffix}.png`,
        `${OSS_TUTORIAL}/guide-2${suffix}.png`,
        `${OSS_TUTORIAL}/guide-3${suffix}.png`,
        `${OSS_TUTORIAL}/guide-4${suffix}.png`,
      ],
    });
  },

  pre() {
    if (this.data.step > 0) {
      (this as any)._safeSetData({ step: this.data.step - 1 });
    }
  },

  doShowEditDrawer() {
    (this as any)._safeSetData({ showEditDrawer: true });
  },

  hiddenEditDrawer() {
    (this as any)._safeSetData({ showEditDrawer: false });
  },

  hiddenAIDrawer() {
    (this as any)._safeSetData({ showAIDrawer: false });
  },
});
