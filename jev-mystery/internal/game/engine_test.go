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

	// said is what a character answers a closed question with, and saidProb
	// how sure they are of it.
	said     string
	saidProb float64

	asked map[string]jev.Question
	state any
}

func (f *fake) Ask(_ context.Context, state any, qs map[string]jev.Question) (*jev.Response, error) {
	f.asked, f.state = qs, state
	answers := map[string]jev.Answer{}
	for key, q := range qs {
		switch {
		case key == KeyAction:
			conf := f.conf
			answers[key] = jev.Answer{
				Type:          jev.TypeChoice,
				Choice:        f.choice,
				Probabilities: map[string]float64{f.choice: f.prob, scenario.NoMatch: 1 - f.prob},
				Confidence:    &conf,
			}
		case key == KeyIntent:
			answers[key] = jev.Answer{Type: jev.TypeChoice, Choice: f.intent}
		case key == KeyDeclare:
			d := f.declare
			answers[key] = jev.Answer{Type: jev.TypeNoul, Noul: &d}
		case key == KeyCulprit:
			answers[key] = jev.Answer{Type: jev.TypeChoice, Choice: f.choice,
				Probabilities: map[string]float64{f.choice: f.prob}}
		case strings.HasPrefix(key, scenario.ClosedPrefix):
			prob := f.saidProb
			if prob == 0 {
				prob = 0.9
			}
			answers[key] = jev.Answer{Type: jev.TypeChoice, Choice: f.said,
				Probabilities: map[string]float64{f.said: prob}}
		case key == KeyCoherence:
			s := f.score
			answers[key] = jev.Answer{Type: jev.TypeScore, Score: &s,
				Legend: map[string]string{"0": "bad", "1": "ok", "2": "fine", "3": "good", "4": "airtight"}}
		case q.Type == jev.TypeNoul:
			n := f.noul
			answers[key] = jev.Answer{Type: jev.TypeNoul, Noul: &n}
		}
	}
	return &jev.Response{Answers: answers}, nil
}

func load(t *testing.T) *scenario.Scenario {
	t.Helper()
	s, err := scenario.Builtin("clockwork")
	if err != nil {
		t.Fatal(err)
	}
	return s
}

