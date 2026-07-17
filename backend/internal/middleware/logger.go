package middleware

import (
	"log/slog"
	"net/http"
)

func LoggerMiddleware(logger *slog.Logger, trustedProxies ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// 优先使用上游（如 Cloudflare Worker）传入的追踪 ID，便于跨链路排障。
			rid := r.Header.Get("X-Request-ID")
			if rid == "" {
				rid = RequestID(r.Context())
			}
			if rid == "" {
				rid = NewRequestID()
			}
			r = r.WithContext(WithRequestID(r.Context(), rid))

			next.ServeHTTP(w, r)
		})
	}
}
