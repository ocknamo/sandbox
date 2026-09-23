// Package game is the engine: what a player may do right now, what happens
// when they do it, and how a free-text input becomes one of those things.
//
// The split between this package and Jev follows the one the rest of this repo
// uses. Jev is asked only what an input *is* — which of the offered actions it
// most resembles, and what kind of thing the player was attempting. Whether
// that resemblance is close enough to count is policy, and policy lives in Go
// where it can be read, tested and retuned without another round trip.
package game

import (
	"sort"
	"strings"

	"github.com/ocknamo/sandbox/jev-mystery/internal/scenario"
)

// State is everything one playthrough remembers. It is small and it is
// serialisable on purpose: the service keeps no sessions, so this travels to
// the browser and back on every turn.
//
// None of it is secret. Evidence is only in here once the player has found it,
// flags say what they have already done, and the scene is where they are
// standing. What stays on the server is the part that would spoil the game:
// the actions they have not discovered, and the solution.
type State struct {
	Scenario string `json:"scenario"`
	Scene    string `json:"scene"`

	Evidence []string `json:"evidence,omitempty"`
	Flags    []string `json:"flags,omitempty"`

	// Taken records which actions have already happened, so a discovery is
	// narrated once and re-reads get the shorter text.
	Taken []string `json:"taken,omitempty"`

	// Interludes records which of the case's unprompted asides have been
	// read, so each is read once.
	Interludes []string `json:"interludes,omitempty"`

	Turn     int  `json:"turn"`
	Finished bool `json:"finished,omitempty"`
}

// New starts a playthrough at the scenario's opening scene.
func New(s *scenario.Scenario) State {
	return State{Scenario: s.ID, Scene: s.StartScene}
}

// HasEvidence reports whether the player is holding a piece of evidence.
func (st State) HasEvidence(id string) bool { return contains(st.Evidence, id) }

// HasFlag reports whether a flag has been set.
func (st State) HasFlag(id string) bool { return contains(st.Flags, id) }

// HasTaken reports whether an action has already been performed.
func (st State) HasTaken(id string) bool { return contains(st.Taken, id) }

// Available lists the actions the player could take from here: the ones set in
// this scene (or anywhere) whose requirements are met.
//
// This is the whole of the game's difficulty curve. An action that is not
// available is not offered to Jev, so an input asking for it matches nothing
// and reads as "not yet" — which is the same thing the player sees for an
// input that asks for something the case never contained.
func Available(s *scenario.Scenario, st State) []*scenario.Action {
	var out []*scenario.Action
	for i := range s.Actions {
		a := &s.Actions[i]
		if !inScene(a.Scenes, st.Scene) || !met(a.Requires, st) {
			continue
		}
		out = append(out, a)
	}
	return out
}

// AvailableFlavour lists the flavour entries that could answer an input from
// here, gated the same way the actions are.
//
// They are kept apart from the actions all the way through. A flavour entry is
// only ever reached once every action has missed, so writing more of them can
// make a case richer without making its actions harder to hit.
func AvailableFlavour(s *scenario.Scenario, st State) []*scenario.Flavour {
	var out []*scenario.Flavour
	for i := range s.Flavours {
		f := &s.Flavours[i]
		if !inScene(f.Scenes, st.Scene) || !met(f.Requires, st) {
			continue
		}
		out = append(out, f)
	}
	return out
}

func inScene(scenes []string, scene string) bool {
	if len(scenes) == 0 {
		return true
	}
	return contains(scenes, scene)
}

func met(r scenario.Requires, st State) bool {
	for _, id := range r.Evidence {
		if !st.HasEvidence(id) {
			return false
		}
	}
	for _, id := range r.Flags {
		if !st.HasFlag(id) {
			return false
		}
	}
	for _, id := range r.NotFlags {
		if st.HasFlag(id) {
			return false
		}
	}
	return true
}

