// Package scenario holds the authored content of a case and nothing else: the
// prose, the people, the places, and the list of things a player is allowed to
// do.
//
// Everything a player ever reads is written here by hand. Jev does not write
// prose — it returns typed values — so the model's only job in this game is to
// decide which of these authored entries an input is asking for. Keeping the
// content in data rather than in Go is what lets a case be rewritten without
// touching the engine.
//
// One rule governs the whole package: the option list is secret. A player is
// never shown what they could have typed, so nothing here may be served to a
// browser except the pieces the engine explicitly reveals.
package scenario

import (
	"encoding/json"
	"fmt"
	"sort"
)

// Scenario is one complete case.
type Scenario struct {
	ID       string   `json:"id"`
	Title    string   `json:"title"`
	Byline   string   `json:"byline,omitempty"`
	Opening  []string `json:"opening"`
	Incident []string `json:"incident"`

	StartScene string      `json:"start_scene"`
	Scenes     []Scene     `json:"scenes"`
	Characters []Character `json:"characters"`
	Evidence   []Evidence  `json:"evidence"`
	Actions    []Action    `json:"actions"`

	// Misses is what the player reads when an input matches nothing, keyed by
	// the intent behind it. A miss is most of what a player will see early on,
	// so it is authored per intent rather than being one flat "何も起きない".
	// The key "default" is required and covers anything unlisted.
	Misses map[string][]string `json:"misses"`

	Finale Finale `json:"finale"`

	scenes     map[string]*Scene
	characters map[string]*Character
	evidence   map[string]*Evidence
	actions    map[string]*Action
}

// Scene is a place the player can be. Its description is read on arrival and
// whenever the player looks around.
type Scene struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Description []string `json:"description"`

	// Characters are the people standing here. They are shown to the player,
	// which is the one hint the game gives for free: you can see who is in the
	// room, but not what asking them anything would do.
	Characters []string `json:"characters,omitempty"`
}

// Character is a person in the case.
type Character struct {
	ID string `json:"id"`

	Name string `json:"name"`
	Role string `json:"role"`

	// Avatar is a single glyph used as a portrait. The game ships no images,
	// and a glyph survives being rendered anywhere.
	Avatar string `json:"avatar"`
}

// Evidence is something the player can come to hold. Evidence is public once
// found: it is listed for the player, and it gates actions.
type Evidence struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

// Requires gates an action on what the player has already found or done. An
// action whose requirements are unmet is not offered to Jev at all, so an
// input asking for it misses — which reads, correctly, as "not yet".
type Requires struct {
	Evidence []string `json:"evidence,omitempty"`
	Flags    []string `json:"flags,omitempty"`
	NotFlags []string `json:"not_flags,omitempty"`
}

// Match is how an action describes itself to Jev. It is the structured form of
// a choice option: saying what an action is NOT for separates it from its
// neighbours better than any amount of saying what it is, which matters here
// because a choice distribution sums to 1 and two overlapping options split
// the vote between them.
type Match struct {
	What     string   `json:"what"`
	NotFor   string   `json:"not_for,omitempty"`
	Examples []string `json:"examples,omitempty"`
}

// Action is one thing the player may do, and the only kind of thing that ever
// happens in this game. Moving, searching and questioning a suspect are all
// actions; they differ only in what they carry.
type Action struct {
	ID string `json:"id"`

	// Scenes lists where the action is available. Empty means anywhere.
	Scenes   []string `json:"scenes,omitempty"`
	Requires Requires `json:"requires,omitempty"`

	Match Match `json:"match"`

	// Speaker is the character who answers, for questions. It only decides
	// whose portrait the reply is shown under.
	Speaker string `json:"speaker,omitempty"`

	// Did is the one line echoed back as what the player just did. It is the
	// only place an action's name reaches the player, and it arrives after the
	// fact rather than as a menu entry.
	Did    string   `json:"did"`
	Result []string `json:"result"`

	// Repeat replaces Result when the action has already been taken. Effects
	// are idempotent — evidence and flags are sets — so repeating is harmless;
	// this only stops the same discovery from being narrated twice.
	Repeat []string `json:"repeat,omitempty"`

	Gives   []string `json:"gives_evidence,omitempty"`
	Sets    []string `json:"sets_flags,omitempty"`
	MovesTo string   `json:"moves_to,omitempty"`
}

// Point is one element of the truth the player's accusation is graded on. Each
// becomes a noul: a narrow yes/no about the text the player wrote.
type Point struct {
	ID    string `json:"id"`
	Label string `json:"label"`

	// Question is the instruction put to Jev, phrased about the accusation and
	// answerable from the truth the model is handed alongside it.
	Question string `json:"question"`
}

// Ending is one way the case can close. Endings are tested in file order and
// the first whose conditions are met is the one the player gets, so the last
// entry has to be reachable with nothing satisfied.
type Ending struct {
	ID string `json:"id"`

	RequireCulprit bool    `json:"require_culprit,omitempty"`
	MinPoints      int     `json:"min_points,omitempty"`
	MinCoherence   float64 `json:"min_coherence,omitempty"`

	Title string   `json:"title"`
	Text  []string `json:"text"`
}

