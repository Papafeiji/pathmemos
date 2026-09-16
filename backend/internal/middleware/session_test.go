package middleware

import (
	"context"
	stderrors "errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
)

func newTestSessionManager(t *testing.T) (*SessionManager, *miniredis.Miniredis) {
	t.Helper()
	mr, err := miniredis.Run()
	if err != nil {
		t.Fatalf("miniredis: %v", err)
	}
	t.Cleanup(mr.Close)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	t.Cleanup(func() { _ = rdb.Close() })
	return NewSessionManager(rdb), mr
}

func TestSessionCreateAndGet(t *testing.T) {
	sm, _ := newTestSessionManager(t)
	ctx := context.Background()
	sid, err := sm.Create(ctx, "u1")
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	if sid == "" {
		t.Fatal("session id is empty")
	}
	uid, err := sm.Get(ctx, sid)
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if uid != "u1" {
		t.Fatalf("user id = %q, want u1", uid)
	}
}

func TestSessionCreateRequiresUserID(t *testing.T) {
	sm, _ := newTestSessionManager(t)
	if _, err := sm.Create(context.Background(), ""); err == nil {
		t.Fatal("expected error for empty user id")
	}
}

func TestSessionGetUnknownReturnsRedisNil(t *testing.T) {
	sm, _ := newTestSessionManager(t)
	if _, err := sm.Get(context.Background(), "does-not-exist"); !stderrors.Is(err, redis.Nil) {
		t.Fatalf("err = %v, want redis.Nil", err)
	}
}

func TestSessionGetEmptyIDReturnsError(t *testing.T) {
	sm, _ := newTestSessionManager(t)
	if _, err := sm.Get(context.Background(), ""); err == nil {
		t.Fatal("expected error for empty session id")
	}
}

func TestSessionDelete(t *testing.T) {
	sm, _ := newTestSessionManager(t)
	ctx := context.Background()
	sid, _ := sm.Create(ctx, "u1")
	if err := sm.Delete(ctx, sid); err != nil {
		t.Fatalf("delete: %v", err)
	}
	if _, err := sm.Get(ctx, sid); !stderrors.Is(err, redis.Nil) {
		t.Fatalf("err = %v, want redis.Nil after delete", err)
	}
}

func TestSessionDeleteAllScopedToUser(t *testing.T) {
	sm, _ := newTestSessionManager(t)
	ctx := context.Background()
	s1, _ := sm.Create(ctx, "u1")
	s2, _ := sm.Create(ctx, "u1")
	other, _ := sm.Create(ctx, "u2")

	if err := sm.DeleteAll(ctx, "u1"); err != nil {
		t.Fatalf("delete all: %v", err)
	}
	for _, sid := range []string{s1, s2} {
		if _, err := sm.Get(ctx, sid); !stderrors.Is(err, redis.Nil) {
			t.Fatalf("session %s err = %v, want redis.Nil", sid, err)
		}
	}
	if uid, err := sm.Get(ctx, other); err != nil || uid != "u2" {
		t.Fatalf("other user session affected: uid=%q err=%v", uid, err)
	}
}

func TestSessionFlushAll(t *testing.T) {
	sm, _ := newTestSessionManager(t)
	ctx := context.Background()
	s1, _ := sm.Create(ctx, "u1")
	s2, _ := sm.Create(ctx, "u2")
	if err := sm.FlushAllSessions(ctx); err != nil {
		t.Fatalf("flush all: %v", err)
	}
	for _, sid := range []string{s1, s2} {
		if _, err := sm.Get(ctx, sid); !stderrors.Is(err, redis.Nil) {
			t.Fatalf("session %s err = %v, want redis.Nil after flush", sid, err)
		}
	}
}

func TestSessionAbsoluteExpiryDeletesSession(t *testing.T) {
	sm, mr := newTestSessionManager(t)
	ctx := context.Background()
	sid, _ := sm.Create(ctx, "u1")

	mr.Del(sessionAbsoluteKeyPrefix + sid)
	if _, err := sm.Get(ctx, sid); !stderrors.Is(err, redis.Nil) {
		t.Fatalf("err = %v, want redis.Nil when absolute key gone", err)
	}
	if mr.Exists(sessionKeyPrefix + sid) {
		t.Fatal("session key should be deleted once absolute lifetime key is gone")
	}
}

func TestSessionGetRefreshesSlidingTTL(t *testing.T) {
	sm, mr := newTestSessionManager(t)
	ctx := context.Background()
	sid, _ := sm.Create(ctx, "u1")

	mr.FastForward(10 * 24 * time.Hour)
	key := sessionKeyPrefix + sid
	if ttl := mr.TTL(key); ttl > 21*24*time.Hour {
		t.Fatalf("ttl after fast-forward = %v, want <= 21d", ttl)
	}
	if _, err := sm.Get(ctx, sid); err != nil {
		t.Fatalf("get: %v", err)
	}
	if ttl := mr.TTL(key); ttl < 29*24*time.Hour {
		t.Fatalf("ttl after get = %v, want ~30d (sliding refresh)", ttl)
	}
}

func TestSessionMiddleware(t *testing.T) {
	sm, mr := newTestSessionManager(t)
	ctx := context.Background()
	sid, _ := sm.Create(ctx, "u1")

	var gotUser, gotSession string
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotUser = UserID(r.Context())
		gotSession = SessionID(r.Context())
	})

	do := func(auth string) *httptest.ResponseRecorder {
		req := httptest.NewRequest(http.MethodGet, "/x", nil)
		if auth != "" {
			req.Header.Set("Authorization", auth)
		}
		rec := httptest.NewRecorder()
		NewSessionMiddleware(sm).Handler(next).ServeHTTP(rec, req)
		return rec
	}

	if rec := do(""); rec.Code != http.StatusUnauthorized {
		t.Fatalf("missing session status = %d, want 401", rec.Code)
	}
	if rec := do("Bearer nope"); rec.Code != http.StatusUnauthorized {
		t.Fatalf("invalid session status = %d, want 401", rec.Code)
	}
	if rec := do("NotBearer " + sid); rec.Code != http.StatusUnauthorized {
		t.Fatalf("bad scheme status = %d, want 401", rec.Code)
	}
	if rec := do("Bearer " + sid); rec.Code != http.StatusOK {
		t.Fatalf("valid session status = %d, want 200", rec.Code)
	}
	if gotUser != "u1" || gotSession != sid {
		t.Fatalf("ctx user=%q session=%q, want u1/%s", gotUser, gotSession, sid)
	}

	// Redis 故障（非 redis.Nil）→ 500，不得误判为 401。
	mr.Close()
	if rec := do("Bearer " + sid); rec.Code != http.StatusInternalServerError {
		t.Fatalf("redis down status = %d, want 500", rec.Code)
	}
}
