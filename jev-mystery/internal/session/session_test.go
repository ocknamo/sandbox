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
	want := state{Scene: "study", Evidence: []string{"clock"}}

	token, err := c.Encode(want)
	if err != nil {
		t.Fatal(err)
	}
	var got state
	if err := c.Decode(token, &got); err != nil {
		t.Fatal(err)
	}
	if got.Scene != want.Scene || len(got.Evidence) != 1 {
		t.Fatalf("got %+v, want %+v", got, want)
	}
}

// A state decides what the engine will do next, so a token edited in a console
// has to be refused rather than merely unusual.
func TestDecodeRefusesTampering(t *testing.T) {
	c, _ := New("a key")
	token, err := c.Encode(state{Scene: "hall"})
	if err != nil {
		t.Fatal(err)
	}
	body, sig, _ := strings.Cut(token, ".")

	other, _ := New("a different key")
	forged, _ := other.Encode(state{Scene: "study"})

	for name, bad := range map[string]string{
		"no signature":  body,
		"edited body":   strings.Replace(body, body[:4], "AAAA", 1) + "." + sig,
		"another key":   forged,
		"empty":         "",
		"just a dot":    ".",
		"not base64":    "!!!.###",
		"signature off": body + "." + sig[:len(sig)-2] + "AA",
	} {
		t.Run(name, func(t *testing.T) {
			var got state
			if err := c.Decode(bad, &got); !errors.Is(err, ErrTampered) {
				t.Fatalf("err = %v, want ErrTampered", err)
			}
		})
	}
}

func TestAKeylessCodecStillWorksAlone(t *testing.T) {
	c, err := New("")
	if err != nil {
		t.Fatal(err)
	}
	token, err := c.Encode(state{Scene: "hall"})
	if err != nil {
		t.Fatal(err)
	}
	var got state
	if err := c.Decode(token, &got); err != nil {
		t.Fatalf("a codec should read its own tokens: %v", err)
	}

	// ...but not another process's, which is the reason to set a key.
	other, _ := New("")
	if err := other.Decode(token, &got); !errors.Is(err, ErrTampered) {
		t.Fatal("two random keys should not agree")
	}
}
