// Package jobs provides related functionality.
package jobs

import (
	"context"
	"fmt"
	"log/slog"
	"runtime/debug"
	"sync"
	"sync/atomic"
	"time"

	"papafeiji/backend/internal/autorecord"
	"papafeiji/backend/internal/config"
	"papafeiji/backend/internal/db"
	"papafeiji/backend/internal/db/sqlc"
	"papafeiji/backend/internal/file"
	"papafeiji/backend/internal/pkg/safe"
	"papafeiji/backend/internal/purge"
	"papafeiji/backend/internal/push"
	"papafeiji/backend/pkg/timeutil"

	"github.com/jackc/pgx/v5/pgtype"
)

const (
	lockAutoRecord            = "lock:background:auto_record"
	lockAbnormalAlert         = "lock:background:abnormal_alert"
	lockOrderClose            = "lock:background:order_close"
	lockCleanupAILogs         = "lock:background:cleanup_ai_logs"
	lockCleanupTrajectories   = "lock:background:cleanup_trajectories"
	lockCleanupOrphanFiles    = "lock:background:cleanup_orphan_files"
	lockCleanupOrphanTrajMaps = "lock:background:cleanup_orphan_traj_maps"
	lockCleanupClientOpsLogs  = "lock:background:cleanup_client_ops_logs"
	lockCommonAddressSummary  = "lock:background:common_address_summary"
	lockPurgeDeletedObjects   = "lock:background:purge_deleted_objects"
)

// maxPurgeBatchesPerRun 单轮最多刷新批数（20 × purge.MaxBatch = 1 万 URL/轮），其余留待下轮。
const maxPurgeBatchesPerRun = 20

type Runner struct {
	pool        *db.Pool
	bgPool      *db.Pool
	lock        db.Locker
	autoService *autorecord.Service
	pushService *push.Service
	storage     *file.Storage
	cfg         *config.Config
	purgeQueue  *purge.Queue
	purger      *purge.Purger
	wg          sync.WaitGroup
	cancel      context.CancelFunc
	tickersMu   sync.Mutex
	tickers     []*time.Ticker
}

func NewRunner(pool, bgPool *db.Pool, autoService *autorecord.Service, storage *file.Storage, pushService *push.Service, cfg *config.Config, purgeQueue *purge.Queue, purger *purge.Purger) *Runner {
	return &Runner{
		pool:        pool,
		bgPool:      bgPool,
		lock:        db.NewAdvisoryLock(bgPool.PGX()),
		autoService: autoService,
		pushService: pushService,
		storage:     storage,
		cfg:         cfg,
		purgeQueue:  purgeQueue,
		purger:      purger,
	}
}

func (r *Runner) Start(ctx context.Context) {
	ctx, cancel := context.WithCancel(ctx)
	r.cancel = cancel

	r.schedule(ctx, r.interval(r.cfg.JobIntervalAutoRecord, 5*time.Minute), 10*time.Minute, lockAutoRecord, r.runAutoRecord)
	r.schedule(ctx, r.interval(r.cfg.JobIntervalAbnormalAlert, 5*time.Minute), 5*time.Minute, lockAbnormalAlert, r.runAbnormalAlertCheck)
	r.schedule(ctx, r.interval(r.cfg.JobIntervalOrderClose, time.Minute), 5*time.Minute, lockOrderClose, r.runOrderClose)
	r.schedule(ctx, r.interval(r.cfg.JobIntervalCleanupAILogs, 24*time.Hour), 10*time.Minute, lockCleanupAILogs, r.runCleanupAILogs)
	r.schedule(ctx, r.interval(r.cfg.JobIntervalCleanupTrajectories, 6*time.Hour), 10*time.Minute, lockCleanupTrajectories, r.runCleanupTrajectories)
	r.schedule(ctx, r.interval(r.cfg.JobIntervalCleanupClientOpsLogs, 24*time.Hour), 10*time.Minute, lockCleanupClientOpsLogs, r.runCleanupClientOpsLogs)
	r.schedule(ctx, r.interval(r.cfg.JobIntervalCleanupOrphanFiles, 7*24*time.Hour), 30*time.Minute, lockCleanupOrphanFiles, r.runCleanupOrphanFiles)
	r.schedule(ctx, r.interval(r.cfg.JobIntervalCleanupOrphanTrajMaps, 7*24*time.Hour), 10*time.Minute, lockCleanupOrphanTrajMaps, r.runCleanupOrphanTrajMaps)
	r.scheduleDailyAt(ctx, 3, 0, 30*time.Minute, lockCommonAddressSummary, r.runCommonAddressSummary)
	r.schedule(ctx, r.interval(r.cfg.JobIntervalPurgeDeletedObjects, 24*time.Hour), 10*time.Minute, lockPurgeDeletedObjects, r.runPurgeDeletedObjects)
}

