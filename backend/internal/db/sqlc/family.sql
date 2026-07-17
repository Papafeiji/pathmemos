-- name: ListFamilyMembers :many
SELECT
    fm.user_id,
    fm.role,
    fm.joined_at,
    u.avatar,
    u.avatar_file_id,
    u.nickname
FROM family_members fm
JOIN users u ON u.id = fm.user_id
WHERE fm.family_id = $1
ORDER BY fm.joined_at ASC, fm.user_id ASC;

-- name: GetFamilyOwner :one
SELECT user_id FROM family_members WHERE family_id = $1 AND role = 'owner';

-- name: IsFamilyMember :one
SELECT EXISTS(SELECT 1 FROM family_members WHERE family_id = $1 AND user_id = $2);

-- name: ListFamilyMemberPersonalFamilies :many
SELECT u.id, u.personal_family_id
FROM family_members fm
JOIN users u ON u.id = fm.user_id
WHERE fm.family_id = $1
ORDER BY fm.user_id ASC;

-- name: DeleteFamilyMembership :exec
DELETE FROM family_members WHERE family_id = $1 AND user_id = $2;

-- name: UpsertFamilyMembership :one
INSERT INTO family_members (id, family_id, user_id, role, joined_at)
VALUES ($1, $2, $3, $4, now())
ON CONFLICT (family_id, user_id) DO UPDATE SET
    role = EXCLUDED.role,
    joined_at = EXCLUDED.joined_at
RETURNING id;

-- name: BatchUpsertFamilyMembership :exec
INSERT INTO family_members (id, family_id, user_id, role, joined_at)
SELECT unnest(@ids::text[]), @family_id, unnest(@user_ids::text[]), 'member', now()
ON CONFLICT (family_id, user_id) DO UPDATE SET
    role = EXCLUDED.role,
    joined_at = EXCLUDED.joined_at;

-- name: BatchUpsertFamilyMembershipOwner :exec
INSERT INTO family_members (id, family_id, user_id, role, joined_at)
SELECT unnest(@ids::text[]), unnest(@family_ids::text[]), unnest(@user_ids::text[]), 'owner', now()
ON CONFLICT (family_id, user_id) DO UPDATE SET
    role = EXCLUDED.role,
    joined_at = EXCLUDED.joined_at;

-- name: DeleteFamilyMembers :exec
DELETE FROM family_members WHERE family_id = $1;

-- name: DeleteFamily :exec
DELETE FROM families WHERE id = $1;

-- name: MigrateFamilyDailyCovers :exec
INSERT INTO family_daily_covers (
    family_id,
    record_date,
    cover_file_id,
    cover_type,
    manual_cover_file_id,
    updated_at
)
SELECT $2 AS family_id, record_date, cover_file_id, cover_type, manual_cover_file_id, updated_at
FROM family_daily_covers src
WHERE src.family_id = $1
  AND src.cover_type != 'default'
ON CONFLICT (family_id, record_date)
DO UPDATE SET
    cover_file_id = EXCLUDED.cover_file_id,
    cover_type = EXCLUDED.cover_type,
    manual_cover_file_id = EXCLUDED.manual_cover_file_id,
    updated_at = EXCLUDED.updated_at
WHERE family_daily_covers.cover_type = 'default';

-- name: MigrateUserDailyCoversToFamily :exec
INSERT INTO family_daily_covers (
    family_id,
    record_date,
    cover_file_id,
    cover_type,
    manual_cover_file_id,
    updated_at
)
SELECT
    $3 AS family_id,
    src.record_date,
    src.cover_file_id,
    src.cover_type,
    src.manual_cover_file_id,
    src.updated_at
FROM family_daily_covers src
JOIN diaries d ON d.user_id = $2 AND d.record_date = src.record_date
WHERE src.family_id = $1
  AND src.cover_type != 'default'
ON CONFLICT (family_id, record_date)
DO UPDATE SET
    cover_file_id = EXCLUDED.cover_file_id,
    cover_type = EXCLUDED.cover_type,
    manual_cover_file_id = EXCLUDED.manual_cover_file_id,
    updated_at = EXCLUDED.updated_at
WHERE family_daily_covers.cover_type = 'default';

-- name: BatchMigrateUsersDailyCoversToPersonal :exec
WITH pairs AS (
    SELECT unnest(@user_ids::text[]) AS user_id, unnest(@personal_family_ids::text[]) AS personal_family_id
)
INSERT INTO family_daily_covers (
    family_id,
    record_date,
    cover_file_id,
    cover_type,
    manual_cover_file_id,
    updated_at
)
SELECT
    p.personal_family_id,
    src.record_date,
    src.cover_file_id,
    src.cover_type,
    src.manual_cover_file_id,
    src.updated_at
FROM family_daily_covers src
JOIN pairs p ON true
JOIN diaries d ON d.user_id = p.user_id AND d.record_date = src.record_date
WHERE src.family_id = @source_family_id
  AND src.cover_type != 'default'
ON CONFLICT (family_id, record_date)
DO UPDATE SET
    cover_file_id = EXCLUDED.cover_file_id,
    cover_type = EXCLUDED.cover_type,
    manual_cover_file_id = EXCLUDED.manual_cover_file_id,
    updated_at = EXCLUDED.updated_at
WHERE family_daily_covers.cover_type = 'default';

-- name: DeleteFamilyDailyCovers :exec
DELETE FROM family_daily_covers WHERE family_id = $1;

-- name: CreateFamily :one
INSERT INTO families (id, is_personal, created_at)
VALUES ($1, $2, now())
RETURNING id;

-- name: GetFamilyByID :one
SELECT id, is_personal, created_at FROM families WHERE id = $1;

-- name: CountFamilyMembers :one
SELECT COUNT(*) FROM family_members WHERE family_id = $1;

-- name: CountFamilyDailyCovers :one
SELECT COUNT(*) FROM family_daily_covers WHERE family_id = $1;

