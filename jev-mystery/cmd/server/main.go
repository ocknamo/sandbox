// Command server is the game's backend, built to run on Cloud Run.
//
// It holds two things a browser cannot: the API key, since api.typesafe.ai
// answers an unknown origin with "Disallowed CORS origin" and a static page
// has nowhere to keep a key anyway; and the scenario, since a page that had
// the scenario would have the answers.
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

	"github.com/ocknamo/sandbox/jev-mystery/internal/game"
	"github.com/ocknamo/sandbox/jev-mystery/internal/jev"
	"github.com/ocknamo/sandbox/jev-mystery/internal/scenario"
	"github.com/ocknamo/sandbox/jev-mystery/internal/server"
	"github.com/ocknamo/sandbox/jev-mystery/internal/session"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	apiKey := os.Getenv("TYPESAFE_API_KEY")
	if apiKey == "" {
		// Fail at startup rather than on the first request: Cloud Run reports
		// a revision that will not start, while one that starts and then 500s
		// on everything looks healthy until someone plays it.
		logger.Error("TYPESAFE_API_KEY is not set")
		os.Exit(1)
	}

	// Every case is served at once; the page picks one by its URL hash. A
	// broken scenario file fails startup rather than one player's game.
	cases, err := scenario.Builtins()
	if err != nil {
		logger.Error("could not load the cases", "err", err)
		os.Exit(1)
	}

	client := jev.New(apiKey)
	if model := os.Getenv("JEV_MODEL"); model != "" {
		client.Model = model
	}
	// An override so the service can be run against a stub during development,
	// the same escape hatch jev-nostr has.
	if endpoint := os.Getenv("TYPESAFE_ENDPOINT"); endpoint != "" {
		client.Endpoint = endpoint
		logger.Warn("using endpoint override", "endpoint", endpoint)
	}

	// Without a key here every instance signs with its own, so a player's game
	// stops working the moment Cloud Run starts a second instance or replaces
	// the first. It is a warning rather than an error because a local run has
	// one process and needs no secret to be set.
	secret := os.Getenv("GAME_SECRET")
	if secret == "" {
		logger.Warn("GAME_SECRET is not set; game states will not survive a restart or a second instance")
	}
	codec, err := session.New(secret)
	if err != nil {
		logger.Error("could not set up session signing", "err", err)
		os.Exit(1)
	}

	policy := game.DefaultPolicy()
	for _, t := range []struct {
		env   string
		field *float64
	}{
		{"MATCH_THRESHOLD", &policy.Match},
		{"CONFIDENCE_THRESHOLD", &policy.Confidence},
		{"FLAVOUR_THRESHOLD", &policy.Flavour},
		{"POINT_THRESHOLD", &policy.Point},
		{"CLOSED_THRESHOLD", &policy.Closed},
		{"ANSWER_THRESHOLD", &policy.Answer},
	} {
		raw := os.Getenv(t.env)
		if raw == "" {
			continue
		}
		v, err := strconv.ParseFloat(raw, 64)
		if err != nil || v < 0 || v > 1 {
			logger.Error("threshold must be a number between 0 and 1", "env", t.env, "value", raw)
			os.Exit(1)
		}
		*t.field = v
	}

	// Cloud Run injects PORT and requires the container to listen on it.
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr: net.JoinHostPort("", port),
		Handler: server.New(server.Options{
			Cases:   cases,
			Engine:  &game.Engine{Asker: client, Policy: policy},
			Session: codec,
			Logger:  logger,
			Debug:   os.Getenv("GAME_DEBUG") == "1",
		}),
		ReadHeaderTimeout: 10 * time.Second,
	}

	// Cloud Run sends SIGTERM before shutting an instance down.
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		logger.Info("listening", "port", port, "model", client.Model, "cases", scenario.BuiltinIDs())
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
