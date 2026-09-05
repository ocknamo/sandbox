package server

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func newTestHandler() http.Handler {
	return New(slog.New(slog.NewJSONHandler(io.Discard, nil)))
}

func do(t *testing.T, req *http.Request) (*httptest.ResponseRecorder, echoResponse) {
	t.Helper()
	rec := httptest.NewRecorder()
	newTestHandler().ServeHTTP(rec, req)
	var body echoResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode body: %v (raw: %s)", err, rec.Body.String())
	}
	return rec, body
}

func TestHealth(t *testing.T) {
	rec := httptest.NewRecorder()
	newTestHandler().ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/health", nil))

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
	}
	var body map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode body: %v", err)
	}
	if body["status"] != "ok" {
		t.Errorf("status field = %q, want %q", body["status"], "ok")
	}
}

func TestEchoReflectsRequest(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/some/path?a=1&b=2", strings.NewReader("hello"))
	req.Header.Set("X-Custom", "value")

	rec, body := do(t, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
	}
	if body.Method != http.MethodPost {
		t.Errorf("method = %q, want %q", body.Method, http.MethodPost)
	}
	if body.Path != "/some/path" {
		t.Errorf("path = %q, want %q", body.Path, "/some/path")
	}
	if body.Query["a"] != "1" || body.Query["b"] != "2" {
		t.Errorf("query = %v, want a=1 b=2", body.Query)
	}
	if body.Body != "hello" {
		t.Errorf("body = %q, want %q", body.Body, "hello")
	}
	if body.Headers["X-Custom"] != "value" {
		t.Errorf("X-Custom = %q, want %q", body.Headers["X-Custom"], "value")
	}
}

func TestEchoRedactsCredentialHeaders(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer super-secret-token")
	req.Header.Set("Cookie", "session=super-secret-session")

	_, body := do(t, req)

	for _, h := range []string{"Authorization", "Cookie"} {
		if body.Headers[h] != "[redacted]" {
			t.Errorf("%s = %q, want %q", h, body.Headers[h], "[redacted]")
		}
	}
	if strings.Contains(strings.ToLower(joinValues(body.Headers)), "super-secret") {
		t.Error("a credential value leaked into the echoed headers")
	}
}

func TestEchoTruncatesOversizedBody(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(strings.Repeat("x", maxBodyBytes+1)))

	_, body := do(t, req)

	if !body.Truncated {
		t.Error("body_truncated = false, want true for a body over the limit")
	}
	if len(body.Body) > maxBodyBytes {
		t.Errorf("echoed body length = %d, want <= %d", len(body.Body), maxBodyBytes)
	}
}

func joinValues(m map[string]string) string {
	var b strings.Builder
	for _, v := range m {
		b.WriteString(v)
		b.WriteString(" ")
	}
	return b.String()
}
