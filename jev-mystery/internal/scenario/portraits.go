package scenario

import (
	"embed"
	"io/fs"
)

// portraits holds the pictures the built-in cases ship with. They travel
// inside the binary for the same reason the cases themselves do: a portrait is
// part of a case, the service has no disk to read from on Cloud Run, and a
// picture fetched from somewhere else is a picture that can disappear from
// under a case that is already written.
//
//go:embed data/portraits
var portraits embed.FS

// PortraitPrefix is the first element of the path a case writes in a
// character's `image`, and the path the service serves those pictures under.
// The two are the same string on purpose: a case says `portraits/yakata/x.png`
// and the page asks the service for exactly that.
const PortraitPrefix = "portraits/"

// Portraits is the pictures as a file system, rooted so that a case's image
// path minus PortraitPrefix names a file in it.
func Portraits() fs.FS {
	sub, err := fs.Sub(portraits, "data/portraits")
	if err != nil {
		// The directory is embedded at compile time, so this cannot fail at
		// runtime; a build that lost it would fail to compile instead.
		panic("scenario: portraits: " + err.Error())
	}
	return sub
}
