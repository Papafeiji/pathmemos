package diary

import (
	"context"
	"fmt"
	"sync"
	"testing"
	"time"
)

// memLocker 进程内互斥锁，模拟 advisory lock 的 TryLock/Unlock 语义（仅测试用）。
type memLocker struct {
	mu   sync.Mutex
	held map[string]string
}

func newMemLocker() *memLocker { return &memLocker{held: map[string]string{}} }

func (m *memLocker) TryLock(_ context.Context, key string) (bool, string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, ok := m.held[key]; ok {
		return false, "", nil
	}
	token := fmt.Sprintf("tok-%d", len(m.held)+1)
	m.held[key] = token
	return true, token, nil
}

func (m *memLocker) TryLocks(ctx context.Context, keys []string) (bool, map[string]string, error) {
	tokens := make(map[string]string, len(keys))
	for _, k := range keys {
		ok, tok, err := m.TryLock(ctx, k)
		if err != nil || !ok {
			//nolint:errcheck
			m.UnlockMany(ctx, tokens)
			return false, nil, err
		}
		tokens[k] = tok
	}
	return true, tokens, nil
}

func (m *memLocker) Unlock(_ context.Context, key, token string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.held[key] == token {
		delete(m.held, key)
	}
	return nil
}

func (m *memLocker) UnlockMany(ctx context.Context, tokens map[string]string) error {
	for k, tok := range tokens {
		//nolint:errcheck
		m.Unlock(ctx, k, tok)
	}
	return nil
}

func newAutoLockService(t *testing.T) *Service {
	t.Helper()
	return &Service{lock: newMemLocker()}
}

// TestAcquireAutoEntryLock_MutualExclusion DA-P1-04：自动成文两入口复用 lock:auto_record:{userID}，
// 占用时第二个入口重试后拿不到 token，释放后可再获取。
func TestAcquireAutoEntryLock_MutualExclusion(t *testing.T) {
	s := newAutoLockService(t)
	ctx := context.Background()
	key := "lock:auto_record:u1"

	token1, err := s.acquireAutoEntryLock(ctx, key)
	if err != nil || token1 == "" {
		t.Fatalf("first acquire: token=%q err=%v", token1, err)
	}

	start := time.Now()
	token2, err := s.acquireAutoEntryLock(ctx, key)
	if err != nil {
		t.Fatalf("second acquire unexpected error: %v", err)
	}
	if token2 != "" {
		t.Fatalf("second acquire returned token %q while held", token2)
	}
	if elapsed := time.Since(start); elapsed < 200*time.Millisecond {
		t.Fatalf("second acquire returned too fast (%v); expected retries", elapsed)
	}

	if err := s.lock.Unlock(ctx, key, token1); err != nil {
		t.Fatalf("unlock: %v", err)
	}
	token3, err := s.acquireAutoEntryLock(ctx, key)
	if err != nil || token3 == "" {
		t.Fatalf("re-acquire after unlock: token=%q err=%v", token3, err)
	}
}

// TestAcquireAutoEntryLock_ContextCancel 占用中且 ctx 取消 → 返回错误，不静默成功。
func TestAcquireAutoEntryLock_ContextCancel(t *testing.T) {
	s := newAutoLockService(t)
	key := "lock:auto_record:u2"

	token, err := s.acquireAutoEntryLock(context.Background(), key)
	if err != nil || token == "" {
		t.Fatalf("first acquire: token=%q err=%v", token, err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 250*time.Millisecond)
	defer cancel()
	if _, err := s.acquireAutoEntryLock(ctx, key); err == nil {
		t.Fatal("expected context error while lock held")
	}
}
