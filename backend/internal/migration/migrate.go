// Package migration provides auto-migration execution for the open-source backend.
package migration

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func Run(ctx context.Context, pool *pgxpool.Pool, migrations []Migration) error {
	if len(migrations) == 0 {
		return nil
	}

	_, err := pool.Exec(ctx, `CREATE TABLE IF NOT EXISTS schema_migrations (
		version TEXT PRIMARY KEY,
		applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	)`)
	if err != nil {
		return fmt.Errorf("create schema_migrations table: %w", err)
	}

	for _, m := range migrations {
		var exists bool
		err := pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version=$1)`, m.Name).Scan(&exists)
		if err != nil {
			return fmt.Errorf("check migration %s: %w", m.Name, err)
		}
		if exists {
			continue
		}

		start := time.Now()
		_, err = pool.Exec(ctx, m.SQL)
		if err != nil {
			return fmt.Errorf("apply migration %s: %w", m.Name, err)
		}
		_, err = pool.Exec(ctx, `INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT DO NOTHING`, m.Name)
		if err != nil {
			return fmt.Errorf("record migration %s: %w", m.Name, err)
		}

		slog.InfoContext(ctx, "migration applied",
			slog.String("version", m.Name),
			slog.Duration("elapsed", time.Since(start)),
		)
	}

	return nil
}

type Migration struct {
	Name string
	SQL  string
}
