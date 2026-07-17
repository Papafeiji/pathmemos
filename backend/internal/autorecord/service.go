// Package autorecord provides related functionality.
package autorecord

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"math"
	"sync"
	"sync/atomic"
	"time"

	"papafeiji/backend/internal/config"
	"papafeiji/backend/internal/db"
	"papafeiji/backend/internal/db/sqlc"
	"papafeiji/backend/internal/location"
	"papafeiji/backend/internal/pkg/safe"
	"papafeiji/backend/pkg/timeutil"
	"papafeiji/backend/pkg/util"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/redis/go-redis/v9"
)

const (
	stayPointMergeRadiusM = 300.0
	stayPointMergeWindow  = 30 * time.Minute
	maxPendingPerUser     = 100
	vipGraceDays          = 3
	processWorkers        = 5
	maxGeocodeAttempts    = 10
)

type Service struct {
	pool  *db.Pool
	rdb   *redis.Client
	lock  *db.Lock
	loc   *location.Client
	diary DiaryCoverRefresher
	push  PushService
}

type DiaryCoverRefresher interface {
	RefreshFamilyDailyCover(ctx context.Context, familyID, recordDate string) error
}

// PushService sends new-place alerts and tracks user activity for abnormal detection.
type PushService interface {
	SendNewPlaceAlert(ctx context.Context, userID, diaryID, entryID string) error
	TouchActiveAt(ctx context.Context, userID string) error
}

func NewService(pool *db.Pool, rdb *redis.Client, cfg *config.Config, diary DiaryCoverRefresher, push PushService) *Service {
	return &Service{
		pool:  pool,
		rdb:   rdb,
		lock:  db.NewLock(rdb),
		loc:   location.NewClient(cfg.TencentMapKeys),
		diary: diary,
		push:  push,
	}
}

// TouchActiveAt updates user's last active timestamp and resets today's abnormal alert flag.
func (s *Service) TouchActiveAt(ctx context.Context, userID string) error {
	if s.push == nil {
		return nil
	}
	return s.push.TouchActiveAt(ctx, userID)
}

func (s *Service) IsVIPRelaxed(ctx context.Context, userID string) bool {
	return s.vipInfo(ctx, userID)
}

func (s *Service) ProcessRound(ctx context.Context) error {
	userIDs, err := s.pool.Queries().ListPendingAutoRecordUsers(ctx, maxPendingPerUser)
	if err != nil {
		return fmt.Errorf("list pending users: %w", err)
	}

	jobs := make(chan string, len(userIDs))
	for _, userID := range userIDs {
		jobs <- userID
	}
	close(jobs)

	var wg sync.WaitGroup
	var failed atomic.Int32
	for i := 0; i < processWorkers; i++ {
		wg.Add(1)
		safe.Go(ctx, nil, func() {
			defer wg.Done()
			for userID := range jobs {
				if err := s.processUser(ctx, userID); err != nil {
					slog.ErrorContext(ctx, "auto record process user failed", slog.String("user_id", userID), slog.Any("error", err))
					failed.Add(1)
				}
			}
		})
	}
	wg.Wait()

	if failed.Load() > 0 {
		return fmt.Errorf("auto record round completed with %d failures", failed.Load())
	}
	return nil
}

