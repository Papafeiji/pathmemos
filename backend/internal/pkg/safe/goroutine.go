// Package safe provides goroutine helpers with panic recovery.
package safe

import (
	"context"
	"fmt"
	"log/slog"
	"runtime/debug"
)

func Go(ctx context.Context, logger *slog.Logger, fn func()) {
	if logger == nil {
		logger = slog.Default()
	}
	go func() {
		defer func() {
			if rec := recover(); rec != nil {
				logger.ErrorContext(ctx, "goroutine panic recovered",
					slog.Any("panic", rec),
					slog.String("stack", string(debug.Stack())),
				)
			}
		}()
		fn()
	}()
}

func GoWithRecover(ctx context.Context, logger *slog.Logger, fn func() error, onPanic func(error)) {
	if logger == nil {
		logger = slog.Default()
	}
	go func() {
		defer func() {
			if rec := recover(); rec != nil {
				logger.ErrorContext(ctx, "goroutine panic recovered",
					slog.Any("panic", rec),
					slog.String("stack", string(debug.Stack())),
				)
				if onPanic != nil {
					func() {
						defer func() {
							if rec2 := recover(); rec2 != nil {
								logger.ErrorContext(ctx, "onPanic callback itself panicked",
									slog.Any("panic", rec2),
									slog.Any("original_panic", rec),
									slog.String("stack", string(debug.Stack())),
								)
							}
						}()
						onPanic(fmt.Errorf("goroutine panic: %v", rec))
					}()
				}
			}
		}()
		if onPanic != nil {
			if err := fn(); err != nil {
				func() {
					defer func() {
						if rec2 := recover(); rec2 != nil {
							logger.ErrorContext(ctx, "onPanic callback itself panicked on error",
								slog.Any("panic", rec2),
								slog.Any("original_error", err),
								slog.String("stack", string(debug.Stack())),
							)
						}
					}()
					onPanic(err)
				}()
			}
		} else {
			if err := fn(); err != nil {
				logger.ErrorContext(ctx, "goroutine error dropped (no callback)", slog.Any("error", err))
			}
		}
	}()
}
