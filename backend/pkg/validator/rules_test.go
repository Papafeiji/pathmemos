package validator

import (
	"math"
	"strings"
	"testing"
)

func TestValidateCoordinates(t *testing.T) {
	valid := [][2]float64{{0, 0}, {90, 180}, {-90, -180}, {31.2, 121.5}}
	for _, c := range valid {
		if err := ValidateCoordinates(c[0], c[1]); err != nil {
			t.Errorf("ValidateCoordinates(%v,%v) = %v, want nil", c[0], c[1], err)
		}
	}
	invalid := [][2]float64{{91, 0}, {-91, 0}, {0, 181}, {0, -181}, {math.NaN(), 0}, {0, math.Inf(1)}, {0, math.Inf(-1)}}
	for _, c := range invalid {
		if err := ValidateCoordinates(c[0], c[1]); err == nil {
			t.Errorf("ValidateCoordinates(%v,%v) = nil, want error", c[0], c[1])
		}
	}
}

func TestValidateNickname(t *testing.T) {
	ok := []string{"ab", "张三", "a", strings.Repeat("字", 20)}
	for _, s := range ok {
		if err := ValidateNickname(s); err != nil {
			t.Errorf("ValidateNickname(%q) = %v, want nil", s, err)
		}
	}
	nul := string([]byte{0})
	ctrl := string(rune(10))
	bad := []string{"", "   ", strings.Repeat("字", 21), "a" + nul + "b", "a" + ctrl + "b"}
	for _, s := range bad {
		if err := ValidateNickname(s); err == nil {
			t.Errorf("ValidateNickname(%q) = nil, want error", s)
		}
	}
}

func TestValidateColor(t *testing.T) {
	ok := []string{"", "#fff", "#ffffff", "#ffffffff", "#ABCDEF", "#a1b2c3"}
	for _, s := range ok {
		if err := ValidateColor(s); err != nil {
			t.Errorf("ValidateColor(%q) = %v, want nil", s, err)
		}
	}
	bad := []string{"fff", "#ff", "#12345", "#gggggg", "#fffff"}
	for _, s := range bad {
		if err := ValidateColor(s); err == nil {
			t.Errorf("ValidateColor(%q) = nil, want error", s)
		}
	}
}
