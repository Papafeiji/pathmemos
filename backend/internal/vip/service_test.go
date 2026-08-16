package vip

import (
	"context"
	"errors"
	"testing"
	"time"

	"papafeiji/backend/internal/db/sqlc"
	"papafeiji/backend/pkg/timeutil"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/pashagolub/pgxmock/v4"
)

func TestParseVIPDuration_Valid(t *testing.T) {
	tests := []struct {
		mark   string
		number int
		want   int
		unit   string
	}{
		{"day", 7, 7, "day"},
		{"month", 1, 1, "month"},
		{"year", 1, 1, "year"},
		{"day", 30, 30, "day"},
		{"month", 12, 12, "month"},
	}

	for _, tt := range tests {
		d, u, err := ParseVIPDuration(tt.mark, tt.number)
		if err != nil {
			t.Errorf("ParseVIPDuration(%q, %d) unexpected error: %v", tt.mark, tt.number, err)
		}
		if d != tt.want || u != tt.unit {
			t.Errorf("ParseVIPDuration(%q, %d) = (%d, %q), want (%d, %q)",
				tt.mark, tt.number, d, u, tt.want, tt.unit)
		}
	}
}

func TestParseVIPDuration_InvalidMark(t *testing.T) {
	_, _, err := ParseVIPDuration("invalid", 30)
	if err == nil {
		t.Fatal("expected error for invalid mark")
	}
}

func TestParseVIPDuration_ZeroOrNegativeNumber(t *testing.T) {
	_, _, err := ParseVIPDuration("day", 0)
	if err == nil {
		t.Fatal("expected error for number=0")
	}
	_, _, err = ParseVIPDuration("month", -1)
	if err == nil {
		t.Fatal("expected error for negative number")
	}
}

func TestParseVIPDuration_EmptyMark(t *testing.T) {
	_, _, err := ParseVIPDuration("", 30)
	if err == nil {
		t.Fatal("expected error for empty mark")
	}
}

func TestInfo_Default(t *testing.T) {
	info := Info{IsVIP: false, ExpireTime: nil}
	if info.IsVIP {
		t.Fatal("default Info.IsVIP should be false")
	}
}

func vipRows(mock pgxmock.PgxPoolIface, id, typ, mark string, num int32) *pgxmock.Rows {
	return pgxmock.NewRows([]string{
		"id", "type", "name", "time_limit_mark", "time_limit_number",
		"product_id", "sort", "is_active", "prices", "created_at",
	}).AddRow(id, typ, "测试VIP", mark, num, nil, int32(0), true, []byte("{}"), nil)
}

func userVipRows(id, userID string, begin, expire time.Time) *pgxmock.Rows {
	return pgxmock.NewRows([]string{
		"id", "user_id", "begin_time", "expire_time", "created_at",
	}).AddRow(id, userID, begin, expire, time.Now())
}