func TestPlayAppliesAMatch(t *testing.T) {
	s := load(t)
	f := &fake{choice: "examine_clock", prob: 0.8, conf: 0.9, intent: IntentSearch}
	e := &Engine{Asker: f, Policy: DefaultPolicy()}

	st, turn, err := e.Play(context.Background(), s, New(s), "柱時計を調べる")
	if err != nil {
		t.Fatal(err)
	}
	if !turn.Matched || turn.Outcome == nil {
		t.Fatal("the turn should have matched")
	}
	if !st.HasEvidence("clock") {
		t.Error("the action gives the clock and the state did not take it")
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
		"low probability": {choice: "examine_clock", prob: 0.2, conf: 0.9, intent: IntentSearch},
		"low confidence":  {choice: "examine_clock", prob: 0.8, conf: 0.1, intent: IntentSearch},
		"loses to none":   {choice: "examine_clock", prob: 0.45, conf: 0.9, intent: IntentSearch},
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
			if st.HasEvidence("clock") {
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

	_, turn, err := e.Play(context.Background(), s, New(s), "犯人は倉田さんだ")
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
	if _, offered := options["examine_window"]; offered {
		// It lives in the study and the player is in the hall.
		t.Error("an action from another room was offered")
	}
	if _, offered := options["ask_kurata_ledger"]; offered {
		// It needs the ledger, which the player has not found.
		t.Error("an action whose requirements are unmet was offered")
	}
	if _, offered := options[scenario.NoMatch]; !offered {
		t.Error("none is always an option; without it an unrelated input lands somewhere")
	}
	if _, offered := options[scenario.FinaleAction]; offered {
		t.Error("the finale was offered before the case was ready for it")
	}
}

func TestFinaleIsOfferedOnceTheCaseIsReady(t *testing.T) {
	s := load(t)
	st := New(s)
	st.Evidence = []string{"clock", "ledger", "thread"}

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
	if view.Place != "玄関ホール" || len(view.People) != 2 {
		t.Errorf("view = %+v, want the hall and the two people in it", view)
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
	st.Scene = "study"
	desk := s.Action("examine_desk")

	st, first := Apply(s, st, desk)
	if len(first.Gained) != 1 || first.Gained[0] != "ledger" {
		t.Fatalf("first pass gained %v, want the ledger", first.Gained)
	}

	before := len(st.Evidence)
	st, second := Apply(s, st, desk)
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
func TestAClosedQuestionIsAnswered(t *testing.T) {
	s := load(t)
	f := &fake{
		choice: scenario.ClosedPrefix + "kurata", prob: 0.8, conf: 0.9,
		intent: IntentAsk, said: scenario.AnswerNo,
	}
	e := &Engine{Asker: f, Policy: DefaultPolicy()}

	_, turn, err := e.Play(context.Background(), s, New(s), "倉田さん、あなたが犯人ですか")
	if err != nil {
		t.Fatal(err)
	}
	if !turn.Matched || turn.Outcome == nil {
		t.Fatal("the question went unanswered")
	}
	if turn.Answer != scenario.AnswerNo {
		t.Errorf("answer = %q, want %q", turn.Answer, scenario.AnswerNo)
	}
	// The culprit denies it, in her own words, and the state does not move.
	if got, want := turn.Text[0], s.Character("kurata").Closed.Answers.Say(scenario.AnswerNo); got != want {
		t.Errorf("said %q, want %q", got, want)
	}
	if turn.Outcome.Speaker != "kurata" || len(turn.Outcome.Gained) != 0 {
		t.Errorf("outcome = %+v", turn.Outcome)
	}
}

// A coin-flip between yes and no is the one answer this game must never give:
// the player cannot tell it from a considered one.
func TestAnUnsureAnswerBecomesIDoNotKnow(t *testing.T) {
	s := load(t)
	f := &fake{
		choice: scenario.ClosedPrefix + "kurata", prob: 0.8, conf: 0.9,
		intent: IntentAsk, said: scenario.AnswerYes, saidProb: 0.3,
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

// The model's own fourth option says the input was not a yes-or-no question
// after all, which is a miss rather than an answer.
func TestAnInputThatIsNotAQuestionMisses(t *testing.T) {
	s := load(t)
	f := &fake{
		choice: scenario.ClosedPrefix + "kurata", prob: 0.8, conf: 0.9,
		intent: IntentTalk, said: notClosed,
	}
	e := &Engine{Asker: f, Policy: DefaultPolicy()}

	_, turn, err := e.Play(context.Background(), s, New(s), "倉田さんをじっと見る")
	if err != nil {
		t.Fatal(err)
	}
	if turn.Matched {
		t.Fatal("this should not have counted as an answer")
	}
	if got := strings.Join(turn.Text, ""); got != strings.Join(s.Miss(IntentTalk), "") {
		t.Errorf("text = %q, want the talk miss", got)
	}
}

// The plot is sent only where it is needed. Nobody can answer a closed
// question without it, and no other turn has any use for it.
func TestTheStoryTravelsOnlyWhereItIsAnswerable(t *testing.T) {
	s := load(t)
	f := &fake{choice: scenario.NoMatch, prob: 0.9, conf: 0.9}
	e := &Engine{Asker: f, Policy: DefaultPolicy()}

	// The hall: two people who can be asked.
	if _, _, err := e.Play(context.Background(), s, New(s), "何かする"); err != nil {
		t.Fatal(err)
	}
	if view := f.state.(playerView); len(view.Story) == 0 {
		t.Error("the people here can be asked, but the plot was withheld")
	}

	// The study: a body and no one to ask.
	st := New(s)
	st.Scene = "study"
	if _, _, err := e.Play(context.Background(), s, st, "何かする"); err != nil {
		t.Fatal(err)
	}
	if view := f.state.(playerView); len(view.Story) != 0 {
		t.Error("the plot was sent to a room where nobody can answer for it")
	}
}
