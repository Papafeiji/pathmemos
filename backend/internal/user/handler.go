// Package user provides related functionality.
package user

import (
	"context"
	stderrors "errors"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"strings"
	"time"

	"papafeiji/backend/internal/avatar"
	"papafeiji/backend/internal/db"
	"papafeiji/backend/internal/db/sqlc"
	"papafeiji/backend/internal/file"
	"papafeiji/backend/internal/middleware"
	"papafeiji/backend/internal/pkg/safe"
	"papafeiji/backend/internal/userinfo"
	"papafeiji/backend/internal/vip"
	"papafeiji/backend/pkg/errors"
	"papafeiji/backend/pkg/validator"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/redis/go-redis/v9"
)

const maxUserRequestBodySize = 8 << 10 // 8KB

type Handler struct {
	router        chi.Router
	pool          *db.Pool
	bgPool        *db.Pool
	rdb           *redis.Client
	vipService    vip.InfoProvider
	avatarService *avatar.Service
	storage       *file.Storage
	defaultAvatar string
}

func NewHandlerWithBackgroundPool(router chi.Router, pool *db.Pool, bgPool *db.Pool, rdb *redis.Client, vipService vip.InfoProvider, avatarService *avatar.Service, storage *file.Storage, defaultAvatarURL string) *Handler {
	return &Handler{
		router:        router,
		pool:          pool,
		bgPool:        bgPool,
		rdb:           rdb,
		vipService:    vipService,
		avatarService: avatarService,
		storage:       storage,
		defaultAvatar: defaultAvatarURL,
	}
}

func (h *Handler) Register() {
	h.router.Get("/user/profile", h.GetProfile)
	h.router.Put("/user/avatar", h.UpdateAvatar)
	h.router.Put("/user/nickname", h.UpdateNickname)
	h.router.Put("/user/lang", h.UpdateLang)
	h.router.Get("/user/vip", h.GetVIP)
	h.router.Get("/user/common-addresses", h.ListCommonAddresses)
	h.router.Post("/user/common-addresses/refresh", h.RefreshCommonAddresses)
	h.router.Put("/user/common-addresses/{name}", h.UpdateCommonAddressName)
}

func (h *Handler) GetProfile(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.UserID(ctx)

	user, err := h.pool.Queries().GetUserByID(ctx, userID)
	if err != nil {
		if stderrors.Is(err, pgx.ErrNoRows) {
			middleware.JSONError(w, r, http.StatusNotFound, errors.CodeBadRequest, "user not found")
			return
		}
		slog.ErrorContext(ctx, "failed to get user profile", slog.String("user_id", userID), slog.Any("error", err))
		middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to get user profile")
		return
	}

	mpSubscribed := false
	mpAccount, err := h.pool.Queries().GetWxMPAccountByUserID(ctx, pgtype.Text{String: userID, Valid: true})
	if err == nil {
		mpSubscribed = mpAccount.Subscribed
	}

	middleware.JSON(w, r, http.StatusOK, userinfo.Build(ctx, &user, h.vipService, h.defaultAvatar, mpSubscribed))
}

