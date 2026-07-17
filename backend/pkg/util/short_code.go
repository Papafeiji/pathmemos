package util

import (
	"crypto/rand"
	"math/big"
)

// ShortCodeChars 是邀请码/短 ID 使用的字符集，去除了容易混淆的 0,1,I,O。
const ShortCodeChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

// NewShortCode 生成指定长度的随机短码。
func NewShortCode(length int) (string, error) {
	chars := []rune(ShortCodeChars)
	max := big.NewInt(int64(len(chars)))
	b := make([]rune, length)
	for i := 0; i < length; i++ {
		n, err := rand.Int(rand.Reader, max)
		if err != nil {
			return "", err
		}
		b[i] = chars[n.Int64()]
	}
	return string(b), nil
}
