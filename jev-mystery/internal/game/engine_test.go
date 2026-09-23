package game

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/ocknamo/sandbox/jev-mystery/internal/jev"
	"github.com/ocknamo/sandbox/jev-mystery/internal/scenario"
)

// fake stands in for the API. The engine's job is to decide what to do with an
// answer, so the tests hand it answers directly rather than an API key.
type fake struct {
	choice  string
	prob    float64
	conf    float64
	intent  string
	declare float64
	noul    float64
	score   float64

	// closed is how much of a yes-or-no question the input was, askee who it
	// was put to, and said what that person answers with. The three are
	// separate judgements in the request, so they are separate here too.
	closed    float64
	askee     string
	askeeProb float64
	said      string
	saidProb  float64

	// flavour is the entry the second pass lands on, once the actions have
	// all missed. flavourNone is what is left sitting on `none`: a scene with
	// several flavour entries spreads its weight across them, so the winner
	// can be well under half and still be the answer.
	flavour     string
	flavourProb float64
	flavourNone float64

	// points overrides noul for single elements of the truth, by point id,
	// so an accusation can find some of them and not others.
	points map[string]float64

	asked map[string]jev.Question
	state any
}

// choiceAnswer is a choice as the API returns one: the pick, its share of the
// distribution, and whatever is left over sitting on `none`.
func choiceAnswer(choice string, prob, conf float64) jev.Answer {
	return jev.Answer{
		Type:          jev.TypeChoice,
		Choice:        choice,
		Probabilities: map[string]float64{choice: prob, scenario.NoMatch: 1 - prob},
		Confidence:    &conf,
	}
}

func (f *fake) Ask(_ context.Context, state any, qs map[string]jev.Question) (*jev.Response, error) {
	f.asked, f.state = qs, state
	answers := map[string]jev.Answer{}
	for key, q := range qs {
		switch {
		case key == KeyAction:
			answers[key] = choiceAnswer(f.choice, f.prob, f.conf)
		case key == KeyIntent:
			answers[key] = jev.Answer{Type: jev.TypeChoice, Choice: f.intent}
		case key == KeyDeclare:
			d := f.declare
			answers[key] = jev.Answer{Type: jev.TypeNoul, Noul: &d}
		case key == KeyClosed:
			c := f.closed
			answers[key] = jev.Answer{Type: jev.TypeNoul, Noul: &c}
		case key == KeyAskee:
			answers[key] = choiceAnswer(f.askee, orElse(f.askeeProb, 0.9), 0.9)
		case key == KeyFlavour:
			a := choiceAnswer(f.flavour, orElse(f.flavourProb, 0.9), 0.9)
			if f.flavourNone > 0 {
				a.Probabilities[scenario.NoMatch] = f.flavourNone
			}
			answers[key] = a
		case key == KeyCulprit:
			answers[key] = jev.Answer{Type: jev.TypeChoice, Choice: f.choice,
				Probabilities: map[string]float64{f.choice: f.prob}}
		case strings.HasPrefix(key, scenario.ClosedPrefix):
			answers[key] = jev.Answer{Type: jev.TypeChoice, Choice: f.said,
				Probabilities: map[string]float64{f.said: orElse(f.saidProb, 0.9)}}
		case key == KeyCoherence:
			s := f.score
			answers[key] = jev.Answer{Type: jev.TypeScore, Score: &s,
				Legend: map[string]string{"0": "bad", "1": "ok", "2": "fine", "3": "good", "4": "airtight"}}
		case q.Type == jev.TypeNoul:
			n := f.noul
			if v, ok := f.points[strings.TrimPrefix(key, pointPrefix)]; ok {
				n = v
			}
			answers[key] = jev.Answer{Type: jev.TypeNoul, Noul: &n}
		}
	}
	return &jev.Response{Answers: answers}, nil
}

func orElse(v, fallback float64) float64 {
	if v == 0 {
		return fallback
	}
	return v
}

