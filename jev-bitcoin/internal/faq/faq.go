// Package faq is the corpus: the categories, the questions, and the answers
// prepared for them.
//
// Nothing a reader sees is written by the model. Jev only says which prepared
// question an input is asking; the answer shown is whatever was prepared
// here. That is the point of the service: on a topic where a confident wrong
// sentence about keys or supply does real damage, every answer is something
// that can be reviewed in a pull request.
//
// The corpus has three sources, all embedded in the binary:
//
//   - data/categories.json — the shelves, and how the model tells them apart
//   - data/questions.tsv   — every question, verbatim as it was handed over
//   - data/answers/*.md    — the answers, one "## <番号>" section per question
//
// Questions and answers live in separate files on purpose. The question table
// is the thing that was specified; the answers arrive later, section by
// section, and a question without one is still routable — it answers with
// "being prepared" rather than not existing.
package faq

import (
	"bufio"
	"embed"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"path"
	"regexp"
	"sort"
	"strconv"
	"strings"
)

// NoMatch is the option every choice carries for "none of these". It is
// reserved: no category or question may use it as an ID.
const NoMatch = "none"

// MaxPerCategory is how many questions one category may hold. A choice takes
// at most 255 options and each category's choice also carries NoMatch.
const MaxPerCategory = 254

// Match describes a category to the model. It is never sent to a reader; it
// is only how the model tells one shelf from another.
type Match struct {
	What     string   `json:"what"`
	NotFor   string   `json:"not_for,omitempty"`
	Examples []string `json:"examples,omitempty"`
}

// Category is one shelf of questions.
type Category struct {
	ID     string `json:"id"`
	Number int    `json:"number"`
	Name   string `json:"name"`
	Match  Match  `json:"match"`

	Questions []*Question `json:"-"`
}

// Question is one prepared question and, once somebody has written it, its
// answer.
type Question struct {
	// ID is the number from the question table, such as "1-1". It is also
	// the page's permalink: #1-1.
	ID       string
	Category *Category

	// Title is the question as it was written in the table. It is what the
	// model matches against and what a reader is shown as "the question this
	// answers".
	Title string

	// Answer is the short answer, and More what sits behind "もっと詳しく".
	// Both are empty until the answer file has a section for this question.
	Answer  []string
	More    []string
	Related []string
	Sources []string
	Updated string

	// Tags say what kind of fact the answer rests on: 時点依存 (it changes
	// with time), 研究提案 (a proposal, not the current rules), 誤前提 (the
	// question assumes something false), and so on. The page turns some of
	// them into a note under the answer.
	Tags []string
}

// Answered reports whether anybody has written this question's answer yet.
func (q *Question) Answered() bool { return len(q.Answer) > 0 }

// Key is the option name the question goes by inside its category's choice.
// The table's "1-1" is turned into "q1_1" so the key is a plain identifier.
func (q *Question) Key() string { return "q" + strings.ReplaceAll(q.ID, "-", "_") }

// Corpus is the whole of what the service can answer.
type Corpus struct {
	Categories []*Category

	byID  map[string]*Question
	byKey map[string]*Question
	byCat map[string]*Category
}

// Question looks a question up by its table number.
func (c *Corpus) Question(id string) *Question { return c.byID[id] }

// ByKey looks a question up by its option name.
func (c *Corpus) ByKey(key string) *Question { return c.byKey[key] }

// Category looks a category up by its ID.
func (c *Corpus) Category(id string) *Category { return c.byCat[id] }

// Len is the number of questions.
func (c *Corpus) Len() int { return len(c.byID) }

// Answered is how many questions have an answer written.
func (c *Corpus) Answered() int {
	n := 0
	for _, q := range c.byID {
		if q.Answered() {
			n++
		}
	}
	return n
}

//go:embed data
var data embed.FS

// Builtin loads the embedded corpus. A broken corpus fails here, which the
// server turns into a failed startup rather than one reader's broken answer.
func Builtin() (*Corpus, error) {
	sub, err := fs.Sub(data, "data")
	if err != nil {
		return nil, err
	}
	return Load(sub)
}

