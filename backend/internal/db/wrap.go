package db

import (
	"context"

	"papafeiji/backend/internal/db/sqlc"

	"github.com/jackc/pgx/v5/pgxpool"
)

// DBTX 抽象 *pgxpool.Pool 与 pgxmock 共有的查询/事务能力，
// 使 *db.Pool 可在单元测试中注入 pgxmock（生产代码始终经 WrapPool 注入 *pgxpool.Pool）。
type DBTX interface {
	sqlc.DBTX
	TxBeginner
	Ping(ctx context.Context) error
}

type Pool struct {
	pool    DBTX
	queries *sqlc.Queries
}

func WrapPool(pool *pgxpool.Pool) *Pool {
	return &Pool{
		pool:    pool,
		queries: sqlc.New(pool),
	}
}

// NewPoolWithDBTX 以任意 DBTX 实现构造 *Pool，供单元测试注入 pgxmock 使用。
func NewPoolWithDBTX(db DBTX) *Pool {
	return &Pool{
		pool:    db,
		queries: sqlc.New(db),
	}
}

func (p *Pool) Pool() DBTX {
	return p.pool
}

func (p *Pool) Queries() *sqlc.Queries {
	return p.queries
}

var _ TxBeginner = (*pgxpool.Pool)(nil)
var _ DBTX = (*pgxpool.Pool)(nil)
