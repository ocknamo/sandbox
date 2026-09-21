package recommend

import (
	"fmt"
	"math"
	"strconv"

	"github.com/ocknamo/sandbox/jev-nostr/internal/jev"
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
	// is the expected level on the rubric, between 0 and SubstanceTop, and
	// falls between whole levels. SubstanceLegend is the description of the
	// level it sits nearest.
	Substance       *float64
	SubstanceTop    float64
	SubstanceLegend string
	Kind            string
	KindConfidence  float64

	// Language is the language the model settled on, but LanguageScores is
	// the useful part: the whole distribution, so that a caller can ask how
	// Japanese a post reads without caring which language won. A post can be
	// 0.6 Japanese and 0.4 English, and a Japanese timeline may well want it.
	Language       string
	LanguageScores map[string]float64

	// Topic is the subject the model settled on, and TopicScores the whole
	// distribution behind it. A choice sums to 1, so a post spanning two
	// subjects clears neither on its own; a reader interested in both adds
	// their scores, which is why the distribution has to survive intact.
	// TopicConfidence falls when the weight is spread, which is itself the
	// signal that a post straddles subjects.
	Topic           string
	TopicScores     map[string]float64
	TopicConfidence float64

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
// Language and topic are carried through and never acted on. Which language a
// timeline wants, and which subjects interest its reader, are not properties
// of the post, and a service that decided them here would have to be asked
// again every time a reader changed their mind.
//
// The substance score is carried through but not yet part of the decision. It
// is a graded value rather than a yes/no, so folding it in means choosing how
// much weight it carries against the nouls, and there is nothing to base that
// on until the real answers have been looked at. For now it breaks ranking
// ties, where only the ordering matters.
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
		v.SubstanceTop = float64(len(a.Legend)) - 1
		v.SubstanceLegend = legendFor(a.Legend, a.Score)
	}
	if a, ok := answers[KeyKind]; ok {
		v.Kind = a.Choice
		if a.Confidence != nil {
			v.KindConfidence = *a.Confidence
		}
	}
	if a, ok := answers[KeyLanguage]; ok {
		v.Language = a.Choice
		v.LanguageScores = a.Probabilities
	}
	if a, ok := answers[KeyTopic]; ok {
		v.Topic = a.Choice
		v.TopicScores = a.Probabilities
		if a.Confidence != nil {
			v.TopicConfidence = *a.Confidence
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

// legendFor names the rubric level a score sits nearest. A score of 1.43 is
// between levels, and the nearer of the two is the honest label for it.
func legendFor(legend map[string]string, score *float64) string {
	if score == nil || len(legend) == 0 {
		return ""
	}
	return legend[strconv.Itoa(int(math.Round(*score)))]
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
