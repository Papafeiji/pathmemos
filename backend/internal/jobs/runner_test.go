package jobs

import (
	"context"
	"testing"
	"time"

	"papafeiji/backend/internal/pkg/safe"
)

func TestGoWithRecover_PanicNotifiesChannel(t *testing.T) {
	ctx := context.Background()
	done := make(chan error, 1)

	safe.GoWithRecover(ctx, nil, func() error {
		panic("intentional panic for test")
	}, func(panicErr error) {
		done <- panicErr
	})

	select {
	case err := <-done:
		if err == nil {
			t.Fatal("expected non-nil panic error")
		}
		if err.Error() == "" {
			t.Fatal("expected non-empty error message")
		}
		t.Logf("panic correctly notified: %v", err)
	case <-time.After(3 * time.Second):
		t.Fatal("timeout waiting for panic notification — goroutine deadlocked")
	}
}

func TestGoWithRecover_NormalCompletion(t *testing.T) {
	ctx := context.Background()
	done := make(chan error, 1)

	safe.GoWithRecover(ctx, nil, func() error {
		done <- nil
		return nil
	}, func(panicErr error) {
		done <- panicErr
	})

	select {
	case err := <-done:
		if err != nil {
			t.Fatalf("expected nil error, got: %v", err)
		}
	case <-time.After(3 * time.Second):
		t.Fatal("timeout waiting for normal completion")
	}
}

func TestGoWithRecover_ErrorReturned(t *testing.T) {
	ctx := context.Background()
	done := make(chan error, 1)

	testErr := context.DeadlineExceeded
	safe.GoWithRecover(ctx, nil, func() error {
		done <- testErr
		return testErr
	}, func(panicErr error) {
		done <- panicErr
	})

	select {
	case err := <-done:
		if err == nil {
			t.Fatal("expected error, got nil")
		}
	case <-time.After(3 * time.Second):
		t.Fatal("timeout")
	}
}

func TestGoWithRecover_NoChannelWithoutPanicAndNoResult(t *testing.T) {
	ctx := context.Background()

	safe.GoWithRecover(ctx, nil, func() error {
		return nil
	}, nil)

	time.Sleep(100 * time.Millisecond)
	// Should not panic — onPanic is nil, fn returns nil, no channel needed
}
