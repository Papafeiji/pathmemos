package push

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"

	"net/http"
	"net/url"
	"regexp"
)

var accessTokenLeakRe = regexp.MustCompile(`access_token=[^&\s]+`)

// sanitizeTokenFromError redacts access_token values from error strings to avoid leaking secrets in logs.
func sanitizeTokenFromError(err error) error {
	if err == nil {
		return nil
	}
	return fmt.Errorf("%s", accessTokenLeakRe.ReplaceAllString(err.Error(), "access_token=***"))
}

// postWechatMessage sends a JSON message to a WeChat endpoint using the given access token.
func postWechatMessage(ctx context.Context, client *http.Client, token, endpoint string, msg interface{}, action, templateID, openID string) error {
	u := fmt.Sprintf("%s?access_token=%s", endpoint, url.QueryEscape(token))
	payload, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("marshal %s message: %w", action, err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, u, bytes.NewReader(payload))
	if err != nil {
		return fmt.Errorf("build %s request: %w", action, sanitizeTokenFromError(err))
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("request %s send: %w", action, sanitizeTokenFromError(err))
	}
	defer resp.Body.Close() //nolint:errcheck

	body, err := io.ReadAll(io.LimitReader(resp.Body, 8*1024))
	if err != nil {
		return fmt.Errorf("read %s response: %w", action, err)
	}

	var result wechatError
	if err := json.Unmarshal(body, &result); err != nil {
		return fmt.Errorf("parse %s response: %w", action, err)
	}
	if result.ErrCode != 0 {

		return fmt.Errorf("%s send error: code=%d msg=%s", action, result.ErrCode, result.ErrMsg)
	}
	return nil
}