func (r *Runner) interval(cfgValue, def time.Duration) time.Duration {
	if r.cfg != nil && cfgValue > 0 {
		return cfgValue
	}
	return def
}

func (r *Runner) Stop() {
	if r.cancel != nil {
		r.cancel()
	}
	r.tickersMu.Lock()
	for _, t := range r.tickers {
		t.Stop()
	}
	r.tickers = nil
	r.tickersMu.Unlock()
	done := make(chan struct{})
	safe.Go(context.Background(), nil, func() {
		r.wg.Wait()
		close(done)
	})
	timer := time.NewTimer(30 * time.Second)
	select {
	case <-done:
		timer.Stop()
	case <-timer.C:

	}
}

func (r *Runner) schedule(ctx context.Context, interval, maxDuration time.Duration, lockKey string, fn func(context.Context) error) {
	ticker := time.NewTicker(interval)
	r.tickersMu.Lock()
	r.tickers = append(r.tickers, ticker)
	r.tickersMu.Unlock()

	r.wg.Add(1)
	safe.GoWithRecover(ctx, nil, func() error {
		defer r.wg.Done()
		for {
			select {
			case <-ctx.Done():
				return nil
			case <-ticker.C:
				func() {
					defer func() {
						if rec := recover(); rec != nil {
							slog.ErrorContext(ctx, "background job tick handler panicked",
								slog.String("lock_key", lockKey),
								slog.Any("recover", rec),
								slog.String("stack", string(debug.Stack())))
						}
					}()
					r.runTask(ctx, lockKey, maxDuration, fn)
				}()
			}
		}
	}, func(err error) {
		slog.ErrorContext(ctx, "background job schedule goroutine exited permanently",
			slog.String("lock_key", lockKey),
			slog.Any("error", err),
			slog.String("stack", string(debug.Stack())))
	})
}

// scheduleDailyAt 在每天指定时刻触发任务，首次会等待到下一个触发点。
func (r *Runner) scheduleDailyAt(ctx context.Context, hour, min int, maxDuration time.Duration, lockKey string, fn func(context.Context) error) {
	// 按上海时区计算触发点：容器时区常为 UTC，直接 now.Location() 会偏移 8 小时。
	now := timeutil.NowShanghai()
	next := time.Date(now.Year(), now.Month(), now.Day(), hour, min, 0, 0, timeutil.Shanghai)
	if !next.After(now) {
		next = next.Add(24 * time.Hour)
	}

	r.wg.Add(1)
	safe.GoWithRecover(ctx, nil, func() error {
		defer r.wg.Done()
		select {
		case <-ctx.Done():
			return nil
		case <-time.After(time.Until(next)):
			r.runTask(ctx, lockKey, maxDuration, fn)
		}

		ticker := time.NewTicker(24 * time.Hour)
		r.tickersMu.Lock()
		r.tickers = append(r.tickers, ticker)
		r.tickersMu.Unlock()
		for {
			select {
			case <-ctx.Done():
				ticker.Stop()
				return nil
			case <-ticker.C:
				func() {
					defer func() {
						if rec := recover(); rec != nil {
							slog.ErrorContext(ctx, "background job tick handler panicked",
								slog.String("lock_key", lockKey),
								slog.Any("recover", rec),
								slog.String("stack", string(debug.Stack())))
						}
					}()
					r.runTask(ctx, lockKey, maxDuration, fn)
				}()
			}
		}
	}, func(err error) {
		slog.ErrorContext(ctx, "background job schedule goroutine exited permanently",
			slog.String("lock_key", lockKey),
			slog.Any("error", err),
			slog.String("stack", string(debug.Stack())))
	})
}

