package auth

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"papafeiji/backend/internal/db"
	"papafeiji/backend/internal/db/sqlc"
	"papafeiji/backend/internal/vip"
	"papafeiji/backend/pkg/timeutil"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/pashagolub/pgxmock/v4"
)

// ---- mocks ----

type mockSessions struct {
	createCalled bool
	createUID    string
}

func (m *mockSessions) Create(_ context.Context, userID string) (string, error) {
	m.createCalled = true
	m.createUID = userID
	return "session-1", nil
}

func (m *mockSessions) Delete(_ context.Context, _ string) error { return nil }

func (m *mockSessions) DeleteAll(_ context.Context, _ string) error { return nil }

type mockAuthVIP struct {
	issueCalls int
}

func (m *mockAuthVIP) GetVIPInfo(_ context.Context, _ string) (vip.Info, error) {
	return vip.Info{IsVIP: false}, nil
}

func (m *mockAuthVIP) IssueTrialVIPWithTx(_ context.Context, _ string, _ *sqlc.Queries) error {
	m.issueCalls++
	return nil
}

func (m *mockAuthVIP) ExtendVIPDaysWithTx(_ context.Context, _ string, _ int, _ *sqlc.Queries) error {
	return nil
}

// rewriteTransport 把微信 API 请求重写到本机 httptest server，避免改动生产代码。
type rewriteTransport struct {
	target *url.URL
}

func (t *rewriteTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	clone := req.Clone(req.Context())
	clone.URL.Scheme = t.target.Scheme
	clone.URL.Host = t.target.Host
	clone.Host = ""
	return http.DefaultTransport.RoundTrip(clone)
}

func newWechatTestServer(t *testing.T) (*WechatClient, *httptest.Server) {
	t.Helper()
	mux := http.NewServeMux()
	mux.HandleFunc("/sns/jscode2session", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if code := r.URL.Query().Get("js_code"); code == "valid-code" {
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"openid": "openid-1", "session_key": "sk-1", "unionid": "",
			})
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"errcode": 40029, "errmsg": "invalid code"})
	})
	srv := httptest.NewServer(mux)
	t.Cleanup(srv.Close)

	u, err := url.Parse(srv.URL)
	if err != nil {
		t.Fatalf("parse test server url: %v", err)
	}
	return &WechatClient{
		appID:      "appid-test",
		secret:     "secret-test",
		httpClient: &http.Client{Transport: &rewriteTransport{target: u}},
		rdb:        nil,
	}, srv
}

// userRow 构造 sqlc.GetUserByIDRow 扫描所需的 18 列 mock 行。
func userRow(id, openID string) *pgxmock.Rows {
	now := time.Now()
	return pgxmock.NewRows([]string{
		"id", "open_id", "unionid", "phone_number", "avatar", "avatar_file_id",
		"nickname", "user_type", "phone_bind_time", "auto_record_enabled",
		"personal_family_id", "current_family_id", "invited_by", "lang",
		"created_at", "updated_at", "abnormal_subscribe_accepted", "last_active_at",
	}).AddRow(id, openID, nil, nil, nil, nil,
		pgtype.Text{String: "测试用户", Valid: true}, "wechat", nil, false,
		pgtype.Text{String: "fam-" + id, Valid: true}, pgtype.Text{String: "fam-" + id, Valid: true},
		nil, "zh", now, now, false, now)
}

func loginRequest(code string) *http.Request {
	body := strings.NewReader("{\"code\":\"" + code + "\"}")
	req := httptest.NewRequest(http.MethodPost, "/auth/login", body)
	req.Header.Set("Content-Type", "application/json")
	return req
}

