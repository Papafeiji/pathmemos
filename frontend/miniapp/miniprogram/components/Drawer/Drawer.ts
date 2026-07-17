
import { getSystemInfo } from '../../utils/util';
import transition from '../../behaviors/transition';
import i18nBehavior from '../../behaviors/i18n';

Component({
  behaviors: [transition, i18nBehavior],

  properties: {
    initMainHeight: String,
    scrollIntoId: String,
    noScroll: {
      type: Boolean,
      value: false,
    },
  },


  data: {
    bottomSafeHeight: '0',
    mainHeight: '0',
    mainStyle: '',
    transition: true,
    scrollTop: 0,
    scrollIntoView: '',
  },

  observers: {
    scrollIntoId: function (id) {
      if (id) {
        (this as any)._safeSetData({ scrollIntoView: id });
      }
    },
  },


  lifetimes: {
    attached: function () {
      const info = getSystemInfo();
      const { bottomSafeHeight } = info;
      const safeHeight = info.windowHeight || info.safeArea?.height || 0;
      (this as any)._safeAreaHeight = safeHeight;
      const height = this.data.initMainHeight || `${Math.floor(safeHeight * 0.8)}px`;
      const style = this.data.noScroll
        ? `min-height:${height};padding-bottom:${bottomSafeHeight}px;`
        : `height:${height};padding-bottom:${bottomSafeHeight}px;`;
      (this as any)._safeSetData({
        mainHeight: height,
        mainStyle: style,
        bottomSafeHeight: `${bottomSafeHeight}px`,
      });
      (this as any)._initTransition('_attachedTimer');
    },
  },


  methods: {
    handletouchmove: function (event: { touches: { pageY: any }[] }) {
      if (!(this as any)._isAlive()) return;
      const now = Date.now();
      if ((this as any)._lastTouchMoveAt && now - (this as any)._lastTouchMoveAt < 16) return;
      (this as any)._lastTouchMoveAt = now;
      const sysInfo = getSystemInfo();
      const safeAreaHeight = (this as any)._safeAreaHeight || sysInfo.windowHeight || sysInfo.safeArea?.height || 0;
      let pageY = event.touches[0].pageY;
      if (safeAreaHeight && pageY > safeAreaHeight - 100) {
        this.handMask();
        return;
      }
      pageY = Math.max(100, Math.min((safeAreaHeight || pageY) - 50, pageY));
      (this as any)._safeSetData({ mainHeight: `calc(100vh - ${pageY}px)` });
    },
    handMask: function () {
      if (!(this as any)._isAlive()) return;
      (this as any)._safeSetData({ mainHeight: '0' });
      (this as any)._triggerMaskTransition();
    },
    
    handMain: function () {},
    onScroll: function (e: any) {
      
      const detail = e.detail || {};
      if ((detail.deltaY || 0) < -20) {
        this.triggerEvent('scrollup');
      }
    },
    setScrollIntoView: function (id: string) {
      (this as any)._safeSetData({ scrollIntoView: '' }, () => {
        wx.nextTick(() => {
          (this as any)._safeSetData({ scrollIntoView: id });
        });
      });
    },

    scrollToBottom: function () {
      const query = this.createSelectorQuery();
      query.select('.Drawer .scrollarea').boundingClientRect();
      query.select('.Drawer .scrollarea-main').boundingClientRect();
      query.exec((res) => {
        if (!(this as any)._isAlive()) return;
        const scrollViewHeight = res[0]?.height ?? 0;
        const scrollContentHeight = res[1]?.height ?? 0;
        if (scrollContentHeight > scrollViewHeight) {
          (this as any)._safeSetData({ scrollTop: scrollContentHeight - scrollViewHeight + 100 });
        }
      });
    },
  },
});
