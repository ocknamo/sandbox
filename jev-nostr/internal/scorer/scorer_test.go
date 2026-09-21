package scorer

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/ocknamo/sandbox/jev-nostr/internal/jev"
	"github.com/ocknamo/sandbox/jev-nostr/internal/recommend"
)

// answerAll replies to every question in a request with a plausible answer,
// letting a test care only about the noul it is checking.
func answerAll(t *testing.T, r *http.Request, noul float64) []byte {
	t.Helper()
	var req jev.Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		t.Errorf("decode request: %v", err)
	}

	answers := map[string]any{}
	for key, q := range req.Questions {
		switch q.Type {
		case jev.TypeNoul:
			answers[key] = map[string]any{"type": "noul", "noul": noul}
		case jev.TypeScore:
			levels := q.Criteria.([]any)
			legend := map[string]string{}
			for i, l := range levels {
				legend[fmt.Sprint(i)] = l.(string)
			}
			answers[key] = map[string]any{"type": "score", "score": 2.4, "legend": legend}
		case jev.TypeChoice:
			answers[key] = map[string]any{"type": "choice", "choice": "musing", "confidence": 0.6}
		}
	}
	body, err := json.Marshal(map[string]any{"answers": answers})
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	return body
}

func newTestScorer(t *testing.T, handler http.HandlerFunc) *Scorer {
	t.Helper()
	srv := httptest.NewServer(handler)
	t.Cleanup(srv.Close)

	c := jev.New("test-key")
	c.Endpoint = srv.URL
	c.HTTPClient = srv.Client()
	c.Retries = 0
	return New(c)
}

func posts(n int) []Post {
	out := make([]Post, n)
	for i := range out {
		out[i] = Post{ID: fmt.Sprintf("post-%02d", i), Content: fmt.Sprintf("content %d", i)}
	}
	return out
}

func TestScoreKeepsResultsInInputOrder(t *testing.T) {
	// Answering the later posts faster makes responses arrive out of order,
	// which is the case the pairing has to survive.
	s := newTestScorer(t, func(w http.ResponseWriter, r *http.Request) {
		body := answerAll(t, r, 0.7)
		time.Sleep(time.Duration(len(body)%5) * time.Millisecond)
		_, _ = w.Write(body)
	})

	in := posts(12)
	got := s.Score(context.Background(), in)

	if len(got) != len(in) {
		t.Fatalf("got %d results, want %d", len(got), len(in))
	}
	for i, r := range got {
		if r.ID != in[i].ID {
			t.Errorf("result %d has id %q, want %q", i, r.ID, in[i].ID)
		}
		if r.Error != "" {
			t.Errorf("result %d: %s", i, r.Error)
		}
	}
}

func TestScoreNeverExceedsItsConcurrency(t *testing.T) {
	var inFlight, peak int64
	var mu sync.Mutex

	s := newTestScorer(t, func(w http.ResponseWriter, r *http.Request) {
		n := atomic.AddInt64(&inFlight, 1)
		mu.Lock()
		if n > peak {
			peak = n
		}
		mu.Unlock()
		// Long enough that overlapping requests actually overlap.
		time.Sleep(20 * time.Millisecond)
		atomic.AddInt64(&inFlight, -1)
		w.Write(answerAll(t, r, 0.5))
	})
	s.SetConcurrency(3)

	s.Score(context.Background(), posts(15))

	mu.Lock()
	defer mu.Unlock()
	if peak > 3 {
		t.Errorf("peak concurrency = %d, want at most 3", peak)
	}
	if peak < 2 {
		t.Errorf("peak concurrency = %d; the requests never overlapped, so the test proves nothing", peak)
	}
}

// A live feed would rather show the posts that worked than fail wholesale.
func TestScoreReportsPerPostFailuresAndKeepsGoing(t *testing.T) {
	s := newTestScorer(t, func(w http.ResponseWriter, r *http.Request) {
		// Peek at the state before answering, so one chosen post can fail.
		raw, err := io.ReadAll(r.Body)
		if err != nil {
			t.Errorf("read request: %v", err)
			return
		}
		var req jev.Request
		if err := json.Unmarshal(raw, &req); err != nil {
			t.Errorf("decode request: %v", err)
			return
		}
		if req.State == "content 2" {
			w.WriteHeader(http.StatusUnprocessableEntity)
			_, _ = w.Write([]byte(`{"detail":"nope"}`))
			return
		}
		r.Body = io.NopCloser(bytes.NewReader(raw))
		_, _ = w.Write(answerAll(t, r, 0.8))
	})

	got := s.Score(context.Background(), posts(5))

	for i, r := range got {
		if i == 2 {
			if r.Error == "" {
				t.Error("the failing post reported no error")
			}
			if r.ID != "post-02" {
				t.Errorf("failed result id = %q, want post-02", r.ID)
			}
			continue
		}
		if r.Error != "" {
			t.Errorf("result %d failed alongside it: %s", i, r.Error)
		}
		if r.Appeal != 0.8 {
			t.Errorf("result %d appeal = %v, want 0.8", i, r.Appeal)
		}
	}
}

func TestScoreCarriesEverySignalThrough(t *testing.T) {
	s := newTestScorer(t, func(w http.ResponseWriter, r *http.Request) {
		w.Write(answerAll(t, r, 0.62))
	})

	got := s.Score(context.Background(), posts(1))[0]

	if got.Insight != 0.62 || got.Humor != 0.62 || got.Relatable != 0.62 || got.Promotional != 0.62 {
		t.Errorf("nouls not carried through: %+v", got)
	}
	if got.Appeal != 0.62 {
		t.Errorf("appeal = %v, want 0.62", got.Appeal)
	}
	if got.Substance == nil || *got.Substance != 2.4 {
		t.Errorf("substance = %v, want 2.4", got.Substance)
	}
	if got.SubstanceTop != float64(len(recommend.Questions()[recommend.KeySubstance].Criteria.([]string)))-1 {
		t.Errorf("substance top = %v", got.SubstanceTop)
	}
	if got.Kind != "musing" || got.KindConfidence != 0.6 {
		t.Errorf("kind = %q %v, want musing 0.6", got.Kind, got.KindConfidence)
	}
}

func TestScoreHandlesAnEmptyBatch(t *testing.T) {
	s := newTestScorer(t, func(w http.ResponseWriter, r *http.Request) {
		t.Error("the model was asked about an empty batch")
	})
	if got := s.Score(context.Background(), nil); len(got) != 0 {
		t.Errorf("got %d results, want 0", len(got))
	}
}
