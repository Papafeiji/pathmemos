-- name: CreateUserInvite :one
INSERT INTO user_invites (id, user_id, inviter_id, entry_count, created_at)
VALUES ($1, $2, $3, 0, now())
RETURNING *;

-- name: GetUserInviteByUserID :one
SELECT * FROM user_invites WHERE user_id = $1;

-- name: ListUserInvitesByInviter :many
SELECT ui.user_id, u.nickname, u.avatar,
       (u.current_family_id IS NOT NULL
        AND u.current_family_id != u.personal_family_id
        AND u.current_family_id = inv.current_family_id) AS joined
FROM user_invites ui
JOIN users u ON u.id = ui.user_id
JOIN users inv ON inv.id = ui.inviter_id
WHERE ui.inviter_id = $1
ORDER BY ui.created_at DESC
LIMIT 100;

-- name: MarkInviteeRewarded :execrows
UPDATE user_invites
SET reward_invitee_at = now()
WHERE id = $1 AND reward_invitee_at IS NULL;

-- name: MarkInviterRewarded :execrows
UPDATE user_invites
SET reward_inviter_at = now()
WHERE id = $1 AND reward_inviter_at IS NULL;

-- name: CountInviterMonthlyRewardDays :one
SELECT COALESCE(COUNT(*) * 7, 0)::int AS total_days
FROM user_invites
WHERE inviter_id = $1
  AND reward_inviter_at >= $2
  AND reward_inviter_at < $3;

-- name: LockInviterReward :exec
SELECT pg_advisory_xact_lock(hashtext('inviter_reward:' || $1));

-- name: CreateUserInviteCode :one
INSERT INTO user_invite_codes (user_id, short_code, created_at)
VALUES ($1, $2, now())
RETURNING *;
-- name: GetUserInviteCode :one
SELECT short_code FROM user_invite_codes WHERE user_id = $1;

-- name: ResolveInviterFromCode :one
UPDATE user_invite_codes
SET used_at = now()
WHERE short_code = $1
RETURNING user_id;

-- name: DeleteUserInviteCodeByUserID :exec
DELETE FROM user_invite_codes WHERE user_id = $1;