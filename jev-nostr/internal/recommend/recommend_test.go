package recommend

import (
	"slices"
	"testing"

	"github.com/ocknamo/sandbox/jev-nostr/internal/jev"
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
	for _, key := range []string{KeyInsight, KeyHumor, KeyRelatable, KeyPromotional, KeySubstance, KeyKind, KeyLanguage, KeyTopic} {
		if _, ok := q[key]; !ok {
			t.Errorf("Questions() has no %q", key)
		}
	}
	if len(q) != 8 {
		t.Errorf("Questions() has %d entries, want 8", len(q))
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

func TestLanguageCarriesTheWholeDistribution(t *testing.T) {
	a := answers(0.9, 0.1, 0.2, 0.0)
	a[KeyLanguage] = jev.Answer{
		Type:   jev.TypeChoice,
		Choice: "ja",
		// A post can read as more than one language at once, which is the
		// reason the distribution is kept rather than only the winner.
		Probabilities: map[string]float64{"ja": 0.62, "en": 0.35, "none": 0.03},
		Confidence:    ptr(0.62),
	}

	v := evaluate(t, a)

	if v.Language != "ja" {
		t.Errorf("language = %q, want ja", v.Language)
	}
	if got := v.LanguageScores["en"]; got != 0.35 {
		t.Errorf("language scores[en] = %v, want 0.35", got)
	}
	if len(v.LanguageScores) != 3 {
		t.Errorf("language scores has %d entries, want 3", len(v.LanguageScores))
	}

	// Which language a timeline wants is the reader's business, so it must
	// not touch the verdict.
	if !v.Recommend {
		t.Error("a strong post was rejected once a language came back")
	}
}

func TestLanguageIsOptional(t *testing.T) {
	v := evaluate(t, answers(0.9, 0.1, 0.2, 0.0))
	if v.Language != "" || v.LanguageScores != nil {
		t.Errorf("language = %q %v, want it absent", v.Language, v.LanguageScores)
	}
	if !v.Recommend {
		t.Error("a strong post was rejected when no language came back")
	}
}

func TestLanguageOptionsAreNamedAndDistinct(t *testing.T) {
	options, ok := Questions()[KeyLanguage].Criteria.(map[string]string)
	if !ok {
		t.Fatalf("language criteria = %T, want map[string]string", Questions()[KeyLanguage].Criteria)
	}
	// The API allows up to 255 options, but every description is read on
	// every request, so the list stays short on purpose.
	if len(options) < 2 || len(options) > 20 {
		t.Errorf("language has %d options, want a short list", len(options))
	}
	for _, key := range []string{"ja", "en"} {
		if options[key] == "" {
			t.Errorf("language option %q has no description", key)
		}
	}
	// A post made of emoji is not English; without this option the model
	// would have to call it something.
	if options["none"] == "" {
		t.Error("language has no option for a post with no language in it")
	}
}

func TestTopicCarriesTheWholeDistribution(t *testing.T) {
	a := answers(0.9, 0.1, 0.2, 0.0)
	// A post about writing software to analyse sport: neither subject wins
	// outright, which is the case the distribution exists to survive.
	a[KeyTopic] = jev.Answer{
		Type:          jev.TypeChoice,
		Choice:        "tech",
		Probabilities: map[string]float64{"tech": 0.45, "sports": 0.40, "science": 0.08, "other": 0.07},
		Confidence:    ptr(0.45),
	}

	v := evaluate(t, a)

	if v.Topic != "tech" {
		t.Errorf("topic = %q, want tech", v.Topic)
	}
	if got := v.TopicScores["sports"]; got != 0.40 {
		t.Errorf("topic scores[sports] = %v, want 0.40", got)
	}
	if v.TopicConfidence != 0.45 {
		t.Errorf("topic confidence = %v, want 0.45", v.TopicConfidence)
	}

	// Neither subject clears a half on its own; a reader interested in both
	// adds them, which only works if every entry survives.
	var interest float64
	for _, key := range []string{"tech", "sports"} {
		interest += v.TopicScores[key]
	}
	if interest < 0.8 {
		t.Errorf("tech+sports = %v, want the two to add up to 0.85", interest)
	}

	// Which subjects a reader wants is not the post's business.
	if !v.Recommend {
		t.Error("a strong post was rejected once a topic came back")
	}
}

func TestTopicIsOptional(t *testing.T) {
	v := evaluate(t, answers(0.9, 0.1, 0.2, 0.0))
	if v.Topic != "" || v.TopicScores != nil {
		t.Errorf("topic = %q %v, want it absent", v.Topic, v.TopicScores)
	}
	if !v.Recommend {
		t.Error("a strong post was rejected when no topic came back")
	}
}

func TestTopicOptionsAreUsableAsARubric(t *testing.T) {
	options, ok := Questions()[KeyTopic].Criteria.(map[string]jev.Option)
	if !ok {
		t.Fatalf("topic criteria = %T, want map[string]jev.Option", Questions()[KeyTopic].Criteria)
	}
	// Well under the 255 the API allows, and the docs ask for the full list
	// rather than a shortlist, so a flat list is right at this size.
	if len(options) < 10 || len(options) > 40 {
		t.Errorf("topic has %d options, want a flat list of roughly this size", len(options))
	}
	for key, opt := range options {
		if opt.What == "" {
			t.Errorf("topic option %q says nothing about what it covers", key)
		}
	}
	// A fallback, so the model can say none of the others fit.
	if options["other"].What == "" {
		t.Error("topic has no fallback option")
	}
	// The options most likely to swallow one another have to say what they
	// exclude, or "tech" absorbs both of the others.
	for _, key := range []string{"tech", "bitcoin", "nostr"} {
		if options[key].NotFor == "" {
			t.Errorf("topic option %q does not say what it excludes", key)
		}
	}
}