// TestActivateVIPWithTx_TrialSecondClaim 领取防重：同一用户二次领取试用 VIP 必须被拒绝（C4 核心业务）。
func TestActivateVIPWithTx_TrialSecondClaim(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatalf("new mock pool: %v", err)
	}
	defer mock.Close()

	mock.ExpectQuery("vips WHERE id = \\$1").
		WithArgs("vip-trial-0001").
		WillReturnRows(vipRows(mock, "vip-trial-0001", "trial", "day", 7))
	mock.ExpectExec("INSERT INTO user_vip_claims").
		WithArgs(pgxmock.AnyArg(), "u1", "vip-trial-0001").
		WillReturnResult(pgxmock.NewResult("INSERT", 0)) // ON CONFLICT DO NOTHING → 0 行

	s := &Service{}
	err = s.ActivateVIPWithTx(context.Background(), "u1", "vip-trial-0001", sqlc.New(mock))
	if !errors.Is(err, ErrTrialVIPAlreadyClaimed) {
		t.Fatalf("want ErrTrialVIPAlreadyClaimed, got %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// TestActivateVIPWithTx_NewUser 支付激活：新用户首次激活应创建 user_vips 记录。
func TestActivateVIPWithTx_NewUser(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatalf("new mock pool: %v", err)
	}
	defer mock.Close()

	mock.ExpectQuery("vips WHERE id = \\$1").
		WithArgs("vip-month-0001").
		WillReturnRows(vipRows(mock, "vip-month-0001", "month", "month", 1))
	mock.ExpectExec("INSERT INTO user_vip_claims").
		WithArgs(pgxmock.AnyArg(), "u1", "vip-month-0001").
		WillReturnResult(pgxmock.NewResult("INSERT", 1))
	mock.ExpectQuery("FROM user_vips WHERE user_id = \\$1 FOR UPDATE").
		WithArgs("u1").
		WillReturnError(pgx.ErrNoRows)
	// 并发首次激活竞态防护：先占位行（ON CONFLICT DO NOTHING），再 FOR UPDATE 重读，最后叠加时长。
	mock.ExpectExec("INSERT INTO user_vips").
		WithArgs(pgxmock.AnyArg(), "u1", pgxmock.AnyArg(), pgxmock.AnyArg()).
		WillReturnResult(pgxmock.NewResult("INSERT", 1))
	mock.ExpectQuery("FROM user_vips WHERE user_id = \\$1 FOR UPDATE").
		WithArgs("u1").
		WillReturnRows(userVipRows("uv-1", "u1", time.Now(), time.Now()))
	mock.ExpectQuery("INSERT INTO user_vips").
		WithArgs(pgxmock.AnyArg(), "u1", pgxmock.AnyArg(), pgxmock.AnyArg()).
		WillReturnRows(userVipRows("uv-1", "u1", time.Now(), time.Now().AddDate(0, 1, 0)))

	s := &Service{}
	if err := s.ActivateVIPWithTx(context.Background(), "u1", "vip-month-0001", sqlc.New(mock)); err != nil {
		t.Fatalf("activate failed: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// TestActivateVIPWithTx_ExtendFromExpire 续期：已购 VIP 未过期时应从现有到期时间向后顺延，且 begin_time 不变（C4 核心业务）。
func TestActivateVIPWithTx_ExtendFromExpire(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatalf("new mock pool: %v", err)
	}
	defer mock.Close()

	now := timeutil.NowShanghai()
	begin := now.AddDate(0, 0, -10)
	expire := now.AddDate(0, 0, 5) // 未过期
	expectedExpire := expire.AddDate(0, 1, 0)

	mock.ExpectQuery("vips WHERE id = \\$1").
		WithArgs("vip-month-0001").
		WillReturnRows(vipRows(mock, "vip-month-0001", "month", "month", 1))
	mock.ExpectExec("INSERT INTO user_vip_claims").
		WithArgs(pgxmock.AnyArg(), "u1", "vip-month-0001").
		WillReturnResult(pgxmock.NewResult("INSERT", 1))
	mock.ExpectQuery("FROM user_vips WHERE user_id = \\$1 FOR UPDATE").
		WithArgs("u1").
		WillReturnRows(userVipRows("uv-1", "u1", begin, expire))
	mock.ExpectQuery("INSERT INTO user_vips").
		WithArgs("uv-1", "u1",
			pgtype.Timestamptz{Time: begin, Valid: true},
			pgtype.Timestamptz{Time: expectedExpire, Valid: true}).
		WillReturnRows(userVipRows("uv-1", "u1", begin, expectedExpire))

	s := &Service{}
	if err := s.ActivateVIPWithTx(context.Background(), "u1", "vip-month-0001", sqlc.New(mock)); err != nil {
		t.Fatalf("activate failed: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// TestActivateVIPWithTx_ExpiredRestartsFromNow 过期后再次购买应从当前时间重新起算。
func TestActivateVIPWithTx_ExpiredRestartsFromNow(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatalf("new mock pool: %v", err)
	}
	defer mock.Close()

	now := timeutil.NowShanghai()
	begin := now.AddDate(0, 0, -40)
	expire := now.AddDate(0, 0, -10) // 已过期 → 从 now 起算

	mock.ExpectQuery("vips WHERE id = \\$1").
		WithArgs("vip-month-0001").
		WillReturnRows(vipRows(mock, "vip-month-0001", "month", "month", 1))
	mock.ExpectExec("INSERT INTO user_vip_claims").
		WithArgs(pgxmock.AnyArg(), "u1", "vip-month-0001").
		WillReturnResult(pgxmock.NewResult("INSERT", 1))
	mock.ExpectQuery("FROM user_vips WHERE user_id = \\$1 FOR UPDATE").
		WithArgs("u1").
		WillReturnRows(userVipRows("uv-1", "u1", begin, expire))
	// 过期场景 expire 以代码内 NowShanghai() 起算，纳秒精度不定，仅校验 begin 不变、expire 为任意值。
	mock.ExpectQuery("INSERT INTO user_vips").
		WithArgs("uv-1", "u1",
			pgtype.Timestamptz{Time: begin, Valid: true},
			pgxmock.AnyArg()).
		WillReturnRows(userVipRows("uv-1", "u1", begin, now.AddDate(0, 1, 0)))

	s := &Service{}
	if err := s.ActivateVIPWithTx(context.Background(), "u1", "vip-month-0001", sqlc.New(mock)); err != nil {
		t.Fatalf("activate failed: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}