func load(t *testing.T) *scenario.Scenario {
	t.Helper()
	s, err := scenario.Builtin("yakata")
	if err != nil {
		t.Fatal(err)
	}
	return s
}

func TestPlayAppliesAMatch(t *testing.T) {
	s := load(t)
	f := &fake{choice: "examine_ledger", prob: 0.8, conf: 0.9, intent: IntentSearch}
	e := &Engine{Asker: f, Policy: DefaultPolicy()}

	st, turn, err := e.Play(context.Background(), s, New(s), "献立帳を調べる")
	if err != nil {
		t.Fatal(err)
	}
	if !turn.Matched || turn.Outcome == nil {
		t.Fatal("the turn should have matched")
	}
	if !st.HasEvidence("meals") {
		t.Error("the action gives the meal book and the state did not take it")
	}
	if st.Turn != 1 {
		t.Errorf("turn = %d, want 1", st.Turn)
	}
}

// A turn under the threshold has to read as the world not responding. The
// numbers are the whole difference between that and a wrong guess, so this is
// the test that keeps the policy honest.
func TestPlayRejectsAWeakMatch(t *testing.T) {
	s := load(t)
	for name, f := range map[string]*fake{
		"low probability": {choice: "examine_ledger", prob: 0.2, conf: 0.9, intent: IntentSearch},
		"low confidence":  {choice: "examine_ledger", prob: 0.8, conf: 0.1, intent: IntentSearch},
		"loses to none":   {choice: "examine_ledger", prob: 0.45, conf: 0.9, intent: IntentSearch},
		"chose none":      {choice: scenario.NoMatch, prob: 0.9, conf: 0.9, intent: IntentNonsense},
		"invented an id":  {choice: "fly_away", prob: 0.9, conf: 0.9, intent: IntentNonsense},
	} {
		t.Run(name, func(t *testing.T) {
			e := &Engine{Asker: f, Policy: Policy{Match: 0.5, Confidence: 0.35, Declare: 0.6, Point: 0.5}}
			st, turn, err := e.Play(context.Background(), s, New(s), "何かする")
			if err != nil {
				t.Fatal(err)
			}
			if turn.Matched {
				t.Fatal("this should not have matched")
			}
			if st.HasEvidence("meals") {
				t.Error("a miss must not hand out evidence")
			}
			if len(turn.Text) == 0 {
				t.Error("a miss still has to say something")
			}
		})
	}
}

// Trying to name the killer too early is the one miss that has to explain
// itself; anything else reads as a bug rather than a locked door.
func TestPlayAnswersAnEarlyAccusation(t *testing.T) {
	s := load(t)
	f := &fake{choice: scenario.NoMatch, prob: 0.9, conf: 0.9, intent: IntentTalk, declare: 0.9}
	e := &Engine{Asker: f, Policy: DefaultPolicy()}

	_, turn, err := e.Play(context.Background(), s, New(s), "犯人は久瀬さんだ")
	if err != nil {
		t.Fatal(err)
	}
	if got, want := strings.Join(turn.Text, ""), strings.Join(s.Misses["declare"], ""); got != want {
		t.Errorf("text = %q, want the declare miss %q", got, want)
	}
}