func (s *Service) processUser(ctx context.Context, userID string) (err error) {
	lockKey := "lock:auto_record:" + userID
	lockTTL := 3 * time.Minute
	ok, lockToken, err := s.lock.TryLock(ctx, lockKey, lockTTL)
	if err != nil {
		slog.ErrorContext(ctx, "auto record process user lock error", slog.String("user_id", userID), slog.Any("error", err))
		return err
	}
	if !ok {
		return fmt.Errorf("auto record already in progress for user %s", userID)
	}

	// 封面刷新与缓存失效必须在分布式锁释放后再异步执行，避免异步任务开始时锁仍被占用
	//（AGENTS.md §3.8/§4.1）。origCtx 保留原始（未绑定续期）的 context，供锁释放与异步刷新使用，
	// 不受续期取消影响。
	origCtx := ctx
	var asyncFamilyID string
	var asyncDates []string
	defer func() {
		if uerr := s.lock.Unlock(context.WithoutCancel(origCtx), lockKey, lockToken); uerr != nil {
			slog.ErrorContext(origCtx, "auto record unlock failed", slog.String("user_id", userID), slog.Any("error", uerr))
		}
		if err == nil && asyncFamilyID != "" && len(asyncDates) > 0 {
			safe.Go(origCtx, nil, func() {
				bgCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
				defer cancel()
				for _, recordDate := range asyncDates {
					func(date string) {
						ctx, cancel := context.WithTimeout(bgCtx, 30*time.Second)
						refreshErr := s.diary.RefreshFamilyDailyCover(ctx, asyncFamilyID, date)
						if refreshErr != nil {
							slog.ErrorContext(ctx, "auto record refresh family daily cover failed",
								slog.String("family_id", asyncFamilyID),
								slog.String("record_date", date),
								slog.Any("error", refreshErr))
						}
						cancel()
					}(recordDate)
				}
				// 封面刷新完成后再删除汇总缓存，避免刷新期间其他读请求用旧封面重建缓存。
				if s.rdb != nil {
					if err := s.rdb.Del(context.WithoutCancel(origCtx), "ai:family_summary:"+asyncFamilyID).Err(); err != nil {
						slog.WarnContext(origCtx, "invalidate family summary cache failed", slog.String("family_id", asyncFamilyID), slog.Any("error", err))
					}
				}
			})
		}
	}()

	// 锁持有时长 3 分钟（>120 秒），按 AGENTS.md §五.3 补充约定统一用 StartLockRenewal
	// 后台每隔 TTL×80% 续期一次；任一续期失败（丢锁/被抢占）会立即 cancel renewCtx，
	// 使后续所有 DB/geocode 操作因 context 取消而中止（AR04/AR04a）。
	renewCtx, stopRenewal := s.lock.StartLockRenewal(origCtx, map[string]string{lockKey: lockToken}, lockTTL)
	defer stopRenewal()
	ctx = renewCtx

	user, err := s.pool.Queries().GetUserByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("get user: %w", err)
	}
	if !user.AutoRecordEnabled {
		return nil
	}
	if !s.vipInfo(ctx, userID) {
		return nil
	}

	rows, err := s.pool.Queries().ListTrajectoriesByUser(ctx, sqlc.ListTrajectoriesByUserParams{
		UserID: userID,
		Limit:  maxPendingPerUser,
	})
	if err != nil {
		return fmt.Errorf("list trajectories: %w", err)
	}
	if len(rows) == 0 {
		return nil
	}

	// 一次性查询该用户的常用地址，在内存中供所有 cluster 复用（性能最低方案）。
	commonAddrs, commonAddrErr := s.pool.Queries().ListUserCommonAddresses(ctx, userID)
	if commonAddrErr != nil {
		slog.WarnContext(ctx, "auto record list common addresses failed, skip matching",
			slog.String("user_id", userID),
			slog.Any("error", commonAddrErr))
	}

	clusters, invalidIDs := s.mergeStayPoints(rows)
	if len(clusters) == 0 {
		return s.pool.Queries().DeleteTrajectories(ctx, collectTrajectoryIDs(rows))
	}

	// 按日期缓存该用户当天的最后一条自动记录，去重只与当天最后一条比较
	lastAutoEntries := make(map[string]sqlc.GetUserLastAutoEntryByDateRow)

	toDelete := invalidIDs
	var createdDates []string
	parsedDates := make(map[string]pgtype.Date)
	for idx, cluster := range clusters {
		sp := cluster.representative
		if !sp.Lat.Valid || !sp.Lon.Valid {
			slog.ErrorContext(ctx, "auto record invalid averaged coordinates, delete trajectories",
				slog.String("user_id", userID),
				slog.Int("index", idx),
				slog.String("traj_id", sp.ID))
			toDelete = append(toDelete, cluster.ids...)
			continue
		}
		lat, errLat := sp.Lat.Float64Value()
		lon, errLon := sp.Lon.Float64Value()
		if errLat != nil || errLon != nil {
			slog.ErrorContext(ctx, "auto record invalid coordinates, delete trajectories",
				slog.String("user_id", userID),
				slog.Int("index", idx),
				slog.String("traj_id", sp.ID),
				slog.Any("lat_error", errLat),
				slog.Any("lon_error", errLon))
			toDelete = append(toDelete, cluster.ids...)
			continue
		}

		landmark, address, err := s.reverseGeocode(ctx, lat.Float64, lon.Float64)
		if addr := s.matchCommonAddress(commonAddrs, lat.Float64, lon.Float64); addr != nil {
			landmark = addr.Name
		}
		if err != nil {
			if s.handleGeocodeRetry(ctx, rows, cluster.ids, userID) {
				toDelete = append(toDelete, cluster.ids...)
			}
			slog.ErrorContext(ctx, "auto record reverse geocode failed, skip cluster",
				slog.String("user_id", userID),
				slog.Int("index", idx),
				slog.Float64("lat", lat.Float64),
				slog.Float64("lon", lon.Float64),
				slog.String("traj_id", sp.ID),
				slog.Any("error", err))
			continue
		}
		if address == "" {
			if s.handleGeocodeRetry(ctx, rows, cluster.ids, userID) {
				toDelete = append(toDelete, cluster.ids...)
			}
			slog.WarnContext(ctx, "auto record reverse geocode returned empty address, skip cluster",
				slog.String("user_id", userID),
				slog.Int("index", idx),
				slog.Float64("lat", lat.Float64),
				slog.Float64("lon", lon.Float64),
				slog.String("traj_id", sp.ID),
				slog.String("landmark", landmark))
			continue
		}

		recordTime := sp.RecordedAt
		recordDate := recordTime.Time.In(timeutil.Shanghai).Format("2006-01-02")

		recordDateTime, ok := parsedDates[recordDate]
		if !ok {
			parsed, err := parseDate(recordDate)
			if err != nil {
				slog.ErrorContext(ctx, "auto record invalid record date", slog.String("user_id", userID), slog.Int("index", idx), slog.String("record_date", recordDate), slog.Any("error", err))
				return fmt.Errorf("parse record date %q: %w", recordDate, err)
			}
			recordDateTime = pgtype.Date{Time: parsed, Valid: true}
			parsedDates[recordDate] = recordDateTime
		}

		lastAutoEntry, ok := lastAutoEntries[recordDate]
		if !ok {
			queried, err := s.pool.Queries().GetUserLastAutoEntryByDate(ctx, sqlc.GetUserLastAutoEntryByDateParams{
				CreatedBy:  userID,
				RecordDate: recordDateTime,
			})
			if err != nil {
				if errors.Is(err, pgx.ErrNoRows) {
					lastAutoEntries[recordDate] = sqlc.GetUserLastAutoEntryByDateRow{}
					lastAutoEntry = lastAutoEntries[recordDate]
				} else {
					slog.ErrorContext(ctx, "auto record get last auto entry by date failed", slog.String("user_id", userID), slog.String("record_date", recordDate), slog.Any("error", err))
					return err
				}
			} else {
				lastAutoEntry = queried
				lastAutoEntries[recordDate] = queried
			}
		}

		_, dup, dupErr := IsSameAsLastAutoEntry(ctx, s.pool, userID, landmark, address, recordDateTime, &lastAutoEntry)
		if dupErr != nil {
			slog.ErrorContext(ctx, "auto record check duplicate failed, skip cluster",
				slog.String("user_id", userID),
				slog.Int("index", idx),
				slog.String("record_date", recordDate),
				slog.Any("error", dupErr))
			continue
		}
		if dup {
			toDelete = append(toDelete, cluster.ids...)
			continue
		}

		var entryID, createdDiaryID string
		err = db.WithTx(ctx, s.pool.Pool(), func(ctx context.Context, q *sqlc.Queries) error {
			diaryID, err := util.NewUUID()
			if err != nil {
				return fmt.Errorf("generate diary id: %w", err)
			}
			diaryID, err = q.UpsertDiary(ctx, sqlc.UpsertDiaryParams{
				ID:         diaryID,
				UserID:     userID,
				RecordDate: recordDateTime,
			})
			if err != nil {
				return fmt.Errorf("upsert diary: %w", err)
			}
			createdDiaryID = diaryID

			newEntryID, err := util.NewUUID()
			if err != nil {
				return fmt.Errorf("generate auto record entry id: %w", err)
			}
			if err := q.CreateAutoRecordEntry(ctx, sqlc.CreateAutoRecordEntryParams{
				ID:            newEntryID,
				DiaryID:       diaryID,
				CreatedBy:     userID,
				Text:          pgtype.Text{String: "（自动记录）", Valid: true},
				Lat:           sp.Lat,
				Lon:           sp.Lon,
				Address:       pgtype.Text{String: landmark, Valid: true},
				DetailAddress: pgtype.Text{String: address, Valid: address != ""},
				RecordTime:    recordTime,
			}); err != nil {
				return fmt.Errorf("create auto record entry: %w", err)
			}
			entryID = newEntryID
			return nil
		})
		if err != nil {
			slog.ErrorContext(ctx, "auto record create entry failed",
				slog.String("user_id", userID),
				slog.Int("index", idx),
				slog.Any("error", err))

			continue
		}

		// 创建成功后更新缓存的当天 last auto entry，后续同日期 cluster 与它比较
		lastAutoEntries[recordDate] = sqlc.GetUserLastAutoEntryByDateRow{
			ID:            entryID,
			Address:       pgtype.Text{String: landmark, Valid: true},
			DetailAddress: pgtype.Text{String: address, Valid: address != ""},
		}

		createdDates = append(createdDates, recordDate)
		toDelete = append(toDelete, cluster.ids...)

		// 触发新地点提醒（内部按天去重，失败不阻塞主流程）
		if s.push != nil && createdDiaryID != "" && entryID != "" {
			diaryID := createdDiaryID
			eID := entryID
			safe.Go(ctx, nil, func() {
				bgCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
				defer cancel()
				if pushErr := s.push.SendNewPlaceAlert(bgCtx, userID, diaryID, eID); pushErr != nil {
					slog.ErrorContext(bgCtx, "auto record send new place alert failed",
						slog.String("user_id", userID),
						slog.String("diary_id", diaryID),
						slog.String("entry_id", eID),
						slog.Any("error", pushErr))
				}
			})
		}
	}

	if len(createdDates) > 0 && user.CurrentFamilyID.Valid && user.CurrentFamilyID.String != "" {
		asyncFamilyID = user.CurrentFamilyID.String
		asyncDates = uniqueStrings(createdDates)
	}

	// 批量删除已处理/无效/重复的 trajectory，减少 DB 写入次数。
	// 封面刷新参数先赋值；即使 DeleteTrajectories 失败也要触发封面刷新，避免 stale UI，
	// 剩余轨迹留待下一轮处理（AGENTS.md 5.7 AR13）。
	if len(toDelete) > 0 {
		if derr := s.pool.Queries().DeleteTrajectories(ctx, toDelete); derr != nil {
			slog.ErrorContext(ctx, "auto record batch delete trajectories failed",
				slog.String("user_id", userID),
				slog.Int("count", len(toDelete)),
				slog.Any("error", derr))
		}
	}

	return nil
}

