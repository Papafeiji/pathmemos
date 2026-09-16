# 0005: 分布式锁统一使用 PostgreSQL advisory lock

- 状态：已接受
- 日期：2026-09
- 取代：无

## 背景

全仓库原用 Redis `SET NX` + Lua 安全解锁 + 续期 goroutine 实现分布式锁。TTL 与续期逻辑分散在各模块、进程崩溃后需等 TTL 过期；且与「PostgreSQL 是唯一事实来源」的定位不符——Redis 锁失效时仍需 DB 约束兜底，两套机制并存徒增理解与维护成本。

## 决策

**我决定**：全部分布式锁统一为 `db.AdvisoryLock`（会话级 advisory lock，`pg_try_advisory_lock(hashtextextended(key, 0))`；持锁占用一个连接，连接断开自动释放、无 TTL）。锁键名沿用原 Redis 键名；`StartLockRenewal` 续期机制退役。正确性仍由 DB 唯一约束/事务/幂等兜底，锁仅为并发优化。

## 备选方案

- 保留 Redis 锁：否决——双锁机制并存，TTL/续期/看门狗复杂度没有对应收益。
- 全部改行级锁（`SELECT FOR UPDATE`）：否决——后台任务互斥、封面按「家庭+日期」互斥等场景需要应用级锁键，行级锁表达不了。

## 后果

### 正面

- 单一锁机制，语义统一；连接断开自动释放，无 TTL/续期管理。
- 减少 Redis 依赖面（Redis 故障不再影响互斥语义）。

### 负面 / 代价

- 持锁占用一个 PostgreSQL 连接，后台任务并发度需关注连接池容量。
- advisory lock 无超时：长任务必须自带 `maxDuration` context 约束。
