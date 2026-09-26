// Package router decides which prepared question a free-form input is asking.
//
// It works in two steps, as a person at a help desk would: first which shelf
// the question belongs on, then which question on that shelf it is. Both are
// Jev choices, and the answer is read as a product of the two:
//
//	score(q) = P(category = c) × P(q | c)
//
// The category's argmax is never trusted on its own. "What does a Lightning
// payment cost?" splits between lightning and transactions, and cutting the
// losing shelf away loses the answer whenever it was filed there. Reading
// every shelf through its own probability keeps a question that straddles two
// of them reachable from both.
//
// In the default mode both steps travel in one request: the category choice
// and every category's question choice side by side. Jev evaluates the
// questions of a request in parallel, so eleven shelves cost barely more time
// than one, and what costs money is the number of requests rather than the
// number of questions. TwoStage splits them into two requests, asking only the
// likely shelves the second time; it exists for a corpus too large for one
// request's context.
package router

import (
	"context"
	"errors"
	"fmt"
	"sort"
	"strings"
	"sync"

	"github.com/ocknamo/sandbox/jev-bitcoin/internal/faq"
	"github.com/ocknamo/sandbox/jev-bitcoin/internal/jev"
)

// The question keys in a request.
const (
	KeyCategory = "category"
	KeyKind     = "kind"
	KeyLevel    = "level"
	KeyMulti    = "multi"

	// shelfPrefix + a category ID is that category's question choice.
	shelfPrefix = "in_"
)

// What kind of thing the input is, whether or not the corpus answers it. It
// decides the words a miss is met with, and nothing else: a real question that
// the model also finds a little like investment advice still gets its answer.
const (
	KindQuestion = "question"
	KindGreeting = "greeting"
	KindAdvice   = "advice"
	KindOffTopic = "offtopic"
	KindNonsense = "nonsense"
)

// How much the reader seems to know. It only decides whether the longer half
// of an answer starts open; the answer itself is the same for everyone.
const (
	LevelBeginner     = "beginner"
	LevelIntermediate = "intermediate"
	LevelTechnical    = "technical"
)

// MaxInput is how much of an input is sent to the model, in characters. A
// question is a sentence or two; anything longer is unlikely to be one.
const MaxInput = 400

// Mode says how many requests a question costs.
type Mode string

const (
	// Single asks everything in one request.
	Single Mode = "single"
	// TwoStage asks for the category first, then for the questions of the
	// likely categories only.
	TwoStage Mode = "two_stage"
)

// Asker is the part of the Jev client the router uses, so tests can stand in
// for the API.
type Asker interface {
	Ask(ctx context.Context, state any, questions map[string]jev.Question) (*jev.Response, error)
}

// Policy is the part of the decision that stays in Go. Jev says what the input
// is; whether that is close enough to answer is decided here, where it can be
// tested and tuned without asking the model again.
type Policy struct {
	// Match is the combined score the best question needs to be answered
	// outright.
	Match float64
	// Margin is how far ahead of the runner-up the best question has to be.
	// Two prepared questions that both fit — "is reusing an address a
	// problem?" and "what goes wrong when I reuse one?" — are offered side by
	// side instead of one of them being picked by a coin toss.
	Margin float64
	// Floor is the score a question needs to be offered as "もしかして".
	Floor float64

	// Multi is how sure the model has to be that the input asks several
	// separate things before it is met with "one at a time, please" instead
	// of an answer.
	Multi float64

	// Spread and MaxCategories bound the second request in TwoStage: the
	// likeliest categories are asked about until their probabilities add up
	// to Spread, and never more than MaxCategories of them.
	Spread        float64
	MaxCategories int
}

// DefaultPolicy is a starting point, not a measurement.
func DefaultPolicy() Policy {
	return Policy{Match: 0.40, Margin: 0.15, Floor: 0.15, Multi: 0.60, Spread: 0.80, MaxCategories: 3}
}

// Status is what the router concluded.
type Status string

