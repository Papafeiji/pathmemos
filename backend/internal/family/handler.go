package family

import (
	"context"
	stderrors "errors"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"papafeiji/backend/internal/db"
	"papafeiji/backend/internal/db/sqlc"
	"papafeiji/backend/internal/middleware"
	"papafeiji/backend/pkg/errors"
	"papafeiji/backend/pkg/timeutil"
	"papafeiji/backend/pkg/util"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/redis/go-redis/v9"
)

type VipServicer interface {
	ExtendVIPDaysWithTx(ctx context.Context, userID string, days int, q *sqlc.Queries) error
}

type Handler struct {
	router        chi.Router
	service       *Service
	pool          *db.Pool
	vipService    VipServicer
	defaultAvatar string
}

func NewHandler(router chi.Router, pool *db.Pool, rdb *redis.Client, lock *db.Lock, defaultAvatarURL string, vipService VipServicer) *Handler {
	svc := NewService(pool, rdb, lock, defaultAvatarURL)
	return &Handler{
		router:        router,
		service:       svc,
		pool:          pool,
		vipService:    vipService,
		defaultAvatar: defaultAvatarURL,
	}
}

func (h *Handler) Register() {
	h.router.Get("/family", h.GetFamily)
	h.router.Post("/family", h.CreateFamily)
	h.router.Post("/family/invite-link", h.CreateInviteLink)
	h.router.Post("/family/invite-link/join", h.JoinByInviteLink)
	h.router.Post("/family/leave", h.LeaveFamily)
	h.router.Delete("/family/members/{userId}", h.RemoveMember)
	h.router.Delete("/family", h.DissolveFamily)
}

func (h *Handler) GetFamily(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.UserID(ctx)

	info, err := h.service.GetFamily(ctx, userID)
	if err != nil {

		middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to get family info")
		return
	}

	members := make([]map[string]interface{}, 0, len(info.Members))
	for _, m := range info.Members {
		members = append(members, map[string]interface{}{
			"userId":    m.UserID,
			"avatarUrl": m.Avatar,
			"nickName":  m.Nickname,
			"role":      m.Role,
			"joinedAt":  m.JoinedAt.Format("2006-01-02T15:04:05-07:00"),
		})
	}

	middleware.JSON(w, r, http.StatusOK, map[string]interface{}{
		"familyId":   info.FamilyID,
		"ownerId":    info.OwnerID,
		"isPersonal": info.IsPersonal,
		"members":    members,
	})
}

func (h *Handler) CreateFamily(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.UserID(ctx)

	familyID, err := h.service.CreateFamily(ctx, userID)
	if err != nil {
		switch err {
		case ErrAlreadyInFamily:
			middleware.JSONError(w, r, errors.HTTPStatus(errors.BizAlreadyInFamily), errors.CodeBadRequest, err.Error(), errors.BizAlreadyInFamily)
		case ErrOperationInProgress:
			middleware.JSONError(w, r, errors.HTTPStatus(errors.BizOperationInProgress), errors.CodeBadRequest, err.Error(), errors.BizOperationInProgress)
		default:
			middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to create family")
		}
		return
	}

	middleware.JSON(w, r, http.StatusOK, map[string]interface{}{
		"familyId": familyID,
	})
}

func (h *Handler) LeaveFamily(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.UserID(ctx)

	if err := h.service.LeaveFamily(ctx, userID); err != nil {
		switch err {
		case ErrNotInNormalFamily:
			middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, err.Error())
		case ErrOwnerCannotLeave:
			middleware.JSONError(w, r, errors.HTTPStatus(errors.BizOwnerCannotLeaveFamily), errors.CodeBadRequest, err.Error(), errors.BizOwnerCannotLeaveFamily)
		case ErrOperationInProgress:
			middleware.JSONError(w, r, errors.HTTPStatus(errors.BizOperationInProgress), errors.CodeBadRequest, err.Error(), errors.BizOperationInProgress)
		default:
			middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to leave family")
		}
		return
	}

	middleware.JSON(w, r, http.StatusOK, map[string]interface{}{})
}

