package push

import (
	stderrors "errors"
	"log/slog"

	"net/http"

	"papafeiji/backend/internal/middleware"
	"papafeiji/backend/pkg/errors"

	"github.com/go-chi/chi/v5"
)

// Handler handles subscription and push related endpoints.
type Handler struct {
	router  chi.Router
	service *Service
}

// NewHandler creates a new push handler.
func NewHandler(router chi.Router, service *Service) *Handler {
	return &Handler{router: router, service: service}
}

// Register registers protected endpoints.
func (h *Handler) Register() {
	h.router.Post("/subscribe/record", h.RecordSubscribe)
}

// RecordSubscribe records user's subscription result for a template.
func (h *Handler) RecordSubscribe(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.UserID(ctx)

	var req struct {
		TemplateID string `json:"templateId"`
		Scene      string `json:"scene"`
		Accept     bool   `json:"accept"`
	}
	if err := middleware.ReadJSONBody(w, r, &req, 4096); err != nil {
		status := http.StatusBadRequest
		code := errors.CodeBadRequest
		msg := "invalid request body"
		var maxBytesErr *http.MaxBytesError
		if stderrors.As(err, &maxBytesErr) {
			msg = "request body too large"
		}
		middleware.JSONError(w, r, status, code, msg)
		return
	}

	if req.Scene != "ABNORMAL_ALERT" {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "unsupported scene")
		return
	}

	if err := h.service.RecordSubscribe(ctx, userID, req.Accept); err != nil {
		slog.ErrorContext(ctx, "record subscribe failed", slog.Any("error", err))
		middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to record subscribe")
		return
	}

	middleware.JSON(w, r, http.StatusOK, map[string]interface{}{})
}
