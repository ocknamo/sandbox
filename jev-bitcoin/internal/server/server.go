// Package server wires the HTTP routes for the Q&A.
//
// The service exists for the same reason the other Jev services here do:
// api.typesafe.ai answers a browser with "Disallowed CORS origin", and an API
// key could not live in a static page even if it did not. The corpus lives
// here too, compiled into the binary, so an answer can never be out of step
// with the questions the model was shown.
//
// Only POST /api/ask costs anything. Everything a reader can reach from an
// answer — a suggestion, a related question, a permalink — is looked up by its
// number with GET /api/faq/{id}, which never calls the model.
//
// There is deliberately no endpoint that lists the questions. The page is an
// owl you ask, not a table of contents, and the list is not published.
package server

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/ocknamo/sandbox/jev-bitcoin/internal/faq"
	"github.com/ocknamo/sandbox/jev-bitcoin/internal/router"
)

const (
	// maxBodyBytes bounds a request before any of it is parsed. A question
	// is a sentence or two, so this is generous.
	maxBodyBytes = 1 << 14

	// upstreamTimeout bounds the Jev calls one question triggers, so a slow
	// upstream cannot hold a Cloud Run instance open.
	upstreamTimeout = 30 * time.Second
)

// Options are what the service needs to run.
type Options struct {
	Corpus *faq.Corpus
	Router *router.Router
	Logger *slog.Logger

	// Limiter bounds how often one client may ask. Nil means no limit, which
	// is what the tests want and nothing else does.
	Limiter *Limiter
	// Cache remembers recent routings. Nil means none.
	Cache *Cache

	// Debug adds the model's own numbers to every answer, for tuning the
	// thresholds against real inputs.
	Debug bool
}

// New returns the service handler.
func New(o Options) http.Handler {
	h := &handlers{opts: o}
	mux := http.NewServeMux()

	// Not /healthz: Google Front End intercepts that exact path on *.run.app
	// and answers it itself, so the request never reaches the container.
	mux.HandleFunc("GET /health", h.health)

	mux.HandleFunc("GET /api/faq/{id}", h.entry)
	mux.HandleFunc("POST /api/ask", h.ask)

	mux.HandleFunc("GET /", h.notFound)

	return withLogging(h.logger(), withCORS(mux))
}

type handlers struct{ opts Options }

func (h *handlers) health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *handlers) notFound(w http.ResponseWriter, r *http.Request) {
	writeError(w, http.StatusNotFound, "no such endpoint: "+r.URL.Path)
}

// categoryRef names a category.
type categoryRef struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// ref is a question as a link to it.
type ref struct {
	ID       string      `json:"id"`
	Title    string      `json:"title"`
	Category categoryRef `json:"category"`
	Answered bool        `json:"answered"`
}

func refOf(q *faq.Question) ref {
	return ref{ID: q.ID, Title: q.Title, Category: catRef(q.Category), Answered: q.Answered()}
}

func catRef(c *faq.Category) categoryRef { return categoryRef{ID: c.ID, Name: c.Name} }

// entryView is one question and its answer.
type entryView struct {
	ref
	Answer  []string `json:"answer"`
	More    []string `json:"more,omitempty"`
	Related []ref    `json:"related,omitempty"`
	Sources []string `json:"sources,omitempty"`
	Updated string   `json:"updated,omitempty"`
}

func (h *handlers) view(q *faq.Question) entryView {
	v := entryView{
		ref:     refOf(q),
		Answer:  q.Answer,
		More:    q.More,
		Sources: q.Sources,
		Updated: q.Updated,
	}
	if v.Answer == nil {
		v.Answer = []string{}
	}
	for _, id := range q.Related {
		if r := h.opts.Corpus.Question(id); r != nil {
			v.Related = append(v.Related, refOf(r))
		}
	}
	return v
}

func (h *handlers) entry(w http.ResponseWriter, r *http.Request) {
	q := h.opts.Corpus.Question(r.PathValue("id"))
	if q == nil {
		writeError(w, http.StatusNotFound, "no such question")
		return
	}
	w.Header().Set("Cache-Control", "public, max-age=300")
	writeJSON(w, http.StatusOK, h.view(q))
}

type askRequest struct {
	Question string `json:"question"`
}

// scored is a candidate as the page sees it.
type scored struct {
	ref
	Score float64 `json:"score"`
}

type categoryScore struct {
	categoryRef
	P float64 `json:"p"`
}

type askResponse struct {
	// Status is answer, suggest or miss.
	Status string `json:"status"`
	Kind   string `json:"kind,omitempty"`

	// Answer is the answered question, when Status is answer.
	Answer *entryView `json:"answer,omitempty"`
	// Expand says the longer half of the answer should start open, because
	// the question read as a technical one.
	Expand bool `json:"expand,omitempty"`

	// Message is what to say instead of an answer, when there is none.
	Message []string `json:"message,omitempty"`
	// Suggestions are the close calls, offered as "もしかして".
	Suggestions []scored `json:"suggestions,omitempty"`

	// Categories are the likeliest categories, for showing why. They are
	// not secret: they are what the page is about.
	Categories []categoryScore `json:"categories"`

	Debug *debugView `json:"debug,omitempty"`
}

