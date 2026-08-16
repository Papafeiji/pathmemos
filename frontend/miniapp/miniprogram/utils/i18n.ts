import zh from './i18n/locales/zh';
import en from './i18n/locales/en';
import zhHant from './i18n/locales/zh-Hant';

export type Locale = 'zh' | 'en' | 'zh-Hant';
export type LanguageMode = 'auto' | Locale;

const LEGACY_LOCALE_KEY = 'ppfj_locale';
const MODE_KEY = 'ppfj_lang_mode';

const localeMap: Record<string, Locale> = {
  zh: 'zh',
  'zh-CN': 'zh',
  zh_CN: 'zh',
  'zh-TW': 'zh-Hant',
  zh_TW: 'zh-Hant',
  'zh-HK': 'zh-Hant',
  zh_HK: 'zh-Hant',
  'zh-Hant': 'zh-Hant',
  en: 'en',
  'en-US': 'en',
  en_US: 'en',
  'en-GB': 'en',
  en_GB: 'en',
};

export type LocaleMessages = typeof zh;

type MessageValue = string | string[] | { [key: string]: MessageValue };

function getNestedValue(obj: LocaleMessages, key: string): MessageValue | undefined {
  return key.split('.').reduce<MessageValue | undefined>((acc, k) => {
    if (acc && typeof acc === 'object' && !Array.isArray(acc)) {
      return (acc as Record<string, MessageValue>)[k];
    }
    return undefined;
  }, obj);
}

function interpolate(text: string, args: Record<string, string | number>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => {
    const v = args[k];
    return v === undefined || v === null ? '' : String(v);
  });
}

function getSystemLocale(): Locale {
  try {
    const system = (typeof wx.getAppBaseInfo === 'function'
      ? wx.getAppBaseInfo().language
      : 'zh_CN') || 'zh_CN';
    return localeMap[system] || 'zh';
  } catch {
    return 'zh';
  }
}

class I18n {
  private mode: LanguageMode = 'auto';

  private locale: Locale = 'zh';

  private messages: Record<Locale, LocaleMessages> = { zh, en, 'zh-Hant': zhHant };

  private listeners: Array<(locale: Locale) => void> = [];

  init() {
    let mode: LanguageMode | undefined;
    try {
      const raw = wx.getStorageSync(MODE_KEY) as LanguageMode | undefined;
      if (raw === 'auto' || raw === 'zh' || raw === 'en' || raw === 'zh-Hant') {
        mode = raw;
      }
    } catch {
      // ignore storage failure
    }

    // 兼容旧版本：读取 ppfj_locale（手动选择过但未迁移到新模式）
    if (!mode) {
      try {
        const raw = wx.getStorageSync(LEGACY_LOCALE_KEY) as Locale | undefined;
        if (raw === 'zh' || raw === 'en' || raw === 'zh-Hant') {
          mode = raw;
        }
      } catch {
        // ignore storage failure
      }
    }

    this.mode = mode || 'auto';
    this.locale = this._resolveLocale();
  }

  private _resolveLocale(): Locale {
    if (this.mode === 'auto') {
      return getSystemLocale();
    }
    return this.mode;
  }

  getMode(): LanguageMode {
    return this.mode;
  }

  setMode(mode: LanguageMode) {
    if (this.mode === mode) return;
    this.mode = mode;
    const locale = this._resolveLocale();
    // 先持久化 mode：auto+系统中文时手动选"中文"虽 locale 不变，也必须落盘，
    // 否则重启后语言设置回退到 auto。
    try {
      wx.setStorageSync(MODE_KEY, mode);
      wx.removeStorageSync(LEGACY_LOCALE_KEY);
    } catch {
      // ignore storage failure
    }
    if (this.locale === locale) return;
    this.locale = locale;
    this.listeners.forEach((cb) => cb(locale));
  }

  getLocale(): Locale {
    return this.locale;
  }

  getMessages(): LocaleMessages {
    return this.messages[this.locale];
  }

  t(key: string, args?: Record<string, string | number>): string {
    let text = getNestedValue(this.messages[this.locale], key);
    if (text === undefined) {
      text = getNestedValue(this.messages.zh, key);
    }
    if (typeof text !== 'string') return key;
    return args ? interpolate(text, args) : text;
  }

  onChange(fn: (locale: Locale) => void): () => void {
    this.listeners.push(fn);
    return () => {
      const idx = this.listeners.indexOf(fn);
      if (idx > -1) this.listeners.splice(idx, 1);
    };
  }
}

export const i18n = new I18n();
export default i18n;
