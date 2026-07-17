// Package payment provides related functionality.
package payment

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"strings"
)

const outTradeNoAlphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

func GenerateOutTradeNo(userID, vipID string) (string, error) {
	// out_trade_no 长度上限为 32。在明文回调模式下，订单号的不可预测性是
	// 防"伪造首次发货通知"的关键安全边界（P030），因此最大化随机部分。
	// userID/vipID 仅用于日志/调试，不参与订单号构造。
	_ = userID
	_ = vipID
	return randomString(32)
}

func randomString(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("random read: %w", err)
	}
	for i := range b {
		b[i] = outTradeNoAlphabet[int(b[i])%len(outTradeNoAlphabet)]
	}
	return string(b), nil
}

func MatchPrice(prices []byte, vipType string) (amount int32, ok bool) {
	if len(prices) == 0 {
		return 0, false
	}
	var list []struct {
		Type           string `json:"type"`
		Amount         int32  `json:"amount"`
		Duration       int32  `json:"duration"`
		Unit           string `json:"unit"`
		OriginalAmount *int32 `json:"originalAmount,omitempty"`
	}
	if err := json.Unmarshal(prices, &list); err != nil {
		return 0, false
	}
	for _, p := range list {
		if strings.EqualFold(p.Type, vipType) && p.Amount > 0 {
			return p.Amount, true
		}
	}
	return 0, false
}
