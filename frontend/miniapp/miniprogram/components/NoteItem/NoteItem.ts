import request, { createCancelToken } from '../../utils/request';
import { safeDayjs } from '../../utils/util';
import touchSwipe from '../../behaviors/touchSwipe';
import i18nBehavior from '../../behaviors/i18n';
import { i18n } from '../../utils/i18n';

const formatDate = (dateStr: string) => {
  if (!dateStr) return { day: '', month: '', weekDayName: '' };
  const d = safeDayjs(dateStr)?.toDate();
  if (!d || isNaN(d.getTime())) return { day: '', month: '', weekDayName: '' };
  const monthNum = d.getMonth() + 1;
  return {
    day: String(d.getDate()).padStart(2, '0'),
    month: `${monthNum}${i18n.t('noteItem.monthSuffix')}`,
    weekDayName: i18n.t(`noteDetail.weekday${d.getDay()}`),
  };
};



Component({
  behaviors: [touchSwipe, i18nBehavior],

  
  properties: {
    info: Object,
  },

  
  data: {
    data: {} as any,
    dotColor: '#8BC5E5',
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
      (this as any)._isDetached = false;
      (this as any)._isDestroyed = false;
      (this as any)._isHidden = false;
      (this as any)._deleting = false;
      // 防止部分基础库 observer 未在 attached 后触发，导致卡片空白、点击无反应。
      const info = this.data.info;
      if (info) {
        (this as any)._lastInfoId = info.id;
        (this as any)._safeSetData({
          data: this.formatData(info),
          dotColor: info?.dotColor || '#8BC5E5',
          isTouchLeft: false,
        });
      }
    },
    detached(this: any) {
      (this as any)._isDetached = true;
      (this as any)._isDestroyed = true;
      if ((this as any)._cancelToken) {
        try { (this as any)._cancelToken.cancel(); } catch {}
        (this as any)._cancelToken = null;
      }
      // 列表项回收复用时，_deleting/_ignoreNextTap 可能仍停留在 true，导致新项无法删除/点击被忽略。
      (this as any)._deleting = false;
      (this as any)._ignoreNextTap = false;
    },
  },

  pageLifetimes: {
    hide(this: any) {
      // 删除是写操作，不在 page hide 时取消请求；_cancelToken 在 detached / 删除完成时清理。
      // _deleting 是防止重复删除的异步状态标志，也不在 hide 中复位。
      (this as any)._forceSetData({
        'confirmDialog.visible': false,
        isTouchLeft: false,
      });
    },
  },

  observers: {
    info: function (info) {
      // 不在 observer 中前置判断 _isAlive()，由 _safeSetData 统一处理：
      // 隐藏期间暂存到 _pendingSetData，返回前台后 flush；已销毁实例直接丢弃（配合 safeSetData 改造）。
      const isNewRecord = (this as any)._lastInfoId !== info?.id;
      (this as any)._lastInfoId = info?.id;
      const update: any = {
        data: this.formatData(info),
        dotColor: info?.dotColor || '#8BC5E5',
      };
      if (isNewRecord) {
        update.isTouchLeft = false;
      }
      (this as any)._safeSetData(update);
    },
  },

  
  methods: {
    formatData(data: any) {
      if (!data) return { _navigateUrl: '', familyMemberAddressConcatRecords: [] };
      const recordDate = data.recordDate || '';
      const { day, month, weekDayName } = formatDate(recordDate);
      return {
        ...data,
        dateNameFormat: data.dateName ? data.dateName.slice(5) : recordDate.slice(5),
        day,
        month,
        weekDayName,
        _navigateUrl: `/pages/NoteDetail/NoteDetail?baseInfo=${encodeURIComponent(JSON.stringify({
          id: data.id,
          recordDate: data.recordDate,
          dateName: data.dateName,
          coverImg: data.coverImg,
        }))}`,
      };
    },
    
    touchStart: function (e: any) {
      (this as any)._swipeTouchStart(e);
      (this as any)._maxSwipeDeltaX = 0;
      (this as any)._ignoreNextTap = false;
    },
    
    touchMove: function (e: any) {
      if (!this.data.info?.isMyDiaryInfo) {
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
      if (!this.data.info?.isMyDiaryInfo) {
        return;
      }
      (this as any)._swipeTouchEnd(e);
      if (((this as any)._maxSwipeDeltaX || 0) > 30) {
        (this as any)._ignoreNextTap = true;
      }
      (this as any)._maxSwipeDeltaX = 0;
    },
    gotoDetail() {
      if ((this as any)._ignoreNextTap) {
        (this as any)._ignoreNextTap = false;
        return;
      }
      const url = this.data.data?._navigateUrl;
      if (!url) return;
      wx.navigateTo({
        url,
        fail: () => wx.showToast({ title: (this as any).$t('noteItem.navigateFail'), icon: 'none' }),
      });
    },
    del: function () {
      (this as any)._safeSetData({
        confirmDialog: {
          visible: true,
          title: (this as any).$t('noteItem.deleteTitle'),
          content: (this as any).$t('noteItem.deleteContent'),
          cancelText: (this as any).$t('common.cancel'),
          confirmText: (this as any).$t('common.delete'),
          confirmType: 'danger',
        },
      });
    },

    async onConfirmDialogConfirm() {
      if (!(this as any)._isAlive()) return;
      // 按 FP076：日记删除为普通业务，不做函数级防重入锁；重复删除由后端兜底。
      const id = this.data.info?.id;
      if (!id) return;
      (this as any)._deleting = true;
      (this as any)._safeSetData({ 'confirmDialog.visible': false, isTouchLeft: false });
      const cancelToken = createCancelToken();
      (this as any)._cancelToken = cancelToken;
      try {
        await request.del('/diary/info', {
          params: { id },
          cancelToken,
        }, true);
        // 删除成功必须通知父页面刷新，隐藏态下由全局标记保证返回后重新加载。
        (getApp() as any).globalData._needRefreshIndexList = true;
        this.triggerEvent('del', { id });
      } catch (err: any) {
        if (!(this as any)._isAlive()) return;
        if (err?.message === 'request:abort') return;
        wx.showToast({ title: err?.message || (this as any).$t('noteItem.deleteFail'), icon: 'none' });
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
  },
});
