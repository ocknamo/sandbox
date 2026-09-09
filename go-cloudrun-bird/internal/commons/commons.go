// Package commons is a small read-only client for the Wikimedia Commons
// MediaWiki API. It lists the images in a category together with the licence
// and author information a caller needs in order to credit them.
package commons

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"html"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"
)

// DefaultEndpoint is the Commons API entry point.
const DefaultEndpoint = "https://commons.wikimedia.org/w/api.php"

// Wikimedia asks every client to identify itself with a descriptive
// User-Agent, and rate-limits anonymous traffic that does not.
// https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_User-Agent_Policy
//
// The name must not start with "go-": Wikimedia blocks that prefix outright to
// keep out unattended "Go-http-client" traffic, and answers 403 before the
// request reaches the API. Keep the product name and the contact URL.
const DefaultUserAgent = "bird-api/1.0 (+https://github.com/ocknamo/sandbox)"

// Limits applied to every candidate file. Category members include audio
// recordings, range maps, diagrams and thumbnails; only photographs large
// enough to look at are kept.
const (
	minWidth     = 800
	minHeight    = 600
	maxFileBytes = 20 << 20
)

var allowedMIME = map[string]bool{
	"image/jpeg": true,
	"image/png":  true,
	"image/webp": true,
}

// ErrNoImages reports a category that contains nothing this client can serve.
var ErrNoImages = errors.New("no usable images")

// Image is one usable picture from a category.
type Image struct {
	Title       string `json:"title"`
	URL         string `json:"url"`
	SourcePage  string `json:"source_page"`
	Artist      string `json:"artist,omitempty"`
	Credit      string `json:"credit,omitempty"`
	License     string `json:"license,omitempty"`
	LicenseURL  string `json:"license_url,omitempty"`
	Description string `json:"description,omitempty"`
	Width       int    `json:"width"`
	Height      int    `json:"height"`
	MIME        string `json:"mime"`
}

// Client reads image metadata from a MediaWiki API endpoint.
type Client struct {
	Endpoint   string
	UserAgent  string
	HTTPClient *http.Client

	// PerPage is how many category members to ask for in one request, and
	// MaxPages how many such requests to chain. Commons returns category
	// members in alphabetical order, so more than one page is worth fetching:
	// with a single page a large category would only ever serve its A's.
	PerPage  int
	MaxPages int

	// Retries is how many extra attempts a request gets after a 429 or a 5xx.
	Retries int
}

// New returns a client with the defaults used by the service.
func New() *Client {
	return &Client{
		Endpoint:   DefaultEndpoint,
		UserAgent:  DefaultUserAgent,
		HTTPClient: &http.Client{Timeout: 15 * time.Second},
		PerPage:    100,
		MaxPages:   2,
		Retries:    2,
	}
}

// APIError is an error reported by MediaWiki itself.
type APIError struct {
	Code string
	Info string
}

func (e *APIError) Error() string { return fmt.Sprintf("commons api error %s: %s", e.Code, e.Info) }

type apiResponse struct {
	Error *struct {
		Code string `json:"code"`
		Info string `json:"info"`
	} `json:"error"`
	Continue map[string]string `json:"continue"`
	Query    struct {
		Pages []apiPage `json:"pages"`
	} `json:"query"`
}

type apiPage struct {
	Title     string      `json:"title"`
	ImageInfo []imageInfo `json:"imageinfo"`
}

type imageInfo struct {
	URL            string             `json:"url"`
	DescriptionURL string             `json:"descriptionurl"`
	MIME           string             `json:"mime"`
	MediaType      string             `json:"mediatype"`
	Size           int64              `json:"size"`
	Width          int                `json:"width"`
	Height         int                `json:"height"`
	ExtMetadata    map[string]extItem `json:"extmetadata"`
}

type extItem struct {
	Value json.RawMessage `json:"value"`
}

// CategoryImages returns the usable photographs in a Commons category, such as
// "Category:Bubo bubo".
func (c *Client) CategoryImages(ctx context.Context, category string) ([]Image, error) {
	var (
		images    []Image
		continues map[string]string
		seen      = map[string]bool{}
	)
	for page := 0; page < c.maxPages(); page++ {
		resp, err := c.query(ctx, category, continues)
		if err != nil {
			// Pages already collected are still useful; only a failure on the
			// first page leaves the caller with nothing to serve.
			if page > 0 {
				break
			}
			return nil, err
		}
		for _, p := range resp.Query.Pages {
			if len(p.ImageInfo) == 0 {
				continue
			}
			img, ok := toImage(p.Title, p.ImageInfo[0])
			if !ok || seen[img.URL] {
				continue
			}
			seen[img.URL] = true
			images = append(images, img)
		}
		if len(resp.Continue) == 0 {
			break
		}
		continues = resp.Continue
	}
	if len(images) == 0 {
		return nil, fmt.Errorf("%w in %q", ErrNoImages, category)
	}
	return images, nil
}

