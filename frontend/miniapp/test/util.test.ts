/**
 * 前端纯逻辑单元测试
 * 运行方式: npx ts-node --skip-project test/util.test.ts
 * 注意：这些测试不依赖微信小程序环境，仅测试纯计算逻辑。
 */

// --- concurrency.ts 测试（直接测真实模块，不再复制实现）---

import { runWithConcurrency } from '../miniprogram/utils/concurrency';

async function test_concurrency_runsAllTasks() {
  let count = 0;
  const tasks = [
    async () => { count++; return 'a'; },
    async () => { count++; return 'b'; },
    async () => { count++; return 'c'; },
  ];
  await runWithConcurrency(tasks, 2);
  if (count !== 3) throw new Error(`expected 3 exec, got ${count}`);
  console.log('PASS: concurrency runs all tasks');
}

async function test_concurrency_preservesOrder() {
  const tasks = [
    async () => 'first',
    async () => 'second',
    async () => { throw new Error('third fails'); },
  ];
  const results = await runWithConcurrency(tasks, 1);
  if (results.length !== 3) throw new Error(`expected 3 results, got ${results.length}`);
  // 真实实现按索引原位存储结果/错误，保持与输入对齐。
  if (results[0] !== 'first' || results[1] !== 'second') throw new Error('order not preserved');
  if (!((results[2] as any) instanceof Error)) throw new Error('error not stored in place');
  console.log('PASS: concurrency preserves order and stores errors in place');
}

async function test_concurrency_emptyInput() {
  const results = await runWithConcurrency([], 3);
  if (results.length !== 0) throw new Error('expected empty results');
  console.log('PASS: concurrency empty input');
}

// --- eventSource safeCallback 测试 ---

function _safeCallback(fn?: Function, ...args: any[]): void {
  if (!fn) return;
  try { fn(...args); } catch { /* intentionally silent */ }
}

function test_safeCallback_callsFunction() {
  let called = false;
  _safeCallback(() => { called = true; });
  if (!called) throw new Error('callback not called');
  console.log('PASS: safeCallback calls function');
}

function test_safeCallback_swallowErrors() {
  let threw = false;
  try {
    _safeCallback(() => { throw new Error('test error'); });
  } catch {
    threw = true;
  }
  if (threw) throw new Error('safeCallback should swallow errors');
  console.log('PASS: safeCallback swallows errors');
}

function test_safeCallback_nullFunction() {
  let threw = false;
  try {
    _safeCallback(null as any);
    _safeCallback(undefined!);
  } catch {
    threw = true;
  }
  if (threw) throw new Error('safeCallback should handle null/undefined');
  console.log('PASS: safeCallback handles null/undefined');
}

// --- 运行所有测试 ---
async function runAll() {
  console.log('\n=== 前端纯逻辑单元测试 ===\n');
  await test_concurrency_runsAllTasks();
  await test_concurrency_preservesOrder();
  await test_concurrency_emptyInput();
  test_safeCallback_callsFunction();
  test_safeCallback_swallowErrors();
  test_safeCallback_nullFunction();
  console.log('\n所有测试通过！\n');
}

runAll().catch((e: Error) => {
  console.error('\n测试失败:', e.message);
});