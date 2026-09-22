package game

import (
	"context"
	"strings"
	"testing"

	"github.com/ocknamo/sandbox/jev-mystery/internal/scenario"
)

// Grading the elements of the truth separately is what makes this table
// possible: naming the right person is not the same achievement as explaining
// how they did it, and a single "is this right?" could not tell them apart.
func TestEndingsFollowWhatWasFound(t *testing.T) {
	s := load(t)
	cases := []struct {
		name   string
		f      fake
		ending string
	}{
		{"right person, whole truth", fake{choice: "kurata", prob: 0.9, noul: 0.9, score: 4}, "true"},
		{"right person, most of it", fake{choice: "kurata", prob: 0.9, noul: 0.9, score: 1}, "close"},
		{"right person, nothing else", fake{choice: "kurata", prob: 0.9, noul: 0.1, score: 0}, "named"},
		{"wrong person, right trick", fake{choice: "nanjo", prob: 0.9, noul: 0.9, score: 4}, "sharp"},
		{"nobody, nothing", fake{choice: scenario.NoMatch, prob: 0.9, noul: 0.1, score: 0}, "fail"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			e := &Engine{Asker: &c.f, Policy: DefaultPolicy()}
			v, err := e.Grade(context.Background(), s, "推理です")
			if err != nil {
				t.Fatal(err)
			}
			if v.Ending.ID != c.ending {
				t.Fatalf("ending = %q, want %q (hits %d, coherence %.1f)", v.Ending.ID, c.ending, v.Hits, v.Coherence)
			}

			wantCulprit := c.f.choice == s.Finale.Culprit
			if v.Correct != wantCulprit {
				t.Errorf("correct = %v, want %v", v.Correct, wantCulprit)
			}
			// Naming nobody is not the same as naming the wrong person, so it
			// has to survive as its own answer rather than folding into a miss.
			if c.f.choice == scenario.NoMatch && v.Named != "" {
				t.Errorf("named %q, want nobody", v.Named)
			}
		})
	}
}

// What the grader is asked is the design: one narrow noul per element of the
// truth, and the truth itself alongside the accusation so they can be
// compared. Asking eight costs barely more than asking one; they run in
// parallel.
func TestWhatTheGraderIsAsked(t *testing.T) {
	s := load(t)
	f := &fake{choice: "kurata", prob: 0.9, noul: 0.9, score: 4}
	e := &Engine{Asker: f, Policy: DefaultPolicy()}

	v, err := e.Grade(context.Background(), s, "犯人は倉田静。柱時計が進めてあった。")
	if err != nil {
		t.Fatal(err)
	}

	for _, p := range s.Finale.Points {
		if _, ok := f.asked[pointPrefix+p.ID]; !ok {
			t.Errorf("point %q was not asked about", p.ID)
		}
	}
	if len(f.asked) != len(s.Finale.Points)+2 {
		t.Errorf("asked %d questions, want one per point plus the culprit and coherence", len(f.asked))
	}

	view, ok := f.state.(accusationView)
	if !ok {
		t.Fatalf("state is %T", f.state)
	}
	if len(view.WhatActuallyHappened) != len(s.Finale.Truth) {
		t.Error("the model was not given the truth to grade against")
	}
	if !strings.Contains(strings.Join(view.Suspects, ""), "倉田") {
		t.Error("the suspects should be named for the culprit question")
	}

	if v.Hits != len(s.Finale.Points) || v.CoherenceLegend == "" {
		t.Errorf("hits = %d, legend = %q", v.Hits, v.CoherenceLegend)
	}
}
