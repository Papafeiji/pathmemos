// Package limiter provides token-bucket rate limiters for Tencent Map APIs.
package limiter

import (
	"context"
	"sync"
	"time"
)

const (
	geoCoderRPS  = 10
	staticMapRPS = 10
)

var (
	geoCoder  = newTokenBucket(geoCoderRPS)
	staticMap = newTokenBucket(staticMapRPS)
)

// tokenBucket is a simple token-bucket rate limiter.
type tokenBucket struct {
	mu         sync.Mutex
	tokens     float64
	capacity   float64
	ratePerSec float64
	last       time.Time
}

func newTokenBucket(rps int) *tokenBucket {
	if rps <= 0 {
		rps = 1
	}
	return &tokenBucket{
		tokens:     float64(rps),
		capacity:   float64(rps),
		ratePerSec: float64(rps),
		last:       time.Now(),
	}
}

// wait blocks until a token is available or the context is cancelled.
func (b *tokenBucket) wait(ctx context.Context) error {
	for {
		waitDuration, ok := b.tryTake()
		if ok {
			return nil
		}

		timer := time.NewTimer(waitDuration)
		select {
		case <-ctx.Done():
			timer.Stop()
			return ctx.Err()
		case <-timer.C:
		}
	}
}

// tryTake refills tokens based on elapsed time and consumes one token if available.
// It returns the duration to wait if no token is available and ok == false.
func (b *tokenBucket) tryTake() (time.Duration, bool) {
	b.mu.Lock()
	defer b.mu.Unlock()

	now := time.Now()
	b.tokens += now.Sub(b.last).Seconds() * b.ratePerSec
	if b.tokens > b.capacity {
		b.tokens = b.capacity
	}
	b.last = now

	if b.tokens >= 1 {
		b.tokens--
		return 0, true
	}

	need := (1 - b.tokens) / b.ratePerSec
	return time.Duration(need * float64(time.Second)), false
}

// WaitGeoCoder waits for permission to call the Tencent geocoder API.
func WaitGeoCoder(ctx context.Context) error {
	return geoCoder.wait(ctx)
}

// WaitStaticMap waits for permission to call the Tencent static map API.
func WaitStaticMap(ctx context.Context) error {
	return staticMap.wait(ctx)
}

// StopGeoCoder stops the geocoder limiter. It is currently a no-op because the
// limiter does not start a background goroutine.
func StopGeoCoder() {}

// StopStaticMap stops the static map limiter. It is currently a no-op because the
// limiter does not start a background goroutine.
func StopStaticMap() {}