func (r *Runner) runTask(ctx context.Context, lockKey string, maxDuration time.Duration, fn func(context.Context) error) {
	taskCtx, cancel := context.WithTimeout(ctx, maxDuration)
	defer cancel()

	if lockKey != "" {
		// advisory lock 为会话级锁：无 TTL，进程崩溃随连接断开自动释放，无需续期。
		ok, token, err := r.lock.TryLock(ctx, lockKey)
		if err != nil {
			slog.ErrorContext(ctx, "background job lock error", slog.String("lock_key", lockKey), slog.Any("error", err))
			return
		}
		if !ok {
			return
		}
		defer func() {
			//nolint:errcheck
			r.lock.Unlock(context.WithoutCancel(ctx), lockKey, token)
		}()
	}

	done := make(chan error, 1)
	start := time.Now()
	safe.GoWithRecover(taskCtx, nil, func() error {
		done <- fn(taskCtx)
		return nil
	}, func(panicErr error) {
		done <- panicErr
	})

	if err := <-done; err != nil {
		elapsed := time.Since(start)
		if elapsed > maxDuration*8/10 {
			slog.Warn("background job slow", slog.String("lock_key", lockKey), slog.Duration("elapsed", elapsed), slog.Duration("max_duration", maxDuration))
		}
		slog.Error("background job failed", slog.String("lock_key", lockKey), slog.Any("error", err))
		return
	}
	elapsed := time.Since(start)
	if elapsed > maxDuration*8/10 {
		slog.Warn("background job slow", slog.String("lock_key", lockKey), slog.Duration("elapsed", elapsed), slog.Duration("max_duration", maxDuration))
	}
}

func (r *Runner) runAutoRecord(ctx context.Context) error {
	return r.autoService.ProcessRound(ctx)
}

const (
	commonAddressSummaryWorkers   = 5
	commonAddressSummaryBatchSize = 1000
)

func (r *Runner) runCommonAddressSummary(ctx context.Context) error {
	// 统计昨日有日记变动的用户（上海时区自然日）。
	now := timeutil.NowShanghai()
	yesterday := now.Add(-24 * time.Hour)
	start := time.Date(yesterday.Year(), yesterday.Month(), yesterday.Day(), 0, 0, 0, 0, timeutil.Shanghai)
	end := start.Add(24 * time.Hour)

	// 固定工作池 + 游标分批投递，避免一次性物化昨日全部变更用户 ID。
	jobs := make(chan string, commonAddressSummaryBatchSize)
	var wg sync.WaitGroup
	var failed atomic.Int32
	for i := 0; i < commonAddressSummaryWorkers; i++ {
		wg.Add(1)
		safe.Go(ctx, nil, func() {
			defer wg.Done()
			for userID := range jobs {
				if err := db.SummarizeUserCommonAddresses(ctx, r.pool, userID); err != nil {
					slog.ErrorContext(ctx, "common address summary user failed",
						slog.String("user_id", userID),
						slog.Any("error", err))
					failed.Add(1)
				}
			}
		})
	}

	cursor := ""
	for {
		userIDs, err := r.pool.Queries().ListUsersWithDiaryChangesSince(ctx, sqlc.ListUsersWithDiaryChangesSinceParams{
			UpdatedAt:  pgtype.Timestamptz{Time: start.UTC(), Valid: true},
			UpdatedAt2: pgtype.Timestamptz{Time: end.UTC(), Valid: true},
			Cursor:     cursor,
			Limit:      commonAddressSummaryBatchSize,
		})
		if err != nil {
			close(jobs)
			wg.Wait()
			return fmt.Errorf("list users with diary changes: %w", err)
		}
		if len(userIDs) == 0 {
			break
		}
		for _, userID := range userIDs {
			jobs <- userID
		}
		cursor = userIDs[len(userIDs)-1]
		if len(userIDs) < commonAddressSummaryBatchSize {
			break
		}
	}
	close(jobs)
	wg.Wait()

	if failed.Load() > 0 {
		return fmt.Errorf("common address summary completed with %d failures", failed.Load())
	}
	return nil
}

const abnormalAlertBatchSize = 100

