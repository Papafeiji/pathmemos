package payment

import (
	"context"
	"encoding/json"
	stderrors "errors"
	"io"
	"log/slog"
	"net/http"

	"papafeiji/backend/internal/config"
	"papafeiji/backend/internal/db"
	"papafeiji/backend/internal/db/sqlc"
	"papafeiji/backend/internal/middleware"
	"papafeiji/backend/internal/vip"
	"papafeiji/backend/internal/wechatcrypto"
	"papafeiji/backend/pkg/errors"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
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

	// 诊断日志：支付失败排障时确认客户端走的是现网(0)还是沙箱(1)环境。
	slog.InfoContext(ctx, "virtual pay request", slog.String("user_id", userID), slog.String("vip_id", req.VipID), slog.Int64("env", int64(req.Env)))

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
		// 真实 DB 错误不再吞掉（B6b-05）：按 500 返回，由日志与监控兜底。
		slog.ErrorContext(ctx, "failed to cancel order", slog.Any("error", err))
		middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to cancel order")
		return
	}
	if rowsAffected == 0 {
		order, err := h.pool.Queries().GetOrderByOutTradeNo(ctx, req.OutTradeNo)
		if err != nil {
			if stderrors.Is(err, pgx.ErrNoRows) {
				middleware.JSONError(w, r, errors.HTTPStatus(errors.BizOrderNotFound), errors.CodeBadRequest, "order not found")
				return
			}
			slog.ErrorContext(ctx, "failed to get order on cancel", slog.Any("error", err))
			middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to cancel order")
			return
		}
		if !order.UserID.Valid || order.UserID.String != userID {
			middleware.JSONError(w, r, errors.HTTPStatus(errors.BizOrderNotFound), errors.CodeBadRequest, "order not found")
			return
		}
		if order.State != "pending" {
			// 订单已关闭/已支付：并发关闭竞态下 0 行属正常结果，按已关闭返回成功语义（B6b-05）。
			slog.InfoContext(ctx, "cancel order already closed", slog.String("out_trade_no", req.OutTradeNo), slog.String("state", order.State))
			middleware.JSON(w, r, http.StatusOK, map[string]interface{}{})
			return
		}
		// 订单仍为 pending 但本次未关闭：并发 CloseOrder 竞态，视为已关闭（幂等）。
		slog.InfoContext(ctx, "cancel order closed by concurrent request", slog.String("out_trade_no", req.OutTradeNo))
		middleware.JSON(w, r, http.StatusOK, map[string]interface{}{})
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
	msgSignature := q.Get("msg_signature")
	timestamp := q.Get("timestamp")
	nonce := q.Get("nonce")
	echostr := q.Get("echostr")

	// GET 用于服务器地址验证：校验 signature/timestamp/nonce 并原样返回 echostr。
	// 使用虚拟支付回调专用 Token（与公众号 Token 独立）。
	if r.Method == http.MethodGet {
		if signature == "" || timestamp == "" || nonce == "" {
			slog.WarnContext(ctx, "payment notify get missing signature params")
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			w.WriteHeader(http.StatusForbidden)
			return
		}
		if !wechatcrypto.CheckSignature(h.cfg.WechatVirtualCallbackToken, signature, timestamp, nonce) {
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
	encrypted := false

	// 安全模式（微信后台「消息加密方式=安全模式」）：body 是密文包装，
	// 包装有两种形态（数据格式=JSON 时微信发 JSON 包装；XML 时为 <xml><Encrypt> 包装）：
	//   - {"encrypt": "<base64 密文>"}（或大写 Encrypt 键）
	//   - <xml><Encrypt><![CDATA[<base64 密文>]]></Encrypt></xml>
	// 需用 msg_signature 验签 + EncodingAESKey 解密，解密结果为 JSON 格式的支付通知。
	cipherText := extractEncryptedCiphertext(body)
	if cipherText != "" {
		encrypted = true
		if msgSignature == "" {
			slog.WarnContext(ctx, "payment notify rejected: missing msg_signature for encrypted body",
				slog.String("alert", "payment_notify_missing_msg_signature"))
			writeNotifyJSON(w)
			return
		}
		if !wechatcrypto.CheckEncryptedSignature(h.cfg.WechatVirtualCallbackToken, timestamp, nonce, cipherText, msgSignature) {
			slog.WarnContext(ctx, "payment notify rejected: encrypted signature verification failed",
				slog.String("alert", "payment_notify_bad_signature"))
			writeNotifyJSON(w)
			return
		}
		plaintext, receiveID, decErr := wechatcrypto.DecryptMsgZeroIV(cipherText, h.cfg.WechatVirtualCallbackAESKey)
		if decErr != nil {
			// 排障日志：密文/签名/时间戳均为非敏感值（密文本身已加密），
			// 用于核对微信后台 EncodingAESKey 与服务器配置是否一致。
			slog.ErrorContext(ctx, "payment notify decrypt failed",
				slog.String("alert", "payment_notify_decrypt_failed"),
				slog.String("ciphertext", cipherText),
				slog.String("msg_signature", msgSignature),
				slog.String("timestamp", timestamp),
				slog.String("nonce", nonce),
				slog.Any("error", decErr))
			writeNotifyJSON(w)
			return
		}
		slog.InfoContext(ctx, "payment notify decrypted", slog.String("receive_id", receiveID))
		if err := json.Unmarshal([]byte(plaintext), &payload); err != nil {
			slog.ErrorContext(ctx, "payment notify parse decrypted body failed",
				slog.String("alert", "alert:payment_parse_failed"),
				slog.Any("error", err))
			writeNotifyJSON(w)
			return
		}
	} else {
		// 明文模式：fail-closed 验签——签名缺失或校验失败一律不处理 body。
		// 签名算法为微信消息签名（sort([token, timestamp, nonce]) 后 SHA1）。
		// 拒绝时仍返回固定成功响应以终止微信重试，并记录带 alert 的日志供监控发现异常推送。
		if signature == "" || timestamp == "" || nonce == "" {
			slog.WarnContext(ctx, "payment notify rejected: missing signature params",
				slog.String("alert", "payment_notify_missing_signature"),
				slog.Bool("has_signature", signature != ""),
				slog.Bool("has_timestamp", timestamp != ""),
				slog.Bool("has_nonce", nonce != ""))
			writeNotifyJSON(w)
			return
		}
		if h.cfg.WechatVirtualCallbackToken == "" {
			slog.ErrorContext(ctx, "payment notify rejected: WechatVirtualCallbackToken not configured",
				slog.String("alert", "payment_notify_token_missing"))
			writeNotifyJSON(w)
			return
		}
		if !wechatcrypto.CheckSignature(h.cfg.WechatVirtualCallbackToken, signature, timestamp, nonce) {
			slog.WarnContext(ctx, "payment notify rejected: signature verification failed",
				slog.String("alert", "payment_notify_bad_signature"))
			writeNotifyJSON(w)
			return
		}
		if err := json.Unmarshal(body, &payload); err != nil {
			slog.ErrorContext(ctx, "payment notify parse body failed", slog.Any("error", err), slog.String("alert", "alert:payment_parse_failed"))
			writeNotifyJSON(w)
			return
		}
	}

	slog.InfoContext(ctx, "payment notify received",
		slog.String("path", r.URL.Path),
		slog.String("out_trade_no", getString(payload, "out_trade_no")),
		slog.String("event", eventType(payload)),
		slog.Bool("encrypted", encrypted))

	if err := h.handleNotify(ctx, payload); err != nil {
		if stderrors.Is(err, errNotifyRejected) {
			// 业务性拒绝：重试无法改变结果，返回固定成功终止微信重试并告警（B6b-04）。
			slog.WarnContext(ctx, "payment notify business rejected",
				slog.String("out_trade_no", getString(payload, "out_trade_no")),
				slog.String("alert", "payment_notify_business_rejected"),
				slog.String("error", err.Error()))
			writeNotifyJSON(w)
			return
		}
		// 瞬时故障（DB 抖动等）：返回非 2xx 触发微信重试，避免已扣款未到账无自动补偿（B6b-04）。
		// L3：带 alert 标签，便于监控识别同一订单的连续重试失败。
		slog.ErrorContext(ctx, "payment notify transient failure, will be retried", slog.String("alert", "payment_notify_transient_retry"), slog.String("out_trade_no", getString(payload, "out_trade_no")), slog.String("error", err.Error()))
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusInternalServerError)
		//nolint:errcheck
		_, _ = w.Write([]byte(`{"ErrCode":-1,"ErrMsg":"internal error"}`))
		return
	}

	writeNotifyJSON(w)
}

// extractEncryptedCiphertext 从安全模式回调 body 中提取密文：
// 优先尝试 JSON 包装（数据格式=JSON 时微信发送 {"encrypt": "..."} 或 {"Encrypt": "..."}），
// 再尝试 XML 包装（<xml><Encrypt>...</Encrypt></xml>）。非密文包装返回空串。
func extractEncryptedCiphertext(body []byte) string {
	var jsonEnv map[string]interface{}
	if err := json.Unmarshal(body, &jsonEnv); err == nil {
		for _, k := range []string{"encrypt", "Encrypt"} {
			if v, ok := jsonEnv[k].(string); ok && v != "" {
				return v
			}
		}
		return ""
	}
	if enc, err := wechatcrypto.ParseEncryptedXML(body); err == nil && enc.Encrypt != "" {
		return enc.Encrypt
	}
	return ""
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
