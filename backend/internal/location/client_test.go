package location

import (
	"context"
	"testing"
)

func TestNextKey_RoundRobin(t *testing.T) {
	c := NewClient([]string{"k1", "k2", "k3"})
	expected := []string{"k1", "k2", "k3", "k1", "k2", "k3"}
	for i, want := range expected {
		if got := c.NextKey(); got != want {
			t.Fatalf("iteration %d: got %q, want %q", i, got, want)
		}
	}
}

func TestNextKey_EmptyKeys(t *testing.T) {
	c := NewClient(nil)
	if got := c.NextKey(); got != "" {
		t.Fatalf("got %q, want empty string", got)
	}
}

func TestNewClient_CreatesHTTPClient(t *testing.T) {
	c := NewClient([]string{"k1"})
	if c.client == nil {
		t.Fatal("client.httpClient should not be nil")
	}
}

func TestReverse_CancelledContext(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	c := NewClient([]string{"k1"})
	_, err := c.Reverse(ctx, 23.1291, 113.2644, true)
	if err == nil {
		t.Fatal("expected error from cancelled context")
	}
}

func TestReverse_Timeout(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 1)
	defer cancel()
	c := NewClient([]string{"k1"})
	_, err := c.Reverse(ctx, 23.1291, 113.2644, true)
	if err == nil {
		t.Fatal("expected timeout error")
	}
}

func TestReverseResultFields(t *testing.T) {
	r := &ReverseResult{Address: "北京路", AreaCode: "440104"}
	if r.Address != "北京路" {
		t.Fatal("address mismatch")
	}
	if r.AreaCode != "440104" {
		t.Fatal("area code mismatch")
	}
}