func (r *Runner) runAbnormalAlertCheck(ctx context.Context) error {
	if r.pushService == nil {
		return nil
	}

	now := time.Now().UTC()
	cutoff := now.Add(-60 * time.Minute)
	currentDate := timeutil.NowShanghai()

	// 异常告警仅在 8:00-22:00 时间窗口内推送（AGENTS.md 5.16 LR11）。
	if currentDate.Hour() < 8 || currentDate.Hour() >= 22 {
		return nil
	}

	// seen 记录本轮已尝试过的用户：候选过滤依赖 SendAbnormalAlert 成功后推进
	// abnormal_alert_sent_at；发送持续失败的用户会反复出现在候选里。
	// 当整批都是已尝试过的用户时视为无进展，退出本轮，剩余交给下一周期。
	seen := make(map[string]struct{})
	for {
		users, err := r.bgPool.Queries().ListAbnormalAlertCandidates(ctx, sqlc.ListAbnormalAlertCandidatesParams{
			Column1: pgtype.Timestamptz{Time: cutoff, Valid: true},
			Column2: abnormalAlertBatchSize,
		})
		if err != nil {
			return err
		}
		if len(users) == 0 {
			return nil
		}

		var batch []string
		for _, u := range users {
			if _, ok := seen[u.ID]; !ok {
				batch = append(batch, u.ID)
				seen[u.ID] = struct{}{}
			}
		}
		if len(batch) == 0 {
			slog.WarnContext(ctx, "abnormal alert batch has no progress, deferring rest to next cycle",
				slog.Int("candidates", len(users)))
			return nil
		}

		var wg sync.WaitGroup
		for _, id := range batch {
			wg.Add(1)
			safe.Go(ctx, nil, func() {
				defer wg.Done()
				if sendErr := r.pushService.SendAbnormalAlert(ctx, id); sendErr != nil {
					slog.ErrorContext(ctx, "send abnormal alert failed",
						slog.String("user_id", id), slog.Any("error", sendErr))
				}
			})
		}
		wg.Wait()

		if len(users) < abnormalAlertBatchSize {
			return nil
		}
	}
}

func (r *Runner) runOrderClose(ctx context.Context) error {

	cutoff := time.Now().Add(-24 * time.Hour)
	cursorID := ""
	for {
		orders, err := r.bgPool.Queries().ListPendingOrdersBefore(ctx, sqlc.ListPendingOrdersBeforeParams{
			CreatedAt: pgtype.Timestamptz{Time: cutoff, Valid: true},
			CursorID:  cursorID,
		})
		if err != nil {
			return err
		}
		if len(orders) == 0 {
			return nil
		}

		outTradeNos := make([]string, 0, len(orders))
		userIDs := make([]string, 0, len(orders))
		for _, order := range orders {
			if !order.UserID.Valid || order.UserID.String == "" {
				// 无效 user_id 的订单无法通过 CloseOrder 关闭（WHERE user_id = NULL 匹配 0 行），
				// 跳过并继续处理，避免无限循环。
				continue
			}
			outTradeNos = append(outTradeNos, order.OutTradeNo)
			userIDs = append(userIDs, order.UserID.String)
		}
		if len(outTradeNos) > 0 {
			if _, err := r.bgPool.Queries().CloseOrdersBatch(ctx, sqlc.CloseOrdersBatchParams{
				OutTradeNos: outTradeNos,
				UserIds:     userIDs,
			}); err != nil {
				return fmt.Errorf("close orders batch: %w", err)
			}
		}

		cursorID = orders[len(orders)-1].ID
		if len(orders) < 1000 {
			return nil
		}
	}
}

const cleanupBatchSize = 1000

func (r *Runner) runCleanupAILogs(ctx context.Context) error {
	for {
		n, err := r.bgPool.Queries().DeleteOldDialogLogs(ctx, cleanupBatchSize)
		if err != nil {
			return err
		}
		if n < cleanupBatchSize {
			return nil
		}
	}
}

func (r *Runner) runCleanupClientOpsLogs(ctx context.Context) error {
	for {
		n, err := r.bgPool.Queries().DeleteOldClientOpsLogs(ctx, cleanupBatchSize)
		if err != nil {
			return err
		}
		if n < cleanupBatchSize {
			return nil
		}
	}
}

func (r *Runner) runCleanupTrajectories(ctx context.Context) error {
	for {
		n, err := r.bgPool.Queries().DeleteStaleTrajectories(ctx, cleanupBatchSize)
		if err != nil {
			return err
		}
		if n < cleanupBatchSize {
			return nil
		}
	}
}

