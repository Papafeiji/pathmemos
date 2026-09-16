-- name: CreateAPIKey :one
INSERT INTO api_keys (id, user_id, key_hash, api_key, expires_at, created_at)
VALUES ($1, $2, $3, $4, $5, now())
ON CONFLICT (user_id) DO NOTHING
RETURNING id, user_id, key_hash, api_key, expires_at, created_at;

-- name: GetAPIKeyByHash :one
SELECT id, user_id, key_hash, api_key, expires_at, created_at FROM api_keys WHERE key_hash = $1;

-- name: GetAPIKeyByUser :one
SELECT id, user_id, key_hash, api_key, expires_at, created_at FROM api_keys WHERE user_id = $1;

-- name: DeleteAPIKeyByUser :exec
DELETE FROM api_keys WHERE user_id = $1;

-- name: DeleteExpiredAPIKeys :execrows
-- PPJ-J05：当前产品要求 API Key 永不过期（mcp/apiKeyNeverExpires=9999-12-31），本查询暂无调用；
-- 保留作为未来「Key 可过期」能力的预留，接线时挂到后台清理任务即可。
DELETE FROM api_keys
WHERE id IN (
    SELECT id FROM api_keys
    WHERE expires_at < now()
    ORDER BY id ASC
    LIMIT $1::bigint
);

