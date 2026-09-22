package game

import (
	"context"
	"fmt"
	"strconv"

	"github.com/ocknamo/sandbox/jev-mystery/internal/jev"
	"github.com/ocknamo/sandbox/jev-mystery/internal/scenario"
)

// The keys naming the questions the accusation is graded with. Point questions
// are prefixed so that a scenario cannot name a point "culprit" and collide
// with the engine's own.
const (
	KeyCulprit   = "culprit"
	KeyCoherence = "coherence"
	pointPrefix  = "point_"
)

// maxAnswerRunes bounds the accusation. It is generous — this is the one place
// the player writes at length — but not unbounded, because the model bills for
// what it reads.
const maxAnswerRunes = 2000

// PointResult is how one element of the truth fared in the player's account.
type PointResult struct {
	ID    string  `json:"id"`
	Label string  `json:"label"`
	Value float64 `json:"value"`
	Hit   bool    `json:"hit"`
}

// Verdict is the graded accusation and the ending it earned.
type Verdict struct {
	// Named is the character the player accused, empty if they named nobody
	// the case recognises.
	Named     string `json:"named"`
	NamedName string `json:"named_name,omitempty"`
	Correct   bool   `json:"correct"`

	Points []PointResult `json:"points"`
	Hits   int           `json:"hits"`

	Coherence       float64 `json:"coherence"`
	CoherenceTop    float64 `json:"coherence_top"`
	CoherenceLegend string  `json:"coherence_legend,omitempty"`

	Ending scenario.Ending `json:"ending"`
}

// Grade puts the player's written solution to Jev and decides how the case
// closes.
//
// This is the part of the game that could not be built any other way. A
// free-text solution has to be read and judged, and the judgement has to be a
// value the code can branch on. It is also why the solution can be handed to
// the model at all: Jev answers with typed values and never with text, so the
// truth goes in and only numbers come back.
func (e *Engine) Grade(ctx context.Context, s *scenario.Scenario, answer string) (*Verdict, error) {
	answer = trim(answer, maxAnswerRunes)
	if answer == "" {
		return nil, ErrNoInput
	}

	resp, err := e.Asker.Ask(ctx, accusationFor(s, answer), gradeQuestions(s))
	if err != nil {
		return nil, err
	}

	v := &Verdict{}

	named, ok := resp.Answers[KeyCulprit]
	if !ok {
		return nil, fmt.Errorf("game: no %q answer in response", KeyCulprit)
	}
	// An accusation naming nobody is not a wrong accusation: the ending for
	// "named the right person" and the ending for "named no one" are
	// different, so `none` is kept rather than folded into a miss.
	if named.Choice != scenario.NoMatch {
		if c := s.Character(named.Choice); c != nil {
			v.Named, v.NamedName = c.ID, c.Name
			v.Correct = s.Finale.Blames(c.ID)
		}
	}

	for _, p := range s.Finale.Points {
		res := PointResult{ID: p.ID, Label: p.Label}
		if a, ok := resp.Answers[pointPrefix+p.ID]; ok && a.Noul != nil {
			res.Value = *a.Noul
			res.Hit = res.Value >= e.Policy.Point
		}
		if res.Hit {
			v.Hits++
		}
		v.Points = append(v.Points, res)
	}

	v.CoherenceTop = float64(len(s.Finale.CoherenceLevels) - 1)
	if a, ok := resp.Answers[KeyCoherence]; ok && a.Score != nil {
		v.Coherence = *a.Score
		v.CoherenceLegend = nearestLegend(a)
	}

	v.Ending = pickEnding(s, v)
	return v, nil
}

// pickEnding walks the endings in the order the scenario lists them and takes
// the first one the player has earned. The last is unconditional, which the
// scenario loader enforces, so this always returns one.
func pickEnding(s *scenario.Scenario, v *Verdict) scenario.Ending {
	for _, end := range s.Finale.Endings {
		if end.RequireCulprit && !v.Correct {
			continue
		}
		if v.Hits < end.MinPoints {
			continue
		}
		if v.Coherence < end.MinCoherence {
			continue
		}
		return end
	}
	return s.Finale.Endings[len(s.Finale.Endings)-1]
}

// nearestLegend names the rubric level the score sits closest to. The score is
// an expected level rather than an index, so it falls between the levels and
// has to be rounded before it can be read as one.
func nearestLegend(a jev.Answer) string {
	if a.Score == nil || len(a.Legend) == 0 {
		return ""
	}
	level := int(*a.Score + 0.5)
	return a.Legend[strconv.Itoa(level)]
}

// accusationView is what the model grades: the solution beside the truth.
type accusationView struct {
	Case                 string   `json:"case"`
	Suspects             []string `json:"suspects"`
	WhatActuallyHappened []string `json:"what_actually_happened"`
	DetectiveSays        string   `json:"the_detective_says"`
}

func accusationFor(s *scenario.Scenario, answer string) accusationView {
	v := accusationView{
		Case:                 s.Title,
		WhatActuallyHappened: scenario.Plain(s.Finale.Truth),
		DetectiveSays:        answer,
	}
	for _, c := range s.SuspectNames() {
		v.Suspects = append(v.Suspects, c.Name+"（"+c.Role+"）")
	}
	return v
}

func gradeQuestions(s *scenario.Scenario) map[string]jev.Question {
	suspects := make(map[string]jev.Option, len(s.Finale.Suspects)+1)
	for _, c := range s.SuspectNames() {
		suspects[c.ID] = jev.Option{What: c.Name + "。" + c.Role + "。"}
	}
	suspects[scenario.NoMatch] = jev.Option{
		What: "The detective names no culprit, hedges between several people " +
			"without settling on one, or accuses someone who is not on the list.",
		NotFor: "A statement that does settle on one of the named people, even " +
			"if it is phrased with some doubt. Nor for one that deliberately " +
			"blames several of the named people together, as its answer rather " +
			"than out of indecision: that is an accusation, not a hedge, and it " +
			"belongs to whichever of them it rests on most.",
	}

	qs := map[string]jev.Question{
		KeyCulprit: jev.ChoiceOptions(
			"A detective has just announced their solution to the case. Who are "+
				"they accusing of the killing? Judge only who they blame, not "+
				"whether they are right.",
			suspects),

		KeyCoherence: jev.Score(
			"Read the detective's statement as an argument, setting aside whether "+
				"it matches what actually happened. How well does it hang together: "+
				"does it explain the events, and does one part follow from another?",
			s.Finale.CoherenceLevels),
	}

	// Each element of the truth is one narrow yes/no. They are separate
	// questions rather than one "is this right?" because the difference
	// between a player who found the trick and one who found the motive is
	// exactly what decides the ending, and a single verdict cannot carry it.
	// Asking eight costs barely more than asking one: they run in parallel.
	for _, p := range s.Finale.Points {
		qs[pointPrefix+p.ID] = jev.Noul(string(p.Question))
	}
	return qs
}
