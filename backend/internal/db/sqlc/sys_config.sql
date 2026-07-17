-- name: GetSysConfig :one
SELECT * FROM sys_configs WHERE id = 'default';

-- name: CountSysConfig :one
SELECT COUNT(*) FROM sys_configs;
