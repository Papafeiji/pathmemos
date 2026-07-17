package auth

import (
	"context"
	"crypto/rand"
	stderrors "errors"
	"fmt"
	"log/slog"
	"math/big"
	"net/http"
	"time"

	"papafeiji/backend/internal/avatar"
	"papafeiji/backend/internal/config"
	"papafeiji/backend/internal/db"
	"papafeiji/backend/internal/db/sqlc"
	"papafeiji/backend/internal/family"
	"papafeiji/backend/internal/file"
	"papafeiji/backend/internal/middleware"
	"papafeiji/backend/internal/pkg/safe"
	"papafeiji/backend/internal/user"
	"papafeiji/backend/internal/userinfo"
	"papafeiji/backend/internal/vip"
	dbx "papafeiji/backend/pkg/db"
	"papafeiji/backend/pkg/errors"
	"papafeiji/backend/pkg/timeutil"
	"papafeiji/backend/pkg/util"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/redis/go-redis/v9"
)

type Handler struct {
	router        chi.Router
	pool          *db.Pool
	bgPool        *db.Pool
	rdb           *redis.Client
	sessions      *middleware.SessionManager
	wechat        *WechatClient
	vipService    VIPService
	familyService FamilyService
	avatarService *avatar.Service
	storage       *file.Storage

	defaultAvatar string
}

type VIPService interface {
	vip.InfoProvider
	IssueTrialVIPWithTx(ctx context.Context, userID string, q *sqlc.Queries) error
	ExtendVIPDaysWithTx(ctx context.Context, userID string, days int, q *sqlc.Queries) error
}

type FamilyService interface {
	GetFamily(ctx context.Context, userID string) (*family.FamilyInfo, error)
	DeleteAccount(ctx context.Context, userID string) (*family.AccountCleanupInfo, error)
}

func NewHandlerWithBackgroundPool(router chi.Router, pool *db.Pool, bgPool *db.Pool, rdb *redis.Client, cfg *config.Config, sessions *middleware.SessionManager, vipService VIPService, familyService FamilyService, avatarService *avatar.Service, storage *file.Storage, defaultAvatarURL string) *Handler {
	return &Handler{
		router:        router,
		pool:          pool,
		bgPool:        bgPool,
		rdb:           rdb,
		sessions:      sessions,
		wechat:        NewWechatClient(cfg, rdb),
		vipService:    vipService,
		familyService: familyService,
		avatarService: avatarService,
		storage:       storage,
		defaultAvatar: defaultAvatarURL,
	}
}

func (h *Handler) RegisterPublic(router chi.Router) {
	router.Post("/auth/login", h.Login)
}

