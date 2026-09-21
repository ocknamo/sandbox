// Package session carries a playthrough between requests.
//
// The service keeps nothing: Cloud Run scales to zero and runs several
// instances at once, so a game held in a map on one of them would vanish
// mid-case. The state travels to the browser instead, and comes back with
// every turn.
//
// It is signed rather than encrypted. Nothing in the state is a secret — it
// says where the player is standing and what they have already found, all of
// which they have read — but it decides what the engine will do next, and a
// state edited in a console could skip to the last scene or hand its holder
// every piece of evidence in the case. The signature is what makes a token
// something only this service could have issued.
package session

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
)

// ErrTampered reports a token this service did not issue, or one edited since
// it did.
var ErrTampered = errors.New("session: bad signature")

// Codec signs and verifies state tokens with one key.
type Codec struct{ key []byte }

// New returns a codec using the given key. An empty key makes one at random,
// which is the right default for a local run and the wrong one for a service
// with more than one instance: tokens issued by one process are then rejected
// by the next, and a player's game ends at a redeploy. Set the key in
// production.
func New(key string) (*Codec, error) {
	if key != "" {
		return &Codec{key: []byte(key)}, nil
	}
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return nil, fmt.Errorf("session: generate key: %w", err)
	}
	return &Codec{key: buf}, nil
}

var enc = base64.RawURLEncoding

// Encode returns a signed token carrying v.
func (c *Codec) Encode(v any) (string, error) {
	payload, err := json.Marshal(v)
	if err != nil {
		return "", fmt.Errorf("session: encode: %w", err)
	}
	body := enc.EncodeToString(payload)
	return body + "." + enc.EncodeToString(c.sign(body)), nil
}

// Decode verifies a token and unmarshals it into v.
func (c *Codec) Decode(token string, v any) error {
	body, sig, ok := strings.Cut(token, ".")
	if !ok {
		return ErrTampered
	}
	want, err := enc.DecodeString(sig)
	// The comparison is constant time, and the signature is checked before the
	// payload is parsed: nothing from an unverified token reaches a decoder.
	if err != nil || !hmac.Equal(want, c.sign(body)) {
		return ErrTampered
	}
	payload, err := enc.DecodeString(body)
	if err != nil {
		return ErrTampered
	}
	if err := json.Unmarshal(payload, v); err != nil {
		return fmt.Errorf("session: decode: %w", err)
	}
	return nil
}

func (c *Codec) sign(body string) []byte {
	mac := hmac.New(sha256.New, c.key)
	mac.Write([]byte(body))
	return mac.Sum(nil)
}
