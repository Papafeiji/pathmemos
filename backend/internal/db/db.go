// Package db provides database connection, transaction, and locking utilities.
package db

import (
	"context"
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func NewPool(databaseURL string) (*pgxpool.Pool, error) {
	return newPoolWithTimeout(databaseURL, true)
}

func NewBackgroundPool(databaseURL string) (*pgxpool.Pool, error) {
	return newPoolWithTimeout(databaseURL, false)
}

func newPoolWithTimeout(databaseURL string, enableStatementTimeout bool) (*pgxpool.Pool, error) {
	if databaseURL == "" {
		return nil, fmt.Errorf("database URL is empty")
	}

	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("parse database config: %w", err)
	}

	maxConns := int32(50)
	if v := os.Getenv("DB_MAX_CONNS"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n >= 5 {
			maxConns = int32(n)
		}
	}
	config.MaxConns = maxConns

	minConns := int32(10)
	if v := os.Getenv("DB_MIN_CONNS"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n >= 1 {
			minConns = int32(n)
		}
	}
	if minConns > maxConns {
		minConns = maxConns
	}
	config.MinConns = minConns
	config.MaxConnLifetime = time.Hour
	config.MaxConnIdleTime = 30 * time.Minute
	config.ConnConfig.RuntimeParams["timezone"] = "Asia/Shanghai"
	if enableStatementTimeout {
		config.ConnConfig.RuntimeParams["statement_timeout"] = "30000"
	}

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return nil, fmt.Errorf("create pool: %w", err)
	}

	pingCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := pool.Ping(pingCtx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping database: %w", err)
	}

	return pool, nil
}