// Finale is the endgame: the player gathers everyone and writes out what they
// think happened, in prose, and that prose is graded.
type Finale struct {
	// RequiresEvidence and RequiresFlags decide when the player may call
	// everyone together. Until then the option is not offered.
	RequiresEvidence []string `json:"requires_evidence,omitempty"`
	RequiresFlags    []string `json:"requires_flags,omitempty"`

	// Label names the gathering on the button the player presses once the
	// case is ready, and Match is how the same act describes itself to Jev,
	// since a player may simply type that they are calling everyone together.
	Label  string   `json:"label"`
	Match  Match    `json:"match"`
	Prompt []string `json:"prompt"`

	// Truth is the solution, handed to Jev as part of the state it grades
	// against. It is safe to send: Jev returns typed values and no text, so
	// there is no channel through which it could leak back to the player.
	// It must never be put in an HTTP response.
	Truth []string `json:"truth"`

	Suspects []string `json:"suspects"`
	Culprit  string   `json:"culprit"`

	Points []Point `json:"points"`

	// CoherenceLevels is the rubric for how well the accusation hangs together
	// as an argument, lowest level first. Between 2 and 10 of them.
	CoherenceLevels []string `json:"coherence_levels"`

	Endings []Ending `json:"endings"`
}

// Load parses and validates a scenario.
func Load(data []byte) (*Scenario, error) {
	var s Scenario
	if err := json.Unmarshal(data, &s); err != nil {
		return nil, fmt.Errorf("scenario: parse: %w", err)
	}
	if err := s.index(); err != nil {
		return nil, err
	}
	return &s, nil
}

// index builds the lookup maps and checks that every reference resolves. A
// scenario is authored by hand, so a dangling id is the likeliest mistake in
// the file and the one worth failing loudly on at startup.
func (s *Scenario) index() error {
	s.scenes = make(map[string]*Scene, len(s.Scenes))
	s.characters = make(map[string]*Character, len(s.Characters))
	s.evidence = make(map[string]*Evidence, len(s.Evidence))
	s.actions = make(map[string]*Action, len(s.Actions))

	for i := range s.Scenes {
		sc := &s.Scenes[i]
		if err := unique(s.scenes, sc.ID, sc, "scene"); err != nil {
			return err
		}
	}
	for i := range s.Characters {
		c := &s.Characters[i]
		if err := unique(s.characters, c.ID, c, "character"); err != nil {
			return err
		}
	}
	for i := range s.Evidence {
		e := &s.Evidence[i]
		if err := unique(s.evidence, e.ID, e, "evidence"); err != nil {
			return err
		}
	}
	for i := range s.Actions {
		a := &s.Actions[i]
		if err := unique(s.actions, a.ID, a, "action"); err != nil {
			return err
		}
	}
	return s.validate()
}

func unique[T any](into map[string]*T, id string, v *T, kind string) error {
	if id == "" {
		return fmt.Errorf("scenario: a %s has no id", kind)
	}
	if _, dup := into[id]; dup {
		return fmt.Errorf("scenario: duplicate %s id %q", kind, id)
	}
	into[id] = v
	return nil
}

func (s *Scenario) validate() error {
	if s.Title == "" {
		return fmt.Errorf("scenario: no title")
	}
	if len(s.Opening) == 0 || len(s.Incident) == 0 {
		return fmt.Errorf("scenario: opening and incident are both required")
	}
	if _, ok := s.scenes[s.StartScene]; !ok {
		return fmt.Errorf("scenario: start_scene %q is not a scene", s.StartScene)
	}
	if len(s.Misses["default"]) == 0 {
		return fmt.Errorf("scenario: misses needs a %q entry", "default")
	}

	for _, sc := range s.Scenes {
		for _, id := range sc.Characters {
			if _, ok := s.characters[id]; !ok {
				return fmt.Errorf("scenario: scene %q holds unknown character %q", sc.ID, id)
			}
		}
	}

	// "none" is the engine's own option for "this matches nothing", so an
	// action may not take the name.
	for _, a := range s.Actions {
		if a.ID == NoMatch || a.ID == FinaleAction {
			return fmt.Errorf("scenario: action id %q is reserved", a.ID)
		}
		if a.Match.What == "" {
			return fmt.Errorf("scenario: action %q has no match.what", a.ID)
		}
		if a.Did == "" {
			return fmt.Errorf("scenario: action %q has no did", a.ID)
		}
		if len(a.Result) == 0 {
			return fmt.Errorf("scenario: action %q has no result", a.ID)
		}
		if err := s.refs(a.ID, a); err != nil {
			return err
		}
	}

	return s.validateFinale()
}

