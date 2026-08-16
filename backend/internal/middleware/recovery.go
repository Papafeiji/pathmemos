package middleware

import (
	"log/slog"
	"net/http"
	"runtime/debug"

	"papafeiji/backend/pkg/errors"

	chimiddleware "github.com/go-chi/chi/v5/middleware"
)

// recoveryWriter 跟踪响应是否已写出（WriteHeader 或 Write 任一发生），
// 用于 SSE 流等已 flush 场景下 panic 时不再追加 500 JSON 破坏已输出的流。
type recoveryWriter struct {
	chimiddleware.WrapResponseWriter
	wroteBody bool
}

func (w *recoveryWriter) WriteHeader(code int) {
	w.wroteBody = true
	w.WrapResponseWriter.WriteHeader(code)
}

func (w *recoveryWriter) Write(b []byte) (int, error) {
	w.wroteBody = true
	return w.WrapResponseWriter.Write(b)
}

// Flush 透传给底层 writer。新版 chi 的 WrapResponseWriter 接口不再包含 Flush，
// 缺失会导致 AI 流式接口的 http.Flusher 断言失败（"streaming not supported" 500）。
func (w *recoveryWriter) Flush() {
	if f, ok := w.WrapResponseWriter.(http.Flusher); ok {
		f.Flush()
	}
}

func RecoveryMiddleware(logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ww := &recoveryWriter{WrapResponseWriter: chimiddleware.NewWrapResponseWriter(w, r.ProtoMajor)}
			defer func() {
				if rec := recover(); rec != nil {
					logger.Error("panic recovered",
						slog.Any("panic", rec),
						slog.String("request_id", RequestID(r.Context())),
						slog.String("stack", string(debug.Stack())),
					)
					// 客户端已断开或响应已写出（如 SSE 流），不再追加 JSON，仅保留日志。
					if r.Context().Err() != nil {
						return
					}
					if ww.wroteBody {
						return
					}
					JSONError(ww, r, http.StatusInternalServerError, errors.CodeInternalError, "internal server error")
				}
			}()
			next.ServeHTTP(ww, r)
		})
	}
}
