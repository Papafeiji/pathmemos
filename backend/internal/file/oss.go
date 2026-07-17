// Package file provides related functionality.
package file

import (
	"fmt"
	"io"
	"mime"
	"path/filepath"
	"strings"
	"time"

	"papafeiji/backend/pkg/util"

	"github.com/aliyun/aliyun-oss-go-sdk/oss"
)

type OSSStore struct {
	bucket  *oss.Bucket
	baseURL string
}

func NewOSSStore(bucket *oss.Bucket, baseURL string) *OSSStore {
	return &OSSStore{
		bucket:  bucket,
		baseURL: strings.TrimSuffix(baseURL, "/"),
	}
}

func (o *OSSStore) Save(reader io.Reader, size int64, ext string) (string, int64, error) {
	if o.bucket == nil {
		return "", 0, fmt.Errorf("oss bucket not configured")
	}

	now := time.Now()
	subDir := now.Format("2006/01")
	fileName, err := util.NewUUID()
	if err != nil {
		return "", 0, fmt.Errorf("generate file id: %w", err)
	}
	key := "uploads/" + subDir + "/" + fileName + ext

	return o.SaveWithKey(reader, key, size)
}

func (o *OSSStore) SaveWithKey(reader io.Reader, key string, size int64) (string, int64, error) {
	if o.bucket == nil {
		return "", 0, fmt.Errorf("oss bucket not configured")
	}
	key = strings.TrimPrefix(key, "/")

	opts := []oss.Option{
		oss.ContentType(contentTypeByExt(filepath.Ext(key))),
		oss.CacheControl("public, max-age=31536000, immutable"),
	}
	if err := o.bucket.PutObject(key, reader, opts...); err != nil {
		return "", 0, fmt.Errorf("oss put object: %w", err)
	}

	return key, size, nil
}

func (o *OSSStore) IsObjectExist(key string) (bool, error) {
	if o.bucket == nil {
		return false, fmt.Errorf("oss bucket not configured")
	}
	return o.bucket.IsObjectExist(key)
}

func (o *OSSStore) Delete(key string) error {
	if o.bucket == nil {
		return fmt.Errorf("oss bucket not configured")
	}
	key = strings.TrimPrefix(key, "/")
	if err := o.bucket.DeleteObject(key); err != nil {
		return fmt.Errorf("oss delete object: %w", err)
	}
	return nil
}

func (o *OSSStore) URL(key string) string {
	if o.baseURL == "" || key == "" {
		return ""
	}
	return o.baseURL + "/" + strings.TrimPrefix(key, "/")
}

func contentTypeByExt(ext string) string {
	ext = strings.ToLower(ext)
	ct := mime.TypeByExtension(ext)
	if ct != "" {
		return ct
	}
	switch ext {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	case ".webp":
		return "image/webp"
	default:
		return "application/octet-stream"
	}
}
