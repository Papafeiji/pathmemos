-- name: DeleteUserCommonAddresses :exec
DELETE FROM user_common_addresses WHERE user_id = $1;

-- name: InsertUserCommonAddresses :exec
INSERT INTO user_common_addresses (user_id, name, lat, lon, count, updated_at)
SELECT unnest(@user_ids::text[]),
       unnest(@names::text[]),
       unnest(@lats::numeric[]),
       unnest(@lons::numeric[]),
       unnest(@counts::int[]),
       now();

-- name: ListUserCommonAddresses :many
SELECT name, lat, lon, count
FROM user_common_addresses
WHERE user_id = $1
ORDER BY count DESC, updated_at DESC
LIMIT 10;

-- name: GetUserCommonAddress :one
SELECT name, lat, lon, count
FROM user_common_addresses
WHERE user_id = $1 AND name = $2;

-- name: RenameUserCommonAddress :exec
UPDATE user_common_addresses
SET name = $3, updated_at = now()
WHERE user_id = $1 AND name = $2;

-- name: MergeUserCommonAddress :exec
WITH deleted AS (
    DELETE FROM user_common_addresses AS uca_del
    WHERE uca_del.user_id = $1 AND uca_del.name = $2
    RETURNING count
)
UPDATE user_common_addresses AS uca
SET count = uca.count + COALESCE((SELECT d.count FROM deleted AS d), 0),
    updated_at = now()
WHERE uca.user_id = $1 AND uca.name = $3;

-- name: UpdateDiaryEntriesAddress :execrows
UPDATE diary_entries AS de
SET address = $3, updated_at = now()
WHERE de.created_by = $1 AND de.address = $2;

-- name: UpdateDiaryEntriesAddressBatch :execrows
UPDATE diary_entries AS de
SET address = $4, updated_at = now()
WHERE de.id IN (
    SELECT de_inner.id FROM diary_entries AS de_inner
    WHERE de_inner.created_by = $1 AND de_inner.address = $2
    ORDER BY de_inner.id ASC
    LIMIT $3
);

-- name: GetLatestCoordinateByAddress :one
SELECT de.lat, de.lon
FROM diary_entries AS de
WHERE de.created_by = $1 AND de.address = $2
ORDER BY de.created_at DESC
LIMIT 1;

-- name: ListTopAddressesByUser :many
SELECT de.address AS name, COUNT(*) AS count
FROM diary_entries AS de
WHERE de.created_by = $1 AND de.address IS NOT NULL AND de.address <> ''
GROUP BY de.address
ORDER BY COUNT(*) DESC, MAX(de.created_at) DESC
LIMIT $2;

-- name: ListUsersWithDiaryChangesSince :many
SELECT DISTINCT de.created_by
FROM diary_entries AS de
WHERE de.updated_at >= $1 AND de.updated_at < $2;

-- name: NeedsCommonAddressRefresh :one
SELECT
  COALESCE(de_max.ts, '1970-01-01'::timestamptz) > COALESCE(ca_max.ts, '1970-01-01'::timestamptz)
  OR (ca_max.ts IS NOT NULL AND de_max.ts IS NULL) AS needs_refresh
FROM (SELECT MAX(updated_at) AS ts FROM user_common_addresses WHERE user_id = $1) ca_max
CROSS JOIN (SELECT MAX(updated_at) AS ts FROM diary_entries WHERE created_by = $1) de_max;
