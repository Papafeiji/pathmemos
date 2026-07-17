package invite

import (
	"context"
	"errors"

	"net/http"
	"regexp"
	"time"

	"papafeiji/backend/internal/auth"
	"papafeiji/backend/internal/config"
	"papafeiji/backend/internal/db"
	"papafeiji/backend/internal/db/sqlc"
	"papafeiji/backend/internal/family"
	"papafeiji/backend/internal/file"
	"papafeiji/backend/internal/middleware"
	pkgerrors "papafeiji/backend/pkg/errors"
	"papafeiji/backend/pkg/util"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/redis/go-redis/v9"
)

const (
	inviteCodeCharset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
)

var inviteCodeRegex = regexp.MustCompile("^[" + inviteCodeCharset + "]{8}$")

type Handler struct {
	pool           *db.Pool
	rdb            *redis.Client
	familyService  FamilyService
	qrGenerator    *QRCodeGenerator
	cfg            *config.Config
	resolveLimiter *middleware.IPRateLimiter
}

type FamilyService interface {
	JoinFamily(ctx context.Context, userID, targetFamilyID string) error
	CreateFamily(ctx context.Context, userID string) (string, error)
}

func NewHandler(pool *db.Pool, rdb *redis.Client, familyService FamilyService, wechat *auth.WechatClient, storage *file.Storage, cfg *config.Config) *Handler {
	bgPath := defaultInviteBgPath()
	h := &Handler{
		pool:           pool,
		rdb:            rdb,
		familyService:  familyService,
		qrGenerator:    NewQRCodeGenerator(wechat, pool, storage, bgPath),
		cfg:            cfg,
		resolveLimiter: middleware.NewIPRateLimiter(60, time.Hour, cfg.TrustedProxyCIDR),
	}
	return h
}

// Stop 为安全空操作；解析接口限流器无后台 goroutine，无需释放资源。
func (h *Handler) Stop() {
	if h.resolveLimiter != nil {
		h.resolveLimiter.Stop()
	}
}

func defaultInviteBgPath() string {
	return "/app/assets/invite-share-cover.png"
}

func (h *Handler) RegisterPublic(router chi.Router) {

	// 邀请码可被枚举扫描，/invite/resolve 公开接口需限流：同 IP 每小时最多 60 次。
	router.With(h.resolveLimiter.Handler).Get("/invite/resolve", h.Resolve)
}

func (h *Handler) Register(router chi.Router) {
	router.Get("/invite/list", h.List)
	router.Post("/invite/join-family", h.JoinFamily)
	router.Post("/invite/qrcode", h.QRCode)
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.UserID(ctx)

	rows, err := h.pool.Queries().ListUserInvitesByInviter(ctx, userID)
	if err != nil {
		middleware.JSONError(w, r, http.StatusInternalServerError, pkgerrors.CodeInternalError, "failed to list invites")
		return
	}

	items := make([]map[string]interface{}, 0, len(rows))
	for _, row := range rows {
		items = append(items, map[string]interface{}{
			"userId":    row.UserID,
			"nickName":  textInterface(row.Nickname),
			"avatarUrl": avatarInterface(row.Avatar),
			"joined":    row.Joined.Valid && row.Joined.Bool,
		})
	}

	middleware.JSON(w, r, http.StatusOK, map[string]interface{}{
		"list": items,
	})
}

