package router

import (
	"context"
	"sort"
	"strings"
	"testing"

	"github.com/ocknamo/sandbox/jev-bitcoin/internal/faq"
	"github.com/ocknamo/sandbox/jev-bitcoin/internal/jev"
)

// fake answers whichever of its canned answers a request asks for, and
// remembers what each request asked.
type fake struct {
	answers  map[string]jev.Answer
	requests [][]string
}

func (f *fake) Ask(_ context.Context, _ any, qs map[string]jev.Question) (*jev.Response, error) {
	var keys []string
	out := map[string]jev.Answer{}
	for k := range qs {
		keys = append(keys, k)
		if a, ok := f.answers[k]; ok {
			out[k] = a
		}
	}
	sort.Strings(keys)
	f.requests = append(f.requests, keys)
	return &jev.Response{Answers: out, Usage: jev.Usage{InputTokens: 100}}, nil
}

// choice builds a choice answer whose pick is the likeliest option.
func choice(probs map[string]float64) jev.Answer {
	best, bestP := "", -1.0
	for k, p := range probs {
		if p > bestP || (p == bestP && k < best) {
			best, bestP = k, p
		}
	}
	return jev.Answer{Type: jev.TypeChoice, Choice: best, Probabilities: probs}
}

func newRouter(t *testing.T, mode Mode, answers map[string]jev.Answer) (*Router, *fake) {
	t.Helper()
	c, err := faq.Builtin()
	if err != nil {
		t.Fatal(err)
	}
	f := &fake{answers: answers}
	if _, ok := answers[KeyKind]; !ok {
		answers[KeyKind] = choice(map[string]float64{KindQuestion: 0.9, KindOffTopic: 0.1})
	}
	return &Router{Corpus: c, Asker: f, Policy: DefaultPolicy(), Mode: mode}, f
}

func TestAnswersAClearMatch(t *testing.T) {
	r, f := newRouter(t, Single, map[string]jev.Answer{
		KeyCategory: choice(map[string]float64{"basics": 0.9, "mining": 0.05, "none": 0.05}),
		"in_basics": choice(map[string]float64{"q1_5": 0.85, "q1_6": 0.1, "none": 0.05}),
		"in_mining": choice(map[string]float64{"q2_6": 0.3, "none": 0.7}),
		KeyLevel:    choice(map[string]float64{LevelBeginner: 0.8, LevelTechnical: 0.2}),
	})
	res, err := r.Route(context.Background(), "  ビットコインって全部で何枚？ ")
	if err != nil {
		t.Fatal(err)
	}
	if res.Status != Answer || res.Best.ID != "1-5" {
		t.Fatalf("status = %s, best = %v; want answer 1-5", res.Status, res.Best)
	}
	if res.Level != LevelBeginner || res.Kind != KindQuestion {
		t.Errorf("level = %q, kind = %q", res.Level, res.Kind)
	}
	// One request, carrying the category, the kind, the level and every
	// shelf.
	if len(f.requests) != 1 || res.Requests != 1 {
		t.Fatalf("requests = %d, want 1", len(f.requests))
	}
	if got, want := len(f.requests[0]), 3+len(r.Corpus.Categories); got != want {
		t.Errorf("questions in the request = %d, want %d", got, want)
	}
}

// The product, not the category's argmax, decides: the answer is on the shelf
// that came second.
func TestReadsEveryShelf(t *testing.T) {
	r, _ := newRouter(t, Single, map[string]jev.Answer{
		KeyCategory:       choice(map[string]float64{"lightning": 0.50, "transactions": 0.45, "none": 0.05}),
		"in_lightning":    choice(map[string]float64{"q8_10": 0.1, "none": 0.9}),
		"in_transactions": choice(map[string]float64{"q3_4": 0.95, "none": 0.05}),
	})
	res, err := r.Route(context.Background(), "ライトニングの手数料って誰が決めるの")
	if err != nil {
		t.Fatal(err)
	}
	if res.Status != Answer || res.Best.ID != "3-4" {
		t.Fatalf("status = %s, best = %v; want answer 3-4", res.Status, res.Best)
	}
}

func TestCloseCallsAreSuggested(t *testing.T) {
	r, _ := newRouter(t, Single, map[string]jev.Answer{
		KeyCategory: choice(map[string]float64{"keys": 0.9, "none": 0.1}),
		"in_keys":   choice(map[string]float64{"q4_8": 0.45, "q4_9": 0.40, "none": 0.15}),
	})
	res, err := r.Route(context.Background(), "アドレス使い回しはダメ？")
	if err != nil {
		t.Fatal(err)
	}
	if res.Status != Suggest || res.Best != nil {
		t.Fatalf("status = %s, best = %v; want suggest", res.Status, res.Best)
	}
	var ids []string
	for _, c := range res.Suggestions(r.Policy) {
		ids = append(ids, c.Question.ID)
	}
	if strings.Join(ids, ",") != "4-8,4-9" {
		t.Errorf("suggestions = %v, want 4-8,4-9", ids)
	}
}

