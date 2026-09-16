/**
 * miniprogram/utils/eventSource.ts SSE 分帧解析单元测试。
 *
 * 测试手段：覆写 wx.request，取回 eventSource 注册的 onChunkReceived 回调，
 * 直接投喂 ArrayBuffer 分片，断言 onmessage/onerror 的解析结果。
 * 这样可在不改业务代码、不导出内部纯函数的前提下覆盖真实解析逻辑
 * （processBuffer / processMessage / 多字节流式解码 / 缓冲上限）。
 */

import { beforeEach, describe, expect, it } from '@jest/globals';
import { eventSource } from '../miniprogram/utils/eventSource';

interface FakeTask {
  aborted: boolean;
  abort: () => void;
  onHeadersReceived?: (cb: (res: any) => void) => void;
  onChunkReceived?: (cb: (res: any) => void) => void;
  headersCallback?: (res: any) => void;
  chunkCallback?: (res: any) => void;
}

let task: FakeTask;
let lastOptions: any;

function installRequestMock(): void {
  const w = (globalThis as any).wx;
  w.request = (opts: any) => {
    lastOptions = opts;
    const t: FakeTask = {
      aborted: false,
      abort() { t.aborted = true; },
      onHeadersReceived(cb) { t.headersCallback = cb; },
      onChunkReceived(cb) { t.chunkCallback = cb; },
    };
    task = t;
    return t;
  };
}

/** UTF-8 编码为 ArrayBuffer（模拟微信 onChunkReceived 的 res.data）。 */
function ab(s: string): ArrayBuffer {
  const buf = (globalThis as any).Buffer.from(s, 'utf8');
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

function chunk(s: string): void {
  task.chunkCallback!({ data: ab(s) });
}

describe('eventSource SSE 分帧解析', () => {
  beforeEach(() => {
    installRequestMock();
  });

  it('解析单条 data 消息并回调 onmessage(done=false)', () => {
    const messages: any[] = [];
    eventSource({ url: 'https://x/sse', onmessage: (d) => messages.push(d) });
    chunk('data: {"text":"hi"}\n\n');
    expect(messages).toEqual([{ data: '{"text":"hi"}', done: false }]);
  });

  it('同一分片内含多条消息时逐条回调', () => {
    const messages: any[] = [];
    eventSource({ url: 'https://x/sse', onmessage: (d) => messages.push(d) });
    chunk('data: a\n\ndata: b\n\n');
    expect(messages).toEqual([
      { data: 'a', done: false },
      { data: 'b', done: false },
    ]);
  });

  it('跨分片的半截消息正确续接（流式解码）', () => {
    const messages: any[] = [];
    eventSource({ url: 'https://x/sse', onmessage: (d) => messages.push(d) });
    chunk('data: hel');
    expect(messages).toHaveLength(0);
    chunk('lo\n\n');
    expect(messages).toEqual([{ data: 'hello', done: false }]);
  });

  it('兼容 CRLF 分帧', () => {
    const messages: any[] = [];
    eventSource({ url: 'https://x/sse', onmessage: (d) => messages.push(d) });
    chunk('data: crlf\r\n\r\n');
    expect(messages).toEqual([{ data: 'crlf', done: false }]);
  });

  it('event: done 置 done=true', () => {
    const messages: any[] = [];
    eventSource({ url: 'https://x/sse', onmessage: (d) => messages.push(d) });
    chunk('event: done\ndata: [DONE]\n\n');
    expect(messages).toEqual([{ data: '[DONE]', done: true }]);
  });

  it('同消息多条 data 行以换行拼接', () => {
    const messages: any[] = [];
    eventSource({ url: 'https://x/sse', onmessage: (d) => messages.push(d) });
    chunk('data: line1\ndata: line2\n\n');
    expect(messages).toEqual([{ data: 'line1\nline2', done: false }]);
  });

  it('data: 后仅忽略一个前导空格（SSE 规范）', () => {
    const messages: any[] = [];
    eventSource({ url: 'https://x/sse', onmessage: (d) => messages.push(d) });
    chunk('data:  two-spaces\n\n');
    expect(messages).toEqual([{ data: ' two-spaces', done: false }]);
  });

  it('onmessage 抛错被吞掉，不影响后续解析', () => {
    const messages: any[] = [];
    eventSource({
      url: 'https://x/sse',
      onmessage: () => { throw new Error('callback boom'); },
    });
    expect(() => chunk('data: x\n\n')).not.toThrow();
    expect(messages).toHaveLength(0);
  });

  it('event: error 解析 JSON 的 message/bizCode 并终止请求', () => {
    const errors: any[] = [];
    const closes: any[] = [];
    eventSource({
      url: 'https://x/sse',
      onmessage: () => {},
      onerror: (e) => errors.push(e),
      onclose: () => closes.push(1),
    });
    chunk('event: error\ndata: {"code":"4290","biz_code":"E_BAD","message":"boom"}\n\n');
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('boom');
    expect(errors[0].bizCode).toBe('E_BAD');
    expect(task.aborted).toBe(true);
    // 错误路径不应再触发 onclose（避免双发）。
    expect(closes).toHaveLength(0);
  });

  it('缓冲超过 64KB 上限时报错并终止', () => {
    const errors: any[] = [];
    eventSource({ url: 'https://x/sse', onmessage: () => {}, onerror: (e) => errors.push(e) });
    chunk('data: ' + 'x'.repeat(70000) + '\n\n');
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('SSE buffer exceeded max size');
    expect(task.aborted).toBe(true);
  });

  it('onHeadersReceived 200 触发 onopen，非 200 触发 onerror 并终止', () => {
    const opens: any[] = [];
    const errors: any[] = [];
    eventSource({
      url: 'https://x/sse',
      onopen: () => opens.push(1),
      onerror: (e) => errors.push(e),
    });
    task.headersCallback!({ statusCode: 200 });
    expect(opens).toHaveLength(1);
    expect(errors).toHaveLength(0);
    expect(task.aborted).toBe(false);
  });

  it('onHeadersReceived 非 200 触发 onerror 并终止', () => {
    const errors: any[] = [];
    eventSource({ url: 'https://x/sse', onerror: (e) => errors.push(e) });
    task.headersCallback!({ statusCode: 502 });
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('HTTP 502');
    expect(task.aborted).toBe(true);
  });

  it('流正常结束但末条消息缺少空行时仍解析（PPJ-A05 回归）', () => {
    const messages: any[] = [];
    let closed = 0;
    eventSource({ url: 'https://x/sse', onmessage: (d) => messages.push(d), onclose: () => { closed++; } });
    chunk('data: {"text":"tail"}');
    expect(messages).toHaveLength(0);
    lastOptions.success();
    expect(messages).toEqual([{ data: '{"text":"tail"}', done: false }]);
    expect(closed).toBe(1);
  });
});
