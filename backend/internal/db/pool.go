package db

import (
	"context"
	"errors"
	"fmt"
	"time"

	"papafeiji/backend/internal/db/sqlc"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TxFn func(ctx context.Context, q *sqlc.Queries) error

func WithTx(ctx context.Context, pool *pgxpool.Pool, fn TxFn) error {
	conn, err := pool.Acquire(ctx)
	if err != nil {
		return fmt.Errorf("acquire conn: %w", err)
	}
	defer conn.Release()

	tx, err := conn.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer func() {
		if p := recover(); p != nil {
			//nolint:errcheck
			_ = tx.Rollback(context.WithoutCancel(ctx))
			panic(p)
		}
	}()

	if err := fn(ctx, sqlc.New(tx)); err != nil {
		if rbErr := tx.Rollback(context.WithoutCancel(ctx)); rbErr != nil {
			return fmt.Errorf("rollback failed: %w (original: %w)", rbErr, err)
		}
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit tx: %w", err)
	}

	return nil
}

func WithTxDeferrable(ctx context.Context, pool *pgxpool.Pool, fn TxFn) error {
	const maxRetries = 3
	const retryBackoff = 50 * time.Millisecond
	var lastErr error
	for i := 0; i < maxRetries; i++ {
		err := runTxDeferrableOnce(ctx, pool, fn)
		if err == nil {
			return nil
		}
		if !isSerializationFailure(err) {
			return err
		}
		lastErr = err
		time.Sleep(retryBackoff)
	}
	return fmt.Errorf("deferrable tx failed after %d retries: %w", maxRetries, lastErr)
}

func runTxDeferrableOnce(ctx context.Context, pool *pgxpool.Pool, fn TxFn) error {
	conn, err := pool.Acquire(ctx)
	if err != nil {
		return fmt.Errorf("acquire conn: %w", err)
	}
	defer conn.Release()

	tx, err := conn.BeginTx(ctx, pgx.TxOptions{
		IsoLevel:       pgx.RepeatableRead,
		DeferrableMode: pgx.Deferrable,
	})
	if err != nil {
		return fmt.Errorf("begin deferrable tx: %w", err)
	}
	defer func() {
		if p := recover(); p != nil {
			//nolint:errcheck
			_ = tx.Rollback(context.WithoutCancel(ctx))
			panic(p)
		}
	}()

	if err := fn(ctx, sqlc.New(tx)); err != nil {
		if rbErr := tx.Rollback(context.WithoutCancel(ctx)); rbErr != nil {
			return fmt.Errorf("rollback failed: %w (original: %w)", rbErr, err)
		}
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit tx: %w", err)
	}

	return nil
}

func isSerializationFailure(err error) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code == "40001"
	}
	return false
}
