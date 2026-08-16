-- name: CreateDiaryEntry :one
INSERT INTO diary_entries (
    id, diary_id, created_by, text, lat, lon, address, detail_address,
    record_time, sort, color, created_at, updated_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now(), now())
RETURNING *;

-- name: CreateAutoRecordEntry :exec
INSERT INTO diary_entries (
    id, diary_id, created_by, text, lat, lon, address, detail_address,
    record_time, sort, color, created_at, updated_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now(), now())
ON CONFLICT (id) DO NOTHING;

-- name: GetDiaryEntry :one
SELECT * FROM diary_entries WHERE id = $1;

-- name: UpdateDiaryEntry :execrows
UPDATE diary_entries SET
    text = $2,
    lat = $3,
    lon = $4,
    address = $5,
    detail_address = $6,
    record_time = $7,
    sort = $8,
    color = $9,
    updated_at = now()
WHERE id = $1;

-- name: CreateDiaryEntryImage :exec
INSERT INTO diary_entry_images (id, diary_entry_id, file_id, sort_order, created_at)
VALUES ($1, $2, $3, $4, now());

-- name: BatchCreateDiaryEntryImages :exec
INSERT INTO diary_entry_images (id, diary_entry_id, file_id, sort_order, created_at)
SELECT unnest(@ids::text[]), @diary_entry_id, unnest(@file_ids::text[]), unnest(@sort_orders::int[]), now();
-- name: DeleteDiaryEntryImages :exec
DELETE FROM diary_entry_images WHERE diary_entry_id = $1;

-- name: ListDiaryEntryImages :many
SELECT file_id FROM diary_entry_images
WHERE diary_entry_id = $1
ORDER BY sort_order ASC, created_at ASC;

-- name: ListDiaryEntryImagePaths :many
SELECT dei.file_id, f.path, f.storage_type
FROM diary_entry_images dei
JOIN files f ON f.id = dei.file_id
WHERE dei.diary_entry_id = $1
ORDER BY dei.sort_order ASC, dei.created_at ASC;

-- name: ListDiaryEntryImagePathsByEntryIDs :many
SELECT dei.diary_entry_id, dei.file_id, f.path, f.storage_type
FROM diary_entry_images dei
JOIN files f ON f.id = dei.file_id
WHERE dei.diary_entry_id = ANY($1::text[])
ORDER BY dei.diary_entry_id, dei.sort_order ASC, dei.created_at ASC;

-- name: ListDiaryEntryImageFileIDsByDiaryID :many
SELECT DISTINCT dei.file_id
FROM diary_entry_images dei
JOIN diary_entries de ON de.id = dei.diary_entry_id
WHERE de.diary_id = $1;

-- name: DeleteDiaryEntryImagesReturningFileIDs :many
-- 先删图片关联并返回 file_id，再由调用方在同一事务内删除条目。
-- 拆成两条语句，避免数据修改 CTE 顺序不可预测导致 file_id 漏返回。
DELETE FROM diary_entry_images WHERE diary_entry_id = $1
RETURNING file_id;

-- name: DeleteDiaryEntryByID :exec
DELETE FROM diary_entries WHERE id = $1;

-- name: GetUserLastAutoEntry :one
SELECT id, address, detail_address
FROM diary_entries
WHERE created_by = $1
  AND text = '（自动记录）'
ORDER BY record_time DESC NULLS LAST
LIMIT 1;

-- name: GetUserLastAutoEntryByDate :one
SELECT e.id, e.address, e.detail_address
FROM diary_entries e
JOIN diaries d ON d.id = e.diary_id
WHERE e.created_by = $1
  AND e.text = '（自动记录）'
  AND d.record_date = $2
ORDER BY e.record_time DESC NULLS LAST
LIMIT 1;

