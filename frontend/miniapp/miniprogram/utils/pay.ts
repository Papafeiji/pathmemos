import request from './request';
import { logger } from './logger';
import { isIOS } from './util';
import { i18n } from './i18n';
import type { CancelToken } from './http';

const getPayEnv = (): number => {
  try {
    const env = wx.getAccountInfoSync().miniProgram.envVersion;
    
    if (isIOS()) return 0;
    return env === 'develop' || env === 'trial' ? 1 : 0;
  } catch {
    return 0;
  }
};

export const doPay = async (
  commodity: any,
  onVirtualPaySuccess: (outTradeNo: string) => void,
  onPayFail: () => void,
  onOrderCreated?: (outTradeNo: string) => void,
  cancelToken?: CancelToken
): Promise<void> => {
  let data: any;
  try {
    const res = await request.post('/payment/virtual/request', {
      data: {
        vipId: commodity.id,
        env: getPayEnv(),
      },
      cancelToken,
    }, true);
    data = res.data;
  } catch (e: any) {
    logger.error('创建虚拟支付订单失败', e);
    onPayFail && onPayFail();
    throw new Error(e?.message || i18n.t('vip.orderCreateFail'));
  }

  if (!data) {
    onPayFail && onPayFail();
    throw new Error(i18n.t('vip.orderCreateFail'));
  }

  const { signData, paySig, signature, mode, outTradeNo } = data;

  // 支付参数字段是否合法由后端与微信 SDK 保证，前端不再做重复硬校验。
  if (onOrderCreated && outTradeNo) {
    onOrderCreated(outTradeNo);
  }

  await new Promise<void>((resolve, reject) => {
    if (cancelToken?.isCancelled()) {
      reject(new Error('request:abort'));
      return;
    }
    wx.requestVirtualPayment({
      signData,
      paySig,
      signature,
      mode,
      success() {
        // 支付已成功，即使 cancelToken 已被取消也不应视为 abort；
        // 否则可能导致 VIP 状态不刷新（FU09/FU10）。
        resolve();
        try { onVirtualPaySuccess && onVirtualPaySuccess(outTradeNo); } catch {}
      },
      fail(res: any) {
        if (cancelToken?.isCancelled()) {
          reject(new Error('request:abort'));
          return;
        }
        logger.error('虚拟支付失败', res);
        let errMsg = i18n.t('error.payFail');
        if (res.errCode === -15011) {
          errMsg = i18n.t('error.iosTestNotSupported');
        } else if (res.errMsg?.includes('SIG_EMPTY')) {
          errMsg = i18n.t('error.paySigEmpty');
        }
        reject(new Error(errMsg));
      },
    });
  });
};
