# 架构不变量（Architecture Invariants）

> 版本：V2.0｜状态：定稿（以当前代码为唯一事实源）。
> 本文件记录当前架构必须遵守的**不变量**：PostgreSQL 为唯一事实来源、Redis 为辅助，配置全部来自环境变量。

## 1. 总体架构

```
微信小程序 / 公众号 / MCP 客户端
        │
      Nginx
        │
   Go API(:8080) + SSE(:8081)
   Auth / User / Family / Diary / File / Location / AI / VIP / Payment / MCP
        │
   ┌────┴─────┐
PostgreSQL   Redis（辅助）
唯一事实来源  缓存 / 限流 / 少量辅助锁 / 临时状态
        │
   Go ticker 后台任务（自动记录 / 关单 / 日志清理 / 轨迹清理 / 孤儿文件清理）
```

## 2. 架构不变量（不可违背）

> 仲裁基线：**核心业务正确性 > 性能优化**——缓存、锁、限流、去重标记等加速手段不得凌驾于 DB 正确性（本表 I1/I2 的总纲，适用于一切实现取舍）。

| # | 不变量 | 含义 |
|---|--------|------|
| I1 | **PostgreSQL 是唯一事实来源** | 业务正确性的最终依据只能是 DB（事务 / 唯一约束 / 状态机）；Redis 与进程内缓存不得成为最终状态 |
| I2 | **Redis 故障不导致数据错误** | Redis 仅保存 Session、缓存、限流计数、临时状态等非业务事实；不可用时最多导致性能下降、限流暂时失效、缓存/辅助功能降级，不得造成数据丢失、重复支付、重复业务写入 |
| I3 | **身份与归属只由服务端裁决** | 用户身份取自 session（Redis）；客户端传入的 userId / familyId / diaryId / fileId 等仅为参数，不得作为权限依据；资源归属一律按当前身份（context）+ DB 关系校验（规则清单见 `spec/03-api.md` §5） |
| I4 | **家庭数据按当前成员关系校验** | 共享视图与访问校验以 `current_family_id` 的当前成员为准；`diaries` / `diary_entries` 不存 `family_id` |
| I5 | **支付以可信回调 + DB 幂等为最终依据** | 支付成功以微信验签回调为准；`out_trade_no` 唯一 + 订单状态机在 DB 内保证只发一次货；Redis 仅辅助 |
| I6 | **后台任务必须幂等** | 任务重复执行、重启、锁丢失都不得产生重复数据；游标/去重键是优化，不是正确性前提 |
| I7 | **AI 上下文中的日记内容是不可信数据** | 用户日记文本只能作为数据拼入 prompt，不得被当作系统指令执行；可测断言见 02f AI-5「不可信数据」条 |
| I8 | **文件公开访问是产品设计** | 图片使用 UUID 定名 + 公开 URL；知道 URL 即可访问，不引入签名 URL / 鉴权代理 |
| I9 | **注销联动遵循 DB 约束 + 业务事务** | 结构性联动由 `ON DELETE CASCADE/SET NULL` 负责；业务性联动由事务负责；物理文件异步清理 |
| I10 | **错误响应词汇统一** | `code` 固定枚举（0000/4000/4010/4030/4040/4090/4130/4290/5001），语义码一律 `biz_code`，同一 biz_code 全端点同一 HTTP 状态。**例外**：SSE 端点（`/ai/chat`）HTTP 恒 200，错误经 `event: error` 事件体下发，biz_code→HTTP 映射仅作用于事件体内的 `code` 字段（ADR-0008；词汇表见 `spec/03-api.md` §3） |
| I11 | **锁不是正确性来源** | PG advisory lock / Redis SETNX 只减少并发重复执行；最终正确性由 DB 事务、唯一约束、状态条件更新保证（锁清单见 §5；配合 I1/I6） |

## 3. 模块取舍

