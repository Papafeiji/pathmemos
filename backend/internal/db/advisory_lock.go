package db

import (
	"context"
	"sort"
	"sync"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Locker 是分布式锁抽象，生产唯一实现为 AdvisoryLock。
// PostgreSQL advisory lock 为会话级锁：无 TTL，连接关闭（进程退出/DB 断开）即自动释放；
// 持锁正确性以 DB 唯一约束/事务/幂等为最终依据（docs/ARCHITECTURE-INVARIANTS.md §8）。
type Locker interface {
	TryLock(ctx context.Context, key string) (bool, string, error)
	TryLocks(ctx context.Context, keys []string) (bool, map[string]string, error)
	Unlock(ctx context.Context, key, token string) error
	UnlockMany(ctx context.Context, tokens map[string]string) error
}

// AdvisoryLock 用 PostgreSQL 会话级 advisory lock 实现跨进程互斥；
// 持锁期间占用一个连接，连接关闭（进程退出）即自动释放。
type AdvisoryLock struct {
	pool *pgxpool.Pool
	mu   sync.Mutex
	held map[string]*pgxpool.Conn
}

func NewAdvisoryLock(pool *pgxpool.Pool) *AdvisoryLock {
	return &AdvisoryLock{pool: pool, held: make(map[string]*pgxpool.Conn)}
}

func (l *AdvisoryLock) TryLock(ctx context.Context, key string) (bool, string, error) {
	if l == nil || l.pool == nil {
		return true, key, nil
	}
	conn, err := l.pool.Acquire(ctx)
	if err != nil {
		return false, "", err
	}
	var ok bool
	if err := conn.QueryRow(ctx, "SELECT pg_try_advisory_lock(hashtextextended($1, 0))", key).Scan(&ok); err != nil {
		conn.Release()
		return false, "", err
	}
	if !ok {
		conn.Release()
		return false, "", nil
	}
	l.mu.Lock()
	l.held[key] = conn
	l.mu.Unlock()
	return true, key, nil
}

func (l *AdvisoryLock) Unlock(ctx context.Context, key, token string) error {
	if l == nil {
		return nil
	}
	l.mu.Lock()
	conn := l.held[key]
	delete(l.held, key)
	l.mu.Unlock()
	if conn == nil {
		return nil
	}
	_, err := conn.Exec(ctx, "SELECT pg_advisory_unlock(hashtextextended($1, 0))", key)
	conn.Release()
	return err
}

func (l *AdvisoryLock) TryLocks(ctx context.Context, keys []string) (bool, map[string]string, error) {
	if len(keys) == 0 {
		return true, nil, nil
	}
	sorted := make([]string, len(keys))
	copy(sorted, keys)
	sort.Strings(sorted)
	tokens := make(map[string]string, len(sorted))
	for _, key := range sorted {
		ok, token, err := l.TryLock(ctx, key)
		if err != nil {
			//nolint:errcheck
			l.UnlockMany(ctx, tokens)
			return false, nil, err
		}
		if !ok {
			//nolint:errcheck
			l.UnlockMany(ctx, tokens)
			return false, nil, nil
		}
		tokens[key] = token
	}
	return true, tokens, nil
}

func (l *AdvisoryLock) UnlockMany(ctx context.Context, tokens map[string]string) error {
	var firstErr error
	for key, token := range tokens {
		if err := l.Unlock(ctx, key, token); err != nil && firstErr == nil {
			firstErr = err
		}
	}
	return firstErr
}
