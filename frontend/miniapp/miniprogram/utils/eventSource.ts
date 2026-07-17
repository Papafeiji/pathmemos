import '../polyfills/textDecoder';
import { logger } from './logger';
import { i18n } from './i18n';

function _byteLength(str: string): number {
  let len = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c <= 0x7f) {
      len += 1;
    } else if (c <= 0x7ff) {
      len += 2;
    } else if (c >= 0xd800 && c <= 0xdbff) {
      // surrogate pair
      len += 4;
      i++;
    } else {
      len += 3;
    }
  }
  return len;
}

const _safeCallback = (fn?: Function, ...args: any[]) => {
  if (!fn) return;
  try { fn(...args); } catch (e) { logger.error('[eventSource] callback error', e); }
};

interface EventSourceParams {
  url: string;
  method?: string;
  header?: Record<string, string>;
  data?: any;
  onopen?: () => void;
  onmessage?: (data: any) => void;
  onclose?: () => void;
  onerror?: (err: Error) => void;
}

export function eventSource(params: EventSourceParams) {
  const { url, method = 'POST', header = {}, data = {}, onopen, onmessage, onclose, onerror } = params;
  if (!url) {
    throw new Error(i18n.t('error.urlEmpty'));
  }

  let aborted = false;
  let ended = false;
  let errorFired = false;
  let buffer = '';
  const decoder = new TextDecoder('utf-8');
  const MAX_BUFFER_SIZE = 64 * 1024; // 64KB，与服务端 SSE 消息体大小限制对齐

  const requestTask = wx.request({
    url,
    method: method as WechatMiniprogram.RequestOption['method'],
    data,
    header,
    enableChunked: true,
    responseType: 'arraybuffer',
    timeout: 200000,
    success() {
      if (aborted) return;
      ended = true;
      const tail = decoder.decode(new ArrayBuffer(0), { stream: false });
      if (tail) {
        buffer += tail;
      }
      if (buffer.trim()) processBuffer();
      _safeCallback(onclose);
      cleanupListeners();
    },
    fail(err: any) {
      if (aborted) return;
      logger.error('[eventSource] wx.request fail', err);
      errorFired = true;
      _safeCallback(onerror, new Error(err?.errMsg || i18n.t('error.networkFail')));
      abort();
    },
  });

  const onHeadersReceived = (res: any) => {
    if (aborted) return;
    if (res.statusCode === 200) {
      _safeCallback(onopen);
    } else {
      errorFired = true;
      abort();
      _safeCallback(onerror, new Error(`HTTP ${res.statusCode}`));
    }
  };

  const onChunkReceived = (res: any) => {
    if (aborted) return;
    buffer += decoder.decode(res.data || new ArrayBuffer(0), { stream: true });
    if (_byteLength(buffer) > MAX_BUFFER_SIZE) {
      logger.error('[eventSource] SSE buffer exceeded max size');
      errorFired = true;
      abort();
      _safeCallback(onerror, new Error('SSE buffer exceeded max size'));
      return;
    }
    processBuffer();
  };

  requestTask.onHeadersReceived(onHeadersReceived);
  requestTask.onChunkReceived(onChunkReceived);

  function processBuffer() {
    let idx;
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const raw = buffer.substring(0, idx).trim();
      buffer = buffer.substring(idx + 2);
      processMessage(raw);
    }
  }

  function processMessage(raw: string) {
    if (!raw) return;
    const lines = raw.split('\n');
    let eventName = '';
    const dataLines: string[] = [];
    for (const line of lines) {
      const t = line.trim();
      if (t.startsWith('event:')) {
        eventName = t.substring(6).trim();
      } else if (t.startsWith('data:')) {
        // SSE 规范：data: 后可选一个前导空格应被忽略；保留其余原样内容。
        let dataValue = t.substring(5);
        if (dataValue.startsWith(' ')) {
          dataValue = dataValue.substring(1);
        }
        dataLines.push(dataValue);
      }
    }
    const dataText = dataLines.join('\n');
    if (eventName === 'error') {
      let error = new Error(dataText || i18n.t('error.aiServiceError'));
      try {
        const parsed = JSON.parse(dataText);
        if (parsed && parsed.bizCode) {
          (error as any).bizCode = parsed.bizCode;
        }
        if (parsed && parsed.message) {
          error.message = parsed.message;
        }
      } catch {
        
      }
      errorFired = true;
      _safeCallback(onerror, error);
      abort();
      return;
    }
    if (onmessage) {
      _safeCallback(onmessage, { data: dataText, done: eventName === 'done' });
    }
  }

  function cleanupListeners() {
    requestTask.offHeadersReceived(onHeadersReceived);
    requestTask.offChunkReceived(onChunkReceived);
  }

  function abort() {
    if (aborted || ended) return;
    aborted = true;
    cleanupListeners();
    try {
      requestTask.abort();
    } catch (e) {
      logger.warn('[eventSource] requestTask.abort error', e);
    }
    // 外部/生命周期调用 abort() 时不会触发 success/fail 回调，需要在这里触发 onclose，
    // 让调用方（如 AIDrawer）在 SSE 被强制中止时能正确复位发送锁等状态。
    // 错误路径已设置 errorFired 并调用 onerror，避免 onclose/onerror 双发。
    if (!errorFired && onclose) {
      _safeCallback(onclose);
    }
  }

  return { abort };
}
