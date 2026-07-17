package payment

import (
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"

	"papafeiji/backend/internal/config"
	"papafeiji/backend/internal/db"
	"papafeiji/backend/internal/db/sqlc"
	"papafeiji/backend/internal/middleware"
	"papafeiji/backend/internal/vip"
	"papafeiji/backend/pkg/errors"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type Handler struct {
	router     chi.Router
	pool       *db.Pool
	wechat     *WechatVirtualPayClient
	vipService VIPService
	cfg        *config.Config
}

type VIPService interface {
	vip.InfoProvider
	ActivateVIPWithTx(ctx context.Context, userID, vipID string, q *sqlc.Queries) error
}

func NewHandler(router chi.Router, pool *db.Pool, cfg *config.Config, vipService VIPService) *Handler {
	return &Handler{
		router:     router,
		pool:       pool,
		wechat:     NewWechatVirtualPayClient(cfg),
		vipService: vipService,
		cfg:        cfg,
	}
}

func (h *Handler) Register() {
	h.router.Post("/payment/virtual/request", h.Request)
	h.router.Post("/payment/virtual/cancel", h.Cancel)
	h.router.Get("/payment/virtual/status", h.Status)
}

func (h *Handler) RegisterPublic(r chi.Router) {

	r.Get("/api/prod/payment/virtualPayNotify", http.HandlerFunc(h.Notify))
	r.Post("/api/prod/payment/virtualPayNotify", http.HandlerFunc(h.Notify))
}

func (h *Handler) Request(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.UserID(ctx)

	var req struct {
		VipID string `json:"vipId"`
		Env   int32  `json:"env"`
	}
	if err := middleware.ReadJSONBody(w, r, &req, 4096); err != nil {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "invalid request body")
		return
	}
	if req.VipID == "" {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "vipId is required")
		return
	}
	if req.Env != 0 && req.Env != 1 {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "env must be 0 or 1")
		return
	}

	resp, err := h.createOrder(ctx, userID, req.VipID, req.Env)
	if err != nil {
		slog.ErrorContext(ctx, "create virtual pay order failed", slog.String("user_id", userID), slog.String("vip_id", req.VipID), slog.Int("env", int(req.Env)), slog.Any("error", err))
		switch err {
		case ErrInvalidVIP:
			middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, err.Error())

		default:
			middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to create order")
		}
		return
	}

	middleware.JSON(w, r, http.StatusOK, resp)
}

func (h *Handler) Cancel(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.UserID(ctx)

	var req struct {
		OutTradeNo string `json:"outTradeNo"`
	}
	if err := middleware.ReadJSONBody(w, r, &req, 4096); err != nil {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "invalid request body")
		return
	}
	if req.OutTradeNo == "" {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "outTradeNo is required")
		return
	}

	rowsAffected, err := h.pool.Queries().CloseOrder(ctx, sqlc.CloseOrderParams{
		OutTradeNo: req.OutTradeNo,
		UserID:     pgtype.Text{String: userID, Valid: true},
	})
	if err != nil {
		slog.ErrorContext(ctx, "failed to cancel order", slog.Any("error", err))
		middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to cancel order")
		return
	}
	if rowsAffected == 0 {
		order, err := h.pool.Queries().GetOrderByOutTradeNo(ctx, req.OutTradeNo)
		if err != nil || !order.UserID.Valid || order.UserID.String != userID {
			middleware.JSONError(w, r, errors.HTTPStatus(errors.BizOrderNotFound), errors.CodeBadRequest, "order not found")
			return
		}
		if order.State != "pending" {
			middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "order not pending")
			return
		}
		middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to cancel order")
		return
	}

	middleware.JSON(w, r, http.StatusOK, map[string]interface{}{})
}

func (h *Handler) Status(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.UserID(ctx)
	outTradeNo := r.URL.Query().Get("outTradeNo")
	if outTradeNo == "" {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "outTradeNo is required")
		return
	}

	order, err := h.pool.Queries().GetOrderByOutTradeNo(ctx, outTradeNo)
	if err != nil || !order.UserID.Valid || order.UserID.String != userID {
		middleware.JSONError(w, r, errors.HTTPStatus(errors.BizOrderNotFound), errors.CodeBadRequest, "order not found")
		return
	}

	middleware.JSON(w, r, http.StatusOK, map[string]interface{}{
		"state": order.State,
	})
}

