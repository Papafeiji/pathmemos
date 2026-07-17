package mcp

import (
	"crypto/subtle"
	"log/slog"
	"net/http"
	"time"

	"papafeiji/backend/internal/middleware"

	"github.com/go-chi/chi/v5"
)

// RegisterInternal 注册 Cloudflare Worker 专用内部端点，是 MCP 客户端流量的唯一入口。
// 全部路由由 X-Worker-Secret 共享密钥保护（不依赖 Nginx IP 白名单：
// Worker fetch 出口 IP 不在 Cloudflare 公布的回源段内，白名单不可行）。
func (h *Handler) RegisterInternal(r chi.Router) {
	r.Route("/internal/mcp", func(r chi.Router) {
		r.Use(h.workerSecretAuth)
		r.Post("/rpc", h.serveStreamable)
		r.Get("/diary", h.GetDiary)
		r.Post("/memories", h.CreateMemory)
		r.Get("/memories", h.ListMemories)
	})
}

// RegisterPublic 注册开源版直接暴露的 MCP 协议端点，不依赖 Cloudflare Worker。
// 增加 IP 限流作为基本防护，与 KeyRateLimiter 形成双层限流。
func (h *Handler) RegisterPublic(r chi.Router) {
	h.publicIPLimiter = middleware.NewIPRateLimiter(60, time.Minute, h.cfg.TrustedProxyCIDR)
	r.Group(func(r chi.Router) {
		r.Use(h.publicIPLimiter.Handler)
		r.Post("/mcp", h.serveStreamable)
		r.Get("/mcp/diary", h.GetDiary)
		r.Post("/mcp/memories", h.CreateMemory)
		r.Get("/mcp/memories", h.ListMemories)
	})
}

// workerSecretAuth 校验 X-Worker-Secret（常量时间比较）。
// 用户的 API Key 由 Worker 放在 Authorization: Bearer 头中透传，
// 下游 handler 仍按每请求独立校验（DB 查询 key_hash，不判断过期）。
func (h *Handler) workerSecretAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		expected := h.cfg.MCPWorkerSecret
		if expected == "" {
			slog.ErrorContext(r.Context(), "MCP_WORKER_SECRET not configured")
			http.Error(w, "server misconfigured", http.StatusInternalServerError)
			return
		}
		provided := r.Header.Get("X-Worker-Secret")
		if provided == "" || subtle.ConstantTimeCompare([]byte(provided), []byte(expected)) != 1 {
			http.Error(w, "forbidden", http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}
