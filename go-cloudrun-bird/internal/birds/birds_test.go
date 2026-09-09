package birds

import (
	"context"
	"errors"
	"io"
	"log/slog"
	"sync"
	"testing"
	"time"

	"github.com/ocknamo/sandbox/go-cloudrun-bird/internal/catalog"
	"github.com/ocknamo/sandbox/go-cloudrun-bird/internal/commons"
)

// fakeFetcher stands in for Commons: it counts calls per category and can be
// told to fail.
type fakeFetcher struct {
	mu     sync.Mutex
	calls  map[string]int
	fail   error
	images int
	delay  time.Duration
}

func newFakeFetcher(images int) *fakeFetcher {
	return &fakeFetcher{calls: map[string]int{}, images: images}
}

func (f *fakeFetcher) CategoryImages(ctx context.Context, category string) ([]commons.Image, error) {
	f.mu.Lock()
	f.calls[category]++
	fail, n, delay := f.fail, f.images, f.delay
	f.mu.Unlock()

	if delay > 0 {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-time.After(delay):
		}
	}
	if fail != nil {
		return nil, fail
	}
	out := make([]commons.Image, 0, n)
	for i := 0; i < n; i++ {
		out = append(out, commons.Image{
			Title: category,
			URL:   "https://upload.wikimedia.org/" + category + "/" + string(rune('a'+i)) + ".jpg",
		})
	}
	return out, nil
}

func (f *fakeFetcher) callCount(category string) int {
	f.mu.Lock()
	defer f.mu.Unlock()
	return f.calls[category]
}

func (f *fakeFetcher) setFail(err error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.fail = err
}

func newTestService(t *testing.T, fetcher Fetcher, ttl time.Duration) (*Service, *catalog.Catalog) {
	t.Helper()
	cat, err := catalog.Load()
	if err != nil {
		t.Fatalf("load catalog: %v", err)
	}
	return New(cat, fetcher, ttl, slog.New(slog.NewJSONHandler(io.Discard, nil))), cat
}

func TestRandomReturnsAPictureOfTheRequestedSpecies(t *testing.T) {
	fetcher := newFakeFetcher(3)
	svc, cat := newTestService(t, fetcher, time.Hour)
	want := cat.Species()[0]

	picture, err := svc.Random(context.Background(), []catalog.Species{want})
	if err != nil {
		t.Fatalf("Random: %v", err)
	}
	if picture.Species.Slug != want.Slug {
		t.Errorf("species = %q, want %q", picture.Species.Slug, want.Slug)
	}
	if picture.Image.URL == "" {
		t.Error("picture has no URL")
	}
}

func TestImagesAreCachedPerSpecies(t *testing.T) {
	fetcher := newFakeFetcher(5)
	svc, cat := newTestService(t, fetcher, time.Hour)
	species := []catalog.Species{cat.Species()[0]}

	for i := 0; i < 10; i++ {
		if _, err := svc.Random(context.Background(), species); err != nil {
			t.Fatalf("Random: %v", err)
		}
	}
	if got := fetcher.callCount(species[0].CommonsCategory); got != 1 {
		t.Errorf("fetched %d times, want 1 — the cache should absorb the rest", got)
	}
}

func TestConcurrentMissesFetchOnce(t *testing.T) {
	fetcher := newFakeFetcher(5)
	fetcher.delay = 50 * time.Millisecond
	svc, cat := newTestService(t, fetcher, time.Hour)
	species := []catalog.Species{cat.Species()[0]}

	var wg sync.WaitGroup
	for i := 0; i < 8; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if _, err := svc.Random(context.Background(), species); err != nil {
				t.Errorf("Random: %v", err)
			}
		}()
	}
	wg.Wait()

	if got := fetcher.callCount(species[0].CommonsCategory); got != 1 {
		t.Errorf("fetched %d times, want 1 — concurrent misses should collapse", got)
	}
}

func TestExpiredCacheRefetches(t *testing.T) {
	fetcher := newFakeFetcher(3)
	svc, cat := newTestService(t, fetcher, time.Nanosecond)
	species := []catalog.Species{cat.Species()[0]}

	for i := 0; i < 2; i++ {
		if _, err := svc.Random(context.Background(), species); err != nil {
			t.Fatalf("Random: %v", err)
		}
		time.Sleep(time.Millisecond)
	}
	if got := fetcher.callCount(species[0].CommonsCategory); got < 2 {
		t.Errorf("fetched %d times, want at least 2 after the TTL expired", got)
	}
}

func TestStaleImagesServedWhenRefreshFails(t *testing.T) {
	fetcher := newFakeFetcher(3)
	svc, cat := newTestService(t, fetcher, time.Nanosecond)
	species := []catalog.Species{cat.Species()[0]}

	if _, err := svc.Random(context.Background(), species); err != nil {
		t.Fatalf("first Random: %v", err)
	}
	fetcher.setFail(errors.New("commons is down"))

	picture, err := svc.Random(context.Background(), species)
	if err != nil {
		t.Fatalf("Random after upstream failure: %v, want the stale cache to be served", err)
	}
	if picture.Image.URL == "" {
		t.Error("stale picture has no URL")
	}
}

