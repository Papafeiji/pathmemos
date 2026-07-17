package mcp

import (
	"context"
	"encoding/json"
	"testing"
)

func callInitialize(t *testing.T, h *Handler, protocolVersion string) *jsonRPCResponse {
	t.Helper()
	params, _ := json.Marshal(map[string]string{"protocolVersion": protocolVersion})
	return h.processMessage(context.Background(), "user-1", jsonRPCRequest{
		JSONRPC: "2.0",
		ID:      1,
		Method:  "initialize",
		Params:  params,
	})
}

func TestInitializeProtocolVersions(t *testing.T) {
	h := &Handler{}

	// 已知版本与未来版本均应通过并回显客户端版本
	for _, v := range []string{"2024-11-05", "2025-03-26", "2025-06-18", "2099-01-01"} {
		resp := callInitialize(t, h, v)
		if resp.Error != nil {
			t.Fatalf("version %s: unexpected error %s", v, resp.Error.Message)
		}
		result, ok := resp.Result.(map[string]interface{})
		if !ok {
			t.Fatalf("version %s: unexpected result type", v)
		}
		if result["protocolVersion"] != v {
			t.Fatalf("version %s: expected echo, got %v", v, result["protocolVersion"])
		}
	}

	// 低于最低支持的版本被拒绝
	resp := callInitialize(t, h, "2024-10-31")
	if resp.Error == nil {
		t.Fatal("expected error for unsupported protocol version")
	}
	if resp.Error.Code != -32602 {
		t.Fatalf("expected -32602, got %d", resp.Error.Code)
	}

	resp = callInitialize(t, h, "")
	if resp.Error != nil {
		t.Fatalf("empty version should pass with default, got %s", resp.Error.Message)
	}
	result := resp.Result.(map[string]interface{})
	if result["protocolVersion"] != mcpProtocolVersion {
		t.Fatalf("empty version: expected default %s, got %v", mcpProtocolVersion, result["protocolVersion"])
	}
}
