// Package auth provides related functionality.
package auth

import "errors"

var (
	ErrWechatInvalidCode = errors.New("invalid wechat code")
	ErrWechatService     = errors.New("wechat service error")
)
