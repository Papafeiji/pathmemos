
import request, { createCancelToken } from '../../utils/request';
import i18nBehavior from '../../behaviors/i18n';

Component({
  behaviors: [i18nBehavior],
  
  properties: {
    info: Object,
    imageList: Array,
  },
  
  data: {
    coverImg: '',
    coverImageId: '',
  },
  observers: {
    info: function (info: any) {
      if (!info) return;
      const coverImg = info.coverImg || '';
      // 优先使用后端返回的 coverImage（file ID），不再通过 URL 反查。
      const coverImageId = info.coverImage || '';
      (this as any)._safeSetData({
        coverImg,
        coverImageId,
      });
    },
  },

  lifetimes: {
    attached(this: any) {
      (this as any)._isDestroyed = false;
      (this as any)._isHidden = false;
      (this as any)._cancelToken = null;
      (this as any)._submitting = false;
      const info = this.data.info;
      if (info) {
        (this as any)._safeSetData({
          coverImg: info.coverImg || '',
          coverImageId: info.coverImage || '',
        });
      }
    },
    detached(this: any) {
      (this as any)._isDestroyed = true;
      if ((this as any)._cancelToken) {
        try { (this as any)._cancelToken.cancel(); } catch {}
        (this as any)._cancelToken = null;
      }
    },
  },

  pageLifetimes: {
    hide(this: any) {
      // 封面设置是写操作，不在 page hide 时取消请求，避免系统调用返回后设置失败。
      // _cancelToken 在 detached / 提交完成 / 用户主动关闭时清理。
    },
  },

  methods: {
    hidden() {
      if ((this as any)._cancelToken) {
        try { (this as any)._cancelToken.cancel(); } catch {}
        (this as any)._cancelToken = null;
      }
      this.triggerEvent('hidden');
    },
    setCoverImg(e: any) {
      const self = this as any;
      if (self._isDestroyed || self._isDetached) return;
      const { img, id } = e.currentTarget.dataset;
      self._safeSetData({
        coverImg: img,
        coverImageId: id || '',
      });
    },
    cancel() {
      const self = this as any;
      if (self._cancelToken) {
        try { self._cancelToken.cancel(); } catch {}
        self._cancelToken = null;
      }
      const CoverEditDrawer = this.selectComponent('#CoverEditDrawer');
      CoverEditDrawer?.handMask();
    },
    async submit() {
      const self = this as any;
      if (self._isDestroyed || self._isDetached || self._submitting) return;
      // 未选择图片时直接关闭抽屉，不发送空 coverImage。
      if (!this.data.coverImageId) {
        this.cancel();
        return;
      }
      self._submitting = true;
      if ((this as any)._cancelToken) {
        try { (this as any)._cancelToken.cancel(); } catch {}
      }
      const cancelToken = createCancelToken();
      (this as any)._cancelToken = cancelToken;
      try {
        const coverImage = this.data.coverImageId;
        const info = {
          id: this.data.info.id,
          coverImage,
        };
        await request.put('/diary/info', { data: info, cancelToken }, true);
        // 无论当前是否隐藏，都通知父页面封面已变更；父页面在 onShow 时刷新列表。
        this.triggerEvent('submit');
        this.cancel();
      } catch (error: any) {
        if (self._isDetached || self._isHidden || error?.message === 'request:abort') return;
        wx.showToast({ title: (this as any).$t('coverEdit.setFail'), icon: 'none' });
      } finally {
        self._submitting = false;
        if ((this as any)._cancelToken === cancelToken) {
          (this as any)._cancelToken = null;
        }
      }
    },
  },
});
