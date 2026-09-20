// Command jev-nostr-cli sends a handful of Nostr posts to the Jev model and
// prints the answer it gets back for each one.
//
// This is step one of the recommendation timeline: prove the round trip works
// and see what a System One answer actually looks like, before anything is
// built on top of it. It asks a single narrow question per post and does no
// filtering of its own beyond reporting which posts clear a threshold.
package main

import (
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/ocknamo/sandbox/jev-nostr-cli/internal/jev"
)

// questionKey names the one question this step asks. The name is ours: the API
// echoes it back as the key of the matching answer.
const questionKey = "worth_reading"

// questions is deliberately a single narrow judgement. The docs are explicit
// that a question should be the kind of call a knowledgeable person could make
// in a couple of seconds; anything broader belongs in several questions whose
// results we combine in Go. Sharpening this into a real recommendation signal
// is the next step, not this one.
var questions = map[string]jev.Question{
	questionKey: jev.Noul(
		"Does this social media post say something substantive that a reader " +
			"who does not follow the author would find worth reading? Answer no " +
			"for greetings, spam, promotions and content-free chatter.",
	),
}

// post is the part of a Nostr event this step cares about. A real event carries
// tags and a signature too; none of that is needed to judge the text.
type post struct {
	ID      string `json:"id"`
	Pubkey  string `json:"pubkey"`
	Content string `json:"content"`
}

func main() {
	postsPath := flag.String("posts", "testdata/posts.json", "JSON file holding an array of Nostr events")
	model := flag.String("model", jev.DefaultModel, "Jev model identifier")
	threshold := flag.Float64("threshold", 0.5, "noul value at or above which a post counts as recommendable")
	raw := flag.Bool("raw", false, "also print the raw JSON response for each post")
	flag.Parse()

	if err := run(*postsPath, *model, *threshold, *raw); err != nil {
		fmt.Fprintln(os.Stderr, "error:", err)
		os.Exit(1)
	}
}

func run(postsPath, model string, threshold float64, raw bool) error {
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

	fmt.Printf("asking %q about %d posts (threshold %.2f)\n\n", model, len(posts), threshold)

	var recommended, inputTokens int
	for _, p := range posts {
		// One post per request. Batching several posts into one call is a
		// later optimisation; keeping it one-to-one here makes the mapping
		// from post to answer obvious.
		body, err := client.AskRaw(ctx, p.Content, questions)
		if err != nil {
			return fmt.Errorf("post %s: %w", short(p.ID), err)
		}

		var resp jev.Response
		if err := json.Unmarshal(body, &resp); err != nil {
			return fmt.Errorf("post %s: decode response: %w", short(p.ID), err)
		}

		answer, ok := resp.Answers[questionKey]
		if !ok {
			return fmt.Errorf("post %s: response has no %q answer", short(p.ID), questionKey)
		}
		if answer.Noul == nil {
			return fmt.Errorf("post %s: answer carries no noul value", short(p.ID))
		}

		verdict := "skip"
		if *answer.Noul >= threshold {
			verdict = "RECOMMEND"
			recommended++
		}
		inputTokens += resp.Usage.InputTokens

		fmt.Printf("%s  noul=%.3f  %-9s  %s\n", short(p.ID), *answer.Noul, verdict, preview(p.Content, 60))
		if raw {
			fmt.Printf("  raw: %s\n", body)
		}
	}

	fmt.Printf("\n%d of %d posts recommended, %d input tokens\n", recommended, len(posts), inputTokens)
	return nil
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
