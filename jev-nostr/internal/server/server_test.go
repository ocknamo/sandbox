package server

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"unicode/utf8"

	"github.com/ocknamo/sandbox/jev-nostr/internal/jev"
	"github.com/ocknamo/sandbox/jev-nostr/internal/scorer"
)

// newTestServer wires the real handler over a stub Jev endpoint, so the tests
// exercise the whole path without a key.
func newTestServer(t *testing.T) http.Handler {
	t.Helper()

	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var req jev.Request
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			t.Errorf("upstream decode: %v", err)
		}
		answers := map[string]any{}
		for key, q := range req.Questions {
			switch q.Type {
			case jev.TypeNoul:
				answers[key] = map[string]any{"type": "noul", "noul": 0.71}
			case jev.TypeScore:
				answers[key] = map[string]any{"type": "score", "score": 2.5,
					"legend": map[string]string{"2": "middling", "3": "decent"}}
			case jev.TypeChoice:
				answers[key] = map[string]any{"type": "choice", "choice": "musing", "confidence": 0.64}
			}
		}
		_ = json.NewEncoder(w).Encode(map[string]any{"answers": answers})
	}))
	t.Cleanup(upstream.Close)

	c := jev.New("test-key")
	c.Endpoint = upstream.URL
	c.HTTPClient = upstream.Client()
	c.Retries = 0

	return New(scorer.New(c), slog.New(slog.DiscardHandler))
}

func post(t *testing.T, h http.Handler, path, body string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(http.MethodPost, path, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

func TestScoreReturnsSignalsAndNoVerdict(t *testing.T) {
	h := newTestServer(t)

	rec := post(t, h, "/api/score", `{"posts":[{"id":"abc","content":"a real post"}]}`)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d: %s", rec.Code, rec.Body)
	}

	var got scoreResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(got.Results) != 1 {
		t.Fatalf("got %d results, want 1", len(got.Results))
	}
	r := got.Results[0]
	if r.ID != "abc" {
		t.Errorf("id = %q, want abc", r.ID)
	}
	if r.Appeal != 0.71 {
		t.Errorf("appeal = %v, want 0.71", r.Appeal)
	}
	if r.Substance == nil || *r.Substance != 2.5 {
		t.Errorf("substance = %v, want 2.5", r.Substance)
	}

	// The whole point of the API shape: a verdict would pin the thresholds
	// here instead of leaving them to the caller.
	if strings.Contains(rec.Body.String(), "recommend") {
		t.Errorf("the response carries a verdict: %s", rec.Body)
	}
}

func TestScoreRejectsBatchesItWillNotPayFor(t *testing.T) {
	h := newTestServer(t)

	for _, tc := range []struct {
		name string
		body string
		want int
	}{
		{"empty batch", `{"posts":[]}`, http.StatusBadRequest},
		{"no posts field", `{}`, http.StatusBadRequest},
		{"malformed json", `{"posts":`, http.StatusBadRequest},
		{"only blank content", `{"posts":[{"id":"a","content":"   "}]}`, http.StatusBadRequest},
	} {
		t.Run(tc.name, func(t *testing.T) {
			if rec := post(t, h, "/api/score", tc.body); rec.Code != tc.want {
				t.Errorf("status = %d, want %d: %s", rec.Code, tc.want, rec.Body)
			}
		})
	}

	var sb strings.Builder
	sb.WriteString(`{"posts":[`)
	for i := range maxPosts + 1 {
		if i > 0 {
			sb.WriteString(",")
		}
		fmt.Fprintf(&sb, `{"id":"p%d","content":"something"}`, i)
	}
	sb.WriteString(`]}`)

	rec := post(t, h, "/api/score", sb.String())
	if rec.Code != http.StatusBadRequest {
		t.Errorf("status for %d posts = %d, want %d", maxPosts+1, rec.Code, http.StatusBadRequest)
	}
	if !strings.Contains(rec.Body.String(), "too many posts") {
		t.Errorf("body does not say what is wrong: %s", rec.Body)
	}
}

func TestCleanPostsTrimsAndDropsRatherThanPaying(t *testing.T) {
	long := strings.Repeat("あ", maxContentRunes+500)

	got, err := cleanPosts([]scorer.Post{
		{ID: "a", Content: "  kept  "},
		{ID: "b", Content: "\n\t "},
		{ID: "c", Content: long},
	})
	if err != nil {
		t.Fatalf("cleanPosts: %v", err)
	}
	if len(got) != 2 {
		t.Fatalf("got %d posts, want 2 (the blank one dropped)", len(got))
	}
	if got[0].Content != "kept" {
		t.Errorf("content = %q, want it trimmed", got[0].Content)
	}
	// Counted in runes: cutting bytes would split a Japanese character.
	if runes := []rune(got[1].Content); len(runes) != maxContentRunes {
		t.Errorf("long post is %d runes, want %d", len(runes), maxContentRunes)
	}
	if !utf8.ValidString(got[1].Content) {
		t.Error("the trimmed post is not valid UTF-8")
	}
}

func TestQuestionsDescribesWhatIsAsked(t *testing.T) {
	h := newTestServer(t)

	req := httptest.NewRequest(http.MethodGet, "/api/questions", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d", rec.Code)
	}
	var got struct {
		Questions map[string]struct {
			Type         string `json:"type"`
			Instructions string `json:"instructions"`
		} `json:"questions"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(got.Questions) != 7 {
		t.Errorf("got %d questions, want 7", len(got.Questions))
	}
	if q := got.Questions["humor"]; q.Type != "noul" || q.Instructions == "" {
		t.Errorf("humor question = %+v", q)
	}
}

func TestCORSAndRoutingBasics(t *testing.T) {
	h := newTestServer(t)

	// The page is served from GitHub Pages, so every call is cross-origin.
	req := httptest.NewRequest(http.MethodOptions, "/api/score", nil)
	req.Header.Set("Origin", "https://ocknamo.github.io")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusNoContent {
		t.Errorf("preflight status = %d, want %d", rec.Code, http.StatusNoContent)
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "*" {
		t.Errorf("Allow-Origin = %q, want *", got)
	}
	if got := rec.Header().Get("Access-Control-Allow-Headers"); !strings.Contains(got, "Content-Type") {
		t.Errorf("Allow-Headers = %q, want it to include Content-Type", got)
	}

	// The deploy pipeline polls /health, and /healthz would never reach us.
	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/health", nil))
	if rec.Code != http.StatusOK {
		t.Errorf("/health = %d, want 200", rec.Code)
	}

	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/", nil))
	if rec.Code != http.StatusNotFound {
		t.Errorf("/ = %d, want 404", rec.Code)
	}
}

func TestScoreBodyIsBounded(t *testing.T) {
	h := newTestServer(t)

	body := `{"posts":[{"id":"a","content":"` + strings.Repeat("x", maxBodyBytes+1024) + `"}]}`
	rec := post(t, h, "/api/score", body)
	if rec.Code != http.StatusRequestEntityTooLarge {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusRequestEntityTooLarge)
	}
}
