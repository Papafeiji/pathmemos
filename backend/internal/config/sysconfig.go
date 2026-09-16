package config

import (
	"context"
	"fmt"
	"strings"
)

// SysConfig 是运行期生效的配置视图。
// 自重构后配置全部来自环境变量（原 sys_configs 表已删除，见 docs/ARCHITECTURE-INVARIANTS.md §5）。
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

// BuildSysConfig 构造 SysConfig 并做 open 模式覆盖与校验。
func BuildSysConfig(cfg *Config) (*SysConfig, error) {
	sysCfg := &SysConfig{
		DefaultCoverImage:     cfg.DefaultCoverImage,
		DefaultTrajectoryIcon: cfg.DefaultTrajectoryIcon,
		DefaultAvatarURL:      cfg.DefaultAvatarURL,
		FileBaseURL:           cfg.StoragePublicBaseURL,
		AIBaseURL:             cfg.AIBaseURL,
		AIModel:               cfg.AIModel,
		AIThinkingType:        cfg.AIThinkingType,
		AIMaxTokens:           cfg.AIMaxTokens,
		AIPrompt:              cfg.AIPrompt,
		WechatMPPrompt:        cfg.WechatMPPrompt,
	}
	if sysCfg.WechatMPPrompt == "" {
		sysCfg.WechatMPPrompt = sysCfg.AIPrompt
	}

	// 开源版：文件基址用 API_HOST；默认图片必须是绝对 URL（轨迹图标会传给腾讯静态地图）。
	if cfg.DeploymentMode == "open" {
		if cfg.APIHost == "" {
			return nil, fmt.Errorf("API_HOST is required in open mode (set by expose.sh or manually after deploy)")
		}
		sysCfg.FileBaseURL = strings.TrimRight(cfg.APIHost, "/")
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
		return fmt.Errorf("DEFAULT_COVER_IMAGE is required")
	}
	if c.DefaultTrajectoryIcon == "" {
		return fmt.Errorf("DEFAULT_TRAJECTORY_ICON is required")
	}
	if c.FileBaseURL == "" {
		return fmt.Errorf("STORAGE_PUBLIC_BASE_URL is required")
	}
	if c.DefaultAvatarURL == "" {
		return fmt.Errorf("DEFAULT_AVATAR_URL is required")
	}
	if !strings.HasSuffix(c.DefaultAvatarURL, "?seed=") {
		return fmt.Errorf("DEFAULT_AVATAR_URL must end with ?seed=")
	}
	if c.AIBaseURL == "" {
		return fmt.Errorf("AI_BASE_URL is required")
	}
	if c.AIModel == "" {
		return fmt.Errorf("AI_MODEL is required")
	}
	return nil
}

// SysConfigLoader 兼容旧调用方：现在每次由环境变量构造（无 DB、无缓存）。
type SysConfigLoader struct {
	cfg *Config
}

func NewSysConfigLoader(cfg *Config) *SysConfigLoader {
	return &SysConfigLoader{cfg: cfg}
}

func (l *SysConfigLoader) Load(_ context.Context) (*SysConfig, error) {
	return BuildSysConfig(l.cfg)
}
