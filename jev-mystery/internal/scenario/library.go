package scenario

import (
	"fmt"
	"sort"
)

// Summary is a case as a player may see it before starting: enough to choose
// between cases, and nothing that would spoil one.
type Summary struct {
	ID     string `json:"id"`
	Title  string `json:"title"`
	Byline string `json:"byline,omitempty"`
}

// Library is every case the service can serve, held by id. One process serves
// them all: a case is a few kilobytes of prose, and which one is being played
// belongs in the URL rather than in a deployment.
type Library struct {
	cases map[string]*Scenario
	order []string
}

// Builtins loads every case compiled into the binary.
func Builtins() (*Library, error) {
	ids := BuiltinIDs()
	if len(ids) == 0 {
		return nil, fmt.Errorf("scenario: no cases are compiled in")
	}
	lib := &Library{cases: make(map[string]*Scenario, len(ids))}
	for _, id := range ids {
		s, err := Builtin(id)
		if err != nil {
			return nil, err
		}
		lib.cases[id] = s
		lib.order = append(lib.order, id)
	}
	sort.Strings(lib.order)
	return lib, nil
}

// NewLibrary builds a library from already-loaded cases, for tests.
func NewLibrary(cases ...*Scenario) *Library {
	lib := &Library{cases: make(map[string]*Scenario, len(cases))}
	for _, s := range cases {
		lib.cases[s.ID] = s
		lib.order = append(lib.order, s.ID)
	}
	sort.Strings(lib.order)
	return lib
}

// Case returns one case by id, or nil.
func (l *Library) Case(id string) *Scenario { return l.cases[id] }

// List summarises every case, in id order.
func (l *Library) List() []Summary {
	out := make([]Summary, 0, len(l.order))
	for _, id := range l.order {
		s := l.cases[id]
		out = append(out, Summary{ID: s.ID, Title: s.Title, Byline: s.Byline})
	}
	return out
}

// Len is how many cases the library holds.
func (l *Library) Len() int { return len(l.cases) }