func TestOnlyReachableActionsAreOffered(t *testing.T) {
	s := load(t)
	f := &fake{choice: scenario.NoMatch, prob: 0.9, conf: 0.9}
	e := &Engine{Asker: f, Policy: DefaultPolicy()}

	if _, _, err := e.Play(context.Background(), s, New(s), "何かする"); err != nil {
		t.Fatal(err)
	}
	options, ok := f.asked[KeyAction].Criteria.(map[string]jev.Option)
	if !ok {
		t.Fatalf("the action question carries %T, not options", f.asked[KeyAction].Criteria)
	}
	if _, offered := options["examine_body"]; offered {
		// It lives in the master's room and the player is in the hall.
		t.Error("an action from another room was offered")
	}
	if _, offered := options["ask_mochizuki_prints"]; offered {
		// It needs the tracks, which the player has not found.
		t.Error("an action whose requirements are unmet was offered")
	}
	if _, offered := options[scenario.NoMatch]; !offered {
		t.Error("none is always an option; without it an unrelated input lands somewhere")
	}
	if _, offered := options[scenario.FinaleAction]; offered {
		t.Error("the finale was offered before the case was ready for it")
	}
	// A yes-or-no question is judged on its own rather than competing with
	// the actions for one distribution. That is the whole reason a player can
	// ask one in whatever words occur to them.
	if _, offered := options[scenario.ClosedPrefix+"mochizuki"]; offered {
		t.Error("the closed question is competing with the actions for the vote")
	}
	for _, key := range []string{KeyClosed, KeyAskee, KeyFlavour, scenario.ClosedPrefix + "mochizuki"} {
		if _, asked := f.asked[key]; !asked {
			t.Errorf("the turn did not ask %q", key)
		}
	}
}

func TestFinaleIsOfferedOnceTheCaseIsReady(t *testing.T) {
	s := load(t)
	st := New(s)
	st.Evidence = []string{"meals", "pawprint", "bite"}

	f := &fake{choice: scenario.FinaleAction, prob: 0.9, conf: 0.9, intent: IntentTalk, declare: 0.9}
	e := &Engine{Asker: f, Policy: DefaultPolicy()}

	_, turn, err := e.Play(context.Background(), s, st, "全員を集める")
	if err != nil {
		t.Fatal(err)
	}
	if !turn.Finale {
		t.Fatal("the turn should have opened the finale")
	}
	if got, want := strings.Join(turn.Text, ""), strings.Join(s.Finale.Prompt, ""); got != want {
		t.Errorf("text = %q, want the finale prompt", got)
	}
}

// The model is shown the room and the people in it, because "彼女に聞く" is
// only answerable if it can see who is standing here.
func TestTheModelSeesTheSurroundings(t *testing.T) {
	s := load(t)
	f := &fake{choice: scenario.NoMatch, prob: 0.9, conf: 0.9}
	e := &Engine{Asker: f, Policy: DefaultPolicy()}

	if _, _, err := e.Play(context.Background(), s, New(s), "彼女に聞く"); err != nil {
		t.Fatal(err)
	}
	view, ok := f.state.(playerView)
	if !ok {
		t.Fatalf("state is %T", f.state)
	}
	if view.Place != "玄関広間" || len(view.People) != 1 {
		t.Errorf("view = %+v, want the hall and the one person in it", view)
	}
	if view.Input != "彼女に聞く" {
		t.Errorf("input = %q", view.Input)
	}
}

func TestPlayRejectsEmptyInput(t *testing.T) {
	s := load(t)
	e := &Engine{Asker: &fake{}, Policy: DefaultPolicy()}
	if _, _, err := e.Play(context.Background(), s, New(s), "  　 "); !errors.Is(err, ErrNoInput) {
		t.Fatalf("err = %v, want ErrNoInput", err)
	}
}

// Effects are sets, so an action taken twice leaves the same state. Only the
// narration changes, which is what stops a discovery being announced twice.
func TestApplyIsIdempotent(t *testing.T) {
	s := load(t)
	st := New(s)
	st.Scene = "chamber"
	body := s.Action("examine_body")

	st, first := Apply(s, st, body)
	if len(first.Gained) != 1 || first.Gained[0] != "bite" {
		t.Fatalf("first pass gained %v, want the bite marks", first.Gained)
	}

	before := len(st.Evidence)
	st, second := Apply(s, st, body)
	if len(st.Evidence) != before {
		t.Error("the second pass handed out the evidence again")
	}
	if len(second.Gained) != 0 {
		t.Errorf("the second pass announced %v again", second.Gained)
	}
	if !second.Repeat || second.Text[0] == first.Text[0] {
		t.Error("a repeat should read differently from a discovery")
	}
}

