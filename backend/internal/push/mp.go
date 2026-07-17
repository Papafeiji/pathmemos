package push

import (
	"context"
	"fmt"
	"net/http"

	"papafeiji/backend/internal/config"
)

const mpTemplateSendURL = "https://api.weixin.qq.com/cgi-bin/message/template/send"

// MPTemplateSender sends official account template messages.
type MPTemplateSender struct {
	tokenMgr *TokenManager
	cfg      *config.Config
	client   *http.Client
}

// NewMPTemplateSender creates a new official account template sender.
func NewMPTemplateSender(tokenMgr *TokenManager, cfg *config.Config) *MPTemplateSender {
	return &MPTemplateSender{
		tokenMgr: tokenMgr,
		cfg:      cfg,
		client:   config.HTTPClient(),
	}
}

// SendAbnormalAlert sends the abnormal alert via official account template message.
func (s *MPTemplateSender) SendAbnormalAlert(ctx context.Context, mpOpenid, mpAppID, pagePath, datetime string) error {
	msg := mpTemplateMessage{
		ToUser:     mpOpenid,
		TemplateID: TemplateIDAbnormalMP,
		MiniProgram: &mpTemplateMiniProgram{
			AppID:    mpAppID,
			PagePath: pagePath,
		},
		Data: map[string]mpDataItem{
			"time9":  {Value: datetime, Color: "#000000"},
			"thing5": {Value: "后台定位已被系统暂停，请重新打开小程序", Color: "#000000"},
		},
	}
	return s.send(ctx, msg)
}

// SendNewPlaceAlert sends the new place alert via official account template message.
func (s *MPTemplateSender) SendNewPlaceAlert(ctx context.Context, mpOpenid, mpAppID, pagePath, date, timeStr, placeName string) error {
	placeName = truncateRunes(placeName, 20)
	msg := mpTemplateMessage{
		ToUser:     mpOpenid,
		TemplateID: TemplateIDNewPlace,
		MiniProgram: &mpTemplateMiniProgram{
			AppID:    mpAppID,
			PagePath: pagePath,
		},
		Data: map[string]mpDataItem{
			"time1":  {Value: date, Color: "#000000"},
			"time6":  {Value: timeStr, Color: "#000000"},
			"thing5": {Value: placeName, Color: "#000000"},
		},
	}
	return s.send(ctx, msg)
}

func (s *MPTemplateSender) send(ctx context.Context, msg mpTemplateMessage) error {
	token, err := s.tokenMgr.GetMpToken(ctx)
	if err != nil {
		return fmt.Errorf("get mp token: %w", err)
	}
	return postWechatMessage(ctx, s.client, token, mpTemplateSendURL, msg, "mp template", msg.TemplateID, msg.ToUser)
}

func truncateRunes(s string, limit int) string {
	runes := []rune(s)
	if len(runes) <= limit {
		return s
	}
	return string(runes[:limit-1]) + "…"
}
