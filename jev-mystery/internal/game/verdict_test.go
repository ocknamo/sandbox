package game

import (
	"context"
	"strings"
	"testing"

	"github.com/ocknamo/sandbox/jev-mystery/internal/jev"
	"github.com/ocknamo/sandbox/jev-mystery/internal/scenario"
)

func TestGradeAPerfectAccusation(t *testing.T) {
	s := load(t)
	f := &fake{choice: "kurata", prob: 0.95, noul: 0.9, score: 4}
	e := &Engine{Asker: f, Policy: DefaultPolicy()}

	v, err := e.Grade(context.Background(), s, "犯人は倉田静。柱時計が進めてあった。")
	if err != nil {
		t.Fatal(err)
	}
	if !v.Correct || v.NamedName != "倉田 静" {
		t.Fatalf("named %q, correct %v", v.NamedName, v.Correct)
	}
	if v.Hits != len(s.Finale.Points) {
		t.Errorf("hits = %d, want all %d", v.Hits, len(s.Finale.Points))
	}
	if v.Ending.ID != "true" {
		t.Errorf("ending = %q, want the true one", v.Ending.ID)
	}
	if v.CoherenceLegend == "" {
		t.Error("the score should name the level it landed on")
	}
}

// The ending is the whole point of grading the elements separately: naming the
// right person is not the same achievement as explaining how they did it.
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
				t.Errorf("ending = %q, want %q (hits %d, coherence %.1f)", v.Ending.ID, c.ending, v.Hits, v.Coherence)
			}
		})
	}
}

func TestGradeNamesNobody(t *testing.T) {
	s := load(t)
	f := &fake{choice: scenario.NoMatch, prob: 0.9, noul: 0.9, score: 4}
	e := &Engine{Asker: f, Policy: DefaultPolicy()}

	v, err := e.Grade(context.Background(), s, "誰かが殺した")
	if err != nil {
		t.Fatal(err)
	}
	if v.Named != "" || v.Correct {
		t.Fatalf("named %q, correct %v; naming nobody is not naming someone", v.Named, v.Correct)
	}
}

// The solution is handed to the model to grade against. It is safe there —
// Jev answers with typed values and never with text — but it must never reach
// a response, so this pins where it is allowed to appear.
func TestTheTruthIsSentToTheModel(t *testing.T) {
	s := load(t)
	f := &fake{choice: "kurata", prob: 0.9, noul: 0.9, score: 4}
	e := &Engine{Asker: f, Policy: DefaultPolicy()}

	if _, err := e.Grade(context.Background(), s, "推理です"); err != nil {
		t.Fatal(err)
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
}

func TestEveryPointBecomesItsOwnQuestion(t *testing.T) {
	s := load(t)
	f := &fake{choice: "kurata", prob: 0.9, noul: 0.9, score: 4}
	e := &Engine{Asker: f, Policy: DefaultPolicy()}

	if _, err := e.Grade(context.Background(), s, "推理です"); err != nil {
		t.Fatal(err)
	}
	for _, p := range s.Finale.Points {
		q, ok := f.asked[pointPrefix+p.ID]
		if !ok {
			t.Errorf("point %q was not asked about", p.ID)
			continue
		}
		if q.Type != jev.TypeNoul {
			t.Errorf("point %q is a %s, want a noul", p.ID, q.Type)
		}
	}
	if len(f.asked) != len(s.Finale.Points)+2 {
		t.Errorf("asked %d questions, want one per point plus the culprit and coherence", len(f.asked))
	}
}
