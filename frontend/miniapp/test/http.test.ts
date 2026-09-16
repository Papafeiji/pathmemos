/**
 * miniprogram/utils/http.ts URL 拼接单元测试。
 *
 * 事实源（当前实现 _buildUrl）：
 *   `${getBaseURL()}${url}`，params 中非 null/undefined 的项按 Object.keys 顺序
 *   以 encodeURIComponent 拼接为 ?k=v&k2=v2。
 *
 * 说明：_buildUrl 为模块私有函数，这里通过公开的 get()/post() 拦截
 * wx.request 入参来断言实际 URL，无需为测试导出内部实现（业务代码零改动）。
 */

import { beforeEach, describe, expect, it } from '@jest/globals';
import { get, post } from '../miniprogram/utils/http';

const SAAS_BASE_URL = 'https://pro.papafeiji.cn';

interface CapturedRequest {
  url: string;
  method?: string;
  data?: any;
  header?: Record<string, string>;
}

let captured: CapturedRequest[] = [];

function installRequestMock(): void {
  captured = [];
  const w = (globalThis as any).wx;
  w.request = (opts: any) => {
    captured.push({ url: opts.url, method: opts.method, data: opts.data, header: opts.header });
    if (typeof opts.success === 'function') {
      opts.success({ statusCode: 200, data: { code: '0000', data: {} } });
    }
    return { abort() {}, onHeadersReceived() {}, onChunkReceived() {} };
  };
}

describe('http URL 拼接', () => {
  beforeEach(() => {
    installRequestMock();
  });

  it('相对路径直接拼接 baseURL', async () => {
    await get('/diary/info');
    expect(captured).toHaveLength(1);
    expect(captured[0].url).toBe(SAAS_BASE_URL + '/diary/info');
  });

  it('params 按 key 顺序拼接并做 encodeURIComponent 编码', async () => {
    await get('/diary/info', { params: { count: 10, keyword: 'a b&c=d', q: '中文' } });
    expect(captured[0].url).toBe(
      SAAS_BASE_URL + '/diary/info?count=10&keyword=a%20b%26c%3Dd&q=%E4%B8%AD%E6%96%87'
    );
  });

  it('跳过 null/undefined，保留 0/false/空串等有效值', async () => {
    await get('/x', { params: { a: null, b: undefined, c: 0, d: false, e: '' } });
    expect(captured[0].url).toBe(SAAS_BASE_URL + '/x?c=0&d=false&e=');
  });

  it('params key 同样会被编码', async () => {
    await get('/x', { params: { 'a b': 1, 'k&': 'v=' } });
    expect(captured[0].url).toBe(SAAS_BASE_URL + '/x?a%20b=1&k%26=v%3D');
  });

  it('无 params 时不追加问号', async () => {
    await get('/x', { params: {} });
    expect(captured[0].url).toBe(SAAS_BASE_URL + '/x');
  });

  it('post 同样拼接 params（JSON body 不受影响）', async () => {
    await post('/diary/save', { data: { content: 'hi' }, params: { from: 'list' } });
    expect(captured[0].url).toBe(SAAS_BASE_URL + '/diary/save?from=list');
    expect(captured[0].method).toBe('POST');
    expect(captured[0].data).toEqual({ content: 'hi' });
    expect(captured[0].header?.['content-type']).toBe('application/json');
  });

  it('baseURL 随 backend_mode=private 动态切换（模块级 isDevelop 之外的运行时 storage 判定）', async () => {
    await get('/x');
    expect(captured[0].url).toBe(SAAS_BASE_URL + '/x');
    (globalThis as any).wx.setStorageSync('backend_mode', 'private');
    await get('/x', { params: { p: 1 } });
    expect(captured[1].url).toBe('https://api.pathmemos.com/x?p=1');
  });
});
