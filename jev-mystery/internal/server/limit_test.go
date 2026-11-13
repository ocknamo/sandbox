package server

import (
	"net/http/httptest"
	"testing"
	"time"
)

func TestLimiterChargesCost(t *testing.T) {
	now := time.Unix(1_800_000_000, 0)
	l := NewLimiter(10, 30*time.Minute)
	l.now = func() time.Time { return now }

	if wait := l.Allow("a", 6); wait != 0 {
		t.Fatalf("first spend refused: %v", wait)
	}
	now = now.Add(10 * time.Minute)
	if wait := l.Allow("a", 4); wait != 0 {
		t.Fatalf("spend up to Max refused: %v", wait)
	}
	// Over Max: refused, not charged, and told to wait until the first spend ages out.
	if wait := l.Allow("a", 1); wait != 20*time.Minute {
		t.Errorf("wait = %v, want 20m", wait)
	}
	if wait := l.Allow("b", 10); wait != 0 {
		t.Errorf("another client refused: %v", wait)
	}
	now = now.Add(20 * time.Minute)
	if wait := l.Allow("a", 6); wait != 0 {
		t.Errorf("after the first spend aged out: %v", wait)
	}
	if wait := l.Allow("a", 11); wait != 30*time.Minute {
		t.Errorf("a cost larger than Max = %v, want the whole window", wait)
	}
}

func TestNilLimiterAllows(t *testing.T) {
	var l *Limiter
	if wait := l.Allow("a", 1_000_000); wait != 0 {
		t.Errorf("nil limiter refused: %v", wait)
	}
}

func TestLimiterForgetsIdleClients(t *testing.T) {
	now := time.Unix(1_800_000_000, 0)
	l := NewLimiter(1, time.Minute)
	l.now = func() time.Time { return now }
	for i := range 10001 {
		l.Allow(string(rune(i+0x4e00)), 1)
	}
	now = now.Add(2 * time.Minute)
	l.Allow("new", 1)
	if len(l.clients) != 1 {
		t.Errorf("clients = %d, want 1 after the sweep", len(l.clients))
	}
}

func TestClientIP(t *testing.T) {
	cases := []struct {
		name string
		xff  []string
		want string
	}{
		{"no header", nil, "192.0.2.1"},
		{"caller-written entries", []string{"198.51.100.1, 203.0.113.9"}, "203.0.113.9"},
		{"repeated headers", []string{"198.51.100.1", "203.0.113.9"}, "203.0.113.9"},
		{"empty last entry", []string{"203.0.113.9,"}, "192.0.2.1"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			req := httptest.NewRequest("POST", "/", nil)
			req.RemoteAddr = "192.0.2.1:1234"
			for _, v := range c.xff {
				req.Header.Add("X-Forwarded-For", v)
			}
			if got := clientIP(req); got != c.want {
				t.Errorf("clientIP = %q, want %q", got, c.want)
			}
		})
	}
}
