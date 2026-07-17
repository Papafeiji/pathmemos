package user

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"strings"

	"papafeiji/backend/internal/db"
	"papafeiji/backend/internal/family"
	"papafeiji/backend/internal/file"
	"papafeiji/backend/internal/middleware"

	"github.com/jackc/pgx/v5"
)

// CleanupAfterAccountDeletion 执行账号 DB 删除后的公共清理：
// 失效受影响用户的所有 session，并删除物理文件（用户文件、封面、头像 marker）。
// 所有错误仅记录日志，不返回 error，避免在注销已提交后误导用户认为操作失败。
// 调用方可视场景选择在 HTTP 响应返回前的同步调用，或 safe.Go 异步调用。
// 若提供 bgPool，物理文件查表将优先使用 bgPool，避免占用主连接池。
func CleanupAfterAccountDeletion(
	ctx context.Context,
	pool *db.Pool,
	bgPool *db.Pool,
	sessions *middleware.SessionManager,
	storage *file.Storage,
	cleanup *family.AccountCleanupInfo,
	userID string,
) {
	queries := pool
	if bgPool != nil {
		queries = bgPool
	}

	for _, uid := range cleanup.AffectedUserIDs {
		if uid == "" {
			continue
		}
		if err := sessions.DeleteAll(ctx, uid); err != nil {
			slog.ErrorContext(ctx, "delete affected user sessions after account deletion failed",
				slog.String("user_id", uid),
				slog.Any("error", err))
		}
	}

	for _, path := range cleanup.Paths {
		if err := deleteAccountFileByPath(ctx, queries, storage, path); err != nil {
			slog.ErrorContext(ctx, "delete account file failed",
				slog.String("user_id", userID),
				slog.String("path", path),
				slog.Any("error", err))
		}
	}

	for _, fileID := range cleanup.CoverFileIDs {
		if err := file.DeletePhysicalIfUnreferenced(ctx, queries, storage, fileID); err != nil {
			slog.ErrorContext(ctx, "delete account cover file failed",
				slog.String("user_id", userID),
				slog.String("file_id", fileID),
				slog.Any("error", err))
		}
	}

	if cleanup.MarkerPath != "" && !strings.Contains(cleanup.MarkerPath, "default-marker") {
		if err := storage.DeleteFile(cleanup.MarkerPath, cleanup.MarkerStorage); err != nil {
			slog.ErrorContext(ctx, "delete account avatar marker failed",
				slog.String("user_id", userID),
				slog.String("path", cleanup.MarkerPath),
				slog.Any("error", err))
		}
	}
}

func deleteAccountFileByPath(ctx context.Context, pool *db.Pool, storage *file.Storage, path string) error {
	f, err := pool.Queries().GetFileByPath(ctx, path)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil
		}
		return fmt.Errorf("get file by path: %w", err)
	}
	return file.DeletePhysicalIfUnreferenced(ctx, pool, storage, f.ID)
}
