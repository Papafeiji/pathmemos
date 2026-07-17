// Package ai provides related functionality.
package ai

import (
	"context"
	stderrors "errors"
	"fmt"
	"log/slog"

	"strings"
	"time"
	"unicode/utf8"

	"papafeiji/backend/internal/config"
	"papafeiji/backend/internal/db"
	"papafeiji/backend/internal/db/sqlc"
	"papafeiji/backend/internal/pkg/safe"
	"papafeiji/backend/internal/vip"
	"papafeiji/backend/pkg/timeutil"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/redis/go-redis/v9"
)

// dailyQuotaLua 对 Redis 辅助缓存做原子 check+incr，并在超出 limit 时自动回退。
// 用于 AI 配额消费的 Redis 前置闸门：Redis 异常时失败关闭，避免触碰数据库。
var dailyQuotaLua = redis.NewScript(`
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])
local cur = redis.call('incr', key)
if cur == 1 then
    redis.call('expire', key, ttl)
end
if cur > limit then
    redis.call('decr', key)
    return 0
end
return cur
`)

// refundDailyQuotaLua 对 Redis 辅助缓存做原子退费，仅在 key 存在且大于 0 时递减。
// 避免退费时将并发增量覆盖，或在 key 不存在时创建负值计数。
var refundDailyQuotaLua = redis.NewScript(`
local key = KEYS[1]
if redis.call('exists', key) == 0 then
    return -1
end
local cur = tonumber(redis.call('get', key))
if cur == nil then
    return -1
end
if cur > 0 then
    redis.call('decr', key)
    return redis.call('get', key)
end
return cur
`)

// dailyQuotaCacheTTLFor 返回指定日期对应的 Redis 缓存 TTL：到次日 0 点上海时区的剩余时间 + 60 秒缓冲。
// 保证配额缓存按自然日过期，避免 24 小时固定 TTL 导致的跨天计数偏差。
func dailyQuotaCacheTTLFor(t time.Time) time.Duration {
	loc := t.Location()
	if loc == nil {
		loc = timeutil.Shanghai
	}
	tz := time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, loc).Add(24 * time.Hour)
	ttl := tz.Sub(t) + 60*time.Second
	if ttl <= 0 {
		return 60 * time.Second
	}
	return ttl
}

// Service holds AI chat business logic independent of transport (SSE / WeChat MP / etc.).
type Service struct {
	pool         *db.Pool
	rdb          *redis.Client
	vipService   vip.InfoProvider
	sysCfgLoader *config.SysConfigLoader
	cfg          *config.Config
	client       *UpstreamClient
}

// NewService creates an AI chat service.
func NewService(pool *db.Pool, rdb *redis.Client, vipService vip.InfoProvider, sysCfgLoader *config.SysConfigLoader, cfg *config.Config) *Service {
	return &Service{
		pool:         pool,
		rdb:          rdb,
		vipService:   vipService,
		sysCfgLoader: sysCfgLoader,
		cfg:          cfg,
		client:       NewUpstreamClient(cfg),
	}
}

func (s *Service) sysCfg(ctx context.Context) (*config.SysConfig, error) {
	return s.sysCfgLoader.Load(ctx)
}

// Chat runs a complete AI chat turn. If onChunk is non-nil it is called for each streamed chunk.
// It returns the full assistant reply. Quota is consumed at the start and refunded automatically
// if no reply could be produced due to timeout or upstream error.
func (s *Service) Chat(ctx context.Context, userID, message string, onChunk func(string) error) (string, error) {
	sysCfg, err := s.sysCfg(ctx)
	if err != nil {
		return "", fmt.Errorf("load sys config: %w", err)
	}
	return s.chatWithPrompt(ctx, userID, message, onChunk, sysCfg.AIPrompt, sysCfg)
}

// ChatWithPrompt runs a complete AI chat turn with a custom system prompt. An empty systemPrompt falls back to the default prompt.
func (s *Service) ChatWithPrompt(ctx context.Context, userID, message string, onChunk func(string) error, systemPrompt string) (string, error) {
	sysCfg, err := s.sysCfg(ctx)
	if err != nil {
		return "", fmt.Errorf("load sys config: %w", err)
	}
	return s.ChatWithPromptUsingConfig(ctx, userID, message, onChunk, systemPrompt, sysCfg)
}

