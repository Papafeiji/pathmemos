import { getSystemInfo } from './util';

export type ThemeMode = 'auto' | 'light' | 'dark';
export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'ppfj_theme_mode';

let _mode: ThemeMode = 'auto';
let _currentTheme: Theme = 'light';
const _listeners: Array<(theme: Theme) => void> = [];
let _themeChangeRegistered = false;

function _getSystemTheme(): Theme {
  const info = getSystemInfo();
  return info.theme === 'dark' ? 'dark' : 'light';
}

function _resolveTheme(mode: ThemeMode): Theme {
  if (mode === 'dark') return 'dark';
  if (mode === 'light') return 'light';
  return _getSystemTheme();
}

function _applyTheme(theme: Theme) {
  _currentTheme = theme;
  _listeners.forEach((cb) => cb(theme));
}

export const themeManager = {
  init() {
    try {
      const saved = wx.getStorageSync(STORAGE_KEY) as ThemeMode | undefined;
      if (saved === 'auto' || saved === 'light' || saved === 'dark') {
        _mode = saved;
      }
    } catch {
    }
    _applyTheme(_resolveTheme(_mode));

    if (!_themeChangeRegistered) {
      _themeChangeRegistered = true;
      wx.onThemeChange((res: any) => {
        if (_mode === 'auto') {
          _applyTheme(res.theme === 'dark' ? 'dark' : 'light');
        }
      });
    }
  },

  getMode(): ThemeMode {
    return _mode;
  },

  getTheme(): Theme {
    return _currentTheme;
  },

  setMode(mode: ThemeMode) {
    if (_mode === mode) return;
    _mode = mode;
    try {
      wx.setStorageSync(STORAGE_KEY, mode);
    } catch {
    }
    _applyTheme(_resolveTheme(mode));
  },

  onChange(cb: (theme: Theme) => void): () => void {
    _listeners.push(cb);
    cb(_currentTheme);
    return () => {
      const idx = _listeners.indexOf(cb);
      if (idx > -1) _listeners.splice(idx, 1);
    };
  },
};