func (h *Handler) UpdateAvatar(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.UserID(ctx)

	var req struct {
		FileID *string `json:"fileId"`
	}
	if err := middleware.ReadJSONBody(w, r, &req, maxUserRequestBodySize); err != nil {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "invalid request body")
		return
	}
	if req.FileID == nil || *req.FileID == "" {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "fileId is required")
		return
	}

	user, err := h.pool.Queries().GetUserByID(ctx, userID)
	if err != nil {
		if stderrors.Is(err, pgx.ErrNoRows) {
			middleware.JSONError(w, r, http.StatusNotFound, errors.CodeBadRequest, "user not found")
			return
		}

		middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to get user")
		return
	}
	oldAvatarFileID := user.AvatarFileID

	avatarFile, err := h.pool.Queries().GetFileByID(ctx, *req.FileID)
	if err != nil {
		if stderrors.Is(err, pgx.ErrNoRows) {
			middleware.JSONError(w, r, http.StatusNotFound, errors.CodeBadRequest, "file not found")
			return
		}

		middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to get file")
		return
	}
	if avatarFile.FileType != "image" {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "file is not an image")
		return
	}
	if !avatarFile.CreatedBy.Valid || avatarFile.CreatedBy.String == "" || avatarFile.CreatedBy.String != userID {
		middleware.JSONError(w, r, http.StatusForbidden, errors.CodeBadRequest, "file does not belong to user")
		return
	}
	avatar, urlErr := h.storage.URL(avatarFile.Path, avatarFile.StorageType)
	if urlErr != nil {
		slog.ErrorContext(ctx, "failed to get avatar url", slog.String("user_id", userID), slog.Any("error", urlErr))
		middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to get avatar url")
		return
	}
	avatarFileID := pgtype.Text{String: *req.FileID, Valid: true}

	if err := h.pool.Queries().UpdateUserAvatar(ctx, sqlc.UpdateUserAvatarParams{
		ID:           userID,
		Avatar:       pgtype.Text{String: avatar, Valid: true},
		AvatarFileID: avatarFileID,
	}); err != nil {
		middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to update avatar")
		return
	}

	if oldAvatarFileID.Valid && oldAvatarFileID.String != avatarFileID.String {
		if err := file.DeletePhysicalIfUnreferenced(ctx, h.pool, h.storage, oldAvatarFileID.String); err != nil {
			slog.ErrorContext(ctx, "delete old avatar file failed", slog.String("user_id", userID), slog.String("file_id", oldAvatarFileID.String), slog.Any("error", err))
		}
	}

	safe.Go(ctx, nil, func() {
		bgCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		if _, err := h.avatarService.GenerateMarker(bgCtx, userID, avatar); err != nil {
			slog.ErrorContext(bgCtx, "generate avatar marker failed", slog.String("user_id", userID), slog.Any("error", err))
			return
		}
	})

	middleware.JSON(w, r, http.StatusOK, map[string]interface{}{})
}

func (h *Handler) UpdateNickname(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.UserID(ctx)

	var req struct {
		NickName string `json:"nickName"`
	}
	if err := middleware.ReadJSONBody(w, r, &req, maxUserRequestBodySize); err != nil {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "invalid request body")
		return
	}

	if err := validator.ValidateNickname(req.NickName); err != nil {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, err.Error())
		return
	}

	if err := h.pool.Queries().UpdateUserNickname(ctx, sqlc.UpdateUserNicknameParams{
		ID:       userID,
		Nickname: pgtype.Text{String: req.NickName, Valid: true},
	}); err != nil {
		middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to update nickname")
		return
	}

	middleware.JSON(w, r, http.StatusOK, map[string]interface{}{})
}

var supportedLangs = map[string]bool{"zh": true, "zh-Hant": true, "en": true}

func (h *Handler) UpdateLang(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.UserID(ctx)

	var req struct {
		Lang string `json:"lang"`
	}
	if err := middleware.ReadJSONBody(w, r, &req, maxUserRequestBodySize); err != nil {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "invalid request body")
		return
	}

	if !supportedLangs[req.Lang] {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "unsupported language")
		return
	}

	if err := h.pool.Queries().UpdateUserLang(ctx, sqlc.UpdateUserLangParams{
		ID:   userID,
		Lang: req.Lang,
	}); err != nil {
		middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to update language")
		return
	}

	middleware.JSON(w, r, http.StatusOK, map[string]interface{}{})
}

func (h *Handler) GetVIP(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.UserID(ctx)

	info, err := h.vipService.GetVIPInfo(ctx, userID)
	if err != nil {
		slog.ErrorContext(ctx, "failed to get vip info", slog.String("user_id", userID), slog.Any("error", err))
		middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to get vip info")
		return
	}
	middleware.JSON(w, r, http.StatusOK, map[string]interface{}{
		"isVip":      info.IsVIP,
		"expireTime": info.ExpireTime,
	})
}

func (h *Handler) ListCommonAddresses(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.UserID(ctx)

	rows, err := h.pool.Queries().ListUserCommonAddresses(ctx, userID)
	if err != nil {
		slog.ErrorContext(ctx, "failed to list common addresses", slog.String("user_id", userID), slog.Any("error", err))
		middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to list common addresses")
		return
	}

	addresses := make([]map[string]interface{}, 0, len(rows))
	for _, row := range rows {
		lat, latErr := row.Lat.Float64Value()
		lon, lonErr := row.Lon.Float64Value()
		if latErr != nil || lonErr != nil || !lat.Valid || !lon.Valid {
			slog.WarnContext(ctx, "invalid common address coordinate",
				slog.String("user_id", userID),
				slog.String("name", row.Name),
				slog.Any("lat_error", latErr),
				slog.Any("lon_error", lonErr))
			continue
		}
		addresses = append(addresses, map[string]interface{}{
			"name":  row.Name,
			"lat":   lat.Float64,
			"lon":   lon.Float64,
			"count": row.Count,
		})
	}

	middleware.JSON(w, r, http.StatusOK, map[string]interface{}{
		"addresses": addresses,
	})
}

