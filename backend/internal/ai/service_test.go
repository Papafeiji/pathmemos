package ai

import "testing"

func TestTruncateRunes(t *testing.T) {
	cases := []struct {
		in   string
		max  int
		want string
	}{
		{"abcdef", 3, "abc"},
		{"abc", 10, "abc"},
		{"你好世界", 2, "你好"},
		{"", 5, ""},
		{"abc", 0, ""},
		{"abc", -1, ""},
	}
	for _, c := range cases {
		if got := truncateRunes(c.in, c.max); got != c.want {
			t.Fatalf("truncateRunes(%q, %d) = %q, want %q", c.in, c.max, got, c.want)
		}
	}
}
