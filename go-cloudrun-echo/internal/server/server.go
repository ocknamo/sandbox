// Package server wires the HTTP routes for the echo service.
package server

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"
)

// maxBodyBytes caps how much of a request body is read back, so an oversized
// upload cannot balloon the instance's memory.
const maxBodyBytes = 64 << 10

// redactedHeaders are echoed as "[redacted]". The service is public, so it must
// never reflect a caller's credentials back into a response or the logs.
var redactedHeaders = map[string]bool{
	"authorization":            true,
	"proxy-authorization":      true,
	"cookie":                   true,
	"x-goog-iap-jwt-assertion": true,
}

// New returns the service handler.
func New(logger *slog.Logger) http.Handler {
	mux := http.NewServeMux()
	// Not /healthz: Google Front End intercepts that exact path on *.run.app
	// and returns its own 404 without ever forwarding to the container.
	mux.HandleFunc("GET /health", handleHealth)
	mux.HandleFunc("/", handleEcho)
	return withLogging(logger, mux)
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

type echoResponse struct {
	Method    string            `json:"method"`
	Path      string            `json:"path"`
	Query     map[string]string `json:"query,omitempty"`
	Headers   map[string]string `json:"headers"`
	Body      string            `json:"body,omitempty"`
	Truncated bool              `json:"body_truncated,omitempty"`
	Service   string            `json:"service"`
	Revision  string            `json:"revision"`
	Time      string            `json:"time"`
}

func handleEcho(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
	body, err := io.ReadAll(r.Body)
	truncated := err != nil

	query := map[string]string{}
	for k, v := range r.URL.Query() {
		query[k] = strings.Join(v, ",")
	}

	headers := map[string]string{}
	for k, v := range r.Header {
		if redactedHeaders[strings.ToLower(k)] {
			headers[k] = "[redacted]"
			continue
		}
		headers[k] = strings.Join(v, ",")
	}

	writeJSON(w, http.StatusOK, echoResponse{
		Method:    r.Method,
		Path:      r.URL.Path,
		Query:     query,
		Headers:   headers,
		Body:      string(body),
		Truncated: truncated,
		Service:   envOr("K_SERVICE", "local"),
		Revision:  envOr("K_REVISION", "local"),
		Time:      time.Now().UTC().Format(time.RFC3339),
	})
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	enc := json.NewEncoder(w)
	enc.SetIndent("", "  ")
	_ = enc.Encode(body)
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
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
