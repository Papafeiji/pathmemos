




import { STORAGE_KEY_MODE } from '../utils/storage';

const SAAS_BASE_URL = 'https://pro.papafeiji.cn';
export const WORKER_BASE_URL = 'https://api.pathmemos.com';
const DEV_BASE_URL = 'http://localhost:8080';

const envVersion = (wx as any).getAccountInfoSync().miniProgram.envVersion;
const isDevelop = envVersion === 'develop';

// 阶段二：用户可在设置页切换为 'private'，经 Cloudflare Worker 路由到私有化后端。
// SaaS 版本默认直连源站，避免 Cloudflare Worker 带来的延迟。
export function getBaseURL(): string {
  if (isDevelop) {
    return DEV_BASE_URL;
  }
  try {
    const mode = wx.getStorageSync(STORAGE_KEY_MODE);
    if (mode === 'private') {
      return WORKER_BASE_URL;
    }
  } catch (_err) {
    // ignore
  }
  return SAAS_BASE_URL;
}

export function getSSEBaseURL(): string {
  return getBaseURL();
}




export const OSS_PUBLIC_URL = 'https://ppfj-images.oss-cn-hangzhou.aliyuncs.com';




export const NEW_USER_FREE_VIP_ID = 'vip-free-0001';

export const ABNORMAL_TEMPLATE_ID = 'i7mcEEMDbhYU1oAC1-E0G0xvIBCmTl6f9c3jOq11m3g';

const SAAS_HELP_BASE = 'https://papafeiji.cn';

// 教程/帮助/关注图等静态内容统一托管在 SaaS 站点（papafeiji.cn + 公共 OSS），
// 开源版不单独维护一份，私有模式同样指向 SaaS 地址。
export function getHelpBaseURL(): string {
  return SAAS_HELP_BASE;
}
