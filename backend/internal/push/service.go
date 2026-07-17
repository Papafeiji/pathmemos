package push

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/url"
	"regexp"
	"strconv"
	"sync"
	"time"

	"papafeiji/backend/internal/auth"
	"papafeiji/backend/internal/config"
	"papafeiji/backend/internal/db"
	"papafeiji/backend/internal/db/sqlc"
	"papafeiji/backend/internal/pkg/safe"
	"papafeiji/backend/internal/vip"
	"papafeiji/backend/internal/wxmp"
	"papafeiji/backend/pkg/timeutil"
	"papafeiji/backend/pkg/util"

	"github.com/jackc/pgx/v5/pgtype"
	goredis "github.com/redis/go-redis/v9"
)

// Common WeChat error codes.
const (
	ErrCodeUserUnsubscribed    = 43004
	ErrCodeUserDeniedSubscribe = 43101
	ErrCodeInvalidTemplateData = 47003
	ErrCodeRateLimited         = 45009
)

// Service sends WeChat push notifications through official account and mini-program channels.
type Service struct {
	pool    *db.Pool
	cfg     *config.Config
	mini    *MiniSubscribeSender
	mp      *MPTemplateSender
	vipInfo vip.InfoProvider
}

// NewService creates a new push service.
func NewService(pool *db.Pool, cfg *config.Config, rdb *goredis.Client, wxMPClient *wxmp.Client, vipInfo vip.InfoProvider) *Service {
	wxClient := auth.NewWechatClient(cfg, rdb)
	tokenMgr := NewTokenManager(wxClient, wxMPClient)
	return &Service{
		pool:    pool,
		cfg:     cfg,
		mini:    NewMiniSubscribeSender(tokenMgr, cfg),
		mp:      NewMPTemplateSender(tokenMgr, cfg),
		vipInfo: vipInfo,
	}
}

// SendAbnormalAlert sends abnormal alert through official account and mini-program channels.
// 每天最多一次；先原子标记今日已发送，再推送。服务号优先，服务号失败时降级小程序。
// 推送本身为尽力而为，发送失败不撤销已记账的标记（宁可漏报不重报）。
func (s *Service) SendAbnormalAlert(ctx context.Context, userID string) error {
	now := timeutil.NowShanghai()
	hour := now.Hour()
	if hour < 8 || hour >= 22 {
		slog.DebugContext(ctx, "send abnormal alert skipped: outside time window",
			slog.String("user_id", userID),
			slog.Int("hour", hour))
		return nil
	}

	user, err := s.pool.Queries().GetUserByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("get user: %w", err)
	}

	if !user.AutoRecordEnabled {
		slog.DebugContext(ctx, "send abnormal alert skipped: auto record disabled",
			slog.String("user_id", userID))
		return nil
	}

	if !s.isVip(ctx, userID) {
		slog.DebugContext(ctx, "send abnormal alert skipped: not vip",
			slog.String("user_id", userID))
		return nil
	}

	pagePath := "pages/index/index"
	mpOpenid := ""
	miniOpenid := user.OpenID

	mpAcc, err := s.pool.Queries().GetWxMPAccountByUserID(ctx, pgtype.Text{String: userID, Valid: true})
	if err == nil && mpAcc.Subscribed && mpAcc.MpOpenid != "" {
		mpOpenid = mpAcc.MpOpenid
	}
	if err != nil {
		slog.WarnContext(ctx, "get wx mp account by user failed", slog.String("user_id", userID), slog.Any("error", err))
	}

	canMP := mpOpenid != ""
	canMini := user.AbnormalSubscribeAccepted && miniOpenid != ""

	if !canMP && !canMini {
		slog.DebugContext(ctx, "send abnormal alert skipped: no available channel",
			slog.String("user_id", userID),
			slog.Bool("can_mp", canMP),
			slog.Bool("can_mini", canMini))
		return nil
	}

	// 先原子标记已发送；标记失败或今日已发送则直接返回，避免重复推送。
	marked, err := s.pool.Queries().MarkAbnormalAlertSent(ctx, userID)
	if err != nil {
		return fmt.Errorf("mark abnormal alert sent: %w", err)
	}
	if marked == 0 {
		slog.DebugContext(ctx, "send abnormal alert skipped: already marked today",
			slog.String("user_id", userID))
		return nil
	}

	time9 := now.Format("2006年01月02日 15:04")
	time4 := now.Format("2006年01月02日 15:04:05")

	sendCtx, sendCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer sendCancel()

	// 服务号和小程序通道各自独立尝试；微信会自行过滤无额度的订阅消息。
	// 推送在 safe.Go 中执行以隔离 panic，失败仅记录日志、不影响已完成的告警去重记账。
	var wg sync.WaitGroup
	if canMP {
		wg.Add(1)
		safe.Go(context.Background(), nil, func() {
			defer wg.Done()
			if err := s.mp.SendAbnormalAlert(sendCtx, mpOpenid, s.cfg.WechatAppID, pagePath, time9); err != nil {
				s.handleMPError(context.Background(), err, mpOpenid)
			}
		})
	}
	if canMini {
		wg.Add(1)
		safe.Go(context.Background(), nil, func() {
			defer wg.Done()
			if err := s.mini.SendAbnormalAlert(sendCtx, miniOpenid, pagePath, time4); err != nil {
				s.handleMiniError(context.Background(), err, userID)
			}
		})
	}
	wg.Wait()

	return nil
}

