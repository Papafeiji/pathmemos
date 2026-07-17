package config

import (
	"testing"
)

func TestSysConfig_CopyProtectsCache(t *testing.T) {
	cache := &SysConfig{
		DefaultCoverImage: "cover.jpg",
		AIModel:           "gpt-4",
		DefaultAvatarURL:  "https://example.com/avatar",
	}

	copied := *cache
	copied.DefaultCoverImage = "modified.jpg"
	copied.AIModel = "modified-model"

	if cache.DefaultCoverImage != "cover.jpg" {
		t.Fatal("cache was mutated through copy! value copy should protect original")
	}
	if cache.AIModel != "gpt-4" {
		t.Fatal("cache AIModel was mutated through copy")
	}
	if copied.DefaultCoverImage != "modified.jpg" {
		t.Fatal("copy should have new modified value")
	}
}

func TestSysConfig_FieldTypes(t *testing.T) {
	cfg := &SysConfig{
		AIPrompt:          "test prompt",
		DefaultCoverImage: "/path/to/cover",
	}
	if cfg.DefaultCoverImage != "/path/to/cover" {
		t.Fatal("DefaultCoverImage mismatch")
	}
	if cfg.AIPrompt != "test prompt" {
		t.Fatal("AIPrompt mismatch")
	}
}
