-- name: ListUserMcpEntries :many
SELECT
    d.record_date,
    COALESCE(NULLIF(TRIM(u.nickname), ''), '家人')::text AS nickname,
    COALESCE(de.record_time, de.created_at) AS record_at,
    COALESCE(NULLIF(TRIM(de.address), ''), NULLIF(TRIM(de.detail_address), ''), '')::text AS location,
    COALESCE(NULLIF(TRIM(de.text), ''), '')::text AS text
FROM diary_entries de
JOIN diaries d ON d.id = de.diary_id
JOIN users u ON u.id = de.created_by
WHERE d.user_id = $1
  AND d.record_date >= $2::date
  AND d.record_date <= $3::date
ORDER BY d.record_date DESC, record_at DESC
LIMIT $4;
