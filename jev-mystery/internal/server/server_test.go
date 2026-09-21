package server

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
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

func serve(t *testing.T, s *stub) (http.Handler, *scenario.Scenario) {
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
		Scenario: sc,
		Engine:   &game.Engine{Asker: s, Policy: game.DefaultPolicy()},
		Session:  codec,
	}), sc
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
	h, _ := serve(t, &stub{choice: "examine_clock"})

	rec, start := post(t, h, "/api/new", map[string]any{})
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

// The game is not being able to see the menu. Everything the scenario knows
// and the player has not earned has to stay on this side of the wire, so this
// walks the responses looking for any of it.
func TestResponsesDoNotLeakTheScenario(t *testing.T) {
	h, sc := serve(t, &stub{choice: "examine_clock"})

	_, start := post(t, h, "/api/new", map[string]any{})
	token := start["state"].(string)
	_, turn := post(t, h, "/api/act", map[string]any{"state": token, "input": "柱時計を調べる"})

	for name, body := range map[string]string{"new": jsonOf(t, start), "act": jsonOf(t, turn)} {
		t.Run(name, func(t *testing.T) {
			for _, a := range sc.Actions {
				// The id would name the option; match.what describes it. The
				// player is told what they did, never what they could do.
				if strings.Contains(body, a.Match.What) {
					t.Errorf("the response describes the action %q to the player", a.ID)
				}
				if a.ID != "examine_clock" && strings.Contains(body, `"`+a.ID+`"`) {
					t.Errorf("the response names the action %q", a.ID)
				}
			}
			for _, line := range sc.Finale.Truth {
				if strings.Contains(body, line) {
					t.Error("the response carries the solution")
				}
			}
			for _, e := range sc.Finale.Endings {
				if strings.Contains(body, e.Title) {
					t.Errorf("the response carries the ending %q", e.ID)
				}
			}
			if strings.Contains(body, "signals") {
				t.Error("the model's own numbers reached a player's response")
			}
		})
	}
}

func TestAccusingTooEarlyIsRefused(t *testing.T) {
	h, _ := serve(t, &stub{choice: "kurata", noul: 0.9, score: 4})

	_, start := post(t, h, "/api/new", map[string]any{})
	rec, _ := post(t, h, "/api/accuse", map[string]any{
		"state": start["state"], "answer": "犯人は倉田静です",
	})
	if rec.Code != http.StatusConflict {
		t.Fatalf("accuse: %d, want 409 while the case is not ready", rec.Code)
	}
}

func TestAccusingClosesTheCase(t *testing.T) {
	h, _ := serve(t, &stub{choice: "kurata", noul: 0.9, score: 4})
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
	h, _ := serve(t, &stub{choice: "examine_clock"})
	other, _ := session.New("somebody else's key")
	forged, _ := other.Encode(game.State{Scenario: "clockwork", Scene: "study"})

	for name, tc := range map[string]struct {
		state string
		want  int
	}{
		"missing":       {"", http.StatusBadRequest},
		"forged":        {forged, http.StatusBadRequest},
		"not a token":   {"nonsense", http.StatusBadRequest},
		"another case":  {sign(t, game.State{Scenario: "elsewhere", Scene: "hall"}), http.StatusConflict},
		"unknown scene": {sign(t, game.State{Scenario: "clockwork", Scene: "atlantis"}), http.StatusBadRequest},
	} {
		t.Run(name, func(t *testing.T) {
			rec, _ := post(t, h, "/api/act", map[string]any{"state": tc.state, "input": "調べる"})
			if rec.Code != tc.want {
				t.Fatalf("act: %d, want %d", rec.Code, tc.want)
			}
		})
	}
}

func TestEmptyInputIsRefusedBeforeItCostsARequest(t *testing.T) {
	h, _ := serve(t, &stub{choice: "examine_clock"})
	_, start := post(t, h, "/api/new", map[string]any{})

	rec, _ := post(t, h, "/api/act", map[string]any{"state": start["state"], "input": "   "})
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("act: %d, want 400", rec.Code)
	}
}

func TestHealth(t *testing.T) {
	h, _ := serve(t, &stub{})
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/health", nil))
	if rec.Code != http.StatusOK {
		t.Fatalf("health: %d", rec.Code)
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

func jsonOf(t *testing.T, v any) string {
	t.Helper()
	raw, err := json.Marshal(v)
	if err != nil {
		t.Fatal(err)
	}
	return string(raw)
}
