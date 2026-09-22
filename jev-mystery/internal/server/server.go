// Package server wires the HTTP routes for the game.
//
// The service exists for the same reason jev-nostr's does: api.typesafe.ai
// answers a browser with "Disallowed CORS origin", and an API key could not
// live in a static page even if it did not.
//
// It has a second job here, though, and that one is the game itself. The
// scenario — every action the player has not found, and the solution — stays
// on this side. A response carries only what the player has earned: the prose
// for what just happened, where they are, and what they are holding. The list
// of things they could have typed is never sent, because being unable to see
// it is the game.
package server

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"time"

	"github.com/ocknamo/sandbox/jev-mystery/internal/game"
	"github.com/ocknamo/sandbox/jev-mystery/internal/scenario"
	"github.com/ocknamo/sandbox/jev-mystery/internal/session"
)

const (
	// maxBodyBytes bounds a request before any of it is parsed. A turn is one
	// short sentence and a state token, so this is generous.
	maxBodyBytes = 1 << 16

	// upstreamTimeout bounds the Jev call one turn triggers, so a slow
	// upstream cannot hold a Cloud Run instance open. One turn is one request
	// whose questions are evaluated in parallel.
	upstreamTimeout = 30 * time.Second
)

// Options are what the service needs to run.
type Options struct {
	// Cases is every case the service can serve. Which one is being played
	// comes from the request — the page routes on it — so one deployment
	// serves them all.
	Cases   *scenario.Library
	Engine  *game.Engine
	Session *session.Codec
	Logger  *slog.Logger

	// Debug adds the model's own numbers to a turn's response. It is for
	// tuning the thresholds against real inputs, and it has to stay off in
	// front of a player: a score of 0.38 against an option the player cannot
	// see still tells them one was nearly there.
	Debug bool
}

// New returns the service handler.
func New(o Options) http.Handler {
	h := &handlers{opts: o}
	mux := http.NewServeMux()

	// Not /healthz: Google Front End intercepts that exact path on *.run.app
	// and answers it itself, so the request never reaches the container.
	mux.HandleFunc("GET /health", h.health)

	mux.HandleFunc("GET /api/cases", h.cases)
	mux.HandleFunc("POST /api/new", h.newGame)
	mux.HandleFunc("POST /api/act", h.act)
	mux.HandleFunc("POST /api/accuse", h.accuse)

	mux.HandleFunc("GET /", h.notFound)

	logger := o.Logger
	if logger == nil {
		logger = slog.Default()
	}
	return withLogging(logger, withCORS(mux))
}

type handlers struct{ opts Options }

func (h *handlers) health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *handlers) notFound(w http.ResponseWriter, r *http.Request) {
	writeError(w, http.StatusNotFound, "no such endpoint: "+r.URL.Path)
}

// sceneView is a place as the player sees it.
type sceneView struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Description []string `json:"description"`
}

// charView is a person as the player sees them. Who is in the room is the one
// thing the game gives away for free; what asking them anything would do is
// not part of it.
type charView struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Role   string `json:"role"`
	Avatar string `json:"avatar"`

	// Image is the portrait, when the case gives one. It is left out rather
	// than sent empty, so the page tells "no picture" from "a picture".
	Image string `json:"image,omitempty"`
}

// person is one character as the page draws them.
func person(c *scenario.Character) charView {
	return charView{ID: c.ID, Name: c.Name, Role: c.Role, Avatar: c.Avatar, Image: c.Image}
}

type itemView struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

// view is the whole of what the page renders between turns.
type view struct {
	Scene    sceneView  `json:"scene"`
	People   []charView `json:"people"`
	Evidence []itemView `json:"evidence"`

	Turn     int  `json:"turn"`
	Finished bool `json:"finished"`

	// FinaleOpen says the player may now gather everyone. It is the only hint
	// the game volunteers, and it is one about the case's progress rather than
	// about what to type.
	FinaleOpen  bool     `json:"finale_open"`
	FinaleLabel string   `json:"finale_label,omitempty"`
	Suspects    []string `json:"suspects,omitempty"`
}

