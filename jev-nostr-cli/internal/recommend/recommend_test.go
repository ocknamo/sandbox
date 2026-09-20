package recommend

import (
	"slices"
	"testing"

	"github.com/ocknamo/sandbox/jev-nostr-cli/internal/jev"
)

func ptr(f float64) *float64 { return &f }

// answers builds a full set of noul answers, so each test only has to say
// which values it cares about.
func answers(insight, humor, relatable, promotional float64) map[string]jev.Answer {
	return map[string]jev.Answer{
		KeyInsight:     {Type: jev.TypeNoul, Noul: ptr(insight)},
		KeyHumor:       {Type: jev.TypeNoul, Noul: ptr(humor)},
		KeyRelatable:   {Type: jev.TypeNoul, Noul: ptr(relatable)},
		KeyPromotional: {Type: jev.TypeNoul, Noul: ptr(promotional)},
	}
}

func evaluate(t *testing.T, a map[string]jev.Answer) Verdict {
	t.Helper()
	v, err := Evaluate(a, DefaultPolicy())
	if err != nil {
		t.Fatalf("Evaluate: %v", err)
	}
	return v
}

// The reason the three positive signals are combined with max rather than an
// average: a post that is only funny still belongs on the timeline.
func TestAppealTakesTheStrongestSignalNotTheAverage(t *testing.T) {
	joke := evaluate(t, answers(0.05, 0.92, 0.10, 0.02))

	if !joke.Recommend {
		t.Errorf("a post scoring 0.92 on humour was not recommended: %+v", joke)
	}
	if joke.Appeal != 0.92 {
		t.Errorf("appeal = %v, want 0.92", joke.Appeal)
	}
	if joke.Reason != KeyHumor {
		t.Errorf("reason = %q, want %q", joke.Reason, KeyHumor)
	}

	// The same answers averaged would come to 0.36 and fall below the
	// threshold, which is exactly the outcome this rule exists to avoid.
	if avg := (0.05 + 0.92 + 0.10) / 3; avg >= DefaultPolicy().Appeal {
		t.Fatalf("average %v no longer falls below the threshold; the test has stopped proving anything", avg)
	}
}

func TestMediocreOnEveryAxisIsNotRecommended(t *testing.T) {
	v := evaluate(t, answers(0.4, 0.4, 0.4, 0.0))
	if v.Recommend {
		t.Errorf("a post at 0.4 on every signal was recommended: %+v", v)
	}
	if v.Vetoed {
		t.Error("rejected for lack of appeal should not be marked as vetoed")
	}
}

// Promotion is a veto: being good at something does not buy an advertisement
// a place on the timeline.
func TestPromotionalVetoesEvenAStrongPost(t *testing.T) {
	v := evaluate(t, answers(0.95, 0.90, 0.88, 0.80))
	if v.Recommend {
		t.Errorf("a promotional post was recommended: %+v", v)
	}
	if !v.Vetoed {
		t.Error("vetoed = false, want true")
	}
}

func TestSubstanceAndKindAreCarriedThrough(t *testing.T) {
	a := answers(0.9, 0.1, 0.2, 0.0)
	a[KeySubstance] = jev.Answer{Type: jev.TypeScore, Score: ptr(2.6), Legend: map[string]string{
		"0": "Content-free", "1": "A passing remark", "2": "An ordinary observation",
		"3": "A developed thought", "4": "A substantial point",
	}}
	a[KeyKind] = jev.Answer{Type: jev.TypeChoice, Choice: "insight", Confidence: ptr(0.77)}

	v := evaluate(t, a)

	if v.Substance == nil || *v.Substance != 2.6 {
		t.Errorf("substance = %v, want a pointer to 2.6", v.Substance)
	}
	if v.SubstanceTop != 4 {
		t.Errorf("substance top = %v, want 4 for a five-level rubric", v.SubstanceTop)
	}
	// 2.6 sits between levels and is nearer level 3 than level 2.
	if v.SubstanceLegend != "A developed thought" {
		t.Errorf("legend = %q, want the level 3 description", v.SubstanceLegend)
	}
	if v.Kind != "insight" {
		t.Errorf("kind = %q, want %q", v.Kind, "insight")
	}
	if v.KindConfidence != 0.77 {
		t.Errorf("kind confidence = %v, want 0.77", v.KindConfidence)
	}
}