func (h *Handler) RegisterProtected(router chi.Router) {
	router.Post("/auth/logout", h.Logout)
	router.Get("/auth/phone", h.GetPhone)
	router.Post("/auth/phone/bind", h.BindPhone)
	router.Post("/auth/phone/unbind", h.UnbindPhone)
	// DELETE /auth/account 由 main.go 单独注册（含 IP 限流）
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var req struct {
		Code    string `json:"code"`
		Inviter string `json:"inviter"`
	}
	if err := middleware.ReadJSONBody(w, r, &req, 4096); err != nil {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "invalid request body")
		return
	}
	if req.Code == "" {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "code is required")
		return
	}

	session, err := h.wechat.Jscode2session(ctx, req.Code)
	if err != nil {
		slog.ErrorContext(ctx, "wechat jscode2session failed", slog.Any("error", err))
		if stderrors.Is(err, ErrWechatInvalidCode) {
			middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "invalid wechat code")
		} else {
			middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "wechat login failed")
		}
		return
	}

	user, isNew, err := h.findOrCreateUser(ctx, session, req.Inviter)
	if err != nil {
		slog.ErrorContext(ctx, "login findOrCreateUser failed", slog.Any("error", err))
		middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "login failed")
		return
	}

	// Reconcile orphan wx_mp_accounts records (e.g. user followed service account before
	// their mini-program account had a unionid set).
	if session.UnionID != "" {
		if linkErr := h.pool.Queries().LinkWxMPAccountByUnionID(ctx, sqlc.LinkWxMPAccountByUnionIDParams{
			Unionid: toNullText(session.UnionID),
			UserID:  toNullText(user.ID),
		}); linkErr != nil {
			slog.WarnContext(ctx, "link wx mp account by unionid failed", slog.String("user_id", user.ID), slog.String("unionid", util.MaskID(session.UnionID)), slog.Any("error", linkErr))
		}
	}

	sessionID, err := h.sessions.Create(ctx, user.ID)
	if err != nil {
		slog.ErrorContext(ctx, "failed to create session", slog.Any("error", err))
		middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to create session")
		return
	}

	mpSubscribed := false
	mpAccount, accErr := h.pool.Queries().GetWxMPAccountByUserID(ctx, pgtype.Text{String: user.ID, Valid: true})
	if accErr == nil {
		mpSubscribed = mpAccount.Subscribed
	}
	userInfo := userinfo.Build(ctx, user, h.vipService, h.defaultAvatar, mpSubscribed)
	middleware.JSON(w, r, http.StatusOK, map[string]interface{}{
		"sessionId": sessionID,
		"newUser":   isNew,
		"userInfo":  userInfo,
	})
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	sessionID := middleware.SessionID(ctx)
	if sessionID == "" {
		middleware.JSONError(w, r, http.StatusUnauthorized, errors.CodeUnauthorized, "unauthorized")
		return
	}

	if err := h.sessions.Delete(ctx, sessionID); err != nil {
		slog.ErrorContext(ctx, "delete session failed", slog.String("session_id", util.MaskID(sessionID)), slog.Any("error", err))
		middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "logout failed")
		return
	}

	middleware.JSON(w, r, http.StatusOK, map[string]interface{}{})
}

func (h *Handler) GetPhone(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.UserID(ctx)

	user, err := h.pool.Queries().GetUserByID(ctx, userID)
	if err != nil {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "user not found")
		return
	}

	var phone interface{}
	if user.PhoneNumber.Valid {
		phone = user.PhoneNumber.String
	} else {
		phone = nil
	}

	canModifyToday := true
	if user.PhoneNumber.Valid && user.PhoneNumber.String != "" && user.PhoneBindTime.Valid {
		bindDate := user.PhoneBindTime.Time.In(timeutil.Shanghai).Format("2006-01-02")
		today := timeutil.NowShanghai().Format("2006-01-02")
		canModifyToday = bindDate != today
	}

	middleware.JSON(w, r, http.StatusOK, map[string]interface{}{
		"phoneNumber":    phone,
		"canModifyToday": canModifyToday,
	})
}

func (h *Handler) BindPhone(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.UserID(ctx)

	var req struct {
		Code string `json:"code"`
	}
	if err := middleware.ReadJSONBody(w, r, &req, 4096); err != nil {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "invalid request body")
		return
	}

	phone, err := h.wechat.GetPhoneNumber(ctx, req.Code)
	if err != nil {
		slog.ErrorContext(ctx, "bind phone getPhoneNumber failed", slog.String("user_id", userID), slog.Any("error", err))
		if stderrors.Is(err, ErrWechatInvalidCode) {
			middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "invalid phone code")
		} else {
			middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to get phone number")
		}
		return
	}

	if err := h.pool.Queries().UpdateUserPhone(ctx, sqlc.UpdateUserPhoneParams{
		ID:            userID,
		PhoneNumber:   pgtype.Text{String: phone, Valid: true},
		PhoneBindTime: nowPgxTimestamptz(),
	}); err != nil {
		if dbx.IsUniqueViolation(err) {
			middleware.JSONError(w, r, errors.HTTPStatus(errors.BizPhoneAlreadyBound), errors.CodeBadRequest, "phone already bound")
			return
		}
		err = fmt.Errorf("bind phone: %w", err)
		slog.ErrorContext(ctx, "bind phone failed", slog.String("user_id", userID), slog.Any("error", err))
		middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to bind phone")
		return
	}

	middleware.JSON(w, r, http.StatusOK, map[string]interface{}{})
}

