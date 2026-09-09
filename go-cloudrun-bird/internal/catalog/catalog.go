// Package catalog holds the curated list of birds the service can serve, and
// maps each one to the Wikimedia Commons category its images come from.
//
// Only the catalog is baked into the binary. The images themselves are fetched
// from Commons at runtime, so nothing here can go stale by pointing at a file
// that has since been renamed or deleted.
package catalog

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"sort"
	"strings"
)

//go:embed birds.json
var birdsJSON []byte

// Species is one bird, and the Commons category holding pictures of it.
type Species struct {
	Slug            string `json:"slug"`
	NameEN          string `json:"name_en"`
	NameJA          string `json:"name_ja"`
	ScientificName  string `json:"scientific_name"`
	CommonsCategory string `json:"commons_category"`

	// Group is filled in from the enclosing group when the catalog loads, so a
	// Species can be reported on its own.
	Group string `json:"-"`
}

// Group is a familiar name for a handful of species — "owl", "penguin". It
// plays the role a breed plays in the Dog API, with species as sub-breeds.
type Group struct {
	Slug    string    `json:"slug"`
	NameEN  string    `json:"name_en"`
	NameJA  string    `json:"name_ja"`
	Species []Species `json:"species"`
}

// Catalog is the loaded bird list, indexed for lookup by slug.
type Catalog struct {
	groups     []Group
	groupIndex map[string]*Group
	allSpecies []Species
}

type catalogFile struct {
	Groups []Group `json:"groups"`
}

// Load parses the embedded catalog. It fails loudly on a malformed or
// ambiguous catalog, because a bad slug would only show up as a 404 later.
func Load() (*Catalog, error) {
	var file catalogFile
	if err := json.Unmarshal(birdsJSON, &file); err != nil {
		return nil, fmt.Errorf("parse birds.json: %w", err)
	}
	if len(file.Groups) == 0 {
		return nil, fmt.Errorf("birds.json contains no groups")
	}

	c := &Catalog{
		groups:     file.Groups,
		groupIndex: make(map[string]*Group, len(file.Groups)),
	}
	for i := range c.groups {
		g := &c.groups[i]
		if g.Slug == "" {
			return nil, fmt.Errorf("group %d has no slug", i)
		}
		if _, dup := c.groupIndex[g.Slug]; dup {
			return nil, fmt.Errorf("duplicate group slug %q", g.Slug)
		}
		if len(g.Species) == 0 {
			return nil, fmt.Errorf("group %q has no species", g.Slug)
		}
		c.groupIndex[g.Slug] = g

		seen := make(map[string]bool, len(g.Species))
		for j := range g.Species {
			s := &g.Species[j]
			switch {
			case s.Slug == "":
				return nil, fmt.Errorf("group %q has a species with no slug", g.Slug)
			case s.CommonsCategory == "":
				return nil, fmt.Errorf("species %q/%q has no commons_category", g.Slug, s.Slug)
			case seen[s.Slug]:
				return nil, fmt.Errorf("duplicate species slug %q in group %q", s.Slug, g.Slug)
			}
			seen[s.Slug] = true
			s.Group = g.Slug
			c.allSpecies = append(c.allSpecies, *s)
		}
	}
	return c, nil
}

// Groups returns every group, in catalog order.
func (c *Catalog) Groups() []Group { return c.groups }

// Species returns every species across all groups, in catalog order.
func (c *Catalog) Species() []Species { return c.allSpecies }

// Group looks a group up by slug. Slugs are matched case-insensitively, the way
// the Dog API treats breed names.
func (c *Catalog) Group(slug string) (*Group, bool) {
	g, ok := c.groupIndex[normalize(slug)]
	return g, ok
}

// Lookup resolves a group slug, and optionally a species slug within it, to the
// species that request covers. An empty species slug means "any bird in this
// group", so /api/bird/owl/... can serve all four owls.
func (c *Catalog) Lookup(groupSlug, speciesSlug string) ([]Species, error) {
	g, ok := c.Group(groupSlug)
	if !ok {
		return nil, &NotFoundError{Kind: "group", Slug: groupSlug}
	}
	if speciesSlug == "" {
		out := make([]Species, len(g.Species))
		copy(out, g.Species)
		return out, nil
	}
	want := normalize(speciesSlug)
	for _, s := range g.Species {
		if s.Slug == want {
			return []Species{s}, nil
		}
	}
	return nil, &NotFoundError{Kind: "species", Slug: groupSlug + "/" + speciesSlug}
}

// List renders the catalog the way the Dog API renders breeds: a map from group
// slug to its species slugs, sorted so the output is stable.
func (c *Catalog) List() map[string][]string {
	out := make(map[string][]string, len(c.groups))
	for _, g := range c.groups {
		slugs := make([]string, 0, len(g.Species))
		for _, s := range g.Species {
			slugs = append(slugs, s.Slug)
		}
		sort.Strings(slugs)
		out[g.Slug] = slugs
	}
	return out
}

// NotFoundError reports an unknown group or species slug.
type NotFoundError struct {
	Kind string
	Slug string
}

func (e *NotFoundError) Error() string {
	return fmt.Sprintf("%s %q not found", e.Kind, e.Slug)
}

func normalize(slug string) string {
	return strings.ToLower(strings.TrimSpace(slug))
}
