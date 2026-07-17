package sqlc

import (
	"context"

	"github.com/jackc/pgx/v5"
)

// QueryRaw 允许在同包代码中通过 *Queries 执行原始查询，用于事务内的一次性查询。
func (q *Queries) QueryRaw(ctx context.Context, query string, args ...interface{}) (pgx.Rows, error) {
	return q.db.Query(ctx, query, args...)
}

// QueryRowRaw 允许在同包代码中通过 *Queries 执行原始单行查询。
func (q *Queries) QueryRowRaw(ctx context.Context, query string, args ...interface{}) pgx.Row {
	return q.db.QueryRow(ctx, query, args...)
}
