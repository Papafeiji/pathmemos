package payment

import (
	"context"
	"errors"
	"testing"
	"time"

	"papafeiji/backend/internal/db"
	"papafeiji/backend/internal/db/sqlc"
	"papafeiji/backend/internal/vip"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/pashagolub/pgxmock/v4"
)

// mockVIPService 记录 ActivateVIPWithTx 调用，供 handleNotify 测试断言发货行为。
type mockVIPService struct {
	activateCalls int
	activateUID   string
	activateVipID string
}

func (m *mockVIPService) GetVIPInfo(_ context.Context, _ string) (vip.Info, error) {
	return vip.Info{IsVIP: false}, nil
}

func (m *mockVIPService) ActivateVIPWithTx(_ context.Context, userID, vipID string, _ *sqlc.Queries) error {
	m.activateCalls++
	m.activateUID = userID
	m.activateVipID = vipID
	return nil
}

// orderRows 构造 sqlc.Order 扫描所需的 12 列 mock 行。
func orderRows(id, userID, vipID, outTradeNo, state string, amount int32) *pgxmock.Rows {
	return pgxmock.NewRows([]string{
		"id", "user_id", "vip_id", "out_trade_no", "channel", "state", "amount",
		"prepay_id", "transaction_id", "paid_at", "created_at", "updated_at",
	}).AddRow(id, pgtype.Text{String: userID, Valid: true}, vipID, outTradeNo,
		"virtual_pay", state, amount, nil, nil, nil, time.Now(), time.Now())
}

func notifyPayload(outTradeNo, transactionID string, amount int64) map[string]interface{} {
	return map[string]interface{}{
		"OutTradeNo": outTradeNo,
		"WeChatPayInfo": map[string]interface{}{
			"TransactionId": transactionID,
		},
		"GoodsInfo": map[string]interface{}{
			"ActualPrice": float64(amount),
		},
		"event": "xpay_goods_deliver_notify",
	}
}

func newNotifyHandler(mock pgxmock.PgxPoolIface, v *mockVIPService) *Handler {
	return &Handler{
		pool:       db.NewPoolWithDBTX(mock),
		vipService: v,
	}
}

