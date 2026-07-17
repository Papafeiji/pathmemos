// Package util provides shared utility functions used across the backend.
package util

// MaskID masks an identifier such as openid or unionid for logging.
// It keeps the first and last few characters so logs remain debuggable
// without exposing the full identifier.
func MaskID(s string) string {
	if len(s) <= 8 {
		return "****"
	}
	return s[:3] + "****" + s[len(s)-3:]
}