// ChatWithPromptUsingConfig runs ChatWithPrompt using an already loaded config to avoid duplicate DB loads.
func (s *Service) ChatWithPromptUsingConfig(ctx context.Context, userID, message string, onChunk func(string) error, systemPrompt string, sysCfg *config.SysConfig) (string, error) {
	if systemPrompt == "" {
		systemPrompt = sysCfg.AIPrompt
	}
	return s.chatWithPrompt(ctx, userID, message, onChunk, systemPrompt, sysCfg)
}

func (s *Service) chatWithPrompt(ctx context.Context, userID, message string, onChunk func(string) error, systemPrompt string, sysCfg *config.SysConfig) (string, error) {
	if userID == "" {
		return "", fmt.Errorf("user_id is empty")
	}

	msg := strings.TrimSpace(message)
	if msg == "" {
		return "", fmt.Errorf("message is empty")
	}
	if utf8.RuneCountInString(msg) > maxMessageCodePoints {
		return "", fmt.Errorf("message too long")
	}

	user, err := s.pool.Queries().GetUserByID(ctx, userID)
	if err != nil {
		return "", fmt.Errorf("get user: %w", err)
	}

	familyID := ""
	if user.CurrentFamilyID.Valid {
		familyID = user.CurrentFamilyID.String
	}

	background, err := s.buildBackground(ctx, userID, familyID)
	if err != nil {
		return "", fmt.Errorf("build background: %w", err)
	}

	dialogLogs, err := s.pool.Queries().ListRecentDialogLogs(ctx, sqlcArg(userID, 20))
	if err != nil {
		return "", fmt.Errorf("list recent dialog logs: %w", err)
	}

	info, err := s.vipService.GetVIPInfo(ctx, userID)
	if err != nil {
		return "", fmt.Errorf("get vip info for quota check: %w", err)
	}
	quota := dailyQuotaNonVIP
	if info.IsVIP {
		quota = dailyQuotaVIP
	}
	today := timeutil.NowShanghai()
	quotaDate := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, today.Location())
	quotaOK, quotaErr := s.tryConsumeDailyQuota(ctx, userID, quota, quotaDate)
	if quotaErr != nil {
		return "", fmt.Errorf("consume quota: %w", quotaErr)
	}
	if !quotaOK {
		return "", ErrAIDailyQuotaExceeded
	}

	nickname := ""
	if user.Nickname.Valid && user.Nickname.String != "" {
		nickname = user.Nickname.String
	}

	messages := buildMessages(systemPrompt, nickname, background, dialogLogs, msg, user.Lang)

	streamCtx, cancel := context.WithTimeout(ctx, AIStreamTimeout)
	defer cancel()

	stream, err := s.client.Stream(streamCtx, sysCfg.AIBaseURL, sysCfg.AIModel, sysCfg.AIThinkingType, sysCfg.AIMaxTokens, messages)
	if err != nil {
		safe.Go(ctx, nil, func() { s.refundDailyQuota(userID, quotaDate) })
		return "", fmt.Errorf("upstream stream: %w", err)
	}
	//nolint:errcheck
	defer stream.Close()

	var fullReply strings.Builder
	for {
		if err := streamCtx.Err(); err != nil {
			if fullReply.Len() == 0 {
				safe.Go(ctx, nil, func() { s.refundDailyQuota(userID, quotaDate) })
			}
			if fullReply.Len() > 0 {
				reply := fullReply.String()
				s.saveLogAsync(ctx, userID, msg, reply)
				return reply, nil
			}
			if stderrors.Is(err, context.DeadlineExceeded) {
				return "", errAIChatTimeout
			}
			return "", fmt.Errorf("stream context cancelled")
		}

		chunk, err := stream.Next()
		if err != nil {
			if stderrors.Is(err, context.Canceled) || stderrors.Is(err, context.DeadlineExceeded) {
				if fullReply.Len() == 0 {
					safe.Go(ctx, nil, func() { s.refundDailyQuota(userID, quotaDate) })
				}
				if fullReply.Len() > 0 {
					reply := fullReply.String()
					s.saveLogAsync(ctx, userID, msg, reply)
					return reply, nil
				}
				return "", errAIChatTimeout
			}

			if fullReply.Len() == 0 {
				safe.Go(ctx, nil, func() { s.refundDailyQuota(userID, quotaDate) })
			}
			if fullReply.Len() > 0 {
				reply := fullReply.String()
				s.saveLogAsync(ctx, userID, msg, reply)
				return reply, nil
			}
			return "", fmt.Errorf("upstream error: %w", err)
		}
		if chunk == "" {
			if fullReply.Len() == 0 {
				safe.Go(ctx, nil, func() { s.refundDailyQuota(userID, quotaDate) })
			}
			break
		}
		fullReply.WriteString(chunk)
		if onChunk != nil {
			if err := onChunk(chunk); err != nil {
				// Consumer stopped accepting chunks; still try to save what we have.
				if fullReply.Len() == 0 {
					safe.Go(ctx, nil, func() { s.refundDailyQuota(userID, quotaDate) })
				} else {
					reply := fullReply.String()
					s.saveLogAsync(ctx, userID, msg, reply)
				}
				return fullReply.String(), nil
			}
		}
	}

	reply := fullReply.String()
	if reply != "" {
		s.saveLogAsync(ctx, userID, msg, reply)
	}

	return reply, nil
}

