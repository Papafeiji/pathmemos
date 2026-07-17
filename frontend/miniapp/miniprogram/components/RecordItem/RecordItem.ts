import request, { FILE_TYPE, getErrorMessage, createCancelToken } from '../../utils/request';


import touchSwipe from '../../behaviors/touchSwipe';
import i18nBehavior from '../../behaviors/i18n';

const CONTENT_FONT_SIZE = 28;
const CONTENT_MAX_LINES = 3;
const CONTENT_PADDING_H = 56;
const SCREEN_WIDTH_RPX = 750;
const CONTENT_AVAILABLE_WIDTH_RPX = SCREEN_WIDTH_RPX - 64 - CONTENT_PADDING_H;
const AVG_CHARS_PER_LINE = Math.floor(CONTENT_AVAILABLE_WIDTH_RPX / CONTENT_FONT_SIZE);
const MAX_PREVIEW_IMAGES = 50;

function _shouldShowMore(text: string): boolean {
  if (!text) return false;
  const lines = text.split('\n');
  if (lines.length > CONTENT_MAX_LINES) return true;
  
  return text.length > AVG_CHARS_PER_LINE * CONTENT_MAX_LINES;
}

Component({
  behaviors: [touchSwipe, i18nBehavior],
  properties: {
    info: Object,
    index: Number,
    isLast: Boolean,
    userId: String,
  },

  data: {
    data: {} as any,
    launch: false,
    dotColor: '#8BC5E5',
    dotShadow: '#8BC5E540',
    confirmDialog: {
      visible: false,
      title: '',
      content: '',
      cancelText: '',
      confirmText: '',
      confirmType: 'default',
    },
  },

  lifetimes: {
    attached(this: any) {
      // 组件实例被回收复用时，_deleting 可能仍停留在 true，导致新项无法删除。
      this._isDestroyed = false;
      this._isHidden = false;
      this._deleting = false;
      this._lastInfoId = undefined;
      const info = this.data.info;
      if (info) {
        this._lastInfoId = info.id;
        (this as any)._safeSetData({
          data: this.formatData(info, this.data.index),
          dotColor: info?.dotColor || '#8BC5E5',
          dotShadow: `${info?.dotColor || '#8BC5E5'}40`,
          isTouchLeft: false,
          launch: false,
        });
      }
    },
    detached(this: any) {
      if (this._cancelToken) {
        try { this._cancelToken.cancel(); } catch {}
        this._cancelToken = null;
      }
      this._isDetached = true;
      this._deleting = false;
      this._ignoreNextTap = false;
      (this as any)._isDestroyed = true;
    },
  },

  pageLifetimes: {
    hide(this: any) {
      // 删除是写操作，不在 page hide 时取消请求；_cancelToken / _deleting 在 detached / 删除完成时清理。
      (this as any)._forceSetData({
        'confirmDialog.visible': false,
        isTouchLeft: false,
      });
    },
  },

  observers: {
    info: function (info) {
      const isNewRecord = (this as any)._lastInfoId !== info?.id;
      (this as any)._lastInfoId = info?.id;
      const update: any = {
        data: this.formatData(info, this.data.index),
        dotColor: info?.dotColor || '#8BC5E5',
        dotShadow: `${info?.dotColor || '#8BC5E5'}40`,
      };
      if (isNewRecord) {
        update.isTouchLeft = false;
        update.launch = false;
      }
      (this as any)._safeSetData(update);
    },
  },

  methods: {
    formatData(data: any, itemIndex: number) {
      if (!data || !data.recordTime) return { ...data, recordTime: '', showMore: false, images: [] };
      const images = (data.recordImages || [])
        .map((img: any, imgIndex: number) => ({
          ...img,
          itemIndex,
          imgIndex,
        }))
        .slice(0, MAX_PREVIEW_IMAGES);
      const currentUserId = this.properties.userId || '';
      return {
        ...data,
        recordTime: data.recordTime.split(' ')[1]?.slice(0, -3) || '',
        showMore: _shouldShowMore(data.recordText || ''),
        images,
        showFamilyName: data.familyMemberUserId && data.familyMemberUserId !== currentUserId && !!data.familyMemberNickName,
      };
    },
    handPreviewImage(e: { currentTarget: { dataset: { src: string; images: any[] } } }) {
      const images = e.currentTarget.dataset.images || [];
      const urls = images
        .filter((item) => item.type !== FILE_TYPE.DELETE && item.filePath)
        .map((item) => item.filePath);
      if (!urls.length) return;
      const currentSrc = e.currentTarget.dataset.src;
      const current = currentSrc
        ? (images.find((item) => item.filePath === currentSrc)?.filePath || currentSrc)
        : urls[0];
      wx.previewImage({
        current,
        urls,
      });
    },
    bindEdit() {
      if ((this as any)._ignoreNextTap) {
        (this as any)._ignoreNextTap = false;
        return;
      }
      this.triggerEvent('handEdit', this.data.info);
    },
    doLaunch() {
      (this as any)._safeSetData({ launch: !this.data.launch });
    },

    touchStart: function (e: any) {
      (this as any)._swipeTouchStart(e);
      (this as any)._maxSwipeDeltaX = 0;
      (this as any)._ignoreNextTap = false;
    },
    touchMove: function (e: any) {
      const currentUserId = this.properties.userId || '';
      if (this.data.data.familyMemberUserId !== currentUserId) {
        return;
      }
      (this as any)._swipeTouchMove(e);
      const startX = (this as any)._startX;
      const moveX = e.touches?.[0]?.pageX;
      if (startX !== undefined && moveX !== undefined) {
        const delta = Math.abs(moveX - startX);
        if (delta > ((this as any)._maxSwipeDeltaX || 0)) {
          (this as any)._maxSwipeDeltaX = delta;
        }
      }
    },
    touchEnd: function (e: any) {
      const currentUserId = this.properties.userId || '';
      if (this.data.data.familyMemberUserId !== currentUserId) {
        return;
      }
      (this as any)._swipeTouchEnd(e);
      if (((this as any)._maxSwipeDeltaX || 0) > 30) {
        (this as any)._ignoreNextTap = true;
      }
      (this as any)._maxSwipeDeltaX = 0;
    },
    del: function () {
      (this as any)._safeSetData({
        confirmDialog: {
          visible: true,
          title: (this as any).$t('recordItem.deleteTitle'),
          content: (this as any).$t('recordItem.deleteContent'),
          cancelText: (this as any).$t('common.cancel'),
          confirmText: (this as any).$t('recordItem.delete'),
          confirmType: 'danger',
        },
      });
    },

    async onConfirmDialogConfirm() {
      if (!(this as any)._isAlive()) return;
      const id = this.data.info?.id;
      if (!id) return;
      (this as any)._deleting = true;
      const cancelToken = createCancelToken();
      (this as any)._cancelToken = cancelToken;
      (this as any)._safeSetData({ 'confirmDialog.visible': false, isTouchLeft: false });
      try {
        await request.del('/diary/details', {
          params: { id },
          cancelToken: (this as any)._cancelToken,
        }, true);
        if (!(this as any)._isAlive()) return;
        this.triggerEvent('del', { id });
      } catch (error: any) {
        if (!(this as any)._isAlive() || error?.message === 'request:abort') return;
        wx.showToast({ title: getErrorMessage(error, (this as any).$t('recordItem.deleteFail')), icon: 'none' });
      } finally {
        (this as any)._deleting = false;
        if ((this as any)._cancelToken === cancelToken) {
          (this as any)._cancelToken = null;
        }
      }
    },

    onConfirmDialogCancel() {
      (this as any)._safeSetData({ 'confirmDialog.visible': false });
    },

    openLocation() {
      const data = this.data.data || {};
      const lat = data.diaryLat;
      const lon = data.diaryLon;
      const address = data.diaryAddress || '';
      if (!address || lat == null || lon == null || lat === '' || lon === '' || Number.isNaN(Number(lat)) || Number.isNaN(Number(lon))) return;
      wx.openLocation({
        latitude: Number(lat),
        longitude: Number(lon),
        name: address,
        address: data.detailAddr || address,
        fail: () => wx.showToast({ title: (this as any).$t('recordItem.openMapFail'), icon: 'none' }),
      });
    },
  },
});
