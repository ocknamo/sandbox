package game

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/ocknamo/sandbox/jev-mystery/internal/jev"
	"github.com/ocknamo/sandbox/jev-mystery/internal/scenario"
)

// The keys naming the questions one turn asks. The API echoes them back as the
// keys of the answers, so they are the contract between questions and Play.
const (
	KeyAction  = "action"
	KeyIntent  = "intent"
	KeyDeclare = "declare"

	// KeyClosed asks the one thing a player cannot be expected to guess the
	// phrasing for: whether what they typed is a question a person could
	// answer with yes or no. It is a question of its own rather than an
	// option in KeyAction, because a yes-or-no question competing against
	// eight actions for one distribution has to beat all of them to be heard.
	KeyClosed = "closed"

	// KeyAskee is who that question is addressed to.
	KeyAskee = "askee"

	// KeyFlavour is the second pass over an input the actions all missed.
	KeyFlavour = "flavour"
)

// Intents are the kinds of thing a player can be attempting, used only when
// nothing matched: they decide which flavour of "nothing happens" to print.
// The scenario keys its misses by these names.
const (
	IntentMove     = "move"
	IntentSearch   = "search"
	IntentAsk      = "ask"
	IntentTalk     = "talk"
	IntentMeta     = "meta"
	IntentNonsense = "nonsense"
)

// Asker is the part of the Jev client this package needs. Narrowing it to one
// method is what lets the engine be tested without an API key.
type Asker interface {
	Ask(ctx context.Context, state any, questions map[string]jev.Question) (*jev.Response, error)
}

// Policy is the part of the decision that stays in Go: how close an input has
// to be before it counts as asking for an action.
//
// It is a policy rather than a constant because the right thresholds are an
// empirical question about a particular set of options, and the one thing that
// will need retuning as cases are written.
type Policy struct {
	// Match is the probability the winning option must reach. A choice
	// distribution sums to 1, so this falls naturally as options are added;
	// it is a floor on "clearly this one", not a confidence level.
	Match float64

	// Confidence is the floor on the model's own confidence in the choice. A
	// spread distribution means the input straddled several actions, and
	// guessing between them is worse than missing.
	Confidence float64

	// Flavour is the floor for the flavour pass, and sits below Match on
	// purpose. Flavour is read only once every action has missed, and it moves
	// nothing: the worst a loose match can do is print the wrong two lines of
	// scenery, against a miss that prints "何も起こらない" and teaches the
	// player nothing. It still has to beat `none` in its own distribution,
	// which is the judgement that matters — this only stops a quiet yes from
	// being thrown away for want of the certainty an action needs.
	Flavour float64

	// Declare is the noul above which an input counts as the player trying to
	// name the culprit and close the case.
	Declare float64

	// Point is the noul above which one element of the truth counts as having
	// been found in the player's written solution.
	Point float64

	// Closed is the noul above which an input counts as a yes-or-no question
	// put to somebody standing here. It gates the closed-question path on its
	// own judgement rather than on the routing distribution, which is what
	// lets a question be asked in whatever words occur to the player.
	Closed float64

	// Answer is the probability a yes or a no must reach before a character
	// will commit to it. Below it they say they do not know, which is the
	// honest reading of a spread distribution and the only safe one: a
	// guessed "yes" is indistinguishable from a considered one, and a case
	// can turn on it.
	Answer float64
}

// DefaultPolicy is the starting point, not a measured optimum. Match sits
// below half because a scene offering eight actions spreads its weight thin
// even when the answer is obvious, and the option has to beat `none` anyway.
func DefaultPolicy() Policy {
	return Policy{
		Match: 0.4, Confidence: 0.35, Flavour: 0.25,
		Declare: 0.6, Point: 0.5, Closed: 0.5, Answer: 0.5,
	}
}

