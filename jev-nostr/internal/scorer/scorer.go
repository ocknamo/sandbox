// Package scorer puts a batch of posts to the model and collects what comes
// back, several requests at a time.
//
// Concurrency lives here because the API charges by the request rather than by
// the question: six questions ride along in one call, but a second post needs
// a second call. A batch of thirty posts is thirty requests, and running them
// one after another is the only slow part of the whole pipeline.
package scorer

import (
	"context"
	"sync"

	"github.com/ocknamo/sandbox/jev-nostr/internal/jev"
	"github.com/ocknamo/sandbox/jev-nostr/internal/recommend"
)

// DefaultConcurrency is how many requests are kept in flight.
//
// The published limit is 1,200 requests per minute, or 20 a second, and a call
// takes roughly 220ms. One worker therefore manages about 4.5 requests a
// second, so four of them come to 18: close to the limit without crossing it.
// The token limit of 250k a second is nowhere near binding at ~670 tokens a
// request, which is why this counts requests and not tokens.
const DefaultConcurrency = 4

// Post is the part of a Nostr event that gets judged.
type Post struct {
	ID      string `json:"id"`
	Content string `json:"content"`
}

// Result is one post's signals, flattened for a JSON response.
//
// It deliberately carries no verdict. Whether a post is recommended depends on
// thresholds the caller chooses, and a caller that holds the signals can move
// those thresholds without asking the model anything again.
type Result struct {
	ID string `json:"id"`

	Insight     float64 `json:"insight"`
	Humor       float64 `json:"humor"`
	Relatable   float64 `json:"relatable"`
	Promotional float64 `json:"promotional"`

	Appeal float64 `json:"appeal"`
	Reason string  `json:"reason"`

	Substance       *float64 `json:"substance,omitempty"`
	SubstanceTop    float64  `json:"substance_top,omitempty"`
	SubstanceLegend string   `json:"substance_legend,omitempty"`

	Kind           string  `json:"kind,omitempty"`
	KindConfidence float64 `json:"kind_confidence,omitempty"`

	// Error explains a post the model could not be asked about. One failure
	// costs its own post and nothing else, which matters when a page is
	// scoring a live feed and would rather show nine results than none.
	Error string `json:"error,omitempty"`
}

// Scorer asks about posts. The zero value is not usable; build one with New.
type Scorer struct {
	client      *jev.Client
	concurrency int
	questions   map[string]jev.Question
}

// New returns a scorer over the given client.
func New(client *jev.Client) *Scorer {
	return &Scorer{
		client:      client,
		concurrency: DefaultConcurrency,
		questions:   recommend.Questions(),
	}
}

// SetConcurrency overrides how many requests run at once. Values below one are
// ignored.
func (s *Scorer) SetConcurrency(n int) {
	if n > 0 {
		s.concurrency = n
	}
}

// Score judges every post. Results come back in the order the posts were
// given, whatever order the answers arrived in, so a caller can pair them up
// by position as well as by id.
func (s *Scorer) Score(ctx context.Context, posts []Post) []Result {
	results := make([]Result, len(posts))

	workers := min(s.concurrency, len(posts))
	if workers < 1 {
		return results
	}

	// A plain index channel rather than a job struct: the work is entirely
	// described by where in the slice it lives.
	indexes := make(chan int)
	var wg sync.WaitGroup
	for range workers {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for i := range indexes {
				results[i] = s.one(ctx, posts[i])
			}
		}()
	}
	for i := range posts {
		select {
		case indexes <- i:
		case <-ctx.Done():
			// Stop handing out work; whatever is in flight still finishes,
			// and the posts never started keep their zero Result.
			close(indexes)
			wg.Wait()
			return results
		}
	}
	close(indexes)
	wg.Wait()
	return results
}

// one judges a single post. Its error is reported in the result rather than
// returned, so that one failure cannot take the batch down with it.
func (s *Scorer) one(ctx context.Context, p Post) Result {
	out := Result{ID: p.ID}

	resp, err := s.client.Ask(ctx, p.Content, s.questions)
	if err != nil {
		out.Error = err.Error()
		return out
	}
	// The policy passed here does not matter: only the signals are copied
	// out, never the Recommend or Vetoed flags it decides. Thresholds belong
	// to whoever reads the Result.
	verdict, err := recommend.Evaluate(resp.Answers, recommend.DefaultPolicy())
	if err != nil {
		out.Error = err.Error()
		return out
	}

	out.Insight = verdict.Insight
	out.Humor = verdict.Humor
	out.Relatable = verdict.Relatable
	out.Promotional = verdict.Promotional
	out.Appeal = verdict.Appeal
	out.Reason = verdict.Reason
	out.Substance = verdict.Substance
	out.SubstanceTop = verdict.SubstanceTop
	out.SubstanceLegend = verdict.SubstanceLegend
	out.Kind = verdict.Kind
	out.KindConfidence = verdict.KindConfidence
	return out
}
