/**
 * doPay 失败路径回归（VP-P2-05）：支付失败/取消时 best-effort 调用
 * POST /payment/virtual/cancel，避免订单滞留到 24h。
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('../miniprogram/utils/request', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

import request from '../miniprogram/utils/request';
import { doPay } from '../miniprogram/utils/pay';

const post = request.post as any;

function stubRequestOrder(): void {
  post.mockImplementation((url: string) => {
    if (url === '/payment/virtual/request') {
      return Promise.resolve({
        data: {
          signData: 'sd', paySig: 'ps', signature: 'sig', mode: 'short_series_goods',
          outTradeNo: 'OT-1001',
        },
      });
    }
    return Promise.resolve({});
  });
}

describe('doPay 失败路径', () => {
  beforeEach(() => {
    post.mockReset();
    stubRequestOrder();
  });

  it('收银台 fail 时调用 cancel/outTradeNo 并 reject', async () => {
    (globalThis as any).wx.requestVirtualPayment = (opts: any) => {
      opts.fail({ errMsg: 'user cancel' });
    };

    await expect(doPay({ id: 'vip-month-0001' }, () => {}, () => {})).rejects.toThrow();

    const cancelCalls = post.mock.calls.filter((c: any) => c[0] === '/payment/virtual/cancel');
    expect(cancelCalls).toHaveLength(1);
    expect(cancelCalls[0][1]).toEqual({ data: { outTradeNo: 'OT-1001' } });
  });

  it('cancelToken 已取消时也尽力关单并 reject abort', async () => {
    const { createCancelToken } = jest.requireActual('../miniprogram/utils/http') as any;
    const token = createCancelToken();
    token.cancel();

    await expect(
      doPay({ id: 'vip-month-0001' }, () => {}, () => {}, undefined, token)
    ).rejects.toThrow();

    const cancelCalls = post.mock.calls.filter((c: any) => c[0] === '/payment/virtual/cancel');
    expect(cancelCalls).toHaveLength(1);
  });
});
