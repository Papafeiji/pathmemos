package payment

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"math"
	"strconv"

	"papafeiji/backend/internal/db"
	"papafeiji/backend/internal/db/sqlc"
	"papafeiji/backend/internal/vip"
	"papafeiji/backend/pkg/util"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

var (
	ErrInvalidVIP = errors.New("invalid vip")
)

type requestResponse struct {
	OutTradeNo  string `json:"outTradeNo,omitempty"`
	PrepayID    string `json:"prepayId,omitempty"`
	OfferID     string `json:"offerId,omitempty"`
	BuyQuantity int32  `json:"buyQuantity,omitempty"`
	NeedPay     bool   `json:"needPay"`
	SignData    string `json:"signData,omitempty"`
	PaySig      string `json:"paySig,omitempty"`
	Signature   string `json:"signature,omitempty"`
	Mode        string `json:"mode,omitempty"`
}

// createOrder 为指定用户创建一笔 VIP 订单。
// 注意：事务内关闭旧 pending 订单后立即新建，极端并发下仍可能产生多笔 pending 订单；
// 这是业务可接受的，由用户/微信最终完成其中一笔，其余由后台任务关闭（AGENTS.md §4.3）。
func (h *Handler) createOrder(ctx context.Context, userID, vipID string, env int32) (*requestResponse, error) {
	vipRecord, err := h.pool.Queries().GetVIPByID(ctx, vipID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrInvalidVIP
		}
		slog.ErrorContext(ctx, "get vip by id failed", slog.String("vip_id", vipID), slog.Any("error", err))
		return nil, fmt.Errorf("get vip by id: %w", err)
	}
	if !vipRecord.IsActive || (vipRecord.Type != "month" && vipRecord.Type != "year") {
		return nil, ErrInvalidVIP
	}

	amount, ok := MatchPrice(vipRecord.Prices, vipRecord.Type)
	if !ok || amount <= 0 {
		return nil, ErrInvalidVIP
	}

	if _, _, err := vip.ParseVIPDuration(vipRecord.TimeLimitMark, int(vipRecord.TimeLimitNumber)); err != nil {
		return nil, ErrInvalidVIP
	}

	var outTradeNo string
	var orderID string

	err = db.WithTx(ctx, h.pool.Pool(), func(ctx context.Context, q *sqlc.Queries) error {
		if err := q.ClosePendingOrdersByUserAndVIP(ctx, sqlc.ClosePendingOrdersByUserAndVIPParams{
			UserID: pgtype.Text{String: userID, Valid: true},
			VipID:  vipID,
		}); err != nil {
			return fmt.Errorf("close pending orders: %w", err)
		}

		outTradeNo, err = GenerateOutTradeNo(userID, vipID)
		if err != nil {
			return fmt.Errorf("generate out trade no: %w", err)
		}
		orderID, err = util.NewUUID()
		if err != nil {
			return fmt.Errorf("generate order id: %w", err)
		}
		_, err = q.CreateOrder(ctx, sqlc.CreateOrderParams{
			ID:         orderID,
			UserID:     pgtype.Text{String: userID, Valid: true},
			VipID:      vipID,
			OutTradeNo: outTradeNo,
			Amount:     amount,
			PrepayID:   pgtype.Text{},
		})
		if err != nil {
			return fmt.Errorf("create order: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	user, err := h.pool.Queries().GetUserByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("get user openid: %w", err)
	}

	sessionKeyRec, err := h.pool.Queries().GetUserSessionKeyByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("get user session key: %w", err)
	}
	sessionKey := ""
	if sessionKeyRec.Valid {
		sessionKey = sessionKeyRec.String
	}

	attach, err := json.Marshal(map[string]string{
		"userId": userID,
		"vipId":  vipID,
	})
	if err != nil {
		return nil, fmt.Errorf("marshal attach: %w", err)
	}

	wxResp, err := h.wechat.Request(ctx, VirtualPayRequest{
		OutTradeNo:  outTradeNo,
		OpenID:      user.OpenID,
		OfferID:     "",
		ProductID:   utilString(vipRecord.ProductID),
		GoodsPrice:  amount,
		Env:         env,
		BuyQuantity: 1,
		Attach:      string(attach),
	}, sessionKey)
	if err != nil {
		if _, cerr := h.pool.Queries().CloseOrder(ctx, sqlc.CloseOrderParams{
			OutTradeNo: outTradeNo,
			UserID:     pgtype.Text{String: userID, Valid: true},
		}); cerr != nil {
			slog.ErrorContext(ctx, "close order after wechat request failed", slog.String("out_trade_no", outTradeNo), slog.Any("error", cerr))
		}
		return nil, fmt.Errorf("wechat request failed: %w", err)
	}

	return &requestResponse{
		OutTradeNo:  outTradeNo,
		OfferID:     wxResp.OfferID,
		BuyQuantity: 1,
		NeedPay:     true,
		SignData:    wxResp.SignData,
		PaySig:      wxResp.PaySig,
		Signature:   wxResp.Signature,
		Mode:        wxResp.Mode,
	}, nil
}

func parseNotifyAmount(v interface{}) (int64, bool) {
	switch n := v.(type) {
	case float64:
		if n != math.Trunc(n) {
			return 0, false
		}
		return int64(n), true
	case int64:
		return n, true
	case string:
		if i, err := strconv.ParseInt(n, 10, 64); err == nil {
			return i, true
		}
	}
	return 0, false
}

func (h *Handler) handleNotify(ctx context.Context, payload map[string]interface{}) error {
	outTradeNo := getStringAny(payload, "OutTradeNo", "out_trade_no")
	transactionID := getNestedStringAny(payload, "WeChatPayInfo", "", "TransactionId", "transaction_id")
	if transactionID == "" {
		transactionID = getStringAny(payload, "transaction_id")
	}
	if outTradeNo == "" {
		return fmt.Errorf("missing out_trade_no")
	}
	if transactionID == "" {
		slog.ErrorContext(ctx, "notify missing transaction_id", slog.String("out_trade_no", outTradeNo))
		return fmt.Errorf("missing transaction_id")
	}

	if evt := eventType(payload); evt != "xpay_goods_deliver_notify" {
		return fmt.Errorf("unsupported payment event: %s", evt)
	}

	order, err := h.pool.Queries().GetOrderByOutTradeNo(ctx, outTradeNo)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			slog.WarnContext(ctx, "notify order not found", slog.String("out_trade_no", outTradeNo))
			return fmt.Errorf("order not found: %w", err)
		}
		return fmt.Errorf("get order by out trade no: %w", err)
	}

	userDeleted := !order.UserID.Valid || order.UserID.String == ""
	if userDeleted {
		slog.WarnContext(ctx, "notify for deleted user, will update order but skip delivery", slog.String("out_trade_no", outTradeNo))
	}

	notifyAmount, amountOK := parseNotifyAmount(getNestedAny(payload, []string{"GoodsInfo", "goodsInfo"}, []string{"ActualPrice", "actualPrice"}))
	if !amountOK {
		notifyAmount, amountOK = parseNotifyAmount(getNestedAny(payload, nil, []string{"ActualPrice", "actualPrice", "amount"}))
	}
	if !amountOK {
		slog.ErrorContext(ctx, "notify amount missing or unparsable",
			slog.String("out_trade_no", outTradeNo),
			slog.Int64("order_amount", int64(order.Amount)))
		return fmt.Errorf("amount missing")
	}
	if notifyAmount != int64(order.Amount) {
		slog.ErrorContext(ctx, "notify amount mismatch",
			slog.String("out_trade_no", outTradeNo),
			slog.Int64("order_amount", int64(order.Amount)),
			slog.Int64("notify_amount", notifyAmount))
		return fmt.Errorf("amount mismatch")
	}

	err = db.WithTx(ctx, h.pool.Pool(), func(ctx context.Context, q *sqlc.Queries) error {
		// 在事务内重新确认订单归属，避免账号注销与支付回调的极窄竞态。
		currentOrder, err := q.GetOrderByOutTradeNo(ctx, outTradeNo)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return fmt.Errorf("order not found: %w", err)
			}
			return fmt.Errorf("get order in tx: %w", err)
		}
		isUserDeleted := !currentOrder.UserID.Valid || currentOrder.UserID.String == ""

		rows, err := q.UpdateOrderPaid(ctx, sqlc.UpdateOrderPaidParams{
			OutTradeNo:    outTradeNo,
			TransactionID: pgtype.Text{String: transactionID, Valid: true},
		})
		if err != nil {
			// transaction_id 唯一索引冲突（不同 out_trade_no 收到同一 transaction_id）
			// 属于微信侧不应发生的异常场景；此处直接返回错误并记录，依赖监控告警人工兜底。
			return fmt.Errorf("update order paid: %w", err)
		}
		if rows == 0 {
			// 订单已非 pending（已支付或已关闭），DB 唯一约束 + WHERE state='pending' 已保证幂等。
			slog.WarnContext(ctx, "notify for non-pending order", slog.String("out_trade_no", outTradeNo))
			return nil
		}

		if isUserDeleted {
			slog.InfoContext(ctx, "payment notify order updated for deleted user",
				slog.String("out_trade_no", outTradeNo),
				slog.String("vip_id", currentOrder.VipID),
				slog.String("transaction_id", transactionID))
			return nil
		}

		if err := h.vipService.ActivateVIPWithTx(ctx, currentOrder.UserID.String, currentOrder.VipID, q); err != nil {
			return fmt.Errorf("activate vip: %w", err)
		}

		slog.InfoContext(ctx, "payment notify delivered",
			slog.String("out_trade_no", outTradeNo),
			slog.String("user_id", currentOrder.UserID.String),
			slog.String("vip_id", currentOrder.VipID),
			slog.String("transaction_id", transactionID))
		return nil
	})
	return err
}

