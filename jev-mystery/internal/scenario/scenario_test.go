package scenario

import (
	"encoding/json"
	"testing"
)

func TestBuiltinLoads(t *testing.T) {
	ids := BuiltinIDs()
	if len(ids) == 0 {
		t.Fatal("no cases are compiled into the binary")
	}
	for _, id := range ids {
		if _, err := Builtin(id); err != nil {
			t.Errorf("Builtin(%q): %v", id, err)
		}
	}
}

// The whole of the secrecy guarantee: a response is built with encoding/json,
// and hidden text has no JSON encoding. A handler that embedded any of this
// would fail to encode rather than spoil the case, whatever shape its type had.
func TestHiddenTextCannotBeServed(t *testing.T) {
	s, err := Builtin("clockwork")
	if err != nil {
		t.Fatal(err)
	}
	for name, v := range map[string]any{
		"the solution":            s.Finale.Truth,
		"an option's description": s.Actions[0].Match,
		"a grading question":      s.Finale.Points[0].Question,
		"a whole action":          s.Actions[0],
	} {
		if _, err := json.Marshal(v); err == nil {
			t.Errorf("%s encoded to JSON", name)
		}
	}
}

// A scenario is authored by hand, so a dangling id is the likeliest mistake in
// the file. Each of these is one that would otherwise surface as a nil
// dereference in the middle of somebody's game.
func TestLoadRejects(t *testing.T) {
	base := minimal(t)

	cases := map[string]func(m map[string]any){
		"no start scene": func(m map[string]any) {
			m["start_scene"] = "nowhere"
		},
		"unknown evidence": func(m map[string]any) {
			m["actions"].([]any)[0].(map[string]any)["gives_evidence"] = []any{"nothing"}
		},
		"culprit is not a suspect": func(m map[string]any) {
			finale(m)["culprit"] = "watson"
		},
		// Endings are tested in order and the player always gets one, so an
		// unreachable last ending would leave a finished case with no text.
		"last ending has conditions": func(m map[string]any) {
			finale(m)["endings"].([]any)[0].(map[string]any)["require_culprit"] = true
		},
	}

	for name, break_ := range cases {
		t.Run(name, func(t *testing.T) {
			m := clone(t, base)
			break_(m)
			if _, err := Load(encode(t, m)); err == nil {
				t.Fatal("this scenario should not have loaded")
			}
		})
	}

	if _, err := Load(encode(t, clone(t, base))); err != nil {
		t.Fatalf("the unbroken scenario should load: %v", err)
	}
}

func finale(m map[string]any) map[string]any { return m["finale"].(map[string]any) }

func clone(t *testing.T, m map[string]any) map[string]any {
	t.Helper()
	var out map[string]any
	if err := json.Unmarshal(encode(t, m), &out); err != nil {
		t.Fatal(err)
	}
	return out
}

func encode(t *testing.T, m map[string]any) []byte {
	t.Helper()
	data, err := json.Marshal(m)
	if err != nil {
		t.Fatal(err)
	}
	return data
}

func minimal(t *testing.T) map[string]any {
	t.Helper()
	const src = `{
  "id": "test", "title": "T",
  "opening": ["o"], "incident": ["i"],
  "start_scene": "room",
  "scenes": [{"id": "room", "name": "Room", "description": ["d"], "characters": ["holmes"]}],
  "characters": [
    {"id": "holmes", "name": "H", "role": "r", "avatar": "a"},
    {"id": "moriarty", "name": "M", "role": "r", "avatar": "a"}
  ],
  "evidence": [{"id": "pipe", "name": "P", "description": "d"}],
  "actions": [{
    "id": "look", "match": {"what": "look"}, "did": "looked", "result": ["nothing"]
  }],
  "misses": {"default": ["nothing happens"]},
  "finale": {
    "label": "gather", "match": {"what": "gather"}, "prompt": ["who?"],
    "truth": ["moriarty did it"],
    "suspects": ["holmes", "moriarty"], "culprit": "moriarty",
    "points": [{"id": "how", "label": "how", "question": "did they say how?"}],
    "coherence_levels": ["bad", "good"],
    "endings": [{"id": "end", "title": "E", "text": ["fin"]}]
  }
}`
	var m map[string]any
	if err := json.Unmarshal([]byte(src), &m); err != nil {
		t.Fatal(err)
	}
	return m
}
