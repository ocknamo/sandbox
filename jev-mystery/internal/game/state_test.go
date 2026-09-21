package game

import (
	"testing"

	"github.com/ocknamo/sandbox/jev-mystery/internal/scenario"
)

func TestAvailableFollowsTheScene(t *testing.T) {
	s := load(t)
	st := New(s)

	if has(Available(s, st), "examine_clock") == false {
		t.Error("the clock is in the hall, where the player starts")
	}
	if has(Available(s, st), "examine_window") {
		t.Error("the window is in the study")
	}

	st.Scene = "study"
	if !has(Available(s, st), "examine_window") {
		t.Error("the window should be reachable from the study")
	}
	if !has(Available(s, st), "look") {
		t.Error("an action with no scenes is available anywhere")
	}
}

func TestAvailableFollowsRequirements(t *testing.T) {
	s := load(t)
	st := New(s)

	if has(Available(s, st), "ask_kurata_ledger") {
		t.Error("the ledger question needs the ledger")
	}
	st.Evidence = []string{"ledger"}
	if !has(Available(s, st), "ask_kurata_ledger") {
		t.Error("with the ledger in hand the question should open up")
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
	if !second.Repeat || sameText(first.Text, second.Text) {
		t.Error("a repeat should read differently from a discovery")
	}
}

func TestApplyMoves(t *testing.T) {
	s := load(t)
	st, out := Apply(s, New(s), s.Action("go_study"))
	if st.Scene != "study" || out.MovedTo != "study" {
		t.Fatalf("scene = %q, moved_to = %q", st.Scene, out.MovedTo)
	}
}

func TestFinaleOpensOnTheLastPieceOfEvidence(t *testing.T) {
	s := load(t)
	st := New(s)
	if FinaleOpen(s, st) {
		t.Fatal("the finale is open with nothing collected")
	}
	st.Evidence = []string{"clock", "ledger"}
	if FinaleOpen(s, st) {
		t.Fatal("the finale is open two pieces in")
	}
	st.Evidence = append(st.Evidence, "thread")
	if !FinaleOpen(s, st) {
		t.Fatal("the finale should be open with all three")
	}
}

func has(actions []*scenario.Action, id string) bool {
	for _, a := range actions {
		if a.ID == id {
			return true
		}
	}
	return false
}

func sameText(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}