type stayPointCluster struct {
	representative sqlc.AutoRecordTrajectory
	ids            []string
}

type clusterBuilder struct {
	representative sqlc.AutoRecordTrajectory
	ids            []string
	latSum         float64
	lonSum         float64
	count          float64
	lastLat        float64
	lastLon        float64
}

func (b *clusterBuilder) finalize() (stayPointCluster, bool) {
	avgLat := b.latSum / b.count
	avgLon := b.lonSum / b.count
	latNum := pgtype.Numeric{}
	if err := latNum.Scan(fmt.Sprintf("%.7f", avgLat)); err != nil {
		return stayPointCluster{ids: b.ids}, false
	}
	lonNum := pgtype.Numeric{}
	if err := lonNum.Scan(fmt.Sprintf("%.7f", avgLon)); err != nil {
		return stayPointCluster{ids: b.ids}, false
	}
	b.representative.Lat = latNum
	b.representative.Lon = lonNum
	return stayPointCluster{representative: b.representative, ids: b.ids}, true
}

func (s *Service) mergeStayPoints(rows []sqlc.AutoRecordTrajectory) ([]stayPointCluster, []string) {
	if len(rows) == 0 {
		return nil, nil
	}

	current := &clusterBuilder{}
	var started bool
	var result []stayPointCluster
	var invalidIDs []string
	for i := range rows {
		lat := trajectoryCoord(rows[i].Lat)
		lon := trajectoryCoord(rows[i].Lon)
		if math.IsNaN(lat) || math.IsNaN(lon) {
			invalidIDs = append(invalidIDs, rows[i].ID)
			continue
		}
		if !started {
			current = &clusterBuilder{
				representative: rows[i],
				ids:            []string{rows[i].ID},
				latSum:         lat,
				lonSum:         lon,
				lastLat:        lat,
				lastLon:        lon,
				count:          1,
			}
			started = true
			continue
		}

		distSq := flatDistanceMetersSq(current.lastLat, current.lastLon, lat, lon)
		gap := rows[i].RecordedAt.Time.Sub(current.representative.RecordedAt.Time)

		if distSq <= stayPointMergeRadiusM*stayPointMergeRadiusM && gap <= stayPointMergeWindow {
			current.ids = append(current.ids, rows[i].ID)
			current.latSum += lat
			current.lonSum += lon
			current.lastLat = lat
			current.lastLon = lon
			current.count++
			if rows[i].RecordedAt.Time.After(current.representative.RecordedAt.Time) {
				current.representative.RecordedAt = rows[i].RecordedAt
			}
			continue
		}

		cluster, ok := current.finalize()
		if !ok {
			invalidIDs = append(invalidIDs, cluster.ids...)
		} else {
			result = append(result, cluster)
		}
		current = &clusterBuilder{
			representative: rows[i],
			ids:            []string{rows[i].ID},
			latSum:         lat,
			lonSum:         lon,
			count:          1,
		}
	}
	if started {
		cluster, ok := current.finalize()
		if !ok {
			invalidIDs = append(invalidIDs, cluster.ids...)
		} else {
			result = append(result, cluster)
		}
	}
	return result, invalidIDs
}