func decodeLoginResp(t *testing.T, rec *httptest.ResponseRecorder) (string, map[string]interface{}) {
	t.Helper()
	var resp struct {
		Code    string                 `json:"code"`
		Message string                 `json:"message"`
		Data    map[string]interface{} `json:"data"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response %q: %v", rec.Body.String(), err)
	}
	return resp.Code, resp.Data
}

// ---- phoneModificationLockedToday ----

func TestPhoneModificationLockedToday(t *testing.T) {
	today := timeutil.NowShanghai()
	yesterday := today.AddDate(0, 0, -1)

	base := sqlc.GetUserByIDRow{}

	// 今天绑定过 → true
	todayUser := base
	todayUser.PhoneBindTime = pgtype.Timestamptz{Time: today, Valid: true}
	if !phoneModificationLockedToday(todayUser) {
		t.Fatal("bind today should be locked")
	}

	// 非今天（昨天）绑定 → false
	oldUser := base
	oldUser.PhoneBindTime = pgtype.Timestamptz{Time: yesterday, Valid: true}
	if phoneModificationLockedToday(oldUser) {
		t.Fatal("bind yesterday should NOT be locked")
	}

	// 未绑定（PhoneBindTime 无效）→ false
	if phoneModificationLockedToday(base) {
		t.Fatal("no bind time should NOT be locked")
	}
}

// ---- Login flow ----

func newLoginHandler(mock pgxmock.PgxPoolIface, wc *WechatClient) (*Handler, *mockSessions, *mockAuthVIP) {
	sess := &mockSessions{}
	v := &mockAuthVIP{}
	return &Handler{
		pool:       db.NewPoolWithDBTX(mock),
		sessions:   sess,
		wechat:     wc,
		vipService: v,
	}, sess, v
}

// TestLogin_ValidCode_ExistingUser 有效 code → 命中已有用户 → 更新 session_key → Create 会话 → 返回 session。
func TestLogin_ValidCode_ExistingUser(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatalf("new mock pool: %v", err)
	}
	defer mock.Close()

	// findOrCreateUser: UnionID 为空跳过 GetUserByUnionID；GetUserByOpenID 命中已有用户
	mock.ExpectQuery("FROM users WHERE open_id = \\$1").
		WithArgs("openid-1").
		WillReturnRows(userRow("u1", "openid-1"))
	mock.ExpectExec("UPDATE users SET session_key = \\$2").
		WithArgs("u1", pgtype.Text{String: "sk-1", Valid: true}).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))
	mock.ExpectQuery("FROM users WHERE id = \\$1").
		WithArgs("u1").
		WillReturnRows(userRow("u1", "openid-1"))
	// Login: UnionID 为空跳过 LinkWxMPAccountByUnionID；GetWxMPAccountByUserID 无记录
	mock.ExpectQuery("FROM wx_mp_accounts").
		WithArgs(pgtype.Text{String: "u1", Valid: true}).
		WillReturnError(pgx.ErrNoRows)

	wc, _ := newWechatTestServer(t)
	h, sess, _ := newLoginHandler(mock, wc)

	rec := httptest.NewRecorder()
	h.Login(rec, loginRequest("valid-code"))

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body=%s", rec.Code, rec.Body.String())
	}
	code, data := decodeLoginResp(t, rec)
	if code != "0000" {
		t.Fatalf("resp code = %q, want 0000; data=%v", code, data)
	}
	if data["sessionId"] != "session-1" {
		t.Fatalf("sessionId = %v, want session-1", data["sessionId"])
	}
	if data["newUser"] != false {
		t.Fatalf("newUser = %v, want false", data["newUser"])
	}
	userInfo, _ := data["userInfo"].(map[string]interface{})
	if userInfo == nil || userInfo["id"] != "u1" {
		t.Fatalf("userInfo.id = %v, want u1", userInfo)
	}
	if !sess.createCalled || sess.createUID != "u1" {
		t.Fatalf("sessions.Create called=%v uid=%q, want u1", sess.createCalled, sess.createUID)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// TestLogin_ValidCode_NewUser 有效 code → 无已有用户 → tx 内创建用户（家庭/成员/试用 VIP/邀请码）→ 返回 session。
func TestLogin_ValidCode_NewUser(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatalf("new mock pool: %v", err)
	}
	defer mock.Close()

	// findOrCreateUser: GetUserByOpenID 无记录 → 进入创建事务
	mock.ExpectQuery("FROM users WHERE open_id = \\$1").
		WithArgs("openid-1").
		WillReturnError(pgx.ErrNoRows)
	mock.ExpectBegin()
	mock.ExpectQuery("INSERT INTO families").
		WithArgs(pgxmock.AnyArg(), true).
		WillReturnRows(pgxmock.NewRows([]string{"id"}).AddRow("fam-new"))
	mock.ExpectQuery("INSERT INTO users").
		WithArgs(pgxmock.AnyArg(), "openid-1", pgtype.Text{}, pgtype.Text{}, pgtype.Text{},
			pgtype.Text{}, pgxmock.AnyArg(), "wechat", pgtype.Timestamptz{}, false,
			pgtype.Text{String: "sk-1", Valid: true}, pgxmock.AnyArg(), pgxmock.AnyArg(), pgtype.Text{}).
		WillReturnRows(pgxmock.NewRows([]string{
			"id", "open_id", "unionid", "phone_number", "avatar", "avatar_file_id",
			"nickname", "user_type", "phone_bind_time", "auto_record_enabled",
			"personal_family_id", "current_family_id", "created_at", "updated_at",
			"session_key", "invited_by", "abnormal_subscribe_accepted",
			"abnormal_alert_sent_at", "last_active_at", "lang", "image_storage_bytes",
		}).AddRow("u-new", "openid-1", nil, nil, nil, nil, "测试", "wechat", nil,
			false, "fam-new", "fam-new", time.Now(), time.Now(), "sk-1", nil,
			false, nil, time.Now(), "zh", int64(0)))
	mock.ExpectQuery("INSERT INTO family_members").
		WithArgs(pgxmock.AnyArg(), pgxmock.AnyArg(), pgxmock.AnyArg(), "owner").
		WillReturnRows(pgxmock.NewRows([]string{"id"}).AddRow("mem-new"))
	mock.ExpectQuery("INSERT INTO user_invite_codes").
		WithArgs(pgxmock.AnyArg(), pgxmock.AnyArg()).
		WillReturnRows(pgxmock.NewRows([]string{
			"user_id", "short_code", "created_at", "expires_at", "used_at",
		}).AddRow("u-new", "ABCD1234", time.Now(), nil, nil))
	mock.ExpectCommit()
	mock.ExpectQuery("FROM users WHERE id = \\$1").
		WithArgs(pgxmock.AnyArg()).
		WillReturnRows(userRow("u-new", "openid-1"))
	// Login: GetWxMPAccountByUserID 无记录
	mock.ExpectQuery("FROM wx_mp_accounts").
		WithArgs(pgtype.Text{String: "u-new", Valid: true}).
		WillReturnError(pgx.ErrNoRows)

	wc, _ := newWechatTestServer(t)
	h, sess, v := newLoginHandler(mock, wc)

	rec := httptest.NewRecorder()
	h.Login(rec, loginRequest("valid-code"))

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body=%s", rec.Code, rec.Body.String())
	}
	code, data := decodeLoginResp(t, rec)
	if code != "0000" {
		t.Fatalf("resp code = %q, want 0000; data=%v", code, data)
	}
	if data["sessionId"] != "session-1" {
		t.Fatalf("sessionId = %v, want session-1", data["sessionId"])
	}
	if data["newUser"] != true {
		t.Fatalf("newUser = %v, want true", data["newUser"])
	}
	if !sess.createCalled || sess.createUID != "u-new" {
		t.Fatalf("sessions.Create called=%v uid=%q, want u-new", sess.createCalled, sess.createUID)
	}
	if v.issueCalls != 1 {
		t.Fatalf("IssueTrialVIPWithTx calls = %d, want 1", v.issueCalls)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// TestLogin_InvalidCode 无效 code（errcode=40029）→ 400 invalid wechat code，不触碰 DB。
func TestLogin_InvalidCode(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatalf("new mock pool: %v", err)
	}
	defer mock.Close()

	wc, _ := newWechatTestServer(t)
	h, _, _ := newLoginHandler(mock, wc)

	rec := httptest.NewRecorder()
	h.Login(rec, loginRequest("bad-code"))

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400; body=%s", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), "invalid wechat code") {
		t.Fatalf("body = %s, want message invalid wechat code", rec.Body.String())
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}
