package server

import (
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

// Limiter caps how many paid API calls one client can cause in a sliding
// window. Cloud Run's instance cap bounds how many run at once, not how many
// one caller sends in an hour.
//
// It lives in the instance's memory, so each instance keeps its own count:
// it stops a loop or a page left hammering the endpoint, not a determined
// adversary. A nil Limiter allows everything.
type Limiter struct {
	Max    int
	Window time.Duration

	mu      sync.Mutex
	clients map[string][]spend
	now     func() time.Time
}

type spend struct {
	at   time.Time
	cost int
}

// NewLimiter allows max units of cost per client per window.
func NewLimiter(max int, window time.Duration) *Limiter {
	return &Limiter{Max: max, Window: window, clients: map[string][]spend{}, now: time.Now}
}

// Allow charges cost to a client. It returns zero if the request may go
// ahead, and otherwise how long until enough of the window has passed.
// A refused request is not charged.
func (l *Limiter) Allow(client string, cost int) time.Duration {
	if l == nil {
		return 0
	}
	l.mu.Lock()
	defer l.mu.Unlock()

	now := l.now()
	since := now.Add(-l.Window)
	if len(l.clients) > 10000 {
		for k, s := range l.clients {
			if len(recent(s, since)) == 0 {
				delete(l.clients, k)
			}
		}
	}
	spent := recent(l.clients[client], since)
	total := 0
	for _, s := range spent {
		total += s.cost
	}
	if total+cost > l.Max {
		l.clients[client] = spent
		// Wait until the oldest spends have aged out far enough to fit this one.
		over := total + cost - l.Max
		for _, s := range spent {
			over -= s.cost
			if over <= 0 {
				return s.at.Add(l.Window).Sub(now)
			}
		}
		return l.Window // cost alone exceeds Max
	}
	l.clients[client] = append(spent, spend{at: now, cost: cost})
	return 0
}

// recent drops the spends at or before since.
func recent(s []spend, since time.Time) []spend {
	i := 0
	for i < len(s) && !s[i].at.After(since) {
		i++
	}
	return s[i:]
}

// clientIP is who is asking, for the rate limit; locally there is only the
// socket.
//
// Google's front end appends the address it saw to whatever X-Forwarded-For
// the caller sent, so only the last entry is its own. The first is the
// caller's to write, and keying on it would let a new value per request
// escape the limit.
func clientIP(r *http.Request) string {
	if fwd := strings.Join(r.Header.Values("X-Forwarded-For"), ","); fwd != "" {
		if i := strings.LastIndex(fwd, ","); i >= 0 {
			fwd = fwd[i+1:]
		}
		if last := strings.TrimSpace(fwd); last != "" {
			return last
		}
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
