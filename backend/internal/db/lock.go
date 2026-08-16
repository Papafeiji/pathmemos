package db

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"sort"
	"time"

	"papafeiji/backend/internal/pkg/safe"
	"papafeiji/backend/pkg/util"

	"github.com/redis/go-redis/v9"
)

type LockClient interface {
	SetNX(ctx context.Context, key string, value interface{}, expiration time.Duration) *redis.BoolCmd
	Eval(ctx context.Context, script string, keys []string, args ...interface{}) *redis.Cmd
}

type Lock struct {
	client LockClient
}

func NewLock(client LockClient) *Lock {
	return &Lock{client: client}
}

func (l *Lock) TryLock(ctx context.Context, key string, ttl time.Duration) (bool, string, error) {
	token, err := util.NewUUID()
	if err != nil {
		return false, "", fmt.Errorf("generate lock token: %w", err)
	}
	ok, err := l.client.SetNX(ctx, key, token, ttl).Result()
	if err != nil {
		return false, "", err
	}
	if !ok {
		return false, "", nil
	}
	return true, token, nil
}

func (l *Lock) Unlock(ctx context.Context, key, token string) error {
	script := `
		if redis.call("get", KEYS[1]) == ARGV[1] then
			return redis.call("del", KEYS[1])
		else
			return 0
		end
	`
	_, err := l.client.Eval(ctx, script, []string{key}, token).Result()
	return err
}

func (l *Lock) Extend(ctx context.Context, key, token string, ttl time.Duration) (bool, error) {
	script := `
		if redis.call("get", KEYS[1]) == ARGV[1] then
			return redis.call("pexpire", KEYS[1], ARGV[2])
		else
			return 0
		end
	`
	// 毫秒精度并保底 1ms：ttl<1s 时 int64(ttl.Seconds())=0，Redis EXPIRE key 0 会直接删除锁。
	ttlMS := ttl.Milliseconds()
	if ttlMS < 1 {
		ttlMS = 1
	}
	res, err := l.client.Eval(ctx, script, []string{key}, token, ttlMS).Result()
	if err != nil {
		return false, err
	}
	n, ok := res.(int64)
	return ok && n > 0, nil
}

func (l *Lock) TryLocks(ctx context.Context, keys []string, ttl time.Duration) (bool, map[string]string, error) {
	if len(keys) == 0 {
		return true, nil, nil
	}

	sorted := make([]string, len(keys))
	copy(sorted, keys)
	sort.Strings(sorted)

	tokens := make(map[string]string, len(sorted))
	for _, key := range sorted {
		ok, token, err := l.TryLock(ctx, key, ttl)
		if err != nil {
			//nolint:errcheck
			l.release(ctx, tokens)
			return false, nil, fmt.Errorf("lock %s: %w", key, err)
		}
		if !ok {
			//nolint:errcheck
			l.release(ctx, tokens)
			return false, nil, nil
		}
		tokens[key] = token
	}

	return true, tokens, nil
}

func (l *Lock) UnlockMany(ctx context.Context, tokens map[string]string) error {
	return l.release(ctx, tokens)
}

func (l *Lock) release(ctx context.Context, tokens map[string]string) error {
	var releaseErrs []error
	for key, token := range tokens {
		if err := l.Unlock(ctx, key, token); err != nil {
			slog.ErrorContext(ctx, "unlock failed", slog.String("key", key), slog.Any("error", err))
			releaseErrs = append(releaseErrs, err)
		}
	}
	return errors.Join(releaseErrs...)
}

// StartLockRenewal 对一组已持有的锁启动后台续期（每 TTL 的 80% 触发一次）。
// 返回的 renewCtx 绑定续期状态：任一锁 Extend 失败或 token 已丢失时 renewCtx 立即被 cancel。
// 调用方须将 renewCtx 用作长事务/长任务的 context，从而在丢锁时自动中止操作（续期失败即中止）。
// 仅用于临界区含外部 IO 或大批量处理、可能长于 TTL 的长任务锁；纯 DB 亚秒级临界区应选
// ≤120s 的短 TTL 免除续期，不必调用本函数。必须 defer stop() 以停止续期任务并等待其退出。
func (l *Lock) StartLockRenewal(ctx context.Context, tokens map[string]string, ttl time.Duration) (renewCtx context.Context, stop func()) {
	if ttl <= 0 {
		// 非法 TTL：续期任务无法有意义地运行，直接返回已取消的 ctx，
		// 调用方按丢锁处理（与续期失败语义一致）。
		ctx2, cancel := context.WithCancel(ctx)
		cancel()
		return ctx2, func() {}
	}
	renewCtx, cancel := context.WithCancel(ctx)
	dones := make([]chan struct{}, 0, len(tokens))
	for key, token := range tokens {
		key, token := key, token
		done := make(chan struct{})
		dones = append(dones, done)
		// 续期任务通过 safe.GoWithRecover 启动，panic/error 时回调 cancel() 通知调用方中止；
		// done 在 fn 返回或 panic 展开时（defer）必定关闭，供 stop() 等待退出，无需额外裸 go 包装。
		safe.GoWithRecover(renewCtx, slog.Default().With(slog.String("key", key)), func() error {
			defer close(done)
			// 续期间隔取 TTL 的 80%，并保底 1ms：ttl 极小时 ttl*8/10 截断为 0，NewTicker(0) 会 panic。
			interval := ttl * 8 / 10
			if interval < time.Millisecond {
				interval = time.Millisecond
			}
			ticker := time.NewTicker(interval)
			defer ticker.Stop()
			for {
				select {
				case <-renewCtx.Done():
					return nil
				case <-ticker.C:
					ok, err := l.Extend(renewCtx, key, token, ttl)
					if err != nil {

						return fmt.Errorf("extend lock %s: %w", key, err)
					}
					if !ok {

						return fmt.Errorf("extend lock %s: token no longer holds lock", key)
					}
				}
			}
		}, func(error) { cancel() })
	}
	stop = func() {
		cancel()
		for _, done := range dones {
			<-done
		}
	}
	return renewCtx, stop
}
