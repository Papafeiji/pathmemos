import { themeManager, Theme } from '../utils/theme';

export default Behavior({
  behaviors: [],
  data: {
    theme: themeManager.getTheme(),
  },
  lifetimes: {
    attached() {
      const self = this as any;
      self._unsubscribeTheme = themeManager.onChange((theme: Theme) => {
        // 主题是全局状态；使用 _safeSetData 写入，页面/组件在隐藏态时会把变更暂存，
        // 返回前台后通过 _applyPendingSetData 统一刷新，避免在隐藏态直接写 setData。
        self._safeSetData({ theme });
      });
    },
    detached() {
      const self = this as any;
      if (self._unsubscribeTheme) {
        self._unsubscribeTheme();
        self._unsubscribeTheme = null;
      }
    },
  },
  methods: {
    unsubscribeTheme() {
      const self = this as any;
      if (self._unsubscribeTheme) {
        self._unsubscribeTheme();
        self._unsubscribeTheme = null;
      }
    },
  },
});