// Turn is one exchange: what the player typed, what the model made of it, and
// what the player reads back.
//
// The model's numbers are kept for tuning, and are stripped before this
// reaches a browser. A player who could see that their input scored 0.38
// against something would be reading the option list through a keyhole.
type Turn struct {
	Input string `json:"input"`

	Matched bool     `json:"matched"`
	Outcome *Outcome `json:"outcome,omitempty"`
	Text    []string `json:"text"`

	// Finale is set when the player asked to gather everyone and may.
	Finale bool `json:"finale"`

	// Answer is which of the three replies a closed question got, empty for
	// every other turn.
	Answer string `json:"answer,omitempty"`

	// Arrival is the new room, described, on a turn that moved the player. It
	// is not the action's result text: the action says how they got there and
	// this says what they walked into.
	Arrival []string `json:"arrival,omitempty"`

	Intent     string  `json:"intent"`
	Choice     string  `json:"choice"`
	Score      float64 `json:"score"`
	Confidence float64 `json:"confidence"`
	Declare    float64 `json:"declare"`

	// Closed is how much of a yes-or-no question the input was, and Askee who
	// the model read it as being addressed to. Both are kept for tuning.
	Closed float64 `json:"closed"`
	Askee  string  `json:"askee,omitempty"`
}

// Engine turns free text into one of the authored actions.
type Engine struct {
	Asker  Asker
	Policy Policy
}

// ErrNoInput reports a turn with nothing in it.
var ErrNoInput = errors.New("game: empty input")

// maxInputRunes trims what a player typed before it is sent on. The model
// charges for what it reads, and no reasonable instruction to a detective is
// longer than this.
const maxInputRunes = 400

// Play puts one input to the model and applies whatever it matched.
//
// An input is offered three things to be, in this order: one of the actions
// the case authored for here, a yes-or-no question to somebody standing here,
// or a piece of flavour. The order is the point. An authored action wins
// because its answer was written for exactly this question; the closed
// question comes next because it can answer what nobody wrote; flavour comes
// last because it changes nothing and so costs nothing to be wrong about.
//
// All of it is decided from one request. The questions are evaluated in
// parallel, so the second and third passes are free of another round trip.
func (e *Engine) Play(ctx context.Context, s *scenario.Scenario, st State, input string) (State, *Turn, error) {
	input = trim(input, maxInputRunes)
	if input == "" {
		return st, nil, ErrNoInput
	}

	avail := Available(s, st)
	flavours := AvailableFlavour(s, st)
	open := FinaleOpen(s, st)
	askable := Askable(s, st)

	resp, err := e.Asker.Ask(ctx,
		stateFor(s, st, input, len(askable) > 0),
		questions(s, avail, flavours, askable, open))
	if err != nil {
		return st, nil, err
	}

	turn := &Turn{Input: input, Intent: IntentNonsense}
	if a, ok := resp.Answers[KeyIntent]; ok && a.Choice != "" {
		turn.Intent = a.Choice
	}
	if a, ok := resp.Answers[KeyDeclare]; ok && a.Noul != nil {
		turn.Declare = *a.Noul
	}
	if a, ok := resp.Answers[KeyClosed]; ok && a.Noul != nil {
		turn.Closed = *a.Noul
	}

	answer, ok := resp.Answers[KeyAction]
	if !ok {
		return st, nil, fmt.Errorf("game: no %q answer in response", KeyAction)
	}
	choice, score, confidence, accepted := e.pick(answer)
	turn.Choice, turn.Score, turn.Confidence = choice, score, confidence

	st.Turn++

	if accepted {
		if choice == scenario.FinaleAction {
			turn.Finale, turn.Matched = true, true
			turn.Text = s.Finale.Prompt
			return st, turn, nil
		}
		if a := s.Action(choice); a != nil {
			st, out := Apply(s, st, a)
			turn.Matched, turn.Outcome, turn.Text = true, &out, out.Text
			if out.MovedTo != "" {
				turn.Arrival = Describe(s, st)
			}
			return st, turn, nil
		}
		// The model answered with an option that was never offered. Treat it
		// as a miss rather than trusting it: an invented id would otherwise
		// reach the scenario lookup as a nil dereference.
	}

	// No action. The input may still be a question somebody here can answer.
	if out, ok := e.closed(resp, s, askable, turn); ok {
		turn.Matched, turn.Outcome, turn.Text = true, &out, out.Text
		return st, turn, nil
	}

	// Or something the case has prose for but no consequence.
	if out, ok := e.flavour(resp, s, turn); ok {
		turn.Matched, turn.Outcome, turn.Text = true, &out, out.Text
		return st, turn, nil
	}

	turn.Choice = scenario.NoMatch
	turn.Text = e.miss(s, turn, open)
	return st, turn, nil
}

