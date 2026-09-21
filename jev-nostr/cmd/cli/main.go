// Command jev-nostr-cli sends Nostr posts to the Jev model, combines the
// answers into a recommendation, and prints the timeline that results.
//
// It is the bench for the recommendation timeline: the questions in
// internal/recommend and the rule that combines them are the same ones the API
// will use, so tuning happens here, against real posts, with every signal
// visible.
package main

import (
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"math"
	"os"
	"os/signal"
	"slices"
	"strings"
	"syscall"
	"time"

	"github.com/ocknamo/sandbox/jev-nostr/internal/jev"
	"github.com/ocknamo/sandbox/jev-nostr/internal/recommend"
)

// post is the part of a Nostr event this command cares about. A real event
// carries tags and a signature too; none of that is needed to judge the text.
type post struct {
	ID      string `json:"id"`
	Pubkey  string `json:"pubkey"`
	Content string `json:"content"`
}

// judged pairs a post with what the model made of it.
type judged struct {
	post    post
	verdict recommend.Verdict
	elapsed time.Duration
}

func main() {
	postsPath := flag.String("posts", "testdata/posts.json", "JSON file holding an array of Nostr events")
	model := flag.String("model", jev.DefaultModel, "Jev model identifier")
	appeal := flag.Float64("appeal", recommend.DefaultPolicy().Appeal, "value the strongest positive signal must reach")
	promo := flag.Float64("promotional", recommend.DefaultPolicy().Promotional, "value at which a post is vetoed as promotional")
	raw := flag.Bool("raw", false, "also print the raw JSON response for each post")
	flag.Parse()

	policy := recommend.Policy{Appeal: *appeal, Promotional: *promo}
	if err := run(*postsPath, *model, policy, *raw); err != nil {
		fmt.Fprintln(os.Stderr, "error:", err)
		os.Exit(1)
	}
}

func run(postsPath, model string, policy recommend.Policy, raw bool) error {
	apiKey := os.Getenv("TYPESAFE_API_KEY")
	if apiKey == "" {
		return errors.New("TYPESAFE_API_KEY is not set")
	}

	posts, err := loadPosts(postsPath)
	if err != nil {
		return err
	}
	if len(posts) == 0 {
		return fmt.Errorf("%s holds no posts", postsPath)
	}

	client := jev.New(apiKey)
	client.Model = model
	// An override so the command can be pointed at a stub server during
	// development without a real key being involved.
	if endpoint := os.Getenv("TYPESAFE_ENDPOINT"); endpoint != "" {
		client.Endpoint = endpoint
		fmt.Printf("using endpoint override %s\n", endpoint)
	}

	// Ctrl-C should stop between posts rather than leave a request hanging.
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	questions := recommend.Questions()
	fmt.Printf("asking %q %d questions about %d posts (appeal >= %.2f, promotional veto >= %.2f)\n\n",
		model, len(questions), len(posts), policy.Appeal, policy.Promotional)

	results := make([]judged, 0, len(posts))
	var inputTokens int
	var totalElapsed time.Duration

	for _, p := range posts {
		// Still one request per post. Six questions ride along at almost no
		// extra cost, but a second post would need a second request.
		start := time.Now()
		body, err := client.AskRaw(ctx, p.Content, questions)
		elapsed := time.Since(start)
		if err != nil {
			return fmt.Errorf("post %s: %w", short(p.ID), err)
		}

		// An answer that does not fit the structs is the interesting case, so
		// both failures carry the body. Without it a CI log says only that
		// something did not match, and never what arrived.
		var resp jev.Response
		if err := json.Unmarshal(body, &resp); err != nil {
			return fmt.Errorf("post %s: decode response: %w\n  body: %s", short(p.ID), err, body)
		}
		verdict, err := recommend.Evaluate(resp.Answers, policy)
		if err != nil {
			return fmt.Errorf("post %s: %w\n  body: %s", short(p.ID), err, body)
		}

		inputTokens += resp.Usage.InputTokens
		totalElapsed += elapsed
		results = append(results, judged{post: p, verdict: verdict, elapsed: elapsed})

		printSignals(p, verdict, elapsed)
		if raw {
			fmt.Printf("  raw: %s\n", body)
		}
		fmt.Println()
	}

	printTimeline(results)

	fmt.Printf("\n%d input tokens, %s of request time (%s per post on average)\n",
		inputTokens, totalElapsed.Round(time.Millisecond),
		(totalElapsed / time.Duration(len(results))).Round(time.Millisecond))
	return nil
}

