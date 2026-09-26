// Command cli asks the Q&A questions from the terminal, against the real API.
//
// It is the tuning bench. The service's only hard question is whether the
// Japanese a reader actually types lands on the prepared question they meant,
// and that can be argued about or measured. This measures it.
//
// A line of the query file is "入力<TAB>期待", where 期待 is one of
//
//	1-7            the prepared question it should be answered with
//	none           nothing should be answered
//	kind:advice    nothing should be answered, and it should read as advice
//	multi          it should be read as several questions at once
//
// A line with no expectation is just asked. The run ends with a tally and
// with the categories the model confused, which say where a category's
// not_for needs work.
package main

import (
	"bufio"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"sort"
	"strings"
	"time"

	"github.com/ocknamo/sandbox/jev-bitcoin/internal/faq"
	"github.com/ocknamo/sandbox/jev-bitcoin/internal/jev"
	"github.com/ocknamo/sandbox/jev-bitcoin/internal/router"
)

func main() {
	d := router.DefaultPolicy()
	var (
		queries = flag.String("queries", "", "file of \"input<TAB>expected\" lines (default: read stdin)")
		model   = flag.String("model", jev.DefaultModel, "model identifier")
		mode    = flag.String("mode", string(router.TwoStage), "two_stage or single")
		match   = flag.Float64("match", d.Match, "the best question needs this combined score to be answered")
		margin  = flag.Float64("margin", d.Margin, "and must lead the runner-up by this much")
		floor   = flag.Float64("floor", d.Floor, "a question is suggested at or above this score")
		multi   = flag.Float64("multi", d.Multi, "an input counts as several questions at or above this")
		verbose = flag.Bool("v", false, "print every candidate with its numbers")
	)
	flag.Parse()

	p := d
	p.Match, p.Margin, p.Floor, p.Multi = *match, *margin, *floor, *multi
	if err := run(*queries, *model, router.Mode(*mode), p, *verbose); err != nil {
		fmt.Fprintln(os.Stderr, "error:", err)
		os.Exit(1)
	}
}

type query struct {
	input, expect string
}

type tally struct {
	total, hit, near, wrong int
	tokens                  int
	confused                map[string]int
}

func run(path, model string, mode router.Mode, policy router.Policy, verbose bool) error {
	if mode != router.Single && mode != router.TwoStage {
		return fmt.Errorf("unknown mode %q", mode)
	}
	corpus, err := faq.Builtin()
	if err != nil {
		return err
	}
	client := jev.New(os.Getenv("TYPESAFE_API_KEY"))
	client.Model = model
	if endpoint := os.Getenv("TYPESAFE_ENDPOINT"); endpoint != "" {
		client.Endpoint = endpoint
	}
	r := &router.Router{Corpus: corpus, Asker: client, Policy: policy, Mode: mode}

	size, _ := json.Marshal(r.Questions())
	fmt.Printf("%d questions in %d categories (%d answered); a single request carries %d KB of questions\n",
		corpus.Len(), len(corpus.Categories), corpus.Answered(), len(size)/1024)
	fmt.Printf("mode %s, match >= %.2f, margin >= %.2f, floor >= %.2f\n\n",
		mode, policy.Match, policy.Margin, policy.Floor)

	qs, err := readQueries(path)
	if err != nil {
		return err
	}
	for _, q := range qs {
		if q.expect == "" || q.expect == "none" || q.expect == "multi" || strings.HasPrefix(q.expect, "kind:") {
			continue
		}
		if corpus.Question(q.expect) == nil {
			return fmt.Errorf("query %q expects %s, which is not a question", q.input, q.expect)
		}
	}

	t := tally{confused: map[string]int{}}
	ctx := context.Background()
	for _, q := range qs {
		start := time.Now()
		res, err := r.Route(ctx, q.input)
		if err != nil {
			return fmt.Errorf("%q: %w", q.input, err)
		}
		t.tokens += res.InputTokens
		verdict := judge(corpus, &t, q, res)
		fmt.Printf("%-5s %s  (%.1fs)\n", verdict, q.input, time.Since(start).Seconds())
		fmt.Printf("      => %s  [%s, %s, multi %.2f]%s\n", describe(res, policy), res.Kind, res.Level, res.Multi, expected(corpus, q.expect))
		if verbose {
			for _, c := range res.Candidates {
				fmt.Printf("         %-6s %.3f = %.2f × %.2f  %v  %s\n",
					c.Question.ID, c.Score, c.Category, c.InCategory, c.BeatsNone, c.Question.Title)
			}
		}
	}

	if t.total > 0 {
		fmt.Printf("\n%d of %d as expected (%.0f%%); %d more offered it as a suggestion; %d wrong\n",
			t.hit, t.total, 100*float64(t.hit)/float64(t.total), t.near, t.wrong)
	}
	if len(t.confused) > 0 {
		fmt.Println("\ncategories taken for another (expected -> the model's top category):")
		var keys []string
		for k := range t.confused {
			keys = append(keys, k)
		}
		sort.Slice(keys, func(i, j int) bool {
			if t.confused[keys[i]] != t.confused[keys[j]] {
				return t.confused[keys[i]] > t.confused[keys[j]]
			}
			return keys[i] < keys[j]
		})
		for _, k := range keys {
			fmt.Printf("  %3d  %s\n", t.confused[k], k)
		}
	}
	fmt.Printf("\ninput tokens: %d\n", t.tokens)
	return nil
}

