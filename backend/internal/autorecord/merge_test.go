package autorecord

import (
	"math/big"
	"testing"
	"time"

	"papafeiji/backend/internal/db/sqlc"

	"github.com/jackc/pgx/v5/pgtype"
)

func makeRow(id string, lat, lon float64, t time.Time) sqlc.AutoRecordTrajectory {
	return sqlc.AutoRecordTrajectory{
		ID: id,
		Lat: pgtype.Numeric{
			Int:   big.NewInt(int64(lat * 1e6)),
			Exp:   -6,
			Valid: !isNaN(lat),
		},
		Lon: pgtype.Numeric{
			Int:   big.NewInt(int64(lon * 1e6)),
			Exp:   -6,
			Valid: !isNaN(lon),
		},
		RecordedAt: pgtype.Timestamptz{Time: t, Valid: true},
	}
}

func isNaN(f float64) bool {
	return f != f
}

func TestMergeStayPoints_SameLocationMerged(t *testing.T) {
	s := &Service{}
	now := time.Now()
	rows := []sqlc.AutoRecordTrajectory{
		makeRow("a", 23.1291, 113.2644, now),
		makeRow("b", 23.1291, 113.2644, now.Add(5*time.Minute)),
		makeRow("c", 23.1291, 113.2644, now.Add(10*time.Minute)),
	}
	clusters, _ := s.mergeStayPoints(rows)
	if len(clusters) != 1 {
		t.Fatalf("expected 1 cluster, got %d", len(clusters))
	}
	if len(clusters[0].ids) != 3 {
		t.Fatalf("expected 3 points in cluster, got %d", len(clusters[0].ids))
	}
}

func TestMergeStayPoints_DistantLocationsSplit(t *testing.T) {
	s := &Service{}
	now := time.Now()
	rows := []sqlc.AutoRecordTrajectory{
		makeRow("a", 23.1291, 113.2644, now),
		// ~0.01 degrees ~1km apart, far beyond merge radius (300m)
		makeRow("b", 23.1391, 113.2744, now.Add(1*time.Minute)),
	}
	clusters, _ := s.mergeStayPoints(rows)
	if len(clusters) != 2 {
		t.Fatalf("expected 2 separate clusters, got %d", len(clusters))
	}
}

func TestMergeStayPoints_WalkPath(t *testing.T) {
	s := &Service{}
	now := time.Now()
	// Walking path: each point within merge radius of previous
	// 0.001 deg ~111m at equator, so these are ~111m apart each
	rows := []sqlc.AutoRecordTrajectory{
		makeRow("a", 23.1291, 113.2644, now),
		makeRow("b", 23.1301, 113.2644, now.Add(5*time.Minute)),
		makeRow("c", 23.1311, 113.2644, now.Add(10*time.Minute)),
		makeRow("d", 23.1321, 113.2644, now.Add(15*time.Minute)),
	}
	clusters, _ := s.mergeStayPoints(rows)
	// All should merge since each consecutive pair is within merge radius
	if len(clusters) != 1 {
		t.Fatalf("expected 1 cluster for walking path, got %d", len(clusters))
	}
	if len(clusters[0].ids) != 4 {
		t.Fatalf("expected 4 points merged, got %d", len(clusters[0].ids))
	}
}

func TestMergeStayPoints_LargeGapSplits(t *testing.T) {
	s := &Service{}
	now := time.Now()
	rows := []sqlc.AutoRecordTrajectory{
		makeRow("a", 23.1291, 113.2644, now),
		// Same location but >30 min gap
		makeRow("b", 23.1291, 113.2644, now.Add(40*time.Minute)),
	}
	clusters, _ := s.mergeStayPoints(rows)
	if len(clusters) != 2 {
		t.Fatalf("expected 2 clusters due to time gap, got %d", len(clusters))
	}
}

func TestMergeStayPoints_Empty(t *testing.T) {
	s := &Service{}
	clusters, invalid := s.mergeStayPoints(nil)
	if len(clusters) != 0 || len(invalid) != 0 {
		t.Fatal("expected empty results for nil input")
	}
}

func TestMergeStayPoints_SinglePoint(t *testing.T) {
	s := &Service{}
	now := time.Now()
	rows := []sqlc.AutoRecordTrajectory{
		makeRow("a", 23.1291, 113.2644, now),
	}
	clusters, _ := s.mergeStayPoints(rows)
	if len(clusters) != 1 {
		t.Fatalf("expected 1 cluster for single point, got %d", len(clusters))
	}
}

func TestMergeStayPoints_CentroidRegression(t *testing.T) {
	s := &Service{}
	now := time.Now()
	// This is the specific bug we fixed: the old code used centroid
	// for distance check. If points form a "V" shape (first going east,
	// then further east but within merge radius of the second point), the
	// centroid-based check could falsely split.
	// 0.001 deg ~111m, so 0.0027 deg ~300m.
	// Point A at 0, B at 0.0015 east (~166m from A), C at 0.003 east (~166m from B, ~333m from A)
	rows := []sqlc.AutoRecordTrajectory{
		makeRow("a", 23.1291, 113.2644, now),
		makeRow("b", 23.1291, 113.2659, now.Add(5*time.Minute)),
		makeRow("c", 23.1291, 113.2674, now.Add(10*time.Minute)),
	}
	clusters, _ := s.mergeStayPoints(rows)
	// B is ~166m from A, C is ~166m from B
	// With centroid fix: C is within merge radius of B → merge all 3
	// Without fix: centroid of A+B at ~0.00075 deg, C is ~0.00225 deg from centroid = ~250m → false split
	if len(clusters) != 1 {
		t.Fatalf("centroid regression: expected 1 cluster (3 points), got %d", len(clusters))
	}
	if len(clusters[0].ids) != 3 {
		t.Fatalf("centroid regression: expected 3 merged points, got %d", len(clusters[0].ids))
	}
}
