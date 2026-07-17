
export default Behavior({
  behaviors: [],
  data: {
    isTouchLeft: false,
  },
  lifetimes: {
    detached() {
      if ((this as any)._moveThrottleTimer) {
        clearTimeout((this as any)._moveThrottleTimer);
        (this as any)._moveThrottleTimer = null;
      }
    },
  },
  methods: {
    _swipeTouchStart(e: any) {
      (this as any)._startX = e.touches[0].pageX;
      (this as any)._startY = e.touches[0].pageY;
      (this as any)._moveX = (this as any)._startX;
      (this as any)._moveY = (this as any)._startY;
    },
    _swipeTouchMove(e: any) {
      if ((this as any)._moveThrottle) return;
      (this as any)._moveThrottle = true;
      (this as any)._moveThrottleTimer = setTimeout(() => { (this as any)._moveThrottle = false; }, 16);
      (this as any)._moveX = e.touches[0].pageX;
      (this as any)._moveY = e.touches[0].pageY;

      
      const startX = (this as any)._startX ?? (this as any)._moveX;
      const startY = (this as any)._startY ?? (this as any)._moveY;
      const dx = Math.abs((this as any)._moveX - startX);
      const dy = Math.abs((this as any)._moveY - startY);
      if (dx > 30 && dx > dy * 2) {
        e.stopPropagation?.();
      }
    },
    _swipeTouchEnd(e: any) {
      const self = this as any;
      if (self._isDestroyed || self._isDetached) return;
      if (self._startX === undefined) return;
      const startX = self._startX;
      const startY = self._startY ?? 0;

      const endX = e.changedTouches?.[0]?.pageX ?? startX;
      const endY = e.changedTouches?.[0]?.pageY ?? startY;

      if (startX < endX - 100 && Math.abs(startY - endY) < 100) {
        self._safeSetData({ isTouchLeft: false });
      } else if (startX > endX + 100 && Math.abs(startY - endY) < 100) {
        self._safeSetData({ isTouchLeft: true });
      }
      (this as any)._startX = undefined;
      (this as any)._startY = undefined;
      (this as any)._moveX = undefined;
      (this as any)._moveY = undefined;
    },
  },
});
