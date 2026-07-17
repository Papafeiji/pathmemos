
import themeBehavior from '../../../behaviors/theme';
import i18nBehavior from '../../../behaviors/i18n';

// 教程/帮助页统一托管在 SaaS 站点，私有模式同样允许 papafeiji.cn
const _getAllowedDomains = (): string[] => {
  return ['papafeiji.cn', 'xiaohongshu.com'];
};

const _isAllowedUrl = (url: string): boolean => {
  if (!url) return false;
  if (!url.startsWith('https://')) return false;
  const hostname = url.split('/')[2]?.split(':')[0] || '';
  const domains = _getAllowedDomains();
  return domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
};

Page({
  behaviors: [themeBehavior, i18nBehavior],
  _isDestroyed: false,
  _isHidden: false,

  data: {
    url: '',
  },

  onLoad(option) {
    this._isDestroyed = false;
    let url = '';
    try {
      url = decodeURIComponent(option.url || '');
    } catch {
      url = '';
    }
    if (!_isAllowedUrl(url)) {
      wx.showToast({ title: (this as any).$t('webPage.invalidUrl'), icon: 'none' });
      this.goBack();
      return;
    }
    this._safeSetData({ url });
  },

  onUnload() {
    this._isDestroyed = true;
    this._isHidden = true;
    (this as any).unsubscribeTheme?.();
  },

  onHide() {
    this._isHidden = true;
  },

  onShow() {
    this._isHidden = false;
    (this as any)._applyPendingSetData();
  },

  goBack() {
    const pages = getCurrentPages();
    if (pages.length <= 1) {
      wx.reLaunch({ url: '/pages/index/index' });
    } else {
      wx.navigateBack();
    }
  },

  onLoadError() {
    if (this._isDestroyed) return;
    this.goBack();
  },
});
