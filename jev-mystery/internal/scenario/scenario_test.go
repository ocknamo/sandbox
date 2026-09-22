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
		if _, err := Builtin(id); err != nil {
			t.Errorf("Builtin(%q): %v", id, err)
		}
	}
}

// Flavour describes itself to the model the same way an action does, so it is
// a spoiler in the same way and carries the same type.
func TestFlavourDescriptionsCannotBeServed(t *testing.T) {
	s, err := Builtin("yakata")
	if err != nil {
		t.Fatal(err)
	}
	if len(s.Flavours) == 0 {
		t.Fatal("the case has no flavour to check")
	}
	if _, err := json.Marshal(s.Flavours[0]); err == nil {
		t.Error("a flavour entry encoded to JSON")
	}
}

// The whole of the secrecy guarantee: a response is built with encoding/json,
// and hidden text has no JSON encoding. A handler that embedded any of this
// would fail to encode rather than spoil the case, whatever shape its type had.
func TestHiddenTextCannotBeServed(t *testing.T) {
	s, err := Builtin("yakata")
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
		// A case whose answer is more than one name still names them from the
		// suspects, and never names the same person twice.
		"another culprit is not a suspect": func(m map[string]any) {
			finale(m)["also_culprit"] = []any{"watson"}
		},
		"another culprit is the culprit": func(m map[string]any) {
			finale(m)["also_culprit"] = []any{"moriarty"}
		},
		// Endings are tested in order and the player always gets one, so an
		// unreachable last ending would leave a finished case with no text.
		"last ending has conditions": func(m map[string]any) {
			finale(m)["endings"].([]any)[0].(map[string]any)["require_culprit"] = true
		},
		// Flavour is matched by a question of its own, so nothing would break
		// if it shared a name with an action — but a case is read by a person,
		// and two entries with one name is a mistake wherever it happens.
		"flavour shares an action's id": func(m map[string]any) {
			m["flavours"] = []any{map[string]any{
				"id": "look", "match": map[string]any{"what": "listen"}, "text": []any{"rain"},
			}}
		},
		"flavour with nothing to say": func(m map[string]any) {
			m["flavours"] = []any{map[string]any{
				"id": "rain", "match": map[string]any{"what": "listen"},
			}}
		},
		"flavour in a scene that does not exist": func(m map[string]any) {
			m["flavours"] = []any{map[string]any{
				"id": "rain", "scenes": []any{"nowhere"},
				"match": map[string]any{"what": "listen"}, "text": []any{"rain"},
			}}
		},
		// The glyph is the fallback behind every portrait, so a character
		// without one has nothing to draw while the picture loads.
		"character with no avatar": func(m map[string]any) {
			character(m, "holmes")["avatar"] = ""
		},
		// A portrait is a URL the browser fetches, so only the schemes that
		// name a picture are allowed through.
		"portrait is a data url": func(m map[string]any) {
			character(m, "holmes")["image"] = "data:image/svg+xml,<svg onload=\"alert(1)\"/>"
		},
		"portrait is a script url": func(m map[string]any) {
			character(m, "holmes")["image"] = "javascript:alert(1)"
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

// A case may answer with more than one name — three suspects who turn out to
// be one creature — and the grader has one name to work with, so any of the
// guilty has to count as having named the culprit.
func TestBlamesTakesEveryCulprit(t *testing.T) {
	m := clone(t, minimal(t))
	finale(m)["also_culprit"] = []any{"holmes"}
	s, err := Load(encode(t, m))
	if err != nil {
		t.Fatal(err)
	}
	for _, id := range []string{"moriarty", "holmes"} {
		if !s.Finale.Blames(id) {
			t.Errorf("naming %q does not count as naming the culprit", id)
		}
	}
	if s.Finale.Blames("") || s.Finale.Blames("watson") {
		t.Error("someone outside the case counts as the culprit")
	}
}

// A portrait is optional, and what a case is allowed to put there is an
// absolute http(s) URL or a path the page resolves for itself.
func TestLoadTakesPortraits(t *testing.T) {
	for _, image := range []string{
		"https://example.test/holmes.png",
		"http://example.test/holmes.png",
		"/portraits/holmes.png",
		"portraits/holmes.png",
		"./portraits/holmes.png",
		"portraits/holmes:1.png",
	} {
		t.Run(image, func(t *testing.T) {
			m := clone(t, minimal(t))
			character(m, "holmes")["image"] = image
			s, err := Load(encode(t, m))
			if err != nil {
				t.Fatalf("Load: %v", err)
			}
			if got := s.Character("holmes").Image; got != image {
				t.Errorf("image = %q, want %q", got, image)
			}
		})
	}
}

// The portrait reaches the page; the glyph behind it does too, because it is
// what the page draws until the picture arrives.
func TestPortraitIsServed(t *testing.T) {
	m := clone(t, minimal(t))
	character(m, "holmes")["image"] = "https://example.test/holmes.png"
	s, err := Load(encode(t, m))
	if err != nil {
		t.Fatal(err)
	}
	data, err := json.Marshal(s.Character("holmes"))
	if err != nil {
		t.Fatal(err)
	}
	for _, want := range []string{`"image":"https://example.test/holmes.png"`, `"avatar":"a"`} {
		if !strings.Contains(string(data), want) {
			t.Errorf("character encoded to %s, want it to hold %s", data, want)
		}
	}
}

func character(m map[string]any, id string) map[string]any {
	for _, c := range m["characters"].([]any) {
		c := c.(map[string]any)
		if c["id"] == id {
			return c
		}
	}
	panic("no character " + id)
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
