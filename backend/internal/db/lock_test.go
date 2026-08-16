package db

import (
	"context"
	"errors"
	"fmt"
	"sort"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/redis/go-redis/v9"
)

// mockLockEntry 记录锁 token 与过期时间（B2-21：mock 支持过期语义，可测续期/TTL 边界）。
type mockLockEntry struct {
	token     string
	expiresAt time.Time // 零值表示永不过期
}

// mockLockClient implements LockClient with an in-memory store.
type mockLockClient struct {
	mu    sync.Mutex
	store map[string]mockLockEntry // key -> entry
}

func newMockLockClient() *mockLockClient {
	return &mockLockClient{store: make(map[string]mockLockEntry)}
}

func (e mockLockEntry) expired(now time.Time) bool {
	return !e.expiresAt.IsZero() && now.After(e.expiresAt)
}

func (m *mockLockClient) SetNX(ctx context.Context, key string, value interface{}, expiration time.Duration) *redis.BoolCmd {
	m.mu.Lock()
	defer m.mu.Unlock()
	token, _ := value.(string)
	now := time.Now()
	if entry, exists := m.store[key]; exists && !entry.expired(now) {
		return redis.NewBoolResult(false, nil)
	}
	entry := mockLockEntry{token: token}
	if expiration > 0 {
		entry.expiresAt = now.Add(expiration)
	}
	m.store[key] = entry
	return redis.NewBoolResult(true, nil)
}

func (m *mockLockClient) Eval(ctx context.Context, script string, keys []string, args ...interface{}) *redis.Cmd {
	m.mu.Lock()
	defer m.mu.Unlock()

	key := keys[0]
	storedToken := m.store[key]

	now := time.Now()
	if strings.Contains(script, "del") {
		// Unlock script: verify token, then delete.
		if len(args) < 1 {
			return redis.NewCmdResult(nil, fmt.Errorf("missing token arg"))
		}
		token, _ := args[0].(string)
		if storedToken.token == token && storedToken.token != "" && !storedToken.expired(now) {
			delete(m.store, key)
			return redis.NewCmdResult(int64(1), nil)
		}
		return redis.NewCmdResult(int64(0), nil)
	}

	if strings.Contains(script, "expire") {
		// Extend script: verify token 并更新过期时间，返回 1 匹配，0 不匹配。
		if len(args) < 2 {
			return redis.NewCmdResult(nil, fmt.Errorf("missing extend args"))
		}
		token, _ := args[0].(string)
		ttlMS, _ := args[1].(int64)
		if storedToken.token == token && storedToken.token != "" && !storedToken.expired(now) {
			storedToken.expiresAt = now.Add(time.Duration(ttlMS) * time.Millisecond)
			m.store[key] = storedToken
			return redis.NewCmdResult(int64(1), nil)
		}
		return redis.NewCmdResult(int64(0), nil)
	}

	return redis.NewCmdResult(nil, fmt.Errorf("unknown script"))
}

func TestTryLock_Success(t *testing.T) {
	mock := newMockLockClient()
	lock := NewLock(mock)

	ok, token, err := lock.TryLock(context.Background(), "key1", 10*time.Second)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !ok {
		t.Fatal("expected lock acquired")
	}
	if token == "" {
		t.Fatal("expected non-empty token")
	}
	if mock.store["key1"].token != token {
		t.Fatal("token not stored in mock")
	}
}

func TestTryLock_Conflict(t *testing.T) {
	mock := newMockLockClient()
	lock := NewLock(mock)

	ok, _, err := lock.TryLock(context.Background(), "key1", 10*time.Second)
	if err != nil || !ok {
		t.Fatalf("first lock failed: err=%v ok=%v", err, ok)
	}

	ok, _, err = lock.TryLock(context.Background(), "key1", 10*time.Second)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if ok {
		t.Fatal("expected lock conflict (ok=false)")
	}
}