**保留**：用户 / 家庭 / 日记 / 文件 / 自动轨迹 / Location / AI SSE / VIP / 虚拟支付 / MCP / PostgreSQL / Redis（辅助）/ Go ticker 后台任务 / Nginx + 本地文件公开访问。

**删除**：`sys_configs`（配置中心化过度设计，配置全部改环境变量）。

**说明（纠正审查前提）**：
- **不存在 Admin HTTP 模块**：仓库只有 `backend/cmd/admin`（一次性 CLI，按手机号删用户，由 `deploy/delete-user.sh` 调用）。该 CLI 体量极小且被运维使用，**保留**；不涉及任何后台路由/中间件/配置热更新。
- **不存在 JWT**：鉴权为服务端 session（Redis），无 token、无本地撤销缓存。
- **推送（push）是现有功能**（异常告警 / 新地点提醒 / 客服消息），并非废弃残留；是否下线属产品决策，不在本次架构收敛范围内。

## 4. 关键架构决策

| 决策 | 说明 |
|------|------|
| 不设独立 Admin 后台 | 仅保留 `cmd/admin` 运维 CLI（按手机号删用户），无 HTTP 管理接口 |
| 配置全部走环境变量 | 删除 `sys_configs` 表与 `default_diary_config` |
| Redis 为辅助组件 | 仅会话 / 缓存 / 限流 / 配额预检 / 临时幂等；见 I1、I2 |
| 分布式锁改用 PostgreSQL | `db.AdvisoryLock`（会话级 advisory lock）替代 Redis 锁 |
| Health 拆分 | `/health/live`（进程）+ `/health/ready`（DB）；Redis 上报但不判死 |
| 推送能力保留 | 异常告警 / 新地点提醒 / 客服消息为在用功能 |
| 生产回滚策略 | expand → 兼容旧代码 → contract；不以 `migrate down` 为常规手段 |
| AI 日志保留 90 天 | 仅按时间清理，无每用户条数上限 |
| VIP 判定一律严格 | `expire_time > now()`；**宽限期概念全面删除**（含 `vipGraceDays`、异常告警候选 SQL） |
| `WORKER_SECRET` 生产必填 | `DEPLOYMENT_MODE=saas` 时启动校验（空则拒绝启动）；open 模式必须留空 |
| 客户端日志保留 30 天 | 新增 `cleanup_client_ops_logs` 后台任务（后台任务总数 10，含 2026-09 新增的 `purge_deleted_objects`，ADR-0013） |
| `user_vip_claims` 保留 | trial / free 领取防重（`INSERT` + `EXISTS`） |

## 5. 配置来源

删除 `sys_configs` 后，配置全部来自环境变量或代码常量：

| 原 sys_configs 字段 | 现来源 |
|---------------------|----------|
| `ai_config.baseUrl` | `AI_BASE_URL` |
| `ai_config.model` | `AI_MODEL` |
| `ai_config.maxOutputTokens` | `AI_MAX_OUTPUT_TOKENS` |
| `ai_config.thinking.type` | `AI_THINKING_TYPE` |
| `ai_prompt` | `AI_PROMPT`（代码内默认值，可环境变量覆盖） |
| `sys_config.wechatMpPrompt` | `WECHAT_MP_PROMPT` |
| `sys_config.defaultCoverImage` / `defaultAvatarUrl` / `defaultTrajectoryIcon` | 环境变量 `DEFAULT_COVER_IMAGE` / `DEFAULT_AVATAR_URL` / `DEFAULT_TRAJECTORY_ICON` |
| 文件对外基址（原 `sys_config.fileBaseUrl`） | `STORAGE_PUBLIC_BASE_URL`，空则回退 `OSS_PUBLIC_URL` |
| `default_diary_config` | 删除（未被使用） |

> 迁移 `000006_drop_sys_configs` 已删除该表；`config.go` 为纯环境变量；`deploy.sh` 不再刷新 `sys_configs`。

## 6. 验收标准

除 `go build ./...` 外，至少通过：`go test ./...`、`go vet ./...`、`make lint-go`、前端 `make lint-frontend && make test-frontend`、Worker typecheck+test、`make check-sqlc-sync`。