func (s *Scenario) refs(id string, a Action) error {
	for _, sc := range a.Scenes {
		if _, ok := s.scenes[sc]; !ok {
			return fmt.Errorf("scenario: action %q names unknown scene %q", id, sc)
		}
	}
	for _, e := range append(append([]string{}, a.Gives...), a.Requires.Evidence...) {
		if _, ok := s.evidence[e]; !ok {
			return fmt.Errorf("scenario: action %q names unknown evidence %q", id, e)
		}
	}
	if a.MovesTo != "" {
		if _, ok := s.scenes[a.MovesTo]; !ok {
			return fmt.Errorf("scenario: action %q moves to unknown scene %q", id, a.MovesTo)
		}
	}
	if a.Speaker != "" {
		if _, ok := s.characters[a.Speaker]; !ok {
			return fmt.Errorf("scenario: action %q names unknown speaker %q", id, a.Speaker)
		}
	}
	return nil
}

func (s *Scenario) validateFinale() error {
	f := s.Finale
	if len(f.Suspects) < 2 {
		return fmt.Errorf("scenario: finale needs at least two suspects")
	}
	for _, id := range f.Suspects {
		if _, ok := s.characters[id]; !ok {
			return fmt.Errorf("scenario: finale names unknown suspect %q", id)
		}
	}
	if _, ok := s.characters[f.Culprit]; !ok {
		return fmt.Errorf("scenario: finale culprit %q is not a character", f.Culprit)
	}
	if !contains(f.Suspects, f.Culprit) {
		return fmt.Errorf("scenario: finale culprit %q is not among the suspects", f.Culprit)
	}
	for _, e := range f.RequiresEvidence {
		if _, ok := s.evidence[e]; !ok {
			return fmt.Errorf("scenario: finale requires unknown evidence %q", e)
		}
	}
	if f.Match.What == "" {
		return fmt.Errorf("scenario: finale has no match.what")
	}
	if len(f.Prompt) == 0 {
		return fmt.Errorf("scenario: finale has no prompt")
	}
	if len(f.Truth) == 0 {
		return fmt.Errorf("scenario: finale has no truth to grade against")
	}
	if len(f.Points) == 0 {
		return fmt.Errorf("scenario: finale has no points to grade")
	}
	seen := map[string]bool{}
	for _, p := range f.Points {
		if p.ID == "" || p.Question == "" || p.Label == "" {
			return fmt.Errorf("scenario: finale point %q is incomplete", p.ID)
		}
		if seen[p.ID] {
			return fmt.Errorf("scenario: duplicate finale point %q", p.ID)
		}
		seen[p.ID] = true
	}
	// The API takes between 2 and 10 rubric levels for a score question.
	if n := len(f.CoherenceLevels); n < 2 || n > 10 {
		return fmt.Errorf("scenario: finale needs 2-10 coherence levels, has %d", n)
	}
	if len(f.Endings) == 0 {
		return fmt.Errorf("scenario: finale has no endings")
	}
	// Endings are tested in order and the player always gets one, so the last
	// must be reachable however badly the accusation went.
	last := f.Endings[len(f.Endings)-1]
	if last.RequireCulprit || last.MinPoints > 0 || last.MinCoherence > 0 {
		return fmt.Errorf("scenario: the last ending %q must have no conditions", last.ID)
	}
	return nil
}

// NoMatch is the option name Jev picks when an input asks for none of the
// actions on offer. It is an option like any other rather than a threshold on
// the others: a choice distribution sums to 1, so without somewhere for the
// weight of an unrelated input to go, it lands on whichever action is least
// unlike it.
const NoMatch = "none"

// FinaleAction is the option name for calling everyone together, offered
// alongside the scene's actions once the case is ready for it. It is reserved
// because the engine, not the scenario, decides when it appears.
const FinaleAction = "finale"

// Scene returns a place by id, or nil.
func (s *Scenario) Scene(id string) *Scene { return s.scenes[id] }

// Character returns a person by id, or nil.
func (s *Scenario) Character(id string) *Character { return s.characters[id] }

// Item returns a piece of evidence by id, or nil.
func (s *Scenario) Item(id string) *Evidence { return s.evidence[id] }

// Action returns an action by id, or nil.
func (s *Scenario) Action(id string) *Action { return s.actions[id] }

// Miss returns the text for an input that matched nothing, falling back to the
// default entry for an intent the scenario does not name.
func (s *Scenario) Miss(intent string) []string {
	if text, ok := s.Misses[intent]; ok && len(text) > 0 {
		return text
	}
	return s.Misses["default"]
}

// SuspectNames lists the suspects in scenario order, as name and role, for the
// accusation screen. Which of them did it is not in here.
func (s *Scenario) SuspectNames() []Character {
	out := make([]Character, 0, len(s.Finale.Suspects))
	for _, id := range s.Finale.Suspects {
		if c := s.characters[id]; c != nil {
			out = append(out, *c)
		}
	}
	return out
}

// ActionIDs lists every action id in sorted order. Tests and the tuning CLI
// use it; the engine works from the ones available in a given state.
func (s *Scenario) ActionIDs() []string {
	ids := make([]string, 0, len(s.actions))
	for id := range s.actions {
		ids = append(ids, id)
	}
	sort.Strings(ids)
	return ids
}

func contains(list []string, want string) bool {
	for _, v := range list {
		if v == want {
			return true
		}
	}
	return false
}
