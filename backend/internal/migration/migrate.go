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

	// 会话级 advisory 锁串行化迁移：open 模式多副本并发启动时，防止两个副本
	// 同时判定"未应用"并重复执行非幂等迁移（含 DML 的迁移会重复插入破坏数据）。
	// 锁在显式 unlock 后归还连接，进程退出时随会话关闭自动释放。
	conn, err := pool.Acquire(ctx)
	if err != nil {
		return fmt.Errorf("acquire migration conn: %w", err)
	}
	defer conn.Release() //nolint:errcheck
	if _, err := conn.Exec(ctx, `SELECT pg_advisory_lock($1)`, migrationLockKey); err != nil {
		return fmt.Errorf("acquire migration lock: %w", err)
	}
	defer func() {
		if _, unlockErr := conn.Exec(context.WithoutCancel(ctx), `SELECT pg_advisory_unlock($1)`, migrationLockKey); unlockErr != nil {
			slog.WarnContext(ctx, "release migration lock failed", slog.Any("error", unlockErr))
		}
	}()

	// 注意：本启动器的 schema_migrations 为 version TEXT；golang-migrate CLI（deploy.sh/Makefile 迁移）
	// 使用 version BIGINT + dirty BOOL。两者同名不同构，同一库不可混用两种迁移器——
	// 若库曾由 golang-migrate 管理，CREATE TABLE IF NOT EXISTS 不生效，随后 TEXT 与 bigint 比较会报
	// invalid input syntax。SaaS 由 deploy.sh 显式迁移，open 模式由本启动器迁移，二者按部署模式互斥。
	_, err = pool.Exec(ctx, `CREATE TABLE IF NOT EXISTS schema_migrations (
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
		// 执行迁移与版本记录放在同一事务：中途崩溃时两者一起回滚，
		// 避免"迁移已应用但版本未记录"导致重启后重复执行（含 DML 的迁移会破坏数据）。
		tx, err := pool.Begin(ctx)
		if err != nil {
			return fmt.Errorf("begin migration tx %s: %w", m.Name, err)
		}
		if _, err = tx.Exec(ctx, m.SQL); err != nil {
			_ = tx.Rollback(ctx) //nolint:errcheck
			return fmt.Errorf("apply migration %s: %w", m.Name, err)
		}
		if _, err = tx.Exec(ctx, `INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT DO NOTHING`, m.Name); err != nil {
			_ = tx.Rollback(ctx) //nolint:errcheck
			return fmt.Errorf("record migration %s: %w", m.Name, err)
		}
		if err = tx.Commit(ctx); err != nil {
			return fmt.Errorf("commit migration %s: %w", m.Name, err)
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

// migrationLockKey 是迁移会话锁的全局唯一 key（"migratio" 的 ASCII），
// 与业务 advisory 锁（如邀请奖励的 pg_advisory_xact_lock）错开，避免冲突。
const migrationLockKey int64 = 0x6d6967726174696f
