package faq

import (
	"strings"
	"testing"
	"testing/fstest"
)

func TestBuiltinLoads(t *testing.T) {
	c, err := Builtin()
	if err != nil {
		t.Fatalf("Builtin: %v", err)
	}
	if got := len(c.Categories); got != 12 {
		t.Errorf("categories = %d, want 12", got)
	}
	if got := c.Len(); got != 426 {
		t.Errorf("questions = %d, want 426", got)
	}
	q := c.Question("1-1")
	if q == nil || q.Category.ID != "basics" || q.Title != "ビットコインとは何ですか？" {
		t.Fatalf("1-1 = %+v", q)
	}
	if c.ByKey("q11_26") != c.Question("11-26") {
		t.Error("keys and IDs do not name the same question")
	}
	// The table's order is kept: it is the order a reader browses in.
	if first := c.Category("lightning").Questions[0].ID; first != "8-1" {
		t.Errorf("first lightning question = %s, want 8-1", first)
	}
}

const cats = `[
  {"id": "a", "number": 1, "name": "A", "match": {"what": "a things"}},
  {"id": "b", "number": 2, "name": "B", "match": {"what": "b things"}}
]`

const table = "番号\tカテゴリ\t質問\n1-1\tA\tone?\n1-2\tA\ttwo?\n2-1\tB\tthree?\n"

func corpus(t *testing.T, files map[string]string) (*Corpus, error) {
	t.Helper()
	fsys := fstest.MapFS{
		"categories.json": {Data: []byte(cats)},
		"questions.tsv":   {Data: []byte(table)},
	}
	for name, body := range files {
		fsys[name] = &fstest.MapFile{Data: []byte(body)}
	}
	return Load(fsys)
}

func TestAnswersParse(t *testing.T) {
	c, err := corpus(t, map[string]string{
		"answers/README.md": "## 9-9\n\nThe README is a note to writers, not an answer.\n",
		"answers/a.md": `Notes above the first section are ignored.

## 1-1

First paragraph
keeps its line break.

Second.

<!-- more -->

Deeper.

関連: 1-2、2-1
出典: https://example.com/a
出典: https://example.com/b
更新: 2026-09-26
タグ: 誤前提・時点依存
`,
	})
	if err != nil {
		t.Fatalf("Load: %v", err)
	}
	q := c.Question("1-1")
	if want := []string{"First paragraph\nkeeps its line break.", "Second."}; strings.Join(q.Answer, "|") != strings.Join(want, "|") {
		t.Errorf("answer = %q", q.Answer)
	}
	if len(q.More) != 1 || q.More[0] != "Deeper." {
		t.Errorf("more = %q", q.More)
	}
	if strings.Join(q.Related, ",") != "1-2,2-1" {
		t.Errorf("related = %q", q.Related)
	}
	if len(q.Sources) != 2 || q.Updated != "2026-09-26" {
		t.Errorf("sources = %q, updated = %q", q.Sources, q.Updated)
	}
	if strings.Join(q.Tags, ",") != "誤前提,時点依存" {
		t.Errorf("tags = %q", q.Tags)
	}
	if !q.Answered() || c.Question("1-2").Answered() {
		t.Error("only 1-1 should count as answered")
	}
	if c.Answered() != 1 {
		t.Errorf("Answered() = %d, want 1", c.Answered())
	}
}

func TestLoadRejects(t *testing.T) {
	for name, files := range map[string]map[string]string{
		"unknown question":  {"answers/a.md": "## 3-1\n\ntext\n"},
		"answered twice":    {"answers/a.md": "## 1-1\n\ntext\n", "answers/b.md": "## 1-1\n\nagain\n"},
		"dangling related":  {"answers/a.md": "## 1-1\n\ntext\n\n関連: 1-9\n"},
		"only more":         {"answers/a.md": "## 1-1\n\n<!-- more -->\n\ndeeper\n"},
		"bad heading":       {"answers/a.md": "## one\n\ntext\n"},
		"no sections":       {"answers/a.md": "just prose\n"},
		"wrong category":    {"questions.tsv": "番号\tカテゴリ\t質問\n2-1\tA\tmisfiled?\n1-1\tA\ta\n2-2\tB\tb\n"},
		"duplicate number":  {"questions.tsv": "番号\tカテゴリ\t質問\n1-1\tA\ta\n1-1\tA\tb\n2-1\tB\tc\n"},
		"unknown category":  {"questions.tsv": "番号\tカテゴリ\t質問\n1-1\tA\ta\n2-1\tC\tc\n"},
		"empty category":    {"questions.tsv": "番号\tカテゴリ\t質問\n1-1\tA\ta\n"},
		"missing column":    {"questions.tsv": "番号\tカテゴリ\t質問\n1-1\tA\n"},
		"reserved category": {"categories.json": `[{"id": "none", "number": 1, "name": "A", "match": {"what": "x"}}]`},
	} {
		t.Run(name, func(t *testing.T) {
			if _, err := corpus(t, files); err == nil {
				t.Error("Load succeeded; want an error")
			}
		})
	}
}
