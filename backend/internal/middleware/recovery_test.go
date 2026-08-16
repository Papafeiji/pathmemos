package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	chimiddleware "github.com/go-chi/chi/v5/middleware"
)

// TestRecoveryWriterImplementsFlusher 防止回归：AI 流式接口依赖 http.Flusher 断言，
// 曾因 chi 新版 WrapResponseWriter 接口不含 Flush 导致 500 "streaming not supported"。
func TestRecoveryWriterImplementsFlusher(t *testing.T) {
	ww := &recoveryWriter{WrapResponseWriter: chimiddleware.NewWrapResponseWriter(httptest.NewRecorder(), 1)}
	if _, ok := interface{}(ww).(http.Flusher); !ok {
		t.Fatal("recoveryWriter must implement http.Flusher for SSE streaming")
	}
	ww.Flush() // 不应 panic
}
