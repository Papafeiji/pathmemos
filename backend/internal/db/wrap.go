package db

import (
	"papafeiji/backend/internal/db/sqlc"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Pool struct {
	pool    *pgxpool.Pool
	queries *sqlc.Queries
}

func WrapPool(pool *pgxpool.Pool) *Pool {
	return &Pool{
		pool:    pool,
		queries: sqlc.New(pool),
	}
}

func (p *Pool) Pool() *pgxpool.Pool {
	return p.pool
}

func (p *Pool) Queries() *sqlc.Queries {
	return p.queries
}
