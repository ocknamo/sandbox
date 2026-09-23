package game

import (
	"context"
	"strings"
	"testing"

	"github.com/ocknamo/sandbox/jev-mystery/internal/jev"

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
		{"right person, whole truth", fake{choice: "ruise", prob: 0.9, noul: 0.9, score: 4}, "true"},
		// The heart of the case is that the three are one and that the
		// witnesses are all right. That much is the whole solve, however thin
		// the rest of the account and however loosely it hangs together.
		{"right person, the heart of it", fake{choice: "kaido", prob: 0.9, noul: 0.1, score: 1,
			points: map[string]float64{"one_beast": 0.9, "testimony": 0.9}}, "true"},
		{"right person, one beast but not the witnesses", fake{choice: "ruise", prob: 0.9, noul: 0.9, score: 4,
			points: map[string]float64{"testimony": 0.1}}, "close"},
		{"right person, witnesses but not one beast", fake{choice: "ruise", prob: 0.9, noul: 0.9, score: 4,
			points: map[string]float64{"one_beast": 0.1}}, "close"},
		{"right person, nothing else", fake{choice: "ruise", prob: 0.9, noul: 0.1, score: 0}, "named"},
		{"wrong person, right trick", fake{choice: "mochizuki", prob: 0.9, noul: 0.9, score: 4}, "sharp"},
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

			wantCulprit := s.Finale.Blames(c.f.choice)
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
	f := &fake{choice: "ruise", prob: 0.9, noul: 0.9, score: 4}
	e := &Engine{Asker: f, Policy: DefaultPolicy()}

	v, err := e.Grade(context.Background(), s, "犯人は久瀬瑠依。床に残っていたのは一匹分の足跡だけだった。")
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
	if !strings.Contains(strings.Join(view.Suspects, ""), "久瀬") {
		t.Error("the suspects should be named for the culprit question")
	}

	if v.Hits != len(s.Finale.Points) || v.CoherenceLegend == "" {
		t.Errorf("hits = %d, legend = %q", v.Hits, v.CoherenceLegend)
	}
}

// Naming all three of the one beast is the right answer, and has to read as
// one. The grader's vote splits across the three names, none of them alone
// beats "named nobody", and the player who got the culprits exactly right used
// to be told they had named no one at all.
func TestNamingEveryCulpritIsNamingTheCulprit(t *testing.T) {
	s := load(t)
	cases := map[string]fake{
		"the group option wins": {choice: scenario.Together, prob: 0.9, noul: 0.9, score: 4},
		"the vote splits and none edges it": {choice: scenario.NoMatch, noul: 0.9, score: 4,
			culprit: map[string]float64{"ruise": 0.24, "chitose": 0.23, "kaido": 0.23, scenario.NoMatch: 0.3}},
	}
	for name, f := range cases {
		t.Run(name, func(t *testing.T) {
			e := &Engine{Asker: &f, Policy: DefaultPolicy()}
			v, err := e.Grade(context.Background(), s, "犯人は久瀬、北村、海堂の三人。三人は一匹だった。")
			if err != nil {
				t.Fatal(err)
			}
			if !v.Correct {
				t.Fatalf("naming all three was not counted as naming the culprit (named %q)", v.Named)
			}
			if !strings.Contains(v.NamedName, "久瀬") || !strings.Contains(v.NamedName, "海堂") {
				t.Errorf("named_name = %q, want all three", v.NamedName)
			}
			if v.Ending.ID != "true" {
				t.Errorf("ending = %q, want true", v.Ending.ID)
			}
		})
	}
}

// Splitting the vote is not the same as spreading it everywhere: an accusation
// that really named nobody still names nobody.
func TestAHedgeIsNotAGroupAccusation(t *testing.T) {
	s := load(t)
	f := &fake{choice: scenario.NoMatch, noul: 0.1, score: 0,
		culprit: map[string]float64{"ruise": 0.1, "chitose": 0.1, "kaido": 0.1, "mochizuki": 0.1, scenario.NoMatch: 0.6}}
	e := &Engine{Asker: f, Policy: DefaultPolicy()}
	v, err := e.Grade(context.Background(), s, "誰がやったのかはわからない。")
	if err != nil {
		t.Fatal(err)
	}
	if v.Correct || v.Named != "" {
		t.Errorf("correct = %v, named = %q, want nobody", v.Correct, v.Named)
	}
}

// The group option is offered only where the answer is a group.
func TestTheGroupIsOfferedToTheGrader(t *testing.T) {
	s := load(t)
	f := &fake{choice: "ruise", prob: 0.9, noul: 0.9, score: 4}
	e := &Engine{Asker: f, Policy: DefaultPolicy()}
	if _, err := e.Grade(context.Background(), s, "推理です"); err != nil {
		t.Fatal(err)
	}
	opts, ok := f.asked[KeyCulprit].Criteria.(map[string]jev.Option)
	if !ok {
		t.Fatalf("culprit criteria are %T", f.asked[KeyCulprit].Criteria)
	}
	if _, ok := opts[scenario.Together]; !ok {
		t.Error("a case with several culprits offered no option for all of them")
	}
}
