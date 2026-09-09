package server

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/ocknamo/sandbox/go-cloudrun-bird/internal/birds"
	"github.com/ocknamo/sandbox/go-cloudrun-bird/internal/catalog"
	"github.com/ocknamo/sandbox/go-cloudrun-bird/internal/commons"
)

// stubFetcher returns one predictable image per category, so a handler's output
// can be asserted exactly.
type stubFetcher struct {
	err   error
	count int
}

func (f *stubFetcher) CategoryImages(ctx context.Context, category string) ([]commons.Image, error) {
	if f.err != nil {
		return nil, f.err
	}
	n := f.count
	if n == 0 {
		n = 3
	}
	out := make([]commons.Image, 0, n)
	for i := 0; i < n; i++ {
		out = append(out, commons.Image{
			Title:      category + " " + string(rune('a'+i)) + ".jpg",
			URL:        "https://upload.wikimedia.org/" + category + "/" + string(rune('a'+i)) + ".jpg",
			SourcePage: "https://commons.wikimedia.org/wiki/" + category,
			Artist:     "A. Photographer",
			License:    "CC BY-SA 4.0",
			LicenseURL: "https://creativecommons.org/licenses/by-sa/4.0",
			Width:      1600,
			Height:     1200,
			MIME:       "image/jpeg",
		})
	}
	return out, nil
}

func newTestHandler(t *testing.T, fetcher birds.Fetcher) (http.Handler, *catalog.Catalog) {
	t.Helper()
	cat, err := catalog.Load()
	if err != nil {
		t.Fatalf("load catalog: %v", err)
	}
	logger := slog.New(slog.NewJSONHandler(io.Discard, nil))
	return New(birds.New(cat, fetcher, time.Hour, logger), logger), cat
}

func get(t *testing.T, h http.Handler, path string) *httptest.ResponseRecorder {
	t.Helper()
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, path, nil))
	return rec
}

func decode[T any](t *testing.T, rec *httptest.ResponseRecorder) T {
	t.Helper()
	var body T
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode body: %v (raw: %s)", err, rec.Body.String())
	}
	return body
}

func TestHealth(t *testing.T) {
	h, _ := newTestHandler(t, &stubFetcher{})
	rec := get(t, h, "/health")

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
	}
	if body := decode[map[string]string](t, rec); body["status"] != "ok" {
		t.Errorf("status field = %q, want %q", body["status"], "ok")
	}
}

func TestRandomImageIsDogAPIShaped(t *testing.T) {
	h, _ := newTestHandler(t, &stubFetcher{})
	rec := get(t, h, "/api/birds/image/random")

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d (body: %s)", rec.Code, http.StatusOK, rec.Body)
	}
	body := decode[singleResponse](t, rec)
	if body.Status != "success" {
		t.Errorf("status = %q, want %q", body.Status, "success")
	}
	if !strings.HasPrefix(body.Message, "https://") {
		t.Errorf("message = %q, want an image URL", body.Message)
	}
	if body.Bird.Species == "" || body.Bird.NameJA == "" {
		t.Errorf("bird = %+v, want it named", body.Bird)
	}
	if body.Attribution.License == "" || body.Attribution.SourcePage == "" {
		t.Errorf("attribution = %+v, want licence and source page", body.Attribution)
	}
	if got := rec.Header().Get("Cache-Control"); got != "no-store" {
		t.Errorf("Cache-Control = %q, want no-store on a random endpoint", got)
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "*" {
		t.Errorf("Access-Control-Allow-Origin = %q, want *", got)
	}
}

func TestRandomImagesReturnsRequestedCount(t *testing.T) {
	h, _ := newTestHandler(t, &stubFetcher{count: 10})
	rec := get(t, h, "/api/birds/image/random/4")

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d (body: %s)", rec.Code, http.StatusOK, rec.Body)
	}
	body := decode[multiResponse](t, rec)
	if len(body.Message) != 4 {
		t.Fatalf("message has %d URLs, want 4", len(body.Message))
	}
	if len(body.Images) != len(body.Message) {
		t.Errorf("images has %d entries, want %d to match message", len(body.Images), len(body.Message))
	}
	for i, img := range body.Images {
		if img.URL != body.Message[i] {
			t.Errorf("images[%d].url = %q, want %q", i, img.URL, body.Message[i])
		}
	}
}

func TestRandomImagesRejectsBadCounts(t *testing.T) {
	h, _ := newTestHandler(t, &stubFetcher{})

	for _, path := range []string{"/api/birds/image/random/0", "/api/birds/image/random/51", "/api/birds/image/random/many"} {
		rec := get(t, h, path)
		if rec.Code != http.StatusBadRequest {
			t.Errorf("GET %s: status = %d, want %d", path, rec.Code, http.StatusBadRequest)
		}
		if body := decode[errorResponse](t, rec); body.Status != "error" {
			t.Errorf("GET %s: status field = %q, want %q", path, body.Status, "error")
		}
	}
}

