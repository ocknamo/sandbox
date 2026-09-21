package scenario

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestBuiltinLoads(t *testing.T) {
	ids := BuiltinIDs()
	if len(ids) == 0 {
		t.Fatal("no cases are compiled into the binary")
	}
	for _, id := range ids {
		s, err := Builtin(id)
		if err != nil {
			t.Fatalf("Builtin(%q): %v", id, err)
		}
		if s.Scene(s.StartScene) == nil {
			t.Errorf("%s: start scene is missing", id)
		}
		if len(s.Finale.Points) == 0 {
			t.Errorf("%s: nothing to grade an accusation on", id)
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
		"unknown speaker": func(m map[string]any) {
			m["actions"].([]any)[0].(map[string]any)["speaker"] = "ghost"
		},
		"unknown evidence": func(m map[string]any) {
			m["actions"].([]any)[0].(map[string]any)["gives_evidence"] = []any{"nothing"}
		},
		"reserved action id": func(m map[string]any) {
			m["actions"].([]any)[0].(map[string]any)["id"] = NoMatch
		},
		"culprit is not a suspect": func(m map[string]any) {
			finale(m)["culprit"] = "watson"
		},
		"no default miss": func(m map[string]any) {
			m["misses"] = map[string]any{"move": []any{"no"}}
		},
		"last ending has conditions": func(m map[string]any) {
			finale(m)["endings"].([]any)[0].(map[string]any)["require_culprit"] = true
		},
		"too few coherence levels": func(m map[string]any) {
			finale(m)["coherence_levels"] = []any{"only one"}
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

func TestMissFallsBackToDefault(t *testing.T) {
	s, err := Builtin("clockwork")
	if err != nil {
		t.Fatal(err)
	}
	if got := s.Miss("a intent nobody wrote"); len(got) == 0 {
		t.Fatal("an unknown intent should still say something")
	}
	if got := strings.Join(s.Miss("move"), ""); got == "" {
		t.Fatal("the move miss is empty")
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
