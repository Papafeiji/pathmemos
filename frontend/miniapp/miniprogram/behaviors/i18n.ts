import { i18n, Locale, LocaleMessages } from '../utils/i18n';
import safeSetDataBehavior from './safeSetData';

type FlatMessages = Record<string, string>;

function flatten(obj: LocaleMessages, prefix = '', res: FlatMessages = {}): FlatMessages {
  Object.keys(obj).forEach((key) => {
    const value = (obj as Record<string, any>)[key];
    // 数组不拍平：WXML 中不会直接绑定数组，JS 里通过 i18n.t() 直接取原数组使用。
    // 拍平数组会变成超长逗号字符串，浪费每个组件的 setData 内存和传输。
    if (Array.isArray(value)) {
      return;
    }
    if (value && typeof value === 'object') {
      flatten(value, `${prefix}${key}.`, res);
    } else {
      res[`${prefix}${key}`] = String(value);
    }
  });
  return res;
}

export default Behavior({
  behaviors: [safeSetDataBehavior],
  data: {
    _locale: 'zh' as Locale,
    _i18n: flatten(i18n.getMessages()) as FlatMessages,
  },
  lifetimes: {
    attached(this: any) {
      this._syncLocale();
      this._unsubscribeI18n = i18n.onChange(() => {
        this._syncLocale();
        this._updateNavTitle();
        if (typeof this.onLocaleChange === 'function') {
          this.onLocaleChange();
        }
      });
    },
    detached(this: any) {
      if (this._unsubscribeI18n) {
        this._unsubscribeI18n();
        this._unsubscribeI18n = null;
      }
    },
  },
  pageLifetimes: {
    show(this: any) {
      if (this.data._locale !== i18n.getLocale()) {
        this._syncLocale();
        this._updateNavTitle();
        if (typeof this.onLocaleChange === 'function') {
          this.onLocaleChange();
        }
      }
    },
  },
  methods: {
    _syncLocale(this: any) {
      this._safeSetData({
        _locale: i18n.getLocale(),
        _i18n: flatten(i18n.getMessages()),
      });
    },
    _updateNavTitle(this: any) {
      if (typeof this.updateNavTitle === 'function') {
        this.updateNavTitle();
      }
    },
    $t(this: any, key: string, args?: Record<string, string | number>): string {
      return i18n.t(key, args);
    },
  },
});
