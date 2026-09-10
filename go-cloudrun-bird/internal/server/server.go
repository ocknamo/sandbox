// Package server wires the HTTP routes for the bird API.
//
// The shape follows the Dog API (dog.ceo): every response carries "status" and
// "message", where "message" is an image URL or a list of them. Bird pictures
// come from Wikimedia Commons, so each response also carries the licence and
// author of the picture — several Commons licences require attribution.
package server

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"github.com/ocknamo/sandbox/go-cloudrun-bird/internal/birds"
	"github.com/ocknamo/sandbox/go-cloudrun-bird/internal/catalog"
	"github.com/ocknamo/sandbox/go-cloudrun-bird/web"
)

// maxImages caps a multi-image request, as the Dog API does.
const maxImages = 50

// upstreamTimeout bounds the Commons lookups a single request may trigger, so a
// slow upstream cannot hold a Cloud Run instance open. It has to cover a cold
// cache: a request for many pictures fetches a few species, each of which may
// retry once after a rate-limit response.
const upstreamTimeout = 20 * time.Second

// New returns the service handler.
func New(svc *birds.Service, logger *slog.Logger) http.Handler {
	h := &handlers{svc: svc}
	mux := http.NewServeMux()

	// Not /healthz: Google Front End intercepts that exact path on *.run.app
	// and returns its own 404 without ever forwarding to the container.
	mux.HandleFunc("GET /health", h.health)

	mux.HandleFunc("GET /api/birds/image/random", h.randomImage)
	mux.HandleFunc("GET /api/birds/image/random/{count}", h.randomImages)
	mux.HandleFunc("GET /api/birds/image/redirect", h.redirect)
	mux.HandleFunc("GET /api/birds/list/all", h.listAll)
	mux.HandleFunc("GET /api/birds/catalog", h.catalogDetail)

	mux.HandleFunc("GET /api/bird/{group}/images/random", h.randomImage)
	mux.HandleFunc("GET /api/bird/{group}/images/random/{count}", h.randomImages)
	mux.HandleFunc("GET /api/bird/{group}/images/redirect", h.redirect)
	mux.HandleFunc("GET /api/bird/{group}/images", h.allImages)

	mux.HandleFunc("GET /api/bird/{group}/{species}/images/random", h.randomImage)
	mux.HandleFunc("GET /api/bird/{group}/{species}/images/random/{count}", h.randomImages)
	mux.HandleFunc("GET /api/bird/{group}/{species}/images/redirect", h.redirect)
	mux.HandleFunc("GET /api/bird/{group}/{species}/images", h.allImages)

	// The page is served at /index.html as well as at /: Google Front End
	// answers the bare "/" of a *.run.app service with its own 404 page
	// without ever forwarding it to the container, the same way it does
	// for /healthz, so "/" alone would leave the page unreachable.
	mux.HandleFunc("GET /index.html", h.page)
	mux.HandleFunc("GET /", h.index)

	return withLogging(logger, withCORS(mux))
}

type handlers struct {
	svc *birds.Service
}

func (h *handlers) health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// index catches every path the mux has no pattern for, and serves the page for
// the one path it does own.
func (h *handlers) index(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		writeError(w, http.StatusNotFound, "no such endpoint: "+r.URL.Path+" (see /index.html)")
		return
	}
	h.page(w, r)
}

func (h *handlers) page(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "public, max-age=300")
	_, _ = w.Write(web.IndexHTML)
}

// randomImage answers with a single picture, Dog API style: "message" is the
// image URL itself.
func (h *handlers) randomImage(w http.ResponseWriter, r *http.Request) {
	candidates, ok := h.resolve(w, r)
	if !ok {
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), upstreamTimeout)
	defer cancel()

	picture, err := h.svc.Random(ctx, candidates)
	if err != nil {
		writeUpstreamError(w, err)
		return
	}
	noStore(w)
	writeJSON(w, http.StatusOK, singleResponse{
		Status:      "success",
		Message:     picture.Image.URL,
		Bird:        newBird(picture.Species),
		Attribution: newAttribution(picture),
	})
}

// randomImages answers with up to maxImages pictures.
func (h *handlers) randomImages(w http.ResponseWriter, r *http.Request) {
	count, err := parseCount(r.PathValue("count"))
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	candidates, ok := h.resolve(w, r)
	if !ok {
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), upstreamTimeout)
	defer cancel()

	pictures, err := h.svc.RandomN(ctx, candidates, count)
	if err != nil {
		writeUpstreamError(w, err)
		return
	}
	noStore(w)
	writeJSON(w, http.StatusOK, newMultiResponse(pictures))
}