// printSignals shows every answer behind a verdict, not only the outcome. The
// point of this command is to see where a decision came from.
func printSignals(p post, v recommend.Verdict, elapsed time.Duration) {
	fmt.Printf("%s  %s  (%s)\n", short(p.ID), preview(p.Content, 56), elapsed.Round(time.Millisecond))
	fmt.Printf("    insight %.2f | humor %.2f | relatable %.2f | promotional %.2f\n",
		v.Insight, v.Humor, v.Relatable, v.Promotional)

	// The score is an expected level, not an index, so it is shown with the
	// decimal the API actually returned.
	substance := "n/a"
	if v.Substance != nil {
		substance = fmt.Sprintf("%.2f/%.0f", *v.Substance, v.SubstanceTop)
		if v.SubstanceLegend != "" {
			substance += " (" + v.SubstanceLegend + ")"
		}
	}
	fmt.Printf("    substance %s | kind %s %.2f | language %s\n",
		substance, v.Kind, v.KindConfidence, distribution(v.LanguageScores, v.Language, 3))
	fmt.Printf("    topic %s (confidence %.2f)\n",
		distribution(v.TopicScores, v.Topic, 4), v.TopicConfidence)

	switch {
	case v.Vetoed:
		fmt.Printf("    => VETOED as promotional\n")
	case v.Recommend:
		fmt.Printf("    => RECOMMEND on %s (appeal %.2f)\n", v.Reason, v.Appeal)
	default:
		fmt.Printf("    => skip (appeal %.2f, best was %s)\n", v.Appeal, v.Reason)
	}
}

// printTimeline shows what a caller of the API would actually receive.
func printTimeline(results []judged) {
	kept := make([]judged, 0, len(results))
	for _, r := range results {
		if r.verdict.Recommend {
			kept = append(kept, r)
		}
	}
	slices.SortStableFunc(kept, func(a, b judged) int {
		return recommend.Rank(a.verdict, b.verdict)
	})

	fmt.Printf("timeline: %d of %d posts\n", len(kept), len(results))
	for i, r := range kept {
		fmt.Printf("  %d. %s  %.2f %-9s  %s\n",
			i+1, short(r.post.ID), r.verdict.Appeal, r.verdict.Reason, preview(r.post.Content, 48))
	}
}

// distribution renders a choice's probabilities, strongest first, keeping only
// the options the model gave real weight and at most limit of them. The winner
// alone would hide the interesting case: a post that reads half Japanese and
// half English, or one about both software and sport.
func distribution(scores map[string]float64, winner string, limit int) string {
	if len(scores) == 0 {
		return winner
	}
	keys := make([]string, 0, len(scores))
	for k, v := range scores {
		if v >= 0.01 {
			keys = append(keys, k)
		}
	}
	slices.SortFunc(keys, func(a, b string) int {
		if d := scores[b] - scores[a]; d != 0 {
			return int(math.Copysign(1, d))
		}
		return strings.Compare(a, b)
	})

	if len(keys) > limit {
		keys = keys[:limit]
	}
	parts := make([]string, 0, len(keys))
	for _, k := range keys {
		parts = append(parts, fmt.Sprintf("%s %.2f", k, scores[k]))
	}
	return strings.Join(parts, " / ")
}

func loadPosts(path string) ([]post, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read posts: %w", err)
	}
	var posts []post
	if err := json.Unmarshal(data, &posts); err != nil {
		return nil, fmt.Errorf("parse posts: %w", err)
	}
	return posts, nil
}

// short abbreviates a 64-character event id down to something a log can show.
func short(id string) string {
	if len(id) <= 12 {
		return id
	}
	return id[:12]
}

// preview trims content to one line's worth. It counts runes, not bytes, so a
// Japanese post is not cut mid-character.
func preview(s string, max int) string {
	flat := []rune{}
	for _, r := range s {
		if r == '\n' || r == '\r' || r == '\t' {
			r = ' '
		}
		flat = append(flat, r)
	}
	if len(flat) <= max {
		return string(flat)
	}
	return string(flat[:max]) + "…"
}
