package server

import (
	"container/list"
	"strings"
	"sync"
	"time"

	"github.com/ocknamo/sandbox/jev-bitcoin/internal/router"
)

// Limiter is a token bucket per client. Every question is a paid API request,
// and Cloud Run's concurrency setting bounds how many run at once, not how
// many one person can send in a minute.
//
// It lives in the instance's memory. With several instances a client gets
// that many buckets, which is still a limit; what it prevents is a loop
// hammering the endpoint, not a determined adversary.
type Limiter struct {
	// Burst is how many questions a client can ask back to back, and PerMinute
	// how fast the bucket refills.
	Burst     float64
	PerMinute float64

	mu      sync.Mutex
	buckets map[string]*bucket
	now     func() time.Time
}

type bucket struct {
	tokens float64
	at     time.Time
}

// NewLimiter returns a limiter that allows burst questions at once and
// perMinute a minute after that.
func NewLimiter(burst, perMinute float64) *Limiter {
	return &Limiter{Burst: burst, PerMinute: perMinute, buckets: map[string]*bucket{}, now: time.Now}
}

// Allow takes one token from the client's bucket, if there is one. A nil
// Limiter allows everything.
func (l *Limiter) Allow(client string) bool {
	if l == nil {
		return true
	}
	l.mu.Lock()
	defer l.mu.Unlock()

	now := l.now()
	b := l.buckets[client]
	if b == nil {
		// A full bucket is the same as no bucket, so buckets are forgotten
		// once they refill; this keeps the map from growing without bound.
		if len(l.buckets) > 10000 {
			l.sweep(now)
		}
		b = &bucket{tokens: l.Burst, at: now}
		l.buckets[client] = b
	}
	b.tokens = min(l.Burst, b.tokens+now.Sub(b.at).Minutes()*l.PerMinute)
	b.at = now
	if b.tokens < 1 {
		return false
	}
	b.tokens--
	return true
}

func (l *Limiter) sweep(now time.Time) {
	for k, b := range l.buckets {
		if b.tokens+now.Sub(b.at).Minutes()*l.PerMinute >= l.Burst {
			delete(l.buckets, k)
		}
	}
}

// Cache remembers the routing of recent questions. "ビットコインとは" will be
// asked a great many times, and it only needs to be understood once.
//
// A routing depends on nothing but the input and the corpus, and the corpus
// is fixed for the life of the process, so an entry never goes stale; it is
// only ever evicted for room.
type Cache struct {
	size int

	mu    sync.Mutex
	order *list.List
	items map[string]*list.Element
}

type cacheEntry struct {
	key string
	res *router.Result
}

// NewCache returns a cache holding up to size routings.
func NewCache(size int) *Cache {
	return &Cache{size: size, order: list.New(), items: map[string]*list.Element{}}
}

// cacheKey folds the differences that do not change a question: case,
// runs of spaces, and the punctuation at the end.
func cacheKey(input string) string {
	s := strings.ToLower(strings.Join(strings.Fields(input), " "))
	return strings.TrimRight(s, "?？!！。. ")
}

// Get returns the routing remembered for an input. A nil Cache remembers
// nothing.
func (c *Cache) Get(input string) (*router.Result, bool) {
	if c == nil {
		return nil, false
	}
	c.mu.Lock()
	defer c.mu.Unlock()
	el, ok := c.items[cacheKey(input)]
	if !ok {
		return nil, false
	}
	c.order.MoveToFront(el)
	return el.Value.(*cacheEntry).res, true
}

// Put remembers a routing, evicting the least recently used one when full.
func (c *Cache) Put(input string, res *router.Result) {
	if c == nil || c.size <= 0 {
		return
	}
	c.mu.Lock()
	defer c.mu.Unlock()
	key := cacheKey(input)
	if el, ok := c.items[key]; ok {
		el.Value.(*cacheEntry).res = res
		c.order.MoveToFront(el)
		return
	}
	c.items[key] = c.order.PushFront(&cacheEntry{key: key, res: res})
	for c.order.Len() > c.size {
		last := c.order.Back()
		c.order.Remove(last)
		delete(c.items, last.Value.(*cacheEntry).key)
	}
}