func (h *Handler) JoinFamily(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	// 该接口改为由被邀请人自己调用，只能加入自己注册时对应的邀请人家庭，
	// 避免邀请人无需确认即可把他人拉入家庭。
	inviteeID := middleware.UserID(ctx)

	var req struct {
		InviterID string `json:"inviterId"`
	}
	if err := middleware.ReadJSONBody(w, r, &req, 64*1024); err != nil {
		middleware.JSONError(w, r, http.StatusBadRequest, pkgerrors.CodeBadRequest, "invalid request body")
		return
	}
	if req.InviterID == "" {
		middleware.JSONError(w, r, http.StatusBadRequest, pkgerrors.CodeBadRequest, "inviterId is required")
		return
	}

	// 1. 校验当前用户确实是由该邀请人邀请注册的。
	ui, err := h.pool.Queries().GetUserInviteByUserID(ctx, inviteeID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			middleware.JSONError(w, r, http.StatusForbidden, pkgerrors.CodeForbidden, "no invite relation found")
			return
		}
		middleware.JSONError(w, r, http.StatusInternalServerError, pkgerrors.CodeInternalError, "failed to check invite relation")
		return
	}
	if ui.InviterID != req.InviterID {
		middleware.JSONError(w, r, http.StatusForbidden, pkgerrors.CodeForbidden, "inviter mismatch")
		return
	}

	// 2. 校验邀请人存在且是其当前非个人家庭的成员。
	inviter, err := h.pool.Queries().GetUserByID(ctx, req.InviterID)
	if err != nil {
		middleware.JSONError(w, r, http.StatusInternalServerError, pkgerrors.CodeInternalError, "failed to get inviter")
		return
	}
	inviterFamilyID := util.ToString(inviter.CurrentFamilyID)
	inviterPersonalFamilyID := util.ToString(inviter.PersonalFamilyID)
	if inviterFamilyID == "" || inviterFamilyID == inviterPersonalFamilyID {
		middleware.JSONError(w, r, http.StatusBadRequest, pkgerrors.CodeBadRequest, "inviter has no family")
		return
	}
	isMember, err := h.pool.Queries().IsFamilyMember(ctx, sqlc.IsFamilyMemberParams{
		FamilyID: inviterFamilyID,
		UserID:   req.InviterID,
	})
	if err != nil {
		middleware.JSONError(w, r, http.StatusInternalServerError, pkgerrors.CodeInternalError, "failed to check family membership")
		return
	}
	if !isMember {
		middleware.JSONError(w, r, http.StatusForbidden, pkgerrors.CodeForbidden, "inviter is not a family member")
		return
	}

	// 3. 校验被邀请人当前在个人家庭（未加入其他家庭）。
	invitee, err := h.pool.Queries().GetUserByID(ctx, inviteeID)
	if err != nil {
		middleware.JSONError(w, r, http.StatusInternalServerError, pkgerrors.CodeInternalError, "failed to get invitee")
		return
	}
	inviteeCurrentFamily := util.ToString(invitee.CurrentFamilyID)
	inviteePersonalFamily := util.ToString(invitee.PersonalFamilyID)
	if inviteeCurrentFamily == inviterFamilyID {
		// 已加入目标家庭，幂等返回成功（网络重试或重复点击的正常路径）。
		middleware.JSON(w, r, http.StatusOK, map[string]interface{}{})
		return
	}
	if inviteeCurrentFamily != "" && inviteeCurrentFamily != inviteePersonalFamily {
		middleware.JSONError(w, r, pkgerrors.HTTPStatus(pkgerrors.BizAlreadyInOtherFamily), pkgerrors.CodeBadRequest, "already in another family", pkgerrors.BizAlreadyInOtherFamily)
		return
	}

	// 4. 执行加入。
	if err := h.familyService.JoinFamily(ctx, inviteeID, inviterFamilyID); err != nil {
		switch err {
		case family.ErrAlreadyInTargetFamily:
			middleware.JSON(w, r, http.StatusOK, map[string]interface{}{})
			return
		case family.ErrFamilyFull:
			middleware.JSONError(w, r, pkgerrors.HTTPStatus(pkgerrors.BizFamilyFull), pkgerrors.CodeBadRequest, err.Error(), pkgerrors.BizFamilyFull)
		case family.ErrOperationInProgress:
			middleware.JSONError(w, r, pkgerrors.HTTPStatus(pkgerrors.BizOperationInProgress), pkgerrors.CodeBadRequest, err.Error(), pkgerrors.BizOperationInProgress)
		case family.ErrAlreadyInFamily:
			middleware.JSONError(w, r, pkgerrors.HTTPStatus(pkgerrors.BizAlreadyInOtherFamily), pkgerrors.CodeBadRequest, "already in another family", pkgerrors.BizAlreadyInOtherFamily)
		case family.ErrFamilyNotFound:
			middleware.JSONError(w, r, pkgerrors.HTTPStatus(pkgerrors.BizFamilyNotFound), pkgerrors.CodeBadRequest, err.Error(), pkgerrors.BizFamilyNotFound)
		case family.ErrTargetIsPersonalFamily:
			middleware.JSONError(w, r, http.StatusBadRequest, pkgerrors.CodeBadRequest, err.Error(), pkgerrors.BizTargetIsPersonalFamily)
		default:
			middleware.JSONError(w, r, http.StatusInternalServerError, pkgerrors.CodeInternalError, "failed to join family")
		}
		return
	}

	middleware.JSON(w, r, http.StatusOK, map[string]interface{}{})
}

func (h *Handler) QRCode(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.UserID(ctx)

	var req struct {
		Raw bool `json:"raw"`
	}
	if err := middleware.ReadJSONBodyAllowEmpty(w, r, &req, 64*1024); err != nil {
		middleware.JSONError(w, r, http.StatusBadRequest, pkgerrors.CodeBadRequest, "invalid request body")
		return
	}

	var url string
	var err error
	if req.Raw {
		url, err = h.qrGenerator.GenerateRaw(ctx, h.rdb, userID)
	} else {
		url, err = h.qrGenerator.Generate(ctx, h.rdb, userID)
	}
	if err != nil {

		middleware.JSONError(w, r, http.StatusInternalServerError, pkgerrors.CodeInternalError, "failed to generate invite qrcode")
		return
	}

	middleware.JSON(w, r, http.StatusOK, map[string]interface{}{
		"url": url,
	})
}

func (h *Handler) Resolve(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	shortCode := r.URL.Query().Get("code")

	if shortCode == "" || !inviteCodeRegex.MatchString(shortCode) {
		middleware.JSONError(w, r, http.StatusBadRequest, pkgerrors.CodeBadRequest, "invalid invite code")
		return
	}

	userID, err := ResolveInviterFromCode(ctx, h.pool.Queries(), shortCode)
	if err != nil {

		middleware.JSONError(w, r, http.StatusInternalServerError, pkgerrors.CodeInternalError, "failed to resolve invite code")
		return
	}
	if userID == "" {
		middleware.JSONError(w, r, http.StatusNotFound, pkgerrors.CodeBadRequest, "invite code not found")
		return
	}

	middleware.JSON(w, r, http.StatusOK, map[string]interface{}{
		"userId": userID,
	})
}

func textInterface(t pgtype.Text) interface{} {
	if !t.Valid || t.String == "" {
		return nil
	}
	return t.String
}

func avatarInterface(t pgtype.Text) interface{} {
	if !t.Valid || t.String == "" {
		return nil
	}
	return t.String
}
