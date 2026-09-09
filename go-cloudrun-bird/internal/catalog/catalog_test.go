package catalog

import (
	"errors"
	"strings"
	"testing"
)

func TestLoadEmbeddedCatalog(t *testing.T) {
	c, err := Load()
	if err != nil {
		t.Fatalf("Load: %v", err)
	}
	if len(c.Groups()) == 0 {
		t.Fatal("catalog has no groups")
	}
	if len(c.Species()) < len(c.Groups()) {
		t.Fatalf("species = %d, want at least one per group (%d)", len(c.Species()), len(c.Groups()))
	}

	for _, s := range c.Species() {
		if s.Group == "" {
			t.Errorf("species %q has no group back-reference", s.Slug)
		}
		if !strings.HasPrefix(s.CommonsCategory, "Category:") {
			t.Errorf("species %q: commons_category = %q, want a Category: prefix", s.Slug, s.CommonsCategory)
		}
		if s.NameEN == "" || s.NameJA == "" || s.ScientificName == "" {
			t.Errorf("species %q is missing a name field", s.Slug)
		}
		if strings.ToLower(s.Slug) != s.Slug {
			t.Errorf("species slug %q is not lowercase", s.Slug)
		}
	}
}

func TestLookupGroupReturnsAllItsSpecies(t *testing.T) {
	c := mustLoad(t)
	group := c.Groups()[0]

	got, err := c.Lookup(group.Slug, "")
	if err != nil {
		t.Fatalf("Lookup(%q, \"\"): %v", group.Slug, err)
	}
	if len(got) != len(group.Species) {
		t.Errorf("got %d species, want %d", len(got), len(group.Species))
	}
}

func TestLookupSpeciesIsCaseInsensitive(t *testing.T) {
	c := mustLoad(t)
	want := c.Species()[0]

	got, err := c.Lookup(strings.ToUpper(want.Group), strings.ToUpper(want.Slug))
	if err != nil {
		t.Fatalf("Lookup: %v", err)
	}
	if len(got) != 1 || got[0].Slug != want.Slug {
		t.Errorf("Lookup returned %v, want just %q", got, want.Slug)
	}
}

func TestLookupUnknownSlugs(t *testing.T) {
	c := mustLoad(t)
	known := c.Species()[0]

	for _, tc := range []struct{ name, group, species string }{
		{"unknown group", "velociraptor", ""},
		{"unknown species", known.Group, "not-a-bird"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			_, err := c.Lookup(tc.group, tc.species)
			var notFound *NotFoundError
			if !errors.As(err, &notFound) {
				t.Fatalf("err = %v, want *NotFoundError", err)
			}
		})
	}
}

func TestListMatchesCatalog(t *testing.T) {
	c := mustLoad(t)
	list := c.List()

	if len(list) != len(c.Groups()) {
		t.Fatalf("list has %d groups, want %d", len(list), len(c.Groups()))
	}
	for _, g := range c.Groups() {
		if len(list[g.Slug]) != len(g.Species) {
			t.Errorf("group %q: listed %d species, want %d", g.Slug, len(list[g.Slug]), len(g.Species))
		}
	}
}

func mustLoad(t *testing.T) *Catalog {
	t.Helper()
	c, err := Load()
	if err != nil {
		t.Fatalf("Load: %v", err)
	}
	return c
}
