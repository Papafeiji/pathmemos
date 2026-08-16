// 用法：
//   go run scripts/encrypt-wechat-secret.go <appid> <secret>
//
// 输出可直接替换 backend/internal/wechatsecrets/wechatsecrets.go 中的占位符。
package main

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"io"
	"os"
)

const masterSalt = "papafeiji-open-v1-9f8e7d6c5b4a3210"

func deriveKey() [32]byte {
	return sha256.Sum256([]byte(masterSalt))
}

func encrypt(plaintext string) (ciphertextB64, nonceB64 string, err error) {
	key := deriveKey()
	block, err := aes.NewCipher(key[:])
	if err != nil {
		return "", "", err
	}
	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", "", err
	}
	nonce := make([]byte, aesgcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", "", err
	}
	ciphertext := aesgcm.Seal(nil, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), base64.StdEncoding.EncodeToString(nonce), nil
}

func main() {
	if len(os.Args) != 3 {
		fmt.Fprintf(os.Stderr, "usage: go run scripts/encrypt-wechat-secret.go <appid> <secret>\n")
		os.Exit(1)
	}

	appID, secret := os.Args[1], os.Args[2]

	encAppID, nonceAppID, err := encrypt(appID)
	if err != nil {
		fmt.Fprintf(os.Stderr, "encrypt appid failed: %v\n", err)
		os.Exit(1)
	}
	encSecret, nonceSecret, err := encrypt(secret)
	if err != nil {
		fmt.Fprintf(os.Stderr, "encrypt secret failed: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("encryptedAppID  = %q\n", encAppID)
	fmt.Printf("nonceAppID      = %q\n", nonceAppID)
	fmt.Printf("encryptedSecret = %q\n", encSecret)
	fmt.Printf("nonceSecret     = %q\n", nonceSecret)
}