const (
	// Answer means one prepared question is clearly what was asked.
	Answer Status = "answer"
	// Suggest means some prepared questions are close, but none clearly.
	Suggest Status = "suggest"
	// Miss means nothing prepared is close.
	Miss Status = "miss"
	// Multiple means the input asks several separate things at once. Each
	// prepared answer answers one question, so answering the one that
	// happened to score best would quietly drop the rest; the reader is asked
	// to split them instead, with the closest questions offered to start from.
	Multiple Status = "multiple"
)

// Candidate is one prepared question and how well it fits.
type Candidate struct {
	Question *faq.Question
	// Score is Category × InCategory.
	Score      float64
	Category   float64
	InCategory float64
	// BeatsNone says the question out-voted "none of these" on its own shelf.
	// A question that did not is never answered outright, however its shelf
	// scored: the shelf's own `none` exists to absorb exactly that input.
	BeatsNone bool
}

// Result is the whole of one routing.
type Result struct {
	Status Status
	// Best is the answered question, when Status is Answer.
	Best *faq.Question
	// Candidates are the best-scoring questions, best first. There are at
	// most five, and only ones with a score above zero.
	Candidates []Candidate
	// Categories is the category distribution as the model gave it,
	// including "none".
	Categories map[string]float64

	Kind           string
	KindConfidence float64
	Level          string
	// Multi is the model's belief that the input asks several separate
	// things.
	Multi float64

	// Requests is how many calls to the API this took.
	Requests    int
	InputTokens int
}

// Router routes inputs against one corpus.
type Router struct {
	Corpus *faq.Corpus
	Asker  Asker
	Policy Policy
	Mode   Mode

	once    sync.Once
	head    map[string]jev.Question
	shelves map[string]jev.Question
}

// ErrEmpty is an input with nothing in it.
var ErrEmpty = errors.New("router: empty input")

// Route asks the model about an input and applies the policy.
func (r *Router) Route(ctx context.Context, input string) (*Result, error) {
	input = Clean(input)
	if input == "" {
		return nil, ErrEmpty
	}
	r.once.Do(r.build)

	res := &Result{}
	var answers map[string]jev.Answer

	switch r.Mode {
	case TwoStage:
		first, err := r.ask(ctx, res, input, r.head)
		if err != nil {
			return nil, err
		}
		qs := map[string]jev.Question{}
		for _, id := range likely(first[KeyCategory], r.Policy) {
			qs[shelfPrefix+id] = r.shelves[shelfPrefix+id]
		}
		answers = first
		if len(qs) > 0 {
			second, err := r.ask(ctx, res, input, qs)
			if err != nil {
				return nil, err
			}
			for k, v := range second {
				answers[k] = v
			}
		}
	default:
		qs := make(map[string]jev.Question, len(r.head)+len(r.shelves))
		for k, v := range r.head {
			qs[k] = v
		}
		for k, v := range r.shelves {
			qs[k] = v
		}
		var err error
		if answers, err = r.ask(ctx, res, input, qs); err != nil {
			return nil, err
		}
	}

	r.read(res, answers)
	return res, nil
}

func (r *Router) ask(ctx context.Context, res *Result, input string, qs map[string]jev.Question) (map[string]jev.Answer, error) {
	resp, err := r.Asker.Ask(ctx, input, qs)
	if err != nil {
		return nil, err
	}
	res.Requests++
	res.InputTokens += resp.Usage.InputTokens
	if resp.Answers == nil {
		return map[string]jev.Answer{}, nil
	}
	return resp.Answers, nil
}

