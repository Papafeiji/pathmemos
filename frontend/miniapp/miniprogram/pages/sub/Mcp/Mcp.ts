
import request, { createCancelToken, getErrorMessage, resetLoading } from '../../../utils/request';
import { getBaseURL } from '../../../config/index';
import themeBehavior from '../../../behaviors/theme';
import i18nBehavior from '../../../behaviors/i18n';
import type { CancelToken } from '../../../utils/http';

Page({
  behaviors: [themeBehavior, i18nBehavior],
  data: {
    apiKey: '',
    apiUrl: `${getBaseURL()}/mcp/diary`,
    memoryUrl: `${getBaseURL()}/mcp/memories`,
    authUrl: '',
    mcpConfigText: '',
    loading: false,
    activeTab: 'mcp' as 'mcp' | 'connector' | 'http',
    confirmDialog: {
      visible: false,
      title: '',
      content: '',
      cancelText: '',
      confirmText: '',
      confirmType: 'default',
    },
  },

  _isDestroyed: false,
  _isHidden: false,

  _cancelToken: null as CancelToken | null,
  _generateCancelToken: null as CancelToken | null,

  onLoad() {
    (this as any)._isDestroyed = false;
    if (this._cancelToken) {
      try { this._cancelToken.cancel(); } catch {}
    }
    this._cancelToken = createCancelToken();
    this.fetchKeyInfo(this._cancelToken);
  },

  onShow() {
    const wasHidden = (this as any)._isHidden;
    (this as any)._isHidden = false;
    (this as any)._applyPendingSetData();
    // 切后台期间完成的生成/加载可能因 _safeSetData 跳过而丢失结果，返回前台后补刷新。
    // 首次 onLoad 与从后台返回的 onShow 可能连续触发，用 loading 标志避免重复请求。
    if (wasHidden && !this.data.loading) {
      if (this._cancelToken) {
        try { this._cancelToken.cancel(); } catch {}
      }
      this._cancelToken = createCancelToken();
      this.fetchKeyInfo(this._cancelToken);
    }
  },

  onHide() {
    (this as any)._isHidden = true;
    (this as any)._forceSetData({
      'confirmDialog.visible': false,
      loading: false,
    });
    if (this._cancelToken) {
      try { this._cancelToken.cancel(); } catch {}
      this._cancelToken = null;
    }
    // API Key 生成是写操作，不在 onHide 取消，避免系统调用返回后生成失败。
    resetLoading();
  },

  onUnload() {
    (this as any)._forceSetData({ 'confirmDialog.visible': false });
    (this as any)._isDestroyed = true;
    (this as any)._isHidden = true;
    if (this._cancelToken) {
      try { this._cancelToken.cancel(); } catch {}
      this._cancelToken = null;
    }
    if (this._generateCancelToken) {
      try { this._generateCancelToken.cancel(); } catch {}
      this._generateCancelToken = null;
    }
    resetLoading();
    (this as any).unsubscribeTheme?.();
  },

  async fetchKeyInfo(cancelToken?: CancelToken) {
    (this as any)._safeSetData({ loading: true });
    let nextData = { apiKey: '', apiUrl: '', memoryUrl: '', authUrl: '', mcpConfigText: '' };
    try {
      const res: any = await request.get('/mcp/key', { cancelToken });
      const info = res.data;
      const config = info?.mcpConfig || info?.mcpConfigTemplate;
      nextData = {
        apiKey: info?.apiKey || '',
        apiUrl: info?.apiUrl || `${getBaseURL()}/mcp/diary`,
        memoryUrl: info?.memoryUrl || `${getBaseURL()}/mcp/memories`,
        authUrl: info?.authUrl || '',
        mcpConfigText: config ? JSON.stringify(config, null, 2) : '',
      };
    } catch (err: any) {
      if ((this as any)._isDestroyed || (this as any)._isHidden || err?.message === 'request:abort') {
        (this as any)._safeSetData({ loading: false });
        return;
      }
      wx.showToast({ title: (this as any).$t('mcp.loadFail'), icon: 'none' });
      (this as any)._safeSetData({ loading: false });
      return;
    }
    if ((this as any)._isDestroyed || (this as any)._isHidden) {
      (this as any)._safeSetData({ ...nextData, loading: false, ...this._tabFallback(nextData.authUrl) });
      return;
    }
    (this as any)._safeSetData({ ...nextData, loading: false, ...this._tabFallback(nextData.authUrl) });
  },

  // 开源版/无 Worker 入口时后端不返回 authUrl，"AI 连接器" Tab 会隐藏，
  // 若当前停留在该 Tab 需回退到默认 Tab，避免内容区空白。
  _tabFallback(authUrl: string) {
    if (!authUrl && this.data.activeTab === 'connector') {
      return { activeTab: 'mcp' as const };
    }
    return {};
  },

  switchTab(e: any) {
    const tab = e.currentTarget.dataset.tab;
    if (tab !== 'mcp' && tab !== 'connector' && tab !== 'http') return;
    (this as any)._safeSetData({ activeTab: tab });
  },

  async generateKey() {
    await (this as any)._submitKey('/mcp/key');
  },

  async rotateKey() {
    await (this as any)._submitKey('/mcp/key/rotate');
  },

  async _submitKey(url: string) {
    if ((this as any)._generating) return;
    (this as any)._generating = true;
    if (this._generateCancelToken) {
      try { this._generateCancelToken.cancel(); } catch {}
    }
    const cancelToken = createCancelToken();
    this._generateCancelToken = cancelToken;
    try {
      if ((this as any)._isDestroyed) return;
      if (!(this as any)._isHidden) {
        wx.showLoading({ title: (this as any).$t('mcp.generating'), mask: true });
      }
      const res: any = await request.post(url, { cancelToken });
      const info = res.data;
      const config = info?.mcpConfig;
      if ((this as any)._isDestroyed || (this as any)._isHidden) return;
      (this as any)._safeSetData({
        apiKey: info?.apiKey || '',
        apiUrl: info?.apiUrl || `${getBaseURL()}/mcp/diary`,
        memoryUrl: info?.memoryUrl || `${getBaseURL()}/mcp/memories`,
        authUrl: info?.authUrl || '',
        mcpConfigText: config ? JSON.stringify(config, null, 2) : '',
        ...this._tabFallback(info?.authUrl || ''),
      });
      wx.showToast({ title: (this as any).$t('mcp.generateSuccess'), icon: 'success' });
    } catch (err: any) {
      if ((this as any)._isDestroyed || (this as any)._isHidden || err?.message === 'request:abort') return;
      wx.showToast({ title: getErrorMessage(err, (this as any).$t('mcp.generateFail')), icon: 'none' });
    } finally {
      if (!(this as any)._isDestroyed && !(this as any)._isHidden) wx.hideLoading();
      this._generateCancelToken = null;
      (this as any)._generating = false;
    }
  },

  refreshKey() {
    (this as any)._safeSetData({
      confirmDialog: {
        visible: true,
        title: (this as any).$t('mcp.refreshKey'),
        content: (this as any).$t('mcp.refreshConfirm'),
        cancelText: (this as any).$t('mcp.cancel'),
        confirmText: (this as any).$t('mcp.refreshKey'),
        confirmType: 'default',
      },
    });
  },

  onConfirmDialogConfirm() {
    (this as any)._safeSetData({ 'confirmDialog.visible': false });
    this.rotateKey();
  },

  onConfirmDialogCancel() {
    (this as any)._safeSetData({ 'confirmDialog.visible': false });
  },

  onKeyTap() {
    const key = this.data.apiKey;
    if (!key) {
      wx.showToast({ title: (this as any).$t('mcp.noKeyToCopy'), icon: 'none' });
      return;
    }
    this._copyText(key);
  },

  onCopyConfig() {
    if (!this.data.mcpConfigText) return;
    this._copyText(this.data.mcpConfigText);
  },

  onCopyAuthUrl() {
    if (!this.data.authUrl) return;
    this._copyText(this.data.authUrl);
  },

  _copyText(text: string) {
    const self = this as any;
    wx.setClipboardData({
      data: text,
      success: () => {
        if (self._isDestroyed || self._isHidden) return;
        wx.showToast({ title: self.$t('mcp.copied'), icon: 'success' });
      },
      fail: () => {
        if (self._isDestroyed || self._isHidden) return;
        wx.showToast({ title: self.$t('mcp.copyFail'), icon: 'none' });
      },
    });
  },

});