// closed answers a yes-or-no question, if that is what the input was.
//
// Three separate judgements have to agree before a character says anything:
// that the input is a yes-or-no question at all, which of the people here it
// was put to, and — from that person's own question — that yes or no could
// answer it. Each is narrow, and none of them has to out-vote the actions.
// That last part is the whole reason this is not an option in the routing:
// a player who cannot guess the phrasing of a question the case has an answer
// for will simply never find it.
func (e *Engine) closed(resp *jev.Response, s *scenario.Scenario, askable []*scenario.Character, t *Turn) (Outcome, bool) {
	if len(askable) == 0 || t.Closed < e.Policy.Closed {
		return Outcome{}, false
	}
	who, ok := resp.Answers[KeyAskee]
	if !ok {
		return Outcome{}, false
	}
	id, score, confidence, accepted := e.pick(who)
	t.Askee = id
	if !accepted {
		return Outcome{}, false
	}
	c := s.Character(id)
	if c == nil || c.Closed == nil {
		return Outcome{}, false
	}

	out, ok := e.answer(resp, c, t)
	if !ok {
		// The person's own question says yes or no could not answer this
		// after all. That is a miss: an invented "はい" is worse than silence.
		return Outcome{}, false
	}
	t.Choice, t.Score, t.Confidence = scenario.ClosedPrefix+c.ID, score, confidence
	return out, true
}

// flavour is the last pass: prose for an input the case recognises but does
// not act on. It runs only after everything else has missed, so a flavour
// entry can be written loosely without putting an action out of reach.
func (e *Engine) flavour(resp *jev.Response, s *scenario.Scenario, t *Turn) (Outcome, bool) {
	a, ok := resp.Answers[KeyFlavour]
	if !ok {
		return Outcome{}, false
	}
	id, score, confidence, accepted := e.pickAbove(a, e.Policy.Flavour)
	if !accepted {
		return Outcome{}, false
	}
	f := s.Flavour(id)
	if f == nil {
		return Outcome{}, false
	}
	t.Choice, t.Score, t.Confidence = scenario.FlavourPrefix+f.ID, score, confidence
	return Outcome{
		ActionID: scenario.FlavourPrefix + f.ID,
		Did:      f.Did,
		Speaker:  f.Speaker,
		Text:     f.Text,
	}, true
}

// answer reads what the character said. The reply was asked for in the same
// request as the routing, so a closed question costs one round trip like any
// other turn: questions are evaluated in parallel, and the expensive thing is
// the number of requests rather than the number of questions.
//
// A spread distribution becomes "I don't know". A coin-flip between yes and no
// is the one answer this game must never give: the player cannot tell it from
// a considered one, and the whole case can turn on it.
func (e *Engine) answer(resp *jev.Response, c *scenario.Character, t *Turn) (Outcome, bool) {
	a, ok := resp.Answers[scenario.ClosedPrefix+c.ID]
	if !ok || a.Choice == "" || a.Choice == notClosed {
		return Outcome{}, false
	}

	said := a.Choice
	if a.Probabilities[said] < e.Policy.Answer {
		said = scenario.AnswerUnknown
	}
	t.Answer = said

	return Outcome{
		ActionID: scenario.ClosedPrefix + c.ID,
		Did:      c.Name + "に、はいかいいえで訊いた。",
		Speaker:  c.ID,
		Text:     []string{c.Closed.Answers.Say(said)},
	}, true
}

// pick reads one choice answer and applies the policy to it. It is used for
// every choice the engine makes, so a flavour entry and an action have to
// clear the same bar.
func (e *Engine) pick(a jev.Answer) (choice string, score, confidence float64, ok bool) {
	return e.pickAbove(a, e.Policy.Match)
}