func (h *Handler) UnbindPhone(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.UserID(ctx)

	var req struct {
		Code string `json:"code"`
	}
	if err := middleware.ReadJSONBody(w, r, &req, 4096); err != nil {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "invalid request body")
		return
	}

	phone, err := h.wechat.GetPhoneNumber(ctx, req.Code)
	if err != nil {
		slog.ErrorContext(ctx, "unbind phone getPhoneNumber failed", slog.String("user_id", userID), slog.Any("error", err))
		if stderrors.Is(err, ErrWechatInvalidCode) {
			middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "invalid phone code")
		} else {
			middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to verify phone number")
		}
		return
	}

	user, err := h.pool.Queries().GetUserByID(ctx, userID)
	if err != nil {
		slog.ErrorContext(ctx, "unbind phone get user failed", slog.String("user_id", userID), slog.Any("error", err))
		middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to get user")
		return
	}
	if !user.PhoneNumber.Valid || user.PhoneNumber.String == "" {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "phone not bound")
		return
	}
	if phone != user.PhoneNumber.String {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "phone number mismatch")
		return
	}

	if err := h.pool.Queries().UpdateUserPhone(ctx, sqlc.UpdateUserPhoneParams{
		ID:            userID,
		PhoneNumber:   pgtype.Text{},
		PhoneBindTime: pgtype.Timestamptz{},
	}); err != nil {
		err = fmt.Errorf("unbind phone: %w", err)
		slog.ErrorContext(ctx, "unbind phone failed", slog.String("user_id", userID), slog.Any("error", err))
		middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to unbind phone")
		return
	}

	middleware.JSON(w, r, http.StatusOK, map[string]interface{}{})
}

// DeleteAccount 注销当前登录账号。
// 风险接受：DB 提交后的 session/物理文件清理失败均只记录日志并返回 200，
// 避免用户误以为注销未成功而重复操作；残留数据由后台补偿任务与 TTL 自然过期兜底（AGENTS.md §2.5/§4.4）。
func (h *Handler) DeleteAccount(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.UserID(ctx)

	var req struct {
		ConfirmName string `json:"confirmName"`
	}
	if err := middleware.ReadJSONBody(w, r, &req, 4096); err != nil {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "invalid request body")
		return
	}
	if req.ConfirmName == "" {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "confirmName is required")
		return
	}

	currentUser, err := h.pool.Queries().GetUserByID(ctx, userID)
	if err != nil {
		if stderrors.Is(err, pgx.ErrNoRows) {
			middleware.JSONError(w, r, http.StatusNotFound, errors.CodeBadRequest, "user not found")
			return
		}
		slog.ErrorContext(ctx, "delete account get user failed", slog.String("user_id", userID), slog.Any("error", err))
		middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to delete account")
		return
	}
	if !currentUser.Nickname.Valid || currentUser.Nickname.String == "" {
		slog.ErrorContext(ctx, "delete account user nickname missing", slog.String("user_id", userID))
		middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to delete account")
		return
	}
	if req.ConfirmName != currentUser.Nickname.String {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "confirmName mismatch")
		return
	}

	// 1. 立即删除当前 session，使当前登录状态失效。
	sessionID := middleware.SessionID(ctx)
	if err := h.sessions.Delete(ctx, sessionID); err != nil {
		slog.ErrorContext(ctx, "delete current session before account deletion failed", slog.String("user_id", userID), slog.String("session_id", util.MaskID(sessionID)), slog.Any("error", err))
		middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to delete account")
		return
	}

	// 2. 在事务内完成账号数据删除；不再在 beforeCommit 中处理 session。
	cleanup, err := h.familyService.DeleteAccount(ctx, userID)
	if err != nil {
		switch err {
		case family.ErrOperationInProgress:
			middleware.JSONError(w, r, errors.HTTPStatus(errors.BizOperationInProgress), errors.CodeBadRequest, err.Error())
		default:
			middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "failed to delete account")
		}
		return
	}

	// 3. DB 提交成功后，在后台 goroutine 中尽力清理受影响用户的 session 与物理文件。
	// MCP 模块已迁移至 stateless Streamable HTTP，无 in-memory session 需清理。
	// 账号数据已删除，此处清理失败不应再返回 500，避免用户认为操作未成功而重复注销；
	// 残留 session 由 TTL 自然过期兜底，不再额外启动后台补偿任务（AGENTS.md 简单优先）。
	safe.Go(ctx, nil, func() {
		bgCtx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()
		user.CleanupAfterAccountDeletion(bgCtx, h.pool, h.bgPool, h.sessions, h.storage, cleanup, userID)
	})

	middleware.JSON(w, r, http.StatusOK, map[string]interface{}{})
}

