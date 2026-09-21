// Package jev is a small client for the TypeSafe System One API, the service
// behind the Jev model.
//
// It is not a chat API. A request carries the content to judge plus a set of
// named questions, and the answer to each question comes back as a typed value
// the caller can branch on directly. Every question in a request is evaluated
// in parallel, so asking five of them costs barely more time than asking one.
//
// https://docs.typesafe.ai/api
package jev

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"
)

const (
	// DefaultEndpoint is the System One evaluation endpoint.
	DefaultEndpoint = "https://api.typesafe.ai/v1/systemone"

	// DefaultModel is the alias that always points at the newest stable Jev.
	DefaultModel = "jev-latest"
)

// maxResponseBytes caps what a single answer may occupy in memory. Answers are
// small structured values, so anything larger means something has gone wrong.
const maxResponseBytes = 1 << 20

// QuestionType names one of the three primitives the API understands.
type QuestionType string

const (
	TypeNoul   QuestionType = "noul"   // a yes/no, answered as a 0-1 truth value
	TypeChoice QuestionType = "choice" // one option out of a named set
	TypeScore  QuestionType = "score"  // a level on an ordered rubric
)

// Question is one judgement to make about the state. Questions are meant to be
// narrow: the kind of call a knowledgeable person could make in a couple of
// seconds. Anything bigger belongs in several questions combined in Go.
type Question struct {
	Type         QuestionType `json:"type"`
	Instructions string       `json:"instructions"`

	// Criteria is shaped by Type: optional "true"/"false" descriptions for a
	// noul, a required option-to-description map for a choice, and a required
	// ordered list of level descriptions for a score. Use the Noul, Choice and
	// Score constructors rather than filling this in by hand.
	Criteria any `json:"criteria,omitempty"`
}

// Noul builds a yes/no question. The answer is a truth value between 0 and 1,
// not a bare boolean, so the caller picks its own threshold.
func Noul(instructions string) Question {
	return Question{Type: TypeNoul, Instructions: instructions}
}

// Choice builds a question answered with one of the option keys. Each option
// needs a description saying when it applies; up to 255 are allowed.
func Choice(instructions string, options map[string]string) Question {
	return Question{Type: TypeChoice, Instructions: instructions, Criteria: options}
}

// Option describes a choice option in more detail than a sentence can. The API
// accepts either form; this one earns its keep when options are easy to
// confuse with one another, where saying what an option is NOT for separates
// them better than any amount of saying what it is.
type Option struct {
	What     string   `json:"what"`
	NotFor   string   `json:"not_for,omitempty"`
	Examples []string `json:"examples,omitempty"`
}

// ChoiceOptions is Choice with structured descriptions.
func ChoiceOptions(instructions string, options map[string]Option) Question {
	return Question{Type: TypeChoice, Instructions: instructions, Criteria: options}
}

// Score builds a question answered with a level on a rubric. The levels are
// ordered from lowest to highest and the API accepts between 2 and 10 of them.
func Score(instructions string, levels []string) Question {
	return Question{Type: TypeScore, Instructions: instructions, Criteria: levels}
}

// Request is the body of a System One call.
type Request struct {
	// State is the content to judge: a string for plain text, or any
	// JSON-encodable value when the shape of the data is part of the
	// judgement. It may occupy up to 32k tokens.
	State     any                 `json:"state"`
	Model     string              `json:"model"`
	Questions map[string]Question `json:"questions"`
}

// Response is what the API sends back. Answers is keyed by the same names the
// request used for its questions.
type Response struct {
	Model   string            `json:"model"`
	Answers map[string]Answer `json:"answers"`
	Usage   Usage             `json:"usage"`
}

// Answer holds the result of one question. Only the fields belonging to Type
// are populated.
//
// The numbers are pointers because zero is a meaningful answer here: a Noul of
// 0 means "no", which is not the same thing as a field the server never sent.
type Answer struct {
	Type   QuestionType `json:"type"`
	Noul   *float64     `json:"noul,omitempty"`
	Choice string       `json:"choice,omitempty"`

	// Score is not an index into the rubric. It is the expected level: every
	// level number weighted by its probability and summed, so it falls
	// between levels. Levels count from 0, which makes the top of an n-level
	// rubric n-1.
	Score *float64 `json:"score,omitempty"`

	// Legend repeats the score rubric, keyed by level number as a string.
	// The values are strings because Score questions here are built from
	// plain level descriptions; the API returns objects instead when a
	// question supplies structured criteria.
	Legend map[string]string `json:"legend,omitempty"`

	// Probabilities is the distribution the answer was drawn from: keyed by
	// option name for a choice, by level number as a string for a score.
	Probabilities map[string]float64 `json:"probabilities,omitempty"`

	Confidence *float64 `json:"confidence,omitempty"`
}

// Usage reports what the request cost. Jev bills input tokens only.
type Usage struct {
	InputTokens  int `json:"input_tokens"`
	OutputTokens int `json:"output_tokens"`
}

