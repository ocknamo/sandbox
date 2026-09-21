package scenario

import (
	"embed"
	"fmt"
	"path"
	"sort"
	"strings"
)

// data holds the cases that ship with the service. A scenario is content, not
// configuration, so it travels inside the binary: the service has no disk to
// read from on Cloud Run and no reason to fetch a case over the network.
//
//go:embed data/*.json
var data embed.FS

// Builtin loads one of the cases compiled into the binary.
func Builtin(id string) (*Scenario, error) {
	raw, err := data.ReadFile(path.Join("data", id+".json"))
	if err != nil {
		return nil, fmt.Errorf("scenario: no builtin case %q", id)
	}
	s, err := Load(raw)
	if err != nil {
		return nil, err
	}
	if s.ID != id {
		return nil, fmt.Errorf("scenario: %s.json declares id %q", id, s.ID)
	}
	return s, nil
}

// BuiltinIDs lists the cases that ship with the service, sorted.
func BuiltinIDs() []string {
	entries, err := data.ReadDir("data")
	if err != nil {
		return nil
	}
	ids := make([]string, 0, len(entries))
	for _, e := range entries {
		if !e.IsDir() {
			ids = append(ids, strings.TrimSuffix(e.Name(), ".json"))
		}
	}
	sort.Strings(ids)
	return ids
}
