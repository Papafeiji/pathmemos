package payment

import (
	"context"
	"crypto/hmac"
	"crypto/sha1"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"sort"

	"papafeiji/backend/internal/config"
)

type WechatVirtualPayClient struct {
	appID         string
	offerID       string
	appKeyProd    string
	appKeySandbox string
}

func NewWechatVirtualPayClient(cfg *config.Config) *WechatVirtualPayClient {
	return &WechatVirtualPayClient{
		appID:         cfg.WechatAppID,
		offerID:       cfg.WechatVirtualOfferID,
		appKeyProd:    cfg.WechatVirtualAppKeyProd,
		appKeySandbox: cfg.WechatVirtualAppKeySandbox,
	}
}

type VirtualPayRequest struct {
	OutTradeNo  string
	OpenID      string
	OfferID     string
	ProductID   string
	GoodsPrice  int32
	Env         int32
	BuyQuantity int32
	Attach      string
}

type VirtualPayResponse struct {
	OfferID   string
	SignData  string
	PaySig    string
	Signature string
	Mode      string
}

func (c *WechatVirtualPayClient) appKey(env int32) string {
	if env == 1 {
		return c.appKeySandbox
	}
	return c.appKeyProd
}

type signDataPayload struct {
	OfferID      string `json:"offerId"`
	BuyQuantity  int32  `json:"buyQuantity"`
	Env          int32  `json:"env"`
	CurrencyType string `json:"currencyType"`
	ProductID    string `json:"productId"`
	GoodsPrice   int32  `json:"goodsPrice"`
	OutTradeNo   string `json:"outTradeNo"`
	Attach       string `json:"attach"`
}

func (c *WechatVirtualPayClient) BuildSignData(req VirtualPayRequest) (string, error) {
	data := signDataPayload{
		OfferID:      firstNonEmpty(req.OfferID, c.offerID),
		BuyQuantity:  req.BuyQuantity,
		Env:          req.Env,
		CurrencyType: "CNY",
		ProductID:    req.ProductID,
		GoodsPrice:   req.GoodsPrice,
		OutTradeNo:   req.OutTradeNo,
		Attach:       req.Attach,
	}
	b, err := json.Marshal(data)
	if err != nil {
		return "", fmt.Errorf("marshal sign data: %w", err)
	}
	return string(b), nil
}

func (c *WechatVirtualPayClient) GenerateSigns(signData, sessionKey string, env int32) (paySig, signature string, err error) {
	appKey := c.appKey(env)
	if appKey == "" {
		return "", "", fmt.Errorf("virtual pay app key not configured")
	}
	if sessionKey == "" {
		return "", "", fmt.Errorf("session key is empty")
	}
	paySig = hmacSHA256Hex(appKey, "requestVirtualPayment&"+signData)
	signature = hmacSHA256Hex(sessionKey, signData)
	return paySig, signature, nil
}

func (c *WechatVirtualPayClient) Request(ctx context.Context, req VirtualPayRequest, sessionKey string) (*VirtualPayResponse, error) {
	offerID := firstNonEmpty(req.OfferID, c.offerID)
	if offerID == "" {
		return nil, fmt.Errorf("virtual pay offer id not configured")
	}
	if req.ProductID == "" {
		return nil, fmt.Errorf("virtual pay product id is required")
	}

	signData, err := c.BuildSignData(req)
	if err != nil {
		return nil, err
	}
	paySig, signature, err := c.GenerateSigns(signData, sessionKey, req.Env)
	if err != nil {
		return nil, err
	}

	return &VirtualPayResponse{
		OfferID:   offerID,
		SignData:  signData,
		PaySig:    paySig,
		Signature: signature,
		Mode:      "short_series_goods",
	}, nil
}

func hmacSHA256Hex(key, message string) string {
	h := hmac.New(sha256.New, []byte(key))
	_, _ = h.Write([]byte(message))
	return hex.EncodeToString(h.Sum(nil))
}

func firstNonEmpty(a, b string) string {
	if a != "" {
		return a
	}
	return b
}

func verifyWechatMsgSignature(token, timestamp, nonce, signature string) bool {
	arr := []string{token, timestamp, nonce}
	sort.Strings(arr)
	sum := sha1.Sum([]byte(arr[0] + arr[1] + arr[2]))
	expected := hex.EncodeToString(sum[:])
	return subtle.ConstantTimeCompare([]byte(expected), []byte(signature)) == 1
}