func (h *Handler) RemoveMember(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.UserID(ctx)
	targetUserID := chi.URLParam(r, "userId")

	if targetUserID == "" {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "userId is required")
		return
	}

	if err := h.service.RemoveMember(ctx, userID, targetUserID); err != nil {
		switch err {
		case ErrCannotRemoveSelf:
			middleware.JSONError(w, r, errors.HTTPStatus(errors.BizCannotRemoveSelf), errors.CodeBadRequest, err.Error(), errors.BizCannotRemoveSelf)
		case ErrCannotRemoveOwner:
			middleware.JSONError(w, r, errors.HTTPStatus(errors.BizCannotRemoveOwner), errors.CodeBadRequest, err.Error(), errors.BizCannotRemoveOwner)
		case ErrNotInNormalFamily, ErrNotOwner:
			middleware.JSONError(w, r, http.StatusForbidden, errors.CodeForbidden, err.Error())
		case ErrTargetNotInFamily:
			middleware.JSONError(w, r, http.StatusNotFound, errors.CodeNotFound, err.Error())
		case ErrOperationInProgress:
			middleware.JSONError(w, r, errors.HTTPStatus(errors.BizOperationInProgress), errors.CodeBadRequest, err.Error(), errors.BizOperationInProgress)
		default:
			middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to remove member")
		}
		return
	}

	middleware.JSON(w, r, http.StatusOK, map[string]interface{}{})
}

func (h *Handler) DissolveFamily(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.UserID(ctx)

	if err := h.service.DissolveFamily(ctx, userID); err != nil {
		switch err {
		case ErrCannotDissolvePersonal:
			middleware.JSONError(w, r, http.StatusForbidden, errors.CodeForbidden, err.Error())
		case ErrNotOwner:
			middleware.JSONError(w, r, http.StatusForbidden, errors.CodeForbidden, err.Error())
		case ErrOperationInProgress:
			middleware.JSONError(w, r, errors.HTTPStatus(errors.BizOperationInProgress), errors.CodeBadRequest, err.Error(), errors.BizOperationInProgress)
		default:
			middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to dissolve family")
		}
		return
	}

	middleware.JSON(w, r, http.StatusOK, map[string]interface{}{})
}

func (h *Handler) CreateInviteLink(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.UserID(ctx)

	info, err := h.service.GetFamily(ctx, userID)
	if err != nil {

		middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to get family info")
		return
	}
	if info.FamilyID == "" {
		middleware.JSONError(w, r, http.StatusNotFound, errors.CodeNotFound, "family not found")
		return
	}

	linkID := info.FamilyID
	if info.IsPersonal {
		newFamilyID, err := h.service.CreateFamily(ctx, userID)
		if err != nil {
			switch err {
			case ErrAlreadyInFamily:
				middleware.JSONError(w, r, errors.HTTPStatus(errors.BizAlreadyInFamily), errors.CodeBadRequest, err.Error(), errors.BizAlreadyInFamily)
			case ErrOperationInProgress:
				middleware.JSONError(w, r, errors.HTTPStatus(errors.BizOperationInProgress), errors.CodeBadRequest, err.Error(), errors.BizOperationInProgress)
			default:
				middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to create family")
			}
			return
		}
		linkID = newFamilyID
	}

	middleware.JSON(w, r, http.StatusOK, map[string]interface{}{
		"linkId": linkID,
	})
}

func (h *Handler) JoinByInviteLink(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.UserID(ctx)

	var req struct {
		LinkID string `json:"linkId"`
	}
	if err := middleware.ReadJSONBody(w, r, &req, 64*1024); err != nil {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "invalid request body")
		return
	}
	if req.LinkID == "" {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "linkId is required")
		return
	}

	if err := h.service.JoinFamily(ctx, userID, req.LinkID); err != nil {

		switch err {
		case ErrFamilyNotFound:
			middleware.JSONError(w, r, errors.HTTPStatus(errors.BizFamilyNotFound), errors.CodeBadRequest, err.Error(), errors.BizFamilyNotFound)
		case ErrTargetIsPersonalFamily:
			middleware.JSONError(w, r, errors.HTTPStatus(errors.BizTargetIsPersonalFamily), errors.CodeBadRequest, err.Error(), errors.BizTargetIsPersonalFamily)
		case ErrAlreadyInTargetFamily:
			middleware.JSON(w, r, http.StatusOK, map[string]interface{}{})
		case ErrFamilyFull:
			middleware.JSONError(w, r, errors.HTTPStatus(errors.BizFamilyFull), errors.CodeBadRequest, err.Error(), errors.BizFamilyFull)
		case ErrOperationInProgress:
			middleware.JSONError(w, r, errors.HTTPStatus(errors.BizOperationInProgress), errors.CodeBadRequest, err.Error(), errors.BizOperationInProgress)
		default:
			middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to join family")
		}
		return
	}

	h.grantJoinReward(ctx, userID, req.LinkID)
	middleware.JSON(w, r, http.StatusOK, map[string]interface{}{})
}