func TestRandomFailsWhenNothingIsCached(t *testing.T) {
	fetcher := newFakeFetcher(3)
	fetcher.setFail(errors.New("commons is down"))
	svc, cat := newTestService(t, fetcher, time.Hour)

	if _, err := svc.Random(context.Background(), []catalog.Species{cat.Species()[0]}); err == nil {
		t.Fatal("expected an error when the cache is cold and the upstream fails")
	}
}

func TestRandomNReturnsDistinctImages(t *testing.T) {
	fetcher := newFakeFetcher(10)
	svc, cat := newTestService(t, fetcher, time.Hour)

	pictures, err := svc.RandomN(context.Background(), cat.Species(), 5)
	if err != nil {
		t.Fatalf("RandomN: %v", err)
	}
	if len(pictures) != 5 {
		t.Fatalf("got %d pictures, want 5", len(pictures))
	}
	seen := map[string]bool{}
	for _, p := range pictures {
		if seen[p.Image.URL] {
			t.Errorf("duplicate image %q", p.Image.URL)
		}
		seen[p.Image.URL] = true
	}
}

func TestRandomNBoundsUpstreamFetches(t *testing.T) {
	fetcher := newFakeFetcher(20)
	svc, cat := newTestService(t, fetcher, time.Hour)

	pictures, err := svc.RandomN(context.Background(), cat.Species(), 50)
	if err != nil {
		t.Fatalf("RandomN: %v", err)
	}
	if len(pictures) != 50 {
		t.Errorf("got %d pictures, want 50", len(pictures))
	}

	total := 0
	fetcher.mu.Lock()
	for _, n := range fetcher.calls {
		total += n
	}
	fetcher.mu.Unlock()
	if total > maxColdFetches {
		t.Errorf("made %d upstream fetches for one request, want at most %d", total, maxColdFetches)
	}
}

func TestRandomNTopsUpFromASingleSpecies(t *testing.T) {
	fetcher := newFakeFetcher(10)
	svc, cat := newTestService(t, fetcher, time.Hour)
	only := cat.Species()[0]

	pictures, err := svc.RandomN(context.Background(), []catalog.Species{only}, 6)
	if err != nil {
		t.Fatalf("RandomN: %v", err)
	}
	if len(pictures) != 6 {
		t.Fatalf("got %d pictures, want 6 from the one species available", len(pictures))
	}
	seen := map[string]bool{}
	for _, p := range pictures {
		if p.Species.Slug != only.Slug {
			t.Errorf("species = %q, want %q", p.Species.Slug, only.Slug)
		}
		if seen[p.Image.URL] {
			t.Errorf("duplicate image %q", p.Image.URL)
		}
		seen[p.Image.URL] = true
	}
}

func TestRandomNStopsWhenImagesRunOut(t *testing.T) {
	fetcher := newFakeFetcher(2)
	svc, cat := newTestService(t, fetcher, time.Hour)

	pictures, err := svc.RandomN(context.Background(), cat.Species()[:1], 10)
	if err != nil {
		t.Fatalf("RandomN: %v", err)
	}
	if len(pictures) != 2 {
		t.Errorf("got %d pictures, want the 2 that exist", len(pictures))
	}
}

func TestRandomSkipsSpeciesThatCannotBeFetched(t *testing.T) {
	cat, err := catalog.Load()
	if err != nil {
		t.Fatalf("load catalog: %v", err)
	}
	broken, working := cat.Species()[0], cat.Species()[1]
	fetcher := &selectiveFetcher{good: map[string]bool{working.CommonsCategory: true}}
	svc, _ := newTestService(t, fetcher, time.Hour)
	candidates := []catalog.Species{broken, working}

	// Each call retries a few species, so a run of calls should land on the one
	// working species and never report the broken one as a result.
	successes := 0
	for i := 0; i < 30; i++ {
		picture, err := svc.Random(context.Background(), candidates)
		if err != nil {
			continue
		}
		successes++
		if picture.Species.Slug != working.Slug {
			t.Fatalf("species = %q, want %q", picture.Species.Slug, working.Slug)
		}
	}
	if successes == 0 {
		t.Error("no call ever reached the working species")
	}
}

func TestPicturesReturnsEverySpeciesInAGroup(t *testing.T) {
	fetcher := newFakeFetcher(4)
	svc, cat := newTestService(t, fetcher, time.Hour)
	group := cat.Groups()[0]

	pictures, err := svc.Pictures(context.Background(), group.Species)
	if err != nil {
		t.Fatalf("Pictures: %v", err)
	}
	if want := 4 * len(group.Species); len(pictures) != want {
		t.Errorf("got %d pictures, want %d", len(pictures), want)
	}
}

func TestPrewarmFillsTheCache(t *testing.T) {
	fetcher := newFakeFetcher(3)
	svc, _ := newTestService(t, fetcher, time.Hour)

	svc.Prewarm(context.Background(), 3, 0)

	total := 0
	fetcher.mu.Lock()
	for _, n := range fetcher.calls {
		total += n
	}
	fetcher.mu.Unlock()
	if total != 3 {
		t.Errorf("prewarm made %d fetches, want 3", total)
	}
}

// selectiveFetcher only serves the categories listed in good.
type selectiveFetcher struct {
	good map[string]bool
}

func (f *selectiveFetcher) CategoryImages(ctx context.Context, category string) ([]commons.Image, error) {
	if !f.good[category] {
		return nil, commons.ErrNoImages
	}
	return []commons.Image{{Title: category, URL: "https://upload.wikimedia.org/" + category + ".jpg"}}, nil
}
