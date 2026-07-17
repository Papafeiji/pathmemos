package mcp

import (
	"testing"
	"time"

	"papafeiji/backend/internal/db/sqlc"

	"github.com/jackc/pgx/v5/pgtype"
)

func TestMergeMemoryItems(t *testing.T) {
	base := time.Date(2024, 12, 25, 0, 0, 0, 0, time.UTC)

	memories := []sqlc.ListMemoriesByDateRangeRow{
		{CreatedAt: pgtype.Timestamptz{Time: base.Add(2 * time.Hour), Valid: true}, Title: "M2", Content: "memory 2"},
		{CreatedAt: pgtype.Timestamptz{Time: base.Add(1 * time.Hour), Valid: true}, Title: "M1", Content: "memory 1"},
	}

	diaries := []sqlc.ListDiaryEntriesByDateRangeRow{
		{CreatedAt: pgtype.Timestamptz{Time: base.Add(3 * time.Hour), Valid: true}, Content: "diary 1", Location: "home"},
		{CreatedAt: pgtype.Timestamptz{Time: base.Add(30 * time.Minute), Valid: true}, Content: "diary 2", Location: ""},
	}

	result := mergeMemoryItems(memories, diaries, 10)
	if len(result) != 4 {
		t.Fatalf("expected 4 items, got %d", len(result))
	}

	expectedOrder := []struct {
		title    string
		content  string
		location string
	}{
		{"", "diary 1", "home"},
		{"M2", "memory 2", ""},
		{"M1", "memory 1", ""},
		{"", "diary 2", ""},
	}

	for i, exp := range expectedOrder {
		if result[i].Title != exp.title || result[i].Content != exp.content || result[i].Location != exp.location {
			t.Errorf("index %d: expected (%q, %q, %q), got (%q, %q, %q)",
				i, exp.title, exp.content, exp.location,
				result[i].Title, result[i].Content, result[i].Location)
		}
	}
}

func TestMergeMemoryItemsLimit(t *testing.T) {
	base := time.Date(2024, 12, 25, 0, 0, 0, 0, time.UTC)

	memories := []sqlc.ListMemoriesByDateRangeRow{
		{CreatedAt: pgtype.Timestamptz{Time: base.Add(2 * time.Hour), Valid: true}, Title: "M2", Content: "memory 2"},
		{CreatedAt: pgtype.Timestamptz{Time: base.Add(1 * time.Hour), Valid: true}, Title: "M1", Content: "memory 1"},
	}

	diaries := []sqlc.ListDiaryEntriesByDateRangeRow{
		{CreatedAt: pgtype.Timestamptz{Time: base.Add(3 * time.Hour), Valid: true}, Content: "diary 1", Location: "home"},
		{CreatedAt: pgtype.Timestamptz{Time: base.Add(30 * time.Minute), Valid: true}, Content: "diary 2", Location: ""},
	}

	result := mergeMemoryItems(memories, diaries, 2)
	if len(result) != 2 {
		t.Fatalf("expected 2 items, got %d", len(result))
	}
	if result[0].Content != "diary 1" || result[1].Title != "M2" {
		t.Errorf("unexpected order: %+v", result)
	}
}

func TestMergeMemoryItemsEmpty(t *testing.T) {
	result := mergeMemoryItems(nil, nil, 10)
	if len(result) != 0 {
		t.Fatalf("expected 0 items, got %d", len(result))
	}

	memories := []sqlc.ListMemoriesByDateRangeRow{
		{CreatedAt: pgtype.Timestamptz{Time: time.Now(), Valid: true}, Title: "M1", Content: "memory 1"},
	}
	result = mergeMemoryItems(memories, nil, 10)
	if len(result) != 1 || result[0].Title != "M1" {
		t.Fatalf("expected 1 memory item, got %+v", result)
	}
}