// Load reads a corpus laid out the way data/ is.
func Load(fsys fs.FS) (*Corpus, error) {
	rawCats, err := fs.ReadFile(fsys, "categories.json")
	if err != nil {
		return nil, err
	}
	var cats []*Category
	if err := json.Unmarshal(rawCats, &cats); err != nil {
		return nil, fmt.Errorf("categories.json: %w", err)
	}

	c := &Corpus{
		Categories: cats,
		byID:       map[string]*Question{},
		byKey:      map[string]*Question{},
		byCat:      map[string]*Category{},
	}
	byName := map[string]*Category{}
	byNumber := map[int]*Category{}
	for _, cat := range cats {
		switch {
		case cat.ID == "" || cat.Name == "" || cat.Match.What == "":
			return nil, fmt.Errorf("category %q: id, name and match.what are required", cat.ID)
		case cat.ID == NoMatch:
			return nil, fmt.Errorf("category id %q is reserved", NoMatch)
		case c.byCat[cat.ID] != nil:
			return nil, fmt.Errorf("category %q is listed twice", cat.ID)
		case byName[cat.Name] != nil:
			return nil, fmt.Errorf("category name %q is listed twice", cat.Name)
		case byNumber[cat.Number] != nil:
			return nil, fmt.Errorf("category number %d is listed twice", cat.Number)
		}
		c.byCat[cat.ID], byName[cat.Name], byNumber[cat.Number] = cat, cat, cat
	}

	if err := c.readQuestions(fsys, byName); err != nil {
		return nil, fmt.Errorf("questions.tsv: %w", err)
	}
	for _, cat := range cats {
		if len(cat.Questions) == 0 {
			return nil, fmt.Errorf("category %q has no questions", cat.ID)
		}
		if len(cat.Questions) > MaxPerCategory {
			return nil, fmt.Errorf("category %q has %d questions; a choice holds at most %d besides %q",
				cat.ID, len(cat.Questions), MaxPerCategory, NoMatch)
		}
	}

	if err := c.readAnswers(fsys); err != nil {
		return nil, err
	}
	for _, q := range c.byID {
		for _, r := range q.Related {
			if c.byID[r] == nil {
				return nil, fmt.Errorf("answer %s: related question %q does not exist", q.ID, r)
			}
		}
	}
	return c, nil
}

// idPattern is the table's numbering: category number, a hyphen, position.
var idPattern = regexp.MustCompile(`^([1-9][0-9]*)-([1-9][0-9]*)$`)

