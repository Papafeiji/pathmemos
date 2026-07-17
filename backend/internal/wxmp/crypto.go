// Package wxmp provides related functionality.
package wxmp

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha1"
	"crypto/subtle"
	"encoding/base64"
	"encoding/binary"
	"encoding/hex"
	"encoding/xml"
	"errors"
	"fmt"
	"io"
	"sort"
	"strings"
	"time"
)

// CheckSignature verifies WeChat server signature.
func CheckSignature(token, signature, timestamp, nonce string) bool {
	if signature == "" || timestamp == "" || nonce == "" || token == "" {
		return false
	}
	arr := []string{token, timestamp, nonce}
	sort.Strings(arr)
	h := sha1.New()
	_, _ = h.Write([]byte(strings.Join(arr, "")))
	expected := hex.EncodeToString(h.Sum(nil))
	return subtle.ConstantTimeCompare([]byte(expected), []byte(signature)) == 1
}

// ReplyTextXML builds a passive text reply XML.
func ReplyTextXML(toUser, fromUser, content string) string {
	content = strings.ReplaceAll(content, "]]>", "]]]]><![CDATA[>")
	return fmt.Sprintf(`<xml>
<ToUserName><![CDATA[%s]]></ToUserName>
<FromUserName><![CDATA[%s]]></FromUserName>
<CreateTime>%d</CreateTime>
<MsgType><![CDATA[text]]></MsgType>
<Content><![CDATA[%s]]></Content>
</xml>`, toUser, fromUser, time.Now().Unix(), content)
}

// MessageXML represents the fields we care about in a WeChat server push.
type MessageXML struct {
	ToUserName   string `xml:"ToUserName"`
	FromUserName string `xml:"FromUserName"`
	MsgType      string `xml:"MsgType"`
	Content      string `xml:"Content"`
	Recognition  string `xml:"Recognition"`
	Event        string `xml:"Event"`
	MsgID        string `xml:"MsgId"`
}

// ParseMessageXML parses WeChat XML body into MessageXML.
func ParseMessageXML(xmlBody string) (MessageXML, error) {
	var msg MessageXML
	if err := xml.Unmarshal([]byte(xmlBody), &msg); err != nil {
		return msg, err
	}
	return msg, nil
}

// ExtractXMLTag extracts CDATA or plain tag content from XML string.
// Deprecated: use ParseMessageXML for new code.
func ExtractXMLTag(xml, tag string) string {
	start := fmt.Sprintf("<%s><![CDATA[", tag)
	end := fmt.Sprintf("]]></%s>", tag)
	s := strings.Index(xml, start)
	e := strings.Index(xml, end)
	if s != -1 && e != -1 {
		return xml[s+len(start) : e]
	}

	start = fmt.Sprintf("<%s>", tag)
	end = fmt.Sprintf("</%s>", tag)
	s = strings.Index(xml, start)
	e = strings.Index(xml, end)
	if s != -1 && e != -1 {
		return xml[s+len(start) : e]
	}
	return ""
}

// aesKeyFromEncodingAESKey decodes a 43-character WeChat EncodingAESKey into a 32-byte AES key.
func aesKeyFromEncodingAESKey(key string) ([]byte, error) {
	if len(key) != 43 {
		return nil, fmt.Errorf("encoding aes key length must be 43")
	}
	k, err := base64.StdEncoding.DecodeString(key + "=")
	if err != nil {
		return nil, fmt.Errorf("decode encoding aes key: %w", err)
	}
	if len(k) != 32 {
		return nil, fmt.Errorf("decoded aes key length must be 32, got %d", len(k))
	}
	return k, nil
}

// pkcs7Pad pads data to a multiple of blockSize using PKCS7.
func pkcs7Pad(data []byte, blockSize int) []byte {
	padding := blockSize - len(data)%blockSize
	padtext := bytes.Repeat([]byte{byte(padding)}, padding)
	return append(data, padtext...)
}

// pkcs7Unpad removes PKCS7 padding.
func pkcs7Unpad(data []byte, blockSize int) ([]byte, error) {
	if blockSize <= 0 || len(data)%blockSize != 0 || len(data) == 0 {
		return nil, errors.New("invalid padding data")
	}
	padding := int(data[len(data)-1])
	if padding > blockSize || padding == 0 {
		return nil, errors.New("invalid padding size")
	}
	for i := 0; i < padding; i++ {
		if data[len(data)-1-i] != byte(padding) {
			return nil, errors.New("invalid padding")
		}
	}
	return data[:len(data)-padding], nil
}