func trajectoryCoord(n pgtype.Numeric) float64 {
	v, err := n.Float64Value()
	if err != nil || !v.Valid {
		return math.NaN()
	}
	return v.Float64
}

func collectTrajectoryIDs(rows []sqlc.AutoRecordTrajectory) []string {
	ids := make([]string, len(rows))
	for i, r := range rows {
		ids[i] = r.ID
	}
	return ids
}

func uniqueStrings(ss []string) []string {
	seen := make(map[string]struct{}, len(ss))
	var result []string
	for _, s := range ss {
		if _, ok := seen[s]; ok {
			continue
		}
		seen[s] = struct{}{}
		result = append(result, s)
	}
	return result
}

// IsSameAsLastAutoEntry 检查当前驻点是否与指定日期当天最后一条自动记录重复。
// last 为 nil 时会按日期查询；调用方可传入缓存的当天最后一条以减少查询。
func IsSameAsLastAutoEntry(ctx context.Context, pool *db.Pool, userID string, landmark, address string, recordDate pgtype.Date, last *sqlc.GetUserLastAutoEntryByDateRow) (entryID string, ok bool, err error) {
	current := last
	if last == nil || last.ID == "" {
		queried, err := pool.Queries().GetUserLastAutoEntryByDate(ctx, sqlc.GetUserLastAutoEntryByDateParams{
			CreatedBy:  userID,
			RecordDate: recordDate,
		})
		if err != nil {
			if !errors.Is(err, pgx.ErrNoRows) {
				slog.DebugContext(ctx, "auto record get last auto entry by date failed", slog.String("user_id", userID), slog.Any("error", err))
				return "", false, err
			}
			return "", false, nil
		}
		if last != nil {
			*last = queried
		}
		current = &queried
	}
	if current == nil || current.ID == "" {
		return "", false, nil
	}
	if landmark != "" && current.Address.Valid && current.Address.String == landmark {
		slog.DebugContext(ctx, "auto record same as last auto entry by landmark", slog.String("user_id", userID), slog.String("landmark", landmark))
		return current.ID, true, nil
	}
	if address != "" && current.DetailAddress.Valid && current.DetailAddress.String == address {
		slog.DebugContext(ctx, "auto record same as last auto entry by address", slog.String("user_id", userID), slog.String("address", address))
		return current.ID, true, nil
	}
	return "", false, nil
}

