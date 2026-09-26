package server

import (
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/ocknamo/sandbox/jev-bitcoin/internal/faq"
	"github.com/ocknamo/sandbox/jev-bitcoin/internal/jev"
	"github.com/ocknamo/sandbox/jev-bitcoin/internal/router"
)

// fake answers every request with the same canned answers.
type fake struct {
	answers map[string]jev.Answer
	calls   int
}

func (f *fake) Ask(_ context.Context, _ any, qs map[string]jev.Question) (*jev.Response, error) {
	f.calls++
	out := map[string]jev.Answer{}
	for k := range qs {
		if a, ok := f.answers[k]; ok {
			out[k] = a
		}
	}
	return &jev.Response{Answers: out}, nil
}

func choice(pick string, probs map[string]float64) jev.Answer {
	return jev.Answer{Type: jev.TypeChoice, Choice: pick, Probabilities: probs}
}

var clearAnswer = map[string]jev.Answer{
	router.KeyCategory: choice("basics", map[string]float64{"basics": 0.9, "none": 0.1}),
	"in_basics":        choice("q1_7", map[string]float64{"q1_7": 0.9, "none": 0.1}),
	router.KeyKind:     choice(router.KindQuestion, map[string]float64{router.KindQuestion: 1}),
	router.KeyLevel:    choice(router.LevelBeginner, map[string]float64{router.LevelBeginner: 1}),
}

func newServer(t *testing.T, answers map[string]jev.Answer, limiter *Limiter) (http.Handler, *fake) {
	t.Helper()
	c, err := faq.Builtin()
	if err != nil {
		t.Fatal(err)
	}
	f := &fake{answers: answers}
	return New(Options{
		Corpus:  c,
		Router:  &router.Router{Corpus: c, Asker: f, Policy: router.DefaultPolicy()},
		Logger:  slog.New(slog.NewTextHandler(io.Discard, nil)),
		Limiter: limiter,
		Cache:   NewCache(16),
	}), f
}

func do(t *testing.T, h http.Handler, method, path, body string) (*httptest.ResponseRecorder, map[string]any) {
	t.Helper()
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	req.RemoteAddr = "192.0.2.1:1234"
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	var out map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
		t.Fatalf("%s %s: %v: %s", method, path, err, rec.Body)
	}
	return rec, out
}

func TestAskAnswers(t *testing.T) {
	h, _ := newServer(t, clearAnswer, nil)
	rec, out := do(t, h, "POST", "/api/ask", `{"question": "1ビットコインって何サトシ？"}`)
	if rec.Code != http.StatusOK || out["status"] != "answer" {
		t.Fatalf("%d %v", rec.Code, out)
	}
	answer := out["answer"].(map[string]any)
	if answer["id"] != "1-7" || answer["title"] != "1 BTCは何satoshiですか？" {
		t.Errorf("answer = %v", answer)
	}
	if answer["answered"] != true || len(answer["answer"].([]any)) == 0 {
		t.Errorf("answered = %v, answer = %v", answer["answered"], answer["answer"])
	}
	if tags, _ := answer["tags"].([]any); len(tags) == 0 {
		t.Errorf("tags = %v, want the answer's tags", answer["tags"])
	}

	cats := out["categories"].([]any)
	if len(cats) != 1 || cats[0].(map[string]any)["id"] != "basics" {
		t.Errorf("categories = %v", cats)
	}
	if _, ok := out["debug"]; ok {
		t.Error("debug numbers were sent without Debug")
	}
}

func TestAskMissUsesKind(t *testing.T) {
	h, _ := newServer(t, map[string]jev.Answer{
		router.KeyCategory: choice("none", map[string]float64{"none": 0.95, "basics": 0.05}),
		"in_basics":        choice("none", map[string]float64{"none": 0.9, "q1_19": 0.1}),
		router.KeyKind:     choice(router.KindAdvice, map[string]float64{router.KindAdvice: 0.9}),
	}, nil)
	_, out := do(t, h, "POST", "/api/ask", `{"question": "今が買い時？"}`)
	if out["status"] != "miss" {
		t.Fatalf("status = %v", out["status"])
	}
	if msg := out["message"].([]any); msg[0] != msgAdvice[0] {
		t.Errorf("message = %v", msg)
	}
}

