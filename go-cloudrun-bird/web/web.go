// Package web holds the browser front end for the bird API.
//
// One page, served two ways: the Go server embeds it so a deployment answers
// on /index.html, and the GitHub Pages workflow publishes the very same file.
// It lives in its own package because //go:embed cannot reach outside the
// directory of the file that declares it, and keeping a second copy under
// internal/server would mean the two drifting apart.
package web

import _ "embed"

// IndexHTML is the front-end page. It talks to the API over plain fetch and
// needs no build step, so publishing it is a matter of copying the file.
//
//go:embed index.html
var IndexHTML []byte