// A missing score or choice costs a label, not the verdict.
func TestScoreAndChoiceAreOptional(t *testing.T) {
	v := evaluate(t, answers(0.9, 0.1, 0.2, 0.0))
	if !v.Recommend {
		t.Error("a strong post was not recommended when the score and choice were absent")
	}
	if v.Substance != nil {
		t.Errorf("substance = %v, want nil", *v.Substance)
	}
}

// A missing noul, by contrast, is the decision itself going missing.
func TestMissingNoulIsAnError(t *testing.T) {
	a := answers(0.9, 0.1, 0.2, 0.0)
	delete(a, KeyPromotional)
	if _, err := Evaluate(a, DefaultPolicy()); err == nil {
		t.Error("Evaluate succeeded without the promotional answer, want an error")
	}

	a = answers(0.9, 0.1, 0.2, 0.0)
	a[KeyHumor] = jev.Answer{Type: jev.TypeNoul} // present, but unanswered
	if _, err := Evaluate(a, DefaultPolicy()); err == nil {
		t.Error("Evaluate succeeded with an empty humour answer, want an error")
	}
}

func TestEvaluateIsDeterministic(t *testing.T) {
	// Insight and relatable tie; the winner must not depend on map order.
	a := answers(0.7, 0.1, 0.7, 0.0)
	first := evaluate(t, a)
	for range 50 {
		if got := evaluate(t, a); got.Reason != first.Reason {
			t.Fatalf("reason changed between runs: %q then %q", first.Reason, got.Reason)
		}
	}
}

func TestRankPutsStrongestAppealFirstAndBreaksTiesOnSubstance(t *testing.T) {
	weak := Verdict{Appeal: 0.3}
	strong := Verdict{Appeal: 0.9}
	tieHigh := Verdict{Appeal: 0.9, Substance: ptr(4)}
	tieLow := Verdict{Appeal: 0.9, Substance: ptr(1)}

	got := []Verdict{weak, tieLow, strong, tieHigh}
	slices.SortStableFunc(got, Rank)

	if got[0].Substance == nil || *got[0].Substance != 4 {
		t.Errorf("first = %+v, want the appeal 0.9 verdict with substance 4", got[0])
	}
	if got[len(got)-1].Appeal != 0.3 {
		t.Errorf("last = %+v, want the appeal 0.3 verdict", got[len(got)-1])
	}
	// A verdict with no substance must not outrank one that has it, and must
	// not panic on the nil.
	if Rank(strong, tieHigh) <= 0 {
		t.Error("a verdict with no substance outranked one with substance 4")
	}
}

func TestQuestionsCoverEveryKeyEvaluateReads(t *testing.T) {
	q := Questions()
	for _, key := range []string{KeyInsight, KeyHumor, KeyRelatable, KeyPromotional, KeySubstance, KeyKind} {
		if _, ok := q[key]; !ok {
			t.Errorf("Questions() has no %q", key)
		}
	}
	if len(q) != 6 {
		t.Errorf("Questions() has %d entries, want 6", len(q))
	}

	// The API requires criteria for a choice and a score, and accepts between
	// 2 and 10 levels for a score.
	if q[KeyKind].Criteria == nil {
		t.Error("the choice question carries no criteria")
	}
	levels, ok := q[KeySubstance].Criteria.([]string)
	if !ok {
		t.Fatalf("score criteria = %T, want []string", q[KeySubstance].Criteria)
	}
	if len(levels) < 2 || len(levels) > 10 {
		t.Errorf("score has %d levels, want between 2 and 10", len(levels))
	}
}

func TestLegendForPicksTheNearestLevel(t *testing.T) {
	legend := map[string]string{"0": "none", "1": "some", "2": "lots"}

	for _, tc := range []struct {
		score float64
		want  string
	}{
		{0, "none"},
		{0.4, "none"},
		{0.6, "some"},
		{1.43, "some"},
		{1.5, "lots"},
		{2, "lots"},
	} {
		if got := legendFor(legend, ptr(tc.score)); got != tc.want {
			t.Errorf("legendFor(%v) = %q, want %q", tc.score, got, tc.want)
		}
	}

	if got := legendFor(legend, nil); got != "" {
		t.Errorf("legendFor(nil) = %q, want empty", got)
	}
	if got := legendFor(nil, ptr(1.0)); got != "" {
		t.Errorf("legendFor with no legend = %q, want empty", got)
	}
}
