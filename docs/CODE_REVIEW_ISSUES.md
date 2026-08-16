# 代码审查遗留问题清单（第 1–4 轮汇总 · 2026-08-16 终态）

> 经过四轮全量审查，所有可修复项均已修复并部署上线（生产镜像 `papafeiji-app:3663f1f2`，main 已收敛）。
> **本文件只保留「未修复且有明确理由」的剩余项**，已完成内容不再罗列（留档于 git 历史与 docs/audits/ 各模块审计文档）。
> 第 3、4 轮的逐项已修复明细已从问题清单中移除，见 `docs/CODE_REVIEW_ISSUES_3.md` 与 `docs/CODE_REVIEW_ISSUES_4.md`（仅保留索引指针）。

## 剩余项总览

| 类别 | 数量 | 性质 |
|------|------|------|
| 业务需要·不修（用户确认） | 3 | 产品权衡，刻意保留 |
| 安全低概率项（容忍 hacker） | 4 | 正常流程不受影响 |
| 性能优化（非核心，允许等待） | 4 | 已有有界兜底或低频路径 |
| 记录不修（风险核算后决定） | 6 | 改造成本/风险高于收益 |
| 低价值/边缘 P3 | 2 | worth=no 或罕见边缘 |
| 依赖安全告警 | 25 | 均在构建链，上游无修复版 |
| 工具/基础设施 | 2 | 现环境无需求或信息性 |
| 既定设计决策 | 13 | 审计文档记录在案，非缺陷 |

---

## 一、业务需要·不修（3 条，用户确认）

| ID | 内容 | 理由 |
|----|------|------|
| B6b-02 | wechatsecrets 固定盐可逆密文（源码公开即等效公开 AppSecret） | 开源版需要内置 AppSecret，机制为业务需要 |
| B2-04 | api_keys 明文存储（DB 泄露即全量密钥泄露） | 用户需随时查看自己的 Key，无法只存 hash |
| B5-10 | MCP API Key 明文 | 同上（B2-04 在 MCP 模块的实例化） |

## 二、安全低概率项（容忍 hacker，4 条）

| 位置 | 内容 | 理由 |
|------|------|------|
| api-worker | 重定向带自定义头 | 低概率，正常流程不受影响 |
| mcp-worker | /auth 绑定 token 在 URL | 历史业务取舍 |
| nginx | /uploads 无鉴权（安全边界 = UUID 不可枚举） | 公有 URL 安全边界 |
| compose | Redis 密码进 command | 低概率 |

## 三、性能优化（非核心，允许等待，4 条）

| 位置 | 内容 | 现状 |
|------|------|------|
| middleware/ratelimit.go | 稳态 O(N) 扫描 | 已有 maxEvictPerPass 有界兜底 |
| middleware/session.go | 登录清理循环 | Lua 每轮 cap 50 条 |
| wxmp | access_token 无 singleflight | 低频 |
| wxmp/handler.go | 未绑定用户每消息同步 FetchUserInfo（resolveUser 步骤2） | 已绑定用户已走 1h 节流的 refreshMPAccountAsync |

## 四、记录不修（风险核算后决定，6 条）

| ID | 内容 | 理由 |
|----|------|------|
| R2-L12 | 种子 fileBaseUrl 硬编码 SaaS 域名，开源版新环境需按部署覆盖 | SaaS 生产依赖该值；开源版按 README.open 配置 |
| R2-L13 | 订阅 templateId 被忽略，多模板会互相覆盖 | 产品当前仅单一订阅模板 |
| R2-L14 | 主连接池 statement_timeout=30s | 耗时任务走 NewBackgroundPool 豁免 |
| R2-L15 | /health 叠加 30 次/分 IP 限流 | 实际探测频率远低于阈值 |
| R2-T04 | 前端 test/ 无 jest 运行器 | 配置与 TS6 兼容的 jest 链成本高收益低 |
| B1-06 | 完整退款功能未实现 | refundDailyQuota 已接 AI 空流退款；用户主动退款功能仍无 |

## 五、低价值/边缘 P3（2 条）