// ErrNoAPIKey reports a client that was never given a key to authenticate with.
var ErrNoAPIKey = errors.New("jev: no API key")

// statusHints explains the status codes the API documents, so that a failure
// in a CI log says what to do rather than only printing a number.
var statusHints = map[int]string{
	http.StatusUnauthorized:        "invalid API key",
	http.StatusUnprocessableEntity: "request validation failed",
	http.StatusTooManyRequests:     "rate limit exceeded; retry with exponential backoff",
	529:                            "service overloaded; retry with exponential backoff",
}

// APIError is a non-2xx answer from the API.
type APIError struct {
	StatusCode int
	Body       string
}

func (e *APIError) Error() string {
	if hint, ok := statusHints[e.StatusCode]; ok {
		return fmt.Sprintf("jev: %d %s: %s", e.StatusCode, hint, e.Body)
	}
	return fmt.Sprintf("jev: %d: %s", e.StatusCode, e.Body)
}

// Client calls one System One endpoint. The zero value is not usable; build one
// with New.
type Client struct {
	APIKey     string
	Endpoint   string
	Model      string
	HTTPClient *http.Client

	// Retries is how many extra attempts a request gets after a rate limit or
	// an overload. The API asks for exponential backoff rather than an
	// immediate retry, which is what Retry-After and backoff below provide.
	// Other failures are not retried: a 401 or a 422 will fail again.
	Retries int
}

// New returns a client pointed at the public endpoint and the latest model.
func New(apiKey string) *Client {
	return &Client{
		APIKey:     apiKey,
		Endpoint:   DefaultEndpoint,
		Model:      DefaultModel,
		HTTPClient: &http.Client{Timeout: 30 * time.Second},
		Retries:    2,
	}
}

// retryable reports the statuses the API documents as worth trying again.
func retryable(status int) bool {
	return status == http.StatusTooManyRequests || status == 529
}

// backoff is how long to wait before attempt n (counting from 0), honouring a
// Retry-After header when the server sent one.
func backoff(attempt int, header string) time.Duration {
	if secs, err := strconv.Atoi(header); err == nil && secs >= 0 {
		return time.Duration(secs) * time.Second
	}
	return time.Duration(1<<attempt) * time.Second
}

// Ask puts every question to the model in a single call and decodes the result.
func (c *Client) Ask(ctx context.Context, state any, questions map[string]Question) (*Response, error) {
	raw, err := c.AskRaw(ctx, state, questions)
	if err != nil {
		return nil, err
	}
	var resp Response
	if err := json.Unmarshal(raw, &resp); err != nil {
		return nil, fmt.Errorf("jev: decode response: %w", err)
	}
	return &resp, nil
}

// AskRaw is Ask without the decoding step. It hands back the response body as
// it arrived, which is what you want while learning the shape of the API.
func (c *Client) AskRaw(ctx context.Context, state any, questions map[string]Question) ([]byte, error) {
	if c.APIKey == "" {
		return nil, ErrNoAPIKey
	}
	if len(questions) == 0 {
		return nil, errors.New("jev: no questions")
	}

	endpoint := c.Endpoint
	if endpoint == "" {
		endpoint = DefaultEndpoint
	}
	model := c.Model
	if model == "" {
		model = DefaultModel
	}

	body, err := json.Marshal(Request{State: state, Model: model, Questions: questions})
	if err != nil {
		return nil, fmt.Errorf("jev: encode request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("jev: build request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+c.APIKey)
	req.Header.Set("Content-Type", "application/json")

	httpClient := c.HTTPClient
	if httpClient == nil {
		httpClient = http.DefaultClient
	}

	for attempt := 0; ; attempt++ {
		// Each attempt needs its own reader: the first one has been consumed.
		req.Body = io.NopCloser(bytes.NewReader(body))

		data, status, retryAfter, err := c.attempt(httpClient, req)
		if err != nil {
			return nil, err
		}
		if status == http.StatusOK {
			return data, nil
		}

		apiErr := &APIError{StatusCode: status, Body: string(bytes.TrimSpace(data))}
		if attempt >= c.Retries || !retryable(status) {
			return nil, apiErr
		}
		select {
		case <-time.After(backoff(attempt, retryAfter)):
		case <-ctx.Done():
			return nil, fmt.Errorf("jev: %w while backing off from %w", ctx.Err(), apiErr)
		}
	}
}

// attempt performs one request and reads its body, whatever the status.
func (c *Client) attempt(httpClient *http.Client, req *http.Request) (body []byte, status int, retryAfter string, err error) {
	res, err := httpClient.Do(req)
	if err != nil {
		return nil, 0, "", fmt.Errorf("jev: request failed: %w", err)
	}
	defer res.Body.Close()

	data, err := io.ReadAll(io.LimitReader(res.Body, maxResponseBytes))
	if err != nil {
		return nil, 0, "", fmt.Errorf("jev: read response: %w", err)
	}
	return data, res.StatusCode, res.Header.Get("Retry-After"), nil
}
