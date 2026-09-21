package main

import "testing"

func TestLoadPostsReadsTheFixture(t *testing.T) {
	posts, err := loadPosts("../../testdata/posts.json")
	if err != nil {
		t.Fatalf("loadPosts: %v", err)
	}
	if len(posts) == 0 {
		t.Fatal("fixture holds no posts")
	}
	for i, p := range posts {
		if len(p.ID) != 64 {
			t.Errorf("post %d: id %q is %d chars, want 64", i, p.ID, len(p.ID))
		}
		if p.Content == "" {
			t.Errorf("post %d: empty content", i)
		}
	}
}

func TestPreviewCutsOnRunesNotBytes(t *testing.T) {
	// Four multi-byte runes trimmed to three must stay valid text.
	if got, want := preview("あいうえ", 3), "あいう…"; got != want {
		t.Errorf("preview = %q, want %q", got, want)
	}
	if got, want := preview("short", 60), "short"; got != want {
		t.Errorf("preview = %q, want %q", got, want)
	}
	if got, want := preview("two\nlines", 60), "two lines"; got != want {
		t.Errorf("preview = %q, want %q", got, want)
	}
}

func TestShortAbbreviatesEventIDs(t *testing.T) {
	if got, want := short("0123456789abcdef0123"), "0123456789ab"; got != want {
		t.Errorf("short = %q, want %q", got, want)
	}
	if got, want := short("abc"), "abc"; got != want {
		t.Errorf("short = %q, want %q", got, want)
	}
}
