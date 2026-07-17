package push

// Template IDs for WeChat message push.
const (
	TemplateIDAbnormalMP   = "9r_Ij5IPLitRyIu-YNjI6S2nVeniMRQ4V4sGmGZalq0"
	TemplateIDAbnormalMini = "i7mcEEMDbhYU1oAC1-E0G0xvIBCmTl6f9c3jOq11m3g"
	TemplateIDNewPlace     = "RQmSHeUlGYtrkGJVDZ6bEZ7OaGZUH9xNWmtb0huu8cc"
)

// MiniProgramState for subscribe message.
const (
	MiniProgramStateFormal = "formal"
	MiniProgramStateTrial  = "trial"
)

// mpTemplateMessage is the payload for official account template message.
type mpTemplateMessage struct {
	ToUser      string                 `json:"touser"`
	TemplateID  string                 `json:"template_id"`
	URL         string                 `json:"url,omitempty"`
	MiniProgram *mpTemplateMiniProgram `json:"miniprogram,omitempty"`
	Data        map[string]mpDataItem  `json:"data"`
}

type mpTemplateMiniProgram struct {
	AppID    string `json:"appid"`
	PagePath string `json:"pagepath"`
}

type mpDataItem struct {
	Value string `json:"value"`
	Color string `json:"color"`
}

// miniSubscribeMessage is the payload for mini-program subscribe message.
type miniSubscribeMessage struct {
	ToUser           string                  `json:"touser"`
	TemplateID       string                  `json:"template_id"`
	Page             string                  `json:"page"`
	MiniProgramState string                  `json:"miniprogram_state"`
	Lang             string                  `json:"lang"`
	Data             map[string]miniDataItem `json:"data"`
}

type miniDataItem struct {
	Value string `json:"value"`
}

// wechatError is the common error response from WeChat APIs.
type wechatError struct {
	ErrCode int    `json:"errcode"`
	ErrMsg  string `json:"errmsg"`
}