// A closed question is answered in the same request that routed it, so it
// costs one round trip like any other turn.
//
// Nothing about it goes through the action routing any more: the action
// question missed here, and the question was still answered.
func TestAClosedQuestionIsAnswered(t *testing.T) {
	s := load(t)
	f := &fake{
		choice: scenario.NoMatch, prob: 0.9, conf: 0.9, intent: IntentAsk,
		closed: 0.9, askee: "mochizuki", said: scenario.AnswerNo,
	}
	e := &Engine{Asker: f, Policy: DefaultPolicy()}

	_, turn, err := e.Play(context.Background(), s, New(s), "望月さん、あなたが犯人ですか")
	if err != nil {
		t.Fatal(err)
	}
	if !turn.Matched || turn.Outcome == nil {
		t.Fatal("the question went unanswered")
	}
	if turn.Choice != scenario.ClosedPrefix+"mochizuki" {
		t.Errorf("choice = %q, want the closed question to mochizuki", turn.Choice)
	}
	if turn.Answer != scenario.AnswerNo {
		t.Errorf("answer = %q, want %q", turn.Answer, scenario.AnswerNo)
	}
	// The culprit denies it, in her own words, and the state does not move.
	if got, want := turn.Text[0], s.Character("mochizuki").Closed.Answers.Say(scenario.AnswerNo); got != want {
		t.Errorf("said %q, want %q", got, want)
	}
	if turn.Outcome.Speaker != "mochizuki" || len(turn.Outcome.Gained) != 0 {
		t.Errorf("outcome = %+v", turn.Outcome)
	}
}

// Whether the input is a yes-or-no question is its own judgement, put to the
// model directly. Below the threshold nobody answers, however plainly the
// input names one of them: a player who meant to say something else to
// somebody should not be handed a "はい".
func TestAnInputThatIsNotAQuestionGetsNoAnswer(t *testing.T) {
	s := load(t)
	f := &fake{
		choice: scenario.NoMatch, prob: 0.9, conf: 0.9, intent: IntentTalk,
		closed: 0.2, askee: "mochizuki", said: scenario.AnswerYes,
	}
	e := &Engine{Asker: f, Policy: DefaultPolicy()}

	_, turn, err := e.Play(context.Background(), s, New(s), "望月さんをじっと見る")
	if err != nil {
		t.Fatal(err)
	}
	if turn.Matched || turn.Answer != "" {
		t.Fatalf("this should not have been answered: %+v", turn)
	}
	if got := strings.Join(turn.Text, ""); got != strings.Join(s.Miss(IntentTalk), "") {
		t.Errorf("text = %q, want the talk miss", got)
	}
}

// A question addressed to nobody in particular is not put in anybody's mouth.
func TestAQuestionAddressedToNobodyIsNotAnswered(t *testing.T) {
	s := load(t)
	f := &fake{
		choice: scenario.NoMatch, prob: 0.9, conf: 0.9, intent: IntentAsk,
		closed: 0.9, askee: scenario.NoMatch, said: scenario.AnswerYes,
	}
	e := &Engine{Asker: f, Policy: DefaultPolicy()}

	_, turn, err := e.Play(context.Background(), s, New(s), "誰か、九時に会いましたか")
	if err != nil {
		t.Fatal(err)
	}
	if turn.Matched || turn.Answer != "" {
		t.Fatalf("nobody was addressed and somebody answered: %+v", turn)
	}
}

// A coin-flip between yes and no is the one answer this game must never give:
// the player cannot tell it from a considered one.
func TestAnUnsureAnswerBecomesIDoNotKnow(t *testing.T) {
	s := load(t)
	f := &fake{
		choice: scenario.NoMatch, prob: 0.9, conf: 0.9, intent: IntentAsk,
		closed: 0.9, askee: "mochizuki", said: scenario.AnswerYes, saidProb: 0.3,
	}
	e := &Engine{Asker: f, Policy: DefaultPolicy()}

	_, turn, err := e.Play(context.Background(), s, New(s), "九時に会ったんですか")
	if err != nil {
		t.Fatal(err)
	}
	if turn.Answer != scenario.AnswerUnknown {
		t.Fatalf("answer = %q, want %q", turn.Answer, scenario.AnswerUnknown)
	}
}

