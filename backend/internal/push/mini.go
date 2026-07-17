// Package push provides related functionality.
package push

import (
	"context"
	"fmt"
	"net/http"

	"papafeiji/backend/internal/config"
)

const miniSubscribeSendURL = "https://api.weixin.qq.com/cgi-bin/message/subscribe/send"

// MiniSubscribeSender sends mini-program subscribe messages.
type MiniSubscribeSender struct {
	tokenMgr *TokenManager
	cfg      *config.Config
	client   *http.Client
}

// NewMiniSubscribeSender creates a new mini-program subscribe sender.
func NewMiniSubscribeSender(tokenMgr *TokenManager, cfg *config.Config) *MiniSubscribeSender {
	return &MiniSubscribeSender{
		tokenMgr: tokenMgr,
		cfg:      cfg,
		client:   config.HTTPClient(),
	}
}

// SendAbnormalAlert sends the abnormal alert via mini-program subscribe message.
func (s *MiniSubscribeSender) SendAbnormalAlert(ctx context.Context, miniOpenid, pagePath, datetime string) error {
	msg := miniSubscribeMessage{
		ToUser:           miniOpenid,
		TemplateID:       TemplateIDAbnormalMini,
		Page:             pagePath,
		MiniProgramState: s.miniProgramState(),
		Lang:             "zh_CN",
		Data: map[string]miniDataItem{
			"thing5": {Value: "后台定位已被系统暂停，请重新打开小程序"},
			"time4":  {Value: datetime},
		},
	}
	return s.send(ctx, msg)
}

func (s *MiniSubscribeSender) miniProgramState() string {
	if s.cfg != nil && s.cfg.WechatMiniLinkEnvVersion == "release" {
		return MiniProgramStateFormal
	}
	return MiniProgramStateTrial
}

func (s *MiniSubscribeSender) send(ctx context.Context, msg miniSubscribeMessage) error {
	token, err := s.tokenMgr.GetMiniToken(ctx)
	if err != nil {
		return fmt.Errorf("get mini token: %w", err)
	}
	return postWechatMessage(ctx, s.client, token, miniSubscribeSendURL, msg, "mini subscribe", msg.TemplateID, msg.ToUser)
}
