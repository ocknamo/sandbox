// Command server runs the bird API: an HTTP service that returns a random bird
// picture from Wikimedia Commons, in the shape of the Dog API.
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

	"github.com/ocknamo/sandbox/go-cloudrun-bird/internal/birds"
	"github.com/ocknamo/sandbox/go-cloudrun-bird/internal/catalog"
	"github.com/ocknamo/sandbox/go-cloudrun-bird/internal/commons"
	"github.com/ocknamo/sandbox/go-cloudrun-bird/internal/server"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	cat, err := catalog.Load()
	if err != nil {
		logger.Error("load catalog", "err", err)
		os.Exit(1)
	}

	client := commons.New()
	if endpoint := os.Getenv("BIRD_COMMONS_ENDPOINT"); endpoint != "" {
		client.Endpoint = endpoint
	}
	if ua := os.Getenv("BIRD_USER_AGENT"); ua != "" {
		client.UserAgent = ua
	}

	svc := birds.New(cat, client, envDuration("BIRD_CACHE_TTL", birds.DefaultTTL, logger), logger)

	// Cloud Run injects PORT and requires the container to listen on it.
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:              net.JoinHostPort("", port),
		Handler:           server.New(svc, logger),
		ReadHeaderTimeout: 10 * time.Second,
	}

	// Cloud Run sends SIGTERM before shutting an instance down.
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	// Warm a few species in the background so the first request is not the one
	// paying for a cold cache. It never blocks startup: Cloud Run wants the
	// port open promptly, and a missing cache entry is only a slower request.
	go svc.Prewarm(ctx, envInt("BIRD_PREWARM_COUNT", 6, logger), time.Second)

	go func() {
		logger.Info("listening", "port", port, "species", len(cat.Species()))
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

func envDuration(key string, fallback time.Duration, logger *slog.Logger) time.Duration {
	raw := os.Getenv(key)
	if raw == "" {
		return fallback
	}
	d, err := time.ParseDuration(raw)
	if err != nil || d <= 0 {
		logger.Warn("ignoring invalid duration", "env", key, "value", raw)
		return fallback
	}
	return d
}

func envInt(key string, fallback int, logger *slog.Logger) int {
	raw := os.Getenv(key)
	if raw == "" {
		return fallback
	}
	n, err := strconv.Atoi(raw)
	if err != nil || n < 0 {
		logger.Warn("ignoring invalid integer", "env", key, "value", raw)
		return fallback
	}
	return n
}