func TestAskSeveralQuestions(t *testing.T) {
	multi := 0.9
	h, _ := newServer(t, map[string]jev.Answer{
		router.KeyCategory: choice("basics", map[string]float64{"basics": 0.9, "none": 0.1}),
		"in_basics":        choice("q1_7", map[string]float64{"q1_7": 0.6, "q1_3": 0.3, "none": 0.1}),
		router.KeyKind:     choice(router.KindQuestion, map[string]float64{router.KindQuestion: 1}),
		router.KeyMulti:    {Type: jev.TypeNoul, Noul: &multi},
	}, nil)
	_, out := do(t, h, "POST", "/api/ask", `{"question": "1BTCは何satで、誰が作ったの？"}`)
	if out["status"] != "multiple" || out["answer"] != nil {
		t.Fatalf("out = %v", out)
	}
	if msg := out["message"].([]any); msg[0] != msgMultipleNear[0] {
		t.Errorf("message = %v", msg)
	}
	if s, _ := out["suggestions"].([]any); len(s) != 2 {
		t.Errorf("suggestions = %v, want both questions offered", out["suggestions"])
	}
}

func TestAskCachesAndLimits(t *testing.T) {
	limiter := NewLimiter(2, 0)
	h, f := newServer(t, clearAnswer, limiter)

	// The same question, worded with different trailing punctuation and
	// spacing, is understood once.
	for _, q := range []string{"1BTCは何sat?", " 1btcは何sat？ ", "1BTCは何sat"} {
		if rec, out := do(t, h, "POST", "/api/ask", `{"question": "`+q+`"}`); rec.Code != 200 || out["status"] != "answer" {
			t.Fatalf("%q: %d %v", q, rec.Code, out)
		}
	}
	if f.calls != 1 {
		t.Fatalf("API calls = %d, want 1", f.calls)
	}

	// A second, new question uses the last token; a third is refused.
	do(t, h, "POST", "/api/ask", `{"question": "発行上限は？"}`)
	rec, _ := do(t, h, "POST", "/api/ask", `{"question": "半減期は？"}`)
	if rec.Code != http.StatusTooManyRequests {
		t.Errorf("third new question = %d, want 429", rec.Code)
	}
	// ...but a remembered one is still answered, since it costs nothing.
	if rec, _ := do(t, h, "POST", "/api/ask", `{"question": "1BTCは何sat"}`); rec.Code != 200 {
		t.Errorf("cached question = %d, want 200", rec.Code)
	}
}

func TestAskRejectsEmpty(t *testing.T) {
	h, f := newServer(t, clearAnswer, nil)
	if rec, _ := do(t, h, "POST", "/api/ask", `{"question": "　 "}`); rec.Code != http.StatusBadRequest {
		t.Errorf("code = %d, want 400", rec.Code)
	}
	if f.calls != 0 {
		t.Error("an empty question reached the API")
	}
}

func TestEntry(t *testing.T) {
	h, f := newServer(t, clearAnswer, nil)
	// The questions are not published as a list.
	if rec, _ := do(t, h, "GET", "/api/catalog", ""); rec.Code != http.StatusNotFound {
		t.Errorf("catalog = %d, want 404", rec.Code)
	}

	rec, entry := do(t, h, "GET", "/api/faq/8-1", "")
	if rec.Code != 200 || entry["title"] != "Lightning Networkとは何ですか？" {
		t.Errorf("entry = %d %v", rec.Code, entry)
	}
	if rec, _ := do(t, h, "GET", "/api/faq/99-1", ""); rec.Code != http.StatusNotFound {
		t.Errorf("unknown entry = %d, want 404", rec.Code)
	}
	// A question the table has but nobody has answered yet: the page is told
	// so rather than handed a missing field.
	_, pending := do(t, h, "GET", "/api/faq/7-34", "")
	if pending["answered"] != false || len(pending["answer"].([]any)) != 0 {
		t.Errorf("7-34 = %v", pending)
	}
	if f.calls != 0 {
		t.Error("looking an answer up called the API")
	}
}

func TestLimiterRefills(t *testing.T) {
	now := time.Unix(0, 0)
	l := NewLimiter(1, 6) // one every ten seconds
	l.now = func() time.Time { return now }
	if !l.Allow("a") || l.Allow("a") {
		t.Fatal("burst of one should allow exactly one")
	}
	if !l.Allow("b") {
		t.Error("clients share a bucket")
	}
	now = now.Add(10 * time.Second)
	if !l.Allow("a") {
		t.Error("the bucket did not refill")
	}
}
