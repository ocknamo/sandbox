// Package recommend holds the judgement that decides whether a Nostr post
// earns a place on the timeline: the questions put to Jev, and the rule that
// combines the answers.
//
// The split matters. Jev is asked only what a post *is* — each question is one
// narrow observation a reader could make in a second. What to *do* about it is
// policy, and policy lives in Go where it can be read, tested and changed
// without another round trip.
package recommend

import "github.com/ocknamo/sandbox/jev-nostr/internal/jev"

// The keys naming each question. The API echoes them back as the keys of the
// matching answers, so they are the contract between Questions and Evaluate.
const (
	KeyInsight     = "insight"
	KeyHumor       = "humor"
	KeyRelatable   = "relatable"
	KeyPromotional = "promotional"
	KeySubstance   = "substance"
	KeyKind        = "kind"
)

// substanceLevels is the rubric behind KeySubstance, ordered from least to
// most. The API accepts between 2 and 10 levels.
var substanceLevels = []string{
	"Content-free: a reaction, a greeting, or noise with nothing to read.",
	"A passing remark with almost nothing behind it.",
	"An ordinary observation: clear, but slight.",
	"A developed thought with something specific in it.",
	"A substantial point carrying detail or reasoning the reader could use.",
}

// kindOptions is the rubric behind KeyKind. Unlike the nouls it is not used in
// the decision; it is there to label a post in the output, and because a
// timeline will eventually want to mix kinds rather than serve five jokes.
var kindOptions = map[string]string{
	"insight": "Explains, teaches, or reports something concrete.",
	"humor":   "A joke, a pun, or wordplay.",
	"musing":  "A personal observation, feeling, or open question.",
	"chatter": "A greeting, a reaction, or noise carrying no content.",
	"promo":   "Advertising, solicitation, or a scam.",
}

// Questions is the whole set, put to the model in a single request.
//
// Asking six questions instead of one is close to free. Roughly 300 of the
// ~350 input tokens a request costs are fixed overhead, and the model
// evaluates every question in parallel, so the expensive thing is the number
// of requests rather than the number of questions in them.
//
// Each question stays deliberately narrow, which is what the model is built
// for. "Is this post good?" would be one question doing the work of six, and
// there would be nowhere to look when the answer disagreed with us.
func Questions() map[string]jev.Question {
	return map[string]jev.Question{
		// The three positive signals. They are separate because a post can
		// earn its place by any one of them, and a post that scores on one is
		// not expected to score on the others.
		KeyInsight: jev.Noul(
			"Does this post tell the reader something specific they might not " +
				"already know, or hand them a concrete idea to think about?",
		),
		KeyHumor: jev.Noul(
			"Is this post trying to be funny, and does it succeed? Answer yes " +
				"for jokes, puns and wordplay that land; no for mere excitement " +
				"or an emoji.",
		),
		KeyRelatable: jev.Noul(
			"Does this post express a feeling or an observation that a stranger " +
				"reading it would recognise in themselves?",
		),

		// The veto.
		KeyPromotional: jev.Noul(
			"Is this post advertising, soliciting, or trying to get the reader " +
				"to click through to something?",
		),

		KeySubstance: jev.Score(
			"How much is actually in this post for a reader?",
			substanceLevels,
		),

		KeyKind: jev.Choice(
			"What kind of post is this?",
			kindOptions,
		),
	}
}
