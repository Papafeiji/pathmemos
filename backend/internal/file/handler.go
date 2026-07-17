package file

import (
	"context"
	"encoding/json"
	stderrors "errors"
	"fmt"
	"io"

	"log/slog"
	"mime/multipart"
	"net/http"
	"os"
	"strings"
	"time"
	"unicode/utf8"

	"papafeiji/backend/internal/db"
	"papafeiji/backend/internal/db/sqlc"
	"papafeiji/backend/internal/middleware"
	"papafeiji/backend/pkg/errors"
	"papafeiji/backend/pkg/util"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/redis/go-redis/v9"
)

const (
	uploadFormKey = "files"

	MaxFileSize  = 10 * 1024 * 1024
	MaxTotalSize = 50 * 1024 * 1024
	MaxFiles     = 9
	MaxNameLen   = 255
)

var allowedExts = map[string]string{
	".jpg":  ".jpg",
	".jpeg": ".jpg",
	".png":  ".png",
	".gif":  ".gif",
	".webp": ".webp",
}

type Handler struct {
	router  chi.Router
	pool    *db.Pool
	bgPool  *db.Pool
	rdb     *redis.Client
	storage *Storage
}

func NewHandler(router chi.Router, pool, bgPool *db.Pool, rdb *redis.Client, storage *Storage) *Handler {
	return &Handler{
		router:  router,
		pool:    pool,
		bgPool:  bgPool,
		rdb:     rdb,
		storage: storage,
	}
}

func (h *Handler) Register() {
	h.router.Delete("/file/{fileId}", h.Delete)
	h.router.Get("/file/download/{fileId}", h.Download)
}

func (h *Handler) RegisterUpload(middlewares ...func(http.Handler) http.Handler) {
	h.router.With(middlewares...).Post("/file/upload", h.Upload)
}

func (h *Handler) Upload(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.UserID(ctx)

	if r.ContentLength > MaxTotalSize {
		middleware.JSONError(w, r, errors.HTTPStatus(errors.BizFileSizeExceeded), errors.CodeBadRequest, "request body too large")
		return
	}

	contentType := r.Header.Get("Content-Type")
	if !strings.HasPrefix(contentType, "multipart/form-data") {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "invalid content type")
		return
	}

	reader, err := r.MultipartReader()
	if err != nil {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "invalid multipart form")
		return
	}

	var results []map[string]interface{}
	var totalSize int64
	var fileCount int

	for {
		part, err := reader.NextPart()
		if err == io.EOF {
			break
		}
		if err != nil {
			middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "failed to read multipart part")
			return
		}

		if part.FormName() != uploadFormKey {
			_ = part.Close() //nolint:errcheck // multipart close is best-effort
			continue
		}

		if fileCount >= MaxFiles {
			_ = part.Close() //nolint:errcheck // multipart close is best-effort
			middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, fmt.Sprintf("too many files, max %d", MaxFiles))
			return
		}

		contentType := part.Header.Get("Content-Type")

		res, size, err := h.handleUploadPart(ctx, part, contentType, userID, totalSize)
		_ = part.Close() //nolint:errcheck // multipart close is best-effort
		if err != nil {
			switch err {
			case errInvalidFileType:
				middleware.JSONError(w, r, errors.HTTPStatus(errors.BizInvalidFileType), errors.CodeBadRequest, err.Error())
			case errFileTooLarge:
				middleware.JSONError(w, r, errors.HTTPStatus(errors.BizFileSizeExceeded), errors.CodeBadRequest, err.Error())
			case errTotalSizeExceeded:
				middleware.JSONError(w, r, errors.HTTPStatus(errors.BizFileSizeExceeded), errors.CodeBadRequest, err.Error())
			default:
				middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to upload file")
			}
			return
		}

		totalSize += size

		results = append(results, res)
		fileCount++
	}

	middleware.JSON(w, r, http.StatusOK, map[string]interface{}{
		"files": results,
	})
}

var (
	errInvalidFileType   = stderrors.New("invalid file type")
	errFileTooLarge      = stderrors.New("file too large")
	errTotalSizeExceeded = stderrors.New("total request size exceeded")
)