| 项 | 内容 | 理由 |
|----|------|------|
| P3 worth=no | 多处死代码、日志噪音、错误文案、mask 字节切片等 | 简单优先，收益极低 |
| bootstrap | OPEN_API_KEY flush 非幂等 | 罕见边缘（仅种子阶段多实例并发时） |

## 六、依赖安全告警（25 条：0 critical / 9 high / 6 moderate / 10 low）

全部位于 miniprogram-ci 的开发/CI 构建链，**不进入用户运行时**（前端运行时 audit 0 漏洞）；无可用修复版或升级会破坏构建（less/uuid/brace-expansion 已实测）。GitHub dependabot 另报 39 条（口径更宽，同一根因）。

- gulp-plumber / gulp-util / gulp-ignore / gulp-match：停维护，无修复版
- lodash ≤4.17.23、lodash.template ≤4.5.0：无修复版；模板均为静态串
- html-minifier@4.0.0、image-size：最新版即受影响；仅处理项目自身资源
- less：修复版 exports 移除 miniprogram-ci 深引用路径（实测破坏构建）
- uuid：11.x 移除 uuid/v4 深路径导出（实测破坏构建）
- brace-expansion：minimatch 3 与 10 的 API 形态互斥，无单一兼容版本
- request / phin / file-type / @jimp：修复版 ESM-only 或破坏 jimp 压缩选项
- minimatch / miniprogram-ci：随上述子项的元数据条目
- eslint 及其依赖链（devDependency，收益低）

**长期方案**：等 miniprogram-ci 收敛遗留依赖（babel6/gulp3/request），或替换上传工具链。

## 七、工具/基础设施（2 条）

| 项 | 内容 | 理由 |
|----|------|------|
| GOARCH | migrate 二进制硬编码 linux/amd64 | 当前生产为 amd64，跨架构需时再改 |
| audit-patterns.sh | 恒 exit 0 | 信息性审计脚本，门禁语义已在 AGENTS.md 注明 |

## 八、既定设计决策（13 条，审计文档记录在案，非缺陷）

| 决策 | 记录位置 |
|------|---------|
| 文件清理引用检查自洽（邀请码 6 天 < 删除窗口 7 天） | audits/backend/file.md |
| 孤儿文件 7 天清理兜底 | audits/backend/file.md |
| 公有 URL 安全边界 = UUID 不可枚举 | audits/backend/file.md |
| 腾讯令牌桶单实例前提（多实例需 Redis 共享） | audits/backend/pkg.md |
| 跨午夜 cluster 归次日为产品语义 | audits/backend/autorecord-location.md |
| 定位 Redis 故障 fail-closed 保核心库 | audits/backend/autorecord-location.md |
| 读路径异步刷新日级去重 | audits/backend/diary.md |
| MCP 超大结果不写缓存 | audits/backend/mcp.md |
| X-Forwarded-Host 非安全边界 | audits/backend/http-layer.md |
| 错误码体系历史包袱与新代码规范 | audits/backend/http-layer.md |
| OPEN_API_KEY env 仅种子、DB 为权威 | audits/open-source.md |
| autoRecord UTC 落库前后端约定 | audits/frontend/frontend-infra.md |
| SSE 无自动重连（会话重建自愈） | audits/frontend/frontend-infra.md |

---

## 附：已决策项（用户确认，不再列为遗留）

- **AI 配额 Redis 闸门 fail-open / DB 权威兜底**——用户确认采用「DB 兜底」：Redis 前置闸门异常时降级放行直查 DB，DB 每日配额（`WHERE used<quota` 原子条件扣减）为权威来源（代码注释 + audits/backend/ai.md AI15 已落地）。
- **家庭 invite-link owner 加入 = 整家合并**——by-design（owner 加入别人家庭会解散自己的源家庭，整家并入），已在 `family/service.go` 加注释标注。

## 附：时间线（一句话）

第一轮 197 条 → 修复 114 + 合并迁移 + P1/P2/P3 共 57 条实现；第二轮 277 文件逐行审查 46 条 → 修复 41、记录 6；第三轮 P1 7 项 + P2 16 项 + P3 15 项全部落地；第四轮 P0/P1/P2 全部落地（含 spec-代码一致性）。所有分支已收敛至 main（`3663f1f2`）。详细过程见 git 历史与 docs/audits/。
