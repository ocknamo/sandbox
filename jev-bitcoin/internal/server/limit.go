package server

import (
	"container/list"
	"strings"
	"sync"
	"time"
	"unicode"

	"github.com/ocknamo/sandbox/jev-bitcoin/internal/router"
)

// Limiter counts each client's questions over a sliding window. Every
// question is a paid API request, and Cloud Run's concurrency setting bounds
// how many run at once, not how many one person can send in half an hour.
//
// A client may ask Max questions in any Window. The one after that is refused,
// and so is everything else the client sends for a further Window: a loop
// that keeps going does not get a question through each time one ages out.
//
// It lives in the instance's memory. With several instances a client gets
// that many allowances, which is still a limit; what it prevents is a loop
// hammering the endpoint, not a determined adversary.
type Limiter struct {
	Max    int
	Window time.Duration

	mu      sync.Mutex
	clients map[string]*usage
	now     func() time.Time
}

type usage struct {
	// asked are the times of the questions still inside the window, oldest
	// first.
	asked []time.Time
	// until is when a refused client may ask again.
	until time.Time
}

// NewLimiter returns a limiter that allows max questions per window.
func NewLimiter(max int, window time.Duration) *Limiter {
	return &Limiter{Max: max, Window: window, clients: map[string]*usage{}, now: time.Now}
}

// Blocked is how much longer a client is refused for, or zero if it is not.
// It counts nothing. A nil Limiter blocks nobody.
func (l *Limiter) Blocked(client string) time.Duration {
	if l == nil {
		return 0
	}
	l.mu.Lock()
	defer l.mu.Unlock()
	if u := l.clients[client]; u != nil {
		return max(0, u.until.Sub(l.now()))
	}
	return 0
}

// Allow counts one question for a client. It returns zero if the question may
// go ahead, and otherwise how long the client is refused for. A nil Limiter
// allows everything.
func (l *Limiter) Allow(client string) time.Duration {
	if l == nil {
		return 0
	}
	l.mu.Lock()
	defer l.mu.Unlock()

	now := l.now()
	u := l.clients[client]
	if u == nil {
		// Clients with nothing left in the window are the same as new ones,
		// so they are forgotten; this keeps the map from growing without
		// bound.
		if len(l.clients) > 10000 {
			l.sweep(now)
		}
		u = &usage{}
		l.clients[client] = u
	}
	if wait := u.until.Sub(now); wait > 0 {
		return wait
	}
	u.asked = recent(u.asked, now.Add(-l.Window))
	if len(u.asked) >= l.Max {
		u.asked = nil
		u.until = now.Add(l.Window)
		return l.Window
	}
	u.asked = append(u.asked, now)
	return 0
}

// recent drops the times at or before since.
func recent(times []time.Time, since time.Time) []time.Time {
	i := 0
	for i < len(times) && !times[i].After(since) {
		i++
	}
	return times[i:]
}

func (l *Limiter) sweep(now time.Time) {
	since := now.Add(-l.Window)
	for k, u := range l.clients {
		if !u.until.After(now) && len(recent(u.asked, since)) == 0 {
			delete(l.clients, k)
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

// cacheKey folds the differences that do not change a question: full- and
// half-width forms, case, and spaces and punctuation wherever they are.
//
// When in doubt it keeps a character, because a key that is too loose answers
// one question with another's answer, while one that is too strict only costs
// a request. So punctuation between two digits stays ("1.5" is not "15"), and
// so do '%' and symbols such as '$' and '+'.
//
// Past that it folds words only by name, in sameWords.
func cacheKey(input string) string {
	rs := []rune(input)
	for i, r := range rs {
		rs[i] = unicode.ToLower(halfWidth(r))
	}
	var b strings.Builder
	for i, r := range rs {
		if unicode.IsSpace(r) || (unicode.IsPunct(r) && r != '%' && !betweenDigits(rs, i)) {
			continue
		}
		b.WriteRune(r)
	}
	if b.Len() == 0 {
		// Nothing but punctuation: too little to call two inputs the same.
		return input
	}
	return sameWords.Replace(b.String())
}

// sameWords spells alike the terms asked often enough in more than one way —
// in katakana or Latin letters, with or without a closing long vowel — to be
// worth naming. Case is already folded, so "Bitcoin" and "BITCOIN" need no
// entry of their own.
//
// An entry matches anywhere in the key, spaces already gone, so a short Latin
// one would break other words: "ln" is in "fullnode", "tx" in "utxo".
var sameWords = strings.NewReplacer(
	"ビットコイン", "bitcoin",
	"btc", "bitcoin",
	"ライトニング", "lightning",
	"ネットワーク", "network",
	"サトシ", "satoshi",
	"ナカモト", "nakamoto",
	"サーバー", "サーバ",
	"コンピューター", "コンピュータ",
	"ユーザー", "ユーザ",
)

// halfWidth maps the full-width forms of ASCII, which a Japanese IME types as
// readily as ASCII itself, to ASCII.
func halfWidth(r rune) rune {
	if r >= '\uff01' && r <= '\uff5e' { // ！ through ～
		return r - ('\uff01' - '!')
	}
	return r
}

func betweenDigits(rs []rune, i int) bool {
	return i > 0 && i < len(rs)-1 && unicode.IsDigit(rs[i-1]) && unicode.IsDigit(rs[i+1])
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
