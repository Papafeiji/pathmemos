DELETE FROM vips WHERE id IN ('vip-trial-0001', 'vip-free-0001', 'vip-month-0001', 'vip-year-0001');
DELETE FROM sys_configs WHERE id = 'default';