// read turns the model's answers into a Result.
func (r *Router) read(res *Result, answers map[string]jev.Answer) {
	cat := answers[KeyCategory]
	res.Categories = cat.Probabilities

	kind := answers[KeyKind]
	res.Kind = kind.Choice
	res.KindConfidence = kind.Probabilities[kind.Choice]
	res.Level = answers[KeyLevel].Choice
	if m := answers[KeyMulti].Noul; m != nil {
		res.Multi = *m
	}

	var all []Candidate
	for _, c := range r.Corpus.Categories {
		shelf, ok := answers[shelfPrefix+c.ID]
		if !ok {
			continue
		}
		pc := cat.Probabilities[c.ID]
		none := shelf.Probabilities[faq.NoMatch]
		for key, p := range shelf.Probabilities {
			q := r.Corpus.ByKey(key)
			// A key from another shelf is not this shelf's to score; the
			// model has no business returning one, but it costs nothing to
			// refuse it.
			if q == nil || q.Category != c || pc*p <= 0 {
				continue
			}
			all = append(all, Candidate{Question: q, Score: pc * p, Category: pc, InCategory: p, BeatsNone: p > none})
		}
	}
	sort.Slice(all, func(i, j int) bool {
		if all[i].Score != all[j].Score {
			return all[i].Score > all[j].Score
		}
		return all[i].Question.ID < all[j].Question.ID
	})
	if len(all) > 5 {
		all = all[:5]
	}
	res.Candidates = all

	res.Status = r.Policy.decide(all, cat.Probabilities[faq.NoMatch])
	// Checked after the ranking, not instead of it: the candidates are still
	// worth offering, one of them is probably where the reader starts.
	if res.Multi > 0 && res.Multi >= r.Policy.Multi {
		res.Status = Multiple
	}
	if res.Status == Answer {
		res.Best = all[0].Question
	}
}

// decide applies the policy to the ranked candidates. none is the probability
// the category choice gave to "none of these shelves".
func (p Policy) decide(ranked []Candidate, none float64) Status {
	if len(ranked) == 0 {
		return Miss
	}
	best := ranked[0]
	runnerUp := 0.0
	if len(ranked) > 1 {
		runnerUp = ranked[1].Score
	}
	if best.BeatsNone && best.Score >= p.Match && best.Score > none && best.Score-runnerUp >= p.Margin {
		return Answer
	}
	if best.Score >= p.Floor {
		return Suggest
	}
	return Miss
}

// Suggestions are the candidates worth offering as "もしかして": those at or
// above the floor, at most three.
func (r *Result) Suggestions(p Policy) []Candidate {
	var out []Candidate
	for _, c := range r.Candidates {
		if c.Score < p.Floor || len(out) == 3 {
			break
		}
		out = append(out, c)
	}
	return out
}

// likely picks the categories the second request of TwoStage asks about.
func likely(cat jev.Answer, p Policy) []string {
	type pair struct {
		id string
		p  float64
	}
	var ps []pair
	for id, v := range cat.Probabilities {
		if id != faq.NoMatch && v > 0 {
			ps = append(ps, pair{id, v})
		}
	}
	sort.Slice(ps, func(i, j int) bool {
		if ps[i].p != ps[j].p {
			return ps[i].p > ps[j].p
		}
		return ps[i].id < ps[j].id
	})
	var out []string
	sum := 0.0
	for _, x := range ps {
		if len(out) >= p.MaxCategories || sum >= p.Spread {
			break
		}
		out = append(out, x.id)
		sum += x.p
	}
	return out
}

// build assembles the questions once. The corpus does not change while the
// service runs, so neither do they.
func (r *Router) build() {
	r.head = map[string]jev.Question{
		KeyCategory: categoryQuestion(r.Corpus),
		KeyKind:     kindQuestion(),
		KeyLevel:    levelQuestion(),
		KeyMulti:    multiQuestion(),
	}
	r.shelves = make(map[string]jev.Question, len(r.Corpus.Categories))
	for _, c := range r.Corpus.Categories {
		r.shelves[shelfPrefix+c.ID] = shelfQuestion(c)
	}
}

// Questions is every question a Single request carries. The CLI uses it to
// report the size of a request.
func (r *Router) Questions() map[string]jev.Question {
	r.once.Do(r.build)
	out := make(map[string]jev.Question, len(r.head)+len(r.shelves))
	for k, v := range r.head {
		out[k] = v
	}
	for k, v := range r.shelves {
		out[k] = v
	}
	return out
}

// The instructions are in English while the options and the input are in
// Japanese, as in the other Jev services here: the router's half of the prompt
// belongs with the code, and the content half belongs to the corpus.

