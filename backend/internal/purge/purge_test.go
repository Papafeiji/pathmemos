package purge

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
)

func newTestQueue(t *testing.T) (*Queue, *miniredis.Miniredis) {
	t.Helper()
	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	return NewQueue(rdb), mr
}

func TestQueueRecordPopPushBackRoundtrip(t *testing.T) {
	q, _ := newTestQueue(t)
	ctx := context.Background()

	for _, u := range []string{"https://a.com/1.png", "https://a.com/2.png"} {
		if err := q.Record(ctx, u); err != nil {
			t.Fatalf("record: %v", err)
		}
	}
	if n, _ := q.Len(ctx); n != 2 {
		t.Fatalf("len = %d, want 2", n)
	}

	batch, err := q.Pop(ctx, MaxBatch)
	if err != nil {
		t.Fatalf("pop: %v", err)
	}
	if len(batch) != 2 {
		t.Fatalf("pop got %d urls, want 2", len(batch))
	}
	if n, _ := q.Len(ctx); n != 0 {
		t.Fatalf("len after pop = %d, want 0", n)
	}

	// 刷新失败回滚：PushBack 后应能再次取到全部 URL。
	if err := q.PushBack(ctx, batch); err != nil {
		t.Fatalf("push back: %v", err)
	}
	again, err := q.Pop(ctx, MaxBatch)
	if err != nil {
		t.Fatalf("pop again: %v", err)
	}
	if len(again) != 2 {
		t.Fatalf("pop again got %d urls, want 2", len(again))
	}
}

func TestQueueRecordDeduplicates(t *testing.T) {
	q, _ := newTestQueue(t)
	ctx := context.Background()

	_ = q.Record(ctx, "https://a.com/1.png")
	_ = q.Record(ctx, "https://a.com/1.png")
	if n, _ := q.Len(ctx); n != 1 {
		t.Fatalf("len = %d, want 1（集合去重）", n)
	}
}

func TestQueueFullGuard(t *testing.T) {
	q, _ := newTestQueue(t)
	ctx := context.Background()

	orig := maxQueueSize
	maxQueueSize = 3
	t.Cleanup(func() { maxQueueSize = int64(orig) })

	for i := 0; i < 3; i++ {
		if err := q.Record(ctx, fmt.Sprintf("https://a.com/%d.png", i)); err != nil {
			t.Fatalf("record %d: %v", i, err)
		}
	}
	if err := q.Record(ctx, "https://a.com/new.png"); !errors.Is(err, ErrQueueFull) {
		t.Fatalf("record err = %v, want ErrQueueFull", err)
	}
}

func TestPercentEncode(t *testing.T) {
	cases := map[string]string{
		"https://a.com/1.png": "https%3A%2F%2Fa.com%2F1.png",
		"a b":                 "a%20b",
		"a*b":                 "a%2Ab",
		"a~b":                 "a~b",
		"a+b":                 "a%2Bb",
	}
	for in, want := range cases {
		if got := percentEncode(in); got != want {
			t.Fatalf("percentEncode(%q) = %q, want %q", in, got, want)
		}
	}
}

// TestRPCSignatureGolden 阿里云 pop RPC V1 签名黄金值（由同一规范独立实现计算）。
func TestRPCSignatureGolden(t *testing.T) {
	params := map[string]string{
		"AccessKeyId":      "testid",
		"Action":           "RefreshObjectCaches",
		"Format":           "JSON",
		"ObjectPath":       "https://a.com/1.png",
		"SignatureMethod":  "HMAC-SHA1",
		"SignatureNonce":   "fix-nonce-123",
		"SignatureVersion": "1.0",
		"Timestamp":        "2026-09-16T00:00:00Z",
		"Version":          "2018-05-10",
	}
	want := "TDnsnIaG+K3OS6y+iLCjPw9k/+c="
	if got := rpcSignature(http.MethodPost, params, "testsecret"); got != want {
		t.Fatalf("signature = %q, want %q", got, want)
	}
}

func TestPurgeSendsSignedRequest(t *testing.T) {
	var mu sync.Mutex
	var gotForm map[string]string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if err := r.ParseForm(); err != nil {
			t.Errorf("parse form: %v", err)
		}
		mu.Lock()
		gotForm = map[string]string{}
		for k := range r.PostForm {
			gotForm[k] = r.PostForm.Get(k)
		}
		mu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"RequestId":"req-1"}`))
	}))
	defer srv.Close()

	p := NewPurger("testid", "testsecret")
	p.endpoint = srv.URL
	if err := p.Purge(context.Background(), []string{"https://a.com/1.png", "https://a.com/2.png"}); err != nil {
		t.Fatalf("purge: %v", err)
	}

	mu.Lock()
	defer mu.Unlock()
	if gotForm["Action"] != "RefreshObjectCaches" {
		t.Fatalf("Action = %q", gotForm["Action"])
	}
	if gotForm["ObjectPath"] != "https://a.com/1.png,https://a.com/2.png" {
		t.Fatalf("ObjectPath = %q", gotForm["ObjectPath"])
	}
	if gotForm["Signature"] == "" || gotForm["AccessKeyId"] != "testid" {
		t.Fatalf("missing signature params: %v", gotForm)
	}
}

func TestPurgeUpstreamError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusForbidden)
		_, _ = w.Write([]byte(`{"Code":"Forbidden"}`))
	}))
	defer srv.Close()

	p := NewPurger("testid", "testsecret")
	p.endpoint = srv.URL
	if err := p.Purge(context.Background(), []string{"https://a.com/1.png"}); err == nil {
		t.Fatal("purge should fail on non-200 upstream")
	}
}