func (h *Handler) RefreshCommonAddresses(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.UserID(ctx)

	if err := db.SummarizeUserCommonAddresses(ctx, h.pool, userID); err != nil {
		slog.ErrorContext(ctx, "failed to refresh common addresses", slog.String("user_id", userID), slog.Any("error", err))
		middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to refresh common addresses")
		return
	}

	h.ListCommonAddresses(w, r)
}

var errCommonAddressNotFound = stderrors.New("common address not found")

func (h *Handler) UpdateCommonAddressName(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.UserID(ctx)

	name, err := url.PathUnescape(chi.URLParam(r, "name"))
	if err != nil || name == "" {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "invalid name")
		return
	}

	var req struct {
		NewName string `json:"newName"`
	}
	if err := middleware.ReadJSONBody(w, r, &req, maxUserRequestBodySize); err != nil {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "invalid request body")
		return
	}

	newName := strings.TrimSpace(req.NewName)
	if newName == "" {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "newName is required")
		return
	}
	if len(newName) > 100 {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "newName too long")
		return
	}
	if newName == name {
		middleware.JSON(w, r, http.StatusOK, map[string]interface{}{})
		return
	}

	err = db.WithTx(ctx, h.pool.Pool(), func(ctx context.Context, q *sqlc.Queries) error {
		if _, err := q.GetUserCommonAddress(ctx, sqlc.GetUserCommonAddressParams{
			UserID: userID,
			Name:   name,
		}); err != nil {
			if stderrors.Is(err, pgx.ErrNoRows) {
				return errCommonAddressNotFound
			}
			return fmt.Errorf("get common address: %w", err)
		}

		_, err := q.GetUserCommonAddress(ctx, sqlc.GetUserCommonAddressParams{
			UserID: userID,
			Name:   newName,
		})
		if err == nil {
			if err := q.MergeUserCommonAddress(ctx, sqlc.MergeUserCommonAddressParams{
				UserID: userID,
				Name:   name,
				Name_2: newName,
			}); err != nil {
				return fmt.Errorf("merge common address: %w", err)
			}
		} else if stderrors.Is(err, pgx.ErrNoRows) {
			if err := q.RenameUserCommonAddress(ctx, sqlc.RenameUserCommonAddressParams{
				UserID: userID,
				Name:   name,
				Name_2: newName,
			}); err != nil {
				return fmt.Errorf("rename common address: %w", err)
			}
		} else {
			return fmt.Errorf("check new name common address: %w", err)
		}

		if err := h.renameDiaryEntriesAddress(ctx, q, userID, name, newName); err != nil {
			return fmt.Errorf("rename diary entries address: %w", err)
		}
		return nil
	})
	if err != nil {
		if stderrors.Is(err, errCommonAddressNotFound) {
			middleware.JSONError(w, r, http.StatusNotFound, errors.CodeBadRequest, "common address not found")
			return
		}
		slog.ErrorContext(ctx, "failed to update common address name",
			slog.String("user_id", userID),
			slog.String("name", name),
			slog.String("new_name", newName),
			slog.Any("error", err))
		middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to update common address name")
		return
	}

	middleware.JSON(w, r, http.StatusOK, map[string]interface{}{})
}

const renameDiaryEntriesAddressBatchSize = 1000

func (h *Handler) renameDiaryEntriesAddress(ctx context.Context, q *sqlc.Queries, userID, oldName, newName string) error {
	oldAddr := pgtype.Text{String: oldName, Valid: true}
	newAddr := pgtype.Text{String: newName, Valid: true}

	for {
		affected, err := q.UpdateDiaryEntriesAddressBatch(ctx, sqlc.UpdateDiaryEntriesAddressBatchParams{
			CreatedBy: userID,
			Address:   oldAddr,
			Limit:     renameDiaryEntriesAddressBatchSize,
			Address_2: newAddr,
		})
		if err != nil {
			return err
		}
		if affected == 0 {
			break
		}
	}
	return nil
}