func getString(m map[string]interface{}, key string) string {
	if v, ok := m[key].(string); ok {
		return v
	}
	return ""
}

func getStringAny(m map[string]interface{}, keys ...string) string {
	for _, k := range keys {
		if v, ok := m[k].(string); ok && v != "" {
			return v
		}
	}
	return ""
}

func getNestedStringAny(m map[string]interface{}, outer string, outerAlt string, keys ...string) string {
	for _, o := range []string{outer, outerAlt} {
		if o == "" {
			// outerAlt 为空表示直接从顶层读取
			for _, k := range keys {
				if v, ok := m[k].(string); ok && v != "" {
					return v
				}
			}
			continue
		}
		outerMap, ok := m[o].(map[string]interface{})
		if !ok {
			continue
		}
		for _, k := range keys {
			if v, ok := outerMap[k].(string); ok && v != "" {
				return v
			}
		}
	}
	return ""
}

func getNestedAny(m map[string]interface{}, outerKeys, innerKeys []string) interface{} {
	if len(outerKeys) == 0 {
		// 无外层 key 时直接从顶层读取
		for _, k := range innerKeys {
			if v, ok := m[k]; ok {
				return v
			}
		}
		return nil
	}
	for _, o := range outerKeys {
		outerMap, ok := m[o].(map[string]interface{})
		if !ok {
			continue
		}
		for _, k := range innerKeys {
			if v, ok := outerMap[k]; ok {
				return v
			}
		}
	}
	return nil
}

func utilString(t pgtype.Text) string {
	if t.Valid {
		return t.String
	}
	return ""
}
