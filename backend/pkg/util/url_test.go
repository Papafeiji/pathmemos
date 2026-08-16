package util

import (
	"net"
	"testing"
)

func TestIsForbiddenIP(t *testing.T) {
	cases := []struct {
		ip     string
		expect bool
	}{
		{"127.0.0.1", true},
		{"10.1.2.3", true},
		{"192.168.1.1", true},
		{"169.254.1.1", true},
		{"100.64.0.1", true},   // CGNAT（M5）
		{"192.0.2.10", true},   // 文档网段（M5）
		{"198.18.0.1", true},   // benchmark（M5）
		{"8.8.8.8", false},
		{"223.5.5.5", false},
	}
	for _, c := range cases {
		ip := net.ParseIP(c.ip)
		if ip == nil {
			t.Fatalf("bad test ip %q", c.ip)
		}
		if got := isForbiddenIP(ip); got != c.expect {
			t.Errorf("isForbiddenIP(%s) = %v, want %v", c.ip, got, c.expect)
		}
	}
}
