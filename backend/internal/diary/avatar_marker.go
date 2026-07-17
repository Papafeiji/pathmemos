// Package diary provides related functionality.
package diary

import (
	"context"
	"fmt"
	"strings"

	"papafeiji/backend/internal/db/sqlc"
)

func (s *Service) buildTrajectoryMarkers(ctx context.Context, locs []sqlc.ListLocationEntriesRow) ([]string, error) {
	if len(locs) == 0 {
		return nil, nil
	}

	userPoints := make(map[string][][2]float64)
	userIDs := make([]string, 0)
	seen := make(map[string]bool)
	for _, loc := range locs {
		lat, errLat := loc.Lat.Float64Value()
		lon, errLon := loc.Lon.Float64Value()
		if errLat != nil || errLon != nil || !lat.Valid || !lon.Valid {
			continue
		}
		userPoints[loc.CreatedBy] = append(userPoints[loc.CreatedBy], [2]float64{lat.Float64, lon.Float64})
		if !seen[loc.CreatedBy] {
			seen[loc.CreatedBy] = true
			userIDs = append(userIDs, loc.CreatedBy)
		}
	}

	const maxPointsPerUser = 30
	const maxTotalPoints = 80
	for uid, points := range userPoints {
		if len(points) > maxPointsPerUser {
			step := max(1, len(points)/maxPointsPerUser)
			var sampled [][2]float64
			for i := 0; i < len(points) && len(sampled) < maxPointsPerUser; i += step {
				sampled = append(sampled, points[i])
			}
			userPoints[uid] = sampled
		}
	}

	total := 0
	for _, points := range userPoints {
		total += len(points)
	}
	if total > maxTotalPoints {
		// 按 userIDs 固定顺序拼接所有点，保证同一组定位点多次请求生成相同的轨迹图采样。
		type userPoint struct {
			uid string
			p   [2]float64
		}
		all := make([]userPoint, 0, total)
		for _, uid := range userIDs {
			for _, p := range userPoints[uid] {
				all = append(all, userPoint{uid: uid, p: p})
			}
		}
		step := max(1, len(all)/maxTotalPoints)
		sampled := make(map[string][][2]float64)
		count := 0
		for i := 0; i < len(all) && count < maxTotalPoints; i += step {
			up := all[i]
			sampled[up.uid] = append(sampled[up.uid], up.p)
			count++
		}
		userPoints = sampled
	}

	markerPaths, err := s.pool.Queries().GetUserAvatarMarkersByIDs(ctx, userIDs)
	if err != nil {
		return nil, fmt.Errorf("list avatar markers: %w", err)
	}
	type markerInfo struct {
		path        string
		storageType string
	}
	markerMap := make(map[string]markerInfo)
	for _, m := range markerPaths {
		if m.MarkerPath != "" {
			markerMap[m.UserID] = markerInfo{path: m.MarkerPath, storageType: m.StorageType}
		}
	}

	var markers []string
	for _, uid := range userIDs {
		points := userPoints[uid]
		info := markerMap[uid]
		var markerURL string
		if info.path == "" {

			markerURL = s.defaultTrajectoryIconURL()
		} else {
			url, urlErr := s.fileURL(info.path, info.storageType)
			if urlErr != nil {
				return nil, fmt.Errorf("get marker url: %w", urlErr)
			}
			markerURL = url
		}
		if markerURL == "" {
			continue
		}
		parts := make([]string, 0, len(points)+1)
		parts = append(parts, "icon:"+markerURL)
		for _, p := range points {
			parts = append(parts, fmt.Sprintf("%.4f,%.4f", p[0], p[1]))
		}
		markers = append(markers, strings.Join(parts, "|"))
	}

	return markers, nil
}
