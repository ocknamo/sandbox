package game

import (
	"context"
	"errors"
	"fmt"

	"github.com/ocknamo/sandbox/jev-mystery/internal/jev"
	"github.com/ocknamo/sandbox/jev-mystery/internal/scenario"
)

// The keys naming the questions one turn asks. The API echoes them back as the
// keys of the answers, so they are the contract between questions and Play.
const (
	KeyAction  = "action"
	KeyIntent  = "intent"
	KeyDeclare = "declare"
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

	// Declare is the noul above which an input counts as the player trying to
	// name the culprit and close the case.
	Declare float64

	// Point is the noul above which one element of the truth counts as having
	// been found in the player's written solution.
	Point float64
}

// DefaultPolicy is the starting point, not a measured optimum. Match sits
// below half because a scene offering eight actions spreads its weight thin
// even when the answer is obvious, and the option has to beat `none` anyway.
func DefaultPolicy() Policy {
	return Policy{Match: 0.4, Confidence: 0.35, Declare: 0.6, Point: 0.5}
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

	Intent     string  `json:"intent"`
	Choice     string  `json:"choice"`
	Score      float64 `json:"score"`
	Confidence float64 `json:"confidence"`
	Declare    float64 `json:"declare"`
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
func (e *Engine) Play(ctx context.Context, s *scenario.Scenario, st State, input string) (State, *Turn, error) {
	input = trim(input, maxInputRunes)
	if input == "" {
		return st, nil, ErrNoInput
	}

	avail := Available(s, st)
	open := FinaleOpen(s, st)

	resp, err := e.Asker.Ask(ctx, stateFor(s, st, input), questions(s, avail, open))
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

	answer, ok := resp.Answers[KeyAction]
	if !ok {
		return st, nil, fmt.Errorf("game: no %q answer in response", KeyAction)
	}
	turn.Choice = answer.Choice
	turn.Score = answer.Probabilities[answer.Choice]
	if answer.Confidence != nil {
		turn.Confidence = *answer.Confidence
	}

	st.Turn++

	if !e.accept(answer, turn) {
		turn.Text = e.miss(s, turn, open)
		return st, turn, nil
	}

	if turn.Choice == scenario.FinaleAction {
		turn.Finale, turn.Matched = true, true
		turn.Text = s.Finale.Prompt
		return st, turn, nil
	}

	a := s.Action(turn.Choice)
	if a == nil {
		// The model answered with an option that was never offered. Treat it
		// as a miss rather than trusting it: an invented id would otherwise
		// reach the scenario lookup as a nil dereference.
		turn.Choice = scenario.NoMatch
		turn.Text = e.miss(s, turn, open)
		return st, turn, nil
	}

	st, out := Apply(s, st, a)
	turn.Matched, turn.Outcome, turn.Text = true, &out, out.Text
	return st, turn, nil
}

// accept applies the policy to one choice answer.
func (e *Engine) accept(a jev.Answer, t *Turn) bool {
	if a.Choice == "" || a.Choice == scenario.NoMatch {
		return false
	}
	// Beating `none` matters more than any fixed floor: it is the option that
	// exists precisely to absorb an input the case has no answer for.
	if t.Score <= a.Probabilities[scenario.NoMatch] {
		return false
	}
	return t.Score >= e.Policy.Match && t.Confidence >= e.Policy.Confidence
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

// playerView is what the model is shown: the input, and the surroundings that
// make a pronoun or a bare noun resolvable. "彼女に聞く" is only answerable if
// the model can see who is standing here.
type playerView struct {
	Input   string   `json:"player_typed"`
	Place   string   `json:"place"`
	People  []string `json:"people_present"`
	Holding []string `json:"holding,omitempty"`
}

func stateFor(s *scenario.Scenario, st State, input string) playerView {
	v := playerView{Input: input}
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

// questions builds the turn's request. All three are evaluated in parallel, so
// asking what kind of thing the player attempted costs almost nothing on top
// of asking which action they meant, and it is what makes a miss readable.
func questions(s *scenario.Scenario, avail []*scenario.Action, finaleOpen bool) map[string]jev.Question {
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

	return map[string]jev.Question{
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