// SendNewPlaceAlert sends new place alert through official account channel only.
// 每个新地点生成后都会尝试推送；发送失败只记日志，不影响主流程。
func (s *Service) SendNewPlaceAlert(ctx context.Context, userID, diaryID, entryID string) error {
	now := timeutil.NowShanghai()
	if h := now.Hour(); h < 6 || h >= 23 {
		slog.DebugContext(ctx, "send new place alert skipped: outside time window",
			slog.String("user_id", userID),
			slog.Int("hour", h))
		return nil
	}

	mpOpenid := ""
	var noMPReason string
	mpAcc, err := s.pool.Queries().GetWxMPAccountByUserID(ctx, pgtype.Text{String: userID, Valid: true})
	if err != nil {
		noMPReason = fmt.Sprintf("get wx_mp_account error: %v", err)
	} else if !mpAcc.Subscribed {
		noMPReason = "not subscribed"
	} else if mpAcc.MpOpenid == "" {
		noMPReason = "mp_openid empty"
	} else {
		mpOpenid = mpAcc.MpOpenid
	}

	if mpOpenid == "" {
		slog.DebugContext(ctx, "send new place alert skipped: no mp channel",
			slog.String("user_id", userID),
			slog.String("reason", noMPReason))
		return nil
	}

	entry, err := s.pool.Queries().GetDiaryEntry(ctx, entryID)
	if err != nil {
		return fmt.Errorf("get diary entry: %w", err)
	}

	placeName := ""
	if entry.Address.Valid && entry.Address.String != "" {
		placeName = entry.Address.String
	} else if entry.DetailAddress.Valid && entry.DetailAddress.String != "" {
		placeName = entry.DetailAddress.String
	}

	var recordTime time.Time
	if entry.RecordTime.Valid {
		recordTime = entry.RecordTime.Time
	} else {
		recordTime = timeutil.NowShanghai()
	}

	diary, err := s.pool.Queries().GetDiaryByID(ctx, diaryID)
	if err != nil {
		return fmt.Errorf("get diary: %w", err)
	}
	recordDate := ""
	if diary.RecordDate.Valid {
		recordDate = diary.RecordDate.Time.In(timeutil.Shanghai).Format("2006-01-02")
	}
	baseInfo := map[string]string{
		"id":         diaryID,
		"recordDate": recordDate,
		"dateName":   "",
		"coverImg":   "",
	}
	baseInfoJSON, err := json.Marshal(baseInfo)
	if err != nil {
		return fmt.Errorf("marshal baseInfo: %w", err)
	}
	pagePath := fmt.Sprintf("pages/NoteDetail/NoteDetail?baseInfo=%s", url.QueryEscape(string(baseInfoJSON)))
	dateStr := recordTime.In(timeutil.Shanghai).Format("2006年01月02日")
	timeStr := recordTime.In(timeutil.Shanghai).Format("15:04")

	if err := s.mp.SendNewPlaceAlert(ctx, mpOpenid, s.cfg.WechatAppID, pagePath, dateStr, timeStr, placeName); err != nil {
		s.handleMPError(ctx, err, mpOpenid)
		return err
	}

	return nil
}

