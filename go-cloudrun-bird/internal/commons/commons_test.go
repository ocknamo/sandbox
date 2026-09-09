package commons

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"sync/atomic"
	"testing"
	"time"
)

// A trimmed page of what the Commons API actually returns for a category: one
// good photograph, one sound file, one thumbnail-sized image.
const categoryPage = `{
  "batchcomplete": true,
  "query": {
    "pages": [
      {
        "title": "File:Bubo bubo winter.jpg",
        "imageinfo": [{
          "url": "https://upload.wikimedia.org/wikipedia/commons/1/12/Bubo_bubo_winter.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo",
          "descriptionurl": "https://commons.wikimedia.org/wiki/File:Bubo_bubo_winter.jpg",
          "mime": "image/jpeg",
          "mediatype": "BITMAP",
          "size": 2500000,
          "width": 2400,
          "height": 1600,
          "extmetadata": {
            "Artist": { "value": "<a rel=\"nofollow\" href=\"https://example.org\">Jane &amp; Co</a>" },
            "LicenseShortName": { "value": "CC BY-SA 4.0" },
            "LicenseUrl": { "value": "https://creativecommons.org/licenses/by-sa/4.0" },
            "ImageDescription": { "value": "<p>An eagle-owl in the snow</p>" }
          }
        }]
      },
      {
        "title": "File:Bubo bubo call.mp3",
        "imageinfo": [{
          "url": "https://upload.wikimedia.org/wikipedia/commons/2/22/Bubo_bubo_call.mp3",
          "descriptionurl": "https://commons.wikimedia.org/wiki/File:Bubo_bubo_call.mp3",
          "mime": "audio/mpeg",
          "mediatype": "AUDIO",
          "size": 100000,
          "width": 0,
          "height": 0
        }]
      },
      {
        "title": "File:Bubo bubo tiny.jpg",
        "imageinfo": [{
          "url": "https://upload.wikimedia.org/wikipedia/commons/3/33/Bubo_bubo_tiny.jpg",
          "descriptionurl": "https://commons.wikimedia.org/wiki/File:Bubo_bubo_tiny.jpg",
          "mime": "image/jpeg",
          "mediatype": "BITMAP",
          "size": 12000,
          "width": 320,
          "height": 240
        }]
      }
    ]
  }
}`

func newTestClient(t *testing.T, handler http.HandlerFunc) *Client {
	t.Helper()
	srv := httptest.NewServer(handler)
	t.Cleanup(srv.Close)

	c := New()
	c.Endpoint = srv.URL
	c.HTTPClient = srv.Client()
	c.MaxPages = 1
	c.Retries = 0
	return c
}

func TestCategoryImagesKeepsOnlyUsablePhotographs(t *testing.T) {
	var gotQuery url.Values
	c := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		gotQuery = r.URL.Query()
		if r.Header.Get("User-Agent") == "" {
			t.Error("request sent without a User-Agent")
		}
		_, _ = w.Write([]byte(categoryPage))
	})

	images, err := c.CategoryImages(context.Background(), "Category:Bubo bubo")
	if err != nil {
		t.Fatalf("CategoryImages: %v", err)
	}
	if len(images) != 1 {
		t.Fatalf("got %d images, want 1 (audio and undersized files dropped)", len(images))
	}

	img := images[0]
	if strings.Contains(img.URL, "utm_") {
		t.Errorf("URL still carries tracking parameters: %s", img.URL)
	}
	if img.Artist != "Jane & Co" {
		t.Errorf("artist = %q, want %q (HTML flattened, entities decoded)", img.Artist, "Jane & Co")
	}
	if img.License != "CC BY-SA 4.0" {
		t.Errorf("license = %q, want %q", img.License, "CC BY-SA 4.0")
	}
	if img.LicenseURL != "https://creativecommons.org/licenses/by-sa/4.0" {
		t.Errorf("license URL = %q", img.LicenseURL)
	}
	if img.Description != "An eagle-owl in the snow" {
		t.Errorf("description = %q", img.Description)
	}
	if gotQuery.Get("gcmtitle") != "Category:Bubo bubo" {
		t.Errorf("gcmtitle = %q", gotQuery.Get("gcmtitle"))
	}
}

func TestCategoryImagesFollowsContinue(t *testing.T) {
	const secondPage = `{"query":{"pages":[{"title":"File:Second.jpg","imageinfo":[{
		"url":"https://upload.wikimedia.org/wikipedia/commons/4/44/Second.jpg",
		"descriptionurl":"https://commons.wikimedia.org/wiki/File:Second.jpg",
		"mime":"image/jpeg","mediatype":"BITMAP","size":900000,"width":1600,"height":1200}]}]}}`

	var calls atomic.Int32
	c := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		if calls.Add(1) == 1 {
			_, _ = w.Write([]byte(strings.Replace(categoryPage,
				`"batchcomplete": true,`,
				`"batchcomplete": true, "continue": {"gcmcontinue": "next-page", "continue": "gcmcontinue||"},`, 1)))
			return
		}
		if r.URL.Query().Get("gcmcontinue") != "next-page" {
			t.Errorf("second request did not carry the continuation token")
		}
		_, _ = w.Write([]byte(secondPage))
	})
	c.MaxPages = 2

	images, err := c.CategoryImages(context.Background(), "Category:Bubo bubo")
	if err != nil {
		t.Fatalf("CategoryImages: %v", err)
	}
	if len(images) != 2 {
		t.Fatalf("got %d images, want 2 across both pages", len(images))
	}
	if calls.Load() != 2 {
		t.Errorf("made %d requests, want 2", calls.Load())
	}
}

func TestCategoryImagesEmptyCategory(t *testing.T) {
	c := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`{"batchcomplete":true,"query":{"pages":[]}}`))
	})

	_, err := c.CategoryImages(context.Background(), "Category:Empty")
	if !errors.Is(err, ErrNoImages) {
		t.Fatalf("err = %v, want ErrNoImages", err)
	}
}

func TestCategoryImagesReportsAPIError(t *testing.T) {
	c := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`{"error":{"code":"invalidtitle","info":"Bad title"}}`))
	})

	_, err := c.CategoryImages(context.Background(), "Category:@@@")
	var apiErr *APIError
	if !errors.As(err, &apiErr) {
		t.Fatalf("err = %v, want *APIError", err)
	}
	if apiErr.Code != "invalidtitle" {
		t.Errorf("code = %q, want %q", apiErr.Code, "invalidtitle")
	}
}

func TestCategoryImagesRetriesOnRateLimit(t *testing.T) {
	var calls atomic.Int32
	c := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		if calls.Add(1) == 1 {
			http.Error(w, "too many requests", http.StatusTooManyRequests)
			return
		}
		_, _ = w.Write([]byte(categoryPage))
	})
	c.Retries = 1

	start := time.Now()
	images, err := c.CategoryImages(context.Background(), "Category:Bubo bubo")
	if err != nil {
		t.Fatalf("CategoryImages: %v", err)
	}
	if len(images) != 1 {
		t.Fatalf("got %d images, want 1", len(images))
	}
	if calls.Load() != 2 {
		t.Errorf("made %d requests, want 2 (one rejected, one retried)", calls.Load())
	}
	if time.Since(start) < time.Second {
		t.Error("retry did not back off before the second attempt")
	}
}

func TestCategoryImagesGivesUpOnRepeatedRateLimits(t *testing.T) {
	c := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "too many requests", http.StatusTooManyRequests)
	})

	if _, err := c.CategoryImages(context.Background(), "Category:Bubo bubo"); err == nil {
		t.Fatal("expected an error when every attempt is rate-limited")
	}
}
