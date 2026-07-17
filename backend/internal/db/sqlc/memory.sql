-- name: CreateMemory :one
INSERT INTO memories (id, user_id, record_time, record_date, title, content, created_at)
VALUES ($1, $2, $3, $4, $5, $6, now())
RETURNING id, user_id, record_time, record_date, title, content, created_at;

-- name: ListMemoriesByDateRange :many
SELECT
    record_time AS created_at,
    title,
    content
FROM memories
WHERE user_id = $1
  AND record_date >= $2::date
  AND record_date <= $3::date
ORDER BY record_time DESC
LIMIT $4;

-- name: ListMemoriesByUserAndDate :many
SELECT id, record_time, title, content, created_at
FROM memories
WHERE user_id = $1
  AND record_date = $2::date
ORDER BY record_time ASC
LIMIT 500;

-- name: UpdateMemory :one
UPDATE memories SET title = $1, content = $2, record_time = $3, record_date = $6
WHERE id = $4 AND user_id = $5
RETURNING id, user_id, record_time, record_date, title, content, created_at;

-- name: GetMemory :one
SELECT id, user_id, record_time, record_date, title, content, created_at
FROM memories WHERE id = $1 AND user_id = $2;

-- name: CountMemoriesByUserAndDate :one
SELECT COUNT(*) FROM memories WHERE user_id = $1 AND record_date = $2::date;

-- name: DeleteMemory :execrows
DELETE FROM memories WHERE id = $1 AND user_id = $2;

-- name: DeleteMemoriesByUserAndDate :execrows
DELETE FROM memories WHERE user_id = $1 AND record_date = $2::date;