func (h *Handler) findOrCreateUser(ctx context.Context, session *WechatSession, inviter string) (*sqlc.GetUserByIDRow, bool, error) {
	queries := h.pool.Queries()

	if session.UnionID != "" {
		user, err := queries.GetUserByUnionID(ctx, toNullText(session.UnionID))
		if err == nil {

			if err := queries.UpdateUserSessionKey(ctx, sqlc.UpdateUserSessionKeyParams{
				ID:         user.ID,
				SessionKey: toNullText(session.SessionKey),
			}); err != nil {
				return nil, false, fmt.Errorf("update session key: %w", err)
			}
			fullUser, err := queries.GetUserByID(ctx, user.ID)
			if err != nil {
				return nil, false, fmt.Errorf("get user after union login: %w", err)
			}
			return &fullUser, false, nil
		}
	}

	user, err := queries.GetUserByOpenID(ctx, session.OpenID)
	if err == nil {

		if err := queries.UpdateUserSessionKey(ctx, sqlc.UpdateUserSessionKeyParams{
			ID:         user.ID,
			SessionKey: toNullText(session.SessionKey),
		}); err != nil {
			return nil, false, fmt.Errorf("update session key: %w", err)
		}

		if session.UnionID != "" && (!user.Unionid.Valid || user.Unionid.String == "") {
			if err := queries.UpdateUserUnionID(ctx, sqlc.UpdateUserUnionIDParams{
				ID:      user.ID,
				Unionid: toNullText(session.UnionID),
			}); err != nil {
				return nil, false, fmt.Errorf("update union id: %w", err)
			}
		}
		fullUser, err := queries.GetUserByID(ctx, user.ID)
		if err != nil {
			return nil, false, fmt.Errorf("get user after openid login: %w", err)
		}
		return &fullUser, false, nil
	}

	userID, err := util.NewUUID()
	if err != nil {
		return nil, false, fmt.Errorf("generate user id: %w", err)
	}
	familyID, err := util.NewUUID()
	if err != nil {
		return nil, false, fmt.Errorf("generate family id: %w", err)
	}
	membershipID, err := util.NewUUID()
	if err != nil {
		return nil, false, fmt.Errorf("generate membership id: %w", err)
	}

	defaultNickname := randomNickname()
	var inviterID string
	if inviter != "" {
		_, err := h.pool.Queries().GetUserByID(ctx, inviter)
		if err == nil {
			inviterID = inviter
		} else if !stderrors.Is(err, pgx.ErrNoRows) {
			slog.WarnContext(ctx, "check inviter failed, skipping invite reward", slog.String("inviter", util.MaskID(inviter)), slog.Any("error", err))
		}
	}

	if err := db.WithTx(ctx, h.pool.Pool(), func(ctx context.Context, q *sqlc.Queries) error {
		if _, err := q.CreateFamily(ctx, sqlc.CreateFamilyParams{
			ID:         familyID,
			IsPersonal: true,
		}); err != nil {
			return fmt.Errorf("create family: %w", err)
		}

		if _, err := q.CreateUser(ctx, sqlc.CreateUserParams{
			ID:               userID,
			OpenID:           session.OpenID,
			Unionid:          toNullText(session.UnionID),
			Nickname:         toNullText(defaultNickname),
			UserType:         "wechat",
			SessionKey:       toNullText(session.SessionKey),
			PersonalFamilyID: toNullText(familyID),
			CurrentFamilyID:  toNullText(familyID),
			InvitedBy:        toNullText(inviterID),
		}); err != nil {
			return fmt.Errorf("create user: %w", err)
		}

		if _, err := q.UpsertFamilyMembership(ctx, sqlc.UpsertFamilyMembershipParams{
			ID:       membershipID,
			FamilyID: familyID,
			UserID:   userID,
			Role:     "owner",
		}); err != nil {
			return fmt.Errorf("upsert family membership: %w", err)
		}

		if err := h.vipService.IssueTrialVIPWithTx(ctx, userID, q); err != nil {
			return fmt.Errorf("issue trial vip: %w", err)
		}

		if inviterID != "" {
			// 在事务内再次确认邀请人仍存在；若已被删除则跳过奖励，避免外键约束导致注册失败。
			if _, checkErr := q.GetUserByID(ctx, inviterID); checkErr == nil {
				inviteID, err := util.NewUUID()
				if err != nil {
					return fmt.Errorf("generate invite id: %w", err)
				}
				if _, err := q.CreateUserInvite(ctx, sqlc.CreateUserInviteParams{
					ID:        inviteID,
					UserID:    userID,
					InviterID: inviterID,
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
				if err := q.LockInviterReward(ctx, toNullText(inviterID)); err != nil {
					return fmt.Errorf("lock inviter reward: %w", err)
				}
				rewardedDays, err := q.CountInviterMonthlyRewardDays(ctx, sqlc.CountInviterMonthlyRewardDaysParams{
					InviterID:         inviterID,
					RewardInviterAt:   pgtype.Timestamptz{Time: monthStart, Valid: true},
					RewardInviterAt_2: pgtype.Timestamptz{Time: monthEnd, Valid: true},
				})
				if err != nil {
					return fmt.Errorf("count inviter monthly reward days: %w", err)
				}
				if rewardedDays < 14 {
					// Mark first, then extend, so concurrent logins cannot double-reward.
					rewardedRows, err := q.MarkInviterRewarded(ctx, inviteID)
					if err != nil {
						return fmt.Errorf("mark inviter rewarded: %w", err)
					}
					if rewardedRows > 0 {
						if err := h.vipService.ExtendVIPDaysWithTx(ctx, inviterID, 7, q); err != nil {
							return fmt.Errorf("extend inviter vip: %w", err)
						}
					}
				}
			}
		}

		if _, err := createOrGetUserInviteCode(ctx, q, userID); err != nil {
			return fmt.Errorf("create invite code: %w", err)
		}

		return nil
	}); err != nil {
		if dbx.IsUniqueViolation(err) {

			var existingID string
			if existing, openErr := queries.GetUserByOpenID(ctx, session.OpenID); openErr == nil {
				existingID = existing.ID
			} else if session.UnionID != "" {
				if existingUnion, unionErr := queries.GetUserByUnionID(ctx, toNullText(session.UnionID)); unionErr == nil {
					existingID = existingUnion.ID
				}
			}
			if existingID != "" {
				if updateErr := queries.UpdateUserSessionKey(ctx, sqlc.UpdateUserSessionKeyParams{
					ID:         existingID,
					SessionKey: toNullText(session.SessionKey),
				}); updateErr != nil {
					return nil, false, fmt.Errorf("update session key after race: %w", updateErr)
				}
				if session.UnionID != "" {
					if unionErr := queries.UpdateUserUnionID(ctx, sqlc.UpdateUserUnionIDParams{
						ID:      existingID,
						Unionid: toNullText(session.UnionID),
					}); unionErr != nil {
						slog.ErrorContext(ctx, "update user union id after race failed", slog.String("user_id", existingID), slog.Any("error", unionErr))
					}
				}
				fullUser, getErr := queries.GetUserByID(ctx, existingID)
				if getErr != nil {
					return nil, false, fmt.Errorf("get user after race: %w", getErr)
				}
				return &fullUser, false, nil
			}
		}
		return nil, false, err
	}

	newUser, err := queries.GetUserByID(ctx, userID)
	if err != nil {
		return nil, false, fmt.Errorf("get user after create: %w", err)
	}

	if h.avatarService != nil && h.defaultAvatar != "" {
		avatarURL := h.defaultAvatarURLString(userID)
		if avatarURL != "" {
			safe.Go(ctx, nil, func() {
				bgCtx, cancel := context.WithTimeout(context.Background(), avatar.GenerateMarkerTimeout)
				defer cancel()
				if _, err := h.avatarService.GenerateMarker(bgCtx, userID, avatarURL); err != nil {
					slog.ErrorContext(bgCtx, "generate avatar marker for new user failed", slog.String("user_id", userID), slog.String("avatar", avatarURL), slog.Any("error", err))
					return
				}
				queries := h.pool.Queries()
				if h.bgPool != nil {
					queries = h.bgPool.Queries()
				}
				if err := queries.UpdateUserAvatar(bgCtx, sqlc.UpdateUserAvatarParams{
					ID:           userID,
					Avatar:       pgtype.Text{String: avatarURL, Valid: true},
					AvatarFileID: pgtype.Text{},
				}); err != nil {
					slog.ErrorContext(bgCtx, "update new user avatar failed", slog.String("user_id", userID), slog.Any("error", err))
				}
			})
		}
	}

	return &newUser, true, nil
}

func generateUserInviteCode() string {
	chars := []rune(inviteCodeChars)
	max := big.NewInt(int64(len(chars)))
	b := make([]rune, 8)
	for i := 0; i < 8; i++ {
		n, err := rand.Int(rand.Reader, max)
		if err != nil {
			b[i] = chars[0]
			continue
		}
		b[i] = chars[n.Int64()]
	}
	return string(b)
}

func createOrGetUserInviteCode(ctx context.Context, q *sqlc.Queries, userID string) (string, error) {
	shortCode := generateUserInviteCode()
	if _, err := q.CreateUserInviteCode(ctx, sqlc.CreateUserInviteCodeParams{
		UserID:    userID,
		ShortCode: shortCode,
	}); err != nil {
		if dbx.IsUniqueViolation(err) {
			// 并发或冲突时复用该用户已存在的短码，与二维码生成侧 ensureShortCode 保持一致。
			if existing, getErr := q.GetUserInviteCode(ctx, userID); getErr == nil && existing != "" {
				return existing, nil
			}
		}
		return "", fmt.Errorf("create user invite code: %w", err)
	}
	return shortCode, nil
}

const inviteCodeChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

func (h *Handler) defaultAvatarURLString(userID string) string {
	if h.defaultAvatar == "" {
		return ""
	}
	return h.defaultAvatar + userID
}

func (h *Handler) GetWechatClient() *WechatClient {
	return h.wechat
}

func toNullText(s string) pgtype.Text {
	if s == "" {
		return pgtype.Text{}
	}
	return pgtype.Text{String: s, Valid: true}
}

func nowPgxTimestamptz() pgtype.Timestamptz {
	return pgtype.Timestamptz{Time: time.Now(), Valid: true}
}

var nicknameAdjectives = []string{
	"小熊", "小鹿", "小兔", "小猫", "小狗", "小熊猫", "小松鼠", "小狐狸",
	"向日葵", "蒲公英", "小雏菊", "四叶草", "樱花", "桂花", "梅花",
	"小星星", "小月亮", "小云朵", "小彩虹", "小太阳",
}

func randomNickname() string {
	adjIdx, err := rand.Int(rand.Reader, big.NewInt(int64(len(nicknameAdjectives))))
	if err != nil {
		// 系统熵源异常时不阻塞登录，回退到确定性昵称。
		return fmt.Sprintf("用户_%d", time.Now().Unix()%10000)
	}
	suffix, err := rand.Int(rand.Reader, big.NewInt(9000))
	if err != nil {
		return fmt.Sprintf("%s_%d", nicknameAdjectives[adjIdx.Int64()], time.Now().Unix()%9000)
	}
	return fmt.Sprintf("%s_%d", nicknameAdjectives[adjIdx.Int64()], 1000+suffix.Int64())
}
