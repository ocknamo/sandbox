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
// browser except the pieces the engine explicitly reveals. The parts that
// would spoil the case carry the Hidden type, which cannot be encoded to JSON
// at all.
package scenario

import (
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"strings"
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

	// Flavour is prose the case does not turn on: the rain, a photograph, a
	// look at somebody's hands. It is matched separately from the actions and
	// after them, so it never competes with a real action for the vote, and
	// it changes nothing — which is what makes it safe to write a lot of.
	Flavours []Flavour `json:"flavours,omitempty"`

	// Interludes are prose the case volunteers on its own, once, on the turn
	// its conditions first hold: the detective stopping to notice that the
	// pieces now on the table do not fit. Nothing asks for them, so nothing
	// has to match them.
	Interludes []Interlude `json:"interludes,omitempty"`

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
	flavour    map[string]*Flavour
	interlude  map[string]*Interlude
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

	// Avatar is a single glyph used as a portrait, and the fallback whenever
	// Image is empty or fails to load. It is a person: the panel it sits in is
	// a row of faces, and an object among them reads as a missing face rather
	// than as a character.
	Avatar string `json:"avatar"`

	// Image is a portrait to draw instead of the glyph — an absolute URL, or a
	// path relative to the service, which is where the pictures a case ships
	// with are served from (see PortraitPrefix). It is optional, and
	// deliberately so: a case is playable written with nothing but glyphs, and
	// a picture that fails to load falls back to one.
	Image string `json:"image,omitempty"`

	// Closed makes this person answerable with yes, no or "I don't know". A
	// character without it takes only the questions written as actions.
	Closed *Closed `json:"closed,omitempty"`
}

// Closed is what a character brings to a yes-or-no question: what they know,
// what they will not admit, and the words they answer in.
//
// Knows and Hides are instructions to the model rather than state, because
// they are about this person rather than about the case: two people looking at
// the same events answer differently, and that difference is the whole point
// of asking one of them rather than the other.
type Closed struct {
	// Knows is what this person has seen, done or been told. Anything outside
	// it they cannot answer, whatever the case's plot says.
	Knows []Hidden `json:"knows"`

	// Hides is what they will not say even though they know it — the culprit's
	// own guilt being the obvious case. Asked directly, they deny it.
	Hides []Hidden `json:"hides,omitempty"`

	// Answers are the words they say. They are the only part of this the
	// player reads, so they are written rather than generated; left out, the
	// bare Japanese for yes, no and "I don't know" is used.
	Answers ClosedAnswers `json:"answers,omitempty"`
}

// ClosedAnswers are one character's three replies.
type ClosedAnswers struct {
	Yes     string `json:"yes,omitempty"`
	No      string `json:"no,omitempty"`
	Unknown string `json:"unknown,omitempty"`
}

