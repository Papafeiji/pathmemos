# 历史迁移归档（仅备查，不参与自动迁移）

本目录存放 2026-08 迁移 squash 前的历史迁移文件（000003~000019，共 17 对 up/down）。
它们的 **up 内容已全部并入当前 backend/migrations/000001_baseline.up.sql**，
因此 deploy.sh 与 golang-migrate **不会**加载本目录——仅作为回滚排查参考保留。

## 为什么存在

迁移 squash 后，migrate goto <旧版本> 会因对应版本文件缺失而失败。
需要回滚到 squash 前的 schema 时，正确路径是：

1. 恢复 squash 前的数据库备份（deploy.sh 在检测到旧迁移版本时会自动 pg_dump 到服务器 backups/ 目录）；
2. 若确需按旧版本逐条 down，可参考本目录中的 down.sql 手动执行（注意顺序：从最高版本号往低版本号执行，且 000001_baseline 的 down 是整 schema DROP，勿在新库执行）。

## 维护约定

- 本目录文件只在归档后修正记录错误时修改，禁止新增迁移；
- 新迁移一律放在 backend/migrations/，从当前最大版本号 +1 开始编号。
