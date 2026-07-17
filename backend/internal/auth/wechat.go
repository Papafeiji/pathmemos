package auth

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"papafeiji/backend/internal/config"

	goredis "github.com/redis/go-redis/v9"
)

var accessTokenLeakRe = regexp.MustCompile(`access_token=[^&\s]+`)

func sanitizeWechatError(err error, secret string) error {
	if err == nil {
		return nil
	}
	msg := err.Error()
	if secret != "" {
		msg = strings.ReplaceAll(msg, secret, "***")
	}
	msg = accessTokenLeakRe.ReplaceAllString(msg, "access_token=***")
	return fmt.Errorf("%s", msg)
}

type WechatSession struct {
	OpenID     string `json:"openid"`
	UnionID    string `json:"unionid"`
	SessionKey string `json:"session_key"`
}

type WechatClient struct {
	appID      string
	secret     string
	httpClient *http.Client
	rdb        *goredis.Client
}

func NewWechatClient(cfg *config.Config, rdb *goredis.Client) *WechatClient {
	return &WechatClient{
		appID:      cfg.WechatAppID,
		secret:     cfg.WechatSecret,
		httpClient: config.HTTPClient(),
		rdb:        rdb,
	}
}

func (c *WechatClient) Jscode2session(ctx context.Context, code string) (*WechatSession, error) {
	if c.appID == "" || c.secret == "" {
		return nil, fmt.Errorf("wechat appid or secret not configured")
	}
	if code == "" {
		return nil, fmt.Errorf("code is empty")
	}

	u := fmt.Sprintf(
		"https://api.weixin.qq.com/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code",
		url.QueryEscape(c.appID),
		url.QueryEscape(c.secret),
		url.QueryEscape(code),
	)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, fmt.Errorf("build jscode2session request: %w", err)
	}
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request jscode2session: %w", sanitizeWechatError(err, c.secret))
	}
	//nolint:errcheck
	defer resp.Body.Close() //nolint:errcheck

	body, err := io.ReadAll(io.LimitReader(resp.Body, 8*1024))
	if err != nil {
		return nil, fmt.Errorf("read jscode2session response: %w", err)
	}

	var result struct {
		OpenID     string `json:"openid"`
		UnionID    string `json:"unionid"`
		SessionKey string `json:"session_key"`
		ErrCode    int    `json:"errcode"`
		ErrMsg     string `json:"errmsg"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("parse jscode2session response: %w", err)
	}

	if result.ErrCode != 0 {
		slog.ErrorContext(ctx, "wechat jscode2session error", slog.Int("errcode", result.ErrCode), slog.String("errmsg", result.ErrMsg))
		switch result.ErrCode {
		case 40029, 40163, -1:
			return nil, fmt.Errorf("%w: code=%d msg=%s", ErrWechatInvalidCode, result.ErrCode, result.ErrMsg)
		default:
			return nil, fmt.Errorf("%w: code=%d msg=%s", ErrWechatService, result.ErrCode, result.ErrMsg)
		}
	}

	return &WechatSession{
		OpenID:     result.OpenID,
		UnionID:    result.UnionID,
		SessionKey: result.SessionKey,
	}, nil
}

func (c *WechatClient) GetPhoneNumber(ctx context.Context, code string) (string, error) {
	if c.appID == "" || c.secret == "" {
		return "", fmt.Errorf("wechat appid or secret not configured")
	}
	if code == "" {
		return "", fmt.Errorf("phone code is empty")
	}

	accessToken, err := c.GetAccessToken(ctx)
	if err != nil {
		return "", fmt.Errorf("get access token: %w", err)
	}

	u := fmt.Sprintf("https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=%s", url.QueryEscape(accessToken))

	payload, err := json.Marshal(map[string]string{"code": code})
	if err != nil {
		return "", fmt.Errorf("marshal get phone number request: %w", err)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, u, bytes.NewReader(payload))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("request phone number: %w", sanitizeWechatError(err, ""))
	}
	//nolint:errcheck
	defer resp.Body.Close() //nolint:errcheck

	body, err := io.ReadAll(io.LimitReader(resp.Body, 8*1024))
	if err != nil {
		return "", fmt.Errorf("read phone response: %w", err)
	}

	var result struct {
		ErrCode   int    `json:"errcode"`
		ErrMsg    string `json:"errmsg"`
		PhoneInfo struct {
			PhoneNumber string `json:"phoneNumber"`
		} `json:"phone_info"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return "", fmt.Errorf("parse phone response: %w", err)
	}

	if result.ErrCode != 0 {
		slog.ErrorContext(ctx, "wechat getPhoneNumber error", slog.Int("errcode", result.ErrCode), slog.String("errmsg", result.ErrMsg))
		switch result.ErrCode {
		case 40029, 40163, -1:
			return "", fmt.Errorf("%w: code=%d msg=%s", ErrWechatInvalidCode, result.ErrCode, result.ErrMsg)
		default:
			return "", fmt.Errorf("%w: code=%d msg=%s", ErrWechatService, result.ErrCode, result.ErrMsg)
		}
	}

	if result.PhoneInfo.PhoneNumber == "" {
		return "", fmt.Errorf("empty phone number")
	}

	return result.PhoneInfo.PhoneNumber, nil
}

type accessTokenResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   int    `json:"expires_in"`
	ErrCode     int    `json:"errcode"`
	ErrMsg      string `json:"errmsg"`
}

const accessTokenCacheKey = "wechat:access_token:%s"
const accessTokenCacheTTL = 110 * time.Minute

func (c *WechatClient) GetAccessToken(ctx context.Context) (string, error) {
	cacheKey := fmt.Sprintf(accessTokenCacheKey, c.appID)
	if c.rdb != nil {
		cached, err := c.rdb.Get(ctx, cacheKey).Result()
		if err == nil && cached != "" {
			return cached, nil
		}
		if err != nil && err != goredis.Nil {
			slog.WarnContext(ctx, "read access token cache failed", slog.Any("error", err))
		}
	}

	// Use the stable access token endpoint to avoid token invalidation races
	// when multiple goroutines fetch tokens concurrently.
	u := "https://api.weixin.qq.com/cgi-bin/stable_token"
	payload, err := json.Marshal(map[string]string{
		"grant_type": "client_credential",
		"appid":      c.appID,
		"secret":     c.secret,
	})
	if err != nil {
		return "", fmt.Errorf("marshal access token request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, u, bytes.NewReader(payload))
	if err != nil {
		return "", fmt.Errorf("build access token request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("request access token: %w", sanitizeWechatError(err, c.secret))
	}
	//nolint:errcheck
	defer resp.Body.Close() //nolint:errcheck

	body, err := io.ReadAll(io.LimitReader(resp.Body, 8*1024))
	if err != nil {
		return "", fmt.Errorf("read access token response: %w", err)
	}

	var result accessTokenResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return "", fmt.Errorf("parse access token response: %w", err)
	}

	if result.ErrCode != 0 {
		return "", fmt.Errorf("wechat access token error: code=%d msg=%s", result.ErrCode, result.ErrMsg)
	}

	if result.AccessToken == "" {
		return "", fmt.Errorf("empty access token")
	}

	if c.rdb != nil {
		if err := c.rdb.Set(ctx, cacheKey, result.AccessToken, accessTokenCacheTTL).Err(); err != nil {
			slog.WarnContext(ctx, "cache access token failed", slog.Any("error", err))
		}
	}

	return result.AccessToken, nil
}

func (c *WechatClient) ClearAccessToken(ctx context.Context) {
	if c.rdb == nil {
		return
	}
	cacheKey := fmt.Sprintf(accessTokenCacheKey, c.appID)
	if err := c.rdb.Del(ctx, cacheKey).Err(); err != nil {
		slog.WarnContext(ctx, "clear access token cache failed", slog.Any("error", err))
	}
}
