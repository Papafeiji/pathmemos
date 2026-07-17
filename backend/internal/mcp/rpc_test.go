package mcp

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"papafeiji/backend/internal/config"

	"github.com/go-chi/chi/v5"
)

func newInternalRouter(secret string) http.Handler {
	h := NewHandler(nil, nil, &config.Config{MCPWorkerSecret: secret}, nil)
	r := chi.NewRouter()
	h.RegisterInternal(r)
	return r
}

func TestInternalSecretNotConfigured(t *testing.T) {
	r := newInternalRouter("")
	req := httptest.NewRequest(http.MethodPost, "/internal/mcp/rpc", strings.NewReader("{}"))
	req.Header.Set("X-Worker-Secret", "any")
	rec := httptest.NewRecorder()

	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500 when MCP_WORKER_SECRET unset, got %d", rec.Code)
	}
}

func TestInternalSecretMismatch(t *testing.T) {
	r := newInternalRouter("correct-secret")

	for _, tc := range []struct {
		name   string
		path   string
		header string
	}{
		{"rpc missing", "/internal/mcp/rpc", ""},
		{"rpc wrong", "/internal/mcp/rpc", "wrong-secret"},
		{"diary missing", "/internal/mcp/diary", ""},
		{"diary wrong", "/internal/mcp/diary", "wrong-secret"},
		{"memories wrong", "/internal/mcp/memories", "wrong-secret"},
	} {
		req := httptest.NewRequest(http.MethodGet, tc.path, nil)
		if tc.path == "/internal/mcp/rpc" {
			req = httptest.NewRequest(http.MethodPost, tc.path, strings.NewReader("{}"))
		}
		if tc.header != "" {
			req.Header.Set("X-Worker-Secret", tc.header)
		}
		rec := httptest.NewRecorder()

		r.ServeHTTP(rec, req)

		if rec.Code != http.StatusForbidden {
			t.Fatalf("%s: expected 403, got %d", tc.name, rec.Code)
		}
	}
}

// TestInternalSecretOK 验证通过 worker-secret 后进入下游处理链：
// 不带用户 API Key 时应由认证环节返回 401，而非 403/500。
func TestInternalSecretOK(t *testing.T) {
	r := newInternalRouter("correct-secret")

	for _, tc := range []struct {
		name   string
		method string
		path   string
	}{
		{"rpc", http.MethodPost, "/internal/mcp/rpc"},
		{"diary", http.MethodGet, "/internal/mcp/diary"},
		{"memories list", http.MethodGet, "/internal/mcp/memories"},
	} {
		var req *http.Request
		if tc.method == http.MethodPost {
			req = httptest.NewRequest(tc.method, tc.path, strings.NewReader("{}"))
		} else {
			req = httptest.NewRequest(tc.method, tc.path, nil)
		}
		req.Header.Set("X-Worker-Secret", "correct-secret")
		rec := httptest.NewRecorder()

		r.ServeHTTP(rec, req)

		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("%s: expected 401 from api key auth after secret check, got %d", tc.name, rec.Code)
		}
	}
}