// pickAbove is pick with the floor named, for the one pass that does not use
// Match: flavour, which is allowed to answer on less.
func (e *Engine) pickAbove(a jev.Answer, floor float64) (choice string, score, confidence float64, ok bool) {
	choice = a.Choice
	score = a.Probabilities[choice]
	if a.Confidence != nil {
		confidence = *a.Confidence
	}
	if choice == "" || choice == scenario.NoMatch {
		return choice, score, confidence, false
	}
	// Beating `none` matters more than any fixed floor: it is the option that
	// exists precisely to absorb an input the case has no answer for.
	if score <= a.Probabilities[scenario.NoMatch] {
		return choice, score, confidence, false
	}
	return choice, score, confidence, score >= floor && confidence >= e.Policy.Confidence
}

// miss picks the text for an input that matched nothing. A player who is
// trying to name the culprit before the case is ready for it gets told so,
// because leaving that one silent reads as a bug rather than as a locked door.
func (e *Engine) miss(s *scenario.Scenario, t *Turn, open bool) []string {
	if !open && t.Declare >= e.Policy.Declare {
		if text := s.Misses["declare"]; len(text) > 0 {
			return text
		}
	}
	return s.Miss(t.Intent)
}

// notClosed is the fourth option of a closed question, and the only one the
// player never hears. Without it an input that is not a yes-or-no question at
// all would still be answered — and "I don't know" is indistinguishable, to
// the player, from a real one.
const notClosed = "not_a_yes_no_question"

// Askable lists the people standing here who take yes-or-no questions.
func Askable(s *scenario.Scenario, st State) []*scenario.Character {
	sc := s.Scene(st.Scene)
	if sc == nil {
		return nil
	}
	var out []*scenario.Character
	for _, id := range sc.Characters {
		if c := s.Character(id); c != nil && c.Closed != nil {
			out = append(out, c)
		}
	}
	return out
}

// playerView is what the model is shown: the input, and the surroundings that
// make a pronoun or a bare noun resolvable. "彼女に聞く" is only answerable if
// the model can see who is standing here.
type playerView struct {
	Input   string   `json:"player_typed"`
	Place   string   `json:"place"`
	People  []string `json:"people_present"`
	Holding []string `json:"holding,omitempty"`

	// Story is what actually happened, sent only when somebody here can be
	// asked a yes-or-no question: no one can answer one without it. It is safe
	// to send and could not be sent anywhere else — Jev answers with typed
	// values and never with text, so the plot goes in and a `yes` comes back.
	Incident []string `json:"the_case,omitempty"`
	Story    []string `json:"what_actually_happened,omitempty"`
}

func stateFor(s *scenario.Scenario, st State, input string, withStory bool) playerView {
	v := playerView{Input: input}
	if withStory {
		v.Incident = s.Incident
		v.Story = scenario.Plain(s.Finale.Truth)
	}
	if sc := s.Scene(st.Scene); sc != nil {
		v.Place = sc.Name
		for _, id := range sc.Characters {
			if c := s.Character(id); c != nil {
				v.People = append(v.People, c.Name+"（"+c.Role+"）")
			}
		}
	}
	for _, id := range st.Evidence {
		if e := s.Item(id); e != nil {
			v.Holding = append(v.Holding, e.Name)
		}
	}
	return v
}

