package middleware

import (
	"log/slog"
	"net/http"
	"runtime/debug"

	"papafeiji/backend/pkg/errors"
)

func RecoveryMiddleware(logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if rec := recover(); rec != nil {
					logger.Error("panic recovered",
						slog.Any("panic", rec),
						slog.String("request_id", RequestID(r.Context())),
						slog.String("stack", string(debug.Stack())),
					)
					// If the request context is already cancelled (client disconnected or
					// handler already flushed SSE response), skip writing JSON to avoid
					// producing malformed output after already-flushed data.
					if r.Context().Err() != nil {
						return
					}
					JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "internal server error")
				}
			}()
			next.ServeHTTP(w, r)
		})
	}
}