func TestUnlock_TokenMatches(t *testing.T) {
	mock := newMockLockClient()
	lock := NewLock(mock)

	_, token, _ := lock.TryLock(context.Background(), "key1", 10*time.Second)

	err := lock.Unlock(context.Background(), "key1", token)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, exists := mock.store["key1"]; exists {
		t.Fatal("key should be deleted after unlock")
	}
}

func TestUnlock_TokenMismatch(t *testing.T) {
	mock := newMockLockClient()
	lock := NewLock(mock)

	_, token, _ := lock.TryLock(context.Background(), "key1", 10*time.Second)

	// Unlock with wrong token.
	err := lock.Unlock(context.Background(), "key1", "wrong-token")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// Key should still exist with original token.
	if mock.store["key1"].token != token {
		t.Fatal("key should remain with original token after wrong-token unlock")
	}
}

func TestUnlock_KeyNotFound(t *testing.T) {
	mock := newMockLockClient()
	lock := NewLock(mock)

	// Unlock a key that doesn't exist.
	err := lock.Unlock(context.Background(), "nonexistent", "some-token")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestExtend_Success(t *testing.T) {
	mock := newMockLockClient()
	lock := NewLock(mock)

	_, token, _ := lock.TryLock(context.Background(), "key1", 10*time.Second)

	ok, err := lock.Extend(context.Background(), "key1", token, 20*time.Second)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !ok {
		t.Fatal("expected extend to succeed")
	}
}

func TestExtend_TokenMismatch(t *testing.T) {
	mock := newMockLockClient()
	lock := NewLock(mock)

	_, _, _ = lock.TryLock(context.Background(), "key1", 10*time.Second)

	ok, err := lock.Extend(context.Background(), "key1", "wrong-token", 20*time.Second)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if ok {
		t.Fatal("expected extend to fail with wrong token")
	}
}

func TestTryLock_ExpiredLockCanBeReacquired(t *testing.T) {
	mock := newMockLockClient()
	lock := NewLock(mock)

	ok, _, err := lock.TryLock(context.Background(), "key1", 30*time.Millisecond)
	if err != nil || !ok {
		t.Fatalf("first lock failed: err=%v ok=%v", err, ok)
	}
	time.Sleep(60 * time.Millisecond)

	// TTL 过期后应可重新获取（B2-21 过期边界）。
	ok, _, err = lock.TryLock(context.Background(), "key1", 10*time.Second)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !ok {
		t.Fatal("expected expired lock to be reacquirable")
	}
}

func TestExtend_RefreshesExpiration(t *testing.T) {
	mock := newMockLockClient()
	lock := NewLock(mock)

	_, token, _ := lock.TryLock(context.Background(), "key1", 10*time.Second)

	// 第一次续期把 TTL 缩短到 30ms，再续期回 10s。
	ok, err := lock.Extend(context.Background(), "key1", token, 30*time.Millisecond)
	if err != nil || !ok {
		t.Fatalf("extend failed: err=%v ok=%v", err, ok)
	}
	time.Sleep(60 * time.Millisecond)

	// 锁已按 30ms 过期，再续期应失败（过期边界）。
	ok, err = lock.Extend(context.Background(), "key1", token, 10*time.Second)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if ok {
		t.Fatal("expected extend to fail after lock expired")
	}
}

func TestExtend_LockExpired(t *testing.T) {
	mock := newMockLockClient()
	lock := NewLock(mock)

	ok, err := lock.Extend(context.Background(), "key1", "any-token", 20*time.Second)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if ok {
		t.Fatal("expected extend to fail when key does not exist")
	}
}

func TestTryLocks_AllSucceed(t *testing.T) {
	mock := newMockLockClient()
	lock := NewLock(mock)

	keys := []string{"c", "a", "b"} // unsorted
	ok, tokens, err := lock.TryLocks(context.Background(), keys, 10*time.Second)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !ok {
		t.Fatal("expected all locks acquired")
	}
	if len(tokens) != 3 {
		t.Fatalf("expected 3 tokens, got %d", len(tokens))
	}
	for _, k := range keys {
		if _, ok := tokens[k]; !ok {
			t.Fatalf("missing token for key %s", k)
		}
	}
}

func TestTryLocks_SortedKeys(t *testing.T) {
	// Verify that keys are sorted before acquisition.
	// The mock records the order of SetNX calls so we can verify sorting.
	mock := &mockLockClientWithOrder{
		mockLockClient: *newMockLockClient(),
		order:          make([]string, 0),
	}
	lock := NewLock(mock)

	keys := []string{"c", "a", "b"}
	_, _, _ = lock.TryLocks(context.Background(), keys, 10*time.Second)

	sorted := make([]string, len(keys))
	copy(sorted, keys)
	sort.Strings(sorted)

	for i, k := range sorted {
		if i >= len(mock.order) || mock.order[i] != k {
			t.Fatalf("keys not sorted: got order %v, want %v", mock.order, sorted)
		}
	}
}

type mockLockClientWithOrder struct {
	mockLockClient
	mu    sync.Mutex
	order []string
}

func (m *mockLockClientWithOrder) SetNX(ctx context.Context, key string, value interface{}, expiration time.Duration) *redis.BoolCmd {
	m.mu.Lock()
	m.order = append(m.order, key)
	m.mu.Unlock()
	return m.mockLockClient.SetNX(ctx, key, value, expiration)
}

func TestTryLocks_PartialFailure_CleansUp(t *testing.T) {
	mock := newMockLockClient()
	lock := NewLock(mock)

	// Pre-acquire "b" so TryLocks fails on it.
	_, _, _ = lock.TryLock(context.Background(), "b", 10*time.Second)

	keys := []string{"a", "b", "c"}
	ok, tokens, err := lock.TryLocks(context.Background(), keys, 10*time.Second)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if ok {
		t.Fatal("expected TryLocks to fail")
	}
	if tokens != nil {
		t.Fatal("expected nil tokens on failure")
	}
	// "a" should have been released after "b" failed.
	if _, exists := mock.store["a"]; exists {
		t.Fatal("key 'a' should be released after partial failure")
	}
	// "c" should never have been acquired (sorted order: a, b, c; fails at b).
	if _, exists := mock.store["c"]; exists {
		t.Fatal("key 'c' should not have been acquired")
	}
	// "b" should still be held by the pre-acquired lock.
	if _, exists := mock.store["b"]; !exists {
		t.Fatal("pre-acquired key 'b' should still exist")
	}
}

func TestTryLocks_EmptyKeys(t *testing.T) {
	mock := newMockLockClient()
	lock := NewLock(mock)

	ok, tokens, err := lock.TryLocks(context.Background(), nil, 10*time.Second)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !ok {
		t.Fatal("expected empty TryLocks to succeed")
	}
	if tokens != nil {
		t.Fatal("expected nil tokens for empty keys")
	}
}

func TestUnlockMany(t *testing.T) {
	mock := newMockLockClient()
	lock := NewLock(mock)

	_, tokens, _ := lock.TryLocks(context.Background(), []string{"a", "b"}, 10*time.Second)

	err := lock.UnlockMany(context.Background(), tokens)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, exists := mock.store["a"]; exists {
		t.Fatal("key 'a' should be deleted")
	}
	if _, exists := mock.store["b"]; exists {
		t.Fatal("key 'b' should be deleted")
	}
}

func TestRelease_OneFails_ContinuesOthers(t *testing.T) {
	mock := newMockLockClient()
	lock := NewLock(mock)

	_, tokens, _ := lock.TryLocks(context.Background(), []string{"a", "b"}, 10*time.Second)

	// Manually remove key "a" to simulate it already expiring.
	mock.mu.Lock()
	delete(mock.store, "a")
	mock.mu.Unlock()

	err := lock.UnlockMany(context.Background(), tokens)
	// UnlockMany should succeed even if one key was already gone.
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// "b" should still be deleted.
	if _, exists := mock.store["b"]; exists {
		t.Fatal("key 'b' should be deleted")
	}
}

func TestTryLock_ErrorOnSetNX(t *testing.T) {
	// Use a client that always returns an error.
	errClient := &errorLockClient{err: errors.New("redis down")}
	lock := NewLock(errClient)

	_, _, err := lock.TryLock(context.Background(), "key1", 10*time.Second)
	if err == nil {
		t.Fatal("expected error from SetNX")
	}
}

type errorLockClient struct {
	err error
}

func (e *errorLockClient) SetNX(ctx context.Context, key string, value interface{}, expiration time.Duration) *redis.BoolCmd {
	return redis.NewBoolResult(false, e.err)
}

func (e *errorLockClient) Eval(ctx context.Context, script string, keys []string, args ...interface{}) *redis.Cmd {
	return redis.NewCmdResult(nil, e.err)
}

func TestUnlock_ErrorOnEval(t *testing.T) {
	errClient := &errorLockClient{err: errors.New("redis down")}
	lock := NewLock(errClient)

	err := lock.Unlock(context.Background(), "key1", "token")
	if err == nil {
		t.Fatal("expected error from Eval")
	}
}

func TestExtend_ErrorOnEval(t *testing.T) {
	errClient := &errorLockClient{err: errors.New("redis down")}
	lock := NewLock(errClient)

	ok, err := lock.Extend(context.Background(), "key1", "token", 10*time.Second)
	if err == nil {
		t.Fatal("expected error from Eval")
	}
	if ok {
		t.Fatal("expected ok=false on error")
	}
}

func TestStartLockRenewal_Success(t *testing.T) {
	mock := newMockLockClient()
	lock := NewLock(mock)

	_, token, _ := lock.TryLock(context.Background(), "key1", 10*time.Second)
	tokens := map[string]string{"key1": token}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	renewCtx, stop := lock.StartLockRenewal(ctx, tokens, 1*time.Second)
	defer stop()

	// Wait for at least one renewal tick.
	select {
	case <-renewCtx.Done():
		t.Fatal("renewCtx cancelled unexpectedly")
	case <-time.After(1500 * time.Millisecond):
		// Renewal should have fired at least once (ticker at 800ms).
	}

	// The lock should still be held.
	if _, exists := mock.store["key1"]; !exists {
		t.Fatal("lock should still exist after renewal")
	}
}

func TestStartLockRenewal_FailureCancelsContext(t *testing.T) {
	mock := newMockLockClient()
	lock := NewLock(mock)

	_, token, _ := lock.TryLock(context.Background(), "key1", 10*time.Second)
	tokens := map[string]string{"key1": token}

	ctx := context.Background()

	renewCtx, stop := lock.StartLockRenewal(ctx, tokens, 1*time.Second)
	defer stop()

	// Manually remove the lock to simulate it being stolen.
	mock.mu.Lock()
	delete(mock.store, "key1")
	mock.mu.Unlock()

	// Wait for the renewal goroutine to detect the stolen lock.
	select {
	case <-renewCtx.Done():
		// Expected: context cancelled due to renewal failure.
	case <-time.After(2 * time.Second):
		t.Fatal("timeout waiting for renewCtx to be cancelled after lock stolen")
	}
}

func TestStartLockRenewal_StopWaitsForGoroutines(t *testing.T) {
	mock := newMockLockClient()
	lock := NewLock(mock)

	_, token, _ := lock.TryLock(context.Background(), "key1", 10*time.Second)
	tokens := map[string]string{"key1": token}

	ctx := context.Background()

	_, stop := lock.StartLockRenewal(ctx, tokens, 1*time.Second)

	// Stop should complete without hanging.
	done := make(chan struct{})
	go func() {
		stop()
		close(done)
	}()

	select {
	case <-done:
		// Success.
	case <-time.After(3 * time.Second):
		t.Fatal("stop() hung")
	}
}