func (h *Handler) handleUploadPart(ctx context.Context, part *multipart.Part, contentType, userID string, totalSize int64) (map[string]interface{}, int64, error) {
	ext := extractExt(part.FileName())
	canonicalExt, err := validateFileType(contentType, ext)
	if err != nil {
		return nil, 0, errInvalidFileType
	}

	tmpFile, err := os.CreateTemp("", "pathmemos-upload-*")
	if err != nil {
		return nil, 0, fmt.Errorf("create temp file: %w", err)
	}
	//nolint:errcheck
	defer os.Remove(tmpFile.Name())
	//nolint:errcheck
	defer tmpFile.Close()

	written := int64(0)

	buf := make([]byte, 32*1024)
	for {
		n, err := part.Read(buf)
		if n > 0 {
			if written+int64(n) > MaxFileSize {
				return nil, 0, errFileTooLarge
			}
			written += int64(n)
			if _, werr := tmpFile.Write(buf[:n]); werr != nil {
				return nil, 0, fmt.Errorf("write temp file: %w", werr)
			}
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, 0, fmt.Errorf("read file part: %w", err)
		}
	}

	if totalSize+written > MaxTotalSize {
		return nil, 0, errTotalSizeExceeded
	}

	if _, err := tmpFile.Seek(0, io.SeekStart); err != nil {
		return nil, 0, fmt.Errorf("seek temp file: %w", err)
	}

	fileID, err := util.NewUUID()
	if err != nil {
		return nil, 0, fmt.Errorf("generate file id: %w", err)
	}
	name := sanitizeName(part.FileName())
	metadata := []byte(`{}`)

	useOSS := h.storage.OSSConfigured()
	var key, storageType string
	if useOSS {
		keyUUID, err := util.NewUUID()
		if err != nil {
			return nil, 0, fmt.Errorf("generate oss key id: %w", err)
		}
		key = "uploads/" + time.Now().Format("2006/01") + "/" + keyUUID + canonicalExt
		storageType = "oss"
	} else {
		relPath, _, err := h.storage.Save(tmpFile, canonicalExt)
		if err != nil {
			return nil, 0, fmt.Errorf("save file locally: %w", err)
		}
		key = relPath
		storageType = "local"
	}

	_, err = h.pool.Queries().CreateFile(ctx, sqlc.CreateFileParams{
		ID:          fileID,
		CreatedBy:   pgtype.Text{String: userID, Valid: true},
		Path:        key,
		Name:        name,
		Suffix:      strings.TrimPrefix(canonicalExt, "."),
		SizeBytes:   written,
		FileType:    "image",
		StorageType: storageType,
		Metadata:    metadata,
	})
	if err != nil {
		if !useOSS {
			_ = h.storage.DeleteFile(key, storageType) //nolint:errcheck
		}
		return nil, 0, fmt.Errorf("create file record: %w", err)
	}

	if useOSS {
		if _, uploadErr := h.storage.SaveToOSSWithKey(tmpFile, key, written); uploadErr != nil {
			_ = h.pool.Queries().DeleteFile(ctx, fileID) //nolint:errcheck // rollback cleanup is best-effort
			_ = h.storage.DeleteFile(key, "oss")         //nolint:errcheck // rollback cleanup is best-effort
			return nil, 0, fmt.Errorf("upload file to oss: %w", uploadErr)
		}
	}

	url, urlErr := h.storage.URL(key, storageType)
	if urlErr != nil {
		return nil, 0, fmt.Errorf("get file url: %w", urlErr)
	}
	return map[string]interface{}{
		"fileId": fileID,
		"url":    url,
	}, written, nil
}

func sanitizeName(name string) string {
	if len(name) <= MaxNameLen {
		return name
	}
	truncated := name[:MaxNameLen]
	for len(truncated) > 0 && !utf8.RuneStart(truncated[len(truncated)-1]) {
		truncated = truncated[:len(truncated)-1]
	}
	return truncated
}

func extractExt(name string) string {
	idx := strings.LastIndex(name, ".")
	if idx < 0 {
		return ""
	}
	return strings.ToLower(name[idx:])
}

