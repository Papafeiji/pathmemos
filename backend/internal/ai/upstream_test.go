package ai

import (
	"encoding/json"
	"net/http/httptest"
	"strings"
	"testing"
)

// TestWriteSSEError_Compat 锁定 SSE error 体契约：新字段 code/biz_code 与
// 过渡兼容字段 bizCode 同时下发；待旧版小程序全量更新后可移除 bizCode。
func TestWriteSSEError_Compat(t *testing.T) {
	rec := httptest.NewRecorder()
	if err := writeSSEError(rec, rec, "4290", "AI_DAILY_QUOTA_EXCEEDED", "daily ai chat quota exceeded"); err != nil {
		t.Fatalf("writeSSEError returned error: %v", err)
	}
	body := rec.Body.String()
	if !strings.HasPrefix(body, "event: error\ndata: ") {
		t.Fatalf("unexpected SSE framing: %q", body)
	}
	parts := strings.SplitN(strings.TrimSpace(body), "data: ", 2)
	if len(parts) != 2 {
		t.Fatalf("cannot extract payload from %q", body)
	}
	var payload map[string]string
	if err := json.Unmarshal([]byte(parts[1]), &payload); err != nil {
		t.Fatalf("unmarshal SSE payload: %v (%q)", err, parts[1])
	}
	checks := map[string]string{
		"code":     "4290",
		"biz_code": "AI_DAILY_QUOTA_EXCEEDED",
		"bizCode":  "AI_DAILY_QUOTA_EXCEEDED",
		"message":  "daily ai chat quota exceeded",
	}
	for k, want := range checks {
		if got := payload[k]; got != want {
			t.Errorf("payload[%q] = %q, want %q", k, got, want)
		}
	}
}