// The person asked keeps the last word. Their own question has a fourth
// option saying yes or no could not answer what was put to them, and it
// overrides the two judgements that got the question to them.
func TestThePersonAskedCanRefuseTheQuestion(t *testing.T) {
	s := load(t)
	f := &fake{
		choice: scenario.NoMatch, prob: 0.9, conf: 0.9, intent: IntentAsk,
		closed: 0.9, askee: "mochizuki", said: notClosed,
	}
	e := &Engine{Asker: f, Policy: DefaultPolicy()}

	_, turn, err := e.Play(context.Background(), s, New(s), "望月さん、今夜のことを話してください")
	if err != nil {
		t.Fatal(err)
	}
	if turn.Matched {
		t.Fatal("this should not have counted as an answer")
	}
}

// An authored action wins over the closed question, even when the input is
// plainly a yes-or-no one. The author wrote an answer to this; the model's
// own reply is for everything they did not.
func TestAnAuthoredActionBeatsAClosedQuestion(t *testing.T) {
	s := load(t)
	f := &fake{
		choice: "ask_mochizuki", prob: 0.8, conf: 0.9, intent: IntentAsk,
		closed: 0.95, askee: "mochizuki", said: scenario.AnswerNo,
	}
	e := &Engine{Asker: f, Policy: DefaultPolicy()}

	_, turn, err := e.Play(context.Background(), s, New(s), "望月さん、八時に電話していたんですか")
	if err != nil {
		t.Fatal(err)
	}
	if turn.Choice != "ask_mochizuki" || turn.Answer != "" {
		t.Errorf("turn = %+v, want the authored answer", turn)
	}
}

// Flavour is the last pass. It answers only what everything else missed, so
// writing more of it can never put an action out of reach.
func TestFlavourAnswersWhatTheActionsMissed(t *testing.T) {
	s := load(t)
	f := &fake{
		choice: scenario.NoMatch, prob: 0.9, conf: 0.9, intent: IntentSearch,
		flavour: "photographs",
	}
	e := &Engine{Asker: f, Policy: DefaultPolicy()}

	st, turn, err := e.Play(context.Background(), s, New(s), "壁の写真を眺める")
	if err != nil {
		t.Fatal(err)
	}
	if !turn.Matched || turn.Outcome == nil {
		t.Fatal("the flavour went unread")
	}
	if turn.Choice != scenario.FlavourPrefix+"photographs" {
		t.Errorf("choice = %q", turn.Choice)
	}
	if got, want := strings.Join(turn.Text, ""), strings.Join(s.Flavour("photographs").Text, ""); got != want {
		t.Errorf("text = %q, want the flavour text", got)
	}
	// Flavour changes nothing. That is what makes it safe to write a lot of.
	if len(st.Evidence) != 0 || len(st.Flags) != 0 || len(st.Taken) != 0 {
		t.Errorf("flavour moved the state: %+v", st)
	}
}

// Flavour answers on less than an action needs. It is read only after every
// action has missed and it moves nothing, so the cost of being loose is two
// lines of scenery that were not quite asked for — against a miss, which
// says "何も起こらない" and teaches the player nothing at all.
func TestFlavourAnswersOnLessThanAnAction(t *testing.T) {
	s := load(t)
	policy := DefaultPolicy()

	for name, tc := range map[string]struct {
		prob float64
		want bool
	}{
		"under an action's floor, over its own": {prob: policy.Match - 0.05, want: true},
		"under its own floor":                   {prob: policy.Flavour - 0.05, want: false},
	} {
		t.Run(name, func(t *testing.T) {
			// The hall carries three flavour entries, so the weight this one
			// does not hold is spread over its neighbours rather than piled
			// onto `none`.
			f := &fake{
				choice: scenario.NoMatch, prob: 0.9, conf: 0.9,
				flavour: "photographs", flavourProb: tc.prob, flavourNone: 0.2,
			}
			e := &Engine{Asker: f, Policy: policy}

			_, turn, err := e.Play(context.Background(), s, New(s), "何かする")
			if err != nil {
				t.Fatal(err)
			}
			if got := turn.Choice == scenario.FlavourPrefix+"photographs"; got != tc.want {
				t.Errorf("choice = %q at %.2f, want flavour = %v", turn.Choice, tc.prob, tc.want)
			}
		})
	}
}

