package wechatcrypto

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"encoding/binary"
	"testing"
)

// wechatPadBlockSize 微信消息加解密填充按 32 字节对齐（与实现一致）。
const wechatPadBlockSize = 32

// encryptWechatMsg 按微信消息加密格式构造密文：
// random(16) + msg_len(4, 大端) + msg + receive_id，填充 32 字节对齐。
// zeroIV 为 true 时使用全零 IV（虚拟支付回调实测），否则用密钥前 16 字节（公众号）。
func encryptWechatMsg(t *testing.T, key, msg, receiveID []byte, zeroIV bool) string {
	t.Helper()
	randomBytes := make([]byte, 16)
	if _, err := rand.Read(randomBytes); err != nil {
		t.Fatalf("rand: %v", err)
	}
	lenBuf := make([]byte, 4)
	binary.BigEndian.PutUint32(lenBuf, uint32(len(msg)))
	plain := append(randomBytes, lenBuf...)
	plain = append(plain, msg...)
	plain = append(plain, receiveID...)
	pad := wechatPadBlockSize - len(plain)%wechatPadBlockSize
	for i := 0; i < pad; i++ {
		plain = append(plain, byte(pad))
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		t.Fatalf("aes: %v", err)
	}
	iv := key[:aes.BlockSize]
	if zeroIV {
		iv = make([]byte, aes.BlockSize)
	}
	ciphertext := make([]byte, len(plain))
	cipher.NewCBCEncrypter(block, iv).CryptBlocks(ciphertext, plain)
	return base64.StdEncoding.EncodeToString(ciphertext)
}

// TestDecryptRoundTrip 长度扫描覆盖微信 32 字节对齐填充的全部取值（1..32）。
// 曾因按 AES 块大小 16 做 PKCS7 校验，把真实回调的 29 字节填充误判为
// "invalid padding size"（2026-08-15 线上故障）。
func TestDecryptRoundTrip(t *testing.T) {
	const encodingAESKey = "ZIMgAm5SrvRVn99UNxZ7kdUtZvfnV9r2zXZaKNm3Bl3"
	key, err := base64.StdEncoding.DecodeString(encodingAESKey + "=")
	if err != nil {
		t.Fatalf("decode key: %v", err)
	}
	receiveID := []byte("wx-test-appid")

	cases := []struct {
		name    string
		zeroIV  bool
		decrypt func(cipherMsg, key string) (string, string, error)
	}{
		{"DecryptMsgZeroIV(虚拟支付回调, 全零IV)", true, DecryptMsgZeroIV},
		{"DecryptMsg(公众号, IV=密钥前16字节)", false, DecryptMsg},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			// msgLen 从 20 到 100：明文总长 (20+msgLen+13) 覆盖 33..133，
			// 模 32 遍历两轮以上，填充 1..32 全部出现，含真实回调的 29。
			for msgLen := 20; msgLen <= 100; msgLen++ {
				msg := bytes.Repeat([]byte("a"), msgLen)
				enc := encryptWechatMsg(t, key, msg, receiveID, tc.zeroIV)
				got, gotRecv, err := tc.decrypt(enc, encodingAESKey)
				if err != nil {
					t.Fatalf("msgLen=%d: %v", msgLen, err)
				}
				if got != string(msg) {
					t.Fatalf("msgLen=%d: msg mismatch", msgLen)
				}
				if gotRecv != string(receiveID) {
					t.Fatalf("msgLen=%d: receive id mismatch: %q", msgLen, gotRecv)
				}
			}
		})
	}
}