func (h *Handler) grantJoinReward(ctx context.Context, userID, familyID string) {
	if _, err := h.pool.Queries().GetUserInviteByUserID(ctx, userID); err == nil {
		return
	} else if !stderrors.Is(err, pgx.ErrNoRows) {
		slog.WarnContext(ctx, "check user invite failed", "user_id", userID, "error", err)
		return
	}

	u, err := h.pool.Queries().GetUserByID(ctx, userID)
	if err != nil {
		return
	}
	if time.Since(u.CreatedAt.Time) > 5*time.Minute {
		return
	}

	ownerID, err := h.pool.Queries().GetFamilyOwner(ctx, familyID)
	if err != nil || ownerID == "" {
		return
	}
	if ownerID == userID {
		return
	}

	if err := db.WithTxDeferrable(ctx, h.pool.Pool(), func(ctx context.Context, q *sqlc.Queries) error {
		if _, innerErr := q.GetUserInviteByUserID(ctx, userID); innerErr == nil {
			return nil
		} else if !stderrors.Is(innerErr, pgx.ErrNoRows) {
			return nil
		}

		if _, checkErr := q.GetUserByID(ctx, ownerID); checkErr != nil {
			return nil
		}

		inviteID, err := util.NewUUID()
		if err != nil {
			return fmt.Errorf("generate invite id: %w", err)
		}
		if _, err := q.CreateUserInvite(ctx, sqlc.CreateUserInviteParams{
			ID:        inviteID,
			UserID:    userID,
			InviterID: ownerID,
		}); err != nil {
			return fmt.Errorf("create user invite: %w", err)
		}

		if err := h.vipService.ExtendVIPDaysWithTx(ctx, userID, 3, q); err != nil {
			return fmt.Errorf("extend invitee vip: %w", err)
		}
		if _, err := q.MarkInviteeRewarded(ctx, inviteID); err != nil {
			return fmt.Errorf("mark invitee rewarded: %w", err)
		}

		now := timeutil.NowShanghai()
		monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, timeutil.Shanghai)
		monthEnd := monthStart.AddDate(0, 1, 0)
		if err := q.LockInviterReward(ctx, toNullText(ownerID)); err != nil {
			return fmt.Errorf("lock inviter reward: %w", err)
		}
		rewardedDays, err := q.CountInviterMonthlyRewardDays(ctx, sqlc.CountInviterMonthlyRewardDaysParams{
			InviterID:         ownerID,
			RewardInviterAt:   pgtype.Timestamptz{Time: monthStart, Valid: true},
			RewardInviterAt_2: pgtype.Timestamptz{Time: monthEnd, Valid: true},
		})
		if err != nil {
			return fmt.Errorf("count inviter monthly reward days: %w", err)
		}
		if rewardedDays < 14 {
			rewardedRows, err := q.MarkInviterRewarded(ctx, inviteID)
			if err != nil {
				return fmt.Errorf("mark inviter rewarded: %w", err)
			}
			if rewardedRows > 0 {
				if err := h.vipService.ExtendVIPDaysWithTx(ctx, ownerID, 7, q); err != nil {
					return fmt.Errorf("extend inviter vip: %w", err)
				}
			}
		}

		return nil
	}); err != nil {
		slog.WarnContext(ctx, "grant join reward failed", "user_id", userID, "family_id", familyID, "error", err)
	}
}

func toNullText(s string) pgtype.Text {
	if s == "" {
		return pgtype.Text{}
	}
	return pgtype.Text{String: s, Valid: true}
}