// Say returns the character's wording for one of the three answers, falling
// back to the plain word.
func (c ClosedAnswers) Say(answer string) string {
	switch answer {
	case AnswerYes:
		if c.Yes != "" {
			return c.Yes
		}
		return "はい。"
	case AnswerNo:
		if c.No != "" {
			return c.No
		}
		return "いいえ。"
	default:
		if c.Unknown != "" {
			return c.Unknown
		}
		return "わかりません。"
	}
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

// Hidden is text the player must never be served: the solution, and the
// descriptions that tell the model what an action is for.
//
// It reads from JSON like any other string and refuses to be written back, so
// a response that tried to carry one fails to encode instead of spoiling the
// case. Handing it to the model means calling Plain, which is the one place
// the laundering is visible and the only place it belongs.
type Hidden string

// MarshalJSON refuses. A player-facing response is built with encoding/json,
// which makes this the whole of the guarantee: hidden text cannot reach a
// browser by being embedded in a response type, however that type is shaped.
func (Hidden) MarshalJSON() ([]byte, error) {
	return nil, errors.New("scenario: hidden text cannot be served to a player")
}

// Plain unwraps hidden text for a request to the model. Jev answers with typed
// values and never with text, so the solution goes in and only numbers come
// back; nothing else may call this.
func Plain(lines []Hidden) []string {
	out := make([]string, 0, len(lines))
	for _, line := range lines {
		out = append(out, string(line))
	}
	return out
}

// Match is how an action describes itself to Jev. It is the structured form of
// a choice option: saying what an action is NOT for separates it from its
// neighbours better than any amount of saying what it is, which matters here
// because a choice distribution sums to 1 and two overlapping options split
// the vote between them.
type Match struct {
	What     Hidden   `json:"what"`
	NotFor   Hidden   `json:"not_for,omitempty"`
	Examples []Hidden `json:"examples,omitempty"`
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

// Flavour is something to notice that the case does not turn on: the rain on
// the roof, a photograph on a shelf, the way somebody is holding their hands.
//
// It exists because the thin part of this game is the space between an action
// and a miss. A player who types something reasonable and reads "何も起こらない"
// learns nothing, and learns it repeatedly. Flavour is the middle: the world
// answers, and the state does not move.
//
// It is deliberately not an Action with no effects. An action competes for the
// vote in the routing question, and a scene carrying twenty of these would
// split the distribution until nothing could clear the threshold. Flavour is
// asked in a question of its own, and only once the actions have all missed.
type Flavour struct {
	ID string `json:"id"`

	// Scenes and Requires gate it exactly as they gate an action, so a case
	// can hold prose that only appears once the player knows enough to see it.
	Scenes   []string `json:"scenes,omitempty"`
	Requires Requires `json:"requires,omitempty"`

	Match Match `json:"match"`

	// Speaker is whose portrait the lines are shown under, when the flavour is
	// somebody saying something offhand.
	Speaker string `json:"speaker,omitempty"`

	// Did is optional here, unlike on an action: noticing something is not
	// always an act worth naming.
	Did  string   `json:"did,omitempty"`
	Text []string `json:"text"`
}

// Interlude is something the case says without being asked, the first time
// the player has done enough for it to be worth saying.
//
// It is the one kind of prose that is not an answer to an input. An action or
// a flavour entry waits for the player to reach for it; an interlude arrives
// after a turn that happened to complete its requirements — the third witness
// heard, say — and is appended to that turn. It is read once and never again,
// and it changes nothing but the record that it has been read.
type Interlude struct {
	ID       string   `json:"id"`
	Requires Requires `json:"requires"`
	Text     []string `json:"text"`
}

// Point is one element of the truth the player's accusation is graded on. Each
// becomes a noul: a narrow yes/no about the text the player wrote.
type Point struct {
	ID    string `json:"id"`
	Label string `json:"label"`

	// Question is the instruction put to Jev, phrased about the accusation and
	// answerable from the truth the model is handed alongside it. It names the
	// element it is looking for, so it is as much of a spoiler as the truth.
	Question Hidden `json:"question"`
}

// Ending is one way the case can close. Endings are tested in file order and
// the first whose conditions are met is the one the player gets, so the last
// entry has to be reachable with nothing satisfied.
type Ending struct {
	ID string `json:"id"`

	RequireCulprit bool    `json:"require_culprit,omitempty"`
	MinPoints      int     `json:"min_points,omitempty"`
	MinCoherence   float64 `json:"min_coherence,omitempty"`

	// RequirePoints names the elements of the truth this ending cannot be had
	// without. MinPoints counts; this picks. A case whose heart is one or two
	// realisations can ask for exactly those, and let the rest of the points
	// decide only the endings below.
	RequirePoints []string `json:"require_points,omitempty"`

	Title string   `json:"title"`
	Text  []string `json:"text"`

	// Celebrate marks an ending as a win, so the page can say so. The case
	// decides which of its endings count as solving it: the engine grades,
	// and only the scenario knows whether a given ending is worth cheering.
	Celebrate bool `json:"celebrate,omitempty"`

	// Complete marks the ending that counts as solving the case outright, so
	// the page can say 完全解決 rather than 事件解決. It is the case's call
	// for the same reason Celebrate is: what "the whole of it" means differs
	// from case to case, and need not be every point on the scorecard.
	Complete bool `json:"complete,omitempty"`
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
	// against. It is safe to send there and nowhere else: Jev returns typed
	// values and no text, so there is no channel through which it could leak
	// back to the player.
	Truth []Hidden `json:"truth"`

	Suspects []string `json:"suspects"`
	Culprit  string   `json:"culprit"`

	// AlsoCulprit names the other people an accusation may name and still be
	// right. It is for a case whose answer is not one person — two who did it
	// together, or three who turn out to be one — where the grader must still
	// return a single name, because a choice returns one option. Naming any of
	// them counts as naming the culprit; nothing else about them changes.
	AlsoCulprit []string `json:"also_culprit,omitempty"`

	Points []Point `json:"points"`

	// CoherenceLevels is the rubric for how well the accusation hangs together
	// as an argument, lowest level first. Between 2 and 10 of them.
	CoherenceLevels []string `json:"coherence_levels"`

	Endings []Ending `json:"endings"`

	// Hints are offered, one at a time and in order, to a player whose
	// accusation missed. They are the case's own way out for a player who has
	// gathered everyone and is stuck: the author knows where the case is hard,
	// and the engine does not. They are never sent before an accusation has
	// been graded, so a player who solves the case never sees them.
	Hints []string `json:"hints,omitempty"`
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
	s.flavour = make(map[string]*Flavour, len(s.Flavours))
	s.interlude = make(map[string]*Interlude, len(s.Interludes))

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
	for i := range s.Flavours {
		f := &s.Flavours[i]
		if err := unique(s.flavour, f.ID, f, "flavour"); err != nil {
			return err
		}
	}
	for i := range s.Interludes {
		in := &s.Interludes[i]
		if err := unique(s.interlude, in.ID, in, "interlude"); err != nil {
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

	// A person who answers nothing would answer every question "I don't know",
	// which reads as a bug rather than as a closed mouth.
	for _, c := range s.Characters {
		if c.Closed != nil && len(c.Closed.Knows) == 0 {
			return fmt.Errorf("scenario: character %q takes closed questions but knows nothing", c.ID)
		}

		// The glyph is required even when there is a picture, because it is
		// what the page draws while the picture loads and what it falls back
		// to when the picture never arrives.
		if c.Avatar == "" {
			return fmt.Errorf("scenario: character %q has no avatar", c.ID)
		}
		if err := checkImage(c.ID, c.Image); err != nil {
			return err
		}
	}

	// "none" is the engine's own option for "this matches nothing", so an
	// action may not take the name.
	for _, a := range s.Actions {
		if a.ID == NoMatch || a.ID == FinaleAction ||
			strings.HasPrefix(a.ID, ClosedPrefix) || strings.HasPrefix(a.ID, FlavourPrefix) {
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

	// Flavour shares the id space with the actions. Nothing in the engine
	// needs it to — the two are matched by separate questions — but a case is
	// written by hand and read by a person, and two entries with one name is a
	// mistake whichever list they are in.
	for _, f := range s.Flavours {
		if f.ID == NoMatch || f.ID == FinaleAction ||
			strings.HasPrefix(f.ID, ClosedPrefix) || strings.HasPrefix(f.ID, FlavourPrefix) {
			return fmt.Errorf("scenario: flavour id %q is reserved", f.ID)
		}
		if _, clash := s.actions[f.ID]; clash {
			return fmt.Errorf("scenario: flavour %q has the same id as an action", f.ID)
		}
		if f.Match.What == "" {
			return fmt.Errorf("scenario: flavour %q has no match.what", f.ID)
		}
		if len(f.Text) == 0 {
			return fmt.Errorf("scenario: flavour %q has no text", f.ID)
		}
		if err := s.refs(f.ID, Action{
			Scenes: f.Scenes, Requires: f.Requires, Speaker: f.Speaker,
		}); err != nil {
			return err
		}
	}

	// An interlude with no requirements would fire on the first action of
	// every game, which is what the opening is for.
	for _, in := range s.Interludes {
		if len(in.Text) == 0 {
			return fmt.Errorf("scenario: interlude %q has no text", in.ID)
		}
		r := in.Requires
		if len(r.Evidence) == 0 && len(r.Flags) == 0 && len(r.NotFlags) == 0 {
			return fmt.Errorf("scenario: interlude %q requires nothing", in.ID)
		}
		if err := s.refs(in.ID, Action{Requires: r}); err != nil {
			return err
		}
	}

	return s.validateFinale()
}

// checkImage rejects a portrait the page could not draw. A picture is fetched
// by the browser from whatever this says, so the schemes are the two that name
// a picture — http and https — and anything without a scheme is taken as a
// path relative to the service. Everything else, `data:` and `javascript:`
// among them, is a way of putting something other than a picture on the
// screen.
func checkImage(id, image string) error {
	if image == "" {
		return nil
	}
	if strings.HasPrefix(image, "http://") || strings.HasPrefix(image, "https://") {
		return nil
	}
	// A scheme is a run of letters, digits, `+`, `-` or `.` before the first
	// colon. A path holding a colon later on (`a/b:c`) is still a path.
	if i := strings.IndexByte(image, ':'); i >= 0 {
		scheme := image[:i]
		if scheme != "" && strings.IndexFunc(scheme, func(r rune) bool {
			return !(r >= 'a' && r <= 'z' || r >= 'A' && r <= 'Z' ||
				r >= '0' && r <= '9' || r == '+' || r == '-' || r == '.')
		}) < 0 {
			return fmt.Errorf("scenario: character %q has image %q: only http, https and relative paths are allowed", id, image)
		}
	}
	return nil
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
	for _, id := range f.AlsoCulprit {
		if id == f.Culprit {
			return fmt.Errorf("scenario: finale names %q as culprit twice", id)
		}
		if !contains(f.Suspects, id) {
			return fmt.Errorf("scenario: finale also_culprit %q is not among the suspects", id)
		}
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
	for _, end := range f.Endings {
		for _, id := range end.RequirePoints {
			if !seen[id] {
				return fmt.Errorf("scenario: ending %q requires unknown point %q", end.ID, id)
			}
		}
		if end.Complete && !end.Celebrate {
			return fmt.Errorf("scenario: ending %q is complete but not celebrated", end.ID)
		}
	}
	last := f.Endings[len(f.Endings)-1]
	if last.RequireCulprit || last.MinPoints > 0 || last.MinCoherence > 0 || len(last.RequirePoints) > 0 {
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

// The three answers a closed question can get. They are the whole of what the
// player is told: a yes is a yes, and nothing says whether it was the truth.
const (
	AnswerYes     = "yes"
	AnswerNo      = "no"
	AnswerUnknown = "unknown"
)

// ClosedPrefix marks the option, and the question, for putting a yes-or-no
// question to one person: `closed:kurata`. An action may not take a name that
// starts with it, since the engine mints these itself from whoever is in the
// room.
const ClosedPrefix = "closed:"

// FlavourPrefix marks a turn that landed on flavour rather than on an action:
// `flavour:rain`. It never appears in a scenario file — the engine puts it on
// the id when it reports what a turn matched — but an action or a flavour
// entry may not take a name that starts with it, so that the tuning CLI's
// tally can name either kind without ambiguity.
const FlavourPrefix = "flavour:"

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

// Flavour returns a flavour entry by id, or nil.
func (s *Scenario) Flavour(id string) *Flavour { return s.flavour[id] }

// Miss returns the text for an input that matched nothing, falling back to the
// default entry for an intent the scenario does not name.
func (s *Scenario) Miss(intent string) []string {
	if text, ok := s.Misses[intent]; ok && len(text) > 0 {
		return text
	}
	return s.Misses["default"]
}

// Blames says whether naming this person counts as naming the culprit. It is
// how the grader decides a case whose answer is more than one name: the
// accusation still settles on one person, and any of the guilty will do.
func (f Finale) Blames(id string) bool {
	return id != "" && (id == f.Culprit || contains(f.AlsoCulprit, id))
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
