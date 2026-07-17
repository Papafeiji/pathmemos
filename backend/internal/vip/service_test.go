package vip

import (
	"testing"
)

func TestParseVIPDuration_Valid(t *testing.T) {
	tests := []struct {
		mark   string
		number int
		want   int
		unit   string
	}{
		{"day", 7, 7, "day"},
		{"month", 1, 1, "month"},
		{"year", 1, 1, "year"},
		{"day", 30, 30, "day"},
		{"month", 12, 12, "month"},
	}

	for _, tt := range tests {
		d, u, err := ParseVIPDuration(tt.mark, tt.number)
		if err != nil {
			t.Errorf("ParseVIPDuration(%q, %d) unexpected error: %v", tt.mark, tt.number, err)
		}
		if d != tt.want || u != tt.unit {
			t.Errorf("ParseVIPDuration(%q, %d) = (%d, %q), want (%d, %q)",
				tt.mark, tt.number, d, u, tt.want, tt.unit)
		}
	}
}

func TestParseVIPDuration_InvalidMark(t *testing.T) {
	_, _, err := ParseVIPDuration("invalid", 30)
	if err == nil {
		t.Fatal("expected error for invalid mark")
	}
}

func TestParseVIPDuration_ZeroOrNegativeNumber(t *testing.T) {
	_, _, err := ParseVIPDuration("day", 0)
	if err == nil {
		t.Fatal("expected error for number=0")
	}
	_, _, err = ParseVIPDuration("month", -1)
	if err == nil {
		t.Fatal("expected error for negative number")
	}
}

func TestParseVIPDuration_EmptyMark(t *testing.T) {
	_, _, err := ParseVIPDuration("", 30)
	if err == nil {
		t.Fatal("expected error for empty mark")
	}
}

func TestInfo_Default(t *testing.T) {
	info := Info{IsVIP: false, ExpireTime: nil}
	if info.IsVIP {
		t.Fatal("default Info.IsVIP should be false")
	}
}