func (s *Service) buildBackground(ctx context.Context, userID, familyID string) (string, error) {
	if familyID == "" {
		return "", nil
	}

	cacheKey := "ai:family_summary:" + familyID
	if cached, err := s.rdb.Get(ctx, cacheKey).Result(); err == nil && cached != "" {
		return cached, nil
	}

	rows, err := s.pool.Queries().ListAIBackgroundEntries(ctx, sqlcListArg(familyID, maxBackgroundEntries))
	if err != nil {
		return "", fmt.Errorf("list ai background entries: %w", err)
	}

	if len(rows) == 0 {
		_ = s.rdb.Set(ctx, cacheKey, "暂无日记记录", backgroundCacheTTL).Err() //nolint:errcheck // cache write is best-effort
		return "暂无日记记录", nil
	}

	const maxBackgroundLen = 100000

	var parts []string
	for _, r := range rows {
		if r.Content == "" {
			continue
		}
		parts = append(parts, r.Nickname+":\n"+r.Content)
	}

	background := strings.Join(parts, "\n\n")
	if utf8.RuneCountInString(background) > maxBackgroundLen {
		runes := []rune(background)
		background = string(runes[:maxBackgroundLen])
	}
	if background == "" {
		background = "暂无日记记录"
	}
	_ = s.rdb.Set(ctx, cacheKey, background, backgroundCacheTTL).Err() //nolint:errcheck // cache write is best-effort
	return background, nil
}

// tryConsumeDailyQuota 以数据库为配额权威，Redis 仅作辅助快速闸门。
// Redis 补偿/退费失败时，缓存计数可能短暂领先于 DB，导致用户在缓存 TTL 内被误限流；
// 该不一致会在缓存自然过期后按 DB 权威值重建，业务上接受这一小概率窗口（AGENTS.md §4.2/§3.10）。
func (s *Service) tryConsumeDailyQuota(ctx context.Context, userID string, quota int, quotaDate time.Time) (bool, error) {
	dateStr := quotaDate.Format("2006-01-02")
	key := fmt.Sprintf("%s:%s:%s", dailyQuotaKeyPrefix, userID, dateStr)

	// Redis 前置快速闸门：异常或已超限均失败关闭，不触碰数据库。
	// 缓存 TTL 按自然日，避免跨天计数与 DB 权威值不一致。
	ttlSeconds := int(dailyQuotaCacheTTLFor(quotaDate).Seconds())
	redisCur, err := dailyQuotaLua.Run(ctx, s.rdb, []string{key}, quota, ttlSeconds).Int64()
	if err != nil {
		return false, fmt.Errorf("check ai daily quota cache: %w", err)
	}
	if redisCur <= 0 {
		return false, nil
	}

	// 数据库为根本：原子扣减并返回扣减后的使用量及是否实际发生扣减。
	incrResult, err := s.pool.Queries().IncrementAIDailyQuotaUsed(ctx, sqlc.IncrementAIDailyQuotaUsedParams{
		UserID:    userID,
		QuotaDate: pgtype.Date{Time: quotaDate, Valid: true},
		Used:      int32(quota),
	})
	if err != nil {
		// DB 异常时回补 Redis，避免 Redis 计数领先于 DB。
		_ = s.rdb.Decr(ctx, key).Err() //nolint:errcheck // redis rollback is best-effort
		return false, fmt.Errorf("increment ai daily quota used: %w", err)
	}
	if !incrResult.Incremented {
		// DB 未实际扣减（已超限），回补 Redis 辅助缓存。
		_ = s.rdb.Decr(ctx, key).Err() //nolint:errcheck // redis rollback is best-effort
		return false, nil
	}

	return true, nil
}

