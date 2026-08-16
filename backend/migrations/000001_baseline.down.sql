-- Baseline down migration：一次性清空整个数据库，用于全新环境回滚到空库。
-- 该脚本会删除所有业务表及数据，属于基线迁移的固有破坏性回滚；生产环境回滚应使用增量 down 脚本或数据备份恢复，而非直接执行本脚本。
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
