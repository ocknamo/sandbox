// Package server wires the HTTP routes for the scoring API.
//
// The service exists for one reason: api.typesafe.ai answers a browser with
// "Disallowed CORS origin", and an API key could not be put in a static page
// even if it did not. So the page talks to this, and this talks to Jev.
//
// It returns signals and no verdict. Thresholds live in the caller, which is
// what lets a page move a slider and re-filter instantly instead of paying for
// another round of judgements.
package server

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/ocknamo/sandbox/jev-nostr/internal/recommend"
	"github.com/ocknamo/sandbox/jev-nostr/internal/scorer"
)

const (
	// maxPosts caps one request. Each post is its own call to a paid API, so
	// the cap is what stops a single caller from spending without limit.
	maxPosts = 30

	// maxContentRunes trims a post before it is sent on. Nostr puts no limit
	// on a note, and the model charges for what it reads.
	maxContentRunes = 1500

	// maxBodyBytes bounds the request itself, before any of it is parsed.
	maxBodyBytes = 1 << 20

	// upstreamTimeout bounds the Jev calls one request may trigger, so a slow
	// upstream cannot hold a Cloud Run instance open. A full batch is
	// maxPosts/concurrency rounds of a few hundred milliseconds, plus room
	// for the documented backoff after a rate limit.
	upstreamTimeout = 60 * time.Second
)

// New returns the service handler. The service is API only: the page lives on
// GitHub Pages, so the root has nothing to serve.
func New(s *scorer.Scorer, logger *slog.Logger) http.Handler {
	h := &handlers{scorer: s}
	mux := http.NewServeMux()

	// Not /healthz: Google Front End intercepts that exact path on *.run.app
	// and answers it itself, so the request never reaches the container.
	mux.HandleFunc("GET /health", h.health)

	mux.HandleFunc("POST /api/score", h.score)
	mux.HandleFunc("GET /api/questions", h.questions)

	mux.HandleFunc("GET /", h.notFound)

	return withLogging(logger, withCORS(mux))
}

type handlers struct {
	scorer *scorer.Scorer
}

func (h *handlers) health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *handlers) notFound(w http.ResponseWriter, r *http.Request) {
	writeError(w, http.StatusNotFound, "no such endpoint: "+r.URL.Path)
}

// questions reports what the model is being asked. The page shows it so that a
// reader can see the wording behind a number instead of guessing at it.
func (h *handlers) questions(w http.ResponseWriter, r *http.Request) {
	type described struct {
		Type         string `json:"type"`
		Instructions string `json:"instructions"`
		Criteria     any    `json:"criteria,omitempty"`
	}
	out := map[string]described{}
	for key, q := range recommend.Questions() {
		out[key] = described{Type: string(q.Type), Instructions: q.Instructions, Criteria: q.Criteria}
	}
	writeJSON(w, http.StatusOK, map[string]any{"questions": out})
}

type scoreRequest struct {
	Posts []scorer.Post `json:"posts"`
}

type scoreResponse struct {
	Results []scorer.Result `json:"results"`
}

func (h *handlers) score(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)

	var req scoreRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		var tooLarge *http.MaxBytesError
		if errors.As(err, &tooLarge) {
			writeError(w, http.StatusRequestEntityTooLarge, "request body is too large")
			return
		}
		writeError(w, http.StatusBadRequest, "could not parse the request body: "+err.Error())
		return
	}

	posts, err := cleanPosts(req.Posts)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), upstreamTimeout)
	defer cancel()

	writeJSON(w, http.StatusOK, scoreResponse{Results: h.scorer.Score(ctx, posts)})
}

// cleanPosts rejects a batch that cannot be judged and trims the rest. A post
// with no content is dropped rather than sent: it would cost a request to be
// told that an empty string says nothing.
func cleanPosts(in []scorer.Post) ([]scorer.Post, error) {
	if len(in) == 0 {
		return nil, errors.New("no posts to score")
	}
	if len(in) > maxPosts {
		return nil, fmt.Errorf("too many posts: %d, the limit is %d", len(in), maxPosts)
	}

	out := make([]scorer.Post, 0, len(in))
	for _, p := range in {
		content := strings.TrimSpace(p.Content)
		if content == "" {
			continue
		}
		if runes := []rune(content); len(runes) > maxContentRunes {
			content = string(runes[:maxContentRunes])
		}
		out = append(out, scorer.Post{ID: p.ID, Content: content})
	}
	if len(out) == 0 {
		return nil, errors.New("every post was empty")
	}
	return out, nil
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(body); err != nil {
		// The status line is already out, so there is nowhere to report this
		// but the log, which withLogging does not see.
		slog.Default().Error("write response", "err", err)
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"status": "error", "message": message})
}

// withCORS opens the API to any origin, as the bird API does. The service
// holds a key but never accepts one, so a cross-origin caller gains nothing
// that a curl could not already reach.
func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Max-Age", "600")
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

func (r *statusRecorder) WriteHeader(status int) {
	r.status = status
	r.ResponseWriter.WriteHeader(status)
}
