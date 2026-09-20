package jev

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
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
