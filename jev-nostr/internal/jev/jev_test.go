package jev

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
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

func TestAskSendsDocumentedRequest(t *testing.T) {
	var got Request
	var authorization, contentType string

	c := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		authorization = r.Header.Get("Authorization")
		contentType = r.Header.Get("Content-Type")
		if err := json.NewDecoder(r.Body).Decode(&got); err != nil {
			t.Errorf("decode request: %v", err)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"model":"jev-1.13.0","answers":{},"usage":{}}`))
	})

	if _, err := c.Ask(context.Background(), "hello", map[string]Question{
		"worth_reading": Noul("Is this worth reading?"),
	}); err != nil {
		t.Fatalf("Ask: %v", err)
	}

	if want := "Bearer test-key"; authorization != want {
		t.Errorf("Authorization = %q, want %q", authorization, want)
	}
	if want := "application/json"; contentType != want {
		t.Errorf("Content-Type = %q, want %q", contentType, want)
	}
	if got.State != "hello" {
		t.Errorf("state = %v, want %q", got.State, "hello")
	}
	if got.Model != DefaultModel {
		t.Errorf("model = %q, want %q", got.Model, DefaultModel)
	}
	q, ok := got.Questions["worth_reading"]
	if !ok {
		t.Fatalf("questions = %v, want a worth_reading entry", got.Questions)
	}
	if q.Type != TypeNoul {
		t.Errorf("question type = %q, want %q", q.Type, TypeNoul)
	}
	// A noul carries no criteria, and omitempty must keep the key out entirely
	// rather than sending a null the server would have to validate.
	if q.Criteria != nil {
		t.Errorf("criteria = %v, want it omitted", q.Criteria)
	}
}

func TestAskDecodesNoulAnswer(t *testing.T) {
	c := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"model": "jev-1.13.0",
			"answers": {"worth_reading": {"type": "noul", "noul": 0.87}},
			"usage": {"input_tokens": 42, "output_tokens": 3}
		}`))
	})

	resp, err := c.Ask(context.Background(), "hello", map[string]Question{
		"worth_reading": Noul("Is this worth reading?"),
	})
	if err != nil {
		t.Fatalf("Ask: %v", err)
	}

	answer := resp.Answers["worth_reading"]
	if answer.Noul == nil {
		t.Fatal("noul is nil, want 0.87")
	}
	if *answer.Noul != 0.87 {
		t.Errorf("noul = %v, want 0.87", *answer.Noul)
	}
	if resp.Usage.InputTokens != 42 {
		t.Errorf("input_tokens = %d, want 42", resp.Usage.InputTokens)
	}
}

// A noul of 0 is a real answer ("no"), so it must not be confused with an
// answer the server left out. That is the whole reason the field is a pointer.
func TestAskDistinguishesZeroNoulFromMissingNoul(t *testing.T) {
	c := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"answers": {
			"answered": {"type": "noul", "noul": 0},
			"unanswered": {"type": "noul"}
		}}`))
	})

	resp, err := c.Ask(context.Background(), "hello", map[string]Question{
		"answered": Noul("a"),
	})
	if err != nil {
		t.Fatalf("Ask: %v", err)
	}

	answered := resp.Answers["answered"]
	if answered.Noul == nil || *answered.Noul != 0 {
		t.Errorf("answered noul = %v, want a pointer to 0", answered.Noul)
	}
	if unanswered := resp.Answers["unanswered"]; unanswered.Noul != nil {
		t.Errorf("unanswered noul = %v, want nil", *unanswered.Noul)
	}
}

func TestChoiceAndScoreCarryTheirCriteria(t *testing.T) {
	choice := Choice("Which language?", map[string]string{
		"ja": "Japanese",
		"en": "English",
	})
	if choice.Type != TypeChoice {
		t.Errorf("type = %q, want %q", choice.Type, TypeChoice)
	}
	if _, ok := choice.Criteria.(map[string]string); !ok {
		t.Errorf("choice criteria = %T, want map[string]string", choice.Criteria)
	}

	score := Score("How substantive?", []string{"noise", "ordinary", "insightful"})
	if score.Type != TypeScore {
		t.Errorf("type = %q, want %q", score.Type, TypeScore)
	}
	levels, ok := score.Criteria.([]string)
	if !ok {
		t.Fatalf("score criteria = %T, want []string", score.Criteria)
	}
	if len(levels) != 3 {
		t.Errorf("levels = %d, want 3", len(levels))
	}
}

func TestAskReportsAPIErrors(t *testing.T) {
	c := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = w.Write([]byte(`{"error":"bad key"}`))
	})

	_, err := c.Ask(context.Background(), "hello", map[string]Question{"a": Noul("a")})

	var apiErr *APIError
	if !errors.As(err, &apiErr) {
		t.Fatalf("err = %v, want an *APIError", err)
	}
	if apiErr.StatusCode != http.StatusUnauthorized {
		t.Errorf("status = %d, want %d", apiErr.StatusCode, http.StatusUnauthorized)
	}
	// The message has to name the cause: this is what a CI log will show.
	if want := "invalid API key"; !strings.Contains(apiErr.Error(), want) {
		t.Errorf("error = %q, want it to mention %q", apiErr.Error(), want)
	}
}

func TestAskRejectsEmptyKeyAndQuestions(t *testing.T) {
	c := New("")
	if _, err := c.Ask(context.Background(), "hello", map[string]Question{"a": Noul("a")}); !errors.Is(err, ErrNoAPIKey) {
		t.Errorf("err = %v, want ErrNoAPIKey", err)
	}

	c = New("test-key")
	if _, err := c.Ask(context.Background(), "hello", nil); err == nil {
		t.Error("Ask with no questions succeeded, want an error")
	}
}

// The score answer documented at https://docs.typesafe.ai/primitives/score,
// pinned here because guessing its shape is what broke the first live run:
// legend is an object keyed by level number, not a string, and the score is
// an expected value that falls between levels rather than an index.
func TestAskDecodesDocumentedScoreAnswer(t *testing.T) {
	c := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"answers": {"severity": {
			"type": "score",
			"score": 1.43,
			"confidence": 0.35,
			"legend": {
				"0": "Cosmetic; no impact to functionality",
				"1": "Broken or degraded feature, but workaround exists",
				"2": "Blocking issue; no workaround exists"
			},
			"probabilities": {"0": 0.0, "1": 0.57, "2": 0.43}
		}}}`))
	})

	resp, err := c.Ask(context.Background(), "hello", map[string]Question{
		"severity": Score("How severe?", []string{"a", "b", "c"}),
	})
	if err != nil {
		t.Fatalf("Ask: %v", err)
	}

	a := resp.Answers["severity"]
	if a.Score == nil || *a.Score != 1.43 {
		t.Fatalf("score = %v, want 1.43", a.Score)
	}
	if got, want := a.Legend["1"], "Broken or degraded feature, but workaround exists"; got != want {
		t.Errorf("legend[1] = %q, want %q", got, want)
	}
	if len(a.Legend) != 3 {
		t.Errorf("legend has %d levels, want 3", len(a.Legend))
	}
	if got := a.Probabilities["1"]; got != 0.57 {
		t.Errorf("probabilities[1] = %v, want 0.57", got)
	}
	if a.Confidence == nil || *a.Confidence != 0.35 {
		t.Errorf("confidence = %v, want 0.35", a.Confidence)
	}

	// The score is the probability-weighted mean of the level numbers, which
	// is why it is not a whole number: 0*0.0 + 1*0.57 + 2*0.43 = 1.43.
	var want float64
	for level, p := range map[float64]float64{0: 0.0, 1: 0.57, 2: 0.43} {
		want += level * p
	}
	if diff := *a.Score - want; diff > 1e-9 || diff < -1e-9 {
		t.Errorf("score = %v, but the probabilities average to %v", *a.Score, want)
	}
}

