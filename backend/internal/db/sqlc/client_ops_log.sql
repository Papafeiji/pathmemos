-- name: InsertClientOpsLog :one
INSERT INTO client_ops_logs (id, user_id, device, app_version, events, client_sent_at)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id;

-- name: DeleteOldClientOpsLogs :execrows
DELETE FROM client_ops_logs
WHERE id IN (
    SELECT id FROM client_ops_logs
    WHERE created_at < now() - interval '30 days'
    ORDER BY id ASC
    LIMIT $1::bigint
);