func (s *Service) vipInfo(ctx context.Context, userID string) bool {
	row, err := s.pool.Queries().GetUserVIP(ctx, userID)
	if err != nil {
		return false
	}
	return row.ExpireTime.Time.After(time.Now().UTC().Add(-vipGraceDays * 24 * time.Hour))
}

func (s *Service) reverseGeocode(ctx context.Context, lat, lon float64) (landmark, address string, err error) {
	res, err := s.loc.Reverse(ctx, lat, lon, true)
	if err != nil {
		return "", "", err
	}
	landmark = res.Landmark
	if landmark == "" {
		landmark = res.Address
	}
	return landmark, res.Address, nil
}

const commonAddressMatchRadiusM = 300.0

func (s *Service) matchCommonAddress(addrs []sqlc.ListUserCommonAddressesRow, lat, lon float64) *sqlc.ListUserCommonAddressesRow {
	for i := range addrs {
		aLat, err1 := addrs[i].Lat.Float64Value()
		aLon, err2 := addrs[i].Lon.Float64Value()
		if err1 != nil || err2 != nil || !aLat.Valid || !aLon.Valid {
			continue
		}
		if flatDistanceMetersSq(lat, lon, aLat.Float64, aLon.Float64) <= commonAddressMatchRadiusM*commonAddressMatchRadiusM {
			return &addrs[i]
		}
	}
	return nil
}