// A choice answer keys its probabilities by option name rather than by level
// number, so the same map type has to serve both.
func TestAskDecodesChoiceAnswer(t *testing.T) {
	c := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"answers": {"kind": {
			"type": "choice",
			"choice": "humor",
			"confidence": 0.81,
			"probabilities": {"humor": 0.81, "insight": 0.19}
		}}}`))
	})

	resp, err := c.Ask(context.Background(), "hello", map[string]Question{
		"kind": Choice("What kind?", map[string]string{"humor": "a joke", "insight": "a fact"}),
	})
	if err != nil {
		t.Fatalf("Ask: %v", err)
	}

	a := resp.Answers["kind"]
	if a.Choice != "humor" {
		t.Errorf("choice = %q, want %q", a.Choice, "humor")
	}
	if got := a.Probabilities["humor"]; got != 0.81 {
		t.Errorf("probabilities[humor] = %v, want 0.81", got)
	}
}

func TestAskRetriesRateLimitsThenSucceeds(t *testing.T) {
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
		t.Error("answer lost across the retries")
	}
}

func TestAskGivesUpAfterTheRetryBudget(t *testing.T) {
	var attempts int
	c := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		attempts++
		w.Header().Set("Retry-After", "0")
		w.WriteHeader(http.StatusTooManyRequests)
	})
	c.Retries = 2

	_, err := c.Ask(context.Background(), "hello", map[string]Question{"a": Noul("a")})

	var apiErr *APIError
	if !errors.As(err, &apiErr) || apiErr.StatusCode != http.StatusTooManyRequests {
		t.Fatalf("err = %v, want a 429 APIError", err)
	}
	if attempts != 3 {
		t.Errorf("attempts = %d, want 3 (the first try plus two retries)", attempts)
	}
}

// A bad key will be just as bad next time, so it must not be retried.
func TestAskDoesNotRetryClientErrors(t *testing.T) {
	var attempts int
	c := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		attempts++
		w.WriteHeader(http.StatusUnauthorized)
	})
	c.Retries = 3

	if _, err := c.Ask(context.Background(), "hello", map[string]Question{"a": Noul("a")}); err == nil {
		t.Fatal("Ask succeeded, want an error")
	}
	if attempts != 1 {
		t.Errorf("attempts = %d, want 1", attempts)
	}
}

func TestBackoffPrefersRetryAfterAndGrows(t *testing.T) {
	if got := backoff(0, "7"); got != 7*time.Second {
		t.Errorf("backoff with Retry-After 7 = %v, want 7s", got)
	}
	if got := backoff(3, "not a number"); got != 8*time.Second {
		t.Errorf("backoff(3) = %v, want 8s", got)
	}
	if backoff(2, "") <= backoff(1, "") {
		t.Error("backoff is not growing between attempts")
	}
}
