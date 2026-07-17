-- name: ListActivePaidVIPs :many
SELECT * FROM vips
WHERE is_active = true AND type IN ('month', 'year')
ORDER BY sort ASC
LIMIT 100;

-- name: ListActiveFreeVIPs :many
SELECT * FROM vips
WHERE is_active = true AND type = 'free'
ORDER BY sort ASC
LIMIT 100;

-- name: GetVIPByID :one
SELECT * FROM vips WHERE id = $1;

-- name: UpsertUserVIP :one
INSERT INTO user_vips (id, user_id, begin_time, expire_time, created_at)
VALUES ($1, $2, $3, $4, now())
ON CONFLICT (user_id) DO UPDATE SET
    begin_time = EXCLUDED.begin_time,
    expire_time = EXCLUDED.expire_time
RETURNING *;

-- name: GetUserVIP :one
SELECT * FROM user_vips WHERE user_id = $1;

-- name: GetUserVIPForUpdate :one
SELECT * FROM user_vips WHERE user_id = $1 FOR UPDATE;

-- name: DeleteUserVIP :exec
DELETE FROM user_vips WHERE user_id = $1;

-- name: UpsertVIPClaim :execrows
INSERT INTO user_vip_claims (id, user_id, vip_id, created_at)
VALUES ($1, $2, $3, now())
ON CONFLICT (user_id, vip_id) DO NOTHING;

-- name: HasVIPClaim :one
SELECT EXISTS(SELECT 1 FROM user_vip_claims WHERE user_id = $1 AND vip_id = $2) AS exists;
