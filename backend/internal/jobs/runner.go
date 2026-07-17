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
	"papafeiji/backend/internal/push"
	"papafeiji/backend/pkg/timeutil"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/redis/go-redis/v9"
)

const (
	lockAutoRecord            = "lock:background:auto_record"
	lockAbnormalAlert         = "lock:background:abnormal_alert"
	lockOrderClose            = "lock:background:order_close"
	lockCleanupAILogs         = "lock:background:cleanup_ai_logs"
	lockCleanupTrajectories   = "lock:background:cleanup_trajectories"
	lockCleanupOrphanFiles    = "lock:background:cleanup_orphan_files"
	lockCleanupOrphanTrajMaps = "lock:background:cleanup_orphan_traj_maps"
	lockCommonAddressSummary  = "lock:background:common_address_summary"

	// 后台任务锁 TTL 固定为 120s，与 maxDuration 解耦；续期 goroutine 负责在任务运行期间保持锁。
	// 按 5.19「TTL 选型原则（简单优先）」，锁靠 Redis TTL 自然过期，进程崩溃后最长 120s 可重新获取。
	backgroundJobLockTTL = 120 * time.Second
)

type Runner struct {
	pool        *db.Pool
	bgPool      *db.Pool
	rdb         *redis.Client
	lock        *db.Lock
	autoService *autorecord.Service
	pushService *push.Service
	storage     *file.Storage
	cfg         *config.Config
	wg          sync.WaitGroup
	cancel      context.CancelFunc
	tickers     []*time.Ticker
}

