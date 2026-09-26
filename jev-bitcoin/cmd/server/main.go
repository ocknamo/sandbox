// Command server is the Q&A's backend, built to run on Cloud Run.
//
// It holds what a browser cannot: the API key, since api.typesafe.ai answers
// an unknown origin with "Disallowed CORS origin" and a static page has
// nowhere to keep a key anyway.
package main

import (
	"context"
	"errors"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/ocknamo/sandbox/jev-bitcoin/internal/faq"
	"github.com/ocknamo/sandbox/jev-bitcoin/internal/jev"
	"github.com/ocknamo/sandbox/jev-bitcoin/internal/router"
	"github.com/ocknamo/sandbox/jev-bitcoin/internal/server"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	apiKey := os.Getenv("TYPESAFE_API_KEY")
	if apiKey == "" {
		// Fail at startup rather than on the first request: Cloud Run reports
		// a revision that will not start, while one that starts and then 500s
		// on everything looks healthy until someone asks it something.
		logger.Error("TYPESAFE_API_KEY is not set")
		os.Exit(1)
	}

	// A broken corpus — an answer for a question that does not exist, a
	// related link to nowhere — fails startup rather than one reader's answer.
	corpus, err := faq.Builtin()
	if err != nil {
		logger.Error("could not load the corpus", "err", err)
		os.Exit(1)
	}

	client := jev.New(apiKey)
	if model := os.Getenv("JEV_MODEL"); model != "" {
		client.Model = model
	}
	// An override so the service can be run against a stub during development,
	// the same escape hatch the other Jev services have.
	if endpoint := os.Getenv("TYPESAFE_ENDPOINT"); endpoint != "" {
		client.Endpoint = endpoint
		logger.Warn("using endpoint override", "endpoint", endpoint)
	}

	mode := router.Single
	switch m := os.Getenv("ROUTER_MODE"); m {
	case "", string(router.Single):
	case string(router.TwoStage):
		mode = router.TwoStage
	default:
		logger.Error("ROUTER_MODE must be single or two_stage", "value", m)
		os.Exit(1)
	}

	policy := router.DefaultPolicy()
	for _, t := range []struct {
		env   string
		field *float64
	}{
		{"MATCH_THRESHOLD", &policy.Match},
		{"MARGIN_THRESHOLD", &policy.Margin},
		{"FLOOR_THRESHOLD", &policy.Floor},
	} {
		if !setFloat(logger, t.env, t.field, 0, 1) {
			os.Exit(1)
		}
	}

	// The page asks by itself whenever typing pauses, so one reader writing
	// one question can send several. The limit is set for that, not for one
	// request per question.
	burst, perMinute := 30.0, 30.0
	if !setFloat(logger, "ASK_BURST", &burst, 1, 1000) || !setFloat(logger, "ASK_PER_MINUTE", &perMinute, 0, 1000) {
		os.Exit(1)
	}

	// Cloud Run injects PORT and requires the container to listen on it.
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr: net.JoinHostPort("", port),
		Handler: server.New(server.Options{
			Corpus:  corpus,
			Router:  &router.Router{Corpus: corpus, Asker: client, Policy: policy, Mode: mode},
			Logger:  logger,
			Limiter: server.NewLimiter(burst, perMinute),
			Cache:   server.NewCache(1024),
			Debug:   os.Getenv("QA_DEBUG") == "1",
		}),
		ReadHeaderTimeout: 10 * time.Second,
	}

	// Cloud Run sends SIGTERM before shutting an instance down.
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		logger.Info("listening", "port", port, "model", client.Model, "mode", mode,
			"questions", corpus.Len(), "answered", corpus.Answered())
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("server failed", "err", err)
			stop()
		}
	}()

	<-ctx.Done()
	logger.Info("shutting down")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error("graceful shutdown failed", "err", err)
		os.Exit(1)
	}
}

// setFloat reads an optional number from the environment into field.
func setFloat(logger *slog.Logger, env string, field *float64, lo, hi float64) bool {
	raw := os.Getenv(env)
	if raw == "" {
		return true
	}
	v, err := strconv.ParseFloat(raw, 64)
	if err != nil || v < lo || v > hi {
		logger.Error("setting out of range", "env", env, "value", raw, "min", lo, "max", hi)
		return false
	}
	*field = v
	return true
}