func (h *handlers) view(s *scenario.Scenario, st game.State) view {
	v := view{Turn: st.Turn, Finished: st.Finished}

	if sc := s.Scene(st.Scene); sc != nil {
		v.Scene = sceneView{ID: sc.ID, Name: sc.Name, Description: sc.Description}
		for _, id := range sc.Characters {
			if c := s.Character(id); c != nil {
				v.People = append(v.People, person(c))
			}
		}
	}
	for _, id := range st.Evidence {
		if e := s.Item(id); e != nil {
			v.Evidence = append(v.Evidence, itemView{ID: e.ID, Name: e.Name, Description: e.Description})
		}
	}
	if game.FinaleOpen(s, st) {
		v.FinaleOpen = true
		v.FinaleLabel = s.Finale.Label
		for _, c := range s.SuspectNames() {
			v.Suspects = append(v.Suspects, c.Name+"（"+c.Role+"）")
		}
	}
	return v
}

type casesResponse struct {
	Cases []scenario.Summary `json:"cases"`
}

// cases lists what can be played. A title is not a spoiler, and the page needs
// it to offer anything at all.
func (h *handlers) cases(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, casesResponse{Cases: h.opts.Cases.List()})
}

type newRequest struct {
	Case string `json:"case"`
}

type newResponse struct {
	State string `json:"state"`

	Title    string   `json:"title"`
	Byline   string   `json:"byline,omitempty"`
	Opening  []string `json:"opening"`
	Incident []string `json:"incident"`

	// Arrival describes the room the case opens in, so the log starts where
	// the player is standing rather than leaving them to infer it.
	Arrival []string `json:"arrival"`

	View view `json:"view"`
}

func (h *handlers) newGame(w http.ResponseWriter, r *http.Request) {
	var req newRequest
	if !decode(w, r, &req) {
		return
	}
	s := h.opts.Cases.Case(req.Case)
	if s == nil {
		writeError(w, http.StatusNotFound, "no such case: "+req.Case)
		return
	}
	st := game.New(s)

	token, err := h.opts.Session.Encode(st)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not start a game")
		return
	}

	writeJSON(w, http.StatusOK, newResponse{
		State:    token,
		Title:    s.Title,
		Byline:   s.Byline,
		Opening:  s.Opening,
		Incident: s.Incident,
		Arrival:  game.Describe(s, st),
		View:     h.view(s, st),
	})
}

type actRequest struct {
	State string `json:"state"`
	Input string `json:"input"`
}

// signals is the model's own reading of a turn, present only in debug mode.
type signals struct {
	Choice     string  `json:"choice"`
	Score      float64 `json:"score"`
	Confidence float64 `json:"confidence"`
	Intent     string  `json:"intent"`
	Declare    float64 `json:"declare"`
	Closed     float64 `json:"closed"`
	Askee      string  `json:"askee,omitempty"`
}

type actResponse struct {
	State string `json:"state"`

	// Matched says whether the input reached an action. The page uses it to
	// set the tone of the entry, not to reveal anything: a miss reads as the
	// world not responding, which is what it is.
	Matched bool      `json:"matched"`
	Did     string    `json:"did,omitempty"`
	Speaker *charView `json:"speaker,omitempty"`
	Text    []string  `json:"text"`

	Gained  []itemView `json:"gained,omitempty"`
	MovedTo string     `json:"moved_to,omitempty"`
	Finale  bool       `json:"finale,omitempty"`

	// Arrival is the room the player just walked into, described. It repeats
	// what the place panel shows, on purpose: the panel is the present tense
	// and the log is what happened, and a player reading the log should not
	// have to look away from it to find out where they now are.
	Arrival []string `json:"arrival,omitempty"`

	View    view     `json:"view"`
	Signals *signals `json:"signals,omitempty"`
}

func (h *handlers) act(w http.ResponseWriter, r *http.Request) {
	var req actRequest
	if !decode(w, r, &req) {
		return
	}
	s, st, ok := h.state(w, req.State)
	if !ok {
		return
	}
	if st.Finished {
		writeError(w, http.StatusConflict, "this case is closed")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), upstreamTimeout)
	defer cancel()

	st, turn, err := h.opts.Engine.Play(ctx, s, st, req.Input)
	if err != nil {
		if errors.Is(err, game.ErrNoInput) {
			writeError(w, http.StatusBadRequest, "nothing was typed")
			return
		}
		h.logger().Error("play", "err", err)
		writeError(w, http.StatusBadGateway, "the judgement could not be made")
		return
	}

	token, err := h.opts.Session.Encode(st)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not save the game")
		return
	}

	resp := actResponse{
		State:   token,
		Matched: turn.Matched,
		Text:    turn.Text,
		Finale:  turn.Finale,
		Arrival: turn.Arrival,
		View:    h.view(s, st),
	}
	if turn.Outcome != nil {
		resp.Did = turn.Outcome.Did
		resp.MovedTo = turn.Outcome.MovedTo
		if c := s.Character(turn.Outcome.Speaker); c != nil {
			p := person(c)
			resp.Speaker = &p
		}
		for _, id := range turn.Outcome.Gained {
			if e := s.Item(id); e != nil {
				resp.Gained = append(resp.Gained, itemView{ID: e.ID, Name: e.Name, Description: e.Description})
			}
		}
	}
	if h.opts.Debug {
		resp.Signals = &signals{
			Choice: turn.Choice, Score: turn.Score,
			Confidence: turn.Confidence, Intent: turn.Intent, Declare: turn.Declare,
			Closed: turn.Closed, Askee: turn.Askee,
		}
	}
	writeJSON(w, http.StatusOK, resp)
}