// judge scores one routing against its expectation.
func judge(corpus *faq.Corpus, t *tally, q query, res *router.Result) string {
	if q.expect == "" {
		return "-"
	}
	t.total++
	var ok, near bool
	switch {
	case q.expect == "none":
		ok = res.Status == router.Miss
	case q.expect == "multi":
		ok = res.Status == router.Multiple
	case strings.HasPrefix(q.expect, "kind:"):
		ok = res.Status != router.Answer && res.Kind == strings.TrimPrefix(q.expect, "kind:")
	default:
		ok = res.Status == router.Answer && res.Best.ID == q.expect
		for _, c := range res.Candidates {
			if c.Question.ID == q.expect && res.Status == router.Suggest {
				near = true
			}
		}
		want := corpus.Question(q.expect).Category.ID
		if got := topCategory(res); got != want {
			t.confused[want+" -> "+got]++
		}
	}
	switch {
	case ok:
		t.hit++
		return "OK"
	case near:
		t.near++
		return "NEAR"
	default:
		t.wrong++
		return "NG"
	}
}

func topCategory(res *router.Result) string {
	best, bestP := "none", -1.0
	for id, p := range res.Categories {
		if p > bestP || (p == bestP && id < best) {
			best, bestP = id, p
		}
	}
	return best
}

func describe(res *router.Result, p router.Policy) string {
	switch res.Status {
	case router.Answer:
		return fmt.Sprintf("answer %s %s (%.2f)", res.Best.ID, res.Best.Title, res.Candidates[0].Score)
	case router.Multiple:
		var parts []string
		for _, c := range res.Suggestions(p) {
			parts = append(parts, fmt.Sprintf("%s (%.2f)", c.Question.ID, c.Score))
		}
		return "multiple " + strings.Join(parts, ", ")
	case router.Suggest:
		var parts []string
		for _, c := range res.Suggestions(p) {
			parts = append(parts, fmt.Sprintf("%s (%.2f)", c.Question.ID, c.Score))
		}
		return "suggest " + strings.Join(parts, ", ")
	}
	if len(res.Candidates) > 0 {
		return fmt.Sprintf("miss (nearest %s %.2f)", res.Candidates[0].Question.ID, res.Candidates[0].Score)
	}
	return "miss"
}

func expected(corpus *faq.Corpus, expect string) string {
	if q := corpus.Question(expect); q != nil {
		return "  expected " + q.ID + " " + q.Title
	}
	if expect != "" {
		return "  expected " + expect
	}
	return ""
}

func readQueries(path string) ([]query, error) {
	f := os.Stdin
	if path != "" {
		var err error
		if f, err = os.Open(path); err != nil {
			return nil, err
		}
		defer f.Close()
	}
	var out []query
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		input, expect, _ := strings.Cut(line, "\t")
		out = append(out, query{input: strings.TrimSpace(input), expect: strings.TrimSpace(expect)})
	}
	return out, scanner.Err()
}
