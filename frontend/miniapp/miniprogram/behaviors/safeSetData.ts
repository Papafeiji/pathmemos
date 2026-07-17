
export default Behavior({
  lifetimes: {
    attached(this: any) {
      this._isDestroyed = false;
      this._isDetached = false;
      this._isHidden = false;
      this._applyPendingSetData();
    },
    // detached 只标记组件已从节点树移除；_isDestroyed 由组件/页面自身的 onUnload/detached 设置，
    // 避免 behavior detached 先于组件自身 detached 执行时，组件内的 _forceSetData 被跳过。
    detached(this: any) {
      this._isDetached = true;
      this._pendingSetData = null;
    },
  },
  pageLifetimes: {
    hide(this: any) {
      this._isHidden = true;
    },
    show(this: any) {
      this._isHidden = false;
      // 切后台/杀进程返回后，把隐藏期间暂存的数据一次性 flush 到视图，
      // 避免 _safeSetData 在隐藏期间被跳过导致 stale UI（AGENTS.md §3.4/§3.6）。
      this._applyPendingSetData();
    },
  },
  methods: {
    _isAlive(this: any) {
      // _isDestroyed 必须显式为 false（页面通常显式初始化），避免 behavior attached 之前字段为 undefined 时误判为存活；
      // _isDetached/_isHidden 只要没有被显式标为 true 即视为存活，兼容 Page 行为不会设置 _isDetached 的场景。
      return this._isDestroyed === false && this._isDetached !== true && this._isHidden !== true;
    },
    _applyPendingSetData(this: any) {
      const pending = this._pendingSetData;
      if (!pending) return;
      this._pendingSetData = null;
      this.setData(pending);
    },
    _safeSetData(this: any, data: any, callback?: () => void) {
      // 已销毁实例不会再 flush，直接丢弃，避免无意义内存占用。
      if (this._isDestroyed === true) {
        return;
      }
      if (!this._isAlive()) {
        // After detached, no more flush will happen; discard to avoid orphan memory.
        if (this._isDetached === true) {
          return;
        }
        // 部分基础库下 property observer 可能在 attached 之前触发，此时先把数据暂存，
        // 等 attached 生命周期完成后再统一写入，避免首次渲染被静默跳过。
        if (!this._pendingSetData) {
          this._pendingSetData = {};
        }
        Object.assign(this._pendingSetData, data);
        return;
      }
      this.setData(data, callback);
    },
    // 用于 onHide/onUnload/detached 中必须持久化的状态清理；豁免 _isHidden 检查，
    // 但已销毁/已脱离视图树时 setData 必抛异常，必须短路返回（5.4 L011）。
    _forceSetData(this: any, data: any, callback?: () => void) {
      if (this._isDestroyed === true || this._isDetached === true) {
        return;
      }
      this.setData(data, callback);
    },
  },
});