// questions builds the turn's request. Every question in it is evaluated in
// parallel, so asking what kind of thing the player attempted, whether it was
// a yes-or-no question, and what flavour it might be instead costs almost
// nothing on top of asking which action they meant. The expensive thing is the
// number of requests, and this is one.
func questions(s *scenario.Scenario, avail []*scenario.Action, flavours []*scenario.Flavour, askable []*scenario.Character, finaleOpen bool) map[string]jev.Question {
	options := make(map[string]jev.Option, len(avail)+2)
	for _, a := range avail {
		options[a.ID] = option(a.Match)
	}
	if finaleOpen {
		options[scenario.FinaleAction] = option(s.Finale.Match)
	}
	options[scenario.NoMatch] = jev.Option{
		What: "The input asks for something none of the other options describe, " +
			"or is too vague to tell which of them it means.",
		NotFor: "An input that plainly asks for one of the other options, even " +
			"if it is worded loosely or uses different words than the option does.",
		Examples: []string{"空を飛ぶ", "ピザを注文する", "うーん"},
	}

	qs := map[string]jev.Question{
		// The instructions are in English while the options and the input are
		// in Japanese. That is deliberate: the engine's half of the prompt is
		// fixed and belongs with the code, and the content half belongs to
		// whoever writes the case.
		KeyAction: jev.ChoiceOptions(
			"A player in a detective game typed what they want to do next. "+
				"Which one of these actions is the player asking for? Judge by "+
				"what the player wants to happen, not by matching words. Choose "+
				"'none' if no option covers it.",
			options),

		KeyIntent: jev.Choice(
			"What kind of thing is the player attempting, regardless of whether "+
				"it is possible here?",
			map[string]string{
				IntentMove:     "Going somewhere: a room, a direction, a place.",
				IntentSearch:   "Examining, searching or taking a thing or a place.",
				IntentAsk:      "Putting a question to a person, or confronting one.",
				IntentTalk:     "Speaking to a person without asking anything: greeting, provoking, threatening, comforting.",
				IntentMeta:     "Addressing the game rather than the world: asking what to do, what is possible, for a hint, or for the rules.",
				IntentNonsense: "Nothing the world could act on: gibberish, an empty remark, or something impossible.",
			}),

		KeyDeclare: jev.Noul(
			"Is the player trying to close the case here — naming who they think " +
				"did it, declaring they have solved it, or calling everyone " +
				"together for the reveal? False for merely asking someone about a " +
				"suspect, or for accusing someone in conversation without claiming " +
				"to have solved the case."),
	}

	if len(flavours) > 0 {
		qs[KeyFlavour] = flavourQuestion(flavours)
	}
	if len(askable) > 0 {
		qs[KeyClosed], qs[KeyAskee] = closedNoul(askable), askeeQuestion(askable)
		// Every person here is asked what they would say, in the same request.
		// Only the one the player addressed is read; the rest cost a few
		// tokens each and save a second round trip.
		for _, c := range askable {
			qs[scenario.ClosedPrefix+c.ID] = closedQuestion(c)
		}
	}
	return qs
}

// flavourQuestion is the second pass over an input, over the prose the case
// has that changes nothing. It is a separate distribution from the actions on
// purpose: a scene can carry as much flavour as its author likes without any
// of it taking probability away from something the player needs to be able
// to reach.
func flavourQuestion(flavours []*scenario.Flavour) jev.Question {
	options := make(map[string]jev.Option, len(flavours)+1)
	for _, f := range flavours {
		options[f.ID] = option(f.Match)
	}
	options[scenario.NoMatch] = jev.Option{
		What: "The input is not close to any of these; nothing here answers it.",
		NotFor: "An input that plainly asks for one of the other options, even " +
			"if it is worded loosely.",
	}
	return jev.ChoiceOptions(
		"A player in a detective game typed what they want to do next, and no "+
			"action of the case covers it. Is what they typed close to any of "+
			"these things there is something to say about? Choose 'none' unless "+
			"one of them is plainly what the player is reaching for.",
		options)
}

// closedNoul is the judgement the player should not have to guess the wording
// for: whether what they typed is a question a person could answer yes or no.
//
// This exists because a player cannot see the option list, and so cannot see
// that asking a question outright is a thing the game does. The answer to
// "how do I ask a yes-or-no question?" has to be "you write one", which means
// recognising one has to be its own judgement rather than a race against the
// scene's actions.
func closedNoul(askable []*scenario.Character) jev.Question {
	var b strings.Builder
	b.WriteString("Is the player putting a question to one of the people standing here — ")
	for i, c := range askable {
		if i > 0 {
			b.WriteString(", ")
		}
		b.WriteString(c.Name)
		b.WriteString(" (")
		b.WriteString(c.Role)
		b.WriteString(")")
	}
	b.WriteString(" — that could be answered with yes or no? True for asking whether ")
	b.WriteString("something is so, whether someone did something, whether something ")
	b.WriteString("is true, however politely or indirectly it is phrased, and whether ")
	b.WriteString("or not the person is named. False for a question that wants an ")
	b.WriteString("account of something rather than a yes or a no, for an order, for a ")
	b.WriteString("remark, and for anything not addressed to a person.")
	return jev.Noul(b.String())
}