// EncryptMsg encrypts a plaintext message using WeChat AES-256-CBC + PKCS7.
// Returns the base64-encoded ciphertext.
func EncryptMsg(plainMsg, appID, encodingAESKey string) (string, error) {
	aesKey, err := aesKeyFromEncodingAESKey(encodingAESKey)
	if err != nil {
		return "", err
	}

	random := make([]byte, 16)
	if _, err := io.ReadFull(rand.Reader, random); err != nil {
		return "", fmt.Errorf("generate random: %w", err)
	}

	msgLen := make([]byte, 4)
	binary.BigEndian.PutUint32(msgLen, uint32(len(plainMsg)))

	plainData := make([]byte, 0, 16+4+len(plainMsg)+len(appID))
	plainData = append(plainData, random...)
	plainData = append(plainData, msgLen...)
	plainData = append(plainData, []byte(plainMsg)...)
	plainData = append(plainData, []byte(appID)...)

	block, err := aes.NewCipher(aesKey)
	if err != nil {
		return "", fmt.Errorf("create aes cipher: %w", err)
	}
	plainData = pkcs7Pad(plainData, aes.BlockSize)
	ciphertext := make([]byte, len(plainData))
	mode := cipher.NewCBCEncrypter(block, aesKey[:aes.BlockSize])
	mode.CryptBlocks(ciphertext, plainData)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// DecryptMsg decrypts a base64-encoded ciphertext using WeChat AES-256-CBC + PKCS7.
// Returns the plaintext message and the embedded appID.
func DecryptMsg(cipherMsg, encodingAESKey string) (string, string, error) {
	aesKey, err := aesKeyFromEncodingAESKey(encodingAESKey)
	if err != nil {
		return "", "", err
	}

	ciphertext, err := base64.StdEncoding.DecodeString(cipherMsg)
	if err != nil {
		return "", "", fmt.Errorf("decode cipher msg: %w", err)
	}
	if len(ciphertext)%aes.BlockSize != 0 {
		return "", "", errors.New("ciphertext length is not a multiple of block size")
	}

	block, err := aes.NewCipher(aesKey)
	if err != nil {
		return "", "", fmt.Errorf("create aes cipher: %w", err)
	}
	plainData := make([]byte, len(ciphertext))
	mode := cipher.NewCBCDecrypter(block, aesKey[:aes.BlockSize])
	mode.CryptBlocks(plainData, ciphertext)

	plainData, err = pkcs7Unpad(plainData, aes.BlockSize)
	if err != nil {
		return "", "", fmt.Errorf("unpad: %w", err)
	}

	if len(plainData) < 16+4 {
		return "", "", errors.New("decrypted data too short")
	}
	msgLen := binary.BigEndian.Uint32(plainData[16:20])
	if 20+int(msgLen) > len(plainData) {
		return "", "", errors.New("invalid message length")
	}
	msg := string(plainData[20 : 20+msgLen])
	appID := string(plainData[20+msgLen:])
	return msg, appID, nil
}

// EncryptedXML represents the WeChat encrypted message wrapper.
type EncryptedXML struct {
	ToUserName string `xml:"ToUserName"`
	Encrypt    string `xml:"Encrypt"`
}

// EncryptReplyXML wraps a plaintext reply XML into WeChat encrypted response format.
func EncryptReplyXML(toUserName, plainXML, appID, encodingAESKey, token, timestamp, nonce string) (string, error) {
	cipherText, err := EncryptMsg(plainXML, appID, encodingAESKey)
	if err != nil {
		return "", err
	}
	signature := sha1Sign(token, timestamp, nonce, cipherText)
	return fmt.Sprintf(`<xml>
<Encrypt><![CDATA[%s]]></Encrypt>
<MsgSignature><![CDATA[%s]]></MsgSignature>
<TimeStamp>%s</TimeStamp>
<Nonce><![CDATA[%s]]></Nonce>
</xml>`, cipherText, signature, timestamp, nonce), nil
}

func sha1Sign(token, timestamp, nonce, encrypt string) string {
	arr := []string{token, timestamp, nonce, encrypt}
	sort.Strings(arr)
	h := sha1.New()
	_, _ = h.Write([]byte(strings.Join(arr, "")))
	return hex.EncodeToString(h.Sum(nil))
}
