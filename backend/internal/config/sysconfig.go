// Package config provides system configuration management.
package config

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"time"

	"golang.org/x/sync/singleflight"

	"papafeiji/backend/internal/db/sqlc"
)

type SysConfig struct {
	DefaultCoverImage     string
	DefaultTrajectoryIcon string
	DefaultAvatarURL      string
	FileBaseURL           string
	AIBaseURL             string
	AIModel               string
	AIThinkingType        string
	AIMaxTokens           int
	AIPrompt              string
	WechatMPPrompt        string
}

func LoadSysConfig(ctx context.Context, q *sqlc.Queries, cfg *Config) (*SysConfig, error) {
	sysCfg, err := loadSysConfigRaw(ctx, q, cfg)
	if err != nil {
		return nil, err
	}
	return sysCfg, nil
}

func loadSysConfigRaw(ctx context.Context, q *sqlc.Queries, envCfg *Config) (*SysConfig, error) {
	count, err := q.CountSysConfig(ctx)
	if err != nil {
		return nil, fmt.Errorf("count sys_configs: %w", err)
	}
	if count == 0 {
		return nil, fmt.Errorf("sys_configs default row not found; migration may not have been run")
	}
	if count > 1 {
		return nil, fmt.Errorf("sys_configs must contain exactly one row, found %d", count)
	}

	row, err := q.GetSysConfig(ctx)
	if err != nil {
		return nil, fmt.Errorf("get sys_configs: %w", err)
	}

	sysCfg := &SysConfig{}

	if row.SysConfig != nil {
		var sys map[string]interface{}
		if err := json.Unmarshal(row.SysConfig, &sys); err != nil {
			return nil, fmt.Errorf("parse sys_config: %w", err)
		}

		sysCfg.DefaultCoverImage = getString(sys, "defaultCoverImage")
		sysCfg.DefaultTrajectoryIcon = getString(sys, "defaultTrajectoryIcon")
		sysCfg.DefaultAvatarURL = getString(sys, "defaultAvatarUrl")
		sysCfg.FileBaseURL = getString(sys, "fileBaseUrl")

		sysCfg.WechatMPPrompt = getString(sys, "wechatMpPrompt")
	}

	if row.AiConfig != nil {
		var ai map[string]interface{}
		if err := json.Unmarshal(row.AiConfig, &ai); err != nil {
			return nil, fmt.Errorf("parse ai_config: %w", err)
		}
		sysCfg.AIBaseURL = getString(ai, "baseUrl")
		sysCfg.AIModel = getString(ai, "model")
		if maxTokens, ok := ai["maxOutputTokens"].(float64); ok {
			sysCfg.AIMaxTokens = int(maxTokens)
		}
		if thinking, ok := ai["thinking"].(map[string]interface{}); ok {
			sysCfg.AIThinkingType = getString(thinking, "type")
		}
	}

	sysCfg.AIPrompt = row.AiPrompt.String
	if !row.AiPrompt.Valid {
		sysCfg.AIPrompt = ""
	}

	if sysCfg.WechatMPPrompt == "" {
		sysCfg.WechatMPPrompt = sysCfg.AIPrompt
	}

	// 开源版覆盖 seed 中的 SaaS 专有默认值，使用本地存储和 API_HOST。
	if envCfg != nil && envCfg.DeploymentMode == "open" {
		if envCfg.AIBaseURL != "" {
			sysCfg.AIBaseURL = envCfg.AIBaseURL
		}
		if envCfg.AIModel != "" {
			sysCfg.AIModel = envCfg.AIModel
		}
		if envCfg.APIHost != "" {
			sysCfg.FileBaseURL = strings.TrimRight(envCfg.APIHost, "/")
		} else {
			return nil, fmt.Errorf("API_HOST is required in open mode (set by expose.sh or manually after deploy)")
		}
		// 默认图片必须是绝对 URL：轨迹图标会传给腾讯静态地图（icon: 参数），
		// 相对路径外部服务无法抓取。
		sysCfg.DefaultCoverImage = sysCfg.FileBaseURL + "/system-assets/default-cover.jpg"
		sysCfg.DefaultTrajectoryIcon = sysCfg.FileBaseURL + "/system-assets/default-marker.png"
	}

	if err := sysCfg.validate(); err != nil {
		return nil, err
	}

	return sysCfg, nil
}

func (c *SysConfig) validate() error {
	if c.DefaultCoverImage == "" {
		return fmt.Errorf("sys_config.defaultCoverImage is required")
	}
	if c.DefaultTrajectoryIcon == "" {
		return fmt.Errorf("sys_config.defaultTrajectoryIcon is required")
	}
	if c.FileBaseURL == "" {
		return fmt.Errorf("sys_config.fileBaseUrl is required")
	}
	if c.DefaultAvatarURL == "" {
		return fmt.Errorf("sys_config.defaultAvatarUrl is required")
	}
	if !strings.HasSuffix(c.DefaultAvatarURL, "?seed=") {
		return fmt.Errorf("sys_config.defaultAvatarUrl must end with ?seed=")
	}
	if c.AIBaseURL == "" {
		return fmt.Errorf("ai_config.baseUrl is required")
	}
	if c.AIModel == "" {
		return fmt.Errorf("ai_config.model is required")
	}
	return nil
}

func getString(m map[string]interface{}, key string) string {
	if v, ok := m[key].(string); ok {
		return v
	}
	return ""
}

type SysConfigLoader struct {
	q     *sqlc.Queries
	cfg   *Config
	mu    sync.RWMutex
	group singleflight.Group
	cache *SysConfig
	at    time.Time
}

const sysConfigCacheTTL = 30 * time.Second

func NewSysConfigLoader(q *sqlc.Queries, cfg *Config) *SysConfigLoader {
	return &SysConfigLoader{q: q, cfg: cfg}
}

func (l *SysConfigLoader) Load(ctx context.Context) (*SysConfig, error) {
	l.mu.RLock()
	if l.cache != nil && time.Since(l.at) < sysConfigCacheTTL {
		copied := *l.cache
		l.mu.RUnlock()
		return &copied, nil
	}
	l.mu.RUnlock()

	v, err, _ := l.group.Do("", func() (interface{}, error) {
		l.mu.RLock()
		if l.cache != nil && time.Since(l.at) < sysConfigCacheTTL {
			copied := *l.cache
			l.mu.RUnlock()
			return &copied, nil
		}
		l.mu.RUnlock()

		cfg, err := loadSysConfigRaw(ctx, l.q, l.cfg)
		if err != nil {
			return nil, err
		}

		l.mu.Lock()
		l.cache = cfg
		l.at = time.Now()
		l.mu.Unlock()

		return cfg, nil
	})
	if err != nil {
		return nil, err
	}

	cfg := v.(*SysConfig)
	copied := *cfg
	return &copied, nil
}