// Outcome is what one action did, ready to be read by the player.
type Outcome struct {
	ActionID string   `json:"action_id"`
	Did      string   `json:"did"`
	Text     []string `json:"text"`

	// Speaker is who answered, when the action was a question.
	Speaker string `json:"speaker,omitempty"`

	// Gained names the evidence this turn produced, so the page can call it
	// out rather than making the player diff their own inventory.
	Gained []string `json:"gained,omitempty"`

	MovedTo string `json:"moved_to,omitempty"`
	Repeat  bool   `json:"repeat,omitempty"`
}

// Apply performs an action and returns the updated state alongside what the
// player reads. Effects are sets, so taking an action twice leaves the same
// state; only the narration differs.
func Apply(s *scenario.Scenario, st State, a *scenario.Action) (State, Outcome) {
	out := Outcome{ActionID: a.ID, Did: a.Did, Speaker: a.Speaker}

	repeat := st.HasTaken(a.ID)
	if repeat && len(a.Repeat) > 0 {
		out.Text, out.Repeat = a.Repeat, true
	} else {
		out.Text, out.Repeat = a.Result, repeat
	}

	for _, id := range a.Gives {
		if !st.HasEvidence(id) {
			st.Evidence = add(st.Evidence, id)
			out.Gained = append(out.Gained, id)
		}
	}
	for _, id := range a.Sets {
		st.Flags = add(st.Flags, id)
	}
	st.Taken = add(st.Taken, a.ID)

	if a.MovesTo != "" && a.MovesTo != st.Scene {
		st.Scene = a.MovesTo
		out.MovedTo = a.MovesTo
	}
	return st, out
}

// Interlude reports the asides the case volunteers now that the state has
// moved: every interlude whose requirements have just come to hold and which
// has not been read before, in file order, marked as read.
//
// It is checked after an action and nowhere else, because only an action moves
// the state; a turn that answered a question or printed flavour cannot have
// completed anything.
func Interlude(s *scenario.Scenario, st State) (State, []string) {
	var text []string
	for i := range s.Interludes {
		in := &s.Interludes[i]
		if contains(st.Interludes, in.ID) || !met(in.Requires, st) {
			continue
		}
		st.Interludes = add(st.Interludes, in.ID)
		text = append(text, in.Text...)
	}
	return st, text
}

// Describe is the room as it reads on walking into it: the authored
// description of the place, and a line naming who is standing in it.
//
// It is the one piece of prose here the engine assembles rather than reads.
// Who is in a room changes as the case moves, so the sentence naming them
// cannot be written in the file; everything around it is authored.
//
// This is a hint in the same sense the people panel is one — it says what is
// in front of the player, not what to type about it — and it exists because a
// room the player walked into without being told anything about is a room they
// have no reason to search.
func Describe(s *scenario.Scenario, st State) []string {
	sc := s.Scene(st.Scene)
	if sc == nil {
		return nil
	}
	lines := append([]string{}, sc.Description...)

	var here []string
	for _, id := range sc.Characters {
		if c := s.Character(id); c != nil {
			here = append(here, c.Name+"（"+c.Role+"）")
		}
	}
	switch len(here) {
	case 0:
		lines = append(lines, "ここには誰もいない。")
	case 1:
		lines = append(lines, here[0]+"がここにいる。")
	default:
		lines = append(lines, strings.Join(here[:len(here)-1], "、")+"と"+here[len(here)-1]+"が、ここにいる。")
	}
	return lines
}

// FinaleOpen reports whether the player has enough to call everyone together.
// Gathering the suspects is itself an action the player has to ask for; this
// only decides whether asking can work.
func FinaleOpen(s *scenario.Scenario, st State) bool {
	for _, id := range s.Finale.RequiresEvidence {
		if !st.HasEvidence(id) {
			return false
		}
	}
	for _, id := range s.Finale.RequiresFlags {
		if !st.HasFlag(id) {
			return false
		}
	}
	return true
}

func add(list []string, id string) []string {
	if contains(list, id) {
		return list
	}
	list = append(list, id)
	sort.Strings(list)
	return list
}

func contains(list []string, want string) bool {
	for _, v := range list {
		if v == want {
			return true
		}
	}
	return false
}
