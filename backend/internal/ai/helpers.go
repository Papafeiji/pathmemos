package ai

import (
	"time"

	"papafeiji/backend/internal/db/sqlc"

	"github.com/jackc/pgx/v5/pgtype"
)

func sqlcArg(userID string, limit int32) sqlc.ListRecentDialogLogsParams {
	return sqlc.ListRecentDialogLogsParams{
		UserID: userID,
		Limit:  limit,
	}
}

func sqlcListArg(familyID string, limit int32) sqlc.ListAIBackgroundEntriesParams {
	return sqlc.ListAIBackgroundEntriesParams{
		FamilyID: familyID,
		Limit:    limit,
	}
}

func sqlcInsertArg(id, userID, role, content string, createdAt time.Time) sqlc.InsertAIDialogLogParams {
	return sqlc.InsertAIDialogLogParams{
		ID:        id,
		UserID:    userID,
		Role:      role,
		Content:   content,
		CreatedAt: pgtype.Timestamptz{Time: createdAt, Valid: true},
	}
}
