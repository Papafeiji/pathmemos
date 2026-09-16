/**
 * Jest 全局环境初始化：为小程序业务代码提供最小可用的全局 `wx` mock。
 *
 * 目标：
 * - 让 `import` 小程序模块时模块加载期调用的 wx 能力（getAccountInfoSync 等）不崩溃；
 * - 提供内存态 storage（getStorageSync/setStorageSync/removeStorageSync），
 *   让 config.getBaseURL / storage / http / i18n 等纯逻辑可在 Node 下运行。
 *
 * 不做真机能力模拟：request/uploadFile 等由各测试自行覆写并断言入参。
 */
import { beforeEach, jest } from '@jest/globals';

const storage = new Map<string, any>();

export function resetWxStorage(): void {
  storage.clear();
}

type WxMock = Record<string, any>;

const wxMock: WxMock = {
  // --- storage（内存实现，缺失 key 与真机一致返回空串）---
  getStorageSync(key: string) {
    return storage.has(key) ? storage.get(key) : '';
  },
  setStorageSync(key: string, value: any) {
    storage.set(key, value);
  },
  removeStorageSync(key: string) {
    storage.delete(key);
  },
  clearStorageSync() {
    storage.clear();
  },

  // --- 环境信息（模块加载期读取，默认 release）---
  getAccountInfoSync() {
    return { miniProgram: { appId: 'wxtest', envVersion: 'release' } };
  },
  getAppBaseInfo() {
    return { language: 'zh_CN' };
  },

  // --- 交互类：测试可覆写/断言 ---
  showToast: jest.fn(),
  hideToast: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  showModal: jest.fn(),
  reLaunch: jest.fn(),
  setNavigationBarTitle: jest.fn(),

  // --- 网络类：默认仅占位，具体用例覆写 ---
  request: jest.fn(),
  uploadFile: jest.fn(),

  // --- 文件类：仅保证 import 不崩溃 ---
  compressImage: jest.fn(),
  getFileSystemManager: jest.fn(() => ({ getFileInfo: jest.fn() })),
};

(globalThis as any).wx = wxMock;
// http.ts 的页面态守卫依赖该全局函数。
(globalThis as any).getCurrentPages = () => [];

// 组件/行为定义捕获：供组件级测试取出 Component 定义，并以伪实例调用 methods。
// 组件模块在加载期调用全局 Component()/Behavior()，这里收集定义、行为原样返回。
const componentDefs: any[] = [];
(globalThis as any).__componentDefs = componentDefs;
(globalThis as any).Component = (def: any) => {
  componentDefs.push(def);
  return def;
};
(globalThis as any).Page = (def: any) => {
  componentDefs.push(def);
  return def;
};
(globalThis as any).Behavior = (def: any) => def;

beforeEach(() => {
  resetWxStorage();
});
