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
	KeyLanguage    = "language"
	KeyTopic       = "topic"
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

// languageOptions is the rubric behind KeyLanguage.
//
// The answer that matters here is not the winning option but the whole
// probability distribution: "how Japanese does this read" is probabilities
// ["ja"], and a caller filtering on it can change its mind about which
// language it wants without asking anything again. Asking one choice covers
// every language at once, where a noul per language would cost a question each.
//
// The descriptions stay to one word because every one of them is read on every
// request, and a language needs no explaining.
var languageOptions = map[string]string{
	"ja": "Japanese",
	"en": "English",
	"zh": "Chinese",
	"ko": "Korean",
	"ru": "Russian",
	"de": "German",
	"fr": "French",
	"es": "Spanish",
	"pt": "Portuguese",
	// Not a language: a post can be emoji, punctuation, a bare URL or a string
	// of symbols, and calling that English would poison an English timeline.
	"none": "No discernible language: only emoji, symbols, numbers or a bare URL.",
	// Everything the list above does not name.
	"other": "A language not listed among the options.",
}

// topicOptions is the rubric behind KeyTopic: what a post is about, as opposed
// to kindOptions, which is what a post is.
//
// Read as a distribution rather than a winner. A choice sums to 1, so a post
// about two of these splits its weight between them and clears no single
// threshold; a reader interested in both adds the two together and gets the
// honest answer, which is what the page does. That is also why the list is
// flat: 22 options is nowhere near the 255 the API allows, and the docs ask
// for the full list rather than a shortlist. Hierarchies are for taxonomies of
// thousands.
//
// NotFor is here for the options that would otherwise bleed into one another.
// Saying what an option excludes separates a confusable pair better than any
// amount of saying what it covers.
var topicOptions = map[string]jev.Option{
	"tech": {
		What:   "Software, hardware, engineering practice, AI, the internet.",
		NotFor: "Bitcoin and Nostr, which have options of their own.",
	},
	// Split out of tech because Nostr carries a lot of both, and "I want the
	// engineering but not the coins" is a real thing to want.
	"bitcoin": {
		What:     "Bitcoin, Lightning, other crypto assets, mining, wallets, exchanges.",
		NotFor:   "Software engineering in general, or the Nostr protocol.",
		Examples: []string{"Lightning のルーティング手数料が下がってきた"},
	},
	"nostr": {
		What:     "The Nostr protocol, its NIPs, relays and clients, decentralised social media.",
		NotFor:   "Software engineering in general, or Bitcoin.",
		Examples: []string{"NIP-01 の REQ フィルタは filter 間が OR で filter 内が AND"},
	},
	"science": {
		What:   "Physics, chemistry, biology, astronomy, mathematics, research and its findings.",
		NotFor: "Everyday encounters with nature or animals, and medicine.",
	},
	"health":     {What: "Health, illness, medicine, fitness, sleep, mental health."},
	"politics":   {What: "Politics, government, law, war, rights, social issues and activism."},
	"business":   {What: "The economy, markets, companies, money and personal finance."},
	"religion":   {What: "Religion, faith, scripture, ritual, spirituality."},
	"philosophy": {What: "Philosophy, ethics, ideas about how to think or live."},
	"sports":     {What: "Sport, athletes, matches, results, training."},
	"games":      {What: "Video games, board games, puzzles, tabletop play."},
	"anime":      {What: "Anime, manga, and the fandom around them."},
	"music":      {What: "Music, songs, instruments, concerts, artists."},
	"film":       {What: "Films, television, drama, video."},
	"books":      {What: "Books, reading, literature, and the writing of them."},
	"art": {
		What:   "Art, illustration, design, craft, and making any of them.",
		NotFor: "Photography and anime, which have options of their own.",
	},
	"photo": {
		What:   "Photography: taking pictures, cameras, a picture being shown.",
		NotFor: "Drawn or designed images.",
	},
	"food":   {What: "Food, cooking, restaurants, drink."},
	"travel": {What: "Travel, places, transport, a town or a country as a subject."},
	"nature": {
		What:     "The natural world as encountered: weather, seasons, plants, animals, scenery.",
		NotFor:   "Scientific research about them.",
		Examples: []string{"今日の空がきれい", "近所の猫がこっちを見ている"},
	},
	// Without this, a post about getting through the week has nowhere to go
	// and lands on philosophy or business instead.
	"life": {
		What:     "Everyday life: work, study, family, friends, feelings, the day someone is having.",
		Examples: []string{"働いてて趣味で創作もしてますみたいなひと本当にどうなってるの"},
	},
	// The docs ask for a fallback so the model can say none of the others fit.
	"other": {What: "Something none of the other options covers."},
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

		KeyLanguage: jev.Choice(
			"What language is this post written in?",
			languageOptions,
		),

		KeyTopic: jev.ChoiceOptions(
			"What is this post about?",
			topicOptions,
		),
	}
}
