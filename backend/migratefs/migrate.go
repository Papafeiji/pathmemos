// Package migratefs loads migration .up.sql files from the given directory on disk.
package migratefs

import (
	"cmp"
	"os"
	"path/filepath"
	"slices"
	"strings"

	"papafeiji/backend/internal/migration"
)

// LoadMigrations reads .up.sql files from the given directory.
func LoadMigrations(dir string) ([]migration.Migration, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}

	var ms []migration.Migration
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".up.sql") {
			continue
		}
		data, err := os.ReadFile(filepath.Join(dir, e.Name()))
		if err != nil {
			return nil, err
		}
		ms = append(ms, migration.Migration{Name: e.Name(), SQL: string(data)})
	}

	slices.SortFunc(ms, func(a, b migration.Migration) int {
		return cmp.Compare(a.Name, b.Name)
	})

	return ms, nil
}
