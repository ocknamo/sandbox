// Command cli plays a case from the terminal, against the real API.
//
// It is the tuning bench. The game's only hard question is whether a sentence
// a player typed lands on the action they meant, and that is an empirical
// question about a particular set of options: it can be argued about, or it
// can be measured. This measures it.
//
// A script line may name the action it expects, tab-separated, in which case
// the run ends with a tally. A script line without one is just played.
package main

import (
	"bufio"
	"context"
	"flag"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/ocknamo/sandbox/jev-mystery/internal/game"
	"github.com/ocknamo/sandbox/jev-mystery/internal/jev"
	"github.com/ocknamo/sandbox/jev-mystery/internal/scenario"
)

func main() {
	var (
		caseID  = flag.String("scenario", "clockwork", "which built-in case to play")
		model   = flag.String("model", jev.DefaultModel, "model identifier")
		script  = flag.String("script", "", "file of inputs to play, one per line (default: read stdin)")
		accuse  = flag.String("accuse", "", "file holding a written solution to grade after the script")
		match   = flag.Float64("match", game.DefaultPolicy().Match, "an option must reach this probability to count")
		conf    = flag.Float64("confidence", game.DefaultPolicy().Confidence, "and the choice must be this confident")
		point   = flag.Float64("point", game.DefaultPolicy().Point, "a point of the truth counts as found above this")
		verbose = flag.Bool("v", false, "print the options that were on offer each turn")
	)
	flag.Parse()

	if err := run(*caseID, *model, *script, *accuse, game.Policy{
		Match: *match, Confidence: *conf, Declare: game.DefaultPolicy().Declare, Point: *point,
	}, *verbose); err != nil {
		fmt.Fprintln(os.Stderr, "error:", err)
		os.Exit(1)
	}
}

func run(caseID, model, script, accuse string, policy game.Policy, verbose bool) error {
	sc, err := scenario.Builtin(caseID)
	if err != nil {
		return err
	}
	client := jev.New(os.Getenv("TYPESAFE_API_KEY"))
	client.Model = model
	if endpoint := os.Getenv("TYPESAFE_ENDPOINT"); endpoint != "" {
		client.Endpoint = endpoint
	}
	engine := &game.Engine{Asker: client, Policy: policy}

	lines, interactive, err := inputs(script)
	if err != nil {
		return err
	}

	fmt.Printf("%s — %s\n", sc.Title, sc.Byline)
	fmt.Printf("playing %q with %d actions (match >= %.2f, confidence >= %.2f)\n\n",
		caseID, len(sc.Actions), policy.Match, policy.Confidence)
	for _, p := range sc.Opening {
		fmt.Println(" ", p)
	}
	for _, p := range sc.Incident {
		fmt.Println(" ", p)
	}
	fmt.Println()

	ctx := context.Background()
	st := game.New(sc)

	var asked, right int
	for line := range lines {
		input, want, hasWant := strings.Cut(line, "\t")
		input = strings.TrimSpace(input)
		want = strings.TrimSpace(want)
		if input == "" || strings.HasPrefix(input, "#") {
			continue
		}

		if verbose {
			fmt.Printf("  [on offer: %s]\n", strings.Join(ids(game.Available(sc, st)), ", "))
		}

		start := time.Now()
		next, turn, err := engine.Play(ctx, sc, st, input)
		if err != nil {
			return fmt.Errorf("%q: %w", input, err)
		}
		st = next

		got := turn.Choice
		if !turn.Matched {
			got = scenario.NoMatch
		}
		fmt.Printf("> %s\n", input)
		fmt.Printf("    %-14s %.2f  conf %.2f  intent %-8s declare %.2f  (%.1fs)\n",
			got, turn.Score, turn.Confidence, turn.Intent, turn.Declare, time.Since(start).Seconds())
		if hasWant {
			asked++
			if got == want {
				right++
			} else {
				fmt.Printf("    MISMATCH: wanted %s\n", want)
			}
		}
		for _, p := range turn.Text {
			fmt.Println("   ", p)
		}
		if turn.Outcome != nil {
			for _, id := range turn.Outcome.Gained {
				fmt.Printf("    + %s\n", sc.Item(id).Name)
			}
		}
		fmt.Println()

		if interactive && turn.Finale {
			fmt.Println("    (推理を一行で書いてください)")
		}
	}

	if asked > 0 {
		fmt.Printf("routing: %d of %d inputs landed where they were meant to\n\n", right, asked)
	}

	if accuse == "" {
		return nil
	}
	if !game.FinaleOpen(sc, st) {
		return fmt.Errorf("the case is not ready for an accusation: %v collected", st.Evidence)
	}
	written, err := os.ReadFile(accuse)
	if err != nil {
		return err
	}
	return grade(ctx, engine, sc, string(written))
}

func grade(ctx context.Context, engine *game.Engine, sc *scenario.Scenario, written string) error {
	fmt.Println("accusation:")
	for _, line := range strings.Split(strings.TrimSpace(written), "\n") {
		fmt.Println("   ", line)
	}
	fmt.Println()

	start := time.Now()
	v, err := engine.Grade(ctx, sc, written)
	if err != nil {
		return err
	}
	named := v.NamedName
	if named == "" {
		named = "(名指しなし)"
	}
	fmt.Printf("  accused %s — %s  (%.1fs)\n", named, verdictWord(v.Correct), time.Since(start).Seconds())
	for _, p := range v.Points {
		fmt.Printf("    %-8s %.2f %s\n", p.Label, p.Value, hit(p.Hit))
	}
	fmt.Printf("    coherence %.2f/%.0f  %s\n", v.Coherence, v.CoherenceTop, v.CoherenceLegend)
	fmt.Printf("\n  ending %q — %s\n", v.Ending.ID, v.Ending.Title)
	for _, p := range v.Ending.Text {
		fmt.Println("   ", p)
	}
	return nil
}

func verdictWord(correct bool) string {
	if correct {
		return "right"
	}
	return "wrong"
}

func hit(ok bool) string {
	if ok {
		return "HIT"
	}
	return "-"
}

// inputs returns the lines to play. Reading a file gives a repeatable run to
// compare thresholds across; reading stdin makes it a game.
func inputs(script string) (<-chan string, bool, error) {
	if script == "" {
		return lines(bufio.NewScanner(os.Stdin)), true, nil
	}
	data, err := os.ReadFile(script)
	if err != nil {
		return nil, false, err
	}
	out := make(chan string)
	go func() {
		defer close(out)
		for _, line := range strings.Split(string(data), "\n") {
			out <- line
		}
	}()
	return out, false, nil
}

func lines(sc *bufio.Scanner) <-chan string {
	out := make(chan string)
	go func() {
		defer close(out)
		for sc.Scan() {
			out <- sc.Text()
		}
	}()
	return out
}

func ids(actions []*scenario.Action) []string {
	out := make([]string, 0, len(actions))
	for _, a := range actions {
		out = append(out, a.ID)
	}
	return out
}