func TestGroupAndSpeciesRoutes(t *testing.T) {
	h, cat := newTestHandler(t, &stubFetcher{})
	group := cat.Groups()[0]
	species := group.Species[0]

	t.Run("group", func(t *testing.T) {
		rec := get(t, h, "/api/bird/"+group.Slug+"/images/random")
		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d (body: %s)", rec.Code, rec.Body)
		}
		if body := decode[singleResponse](t, rec); body.Bird.Group != group.Slug {
			t.Errorf("group = %q, want %q", body.Bird.Group, group.Slug)
		}
	})

	t.Run("species", func(t *testing.T) {
		rec := get(t, h, "/api/bird/"+group.Slug+"/"+species.Slug+"/images/random")
		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d (body: %s)", rec.Code, rec.Body)
		}
		if body := decode[singleResponse](t, rec); body.Bird.Species != species.Slug {
			t.Errorf("species = %q, want %q", body.Bird.Species, species.Slug)
		}
	})

	t.Run("all images of a species", func(t *testing.T) {
		rec := get(t, h, "/api/bird/"+group.Slug+"/"+species.Slug+"/images")
		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d (body: %s)", rec.Code, rec.Body)
		}
		if body := decode[multiResponse](t, rec); len(body.Message) != 3 {
			t.Errorf("got %d URLs, want the 3 the stub serves", len(body.Message))
		}
	})
}

func TestUnknownBirdIs404(t *testing.T) {
	h, cat := newTestHandler(t, &stubFetcher{})

	for name, path := range map[string]string{
		"unknown group":   "/api/bird/velociraptor/images/random",
		"unknown species": "/api/bird/" + cat.Groups()[0].Slug + "/velociraptor/images/random",
		"unknown path":    "/api/nope",
	} {
		t.Run(name, func(t *testing.T) {
			rec := get(t, h, path)
			if rec.Code != http.StatusNotFound {
				t.Fatalf("status = %d, want %d (body: %s)", rec.Code, http.StatusNotFound, rec.Body)
			}
			body := decode[errorResponse](t, rec)
			if body.Status != "error" || body.Code != http.StatusNotFound {
				t.Errorf("body = %+v, want an error response with code 404", body)
			}
		})
	}
}

func TestRedirectSendsCallerToTheImage(t *testing.T) {
	h, _ := newTestHandler(t, &stubFetcher{})
	rec := get(t, h, "/api/birds/image/redirect")

	if rec.Code != http.StatusFound {
		t.Fatalf("status = %d, want %d (body: %s)", rec.Code, http.StatusFound, rec.Body)
	}
	if loc := rec.Header().Get("Location"); !strings.HasPrefix(loc, "https://upload.wikimedia.org/") {
		t.Errorf("Location = %q, want the image URL", loc)
	}
	if rec.Header().Get("X-Commons-Source") == "" {
		t.Error("X-Commons-Source is empty, want the file's description page")
	}
}

func TestListAllMatchesCatalog(t *testing.T) {
	h, cat := newTestHandler(t, &stubFetcher{})
	rec := get(t, h, "/api/birds/list/all")

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
	}
	body := decode[listResponse](t, rec)
	if len(body.Message) != len(cat.Groups()) {
		t.Errorf("listed %d groups, want %d", len(body.Message), len(cat.Groups()))
	}
	for _, g := range cat.Groups() {
		if len(body.Message[g.Slug]) != len(g.Species) {
			t.Errorf("group %q: listed %d species, want %d", g.Slug, len(body.Message[g.Slug]), len(g.Species))
		}
	}
}

func TestCatalogEndpointCarriesNames(t *testing.T) {
	h, cat := newTestHandler(t, &stubFetcher{})
	rec := get(t, h, "/api/birds/catalog")

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
	}
	body := decode[catalogResponse](t, rec)
	if len(body.Message) != len(cat.Groups()) {
		t.Fatalf("got %d groups, want %d", len(body.Message), len(cat.Groups()))
	}
	first := body.Message[0]
	if first.NameJA == "" || first.Species[0].ScientificName == "" {
		t.Errorf("group %+v is missing names", first)
	}
}

func TestUpstreamFailureIs502(t *testing.T) {
	h, _ := newTestHandler(t, &stubFetcher{err: errors.New("commons is unreachable")})
	rec := get(t, h, "/api/birds/image/random")

	if rec.Code != http.StatusBadGateway {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusBadGateway)
	}
	if body := decode[errorResponse](t, rec); body.Status != "error" {
		t.Errorf("status field = %q, want %q", body.Status, "error")
	}
}

func TestIndexPageIsServedAtRoot(t *testing.T) {
	h, _ := newTestHandler(t, &stubFetcher{})
	rec := get(t, h, "/")

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
	}
	if ct := rec.Header().Get("Content-Type"); !strings.HasPrefix(ct, "text/html") {
		t.Errorf("Content-Type = %q, want HTML", ct)
	}
	if !strings.Contains(rec.Body.String(), "/api/birds/image/random") {
		t.Error("landing page does not mention the API")
	}
}
