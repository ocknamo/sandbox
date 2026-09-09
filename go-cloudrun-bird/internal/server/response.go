package server

import (
	"github.com/ocknamo/sandbox/go-cloudrun-bird/internal/birds"
	"github.com/ocknamo/sandbox/go-cloudrun-bird/internal/catalog"
)

// singleResponse mirrors the Dog API's single-image response — "status" plus a
// "message" holding the URL — and adds the credit Commons images need.
type singleResponse struct {
	Status      string      `json:"status"`
	Message     string      `json:"message"`
	Bird        birdJSON    `json:"bird"`
	Attribution attribution `json:"attribution"`
}

// multiResponse mirrors the Dog API's multi-image response: "message" is a
// plain list of URLs. "images" carries the same pictures with their credits,
// in the same order.
type multiResponse struct {
	Status  string        `json:"status"`
	Message []string      `json:"message"`
	Images  []pictureJSON `json:"images"`
}

type listResponse struct {
	Status  string              `json:"status"`
	Message map[string][]string `json:"message"`
}

type catalogResponse struct {
	Status  string      `json:"status"`
	Message []groupJSON `json:"message"`
}

type errorResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	Code    int    `json:"code"`
}

type birdJSON struct {
	Group          string `json:"group"`
	Species        string `json:"species"`
	NameEN         string `json:"name_en"`
	NameJA         string `json:"name_ja"`
	ScientificName string `json:"scientific_name"`
}

type groupJSON struct {
	Slug    string     `json:"slug"`
	NameEN  string     `json:"name_en"`
	NameJA  string     `json:"name_ja"`
	Species []birdJSON `json:"species"`
}

// attribution is what a caller needs in order to use the picture: several
// Commons licences require naming the author and the licence.
type attribution struct {
	Title       string `json:"title"`
	Artist      string `json:"artist,omitempty"`
	License     string `json:"license,omitempty"`
	LicenseURL  string `json:"license_url,omitempty"`
	SourcePage  string `json:"source_page"`
	Description string `json:"description,omitempty"`
	Width       int    `json:"width"`
	Height      int    `json:"height"`
}

type pictureJSON struct {
	URL         string      `json:"url"`
	Bird        birdJSON    `json:"bird"`
	Attribution attribution `json:"attribution"`
}

func newBird(s catalog.Species) birdJSON {
	return birdJSON{
		Group:          s.Group,
		Species:        s.Slug,
		NameEN:         s.NameEN,
		NameJA:         s.NameJA,
		ScientificName: s.ScientificName,
	}
}

func newAttribution(p birds.Picture) attribution {
	return attribution{
		Title:       p.Image.Title,
		Artist:      p.Image.Artist,
		License:     p.Image.License,
		LicenseURL:  p.Image.LicenseURL,
		SourcePage:  p.Image.SourcePage,
		Description: p.Image.Description,
		Width:       p.Image.Width,
		Height:      p.Image.Height,
	}
}

func newMultiResponse(pictures []birds.Picture) multiResponse {
	urls := make([]string, 0, len(pictures))
	images := make([]pictureJSON, 0, len(pictures))
	for _, p := range pictures {
		urls = append(urls, p.Image.URL)
		images = append(images, pictureJSON{
			URL:         p.Image.URL,
			Bird:        newBird(p.Species),
			Attribution: newAttribution(p),
		})
	}
	return multiResponse{Status: "success", Message: urls, Images: images}
}