// TestHandleNotify_Delivery 正常发货：pending 订单 → tx 内 UpdateOrderPaid 1 行 → ActivateVIPWithTx 被调用 → 无错误。
func TestHandleNotify_Delivery(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatalf("new mock pool: %v", err)
	}
	defer mock.Close()

	mock.ExpectQuery("FROM orders WHERE out_trade_no = \\$1").
		WithArgs("OT-1001").
		WillReturnRows(orderRows("order-1", "u1", "vip-month-0001", "OT-1001", "pending", 100))
	mock.ExpectBegin()
	mock.ExpectQuery("FROM orders WHERE out_trade_no = \\$1").
		WithArgs("OT-1001").
		WillReturnRows(orderRows("order-1", "u1", "vip-month-0001", "OT-1001", "pending", 100))
	mock.ExpectExec("UPDATE orders SET").
		WithArgs("OT-1001", pgtype.Text{String: "WX-1001", Valid: true}).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))
	mock.ExpectCommit()

	v := &mockVIPService{}
	h := newNotifyHandler(mock, v)
	err = h.handleNotify(context.Background(), notifyPayload("OT-1001", "WX-1001", 100))
	if err != nil {
		t.Fatalf("handleNotify delivery failed: %v", err)
	}
	if v.activateCalls != 1 || v.activateUID != "u1" || v.activateVipID != "vip-month-0001" {
		t.Fatalf("ActivateVIPWithTx calls = %d (uid=%q vip=%q), want 1 (u1, vip-month-0001)",
			v.activateCalls, v.activateUID, v.activateVipID)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// TestHandleNotify_DuplicateNotify 重复通知：UpdateOrderPaid 0 行（已支付）→ 幂等成功、不调用 Activate。
func TestHandleNotify_DuplicateNotify(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatalf("new mock pool: %v", err)
	}
	defer mock.Close()

	mock.ExpectQuery("FROM orders WHERE out_trade_no = \\$1").
		WithArgs("OT-1001").
		WillReturnRows(orderRows("order-1", "u1", "vip-month-0001", "OT-1001", "paid", 100))
	mock.ExpectBegin()
	mock.ExpectQuery("FROM orders WHERE out_trade_no = \\$1").
		WithArgs("OT-1001").
		WillReturnRows(orderRows("order-1", "u1", "vip-month-0001", "OT-1001", "paid", 100))
	mock.ExpectExec("UPDATE orders SET").
		WithArgs("OT-1001", pgtype.Text{String: "WX-1001", Valid: true}).
		WillReturnResult(pgxmock.NewResult("UPDATE", 0)) // 已支付：WHERE state='pending' 不命中
	mock.ExpectQuery("FROM orders WHERE out_trade_no = \\$1").
		WithArgs("OT-1001").
		WillReturnRows(orderRows("order-1", "u1", "vip-month-0001", "OT-1001", "paid", 100))
	mock.ExpectCommit()

	v := &mockVIPService{}
	h := newNotifyHandler(mock, v)
	err = h.handleNotify(context.Background(), notifyPayload("OT-1001", "WX-1001", 100))
	if err != nil {
		t.Fatalf("duplicate notify should be idempotent success, got: %v", err)
	}
	if v.activateCalls != 0 {
		t.Fatalf("ActivateVIPWithTx calls = %d, want 0 (idempotent no-op)", v.activateCalls)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// TestHandleNotify_AmountMismatch 金额不符 → errNotifyRejected（业务性拒绝）。
func TestHandleNotify_AmountMismatch(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatalf("new mock pool: %v", err)
	}
	defer mock.Close()

	mock.ExpectQuery("FROM orders WHERE out_trade_no = \\$1").
		WithArgs("OT-1001").
		WillReturnRows(orderRows("order-1", "u1", "vip-month-0001", "OT-1001", "pending", 100))

	v := &mockVIPService{}
	h := newNotifyHandler(mock, v)
	err = h.handleNotify(context.Background(), notifyPayload("OT-1001", "WX-1001", 99))
	if !errors.Is(err, errNotifyRejected) {
		t.Fatalf("want errNotifyRejected, got %v", err)
	}
	if v.activateCalls != 0 {
		t.Fatalf("ActivateVIPWithTx calls = %d, want 0", v.activateCalls)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// TestHandleNotify_OrderNotFound 订单不存在（pgx.ErrNoRows）→ errNotifyRejected。
func TestHandleNotify_OrderNotFound(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatalf("new mock pool: %v", err)
	}
	defer mock.Close()

	mock.ExpectQuery("FROM orders WHERE out_trade_no = \\$1").
		WithArgs("OT-404").
		WillReturnError(pgx.ErrNoRows)

	h := newNotifyHandler(mock, &mockVIPService{})
	err = h.handleNotify(context.Background(), notifyPayload("OT-404", "WX-1001", 100))
	if !errors.Is(err, errNotifyRejected) {
		t.Fatalf("want errNotifyRejected for missing order, got %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// TestHandleNotify_QueryDBError 查询订单遇到真实 DB 错误 → 返回可重试错误（非 errNotifyRejected）。
func TestHandleNotify_QueryDBError(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatalf("new mock pool: %v", err)
	}
	defer mock.Close()

	mock.ExpectQuery("FROM orders WHERE out_trade_no = \\$1").
		WithArgs("OT-1001").
		WillReturnError(errors.New("db connection lost"))

	h := newNotifyHandler(mock, &mockVIPService{})
	err = h.handleNotify(context.Background(), notifyPayload("OT-1001", "WX-1001", 100))
	if err == nil {
		t.Fatal("expected error for real db failure")
	}
	if errors.Is(err, errNotifyRejected) {
		t.Fatalf("real db error must NOT be errNotifyRejected (retriable), got %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}
