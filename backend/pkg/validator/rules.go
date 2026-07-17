// Package validator provides input validation helpers.
package validator

import (
	"fmt"
	"strings"
	"unicode"
	"unicode/utf8"
)

func ValidateNickname(s string) error {
	s = strings.TrimSpace(s)
	s = strings.Trim(s, "\u3000")

	if s == "" {
		return fmt.Errorf("nickname is empty")
	}

	for _, r := range s {
		if unicode.IsControl(r) {
			return fmt.Errorf("nickname contains control character")
		}
	}

	count := utf8.RuneCountInString(s)
	if count < 1 || count > 20 {
		return fmt.Errorf("nickname length must be 1-20 code points")
	}

	return nil
}

func ValidateCoordinates(lat, lon float64) error {
	if lat < -90 || lat > 90 {
		return fmt.Errorf("lat out of range")
	}
	if lon < -180 || lon > 180 {
		return fmt.Errorf("lon out of range")
	}
	return nil
}

func ValidateColor(s string) error {
	if s == "" {
		return nil
	}
	if !strings.HasPrefix(s, "#") {
		return fmt.Errorf("color must start with #")
	}
	hex := s[1:]
	if len(hex) != 3 && len(hex) != 6 && len(hex) != 8 {
		return fmt.Errorf("color length invalid")
	}
	for _, r := range hex {
		if (r < '0' || r > '9') && (r < 'a' || r > 'f') && (r < 'A' || r > 'F') {
			return fmt.Errorf("color contains invalid character")
		}
	}
	return nil
}
