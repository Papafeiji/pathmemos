// Package wechatsecrets 把微信小程序默认配置加密后内置在代码中，
// 开源版用户无需手动填写即可运行。密钥派生自代码中的固定盐，
// 只能防止普通用户直接读取明文，不能防御有心的逆向分析。
package wechatsecrets

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
)

const (
	// masterSalt 是固定盐，与密文一起存在代码里。
	// 注意：这只是“不让明文直接出现在源码”的轻量防护，不是高强度保密。
	masterSalt = "papafeiji-open-v1-9f8e7d6c5b4a3210"

	encryptedAppID  = "WdilkzPpbRRrpRmENz5ToqOBfPZPtOxWJKFIXjnNUDGeZA=="
	nonceAppID      = "jROBm63wlCcMXm8n"
	encryptedSecret = "RjWRx8qTdZbNBiqTirOkoNnb7+8QQv7zZ5lnnUM4BqmE0E57NJvU0MG7GYUjiOXw"
	nonceSecret     = "Bkc7+4QRjsR2mubE"
)

func deriveKey() [32]byte {
	return sha256.Sum256([]byte(masterSalt))
}

func decrypt(ciphertextB64, nonceB64 string) (string, error) {
	if ciphertextB64 == "" || ciphertextB64 == "REPLACE_WITH_ENCRYPTED_APPID" || ciphertextB64 == "REPLACE_WITH_ENCRYPTED_SECRET" {
		return "", fmt.Errorf("wechat secrets not initialized")
	}

	ciphertext, err := base64.StdEncoding.DecodeString(ciphertextB64)
	if err != nil {
		return "", fmt.Errorf("decode ciphertext: %w", err)
	}
	nonce, err := base64.StdEncoding.DecodeString(nonceB64)
	if err != nil {
		return "", fmt.Errorf("decode nonce: %w", err)
	}

	key := deriveKey()
	block, err := aes.NewCipher(key[:])
	if err != nil {
		return "", fmt.Errorf("new cipher: %w", err)
	}
	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("new gcm: %w", err)
	}

	plaintext, err := aesgcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", fmt.Errorf("decrypt: %w", err)
	}
	return string(plaintext), nil
}

// DefaultAppID 返回内置的微信小程序 AppID。
func DefaultAppID() string {
	s, err := decrypt(encryptedAppID, nonceAppID)
	if err != nil {
		return ""
	}
	return s
}

// DefaultSecret 返回内置的微信小程序 Secret。
func DefaultSecret() string {
	s, err := decrypt(encryptedSecret, nonceSecret)
	if err != nil {
		return ""
	}
	return s
}
