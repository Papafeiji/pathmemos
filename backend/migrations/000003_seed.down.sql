-- 警告：仅限全新环境回滚。有业务数据时执行会删除种子 VIP 与默认配置。
DELETE FROM vips WHERE id IN ('vip-trial-0001', 'vip-free-0001', 'vip-month-0001', 'vip-year-0001');
DELETE FROM sys_configs WHERE id = 'default';