// flatDistanceMetersSq 返回平面距离的平方（米²）。
// 在 200m 聚类半径内，平面近似误差远小于 1m，且避免 haversine 的 sin/cos/sqrt 开销。
func flatDistanceMetersSq(lat1, lon1, lat2, lon2 float64) float64 {
	const metersPerDegLat = 111320.0
	avgLat := (lat1 + lat2) * 0.5 * math.Pi / 180
	dLat := lat2 - lat1
	dLon := lon2 - lon1
	dy := dLat * metersPerDegLat
	dx := dLon * metersPerDegLat * math.Cos(avgLat)
	return dx*dx + dy*dy
}

func parseDate(s string) (time.Time, error) {
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return time.Time{}, fmt.Errorf("invalid date %q: %w", s, err)
	}
	return t, nil
}

func (s *Service) handleGeocodeRetry(ctx context.Context, rows []sqlc.AutoRecordTrajectory, clusterIDs []string, userID string) bool {
	clusterSet := make(map[string]struct{}, len(clusterIDs))
	for _, id := range clusterIDs {
		clusterSet[id] = struct{}{}
	}
	for _, row := range rows {
		if _, ok := clusterSet[row.ID]; ok && row.GeocodeAttempts >= maxGeocodeAttempts {
			return true
		}
	}
	if incErr := s.pool.Queries().IncrementTrajectoryGeocodeAttempts(ctx, clusterIDs); incErr != nil {
		slog.WarnContext(ctx, "auto record increment geocode attempts failed", slog.String("user_id", userID), slog.Any("error", incErr))
	}
	return false
}
