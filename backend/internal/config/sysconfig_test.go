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
func TestBuildSysConfig(t *testing.T) {
	base := &Config{
		DeploymentMode:        "saas",
		AIBaseURL:             "https://api.example.com",
		AIModel:               "m",
		AIPrompt:              "p",
		DefaultCoverImage:     "c",
		DefaultTrajectoryIcon: "i",
		DefaultAvatarURL:      "a?seed=",
		StoragePublicBaseURL:  "https://x",
	}
	sc, err := BuildSysConfig(base)
	if err != nil {
		t.Fatal(err)
	}
	if sc.WechatMPPrompt != "p" {
		t.Fatal("wechat prompt should fall back to AIPrompt")
	}

	open := &Config{
		DeploymentMode:   "open",
		APIHost:          "https://open.example.com/",
		AIBaseURL:        "b",
		AIModel:          "m",
		AIPrompt:         "p",
		DefaultAvatarURL: "a?seed=",
	}
	so, err := BuildSysConfig(open)
	if err != nil {
		t.Fatal(err)
	}
	if so.FileBaseURL != "https://open.example.com" {
		t.Fatalf("open file base = %q", so.FileBaseURL)
	}
	if so.DefaultCoverImage != "https://open.example.com/system-assets/default-cover.jpg" {
		t.Fatalf("open cover = %q", so.DefaultCoverImage)
	}
}
