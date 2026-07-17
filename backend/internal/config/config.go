// Package config loads and exposes application configuration.
package config

import (
	"fmt"
	"net"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"papafeiji/backend/internal/wechatsecrets"
)

var (
	sharedHTTPClient     *http.Client
	sharedHTTPClientOnce sync.Once
	sharedTransport      *http.Transport
	sharedTransportOnce  sync.Once
)

func sharedHTTPClientTransport() *http.Transport {
	sharedTransportOnce.Do(func() {
		sharedTransport = &http.Transport{
			Proxy: http.ProxyFromEnvironment,
			DialContext: (&net.Dialer{
				Timeout:   10 * time.Second,
				KeepAlive: 30 * time.Second,
			}).DialContext,
			ForceAttemptHTTP2:     true,
			MaxIdleConns:          100,
			MaxIdleConnsPerHost:   20,
			IdleConnTimeout:       90 * time.Second,
			TLSHandshakeTimeout:   10 * time.Second,
			ExpectContinueTimeout: 1 * time.Second,
		}
	})
	return sharedTransport
}

type Config struct {
	DatabaseURL                string
	RedisAddr                  string
	WechatAppID                string
	WechatSecret               string
	WechatMPAppID              string
	WechatMPSecret             string
	WechatMPGhID               string
	WechatMiniLinkEnvVersion   string
	WechatVirtualOfferID       string
	WechatVirtualAppKeyProd    string
	WechatVirtualAppKeySandbox string
	WechatMsgToken             string
	WechatEncodingAESKey       string
	TencentMapKeys             []string
	AIAPIKey                   string

	OSSAccessKeyID     string
	OSSAccessKeySecret string
	OSSEndpoint        string
	OSSBucket          string
	OSSPublicURL       string

	HTTPBind string
	HTTPPort string
	SSEBind  string
	SSEPort  string
	APIHost  string
	LogLevel string

	// DeploymentMode 区分 SaaS 与开源版："saas" | "open"。
	// 影响 /system/config 返回的功能开关。
	DeploymentMode string

	// AI 运行时覆盖：若设置，优先于 sys_config 中的 ai_config。
	AIBaseURL string
	AIModel   string

	TrustedProxyCIDR string

	// WorkerSecret 是 Cloudflare Worker 中转 API 请求的共享密钥。
	// 可选：未配置时 WorkerAuth 中间件直接放行，兼容直接访问与开发环境。
	WorkerSecret string

	// MCPWorkerSecret 是 Cloudflare Worker 调用 /internal/mcp/rpc 的共享密钥。
	// 可选：未配置时该内部端点返回 500，不影响其余服务。
	MCPWorkerSecret string

	// MCPPublicURL 是 MCP 客户端应使用的公开入口（Cloudflare Worker 地址）。
	// 可选：未配置时回退为源站地址（APIHost）。
	MCPPublicURL string

	// OpenAPIKey 是开源版与 Cloudflare Worker 之间的共享密钥。
	// Worker 转发请求时通过 X-Private-Api-Key 头部携带，开源版据此识别合法请求。
	OpenAPIKey string

	// StorageLocalPath 是开源版本地文件存储根目录。
	StorageLocalPath string

	JobIntervalAutoRecord            time.Duration
	JobIntervalAbnormalAlert         time.Duration
	JobIntervalOrderClose            time.Duration
	JobIntervalCleanupAILogs         time.Duration
	JobIntervalCleanupTrajectories   time.Duration
	JobIntervalCleanupOrphanFiles    time.Duration
	JobIntervalCleanupOrphanTrajMaps time.Duration
}