func (s *Service) refundDailyQuota(userID string, quotaDate time.Time) {
	var dbUsed int32
	var lastErr error
	for attempt := 0; attempt < 4; attempt++ {
		if attempt > 0 {
			time.Sleep(100 * time.Millisecond * time.Duration(attempt))
		}
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		dbUsed, lastErr = s.pool.Queries().DecrementAIDailyQuotaUsed(ctx, sqlc.DecrementAIDailyQuotaUsedParams{
			UserID:    userID,
			QuotaDate: pgtype.Date{Time: quotaDate, Valid: true},
		})
		cancel()
		if lastErr == nil {
			break
		}

	}
	if lastErr != nil {
		// DB 退款失败意味着用户可能被扣减配额但未获得有效回复，需要触发监控告警人工兜底。
		slog.Error("alert:ai_quota_refund_failed", slog.String("user_id", userID), slog.String("quota_date", quotaDate.Format("2006-01-02")), slog.Any("error", lastErr))
		return
	}

	// DB 退款成功后，对 Redis 辅助缓存做原子退费；若缓存已过期则按 DB 权威值重建。
	key := fmt.Sprintf("%s:%s:%s", dailyQuotaKeyPrefix, userID, quotaDate.Format("2006-01-02"))
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	redisCur, err := refundDailyQuotaLua.Run(ctx, s.rdb, []string{key}).Int64()
	if err != nil {
		slog.WarnContext(ctx, "ai quota refund redis decrement failed", slog.String("user_id", userID), slog.Any("error", err))
		return
	}
	if redisCur == -1 {
		_ = s.rdb.Set(ctx, key, dbUsed, dailyQuotaCacheTTLFor(quotaDate)).Err() //nolint:errcheck // cache rebuild is best-effort
	}
}

func (s *Service) saveLogAsync(ctx context.Context, userID, userMsg, assistantMsg string) {
	safe.Go(ctx, nil, func() {
		bgCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_ = s.saveLog(bgCtx, userID, userMsg, assistantMsg) //nolint:errcheck // async log save is best-effort
	})
}

func (s *Service) saveLog(ctx context.Context, userID, userMsg, assistantMsg string) error {
	if userMsg == "" && assistantMsg == "" {
		return nil
	}
	now := time.Now()
	return db.WithTx(ctx, s.pool.Pool(), func(ctx context.Context, q *sqlc.Queries) error {
		userLogID, err := newID()
		if err != nil {
			return fmt.Errorf("generate user log id: %w", err)
		}
		if err := q.InsertAIDialogLog(ctx, sqlcInsertArg(userLogID, userID, "user", userMsg, now)); err != nil {
			return fmt.Errorf("insert user ai dialog log: %w", err)
		}
		if assistantMsg != "" {
			assistantLogID, err := newID()
			if err != nil {
				return fmt.Errorf("generate assistant log id: %w", err)
			}
			if err := q.InsertAIDialogLog(ctx, sqlcInsertArg(assistantLogID, userID, "assistant", assistantMsg, now)); err != nil {
				return fmt.Errorf("insert assistant ai dialog log: %w", err)
			}
		}
		return nil
	})
}

var (
	ErrAIDailyQuotaExceeded = fmt.Errorf("daily ai chat quota exceeded")
	errAIChatTimeout        = stderrors.New("ai chat timeout")
)
