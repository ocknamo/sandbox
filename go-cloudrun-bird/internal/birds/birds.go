// Package birds serves random bird pictures: it picks from the curated
// catalog, fetches that species' images from Wikimedia Commons, and caches the
// result so a burst of requests costs at most one upstream call per species.
package birds

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"math/rand/v2"
	"sync"
	"time"

	"github.com/ocknamo/sandbox/go-cloudrun-bird/internal/catalog"
	"github.com/ocknamo/sandbox/go-cloudrun-bird/internal/commons"
)

// DefaultTTL is how long a species' image list is reused before it is fetched
// again. Commons categories change on the order of days, not seconds.
const DefaultTTL = 12 * time.Hour

// maxColdFetches bounds how many species one request may pull from Commons.
// Without it, asking for 50 pictures with an empty cache would fan out into 50
// upstream calls; past the budget the request is filled from what is already
// cached.
const maxColdFetches = 4

// Fetcher is the piece of the Commons client this package needs. Tests supply
// their own.
type Fetcher interface {
	CategoryImages(ctx context.Context, category string) ([]commons.Image, error)
}

// Picture is one image together with the bird it shows.
type Picture struct {
	Species catalog.Species
	Image   commons.Image
}

// Service holds the cache and the randomness.
type Service struct {
	catalog *catalog.Catalog
	fetcher Fetcher
	ttl     time.Duration
	logger  *slog.Logger

	mu      sync.Mutex
	entries map[string]*entry
}

// entry is one category's cached images. Its own mutex collapses concurrent
// misses for the same category into a single upstream request.
type entry struct {
	mu      sync.Mutex
	images  []commons.Image
	fetched time.Time
}

// New returns a service backed by cat and fetcher.
func New(cat *catalog.Catalog, fetcher Fetcher, ttl time.Duration, logger *slog.Logger) *Service {
	if ttl <= 0 {
		ttl = DefaultTTL
	}
	if logger == nil {
		logger = slog.Default()
	}
	return &Service{
		catalog: cat,
		fetcher: fetcher,
		ttl:     ttl,
		logger:  logger,
		entries: make(map[string]*entry),
	}
}

// Catalog exposes the underlying catalog for handlers that only need names.
func (s *Service) Catalog() *catalog.Catalog { return s.catalog }

// Random returns one picture of a randomly chosen species from candidates.
func (s *Service) Random(ctx context.Context, candidates []catalog.Species) (Picture, error) {
	pictures, err := s.RandomN(ctx, candidates, 1)
	if err != nil {
		return Picture{}, err
	}
	return pictures[0], nil
}

// RandomN returns n pictures, drawn from randomly chosen species. Images are
// not repeated unless there are fewer distinct images available than asked for.
func (s *Service) RandomN(ctx context.Context, candidates []catalog.Species, n int) ([]Picture, error) {
	if len(candidates) == 0 {
		return nil, errors.New("no candidate species")
	}
	if n < 1 {
		n = 1
	}

	pool := make([]catalog.Species, len(candidates))
	copy(pool, candidates)
	rand.Shuffle(len(pool), func(i, j int) { pool[i], pool[j] = pool[j], pool[i] })

	var (
		out     []Picture
		seen    = make(map[string]bool, n)
		loaded  []loadedSpecies
		fetches int
		lastErr error
	)
	// One picture per species first, so a handful of pictures shows a handful
	// of different birds rather than one bird several times over.
	for _, species := range pool {
		if len(out) >= n {
			break
		}
		images, fresh := s.cached(species)
		if !fresh {
			if fetches >= maxColdFetches {
				continue
			}
			fetches++
			var err error
			if images, err = s.images(ctx, species); err != nil {
				lastErr = err
				continue
			}
		}
		loaded = append(loaded, loadedSpecies{species: species, images: images})
		if img, ok := pickUnseen(images, seen); ok {
			seen[img.URL] = true
			out = append(out, Picture{Species: species, Image: img})
		}
	}

	// Then top up from the species already in hand, for a request that wants
	// more pictures than the pool has species.
	for len(out) < n {
		added := false
		for _, l := range loaded {
			if len(out) >= n {
				break
			}
			img, ok := pickUnseen(l.images, seen)
			if !ok {
				continue
			}
			seen[img.URL] = true
			out = append(out, Picture{Species: l.species, Image: img})
			added = true
		}
		if !added {
			break
		}
	}

	if len(out) == 0 {
		if lastErr == nil {
			lastErr = commons.ErrNoImages
		}
		return nil, lastErr
	}
	return out, nil
}