func TestAnActionBeatsFlavour(t *testing.T) {
	s := load(t)
	f := &fake{
		choice: "examine_ledger", prob: 0.8, conf: 0.9, intent: IntentSearch,
		flavour: "photographs",
	}
	e := &Engine{Asker: f, Policy: DefaultPolicy()}

	_, turn, err := e.Play(context.Background(), s, New(s), "献立帳を調べる")
	if err != nil {
		t.Fatal(err)
	}
	if turn.Choice != "examine_ledger" {
		t.Errorf("choice = %q, want the action", turn.Choice)
	}
}

// Flavour is gated like an action: one written for the master's room is not
// offered in the hall.
func TestFlavourIsGatedByScene(t *testing.T) {
	s := load(t)
	f := &fake{choice: scenario.NoMatch, prob: 0.9, conf: 0.9, flavour: scenario.NoMatch}
	e := &Engine{Asker: f, Policy: DefaultPolicy()}

	if _, _, err := e.Play(context.Background(), s, New(s), "何かする"); err != nil {
		t.Fatal(err)
	}
	options, ok := f.asked[KeyFlavour].Criteria.(map[string]jev.Option)
	if !ok {
		t.Fatalf("the flavour question carries %T, not options", f.asked[KeyFlavour].Criteria)
	}
	if _, offered := options["mirror"]; offered {
		t.Error("flavour from the master's room was offered in the hall")
	}
	if _, offered := options["photographs"]; !offered {
		t.Error("the hall's own flavour was not offered")
	}
	if _, offered := options[scenario.NoMatch]; !offered {
		t.Error("none has to absorb an input no flavour covers")
	}
}

// Walking into a room says what is in it. A player who moved and was told
// nothing has no reason to search the place they just arrived in.
func TestMovingDescribesTheRoomArrivedIn(t *testing.T) {
	s := load(t)
	f := &fake{choice: "go_chamber", prob: 0.8, conf: 0.9, intent: IntentMove}
	e := &Engine{Asker: f, Policy: DefaultPolicy()}

	_, turn, err := e.Play(context.Background(), s, New(s), "主人の部屋へ行く")
	if err != nil {
		t.Fatal(err)
	}
	if len(turn.Arrival) == 0 {
		t.Fatal("moving said nothing about where the player now is")
	}
	if got, want := turn.Arrival[0], s.Scene("chamber").Description[0]; got != want {
		t.Errorf("arrival = %q, want the master's room description", got)
	}
	// Nobody is in the room with the body, and saying so is part of it.
	if last := turn.Arrival[len(turn.Arrival)-1]; last != "ここには誰もいない。" {
		t.Errorf("arrival ends %q", last)
	}
}

// A turn that did not move the player says nothing about the room: the log
// would otherwise repeat the place panel on every line.
func TestAnActionThatStaysPutDescribesNothing(t *testing.T) {
	s := load(t)
	f := &fake{choice: "examine_ledger", prob: 0.8, conf: 0.9, intent: IntentSearch}
	e := &Engine{Asker: f, Policy: DefaultPolicy()}

	_, turn, err := e.Play(context.Background(), s, New(s), "献立帳を調べる")
	if err != nil {
		t.Fatal(err)
	}
	if len(turn.Arrival) != 0 {
		t.Errorf("arrival = %v, want nothing", turn.Arrival)
	}
}