func NewRunner(pool, bgPool *db.Pool, rdb *redis.Client, autoService *autorecord.Service, storage *file.Storage, pushService *push.Service, cfg *config.Config) *Runner {
	return &Runner{
		pool:        pool,
		bgPool:      bgPool,
		rdb:         rdb,
		lock:        db.NewLock(rdb),
		autoService: autoService,
		pushService: pushService,
		storage:     storage,
		cfg:         cfg,
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
	r.schedule(ctx, r.interval(r.cfg.JobIntervalCleanupOrphanFiles, 7*24*time.Hour), 30*time.Minute, lockCleanupOrphanFiles, r.runCleanupOrphanFiles)
	r.schedule(ctx, r.interval(r.cfg.JobIntervalCleanupOrphanTrajMaps, 7*24*time.Hour), 10*time.Minute, lockCleanupOrphanTrajMaps, r.runCleanupOrphanTrajMaps)
	r.scheduleDailyAt(ctx, 3, 0, 30*time.Minute, lockCommonAddressSummary, r.runCommonAddressSummary)
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
	for _, t := range r.tickers {
		t.Stop()
	}
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
	r.tickers = append(r.tickers, ticker)

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
	now := time.Now()
	next := time.Date(now.Year(), now.Month(), now.Day(), hour, min, 0, 0, now.Location())
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
		r.tickers = append(r.tickers, ticker)
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
		ok, token, err := r.lock.TryLock(ctx, lockKey, backgroundJobLockTTL)
		if err != nil {
			slog.ErrorContext(ctx, "background job lock error", slog.String("lock_key", lockKey), slog.Any("error", err))
			return
		}
		if !ok {
			return
		}
		//nolint:errcheck
		defer r.lock.Unlock(context.WithoutCancel(ctx), lockKey, token)

		// 任务执行可能接近或超过 maxDuration，启动续期防止锁提前释放导致多实例并发。
		extendCtx, stopExtend := context.WithCancel(ctx)
		defer stopExtend()
		extendFailed := make(chan struct{}, 1)
		safe.GoWithRecover(extendCtx, nil, func() error {
			// 在 TTL 的 80% 处触发续期。
			ticker := time.NewTicker(backgroundJobLockTTL * 8 / 10)
			defer ticker.Stop()
			for {
				select {
				case <-extendCtx.Done():
					return nil
				case <-ticker.C:
					if ok, err := r.lock.Extend(extendCtx, lockKey, token, backgroundJobLockTTL); err != nil || !ok {
						slog.Error("background job extend lock failed", slog.String("lock_key", lockKey), slog.Any("error", err))
						select {
						case extendFailed <- struct{}{}:
						default:
						}
						return nil
					}
				}
			}
		}, func(panicErr error) {
			slog.Error("background job extend goroutine panicked", slog.String("lock_key", lockKey), slog.Any("error", panicErr))
			select {
			case extendFailed <- struct{}{}:
			default:
			}
		})

		// 任务 goroutine 绑定到可取消的 context；锁续期失败时立即 cancel，避免锁过期后
		// 任务仍在执行导致多实例并发或资源泄漏。
		workerCtx, cancelWorker := context.WithCancel(taskCtx)
		defer cancelWorker()

		done := make(chan error, 1)
		start := time.Now()
		safe.GoWithRecover(workerCtx, nil, func() error {
			done <- fn(workerCtx)
			return nil
		}, func(panicErr error) {
			done <- panicErr
		})

		select {
		case <-extendFailed:

			cancelWorker()
			// 等待任务 goroutine 退出，防止其继续占用 DB 连接等资源。
			<-done
			return
		case err := <-done:
			elapsed := time.Since(start)
			if elapsed > maxDuration*8/10 {
				slog.Warn("background job slow", slog.String("lock_key", lockKey), slog.Duration("elapsed", elapsed), slog.Duration("max_duration", maxDuration))
			}
			if err != nil {
				slog.Error("background job failed", slog.String("lock_key", lockKey), slog.Any("error", err))
				return
			}
		}
		return
	}

	start := time.Now()
	if err := fn(taskCtx); err != nil {
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
	commonAddressSummaryWorkers = 5
)

func (r *Runner) runCommonAddressSummary(ctx context.Context) error {
	// 统计昨日有日记变动的用户（上海时区自然日）。
	now := timeutil.NowShanghai()
	yesterday := now.Add(-24 * time.Hour)
	start := time.Date(yesterday.Year(), yesterday.Month(), yesterday.Day(), 0, 0, 0, 0, timeutil.Shanghai)
	end := start.Add(24 * time.Hour)

	userIDs, err := r.pool.Queries().ListUsersWithDiaryChangesSince(ctx, sqlc.ListUsersWithDiaryChangesSinceParams{
		UpdatedAt:   pgtype.Timestamptz{Time: start.UTC(), Valid: true},
		UpdatedAt_2: pgtype.Timestamptz{Time: end.UTC(), Valid: true},
	})
	if err != nil {
		return fmt.Errorf("list users with diary changes: %w", err)
	}
	if len(userIDs) == 0 {
		return nil
	}

	jobs := make(chan string, len(userIDs))
	for _, userID := range userIDs {
		jobs <- userID
	}
	close(jobs)

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

		var wg sync.WaitGroup
		for _, u := range users {
			wg.Add(1)
			safe.Go(ctx, nil, func() {
				defer wg.Done()
				if sendErr := r.pushService.SendAbnormalAlert(ctx, u.ID); sendErr != nil {
					slog.ErrorContext(ctx, "send abnormal alert failed",
						slog.String("user_id", u.ID), slog.Any("error", sendErr))
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
			break
		}
	}

	for {
		users, err := r.bgPool.Queries().ListUsersWithExcessDialogLogs(ctx, sqlc.ListUsersWithExcessDialogLogsParams{
			MinCount:  1000,
			BatchSize: cleanupBatchSize,
		})
		if err != nil {
			return err
		}
		if len(users) == 0 {
			break
		}
		for _, userID := range users {
			for {
				n, err := r.bgPool.Queries().DeleteExcessDialogLogs(ctx, sqlc.DeleteExcessDialogLogsParams{
					UserID:      userID,
					OffsetCount: 1000,
					BatchSize:   cleanupBatchSize,
				})
				if err != nil {
					slog.ErrorContext(ctx, "delete excess dialog logs failed", slog.String("user_id", userID), slog.Any("error", err))
					break
				}
				if n < cleanupBatchSize {
					break
				}
			}
		}
		if len(users) < int(cleanupBatchSize) {
			break
		}
	}
	return nil
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
