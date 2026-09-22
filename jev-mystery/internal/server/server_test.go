package server

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/ocknamo/sandbox/jev-mystery/internal/game"
	"github.com/ocknamo/sandbox/jev-mystery/internal/jev"
	"github.com/ocknamo/sandbox/jev-mystery/internal/scenario"
	"github.com/ocknamo/sandbox/jev-mystery/internal/session"
)

// stub answers whatever it is asked with one prepared choice, so the routes
// can be exercised without an API key.
type stub struct {
	choice string
	noul   float64
	score  float64
}

func (s *stub) Ask(_ context.Context, _ any, qs map[string]jev.Question) (*jev.Response, error) {
	answers := map[string]jev.Answer{}
	conf := 0.9
	for key, q := range qs {
		switch q.Type {
		case jev.TypeChoice:
			choice := s.choice
			if key == game.KeyIntent {
				choice = game.IntentSearch
			}
			answers[key] = jev.Answer{Type: q.Type, Choice: choice, Confidence: &conf,
				Probabilities: map[string]float64{choice: 0.9, scenario.NoMatch: 0.1}}
		case jev.TypeNoul:
			n := s.noul
			answers[key] = jev.Answer{Type: q.Type, Noul: &n}
		case jev.TypeScore:
			sc := s.score
			answers[key] = jev.Answer{Type: q.Type, Score: &sc, Legend: map[string]string{"4": "airtight"}}
		}
	}
	return &jev.Response{Answers: answers}, nil
}

func serve(t *testing.T, s *stub) http.Handler {
	t.Helper()
	sc, err := scenario.Builtin("clockwork")
	if err != nil {
		t.Fatal(err)
	}
	codec, err := session.New("test key")
	if err != nil {
		t.Fatal(err)
	}
	return New(Options{
		Cases:   scenario.NewLibrary(sc),
		Engine:  &game.Engine{Asker: s, Policy: game.DefaultPolicy()},
		Session: codec,
	})
}

func post(t *testing.T, h http.Handler, path string, body any) (*httptest.ResponseRecorder, map[string]any) {
	t.Helper()
	raw, err := json.Marshal(body)
	if err != nil {
		t.Fatal(err)
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodPost, path, bytes.NewReader(raw)))

	var out map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
		t.Fatalf("%s returned %d and %q", path, rec.Code, rec.Body.String())
	}
	return rec, out
}

func TestPlayThrough(t *testing.T) {
	h := serve(t, &stub{choice: "examine_clock"})

	rec, start := post(t, h, "/api/new", map[string]any{"case": "clockwork"})
	if rec.Code != http.StatusOK {
		t.Fatalf("new: %d", rec.Code)
	}
	token, _ := start["state"].(string)
	if token == "" {
		t.Fatal("no state token")
	}

	rec, turn := post(t, h, "/api/act", map[string]any{"state": token, "input": "柱時計を調べる"})
	if rec.Code != http.StatusOK {
		t.Fatalf("act: %d %s", rec.Code, rec.Body)
	}
	if turn["matched"] != true {
		t.Fatalf("the turn did not match: %v", turn)
	}
	if gained, _ := turn["gained"].([]any); len(gained) != 1 {
		t.Errorf("gained %v, want the clock", turn["gained"])
	}
	view, _ := turn["view"].(map[string]any)
	if view["finale_open"] != false {
		t.Error("one piece of evidence should not open the finale")
	}
}

// The case comes from the request, so that one deployment can serve every
// case and the page can route on it.
func TestCasesAreListedAndChosenByID(t *testing.T) {
	h := serve(t, &stub{choice: "examine_clock"})

	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/cases", nil))
	var listed casesResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &listed); err != nil {
		t.Fatal(err)
	}
	if len(listed.Cases) != 1 || listed.Cases[0].ID != "clockwork" || listed.Cases[0].Title == "" {
		t.Fatalf("cases = %+v", listed.Cases)
	}

	if rec, _ := post(t, h, "/api/new", map[string]any{"case": "atlantis"}); rec.Code != http.StatusNotFound {
		t.Fatalf("new with an unknown case: %d, want 404", rec.Code)
	}
}

func TestAccusingTooEarlyIsRefused(t *testing.T) {
	h := serve(t, &stub{choice: "kurata", noul: 0.9, score: 4})

	_, start := post(t, h, "/api/new", map[string]any{"case": "clockwork"})
	rec, _ := post(t, h, "/api/accuse", map[string]any{
		"state": start["state"], "answer": "犯人は倉田静です",
	})
	if rec.Code != http.StatusConflict {
		t.Fatalf("accuse: %d, want 409 while the case is not ready", rec.Code)
	}
}

func TestAccusingClosesTheCase(t *testing.T) {
	h := serve(t, &stub{choice: "kurata", noul: 0.9, score: 4})
	codec, _ := session.New("test key")

	// Start from a state that has everything the finale asks for.
	st := game.State{Scenario: "clockwork", Scene: "hall", Evidence: []string{"clock", "ledger", "thread"}}
	token, err := codec.Encode(st)
	if err != nil {
		t.Fatal(err)
	}

	rec, out := post(t, h, "/api/accuse", map[string]any{"state": token, "answer": "犯人は倉田静です。柱時計が進めてありました。"})
	if rec.Code != http.StatusOK {
		t.Fatalf("accuse: %d %s", rec.Code, rec.Body)
	}
	if out["correct"] != true || out["ending_id"] != "true" {
		t.Fatalf("verdict = %v", out)
	}

	// And the closed state refuses another turn.
	rec, _ = post(t, h, "/api/act", map[string]any{"state": out["state"], "input": "もう一度調べる"})
	if rec.Code != http.StatusConflict {
		t.Fatalf("act after the ending: %d, want 409", rec.Code)
	}
}

func TestBadStateIsRefused(t *testing.T) {
	h := serve(t, &stub{choice: "examine_clock"})
	other, _ := session.New("somebody else's key")
	forged, _ := other.Encode(game.State{Scenario: "clockwork", Scene: "study"})

	for name, tc := range map[string]struct {
		state string
		want  int
	}{
		"forged":                            {forged, http.StatusBadRequest},
		"a case this service does not have": {sign(t, game.State{Scenario: "elsewhere", Scene: "hall"}), http.StatusConflict},
		"unknown scene":                     {sign(t, game.State{Scenario: "clockwork", Scene: "atlantis"}), http.StatusBadRequest},
	} {
		t.Run(name, func(t *testing.T) {
			rec, _ := post(t, h, "/api/act", map[string]any{"state": tc.state, "input": "調べる"})
			if rec.Code != tc.want {
				t.Fatalf("act: %d, want %d", rec.Code, tc.want)
			}
		})
	}
}

func sign(t *testing.T, st game.State) string {
	t.Helper()
	codec, _ := session.New("test key")
	token, err := codec.Encode(st)
	if err != nil {
		t.Fatal(err)
	}
	return token
}
