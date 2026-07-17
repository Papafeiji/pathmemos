-- name: CreateOrder :one
INSERT INTO orders (id, user_id, vip_id, out_trade_no, channel, state, amount, prepay_id, created_at, updated_at)
VALUES ($1, $2, $3, $4, 'virtual_pay', 'pending', $5, $6, now(), now())
RETURNING *;

-- name: GetOrderByOutTradeNo :one
SELECT * FROM orders WHERE out_trade_no = $1;

-- name: UpdateOrderPaid :execrows
UPDATE orders SET
    state = 'paid',
    transaction_id = sqlc.arg(transaction_id),
    paid_at = now(),
    updated_at = now()
WHERE out_trade_no = $1 AND state = 'pending';

-- name: CloseOrder :execrows
UPDATE orders SET state = 'closed', updated_at = now() WHERE out_trade_no = $1 AND state = 'pending' AND user_id = $2;

-- name: CloseOrdersBatch :execrows
UPDATE orders
SET state = 'closed', updated_at = now()
WHERE out_trade_no = ANY(sqlc.arg(out_trade_nos)::text[])
  AND user_id = ANY(sqlc.arg(user_ids)::text[])
  AND state = 'pending';

-- name: ClosePendingOrdersByUser :exec
UPDATE orders SET state = 'closed', updated_at = now()
WHERE user_id = $1 AND state = 'pending' AND created_at < now() - interval '5 minutes';

-- name: ClosePendingOrdersByUserAndVIP :exec
UPDATE orders SET state = 'closed', updated_at = now()
WHERE user_id = $1 AND vip_id = $2 AND state = 'pending' AND created_at < now() - interval '5 minutes';

-- name: NullifyOrdersByUser :exec
UPDATE orders SET user_id = NULL, updated_at = now() WHERE user_id = $1;

-- name: ListPendingOrdersBefore :many
SELECT * FROM orders
WHERE state = 'pending'
  AND created_at < sqlc.arg(created_at)
  AND user_id IS NOT NULL
  AND id > sqlc.arg(cursor_id)
ORDER BY id ASC
LIMIT 1000;

