# 代码审查问题清单（第四轮 · 2026-08-16）

> **本文件已清理**：第四轮发现的全部可修复项（spec 缺陷 P0/P1、代码 P1 3 项、P2 16 项、前端 spec 偏差 6 项）均已修复并部署，逐项明细不再保留（留档于 git 历史）。
> **剩余未修项**已并入 `docs/CODE_REVIEW_ISSUES.md`（第 1–4 轮汇总），请以该文件为准。

第四轮覆盖范围与结论（已全部完成）：

- spec 质量：审查 AGENTS.md + docs/ 全部规范文档（ARCHITECTURE/mcp-worker-ops/CODE_REVIEW_ISSUES/audits 21 份 + AUDIT_RECORDS + TEST_CASES）。
- spec-代码一致性：交叉核对存量代码按规范开发，无偏差残留。
- 逐文件代码审查：后端 12 模块 + 前端 3 模块 + 双 Worker + 运维，约 5.7 万行。
- 全部改动通过：go build / go test / golangci-lint（0 issues）/ check-sqlc-sync / 小程序 lint / 双 Worker typecheck。

第四轮中「记录待同步」的 P2/P3 文档项（data-layer/ai/autorecord-location/file/family-invite/user/CODE_REVIEW_ISSUES/AUDIT_RECORDS/mcp-worker-ops）均已在 docs 提交中同步完成。
