export interface LogItem {
  level: 'info' | 'warn' | 'error';
  message: string;
  detail?: any;
  time: string;
}


const MAX_BUFFER_SIZE = 100;
let _buffer: LogItem[] = [];

const _envVersion = ((): string | undefined => {
  try {
    return wx.getAccountInfoSync().miniProgram.envVersion;
  } catch {
    return undefined;
  }
})();

const _isProduction = (): boolean => _envVersion === 'release';


export const sanitizeUrlForLog = (url: string): string => {
  if (typeof url !== 'string') return url;
  const trimmed = url.trim();
  return trimmed.split('?')[0].split('#')[0];
};

export const _pushLog = (level: LogItem['level'], message: string, detail?: any) => {
  const safeMessage = typeof message === 'string' ? sanitizeUrlForLog(message) : message;
  const item: LogItem = {
    level,
    message: safeMessage,
    detail: _isProduction() ? undefined : (detail != null ? detail : undefined),
    time: new Date().toISOString(),
  };

  _buffer.push(item);
  if (_buffer.length > MAX_BUFFER_SIZE) {
    _buffer = _buffer.slice(_buffer.length - MAX_BUFFER_SIZE);
  }
};

export const logger = {
  log(message: string, detail?: any) {
    _pushLog('info', message, detail);
  },
  info(message: string, detail?: any) {
    _pushLog('info', message, detail);
  },
  warn(message: string, detail?: any) {
    _pushLog('warn', message, detail);
  },
  error(message: string, detail?: any) {
    _pushLog('error', message, detail);
  },
};
