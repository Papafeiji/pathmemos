package file

import (
	"bytes"
	"fmt"
	"io"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"papafeiji/backend/pkg/util"
)

const (
	DefaultUploadDir = "/opt/pathmemos/uploads"
)

type Storage struct {
	baseDir string
	baseURL string
	oss     *OSSStore
}

func NewStorage(baseDir string) *Storage {
	if baseDir == "" {
		baseDir = DefaultUploadDir
	}
	//nolint:errcheck
	absBase, _ := filepath.Abs(baseDir)
	if absBase == "" {
		absBase = baseDir
	}
	return &Storage{baseDir: absBase}
}

func (s *Storage) WithBaseURL(baseURL string) *Storage {
	s.baseURL = strings.TrimSuffix(baseURL, "/")
	return s
}

func (s *Storage) WithOSS(oss *OSSStore) *Storage {
	s.oss = oss
	return s
}

func (s *Storage) BaseDir() string {
	return s.baseDir
}

func (s *Storage) OSSConfigured() bool {
	return s.oss != nil && s.oss.bucket != nil
}

func (s *Storage) Save(reader io.Reader, ext string) (string, int64, error) {
	now := time.Now()
	subDir := now.Format("2006/01")
	fileName, err := util.NewUUID()
	if err != nil {
		return "", 0, fmt.Errorf("generate file id: %w", err)
	}
	relPath := subDir + "/" + fileName + ext
	fullPath := filepath.Join(s.baseDir, relPath)

	if err := os.MkdirAll(filepath.Dir(fullPath), 0o755); err != nil {
		return "", 0, fmt.Errorf("create upload dir: %w", err)
	}

	f, err := os.Create(fullPath)
	if err != nil {
		return "", 0, fmt.Errorf("create upload file: %w", err)
	}
	//nolint:errcheck
	defer f.Close()

	size, err := io.Copy(f, reader)
	if err != nil {
		return "", 0, fmt.Errorf("write upload file: %w", err)
	}

	return relPath, size, nil
}

func (s *Storage) SaveToOSS(reader io.Reader, size int64, ext string) (string, int64, error) {
	if s.oss == nil {
		return "", 0, fmt.Errorf("oss not configured")
	}
	return s.oss.Save(reader, size, ext)
}

func (s *Storage) SaveToOSSWithKey(reader io.Reader, key string, size int64) (int64, error) {
	if s.oss == nil {
		return 0, fmt.Errorf("oss not configured")
	}
	_, sz, err := s.oss.SaveWithKey(reader, key, size)
	return sz, err
}

func (s *Storage) SaveSystem(reader io.Reader, ext string) (string, string, int64, error) {
	data, err := io.ReadAll(io.LimitReader(reader, MaxFileSize+1))
	if err != nil {
		return "", "", 0, fmt.Errorf("read system image: %w", err)
	}
	if len(data) > MaxFileSize {
		return "", "", 0, fmt.Errorf("system image too large")
	}
	size := int64(len(data))

	if s.OSSConfigured() {
		key, sz, err := s.SaveToOSS(bytes.NewReader(data), size, ext)
		return key, "oss", sz, err
	}

	key, sz, err := s.Save(bytes.NewReader(data), ext)
	return key, "local", sz, err
}

func (s *Storage) SaveSystemWithName(reader io.Reader, ext, fileName string) (string, string, int64, error) {
	data, err := io.ReadAll(io.LimitReader(reader, MaxFileSize+1))
	if err != nil {
		return "", "", 0, fmt.Errorf("read system image: %w", err)
	}
	if len(data) > MaxFileSize {
		return "", "", 0, fmt.Errorf("system image too large")
	}
	size := int64(len(data))

	if s.OSSConfigured() {
		now := time.Now()
		subDir := now.Format("2006/01")
		key := "uploads/" + subDir + "/" + fileName + ext

		_, sz, err := s.oss.SaveWithKey(bytes.NewReader(data), key, size)
		return key, "oss", sz, err
	}

	relPath, sz, err := s.SaveWithName(bytes.NewReader(data), ext, fileName)
	return relPath, "local", sz, err
}

// SaveWithName saves data to a file with a specific name under the current month directory.
func (s *Storage) SaveWithName(reader io.Reader, ext, fileName string) (string, int64, error) {
	now := time.Now()
	subDir := now.Format("2006/01")
	relPath := subDir + "/" + fileName + ext
	fullPath := filepath.Join(s.baseDir, relPath)

	if err := os.MkdirAll(filepath.Dir(fullPath), 0o755); err != nil {
		return "", 0, fmt.Errorf("create upload dir: %w", err)
	}

	f, err := os.Create(fullPath)
	if err != nil {
		return "", 0, fmt.Errorf("create upload file: %w", err)
	}
	//nolint:errcheck
	defer f.Close()

	size, err := io.Copy(f, reader)
	if err != nil {
		return "", 0, fmt.Errorf("write upload file: %w", err)
	}

	return relPath, size, nil
}

func (s *Storage) IsObjectExist(key, storageType string) (bool, error) {
	if storageType == "oss" {
		if s.oss == nil {
			return false, fmt.Errorf("oss not configured")
		}
		return s.oss.IsObjectExist(key)
	}
	clean := filepath.Clean(strings.TrimPrefix(key, "/"))
	if clean == "" || clean == "." || strings.Contains(clean, "..") {
		return false, fmt.Errorf("invalid path")
	}
	absPath, err := filepath.Abs(filepath.Join(s.baseDir, clean))
	if err != nil {
		return false, fmt.Errorf("resolve path: %w", err)
	}
	basePrefix := s.baseDir + string(filepath.Separator)
	if !strings.HasPrefix(absPath, basePrefix) {
		return false, fmt.Errorf("invalid path")
	}
	_, err = os.Stat(absPath)
	if err == nil {
		return true, nil
	}
	if os.IsNotExist(err) {
		return false, nil
	}
	return false, err
}

func (s *Storage) Delete(relPath string) error {
	clean := filepath.Clean(strings.TrimPrefix(relPath, "/"))
	if clean == "" || clean == "." || strings.Contains(clean, "..") {
		return fmt.Errorf("invalid path")
	}
	fullPath := filepath.Join(s.baseDir, clean)
	absPath, err := filepath.Abs(fullPath)
	if err != nil {
		return fmt.Errorf("resolve path: %w", err)
	}
	basePrefix := s.baseDir + string(filepath.Separator)
	if !strings.HasPrefix(absPath, basePrefix) {
		return fmt.Errorf("invalid path")
	}
	if err := os.Remove(absPath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("remove file: %w", err)
	}
	return nil
}

func (s *Storage) DeleteFile(path, storageType string) error {
	if storageType == "oss" {
		if s.oss == nil {
			return fmt.Errorf("oss not configured")
		}
		return s.oss.Delete(path)
	}
	return s.Delete(path)
}

func (s *Storage) URL(path, storageType string) (string, error) {
	if path == "" {
		return "", nil
	}
	if storageType == "oss" {
		if s.oss == nil {
			return "", fmt.Errorf("oss not configured")
		}
		return s.oss.URL(path), nil
	}
	// 按 "/" 分段分别转义再拼接：整段 PathEscape 会把路径分隔符转成 %2F。
	segments := strings.Split(strings.TrimPrefix(path, "/"), "/")
	for i, seg := range segments {
		segments[i] = url.PathEscape(seg)
	}
	return strings.TrimSuffix(s.baseURL, "/") + "/uploads/" + strings.Join(segments, "/"), nil
}