// Describe names whoever is standing in the room, which is why that line
// cannot be written into the scenario file: it changes as the case moves.
func TestDescribeNamesThePeopleInTheRoom(t *testing.T) {
	s := load(t)
	lines := Describe(s, New(s))
	if last := lines[len(lines)-1]; !strings.Contains(last, "望月 節子") {
		t.Errorf("%q does not name the housekeeper", last)
	}

	// The three suspects wait in one room, so that line has to carry all of
	// them rather than only whoever the scenario happened to list first.
	st := New(s)
	st.Scene = "guestroom"
	parlour := Describe(s, st)
	named := parlour[len(parlour)-1]
	for _, want := range []string{"久瀬 瑠依", "北村 千歳", "海堂 実"} {
		if !strings.Contains(named, want) {
			t.Errorf("the parlour does not name %s: %q", want, named)
		}
	}
}

// The plot is sent only where it is needed. Nobody can answer a closed
// question without it, and no other turn has any use for it.
func TestTheStoryTravelsOnlyWhereItIsAnswerable(t *testing.T) {
	s := load(t)
	f := &fake{choice: scenario.NoMatch, prob: 0.9, conf: 0.9}
	e := &Engine{Asker: f, Policy: DefaultPolicy()}

	// The hall: somebody who can be asked.
	if _, _, err := e.Play(context.Background(), s, New(s), "何かする"); err != nil {
		t.Fatal(err)
	}
	if view := f.state.(playerView); len(view.Story) == 0 {
		t.Error("the people here can be asked, but the plot was withheld")
	}

	// The master's room: a body and no one to ask.
	st := New(s)
	st.Scene = "chamber"
	if _, _, err := e.Play(context.Background(), s, st, "何かする"); err != nil {
		t.Fatal(err)
	}
	if view := f.state.(playerView); len(view.Story) != 0 {
		t.Error("the plot was sent to a room where nobody can answer for it")
	}
}

// The case speaks up on its own the turn the last of the three witnesses is
// heard, and only that once: a second hearing of the same child is a re-read,
// not a new realisation.
func TestAnInterludeFollowsTheTurnThatCompletesIt(t *testing.T) {
	s := load(t)
	f := &fake{choice: "ask_suzu", prob: 0.8, conf: 0.9, intent: IntentAsk}
	e := &Engine{Asker: f, Policy: DefaultPolicy()}

	st := New(s)
	st.Scene = "kitchen"
	st.Flags = []string{"heard_mochizuki", "heard_nishina"}

	st, turn, err := e.Play(context.Background(), s, st, "鈴ちゃんに話を聞く")
	if err != nil {
		t.Fatal(err)
	}
	if len(turn.Interlude) == 0 {
		t.Fatal("the third witness was heard and the case said nothing")
	}
	if !strings.Contains(turn.Interlude[len(turn.Interlude)-1], "探偵はつぶやいた") {
		t.Errorf("interlude = %v", turn.Interlude)
	}

	_, again, err := e.Play(context.Background(), s, st, "鈴ちゃんにもう一度話を聞く")
	if err != nil {
		t.Fatal(err)
	}
	if len(again.Interlude) != 0 {
		t.Errorf("the interlude was read twice: %v", again.Interlude)
	}
}

// With a witness still unheard there is nothing to remark on yet.
func TestAnInterludeWaitsForAllItsRequirements(t *testing.T) {
	s := load(t)
	f := &fake{choice: "ask_suzu", prob: 0.8, conf: 0.9, intent: IntentAsk}
	e := &Engine{Asker: f, Policy: DefaultPolicy()}

	st := New(s)
	st.Scene = "kitchen"
	st.Flags = []string{"heard_mochizuki"}

	_, turn, err := e.Play(context.Background(), s, st, "鈴ちゃんに話を聞く")
	if err != nil {
		t.Fatal(err)
	}
	if len(turn.Interlude) != 0 {
		t.Errorf("interlude = %v, want nothing", turn.Interlude)
	}
}