type accuseRequest struct {
	State  string `json:"state"`
	Answer string `json:"answer"`
}

type pointView struct {
	Label string `json:"label"`
	Hit   bool   `json:"hit"`
}

type accuseResponse struct {
	State string `json:"state"`

	EndingID string   `json:"ending_id"`
	Title    string   `json:"title"`
	Text     []string `json:"text"`

	// Correct and Points are the scorecard, shown after the ending. They are
	// safe here and nowhere earlier: the case is over by the time they are
	// read.
	Correct   bool        `json:"correct"`
	NamedName string      `json:"named_name,omitempty"`
	Points    []pointView `json:"points"`

	Coherence       float64 `json:"coherence"`
	CoherenceTop    float64 `json:"coherence_top"`
	CoherenceLegend string  `json:"coherence_legend,omitempty"`
}

func (h *handlers) accuse(w http.ResponseWriter, r *http.Request) {
	var req accuseRequest
	if !decode(w, r, &req) {
		return
	}
	s, st, ok := h.state(w, req.State)
	if !ok {
		return
	}
	if st.Finished {
		writeError(w, http.StatusConflict, "this case is closed")
		return
	}
	// The gathering is a state the player reaches, not a screen they can open.
	if !game.FinaleOpen(s, st) {
		writeError(w, http.StatusConflict, "there is not enough to accuse anyone yet")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), upstreamTimeout)
	defer cancel()

	v, err := h.opts.Engine.Grade(ctx, s, req.Answer)
	if err != nil {
		if errors.Is(err, game.ErrNoInput) {
			writeError(w, http.StatusBadRequest, "nothing was written")
			return
		}
		h.logger().Error("grade", "err", err)
		writeError(w, http.StatusBadGateway, "the judgement could not be made")
		return
	}

	st.Finished = true
	token, err := h.opts.Session.Encode(st)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not close the game")
		return
	}

	resp := accuseResponse{
		State:           token,
		EndingID:        v.Ending.ID,
		Title:           v.Ending.Title,
		Text:            v.Ending.Text,
		Correct:         v.Correct,
		NamedName:       v.NamedName,
		Coherence:       v.Coherence,
		CoherenceTop:    v.CoherenceTop,
		CoherenceLegend: v.CoherenceLegend,
	}
	for _, p := range v.Points {
		resp.Points = append(resp.Points, pointView{Label: p.Label, Hit: p.Hit})
	}
	writeJSON(w, http.StatusOK, resp)
}

// state verifies a token and returns the case it belongs to. The case comes
// from the token rather than from the request, so a game cannot be moved to
// another case halfway through.
func (h *handlers) state(w http.ResponseWriter, token string) (*scenario.Scenario, game.State, bool) {
	var st game.State
	if token == "" {
		writeError(w, http.StatusBadRequest, "no game state was sent")
		return nil, st, false
	}
	if err := h.opts.Session.Decode(token, &st); err != nil {
		writeError(w, http.StatusBadRequest, "this game state is not valid; start a new game")
		return nil, st, false
	}
	s := h.opts.Cases.Case(st.Scenario)
	if s == nil {
		writeError(w, http.StatusConflict, "this game belongs to a case this service does not have")
		return nil, st, false
	}
	if s.Scene(st.Scene) == nil {
		writeError(w, http.StatusBadRequest, "this game state is not valid; start a new game")
		return nil, st, false
	}
	return s, st, true
}

func (h *handlers) logger() *slog.Logger {
	if h.opts.Logger != nil {
		return h.opts.Logger
	}
	return slog.Default()
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