// RecordSubscribe records user's subscription choice for abnormal alert.
func (s *Service) RecordSubscribe(ctx context.Context, userID string, accepted bool) error {
	return s.pool.Queries().UpdateUserAlertSubscribe(ctx, sqlc.UpdateUserAlertSubscribeParams{
		ID:                        userID,
		AbnormalSubscribeAccepted: accepted,
	})
}

// TouchActiveAt updates user's last active timestamp.
func (s *Service) TouchActiveAt(ctx context.Context, userID string) error {
	return s.pool.Queries().UpdateUserLastActiveAt(ctx, userID)
}

func (s *Service) isVip(ctx context.Context, userID string) bool {
	if s.vipInfo == nil {
		return false
	}
	info, err := s.vipInfo.GetVIPInfo(ctx, userID)
	if err != nil {
		return false
	}
	return info.IsVIP
}

func (s *Service) handleMPError(ctx context.Context, err error, mpOpenid string) {
	if err == nil {
		return
	}
	code := extractErrCode(err)
	switch code {
	case ErrCodeUserUnsubscribed:
		if updateErr := s.pool.Queries().UpdateWxMPAccountSubscribeStatus(ctx, sqlc.UpdateWxMPAccountSubscribeStatusParams{
			MpOpenid:   mpOpenid,
			Subscribed: false,
		}); updateErr != nil {
			slog.ErrorContext(ctx, "update mp subscribe status failed",
				slog.String("openid", util.MaskID(mpOpenid)), slog.Any("error", updateErr))
		}
	case ErrCodeInvalidTemplateData:
		slog.ErrorContext(ctx, "mp template data invalid", slog.String("openid", util.MaskID(mpOpenid)), slog.Any("error", err))
	case ErrCodeRateLimited:
		slog.WarnContext(ctx, "mp template rate limited", slog.String("openid", util.MaskID(mpOpenid)))
	}
}

func (s *Service) handleMiniError(ctx context.Context, err error, userID string) {
	if err == nil {
		return
	}
	code := extractErrCode(err)
	switch code {
	case ErrCodeUserDeniedSubscribe:
		if updateErr := s.pool.Queries().UpdateUserAlertSubscribe(ctx, sqlc.UpdateUserAlertSubscribeParams{
			ID:                        userID,
			AbnormalSubscribeAccepted: false,
		}); updateErr != nil {
			slog.ErrorContext(ctx, "update mini subscribe status failed",
				slog.String("user_id", userID), slog.Any("error", updateErr))
		}
	case ErrCodeInvalidTemplateData:
		slog.ErrorContext(ctx, "mini subscribe data invalid", slog.String("user_id", userID), slog.Any("error", err))
	case ErrCodeRateLimited:
		slog.WarnContext(ctx, "mini subscribe rate limited", slog.String("user_id", userID))
	}
}

var errCodePattern = regexp.MustCompile(`code=(\d+)`)

func extractErrCode(err error) int {
	if err == nil {
		return 0
	}
	matches := errCodePattern.FindStringSubmatch(err.Error())
	if len(matches) >= 2 {
		if code, parseErr := strconv.Atoi(matches[1]); parseErr == nil {
			return code
		}
	}
	return 0
}
