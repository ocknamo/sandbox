package session

import (
	"errors"
	"strings"
	"testing"
)

type state struct {
	Scene    string   `json:"scene"`
	Evidence []string `json:"evidence"`
}

func TestRoundTrip(t *testing.T) {
	c, err := New("a key")
	if err != nil {
		t.Fatal(err)
	}
	token, err := c.Encode(state{Scene: "study", Evidence: []string{"clock"}})
	if err != nil {
		t.Fatal(err)
	}
	var got state
	if err := c.Decode(token, &got); err != nil {
		t.Fatal(err)
	}
	if got.Scene != "study" || len(got.Evidence) != 1 {
		t.Fatalf("got %+v", got)
	}
}

// A state decides what the engine will do next, so a token edited in a console
// has to be refused rather than merely looking unusual.
func TestDecodeRefusesTampering(t *testing.T) {
	c, _ := New("a key")
	token, err := c.Encode(state{Scene: "hall"})
	if err != nil {
		t.Fatal(err)
	}
	body, sig, _ := strings.Cut(token, ".")

	other, _ := New("another key")
	forged, _ := other.Encode(state{Scene: "study"})

	for name, bad := range map[string]string{
		"edited body": strings.Replace(body, body[:4], "AAAA", 1) + "." + sig,
		"another key": forged,
		"nonsense":    "!!!.###",
	} {
		t.Run(name, func(t *testing.T) {
			var got state
			if err := c.Decode(bad, &got); !errors.Is(err, ErrTampered) {
				t.Fatalf("err = %v, want ErrTampered", err)
			}
		})
	}
}
