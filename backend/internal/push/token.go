package push

import (
	"context"
	"fmt"

	"papafeiji/backend/internal/auth"
	"papafeiji/backend/internal/wxmp"
)

// TokenManager fetches WeChat access tokens for mini-program and official account.
type TokenManager struct {
	mini *auth.WechatClient
	mp   *wxmp.Client
}

// NewTokenManager creates a new token manager.
func NewTokenManager(mini *auth.WechatClient, mp *wxmp.Client) *TokenManager {
	return &TokenManager{mini: mini, mp: mp}
}

// GetMiniToken returns the mini-program access token.
func (m *TokenManager) GetMiniToken(ctx context.Context) (string, error) {
	if m.mini == nil {
		return "", fmt.Errorf("mini program client not configured")
	}
	return m.mini.GetAccessToken(ctx)
}

// GetMpToken returns the official account access token.
func (m *TokenManager) GetMpToken(ctx context.Context) (string, error) {
	if m.mp == nil {
		return "", fmt.Errorf("official account client not configured")
	}
	return m.mp.GetAccessToken(ctx)
}