func (c *Client) query(ctx context.Context, category string, cont map[string]string) (*apiResponse, error) {
	params := url.Values{
		"action":                {"query"},
		"format":                {"json"},
		"formatversion":         {"2"},
		"generator":             {"categorymembers"},
		"gcmtitle":              {category},
		"gcmtype":               {"file"},
		"gcmlimit":              {strconv.Itoa(c.perPage())},
		"prop":                  {"imageinfo"},
		"iiprop":                {"url|mediatype|mime|size|extmetadata"},
		"iiextmetadatafilter":   {"Artist|Credit|LicenseShortName|LicenseUrl|ImageDescription"},
		"iiextmetadatalanguage": {"en"},
	}
	for k, v := range cont {
		params.Set(k, v)
	}

	endpoint := c.Endpoint
	if endpoint == "" {
		endpoint = DefaultEndpoint
	}

	var lastErr error
	for attempt := 0; attempt <= c.retries(); attempt++ {
		if attempt > 0 {
			// Back off before retrying: the API rate-limits anonymous clients,
			// and hammering it is what got us throttled in the first place.
			delay := time.Duration(1<<uint(attempt-1)) * time.Second
			select {
			case <-ctx.Done():
				return nil, ctx.Err()
			case <-time.After(delay):
			}
		}
		resp, retryable, err := c.do(ctx, endpoint+"?"+params.Encode())
		if err == nil {
			return resp, nil
		}
		lastErr = err
		if !retryable || ctx.Err() != nil {
			break
		}
	}
	return nil, lastErr
}

func (c *Client) do(ctx context.Context, u string) (_ *apiResponse, retryable bool, _ error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, false, err
	}
	req.Header.Set("User-Agent", c.userAgent())
	req.Header.Set("Accept", "application/json")

	client := c.HTTPClient
	if client == nil {
		client = http.DefaultClient
	}
	resp, err := client.Do(req)
	if err != nil {
		return nil, true, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 8<<20))
	if err != nil {
		return nil, true, err
	}
	if resp.StatusCode != http.StatusOK {
		retry := resp.StatusCode == http.StatusTooManyRequests || resp.StatusCode >= 500
		return nil, retry, fmt.Errorf("commons responded %s", resp.Status)
	}

	var parsed apiResponse
	if err := json.Unmarshal(body, &parsed); err != nil {
		return nil, false, fmt.Errorf("decode commons response: %w", err)
	}
	if parsed.Error != nil {
		return nil, false, &APIError{Code: parsed.Error.Code, Info: parsed.Error.Info}
	}
	return &parsed, false, nil
}

func toImage(title string, info imageInfo) (Image, bool) {
	if info.MediaType != "BITMAP" || !allowedMIME[info.MIME] {
		return Image{}, false
	}
	if info.Width < minWidth || info.Height < minHeight || info.Size > maxFileBytes {
		return Image{}, false
	}
	u := stripTracking(info.URL)
	if u == "" {
		return Image{}, false
	}
	meta := func(key string) string { return plainText(extValue(info.ExtMetadata, key)) }
	return Image{
		Title:       title,
		URL:         u,
		SourcePage:  info.DescriptionURL,
		Artist:      meta("Artist"),
		Credit:      meta("Credit"),
		License:     meta("LicenseShortName"),
		LicenseURL:  strings.TrimSpace(extValue(info.ExtMetadata, "LicenseUrl")),
		Description: truncate(meta("ImageDescription"), 300),
		Width:       info.Width,
		Height:      info.Height,
		MIME:        info.MIME,
	}, true
}

func extValue(meta map[string]extItem, key string) string {
	entry, ok := meta[key]
	if !ok {
		return ""
	}
	// extmetadata values are usually strings but can be numbers or booleans.
	var s string
	if err := json.Unmarshal(entry.Value, &s); err == nil {
		return s
	}
	return strings.Trim(string(entry.Value), `"`)
}

// stripTracking removes the utm_* parameters the API appends to image URLs, so
// responses carry a clean, cacheable link to the file. A URL that is not https
// is dropped rather than served: these links end up in browsers' <img> tags.
func stripTracking(raw string) string {
	u, err := url.Parse(raw)
	if err != nil || u.Scheme != "https" {
		return ""
	}
	q := u.Query()
	for key := range q {
		if strings.HasPrefix(key, "utm_") {
			q.Del(key)
		}
	}
	u.RawQuery = q.Encode()
	return u.String()
}

var tagPattern = regexp.MustCompile(`(?s)<[^>]*>`)

// plainText flattens the small HTML fragments Commons stores in extmetadata
// (author links, formatted descriptions) into text safe to place in JSON.
func plainText(s string) string {
	if s == "" {
		return ""
	}
	s = tagPattern.ReplaceAllString(s, " ")
	s = html.UnescapeString(s)
	return strings.Join(strings.Fields(s), " ")
}

func truncate(s string, max int) string {
	runes := []rune(s)
	if len(runes) <= max {
		return s
	}
	return strings.TrimSpace(string(runes[:max])) + "…"
}

func (c *Client) perPage() int {
	if c.PerPage <= 0 {
		return 100
	}
	return c.PerPage
}

func (c *Client) maxPages() int {
	if c.MaxPages <= 0 {
		return 1
	}
	return c.MaxPages
}

func (c *Client) retries() int {
	if c.Retries < 0 {
		return 0
	}
	return c.Retries
}

func (c *Client) userAgent() string {
	if c.UserAgent == "" {
		return DefaultUserAgent
	}
	return c.UserAgent
}