// allImages lists every image the service knows for a group or species.
func (h *handlers) allImages(w http.ResponseWriter, r *http.Request) {
	candidates, ok := h.resolve(w, r)
	if !ok {
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), upstreamTimeout)
	defer cancel()

	pictures, err := h.svc.Pictures(ctx, candidates)
	if err != nil {
		writeUpstreamError(w, err)
		return
	}
	w.Header().Set("Cache-Control", "public, max-age=600")
	writeJSON(w, http.StatusOK, newMultiResponse(pictures))
}

// redirect sends the caller straight to a random image, which makes the
// endpoint usable as the src of an <img> tag.
func (h *handlers) redirect(w http.ResponseWriter, r *http.Request) {
	candidates, ok := h.resolve(w, r)
	if !ok {
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), upstreamTimeout)
	defer cancel()

	picture, err := h.svc.Random(ctx, candidates)
	if err != nil {
		writeUpstreamError(w, err)
		return
	}
	noStore(w)
	// The licence lives with the image, not in the redirect, so name the source
	// page in a header for anyone following along.
	w.Header().Set("X-Commons-Source", picture.Image.SourcePage)
	http.Redirect(w, r, picture.Image.URL, http.StatusFound)
}

func (h *handlers) listAll(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "public, max-age=3600")
	writeJSON(w, http.StatusOK, listResponse{
		Status:  "success",
		Message: h.svc.Catalog().List(),
	})
}

func (h *handlers) catalogDetail(w http.ResponseWriter, r *http.Request) {
	groups := h.svc.Catalog().Groups()
	out := make([]groupJSON, 0, len(groups))
	for _, g := range groups {
		species := make([]birdJSON, 0, len(g.Species))
		for _, s := range g.Species {
			species = append(species, newBird(s))
		}
		out = append(out, groupJSON{
			Slug:    g.Slug,
			NameEN:  g.NameEN,
			NameJA:  g.NameJA,
			Species: species,
		})
	}
	w.Header().Set("Cache-Control", "public, max-age=3600")
	writeJSON(w, http.StatusOK, catalogResponse{Status: "success", Message: out})
}

// resolve turns the {group} and {species} path values into the species a
// request covers. Absent path values mean "every bird in the catalog".
func (h *handlers) resolve(w http.ResponseWriter, r *http.Request) ([]catalog.Species, bool) {
	group := r.PathValue("group")
	if group == "" {
		return h.svc.Catalog().Species(), true
	}
	species, err := h.svc.Catalog().Lookup(group, r.PathValue("species"))
	if err != nil {
		var notFound *catalog.NotFoundError
		if errors.As(err, &notFound) {
			writeError(w, http.StatusNotFound, err.Error()+" (see /api/birds/list/all)")
			return nil, false
		}
		writeError(w, http.StatusInternalServerError, err.Error())
		return nil, false
	}
	return species, true
}

func parseCount(raw string) (int, error) {
	if raw == "" {
		return 1, nil
	}
	n, err := strconv.Atoi(raw)
	if err != nil {
		return 0, errors.New("count must be a number")
	}
	if n < 1 || n > maxImages {
		return 0, errors.New("count must be between 1 and " + strconv.Itoa(maxImages))
	}
	return n, nil
}

func writeUpstreamError(w http.ResponseWriter, err error) {
	writeError(w, http.StatusBadGateway, "could not fetch images from Wikimedia Commons: "+err.Error())
}

func writeError(w http.ResponseWriter, status int, message string) {
	noStore(w)
	writeJSON(w, status, errorResponse{Status: "error", Message: message, Code: status})
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	enc := json.NewEncoder(w)
	enc.SetIndent("", "  ")
	enc.SetEscapeHTML(false)
	_ = enc.Encode(body)
}

func noStore(w http.ResponseWriter) {
	// A random endpoint that gets cached stops being random.
	w.Header().Set("Cache-Control", "no-store")
}

// withCORS lets the API be called straight from a browser, which is most of
// what an image API is for.
func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func withLogging(logger *slog.Logger, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rec, r)
		logger.Info("request",
			"method", r.Method,
			"path", r.URL.Path,
			"status", rec.status,
			"duration_ms", time.Since(start).Milliseconds(),
		)
	})
}

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (s *statusRecorder) WriteHeader(code int) {
	s.status = code
	s.ResponseWriter.WriteHeader(code)
}