func Load() (*Config, error) {
	jobIntervalAutoRecord, err := defaultDurationEnv("JOB_INTERVAL_AUTO_RECORD", 5*time.Minute)
	if err != nil {
		return nil, err
	}
	jobIntervalAbnormalAlert, err := defaultDurationEnv("JOB_INTERVAL_ABNORMAL_ALERT", 5*time.Minute)
	if err != nil {
		return nil, err
	}
	jobIntervalOrderClose, err := defaultDurationEnv("JOB_INTERVAL_ORDER_CLOSE", time.Minute)
	if err != nil {
		return nil, err
	}
	jobIntervalCleanupAILogs, err := defaultDurationEnv("JOB_INTERVAL_CLEANUP_AI_LOGS", 24*time.Hour)
	if err != nil {
		return nil, err
	}
	jobIntervalCleanupTrajectories, err := defaultDurationEnv("JOB_INTERVAL_CLEANUP_TRAJECTORIES", 6*time.Hour)
	if err != nil {
		return nil, err
	}
	jobIntervalCleanupOrphanFiles, err := defaultDurationEnv("JOB_INTERVAL_CLEANUP_ORPHAN_FILES", 7*24*time.Hour)
	if err != nil {
		return nil, err
	}
	jobIntervalCleanupOrphanTrajMaps, err := defaultDurationEnv("JOB_INTERVAL_CLEANUP_ORPHAN_TRAJ_MAPS", 7*24*time.Hour)
	if err != nil {
		return nil, err
	}

	wechatAppID := os.Getenv("WECHAT_APPID")
	wechatSecret := os.Getenv("WECHAT_SECRET")
	deploymentMode := defaultEnv("DEPLOYMENT_MODE", "saas")
	if deploymentMode == "open" {
		// 要么全部使用环境变量，要么全部使用内置默认值，避免 AppID/Secret 不匹配。
		if wechatAppID == "" && wechatSecret == "" {
			wechatAppID = wechatsecrets.DefaultAppID()
			wechatSecret = wechatsecrets.DefaultSecret()
		}
	}

	cfg := &Config{
		DatabaseURL:                os.Getenv("DATABASE_URL"),
		RedisAddr:                  os.Getenv("REDIS_ADDR"),
		WechatAppID:                wechatAppID,
		WechatSecret:               wechatSecret,
		WechatMPAppID:              os.Getenv("WECHAT_MP_APPID"),
		WechatMPSecret:             os.Getenv("WECHAT_MP_SECRET"),
		WechatMPGhID:               os.Getenv("WECHAT_MP_GHID"),
		WechatMiniLinkEnvVersion:   defaultEnv("WECHAT_MINI_LINK_ENV_VERSION", "release"),
		WechatVirtualOfferID:       os.Getenv("WECHAT_VIRTUAL_OFFER_ID"),
		WechatVirtualAppKeyProd:    os.Getenv("WECHAT_VIRTUAL_APP_KEY_PRODUCTION"),
		WechatVirtualAppKeySandbox: os.Getenv("WECHAT_VIRTUAL_APP_KEY_SANDBOX"),
		WechatMsgToken:             os.Getenv("WECHAT_MSG_TOKEN"),
		WechatEncodingAESKey:       os.Getenv("WECHAT_ENCODING_AES_KEY"),

		TencentMapKeys: parseKeys(os.Getenv("TENCENT_MAP_KEY")),
		AIAPIKey:       os.Getenv("AI_API_KEY"),

		OSSAccessKeyID:     os.Getenv("OSS_ACCESS_KEY_ID"),
		OSSAccessKeySecret: os.Getenv("OSS_ACCESS_KEY_SECRET"),
		OSSEndpoint:        os.Getenv("OSS_ENDPOINT"),
		OSSBucket:          os.Getenv("OSS_BUCKET"),
		OSSPublicURL:       os.Getenv("OSS_PUBLIC_URL"),

		HTTPBind:         defaultEnv("HTTP_BIND", "127.0.0.1"),
		HTTPPort:         defaultEnv("HTTP_PORT", "8080"),
		SSEBind:          defaultEnv("SSE_BIND", "127.0.0.1"),
		SSEPort:          defaultEnv("SSE_PORT", "8081"),
		APIHost:          os.Getenv("API_HOST"),
		LogLevel:         defaultEnv("LOG_LEVEL", "INFO"),
		DeploymentMode:   deploymentMode,
		AIBaseURL:        defaultEnv("AI_BASE_URL", ""),
		AIModel:          defaultEnv("AI_MODEL", ""),
		TrustedProxyCIDR: os.Getenv("TRUSTED_PROXY_CIDR"),
		WorkerSecret:     os.Getenv("WORKER_SECRET"),
		MCPWorkerSecret:  os.Getenv("MCP_WORKER_SECRET"),
		MCPPublicURL:     os.Getenv("MCP_PUBLIC_URL"),
		OpenAPIKey:       os.Getenv("OPEN_API_KEY"),
		StorageLocalPath: defaultEnv("STORAGE_LOCAL_PATH", "/opt/pathmemos/uploads"),

		JobIntervalAutoRecord:            jobIntervalAutoRecord,
		JobIntervalAbnormalAlert:         jobIntervalAbnormalAlert,
		JobIntervalOrderClose:            jobIntervalOrderClose,
		JobIntervalCleanupAILogs:         jobIntervalCleanupAILogs,
		JobIntervalCleanupTrajectories:   jobIntervalCleanupTrajectories,
		JobIntervalCleanupOrphanFiles:    jobIntervalCleanupOrphanFiles,
		JobIntervalCleanupOrphanTrajMaps: jobIntervalCleanupOrphanTrajMaps,
	}

	if err := cfg.validate(); err != nil {
		return nil, err
	}

	return cfg, nil
}

