// Package wechatsecrets 提供开源版内置的微信小程序默认 AppID/Secret。
// 开源版用户无需手动填写即可使用小程序登录。
// AppID/Secret 属于 SaaS 运营的小程序凭证，已公开在仓库中供自部署用户使用。
package wechatsecrets

const appID = "wxe56d190a14826b0d"
const secret = "068540ba66cd08ffca481f8d85b58a83"

// DefaultAppID 返回内置的微信小程序 AppID。
func DefaultAppID() string {
	return appID
}

// DefaultSecret 返回内置的微信小程序 Secret。
func DefaultSecret() string {
	return secret
}