// askeeQuestion is who the question was put to. Naming the people separately
// is what lets "彼女は九時に会ったんですね？" pick the right mouth.
func askeeQuestion(askable []*scenario.Character) jev.Question {
	options := make(map[string]jev.Option, len(askable)+1)
	for _, c := range askable {
		options[c.ID] = jev.Option{
			What: "The question is put to " + c.Name + " (" + c.Role + ").",
			NotFor: "A question put to anybody else, or one that names nobody " +
				"and could not be meant for " + c.Name + ".",
			Examples: []string{
				c.Name + "さんは九時に会ったんですか",
				"あなたがやったのか、" + c.Name + "さんに訊く",
			},
		}
	}
	options[scenario.NoMatch] = jev.Option{
		What: "The input is addressed to nobody here, or there is no telling " +
			"which of them it is meant for.",
		NotFor: "An input addressed to one of them by name, by role, or by a " +
			"pronoun that can only mean one of them.",
	}
	return jev.ChoiceOptions(
		"A player in a detective game has asked a question. Which of the people "+
			"standing here is it addressed to? A question addressed to the room, "+
			"or to somebody who is not here, is 'none'.",
		options)
}

// closedQuestion is the yes-or-no one.
//
// What the person knows and what they will not say go in the instructions,
// because they belong to this person; the plot goes in the state, because it
// belongs to the case and is shared by everyone who might be asked. The
// question asks what they would SAY, not what is true — which is what lets a
// culprit look straight at the plot in the state and answer "no".
func closedQuestion(c *scenario.Character) jev.Question {
	var b strings.Builder
	b.WriteString("A detective has put a question to ")
	b.WriteString(c.Name)
	b.WriteString(" (")
	b.WriteString(c.Role)
	b.WriteString("). What would this person SAY in reply — not what is true. ")
	b.WriteString("They know these things, and nothing else about the case:\n")
	for _, line := range c.Closed.Knows {
		b.WriteString("- ")
		b.WriteString(string(line))
		b.WriteString("\n")
	}
	if len(c.Closed.Hides) > 0 {
		b.WriteString("They will not admit any of this, and deny it if asked directly:\n")
		for _, line := range c.Closed.Hides {
			b.WriteString("- ")
			b.WriteString(string(line))
			b.WriteString("\n")
		}
	}
	// "Unknown" is for the edge of what they know, not for awkwardness.
	// Letting it also mean "would rather not say" turns every hidden thing
	// into a dodge, and a suspect who cannot remember whether she served tea
	// an hour ago is not concealing anything — she is malfunctioning.
	b.WriteString("Answer 'unknown' only when the question is outside what they know. ")
	b.WriteString("Someone hiding something denies it instead: they answer the way ")
	b.WriteString("that keeps what they are hiding hidden, and keeps their earlier ")
	b.WriteString("account standing, even when that answer is a lie.")

	return jev.Choice(b.String(), map[string]string{
		scenario.AnswerYes:     "They would say yes.",
		scenario.AnswerNo:      "They would say no — whether that is the truth or a denial.",
		scenario.AnswerUnknown: "They would say they do not know, or would not say.",
		notClosed: "The detective did not ask this person anything that yes or no " +
			"could answer: an open question, an order, a remark, or something " +
			"addressed to somebody else.",
	})
}

// option is the one place an action's description leaves the server, and it
// leaves towards the model rather than towards the player.
func option(m scenario.Match) jev.Option {
	return jev.Option{
		What:     string(m.What),
		NotFor:   string(m.NotFor),
		Examples: scenario.Plain(m.Examples),
	}
}

func trim(s string, limit int) string {
	r := []rune(s)
	// Leading and trailing whitespace is the player's, not the model's
	// business; anything past the limit is unlikely to be an instruction.
	for len(r) > 0 && isSpace(r[0]) {
		r = r[1:]
	}
	for len(r) > 0 && isSpace(r[len(r)-1]) {
		r = r[:len(r)-1]
	}
	if len(r) > limit {
		r = r[:limit]
	}
	return string(r)
}

func isSpace(r rune) bool {
	switch r {
	case ' ', '\t', '\n', '\r', '　':
		return true
	}
	return false
}
