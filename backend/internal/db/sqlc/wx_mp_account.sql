-- name: GetWxMPAccountByOpenID :one
SELECT id, user_id, mp_openid, unionid, nickname, avatar, subscribed, subscribe_time, last_interact_time, created_at, updated_at
FROM wx_mp_accounts
WHERE mp_openid = $1;

-- name: GetWxMPAccountByUnionID :one
SELECT id, user_id, mp_openid, unionid, nickname, avatar, subscribed, subscribe_time, last_interact_time, created_at, updated_at
FROM wx_mp_accounts
WHERE unionid = $1;

-- name: GetWxMPAccountByUserID :one
SELECT id, user_id, mp_openid, unionid, nickname, avatar, subscribed, subscribe_time, last_interact_time, created_at, updated_at
FROM wx_mp_accounts
WHERE user_id = $1;

-- name: UpsertWxMPAccount :one
INSERT INTO wx_mp_accounts (
    id, user_id, mp_openid, unionid, nickname, avatar, subscribed, subscribe_time, last_interact_time, created_at, updated_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())
ON CONFLICT (mp_openid)
DO UPDATE SET
    user_id = COALESCE(EXCLUDED.user_id, wx_mp_accounts.user_id),
    unionid = EXCLUDED.unionid,
    nickname = EXCLUDED.nickname,
    avatar = EXCLUDED.avatar,
    subscribed = EXCLUDED.subscribed,
    subscribe_time = EXCLUDED.subscribe_time,
    last_interact_time = EXCLUDED.last_interact_time,
    updated_at = now()
RETURNING id, user_id, mp_openid, unionid, nickname, avatar, subscribed, subscribe_time, last_interact_time, created_at, updated_at;

-- name: UpdateWxMPAccountSubscribeStatus :exec
UPDATE wx_mp_accounts
SET subscribed = $2, updated_at = now()
WHERE mp_openid = $1;

-- name: TouchWxMPAccountInteractTime :exec
UPDATE wx_mp_accounts
SET last_interact_time = now(), updated_at = now()
WHERE mp_openid = $1;

-- name: LinkWxMPAccountByUnionID :exec
UPDATE wx_mp_accounts
SET user_id = $2, updated_at = now()
WHERE unionid = $1 AND user_id IS NULL;
