import { getSystemInfo } from "../../utils/util";
import { themeManager, Theme } from "../../utils/theme";
import i18nBehavior from "../../behaviors/i18n";

Component({
  options: {
    multipleSlots: true, 
  },

  behaviors: [i18nBehavior],
  
  properties: {
    extClass: {
      type: String,
      value: '',
    },
    title: {
      type: String,
      value: '',
      observer(this: any, newVal: any) {
        if (newVal === null || newVal === undefined) {
          (this as any)._safeSetData({ title: '' });
        }
      },
    },
    background: {
      type: String,
      value: '',
    },
    color: {
      type: String,
      value: '',
    },
    back: {
      type: Boolean,
      value: true,
    },
    loading: {
      type: Boolean,
      value: false,
    },
    homeButton: {
      type: Boolean,
      value: false,
    },
    animated: {
      
      type: Boolean,
      value: true,
    },
    show: {
      
      type: Boolean,
      value: true,
      observer: '_showChange',
    },
    
    delta: {
      type: Number,
      value: 1,
    },
    
    fallbackUrl: {
      type: String,
      value: '',
    },
  },
  
  data: {
    displayStyle: '',
    themeColor: '',
  },
  lifetimes: {
    attached() {
      const rect = wx.getMenuButtonBoundingClientRect();
      const info = getSystemInfo()
      const safeAreaTop = Math.max(info.statusBarHeight, info.safeArea.top)
      const isAndroid = info.platform === 'android';
      const isDevtools = info.platform === 'devtools';

      (this as any)._updateThemeColor(themeManager.getTheme());
      (this as any)._unsubscribe = themeManager.onChange((theme: Theme) => {
        (this as any)._updateThemeColor(theme);
      });

      (this as any)._safeSetData({
        ios: !isAndroid,
        innerPaddingRight: `padding-right: ${info.windowWidth - rect.left}px;`,
        leftWidth: `width: ${info.windowWidth - rect.left}px`,
        safeAreaTop:
          isDevtools || isAndroid
            ? `height: calc(var(--height) + ${safeAreaTop}px); padding-top: ${safeAreaTop}px;`
            : ``,
      });
    },
    detached() {
      if ((this as any)._unsubscribe) {
        (this as any)._unsubscribe();
      }
    },
  },
  
  methods: {
    _updateThemeColor(theme: Theme) {
      const isDark = theme === 'dark';
      // 主题色是全局状态；使用 _safeSetData 写入，隐藏态时暂存，返回前台后统一刷新。
      (this as any)._safeSetData({ themeColor: isDark ? '#ffffff' : '#000000' });
    },
    _showChange(show: boolean) {
      const animated = this.data.animated;
      let displayStyle = '';
      if (animated) {
        displayStyle = `opacity: ${show ? '1' : '0'};transition:opacity 0.5s;`;
      } else {
        displayStyle = `display: ${show ? '' : 'none'};`;
      }
      (this as any)._safeSetData({
        displayStyle,
      });
    },
    back() {
      const data = this.data;
      const pages = getCurrentPages();
      const fallbackUrl = data.fallbackUrl || '/pages/index/index';
      
      if (pages.length <= 1) {
        wx.redirectTo({ url: fallbackUrl });
      } else if (data.delta) {
        wx.navigateBack({
          delta: data.delta,
          fail: () => {
            wx.redirectTo({ url: fallbackUrl });
          },
        });
      }
      this.triggerEvent('back', { delta: data.delta }, {});
    },
    home() {
      this.triggerEvent('home');
    }
  },
});