func (r *Runner) runCleanupOrphanFiles(ctx context.Context) error {
	if r.storage == nil {
		return nil
	}
	if err := r.bgPool.Queries().ClearAvatarReferencesToOrphanFiles(ctx); err != nil {
		slog.ErrorContext(ctx, "clear avatar references failed", slog.Any("error", err))
	}
	lastID := ""
	for {
		rows, err := r.bgPool.Queries().ScanOrphanFiles(ctx, lastID)
		if err != nil {
			return err
		}
		if len(rows) == 0 {
			return nil
		}
		for _, f := range rows {
			fileRecord, err := r.bgPool.Queries().GetFileByID(ctx, f.ID)
			if err != nil {
				slog.ErrorContext(ctx, "get orphan file record failed", slog.String("file_id", f.ID), slog.Any("error", err))
				lastID = f.ID
				continue
			}
			if err := r.storage.DeleteFile(fileRecord.Path, fileRecord.StorageType); err != nil {
				slog.ErrorContext(ctx, "delete orphan physical file failed", slog.String("file_id", f.ID), slog.String("path", fileRecord.Path), slog.String("storage_type", fileRecord.StorageType), slog.Any("error", err))
				lastID = f.ID
				continue
			}
			if err := r.bgPool.Queries().DeleteFile(ctx, f.ID); err != nil {
				slog.ErrorContext(ctx, "delete orphan file record failed", slog.String("file_id", f.ID), slog.Any("error", err))
				lastID = f.ID
				continue
			}
			// 孤儿图片删除后回退用户图片配额（上传时已 IncrementUserImageStorage 计费），
			// 否则配额被幽灵字节永久占用，最终 checkStorageLimit 拒绝后续上传。
			if fileRecord.FileType == "image" && fileRecord.CreatedBy.Valid && fileRecord.CreatedBy.String != "" {
				if decErr := r.bgPool.Queries().DecrementUserImageStorage(ctx, sqlc.DecrementUserImageStorageParams{
					ID:                fileRecord.CreatedBy.String,
					ImageStorageBytes: fileRecord.SizeBytes,
				}); decErr != nil {
					slog.ErrorContext(ctx, "decrement user image storage failed for orphan file",
						slog.String("file_id", f.ID),
						slog.String("user_id", fileRecord.CreatedBy.String),
						slog.Int64("size", fileRecord.SizeBytes),
						slog.Any("error", decErr))
				}
			}
			lastID = f.ID
		}
		if len(rows) < 1000 {
			return nil
		}
	}
}

func (r *Runner) runCleanupOrphanTrajMaps(ctx context.Context) error {
	if r.storage == nil {
		return nil
	}
	lastID := ""
	for {
		rows, err := r.bgPool.Queries().ScanOldSystemFiles(ctx, lastID)
		if err != nil {
			return err
		}
		if len(rows) == 0 {
			return nil
		}

		// 先删除物理文件，成功后再删除 DB 记录；物理删除失败时保留 DB 记录供下次重试。
		deletedIDs := make([]string, 0, len(rows))
		for _, f := range rows {
			if err := r.storage.DeleteFile(f.Path, f.StorageType); err != nil {
				slog.ErrorContext(ctx, "delete old system physical file failed", slog.String("file_id", f.ID), slog.String("path", f.Path), slog.String("storage_type", f.StorageType), slog.Any("error", err))
				continue
			}
			deletedIDs = append(deletedIDs, f.ID)
		}
		if len(deletedIDs) > 0 {
			if _, err := r.bgPool.Queries().BatchDeleteFiles(ctx, deletedIDs); err != nil {
				return fmt.Errorf("batch delete old system files: %w", err)
			}
		}
		lastID = rows[len(rows)-1].ID
		if len(rows) < 1000 {
			return nil
		}
	}
}

// runPurgeDeletedObjects 已删对象边缘缓存批量收敛（ADR-0013）：
// 从 Redis 队列分批取 URL 调阿里云 CDN 刷新；未启用（CDNRefreshEnabled=false）时空跑。
func (r *Runner) runPurgeDeletedObjects(ctx context.Context) error {
	if r.purgeQueue == nil || r.purger == nil {
		return nil
	}
	purged := 0
	for batch := 0; batch < maxPurgeBatchesPerRun; batch++ {
		urls, err := r.purgeQueue.Pop(ctx, purge.MaxBatch)
		if err != nil {
			return fmt.Errorf("pop purge queue: %w", err)
		}
		if len(urls) == 0 {
			break
		}
		if err := r.purger.Purge(ctx, urls); err != nil {
			// 刷新失败把本批放回队列，等待下一轮；本轮终止（上游大概率仍故障）。
			if rbErr := r.purgeQueue.PushBack(ctx, urls); rbErr != nil {
				slog.ErrorContext(ctx, "push back purge urls failed", slog.Int("count", len(urls)), slog.Any("error", rbErr))
			}
			return fmt.Errorf("cdn purge: %w", err)
		}
		purged += len(urls)
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(time.Second):
		}
	}
	if purged > 0 {
		if n, err := r.purgeQueue.Len(ctx); err == nil {
			slog.InfoContext(ctx, "purge deleted objects round", slog.Int("purged", purged), slog.Int64("pending", n))
		}
	}
	return nil
}
