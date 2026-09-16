package middleware

import (
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
)

// 防回归：SSE 路由挂 AccessLogMiddleware 后，包装 writer 必须保留 http.Flusher，
// 否则 /ai/chat 的 http.Flusher 断言失败，直接返回 500 "streaming not supported"。
func TestAccessLogPreservesFlusher(t *testing.T) {
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	var gotFlusher bool
	h := AccessLogMiddleware(logger)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, gotFlusher = w.(http.Flusher)
	}))
	h.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodPost, "/ai/chat", nil))
	if !gotFlusher {
		t.Fatal("AccessLogMiddleware must preserve http.Flusher for SSE streaming")
	}
}