func categoryQuestion(c *faq.Corpus) jev.Question {
	options := make(map[string]jev.Option, len(c.Categories)+1)
	for _, cat := range c.Categories {
		options[cat.ID] = jev.Option{What: cat.Match.What, NotFor: cat.Match.NotFor, Examples: cat.Match.Examples}
	}
	options[faq.NoMatch] = jev.Option{
		What: "The input is not a question about Bitcoin at all: a greeting, " +
			"small talk, another subject, another cryptocurrency on its own, " +
			"or text that asks nothing.",
		NotFor: "Any question about Bitcoin, however casually or vaguely it " +
			"is worded, including ones that compare Bitcoin with something else.",
		Examples: []string{"こんにちは", "今日の天気は？", "イーサリアムのガス代の仕組み"},
	}
	return jev.ChoiceOptions(
		"A user typed a question into a Bitcoin Q&A service. Which topic of "+
			"the service's FAQ does it belong to? Judge by what the user wants "+
			"to know, not by which words appear. Choose 'none' only if it is "+
			"not a question about Bitcoin.",
		options)
}

func shelfQuestion(c *faq.Category) jev.Question {
	options := make(map[string]string, len(c.Questions)+1)
	for _, q := range c.Questions {
		options[q.Key()] = q.Title
	}
	options[faq.NoMatch] = "None of the prepared questions asks the same " +
		"thing as the user, so none of their answers would answer the user. " +
		"This includes a question about a different topic altogether."
	return jev.Choice(
		fmt.Sprintf("A user typed a question into a Bitcoin Q&A service. "+
			"Below are the prepared questions in the FAQ's %q section, each "+
			"with its own written answer. Which prepared question asks the same "+
			"thing as the user, so that its answer would answer the user? Judge "+
			"by meaning, not by shared words: the user may be casual, use other "+
			"terms, write in another language, or build the question on a "+
			"misconception. Choose 'none' if no prepared question here would be "+
			"answered by the same answer.", c.Name),
		options)
}

func kindQuestion() jev.Question {
	return jev.Choice(
		"A user typed this into a Bitcoin Q&A service. What kind of message is "+
			"it, whether or not the service can answer it?",
		map[string]string{
			KindQuestion: "A question, or a request to explain something, about how Bitcoin works, " +
				"its history, its use, or its technology. Includes skeptical or critical questions.",
			KindGreeting: "A greeting, thanks, or small talk addressed to the service, with no question in it.",
			KindAdvice: "A request for financial advice or a prediction: whether to buy or sell, " +
				"what the price will be, which coin will go up, how much to invest.",
			KindOffTopic: "A question about something other than Bitcoin, including other cryptocurrencies on their own.",
			KindNonsense: "Text that asks nothing and says nothing: gibberish, a stray word, a keyboard mash.",
		})
}

// multiQuestion asks whether one message holds several questions. It is a
// noul of its own rather than an option of kind: a message with two questions
// in it is still a question, and making the two compete would have one of
// them lose.
func multiQuestion() jev.Question {
	return jev.Noul(
		"A user typed this into a Bitcoin Q&A service that answers one question " +
			"at a time. Does the message ask two or more separate questions that " +
			"would each need their own answer? True for \"What is Lightning, and " +
			"who invented Bitcoin?\". False for a single question, even a long " +
			"one, and false for one question with a follow-up detail about the " +
			"same point, such as \"What is a UTXO, in simple terms?\".")
}

func levelQuestion() jev.Question {
	return jev.Choice(
		"Judging only by how it is worded, how much does the person who wrote "+
			"this question seem to know about Bitcoin already?",
		map[string]string{
			LevelBeginner:     "New to it: everyday words, no technical terms, or a basic misconception.",
			LevelIntermediate: "Knows the basics: uses common terms such as wallet, fee, or mining correctly.",
			LevelTechnical: "Knows the protocol: uses precise technical terms such as UTXO, " +
				"sat/vB, descriptor, HTLC, or BIP numbers.",
		})
}

// Clean trims an input and cuts it to MaxInput characters. Leading and
// trailing whitespace is the writer's, not the model's business, and
// anything past the limit is unlikely to be part of a question.
func Clean(s string) string {
	s = strings.TrimFunc(s, isSpace)
	if r := []rune(s); len(r) > MaxInput {
		s = strings.TrimFunc(string(r[:MaxInput]), isSpace)
	}
	return s
}

func isSpace(r rune) bool {
	switch r {
	case ' ', '\t', '\n', '\r', '　':
		return true
	}
	return false
}