// loadedSpecies is one species' images, held for the duration of a request.
type loadedSpecies struct {
	species catalog.Species
	images  []commons.Image
}

// Pictures returns every cached image for the given species, in catalog order.
func (s *Service) Pictures(ctx context.Context, candidates []catalog.Species) ([]Picture, error) {
	var (
		out     []Picture
		lastErr error
	)
	for _, species := range candidates {
		images, err := s.images(ctx, species)
		if err != nil {
			lastErr = err
			continue
		}
		for _, img := range images {
			out = append(out, Picture{Species: species, Image: img})
		}
	}
	if len(out) == 0 {
		if lastErr == nil {
			lastErr = commons.ErrNoImages
		}
		return nil, lastErr
	}
	return out, nil
}

// Prewarm fills the cache for count randomly chosen species, one at a time.
// It runs in the background at startup so the first real request does not pay
// for a cold cache, and it stays deliberately slow: Wikimedia asks clients to
// keep requests serial rather than firing them in parallel.
func (s *Service) Prewarm(ctx context.Context, count int, pause time.Duration) {
	species := s.catalog.Species()
	if count > len(species) {
		count = len(species)
	}
	order := rand.Perm(len(species))
	for i := 0; i < count; i++ {
		if ctx.Err() != nil {
			return
		}
		sp := species[order[i]]
		if _, err := s.images(ctx, sp); err != nil {
			s.logger.Warn("prewarm failed", "species", sp.Slug, "err", err)
		}
		if pause > 0 && i < count-1 {
			select {
			case <-ctx.Done():
				return
			case <-time.After(pause):
			}
		}
	}
}

// cached returns a species' images if they are in the cache and still fresh.
func (s *Service) cached(species catalog.Species) ([]commons.Image, bool) {
	e := s.entryFor(species.CommonsCategory)
	e.mu.Lock()
	defer e.mu.Unlock()
	if len(e.images) > 0 && time.Since(e.fetched) < s.ttl {
		return e.images, true
	}
	return nil, false
}

// images returns a species' images, fetching them if the cache is cold or the
// entry has aged past the TTL. A refresh that fails falls back to the stale
// copy: an old picture beats an error.
func (s *Service) images(ctx context.Context, species catalog.Species) ([]commons.Image, error) {
	e := s.entryFor(species.CommonsCategory)

	e.mu.Lock()
	defer e.mu.Unlock()

	if len(e.images) > 0 && time.Since(e.fetched) < s.ttl {
		return e.images, nil
	}

	images, err := s.fetcher.CategoryImages(ctx, species.CommonsCategory)
	if err != nil {
		if len(e.images) > 0 {
			s.logger.Warn("serving stale images", "species", species.Slug, "err", err)
			return e.images, nil
		}
		return nil, fmt.Errorf("fetch %s: %w", species.Slug, err)
	}

	e.images = images
	e.fetched = time.Now()
	s.logger.Info("cached images", "species", species.Slug, "count", len(images))
	return e.images, nil
}

func (s *Service) entryFor(category string) *entry {
	s.mu.Lock()
	defer s.mu.Unlock()
	e, ok := s.entries[category]
	if !ok {
		e = &entry{}
		s.entries[category] = e
	}
	return e
}

// pickUnseen returns a random image that is not already in seen, falling back
// to any image once every candidate has been used.
func pickUnseen(images []commons.Image, seen map[string]bool) (commons.Image, bool) {
	if len(images) == 0 {
		return commons.Image{}, false
	}
	start := rand.IntN(len(images))
	for i := range images {
		img := images[(start+i)%len(images)]
		if !seen[img.URL] {
			return img, true
		}
	}
	return commons.Image{}, false
}
