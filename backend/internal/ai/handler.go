package ai

import (
	"context"
	stderrors "errors"
	"log/slog"

	"net/http"
	"strings"
	"time"
	"unicode/utf8"

	"papafeiji/backend/internal/middleware"
	"papafeiji/backend/pkg/errors"

	"github.com/go-chi/chi/v5"
)

const (
	maxMessageCodePoints = 2500
	AIStreamTimeout      = 180 * time.Second
	maxBackgroundEntries = 2000
	backgroundCacheTTL   = 30 * time.Minute
	dailyQuotaNonVIP     = 10
	dailyQuotaVIP        = 100
	dailyQuotaKeyPrefix  = "ai:daily_chat"
	maxChatBodySize      = 32 * 1024 // 32KB，足以覆盖 2500 code points 及 JSON 开销
)

type Handler struct {
	router  chi.Router
	service *Service
}

func NewHandler(router chi.Router, service *Service) *Handler {
	return &Handler{
		router:  router,
		service: service,
	}
}

func (h *Handler) Register() {
	h.router.Post("/ai/chat", h.Chat)
}

func (h *Handler) Chat(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.UserID(ctx)

	var req struct {
		Message string `json:"message"`
	}
	if err := middleware.ReadJSONBody(w, r, &req, maxChatBodySize); err != nil {
		var maxBytesErr *http.MaxBytesError
		if stderrors.As(err, &maxBytesErr) {
			middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "request body too large")
		} else {
			middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "invalid request body")
		}
		return
	}

	msg := strings.TrimSpace(req.Message)
	if msg == "" {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "message is required")
		return
	}
	if utf8.RuneCountInString(msg) > maxMessageCodePoints {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "message too long")
		return
	}

	flusher, ok := w.(http.Flusher)
	if !ok {
		middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "streaming not supported")
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.WriteHeader(http.StatusOK)
	flusher.Flush()

	streamCtx, cancel := context.WithTimeout(ctx, AIStreamTimeout)
	defer cancel()

	_, err := h.service.Chat(streamCtx, userID, msg, func(chunk string) error {
		if err := writeSSEData(w, flusher, chunk); err != nil {

			return err
		}
		return nil
	})
	if err != nil {

		if stderrors.Is(err, ErrAIDailyQuotaExceeded) {
			slog.WarnContext(ctx, "ai chat quota exceeded", slog.String("user_id", userID), slog.Any("error", err))
			_ = writeSSEError(w, flusher, errors.BizAIDailyQuotaExceeded, "daily ai chat quota exceeded") //nolint:errcheck // error already propagated to client as SSE event
			return
		}
		if stderrors.Is(err, context.DeadlineExceeded) || stderrors.Is(err, errAIChatTimeout) {
			slog.ErrorContext(ctx, "ai chat timeout", slog.String("user_id", userID), slog.Any("error", err))
			_ = writeSSEError(w, flusher, errors.CodeInternalError, "timeout") //nolint:errcheck // error already propagated to client as SSE event
			return
		}
		slog.ErrorContext(ctx, "ai chat upstream error", slog.String("user_id", userID), slog.Any("error", err))
		_ = writeSSEError(w, flusher, errors.CodeInternalError, "upstream error") //nolint:errcheck // error already propagated to client as SSE event
		return
	}

	_ = writeSSEDone(w, flusher) //nolint:errcheck // stream close is best-effort
}