// A shelf's own "none" vetoes an outright answer however likely the shelf.
func TestShelfNoneVetoes(t *testing.T) {
	r, _ := newRouter(t, Single, map[string]jev.Answer{
		KeyCategory: choice(map[string]float64{"wallet": 0.95, "none": 0.05}),
		"in_wallet": choice(map[string]float64{"q5_1": 0.45, "none": 0.55}),
	})
	res, err := r.Route(context.Background(), "おすすめのウォレットアプリは？")
	if err != nil {
		t.Fatal(err)
	}
	if res.Status == Answer {
		t.Fatalf("answered %s although the shelf chose none", res.Best.ID)
	}
	if len(res.Candidates) == 0 || res.Candidates[0].BeatsNone {
		t.Errorf("candidates = %+v", res.Candidates)
	}
}

func TestMissWhenNothingIsClose(t *testing.T) {
	r, _ := newRouter(t, Single, map[string]jev.Answer{
		KeyCategory: choice(map[string]float64{"basics": 0.1, "none": 0.9}),
		"in_basics": choice(map[string]float64{"q1_19": 0.5, "none": 0.5}),
		KeyKind:     choice(map[string]float64{KindAdvice: 0.9, KindQuestion: 0.1}),
	})
	res, err := r.Route(context.Background(), "今買うべき？")
	if err != nil {
		t.Fatal(err)
	}
	if res.Status != Miss || res.Kind != KindAdvice {
		t.Fatalf("status = %s, kind = %s; want miss, advice", res.Status, res.Kind)
	}
}

func TestTwoStageAsksOnlyLikelyShelves(t *testing.T) {
	r, f := newRouter(t, TwoStage, map[string]jev.Answer{
		KeyCategory:  choice(map[string]float64{"privacy": 0.6, "keys": 0.3, "wallet": 0.05, "none": 0.05}),
		"in_privacy": choice(map[string]float64{"q10_6": 0.8, "none": 0.2}),
		"in_keys":    choice(map[string]float64{"q4_9": 0.3, "none": 0.7}),
	})
	res, err := r.Route(context.Background(), "同じアドレスを使うと何がバレる？")
	if err != nil {
		t.Fatal(err)
	}
	if len(f.requests) != 2 || res.Requests != 2 || res.InputTokens != 200 {
		t.Fatalf("requests = %d (%d tokens), want 2", len(f.requests), res.InputTokens)
	}
	if got := strings.Join(f.requests[0], ","); got != "category,kind,level" {
		t.Errorf("first request = %s", got)
	}
	// 0.6 + 0.3 reaches the 0.8 spread; wallet is not asked about.
	if got := strings.Join(f.requests[1], ","); got != "in_keys,in_privacy" {
		t.Errorf("second request = %s", got)
	}
	if res.Status != Answer || res.Best.ID != "10-6" {
		t.Fatalf("status = %s, best = %v; want answer 10-6", res.Status, res.Best)
	}
}

func TestEmptyInput(t *testing.T) {
	r, f := newRouter(t, Single, map[string]jev.Answer{})
	if _, err := r.Route(context.Background(), " 　\n"); err != ErrEmpty {
		t.Errorf("err = %v, want ErrEmpty", err)
	}
	if len(f.requests) != 0 {
		t.Error("an empty input reached the API")
	}
}

func TestClean(t *testing.T) {
	long := strings.Repeat("あ", MaxInput+10)
	if got := []rune(Clean(long)); len(got) != MaxInput {
		t.Errorf("len = %d, want %d", len(got), MaxInput)
	}
	if got := Clean("　 質問 \n"); got != "質問" {
		t.Errorf("Clean = %q", got)
	}
}

// Every shelf fits in one choice, and the options are keyed so they can be
// read back.
func TestShelvesAreWellFormed(t *testing.T) {
	r, _ := newRouter(t, Single, map[string]jev.Answer{})
	qs := r.Questions()
	for _, c := range r.Corpus.Categories {
		q, ok := qs[shelfPrefix+c.ID]
		if !ok {
			t.Fatalf("no shelf for %s", c.ID)
		}
		opts := q.Criteria.(map[string]string)
		if len(opts) != len(c.Questions)+1 || len(opts) > 255 {
			t.Errorf("%s: %d options", c.ID, len(opts))
		}
		for key := range opts {
			if key != faq.NoMatch && r.Corpus.ByKey(key) == nil {
				t.Errorf("%s: option %q is not a question", c.ID, key)
			}
		}
	}
}
