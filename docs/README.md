# 文档索引（AI 协作者导航入口）

> 本目录是 papafeiji-saas 的**制度性框架**：spec、规范、决策记录集中在这里。
> 开发契约与多 Agent 机制见仓库根目录 `AGENTS.md`；本目录是契约引用的细则。
> 本目录只保留**当前终态**制品：所有规格以当前代码为唯一事实源。
## 按任务类型定位

| 我要做什么 | 先读 |
|---|---|
| 任何开发任务的**第一步** | 仓库根目录 `AGENTS.md`（契约 + spec-first 硬约束） |
| **新增/变更功能** | [`spec-standards.md`](spec-standards.md)（九层制品/DoD/七节点闭环）→ 对应层文件（§一 映射表） |
| **开发/部署流程** | [`spec/05-development-plan.md`](spec/05-development-plan.md)（协作节奏/deploy.sh 契约） |
| **看业务目标与边界** | [`spec/01-product-overview.md`](spec/01-product-overview.md)（L1） |
| **了解业务主流程** | [`BUSINESS-FLOWS.md`](BUSINESS-FLOWS.md)（人类可读主流程）→ [`spec/07-acceptance-flows.md`](spec/07-acceptance-flows.md)（人工验收清单） |
| **改某业务域** | [`spec/02b-diary.md`](spec/02b-diary.md) 等（领域分册）→ [`spec/03-api.md`](spec/03-api.md) / [`spec/04-database.md`](spec/04-database.md) |
| **写/改小程序页面** | [`spec/06-miniapp-pages.md`](spec/06-miniapp-pages.md) |
| **跑/扩展验收** | [`spec/07-acceptance-flows.md`](spec/07-acceptance-flows.md)（人工验收清单） |
| **排查线上问题** | [`ARCHITECTURE.md`](ARCHITECTURE.md) + [`DEPLOYMENT.md`](DEPLOYMENT.md) + [`mcp-worker-ops.md`](mcp-worker-ops.md) |
| **做架构取舍/技术选型** | [`decisions/README.md`](decisions/README.md)（ADR：先看有没有既有决策） |
| **看架构不变量** | [`ARCHITECTURE-INVARIANTS.md`](ARCHITECTURE-INVARIANTS.md)（不变量 / 模块取舍 / 验收标准） |
| **审 PR / 审改动** | [`spec-standards.md`](spec-standards.md) §五 DoD + [`spec/`](spec/) 对应层 |

## 文档分类（教程 vs 参考）

### 参考型（按需查，不要求顺序读）

- **制度/规范**：[`spec-standards.md`](spec-standards.md)（spec 母法）
- **规格（spec，单一事实源）**：[`spec/`](spec/)：01 总览(L1)、02a~02h 领域分册(L2)、03 接口(L3)、04 数据库(L4)、05 开发计划与部署(L5)、06 小程序页面(L6)、07 验收流程(L7)
- **能力索引**：[`CAPABILITIES.md`](CAPABILITIES.md)（L8）
- **决策（ADR）**：[`decisions/`](decisions/)（为什么这么做）
- **架构与运维现状**：[`ARCHITECTURE.md`](ARCHITECTURE.md)、[`ARCHITECTURE-INVARIANTS.md`](ARCHITECTURE-INVARIANTS.md)、[`DEPLOYMENT.md`](DEPLOYMENT.md)、[`mcp-worker-ops.md`](mcp-worker-ops.md)


### 教程型（按顺序做完一件事）

- 暂无。

## 目录结构速览

```
docs/
├─ spec/                       # 功能规格（单一事实源）
│  ├─ 01-product-overview.md   # L1 业务目标/定位/功能范围/验收与测试覆盖
│  ├─ 02a-auth-account.md      # L2 认证与账号
│  ├─ 02b-diary.md             # L2 日记与记录
│  ├─ 02c-autorecord.md        # L2 自动记录/轨迹
│  ├─ 02d-family-invite.md     # L2 家庭/邀请
│  ├─ 02e-vip-payment.md       # L2 VIP/虚拟支付
│  ├─ 02f-ai-chat.md           # L2 AI 对话/公众号
│  ├─ 02g-file-push.md         # L2 文件存储/推送
│  ├─ 02h-mcp-open.md          # L2 MCP/开放接口
│  ├─ 03-api.md                # L3 接口契约
│  ├─ 04-database.md           # L4 数据库 Schema
│  ├─ 05-development-plan.md   # L5 开发计划与部署契约
│  ├─ 06-miniapp-pages.md      # L6 小程序页面
│  └─ 07-acceptance-flows.md   # L7 人工验收清单（场景/期望/异常核对 + 覆盖登记）
├─ decisions/                  # L9 ADR
│  ├─ README.md                # 索引 + 何时写
│  └─ 0000-template.md         # 模板（0001~0010 已接受）
├─ CAPABILITIES.md             # L8 能力索引
├─ spec-standards.md           # spec 母法
├─ ARCHITECTURE.md             # 架构现状
├─ ARCHITECTURE-INVARIANTS.md  # 架构不变量与架构决策
├─ DEPLOYMENT.md               # 部署与运维参考
└─ mcp-worker-ops.md           # Cloudflare Worker 运维
```

## scripts/ 与门禁工具

| 工具 | 用途 | 状态 |
|------|------|------|
| `make lint-go` / `make lint-frontend` / `make lint-worker` | 语言级门禁 | 已有 |
| `make check-sqlc-sync` | sqlc 生成与 SQL 列数一致 | 已有 |
| `scripts/audit-patterns.sh` | 静态审计（信息性） | 已有 |
| `scripts/spec-check.sh` | spec 门禁（§九：制品齐备/migration 配对/ADR 双向/安全红线/变更同步） | 已有 |
| `deploy/deploy.sh` | 分支部署 + 健康门禁 + 失败回滚 + 自动合并 | 已有 |
