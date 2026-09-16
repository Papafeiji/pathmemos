package purge

import (
	"context"
	"crypto/hmac"
	"crypto/sha1"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"

	"papafeiji/backend/pkg/util"
)

const cdnEndpoint = "https://cdn.aliyuncs.com"

// Purger 调用阿里云 CDN RefreshObjectCaches 批量刷新 URL 边缘缓存。
// 凭据复用 OSS AccessKey（需在阿里云侧为该 AccessKey 授予 CDN 刷新权限）。
type Purger struct {
	accessKeyID     string
	accessKeySecret string
	endpoint        string
	http            *http.Client
	now             func() time.Time
	nonce           func() string
}

func NewPurger(accessKeyID, accessKeySecret string) *Purger {
	return &Purger{
		accessKeyID:     accessKeyID,
		accessKeySecret: accessKeySecret,
		endpoint:        cdnEndpoint,
		http:            &http.Client{Timeout: 15 * time.Second},
		now:             time.Now,
		nonce: func() string {
			id, err := util.NewUUID()
			if err != nil {
				return fmt.Sprintf("%d", time.Now().UnixNano())
			}
			return id
		},
	}
}

// Purge 刷新一批公开 URL（调用方保证单批 ≤ MaxBatch）。
func (p *Purger) Purge(ctx context.Context, objectURLs []string) error {
	if len(objectURLs) == 0 {
		return nil
	}
	params := map[string]string{
		"AccessKeyId":      p.accessKeyID,
		"Action":           "RefreshObjectCaches",
		"Format":           "JSON",
		"ObjectPath":       strings.Join(objectURLs, ","),
		"ObjectType":       "File",
		"SignatureMethod":  "HMAC-SHA1",
		"SignatureNonce":   p.nonce(),
		"SignatureVersion": "1.0",
		"Timestamp":        p.now().UTC().Format("2006-01-02T15:04:05Z"),
		"Version":          "2018-05-10",
	}
	params["Signature"] = rpcSignature(http.MethodPost, params, p.accessKeySecret)

	form := url.Values{}
	for k, v := range params {
		form.Set(k, v)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, p.endpoint, strings.NewReader(form.Encode()))
	if err != nil {
		return fmt.Errorf("build cdn request: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := p.http.Do(req)
	if err != nil {
		return fmt.Errorf("cdn request: %w", err)
	}
	defer resp.Body.Close() //nolint:errcheck
	if resp.StatusCode != http.StatusOK {
		body, rerr := io.ReadAll(io.LimitReader(resp.Body, 1024))
		if rerr != nil {
			body = nil
		}
		return fmt.Errorf("cdn refresh status %d: %s", resp.StatusCode, string(body))
	}
	var out struct {
		RequestID string `json:"RequestId"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return fmt.Errorf("cdn refresh decode: %w", err)
	}
	return nil
}

// rpcSignature 计算阿里云 pop RPC V1 签名（HMAC-SHA1，签名时不得含 Signature 参数）。
func rpcSignature(method string, params map[string]string, accessKeySecret string) string {
	keys := make([]string, 0, len(params))
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	pairs := make([]string, 0, len(keys))
	for _, k := range keys {
		pairs = append(pairs, percentEncode(k)+"="+percentEncode(params[k]))
	}
	canonical := strings.Join(pairs, "&")
	stringToSign := method + "&" + percentEncode("/") + "&" + percentEncode(canonical)
	mac := hmac.New(sha1.New, []byte(accessKeySecret+"&"))
	mac.Write([]byte(stringToSign))
	return base64.StdEncoding.EncodeToString(mac.Sum(nil))
}

// percentEncode 按 pop 规范编码（空格转 %20、* 转 %2A、~ 不转义）。
func percentEncode(s string) string {
	s = url.QueryEscape(s)
	s = strings.ReplaceAll(s, "+", "%20")
	s = strings.ReplaceAll(s, "*", "%2A")
	return strings.ReplaceAll(s, "%7E", "~")
}