关键业务场景（**人工验收**，见 `docs/spec/07-acceptance-flows.md` 的场景编号）：

| 域 | 必测 | flow |
|----|------|------|
| 用户 | 登录 / 重复登录 / 注销 / 注销后旧 session 失效 | F1 / F9 |
| 家庭 | 创建 / 加入 / 退出 / 移除 / 解散 / owner 迁移 / 用户注销 | F5 |
| 日记 | 创建 / 修改 / 删除 / 跨家庭访问拒绝 / 图片关联 / 日期聚合 | F2 / F4 |
| 文件 | 正常上传 / 超 10MB / 超 50MB / 非法类型 / 删除 / 重复引用 | F11 |
| AI | 正常 SSE / 客户端断开 / 上游超时 / 上游错误 / 超上下文上限 | F7 |
| 支付 | 正常回调 / 重复回调 / 错误签名 / 订单关闭后回调 / 用户注销后回调 | F6 |
| 自动记录 | 重复执行 / 任务重启 / 轨迹点重复 / 逆地理失败 | F3 |
| MCP | Key 生成/查询/轮换；经 Worker 读写日记/回忆；源站内部端点拒绝公网直连 | F8 |
| 私有化接入 | Worker 注册握手、按 API Key 路由、错误码 | F12 |
| 不变量 | Redis 宕机不影响 DB 正确性（限流失效、缓存降级）；后台任务重复执行不产生重复数据 | 人工破坏性演练（07 无常规场景，需要时临时执行） |

## 7. 架构边界

- 后台任务：Go ticker + 幂等 + PostgreSQL advisory lock 互斥，未使用外部任务队列 / 调度服务。
- 文件：UUID 定名 + 公开 URL；未使用签名 URL / 鉴权代理。
- MCP：一用户一 API Key + 基础工具；未引入多 Key / OAuth / scope。
- 缓存：Redis 单层；未使用进程内二级缓存。

## 8. 分布式锁（PostgreSQL advisory lock）

Redis 只保留 **会话 / 缓存 / 限流 / 配额预检 / 临时幂等辅助**；分布式锁已全部迁到 PostgreSQL。

实现：`backend/internal/db/advisory_lock.go` 的 `db.AdvisoryLock` 使用 PostgreSQL **会话级 advisory lock**（`pg_try_advisory_lock(hashtextextended(key, 0))`；持锁占用一个连接，进程退出即自动释放）。服务层通过 `db.Locker` 接口注入，单元测试仍可用 Redis 版 `db.Lock`。

| 锁键 | 位置 | 现方案 |
|------|------|--------|
| `lock:family:{familyID}` | `family/service.go` | `db.AdvisoryLock` + `uq_family_members_user_id` 唯一约束兜底 |
| `lock:delete_account:{userID}` | `family/service.go` | `db.AdvisoryLock` |
| `lock:auto_record:{userID}` | `autorecord/service.go`、`diary/service.go` | `db.AdvisoryLock` + 轨迹唯一索引 / `UpsertDiary` 幂等兜底 |
| `lock:covers:{familyID}:{date}` | `diary/service.go` | `db.AdvisoryLock`（短临界区） |
| `lock:background:{task}`（10 个） | `jobs/runner.go` | `db.AdvisoryLock`；任务自身幂等 |
| `invite:qrcode:gen:{userID}` | `invite/qrcode.go` | `db.AdvisoryLock` |

> 说明：advisory lock 无 TTL（连接断开自动释放），`Locker` 接口不含 TTL/续期语义；正确性仍以 DB 唯一约束/事务/幂等为最终依据（见 I1/I6/I11）。
>
> 另：`lock:covers:refresh:{familyID}:{date}` 为 Redis SETNX 30s **去重节流标记**（非互斥锁，保留在 Redis；故障仅失去节流，符合 I2），封面互斥由 `lock:covers:{familyID}:{date}` advisory lock 承担。