type debugView struct {
	Candidates     []debugCandidate   `json:"candidates"`
	Categories     map[string]float64 `json:"categories"`
	Kind           string             `json:"kind"`
	KindConfidence float64            `json:"kind_confidence"`
	Level          string             `json:"level"`
	Requests       int                `json:"requests"`
	InputTokens    int                `json:"input_tokens"`
	Cached         bool               `json:"cached"`
}

type debugCandidate struct {
	ID         string  `json:"id"`
	Title      string  `json:"title"`
	Score      float64 `json:"score"`
	Category   float64 `json:"category"`
	InCategory float64 `json:"in_category"`
	BeatsNone  bool    `json:"beats_none"`
}

func (h *handlers) ask(w http.ResponseWriter, r *http.Request) {
	var req askRequest
	if !decode(w, r, &req) {
		return
	}
	input := router.Clean(req.Question)
	if input == "" {
		writeError(w, http.StatusBadRequest, "no question was sent")
		return
	}

	// A question somebody asked a minute ago is answered from memory, and
	// does not count against the limit: it costs nothing.
	res, cached := h.opts.Cache.Get(input)
	if !cached {
		if !h.opts.Limiter.Allow(clientIP(r)) {
			w.Header().Set("Retry-After", "60")
			writeError(w, http.StatusTooManyRequests, "質問が続いています。少し時間をおいてからもう一度どうぞ。")
			return
		}
		ctx, cancel := context.WithTimeout(r.Context(), upstreamTimeout)
		defer cancel()
		var err error
		res, err = h.opts.Router.Route(ctx, input)
		if err != nil {
			h.logger().Error("route", "err", err)
			writeError(w, http.StatusBadGateway, "質問を読み取れませんでした。時間をおいてもう一度お試しください。")
			return
		}
		h.opts.Cache.Put(input, res)
	}

	resp := h.respond(res)
	if res.Status != router.Answer && !cached {
		// What the corpus could not answer is what it should answer next.
		// The input is logged only here, where it names a gap.
		var near []string
		for _, c := range res.Candidates {
			near = append(near, c.Question.ID)
		}
		h.logger().Info("unanswered", "input", input, "status", string(res.Status), "kind", res.Kind, "near", near)
	}
	if h.opts.Debug {
		resp.Debug = debugOf(res, cached)
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h *handlers) respond(res *router.Result) askResponse {
	resp := askResponse{Status: string(res.Status), Kind: res.Kind, Categories: h.topCategories(res)}
	switch res.Status {
	case router.Answer:
		v := h.view(res.Best)
		resp.Answer = &v
		resp.Expand = res.Level == router.LevelTechnical && len(v.More) > 0
	default:
		for _, c := range res.Suggestions(h.opts.Router.Policy) {
			resp.Suggestions = append(resp.Suggestions, scored{ref: refOf(c.Question), Score: round(c.Score)})
		}
		resp.Message = message(res, len(resp.Suggestions) > 0)
	}
	return resp
}

// topCategories is the likeliest three categories above a tenth.
func (h *handlers) topCategories(res *router.Result) []categoryScore {
	out := []categoryScore{}
	for _, c := range h.opts.Corpus.Categories {
		if p := res.Categories[c.ID]; p >= 0.1 {
			out = append(out, categoryScore{categoryRef: catRef(c), P: round(p)})
		}
	}
	// Stable, small, and sorted by hand to keep the corpus order on ties.
	for i := 1; i < len(out); i++ {
		for j := i; j > 0 && out[j].P > out[j-1].P; j-- {
			out[j], out[j-1] = out[j-1], out[j]
		}
	}
	if len(out) > 3 {
		out = out[:3]
	}
	return out
}

func debugOf(res *router.Result, cached bool) *debugView {
	d := &debugView{
		Categories:     res.Categories,
		Kind:           res.Kind,
		KindConfidence: res.KindConfidence,
		Level:          res.Level,
		Requests:       res.Requests,
		InputTokens:    res.InputTokens,
		Cached:         cached,
	}
	for _, c := range res.Candidates {
		d.Candidates = append(d.Candidates, debugCandidate{
			ID: c.Question.ID, Title: c.Question.Title,
			Score: round(c.Score), Category: round(c.Category), InCategory: round(c.InCategory),
			BeatsNone: c.BeatsNone,
		})
	}
	return d
}

func round(f float64) float64 { return float64(int(f*1000+0.5)) / 1000 }

func (h *handlers) logger() *slog.Logger {
	if h.opts.Logger != nil {
		return h.opts.Logger
	}
	return slog.Default()
}

// clientIP is who is asking, for the rate limit. Cloud Run puts the caller
// first in X-Forwarded-For; locally there is only the socket.
func clientIP(r *http.Request) string {
	if fwd := r.Header.Get("X-Forwarded-For"); fwd != "" {
		first, _, _ := strings.Cut(fwd, ",")
		return strings.TrimSpace(first)
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

func decode(w http.ResponseWriter, r *http.Request, into any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
	if err := json.NewDecoder(r.Body).Decode(into); err != nil {
		var tooLarge *http.MaxBytesError
		if errors.As(err, &tooLarge) {
			writeError(w, http.StatusRequestEntityTooLarge, "request body is too large")
			return false
		}
		writeError(w, http.StatusBadRequest, "could not parse the request body: "+err.Error())
		return false
	}
	return true
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

// withCORS opens the API to any origin, as the other services here do. The
// service holds a key but never accepts one, so a cross-origin caller gains
// nothing a curl could not already reach.
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
