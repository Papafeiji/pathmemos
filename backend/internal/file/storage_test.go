package file

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestStorageSave(t *testing.T) {
	dir := t.TempDir()
	s := NewStorage(dir)
	rel, n, err := s.Save(strings.NewReader("hello"), ".jpg")
	if err != nil {
		t.Fatalf("Save: %v", err)
	}
	if n != 5 {
		t.Fatalf("Save size = %d, want 5", n)
	}
	if _, err := os.Stat(filepath.Join(dir, rel)); err != nil {
		t.Fatalf("saved file missing: %v", err)
	}
}

func TestStorageSaveRejectsTraversalExt(t *testing.T) {
	s := NewStorage(t.TempDir())
	for _, ext := range []string{"../evil", ".j/../pg", "a\\b"} {
		if _, _, err := s.Save(strings.NewReader("x"), ext); err == nil {
			t.Errorf("Save ext %q = nil error, want reject", ext)
		}
	}
}

func TestStorageDeleteTraversal(t *testing.T) {
	s := NewStorage(t.TempDir())
	for _, p := range []string{"../outside", "..", ""} {
		if err := s.Delete(p); err == nil {
			t.Errorf("Delete(%q) = nil error, want reject", p)
		}
	}
	// 绝对路径会被 TrimPrefix 去掉前导 /，随后按 baseDir 内相对路径处理，不会逃逸。
	if err := s.Delete("/etc/passwd"); err != nil {
		t.Errorf("Delete(/etc/passwd) should be confined to baseDir (nil error), got %v", err)
	}
}

func TestStorageURL(t *testing.T) {
	s := NewStorage(t.TempDir())
	if _, err := s.URL("a/b", "local"); err == nil {
		t.Fatal("URL without baseURL should error")
	}
	s = s.WithBaseURL("https://example.com/")
	got, err := s.URL("2026/01/x y.jpg", "local")
	if err != nil {
		t.Fatalf("URL: %v", err)
	}
	want := "https://example.com/uploads/2026/01/x%20y.jpg"
	if got != want {
		t.Fatalf("URL = %q, want %q", got, want)
	}
}
