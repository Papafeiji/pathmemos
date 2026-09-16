/**
 * AIDrawer 组件级测试：通过全局 Component 捕获定义，以伪实例调用 methods，
 * 覆盖消息裁剪、输入、发送前校验（空/超长）与弹窗状态等不依赖网络的分支。
 */
import { beforeEach, describe, expect, it } from '@jest/globals';
import '../miniprogram/components/AIDrawer/AIDrawer';

function getAIDrawerDef(): any {
  const defs = (globalThis as any).__componentDefs as any[];
  return defs[defs.length - 1];
}

function makeInstance(def: any): any {
  const ctx: any = {};
  const skip = new Set([
    'methods', 'data', 'behaviors', 'properties', 'lifetimes',
    'pageLifetimes', 'observers', 'options', 'externalClasses',
  ]);
  for (const key of Object.keys(def)) {
    if (!skip.has(key)) ctx[key] = def[key];
  }
  Object.assign(ctx, def.methods);
  ctx.data = JSON.parse(JSON.stringify(def.data || {}));
  ctx.setData = (patch: any) => { Object.assign(ctx.data, patch); };
  ctx._safeSetData = (patch: any) => { Object.assign(ctx.data, patch); };
  ctx.triggerEvent = (name: string) => { ctx.lastEvent = name; };
  ctx.$t = (key: string) => key;
  ctx._isDestroyed = false;
  ctx._isDetached = false;
  ctx._isHidden = false;
  return ctx;
}

describe('AIDrawer 组件逻辑', () => {
  let def: any;
  beforeEach(() => {
    def = getAIDrawerDef();
    expect(def).toBeTruthy();
    expect(def.methods).toBeTruthy();
  });

  it('_trimOldMessages 最多保留 50 条且保留尾部（最新）', () => {
    const ctx = makeInstance(def);
    const list = Array.from({ length: 60 }, (_, i) => ({ txt: String(i) }));
    const out = ctx._trimOldMessages(list);
    expect(out).toHaveLength(50);
    expect(out[0].txt).toBe('10');
    expect(out[49].txt).toBe('59');
  });

  it('_trimOldMessages 不超过上限时原样返回', () => {
    const ctx = makeInstance(def);
    const list = [{ txt: 'a' }, { txt: 'b' }];
    expect(ctx._trimOldMessages(list)).toBe(list);
  });

  it('bindinput 更新 inputValue', () => {
    const ctx = makeInstance(def);
    ctx.bindinput({ detail: { value: '你好' } });
    expect(ctx.data.inputValue).toBe('你好');
  });

  it('sendPrompt 空输入直接返回，不进入发送态', async () => {
    const ctx = makeInstance(def);
    await ctx.sendPrompt('   ');
    expect(ctx._sending).toBe(false);
    expect((globalThis as any).wx.showToast).not.toHaveBeenCalled();
  });

  it('sendPrompt 超过 2500 字符给出提示且不发送（PD-7 上限统一）', async () => {
    const ctx = makeInstance(def);
    await ctx.sendPrompt('x'.repeat(2501));
    expect((globalThis as any).wx.showToast).toHaveBeenCalled();
    expect(ctx._sending).toBe(false);
  });

  it('onQuotaDialogClose 关闭配额弹窗', () => {
    const ctx = makeInstance(def);
    ctx.data.showQuotaDialog = true;
    ctx.onQuotaDialogClose();
    expect(ctx.data.showQuotaDialog).toBe(false);
  });
});
