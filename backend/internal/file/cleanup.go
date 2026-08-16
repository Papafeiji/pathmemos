package file

import (
	"context"
	"errors"
	"fmt"

	"papafeiji/backend/internal/db"
	"papafeiji/backend/internal/db/sqlc"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

func DeleteFile(ctx context.Context, pool *db.Pool, storage *Storage, fileID, userID string) error {
	var physicalPath, physicalStorageType string
	err := db.WithTx(ctx, pool.Pool(), func(ctx context.Context, q *sqlc.Queries) error {
		file, err := q.GetFileByIDForUpdate(ctx, fileID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return ErrFileNotFound
			}
			return fmt.Errorf("get file: %w", err)
		}

		if file.FileType == "system" {
			return ErrSystemFileDelete
		}

		if !file.CreatedBy.Valid || file.CreatedBy.String == "" {
			return ErrNotFileOwner
		}
		if file.CreatedBy.String != userID {
			return ErrNotFileOwner
		}

		refs, err := q.GetFileReferences(ctx, pgtype.Text{String: fileID, Valid: true})
		if err != nil {
			return fmt.Errorf("check file references: %w", err)
		}

		if refs.UsedByCover || refs.UsedByEntry || refs.AvatarUserCount > 0 {
			return ErrFileInUse
		}

		if err := q.DeleteFile(ctx, fileID); err != nil {
			return fmt.Errorf("delete file record: %w", err)
		}

		if file.FileType == "image" && file.CreatedBy.Valid && file.CreatedBy.String != "" {
			// 扣减失败须回滚整个事务：否则 files 记录已删、image_storage_bytes 未回退，
			// 幽灵字节永久占用用户配额，且孤儿清理任务无法补偿。
			if decErr := q.DecrementUserImageStorage(ctx, sqlc.DecrementUserImageStorageParams{
				ID:                file.CreatedBy.String,
				ImageStorageBytes: file.SizeBytes,
			}); decErr != nil {
				return fmt.Errorf("decrement user image storage: %w", decErr)
			}
		}

		physicalPath = file.Path
		physicalStorageType = file.StorageType
		return nil
	})
	if err != nil {
		return err
	}

	if physicalPath != "" {
		_ = storage.DeleteFile(physicalPath, physicalStorageType) //nolint:errcheck // physical cleanup is best-effort
	}

	return nil
}

func DeletePhysicalIfUnreferenced(ctx context.Context, pool *db.Pool, storage *Storage, fileID string) error {
	var physicalPath, physicalStorageType string
	err := db.WithTx(ctx, pool.Pool(), func(ctx context.Context, q *sqlc.Queries) error {
		file, err := q.GetFileByIDForUpdate(ctx, fileID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return ErrFileNotFound
			}
			return fmt.Errorf("get file: %w", err)
		}

		refs, err := q.GetFileReferences(ctx, pgtype.Text{String: fileID, Valid: true})
		if err != nil {
			return fmt.Errorf("check references: %w", err)
		}

		if refs.UsedByCover || refs.UsedByEntry || refs.AvatarUserCount > 0 {
			return nil
		}

		if err := q.DeleteFile(ctx, fileID); err != nil {
			return fmt.Errorf("delete file record: %w", err)
		}

		if file.FileType == "image" && file.CreatedBy.Valid && file.CreatedBy.String != "" {
			// 扣减失败须回滚整个事务：否则 files 记录已删、image_storage_bytes 未回退，
			// 幽灵字节永久占用用户配额，且孤儿清理任务无法补偿。
			if decErr := q.DecrementUserImageStorage(ctx, sqlc.DecrementUserImageStorageParams{
				ID:                file.CreatedBy.String,
				ImageStorageBytes: file.SizeBytes,
			}); decErr != nil {
				return fmt.Errorf("decrement user image storage: %w", decErr)
			}
		}

		physicalPath = file.Path
		physicalStorageType = file.StorageType
		return nil
	})
	if err != nil {
		return err
	}

	if physicalPath != "" {
		_ = storage.DeleteFile(physicalPath, physicalStorageType) //nolint:errcheck // physical cleanup is best-effort
	}

	return nil
}