func validateFileType(contentType, ext string) (string, error) {
	if contentType == "" || !strings.HasPrefix(contentType, "image/") {
		return "", fmt.Errorf("invalid content type: %s", contentType)
	}
	ext = strings.ToLower(ext)
	canonical, ok := allowedExts[ext]
	if !ok {
		return "", fmt.Errorf("unsupported file extension: %s", ext)
	}
	return canonical, nil
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.UserID(ctx)
	fileID := chi.URLParam(r, "fileId")

	if fileID == "" {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "fileId is required")
		return
	}

	if err := DeleteFile(ctx, h.pool, h.storage, fileID, userID); err != nil {

		if stderrors.Is(err, ErrNotFileOwner) {
			middleware.JSONError(w, r, http.StatusForbidden, errors.CodeForbidden, "file does not belong to user")
			return
		}
		if stderrors.Is(err, ErrSystemFileDelete) {
			middleware.JSONError(w, r, http.StatusForbidden, errors.CodeForbidden, "system file cannot be deleted")
			return
		}
		if stderrors.Is(err, ErrFileInUse) {
			middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "file is still in use")
			return
		}
		if stderrors.Is(err, ErrFileNotFound) {
			middleware.JSONError(w, r, http.StatusNotFound, errors.CodeBadRequest, "file not found")
			return
		}
		middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to delete file")
		return
	}

	middleware.JSON(w, r, http.StatusOK, map[string]interface{}{})
}

func (h *Handler) Download(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.UserID(ctx)
	fileID := chi.URLParam(r, "fileId")

	if fileID == "" {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "fileId is required")
		return
	}

	file, err := h.pool.Queries().GetFileByID(ctx, fileID)
	if err != nil {
		if stderrors.Is(err, pgx.ErrNoRows) {
			middleware.JSONError(w, r, http.StatusNotFound, errors.CodeBadRequest, "file not found")
			return
		}

		middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to get file")
		return
	}

	if file.FileType == "system" {
		var meta struct {
			FamilyID string `json:"family_id"`
		}
		if err := json.Unmarshal(file.Metadata, &meta); err != nil || meta.FamilyID == "" {
			middleware.JSONError(w, r, http.StatusForbidden, errors.CodeForbidden, "system file access denied")
			return
		}
		user, err := h.pool.Queries().GetUserByID(ctx, userID)
		if err != nil || !user.CurrentFamilyID.Valid || user.CurrentFamilyID.String != meta.FamilyID {
			middleware.JSONError(w, r, http.StatusForbidden, errors.CodeForbidden, "system file access denied")
			return
		}
	} else {
		if !file.CreatedBy.Valid || file.CreatedBy.String == "" {
			middleware.JSONError(w, r, http.StatusForbidden, errors.CodeForbidden, "file access denied")
			return
		}
		if file.CreatedBy.String != userID {

			allowed, err := h.isFileAccessible(ctx, userID, file.CreatedBy.String)
			if err != nil {

				middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to check file access")
				return
			}
			if !allowed {
				middleware.JSONError(w, r, http.StatusForbidden, errors.CodeForbidden, "file does not belong to user")
				return
			}
		}
	}

	url, urlErr := h.storage.URL(file.Path, file.StorageType)
	if urlErr != nil {
		slog.ErrorContext(ctx, "construct file url failed", slog.Any("error", urlErr), slog.String("fileId", fileID), slog.String("path", file.Path))
		middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to get file url")
		return
	}
	middleware.JSON(w, r, http.StatusOK, map[string]interface{}{
		"url": url,
	})
}

func (h *Handler) isFileAccessible(ctx context.Context, userID, creatorID string) (bool, error) {
	u, err := h.pool.Queries().GetUserByID(ctx, userID)
	if err != nil {
		return false, fmt.Errorf("get current user: %w", err)
	}
	c, err := h.pool.Queries().GetUserByID(ctx, creatorID)
	if err != nil {
		return false, fmt.Errorf("get creator user: %w", err)
	}
	if !u.CurrentFamilyID.Valid || !c.CurrentFamilyID.Valid {
		return false, nil
	}
	return u.CurrentFamilyID.String == c.CurrentFamilyID.String, nil
}
