// Command server is the scoring API behind the GitHub Pages demo, built to run
// on Cloud Run.
//
// It exists because a browser cannot call Jev directly: api.typesafe.ai
// answers an unknown origin with "Disallowed CORS origin", and a static page
// has nowhere to keep an API key in any case.
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

	"github.com/ocknamo/sandbox/jev-nostr/internal/jev"
	"github.com/ocknamo/sandbox/jev-nostr/internal/scorer"
	"github.com/ocknamo/sandbox/jev-nostr/internal/server"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	apiKey := os.Getenv("TYPESAFE_API_KEY")
	if apiKey == "" {
		// Fail at startup rather than on the first request: Cloud Run reports
		// a revision that will not start, while one that starts and then 500s
		// on everything looks healthy until someone uses it.
		logger.Error("TYPESAFE_API_KEY is not set")
		os.Exit(1)
	}

	client := jev.New(apiKey)
	if model := os.Getenv("JEV_MODEL"); model != "" {
		client.Model = model
	}
	// An override so the service can be run against a stub during
	// development, the same escape hatch the CLI has.
	if endpoint := os.Getenv("TYPESAFE_ENDPOINT"); endpoint != "" {
		client.Endpoint = endpoint
		logger.Warn("using endpoint override", "endpoint", endpoint)
	}

	s := scorer.New(client)
	if raw := os.Getenv("JEV_CONCURRENCY"); raw != "" {
		n, err := strconv.Atoi(raw)
		if err != nil {
			logger.Error("JEV_CONCURRENCY is not a number", "value", raw)
			os.Exit(1)
		}
		s.SetConcurrency(n)
	}

	// Cloud Run injects PORT and requires the container to listen on it.
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:              net.JoinHostPort("", port),
		Handler:           server.New(s, logger),
		ReadHeaderTimeout: 10 * time.Second,
	}

	// Cloud Run sends SIGTERM before shutting an instance down.
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		logger.Info("listening", "port", port, "model", client.Model)
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