func (c *Corpus) readQuestions(fsys fs.FS, byName map[string]*Category) error {
	f, err := fsys.Open("questions.tsv")
	if err != nil {
		return err
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	for line := 1; scanner.Scan(); line++ {
		text := strings.TrimRight(scanner.Text(), "\r")
		if line == 1 || strings.TrimSpace(text) == "" {
			continue // the header, and blank lines
		}
		cols := strings.Split(text, "\t")
		if len(cols) != 3 {
			return fmt.Errorf("line %d: want 3 tab-separated columns, got %d", line, len(cols))
		}
		id, catName, title := strings.TrimSpace(cols[0]), strings.TrimSpace(cols[1]), strings.TrimSpace(cols[2])

		m := idPattern.FindStringSubmatch(id)
		if m == nil {
			return fmt.Errorf("line %d: %q is not a question number like 1-1", line, id)
		}
		cat := byName[catName]
		if cat == nil {
			return fmt.Errorf("line %d: no category is named %q", line, catName)
		}
		if n, _ := strconv.Atoi(m[1]); n != cat.Number {
			return fmt.Errorf("line %d: %s is numbered for category %d but filed under %q (%d)",
				line, id, n, catName, cat.Number)
		}
		if title == "" {
			return fmt.Errorf("line %d: %s has no question", line, id)
		}
		if c.byID[id] != nil {
			return fmt.Errorf("line %d: %s is listed twice", line, id)
		}
		q := &Question{ID: id, Category: cat, Title: title}
		c.byID[id], c.byKey[q.Key()] = q, q
		cat.Questions = append(cat.Questions, q)
	}
	return scanner.Err()
}

// The markers an answer section understands. Everything else is prose.
const (
	moreMarker    = "<!-- more -->"
	relatedPrefix = "関連:"
	sourcePrefix  = "出典:"
	updatedPrefix = "更新:"
	tagsPrefix    = "タグ:"
)

// readAnswers reads every answers/*.md except README.md. A section is
//
//	## 1-1
//
//	短い答え。空行で段落を分ける。
//
//	<!-- more -->
//
//	「もっと詳しく」の中身。
//
//	関連: 1-5, 2-6
//	出典: https://bitcoin.org/bitcoin.pdf
//	更新: 2026-09-26
//	タグ: 誤前提・時点依存
//
// Lines inside a paragraph keep their line breaks, so a list written as
// "- " lines stays a list.
func (c *Corpus) readAnswers(fsys fs.FS) error {
	files, err := fs.Glob(fsys, "answers/*.md")
	if err != nil {
		return err
	}
	sort.Strings(files)
	seen := map[string]string{}
	for _, name := range files {
		if strings.EqualFold(path.Base(name), "README.md") {
			continue
		}
		raw, err := fs.ReadFile(fsys, name)
		if err != nil {
			return err
		}
		sections, err := parseAnswers(string(raw))
		if err != nil {
			return fmt.Errorf("%s: %w", name, err)
		}
		for _, s := range sections {
			q := c.byID[s.id]
			if q == nil {
				return fmt.Errorf("%s: ## %s answers a question the table does not have", name, s.id)
			}
			if prev, ok := seen[s.id]; ok {
				return fmt.Errorf("%s: ## %s is already answered in %s", name, s.id, prev)
			}
			seen[s.id] = name
			if len(s.answer) == 0 {
				return fmt.Errorf("%s: ## %s has no answer text before %s", name, s.id, moreMarker)
			}
			q.Answer, q.More, q.Related, q.Sources, q.Updated, q.Tags = s.answer, s.more, s.related, s.sources, s.updated, s.tags
		}
	}
	return nil
}

type section struct {
	id               string
	answer, more     []string
	related, sources []string
	tags             []string
	updated          string
	inMore           bool
	paragraph        []string
}

func (s *section) flush() {
	if len(s.paragraph) == 0 {
		return
	}
	p := strings.Join(s.paragraph, "\n")
	if s.inMore {
		s.more = append(s.more, p)
	} else {
		s.answer = append(s.answer, p)
	}
	s.paragraph = nil
}

func parseAnswers(text string) ([]*section, error) {
	var out []*section
	var cur *section
	for i, line := range strings.Split(strings.ReplaceAll(text, "\r\n", "\n"), "\n") {
		trimmed := strings.TrimSpace(line)
		if id, ok := strings.CutPrefix(trimmed, "## "); ok {
			if cur != nil {
				cur.flush()
			}
			id = strings.TrimSpace(id)
			if !idPattern.MatchString(id) {
				return nil, fmt.Errorf("line %d: %q is not a question number like 1-1", i+1, id)
			}
			cur = &section{id: id}
			out = append(out, cur)
			continue
		}
		if cur == nil {
			continue // anything above the first section is a note to the writer
		}
		switch {
		case trimmed == "":
			cur.flush()
		case trimmed == moreMarker:
			cur.flush()
			cur.inMore = true
		case strings.HasPrefix(trimmed, relatedPrefix):
			cur.flush()
			for _, r := range strings.FieldsFunc(strings.TrimPrefix(trimmed, relatedPrefix), isListSep) {
				cur.related = append(cur.related, strings.TrimSpace(r))
			}
		case strings.HasPrefix(trimmed, sourcePrefix):
			cur.flush()
			if src := strings.TrimSpace(strings.TrimPrefix(trimmed, sourcePrefix)); src != "" {
				cur.sources = append(cur.sources, src)
			}
		case strings.HasPrefix(trimmed, updatedPrefix):
			cur.flush()
			cur.updated = strings.TrimSpace(strings.TrimPrefix(trimmed, updatedPrefix))
		case strings.HasPrefix(trimmed, tagsPrefix):
			cur.flush()
			for _, t := range strings.FieldsFunc(strings.TrimPrefix(trimmed, tagsPrefix), isTagSep) {
				cur.tags = append(cur.tags, strings.TrimSpace(t))
			}
		default:
			cur.paragraph = append(cur.paragraph, strings.TrimRight(line, " \t"))
		}
	}
	if cur != nil {
		cur.flush()
	}
	if len(out) == 0 && strings.TrimSpace(text) != "" {
		return nil, errors.New("no \"## <番号>\" sections")
	}
	return out, nil
}

// isTagSep splits "誤前提・時点依存" as well as a comma list.
func isTagSep(r rune) bool { return r == '・' || isListSep(r) }

func isListSep(r rune) bool {
	switch r {
	case ',', '、', ' ', '　':
		return true
	}
	return false
}
