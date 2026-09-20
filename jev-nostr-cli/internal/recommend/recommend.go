package recommend

import (
	"fmt"

	"github.com/ocknamo/sandbox/jev-nostr-cli/internal/jev"
)

// Policy is the part of the decision that stays in Go. Jev reports what a post
// is; the policy decides what that earns.
type Policy struct {
	// Appeal is the value the strongest positive signal has to reach.
	Appeal float64

	// Promotional rejects a post outright at or above this value, however
	// well it scores elsewhere. A well-written advertisement is still an
	// advertisement, so this is a veto and not a subtraction.
	Promotional float64
}

// DefaultPolicy is the starting point. Both thresholds sit at the midpoint
// because nothing yet says where the real boundaries are.
func DefaultPolicy() Policy {
	return Policy{Appeal: 0.5, Promotional: 0.5}
}

// Verdict is what one post earned, with every signal kept so that a decision
// can be explained rather than just obeyed.
type Verdict struct {
	Insight     float64
	Humor       float64
	Relatable   float64
	Promotional float64

	// Appeal is the strongest of the three positive signals, and Reason names
	// which one it was.
	Appeal float64
	Reason string

	// Substance and Kind come from the score and choice questions. Substance
	// is the raw value the API returned; see Evaluate for why it is a pointer
	// and why nothing depends on its absolute size yet.
	Substance       *float64
	SubstanceLegend string
	Kind            string
	KindConfidence  float64

	Recommend bool

	// Vetoed marks a post rejected as promotional rather than for lack of
	// appeal. Without it the two failures look identical in the output.
	Vetoed bool
}

// Evaluate combines one post's answers into a verdict.
//
// Appeal is the maximum of the three positive signals, not their average. A
// good joke is not a weak essay: a post that scores 0.9 on humour and 0.1 on
// insight has earned its place, and averaging would bury it under a post that
// is mediocre at everything. Any one reason to read something is a reason.
//
// The substance score is carried through but not yet part of the decision.
// The API documents a score as an index into the rubric without saying whether
// it counts from zero or one, and guessing wrong would quietly shift every
// threshold. It is used for ranking, where only the ordering matters.
func Evaluate(answers map[string]jev.Answer, policy Policy) (Verdict, error) {
	var v Verdict
	var err error

	if v.Insight, err = noul(answers, KeyInsight); err != nil {
		return Verdict{}, err
	}
	if v.Humor, err = noul(answers, KeyHumor); err != nil {
		return Verdict{}, err
	}
	if v.Relatable, err = noul(answers, KeyRelatable); err != nil {
		return Verdict{}, err
	}
	if v.Promotional, err = noul(answers, KeyPromotional); err != nil {
		return Verdict{}, err
	}

	// The score and choice answers only decorate the output, so a model that
	// declines to answer them costs a label, not the verdict.
	if a, ok := answers[KeySubstance]; ok {
		v.Substance = a.Score
		v.SubstanceLegend = a.Legend
	}
	if a, ok := answers[KeyKind]; ok {
		v.Kind = a.Choice
		if a.Confidence != nil {
			v.KindConfidence = *a.Confidence
		}
	}

	v.Appeal, v.Reason = strongest(map[string]float64{
		KeyInsight:   v.Insight,
		KeyHumor:     v.Humor,
		KeyRelatable: v.Relatable,
	})

	switch {
	case v.Promotional >= policy.Promotional:
		v.Vetoed = true
	case v.Appeal >= policy.Appeal:
		v.Recommend = true
	}
	return v, nil
}

// Rank orders verdicts the way the timeline should present them: strongest
// appeal first, with the substance score breaking ties. Only the ordering of
// the score is relied on, never its size.
//
// It returns a comparison rather than sorting, so the caller keeps hold of
// whatever it has attached each verdict to.
func Rank(a, b Verdict) int {
	switch {
	case a.Appeal > b.Appeal:
		return -1
	case a.Appeal < b.Appeal:
		return 1
	}
	switch {
	case a.Substance == nil && b.Substance == nil:
		return 0
	case a.Substance == nil:
		return 1
	case b.Substance == nil:
		return -1
	case *a.Substance > *b.Substance:
		return -1
	case *a.Substance < *b.Substance:
		return 1
	}
	return 0
}

// noul reads one required yes/no answer.
func noul(answers map[string]jev.Answer, key string) (float64, error) {
	a, ok := answers[key]
	if !ok {
		return 0, fmt.Errorf("recommend: no answer for %q", key)
	}
	if a.Noul == nil {
		return 0, fmt.Errorf("recommend: answer for %q carries no noul value", key)
	}
	return *a.Noul, nil
}

// strongest returns the highest value and the key that held it. Ties are
// broken by the fixed order below so that the same answers always produce the
// same reason; ranging over a map would pick a different winner each run.
func strongest(signals map[string]float64) (float64, string) {
	best, reason := 0.0, ""
	for _, key := range []string{KeyInsight, KeyHumor, KeyRelatable} {
		if v := signals[key]; v > best || reason == "" {
			best, reason = v, key
		}
	}
	return best, reason
}