func parseKeys(s string) []string {
	var out []string
	for _, k := range strings.Split(s, ",") {
		k = strings.TrimSpace(k)
		if k != "" {
			out = append(out, k)
		}
	}
	return out
}

func (c *Config) OSSConfigured() bool {
	return c.OSSAccessKeyID != "" && c.OSSAccessKeySecret != "" && c.OSSEndpoint != "" && c.OSSBucket != ""
}

func (c *Config) OSSPublicURLBase() string {
	if c.OSSPublicURL != "" {
		return strings.TrimSuffix(c.OSSPublicURL, "/")
	}
	return fmt.Sprintf("https://%s.%s", c.OSSBucket, c.OSSEndpoint)
}

func (c *Config) validate() error {
	if c.DatabaseURL == "" {
		return fmt.Errorf("DATABASE_URL is required")
	}
	if c.RedisAddr == "" {
		return fmt.Errorf("REDIS_ADDR is required")
	}
	if c.WechatAppID == "" {
		return fmt.Errorf("WECHAT_APPID is required")
	}
	if c.WechatSecret == "" {
		return fmt.Errorf("WECHAT_SECRET is required")
	}
	if len(c.TencentMapKeys) == 0 {
		return fmt.Errorf("TENCENT_MAP_KEY is required")
	}
	if c.AIAPIKey == "" {
		return fmt.Errorf("AI_API_KEY is required")
	}
	if c.APIHost == "" {
		return fmt.Errorf("API_HOST is required")
	}

	// 开源版不强制要求微信支付、公众号回调与 OSS 配置。
	if c.DeploymentMode != "saas" && c.DeploymentMode != "open" {
		return fmt.Errorf("DEPLOYMENT_MODE must be saas or open")
	}
	isOpen := c.DeploymentMode == "open"
	if !isOpen {
		if c.WechatVirtualOfferID == "" {
			return fmt.Errorf("WECHAT_VIRTUAL_OFFER_ID is required")
		}
		if c.WechatVirtualAppKeyProd == "" {
			return fmt.Errorf("WECHAT_VIRTUAL_APP_KEY_PRODUCTION is required")
		}
		if c.WechatVirtualAppKeySandbox == "" {
			return fmt.Errorf("WECHAT_VIRTUAL_APP_KEY_SANDBOX is required")
		}
		if c.WechatMsgToken == "" {
			return fmt.Errorf("WECHAT_MSG_TOKEN is required")
		}
	}
	if c.TrustedProxyCIDR != "" {
		for _, cidr := range strings.Split(c.TrustedProxyCIDR, ",") {
			cidr = strings.TrimSpace(cidr)
			if cidr == "" {
				return fmt.Errorf("TRUSTED_PROXY_CIDR contains empty segment")
			}
			if _, _, err := net.ParseCIDR(cidr); err != nil {
				return fmt.Errorf("TRUSTED_PROXY_CIDR is invalid: %q: %w", cidr, err)
			}
		}
	}

	if c.OSSAccessKeyID != "" || c.OSSAccessKeySecret != "" || c.OSSEndpoint != "" || c.OSSBucket != "" || c.OSSPublicURL != "" {
		if c.OSSAccessKeyID == "" {
			return fmt.Errorf("OSS_ACCESS_KEY_ID is required when OSS is configured")
		}
		if c.OSSAccessKeySecret == "" {
			return fmt.Errorf("OSS_ACCESS_KEY_SECRET is required when OSS is configured")
		}
		if c.OSSEndpoint == "" {
			return fmt.Errorf("OSS_ENDPOINT is required when OSS is configured")
		}
		if c.OSSBucket == "" {
			return fmt.Errorf("OSS_BUCKET is required when OSS is configured")
		}
	}

	return nil
}

func defaultEnv(key, def string) string {
	v := os.Getenv(key)
	if v == "" {
		return def
	}
	return v
}

func defaultDurationEnv(key string, def time.Duration) (time.Duration, error) {
	v := os.Getenv(key)
	if v == "" {
		return def, nil
	}
	d, err := time.ParseDuration(v)
	if err != nil {
		return 0, fmt.Errorf("%s is invalid: %w", key, err)
	}
	return d, nil
}

func HTTPClient() *http.Client {
	sharedHTTPClientOnce.Do(func() {
		sharedHTTPClient = &http.Client{
			Timeout:   30 * time.Second,
			Transport: sharedHTTPClientTransport(),
		}
	})
	return sharedHTTPClient
}

func SSEHTTPClient() *http.Client {
	return &http.Client{
		Timeout:   5 * time.Minute,
		Transport: sharedHTTPClientTransport(),
	}
}
