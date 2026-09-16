/**
 * 前端纯逻辑单元测试（Jest + ts-jest）。
 *
 * 运行方式：`npm test`（在 frontend/miniapp 目录）。
 * 依赖 `test/jest.setup.ts` 注入的全局 wx mock。
 *
 * 说明：原脚本式用例（console + 手动 throw）已等价改写为 jest 断言；
 * 断言语义保持不变，以模块当前实现为准（见 `miniprogram/utils/concurrency.ts`）。
 */

import { describe, expect, it } from '@jest/globals';
import { runWithConcurrency } from '../miniprogram/utils/concurrency';

describe('runWithConcurrency', () => {
  it('执行全部任务', async () => {
    let count = 0;
    const tasks = [
      async () => { count++; return 'a'; },
      async () => { count++; return 'b'; },
      async () => { count++; return 'c'; },
    ];
    await runWithConcurrency(tasks, 2);
    expect(count).toBe(3);
  });

  it('按索引原位保存结果与错误，保持与输入顺序对齐', async () => {
    const tasks = [
      async () => 'first',
      async () => 'second',
      async () => { throw new Error('third fails'); },
    ];
    const results = await runWithConcurrency(tasks, 1);
    expect(results).toHaveLength(3);
    // 真实实现按索引原位存储结果/错误，保持与输入对齐。
    expect(results[0]).toBe('first');
    expect(results[1]).toBe('second');
    expect(results[2]).toBeInstanceOf(Error);
  });

  it('空输入返回空数组', async () => {
    const results = await runWithConcurrency([], 3);
    expect(results).toHaveLength(0);
  });
});

// --- safeCallback 契约（eventSource.ts 内部同名辅助函数的局部复刻）---
// 真实实现的行为覆盖见 test/eventSource.test.ts。
function safeCallback(fn?: Function, ...args: any[]): void {
  if (!fn) return;
  try { fn(...args); } catch { /* intentionally silent */ }
}

describe('safeCallback 辅助函数契约', () => {
  it('调用传入函数', () => {
    let called = false;
    safeCallback(() => { called = true; });
    expect(called).toBe(true);
  });

  it('吞掉被调用函数抛出的错误', () => {
    expect(() => {
      safeCallback(() => { throw new Error('test error'); });
    }).not.toThrow();
  });

  it('容忍 null/undefined', () => {
    expect(() => {
      safeCallback(null as any);
      safeCallback(undefined!);
    }).not.toThrow();
  });
});