func (h *Handler) Notify(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	q := r.URL.Query()
	signature := q.Get("signature")
	timestamp := q.Get("timestamp")
	nonce := q.Get("nonce")
	echostr := q.Get("echostr")

	// GET 用于服务器地址验证，必须校验 signature/timestamp/nonce 并原样返回 echostr。
	// token 未配置时校验自然失败，返回 403；不提前短路，以满足 AGENTS.md §3.1 的校验要求。
	if r.Method == http.MethodGet {
		if signature == "" || timestamp == "" || nonce == "" {
			slog.WarnContext(ctx, "payment notify get missing signature params")
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			w.WriteHeader(http.StatusForbidden)
			return
		}
		if !verifyWechatMsgSignature(h.cfg.WechatMsgToken, timestamp, nonce, signature) {
			slog.WarnContext(ctx, "payment notify get signature verification failed")
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			w.WriteHeader(http.StatusForbidden)
			return
		}
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(echostr)) //nolint:errcheck
		return
	}

	// POST：微信虚拟支付发货推送在明文模式下，URL query 的 signature/timestamp/nonce
	// 可能为空。官方文档要求校验，但实际推送中可能缺失，因此有则校验、无则跳过。
	// 小程序虚拟支付回调 body 没有 signData/signature 签名字段，不校验 body 签名。
	// 当 URL query 明确携带 signature 时，必须校验通过才进入 handleNotify；校验失败直接返回固定成功响应，
	// 不处理 body、不向微信暴露内部错误，业务幂等由 orders 状态机 + transaction_id 唯一约束兜底。
	if signature != "" {
		if timestamp == "" || nonce == "" {
			slog.WarnContext(ctx, "payment notify post partial query signature params", slog.String("signature", signature), slog.String("timestamp", timestamp), slog.String("nonce", nonce))
			writeNotifyJSON(w)
			return
		}
		if h.cfg.WechatMsgToken == "" {
			slog.ErrorContext(ctx, "payment notify post query signature present but token not configured", slog.String("alert", "wechat_msg_token_missing"))
			writeNotifyJSON(w)
			return
		}
		if !verifyWechatMsgSignature(h.cfg.WechatMsgToken, timestamp, nonce, signature) {
			slog.WarnContext(ctx, "payment notify signature verification failed")
			writeNotifyJSON(w)
			return
		}
	}

	const maxNotifyBodySize = 64 * 1024
	//nolint:errcheck
	defer r.Body.Close()
	body, err := io.ReadAll(io.LimitReader(r.Body, maxNotifyBodySize+1))
	if err != nil {
		slog.ErrorContext(ctx, "payment notify read body failed", slog.Any("error", err))
		writeNotifyJSON(w)
		return
	}
	if len(body) > maxNotifyBodySize {
		slog.WarnContext(ctx, "payment notify body too large")
		writeNotifyJSON(w)
		return
	}

	var payload map[string]interface{}
	if err := json.Unmarshal(body, &payload); err != nil {
		slog.ErrorContext(ctx, "payment notify parse body failed", slog.Any("error", err), slog.String("alert", "alert:payment_parse_failed"))
		writeNotifyJSON(w)
		return
	}

	slog.InfoContext(ctx, "payment notify received",
		slog.String("path", r.URL.Path),
		slog.String("out_trade_no", getString(payload, "out_trade_no")),
		slog.String("event", eventType(payload)),
		slog.Bool("has_query_signature", signature != ""))

	if err := h.handleNotify(ctx, payload); err != nil {
		slog.ErrorContext(ctx, "payment notify handle failed", slog.String("out_trade_no", getString(payload, "out_trade_no")), slog.String("error", err.Error()))
		writeNotifyJSON(w)
		return
	}

	writeNotifyJSON(w)
}

func eventType(payload map[string]interface{}) string {
	for _, k := range []string{"event", "Event"} {
		if v, ok := payload[k].(string); ok {
			return v
		}
	}
	return ""
}

func writeNotifyJSON(w http.ResponseWriter) {
	// 微信回调要求无论业务处理成功或失败，都返回固定成功响应。
	// 具体错误仅记录日志，不暴露给微信。
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	//nolint:errcheck
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"ErrCode": 0,
		"ErrMsg":  "success",
	})
}
