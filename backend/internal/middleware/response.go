package middleware

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"

	"papafeiji/backend/pkg/errors"
	"papafeiji/backend/pkg/util"

	"github.com/go-chi/chi/v5/middleware"
)

type responseEnvelope struct {
	Code       string      `json:"code"`
	BizCode    string      `json:"biz_code,omitempty"`
	Message    string      `json:"message"`
	Data       interface{} `json:"data,omitempty"`
	Extra      interface{} `json:"extra,omitempty"`
	Count      int         `json:"count,omitempty"`
	NextCursor string      `json:"nextCursor,omitempty"`
	RequestID  string      `json:"request_id"`
}

type ctxKeyRequestID struct{}

func RequestID(ctx context.Context) string {
	if rid, ok := ctx.Value(ctxKeyRequestID{}).(string); ok {
		return rid
	}
	if rid := middleware.GetReqID(ctx); rid != "" {
		return rid
	}
	return NewRequestID()
}

func WithRequestID(ctx context.Context, rid string) context.Context {
	return context.WithValue(ctx, ctxKeyRequestID{}, rid)
}

func NewRequestID() string {
	id, err := util.NewUUID()
	if err != nil {
		return ""
	}
	return id
}

func requestID(r *http.Request) string {
	rid := RequestID(r.Context())
	if rid == "" {
		// B6a-07：优先复用客户端传入的 X-Request-ID，否则生成一次并注入 ctx，
		// 保证同一请求内多次取用稳定（避免每次生成新 UUID）。
		rid = util.SanitizeRequestID(r.Header.Get("X-Request-ID"))
		if rid == "" {
			rid = NewRequestID()
		}
		*r = *r.WithContext(WithRequestID(r.Context(), rid))
	}
	return rid
}

func JSON(w http.ResponseWriter, r *http.Request, status int, data interface{}) {
	JSONWithExtra(w, r, status, data, nil)
}

func JSONWithExtra(w http.ResponseWriter, r *http.Request, status int, data interface{}, extra interface{}) {
	resp := responseEnvelope{
		Code:      errors.CodeSuccess,
		Message:   "ok",
		Data:      data,
		Extra:     extra,
		RequestID: requestID(r),
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		slog.ErrorContext(r.Context(), "json encode JSONWithExtra response failed", slog.Any("error", err))
	}
}

func JSONWithPagination(w http.ResponseWriter, r *http.Request, status int, data interface{}, nextCursor string, count int) {
	resp := responseEnvelope{
		Code:       errors.CodeSuccess,
		Message:    "ok",
		Data:       data,
		Count:      count,
		NextCursor: nextCursor,
		RequestID:  requestID(r),
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		slog.ErrorContext(r.Context(), "json encode pagination response failed", slog.Any("error", err))
	}
}

func JSONError(w http.ResponseWriter, r *http.Request, status int, code string, message string, bizCode ...string) {
	resp := responseEnvelope{
		Code:      code,
		Message:   message,
		RequestID: requestID(r),
	}
	if len(bizCode) > 0 {
		resp.BizCode = bizCode[0]
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		slog.ErrorContext(r.Context(), "json encode error response failed", slog.Any("error", err))
	}
}

type sseErrorEnvelope struct {
	BizCode string `json:"bizCode"`
	Message string `json:"message"`
}

func SSEError(w http.ResponseWriter, bizCode string, message string) {
	payload, err := json.Marshal(sseErrorEnvelope{BizCode: bizCode, Message: message})
	if err != nil {
		payload = json.RawMessage(`{}`)
	}
	w.Header().Set("Content-Type", "text/event-stream")
	w.WriteHeader(http.StatusOK)
	//nolint:errcheck
	_, _ = fmt.Fprintf(w, "event: error\ndata: %s\n\n", payload)
	if f, ok := w.(http.Flusher); ok {
		f.Flush()
	}
}
