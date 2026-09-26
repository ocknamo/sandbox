package jev

// This client is a copy of jev-nostr's, by way of jev-mystery, and its full
// test suite lives in jev-nostr. What is kept here is what this service
// depends on and a fake Asker cannot catch: that a real answer decodes, and
// that a rate limit is survived.

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// newTestClient points a client at a stub server so the tests never touch the
// real API.
func newTestClient(t *testing.T, handler http.HandlerFunc) *Client {
	t.Helper()
	srv := httptest.NewServer(handler)
	t.Cleanup(srv.Close)

	c := New("test-key")
	c.Endpoint = srv.URL
	c.HTTPClient = srv.Client()
	return c
}

// One answer of each primitive, in the shapes the API documents.
func TestAskDecodesAnswers(t *testing.T) {
	c := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"answers": {
			"declare": {"type": "noul", "noul": 0},
			"unanswered": {"type": "noul"},
			"action": {
				"type": "choice", "choice": "examine_clock", "confidence": 0.81,
				"probabilities": {"examine_clock": 0.81, "none": 0.19}
			},
			"coherence": {
				"type": "score", "score": 1.43, "confidence": 0.35,
				"legend": {"0": "thin", "1": "fair", "2": "airtight"},
				"probabilities": {"0": 0.0, "1": 0.57, "2": 0.43}
			}
		}}`))
	})

	resp, err := c.Ask(context.Background(), "hello", map[string]Question{
		"declare":   Noul("closing the case?"),
		"action":    Choice("which action?", map[string]string{"examine_clock": "the clock", "none": "nothing"}),
		"coherence": Score("how well argued?", []string{"thin", "fair", "airtight"}),
	})
	if err != nil {
		t.Fatalf("Ask: %v", err)
	}

	// Zero is a meaningful answer, which is why these are pointers: a noul of
	// 0 means "no" and is not the same as a field the server never sent.
	if got := resp.Answers["declare"].Noul; got == nil || *got != 0 {
		t.Errorf("declare = %v, want a pointer to 0", got)
	}
	if got := resp.Answers["unanswered"].Noul; got != nil {
		t.Errorf("unanswered = %v, want nil", *got)
	}

	action := resp.Answers["action"]
	if action.Choice != "examine_clock" || action.Probabilities["none"] != 0.19 {
		t.Errorf("action = %+v", action)
	}
	if action.Confidence == nil || *action.Confidence != 0.81 {
		t.Errorf("confidence = %v, want 0.81", action.Confidence)
	}

	// The score is the probability-weighted mean of the level numbers, which
	// is why it is not a whole number: 0*0.0 + 1*0.57 + 2*0.43 = 1.43. The
	// legend is keyed by level as a string, so it has to be rounded to be read.
	coherence := resp.Answers["coherence"]
	if coherence.Score == nil || *coherence.Score != 1.43 {
		t.Fatalf("score = %v, want 1.43", coherence.Score)
	}
	if got := coherence.Legend["1"]; got != "fair" {
		t.Errorf("legend[1] = %q, want %q", got, "fair")
	}
}

func TestAskRetriesRateLimits(t *testing.T) {
	var attempts int
	c := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		attempts++
		if attempts < 3 {
			// Retry-After keeps the test from waiting out the backoff.
			w.Header().Set("Retry-After", "0")
			w.WriteHeader(http.StatusTooManyRequests)
			return
		}
		// The body has to survive being re-sent on every attempt.
		var got Request
		if err := json.NewDecoder(r.Body).Decode(&got); err != nil {
			t.Errorf("attempt %d: decode request: %v", attempts, err)
		}
		if got.State != "hello" {
			t.Errorf("attempt %d: state = %v, want %q", attempts, got.State, "hello")
		}
		_, _ = w.Write([]byte(`{"answers":{"a":{"type":"noul","noul":0.5}}}`))
	})
	c.Retries = 2

	resp, err := c.Ask(context.Background(), "hello", map[string]Question{"a": Noul("a")})
	if err != nil {
		t.Fatalf("Ask: %v", err)
	}
	if attempts != 3 {
		t.Errorf("attempts = %d, want 3", attempts)
	}
	if resp.Answers["a"].Noul == nil {
		t.Error("the answer was lost across the retries")
	}
}
