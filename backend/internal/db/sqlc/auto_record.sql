-- name: InsertTrajectories :exec
INSERT INTO auto_record_trajectories (id, user_id, lat, lon, recorded_at, geocode_attempts, created_at)
SELECT unnest(@ids::text[]), unnest(@user_ids::text[]), unnest(@lats::text[])::numeric, unnest(@lons::text[])::numeric, unnest(@recorded_ats::timestamptz[]), 0, now();

-- name: ListTrajectoriesByUser :many
SELECT id, user_id, lat, lon, recorded_at, geocode_attempts, created_at FROM auto_record_trajectories
WHERE user_id = $1
ORDER BY recorded_at ASC
LIMIT $2;

-- name: DeleteTrajectories :exec
DELETE FROM auto_record_trajectories WHERE id = ANY($1::text[]);

-- name: DeleteStaleTrajectories :execrows
DELETE FROM auto_record_trajectories
WHERE id IN (
    SELECT id FROM auto_record_trajectories
    WHERE created_at < now() - interval '7 days'
    ORDER BY id ASC
    LIMIT $1::bigint
);

-- name: ListPendingAutoRecordUsers :many
SELECT u.id AS user_id
FROM users u
JOIN user_vips v ON v.user_id = u.id
WHERE u.auto_record_enabled = true
  AND v.expire_time > now() - interval '3 days'
  AND EXISTS (
    SELECT 1 FROM auto_record_trajectories t
    WHERE t.user_id = u.id
  )
ORDER BY (
  SELECT COUNT(*) FROM auto_record_trajectories t WHERE t.user_id = u.id
) DESC
LIMIT $1;

-- name: ListAbnormalAlertCandidates :many
SELECT u.id, u.unionid, u.abnormal_subscribe_accepted
FROM users u
JOIN user_vips v ON v.user_id = u.id
LEFT JOIN LATERAL (
    SELECT MAX(t.recorded_at) AS last_recorded_at
    FROM auto_record_trajectories t
    WHERE t.user_id = u.id
) lt ON true
WHERE u.auto_record_enabled = true
  AND v.expire_time > now() - interval '3 days'
  AND (
      u.abnormal_alert_sent_at IS NULL
      OR u.abnormal_alert_sent_at < now() - interval '1 hour'
  )
  AND (
      u.last_active_at IS NULL
      OR u.last_active_at < $1::timestamptz
  )
  AND COALESCE(lt.last_recorded_at, '1970-01-01'::timestamptz) < $1::timestamptz
  AND (
      u.abnormal_subscribe_accepted = true
      OR EXISTS (SELECT 1 FROM wx_mp_accounts mp WHERE mp.user_id = u.id AND mp.subscribed = true)
  )
LIMIT $2::bigint;

-- name: IncrementTrajectoryGeocodeAttempts :exec
UPDATE auto_record_trajectories
SET geocode_attempts = geocode_attempts + 1
WHERE id = ANY($1::text[]);
