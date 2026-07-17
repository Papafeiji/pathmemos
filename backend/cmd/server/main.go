// Package main provides related functionality.
package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"sync/atomic"
	"syscall"
	"time"

	"github.com/aliyun/aliyun-oss-go-sdk/oss"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	goredis "github.com/redis/go-redis/v9"

	"papafeiji/backend/internal/ai"
	"papafeiji/backend/internal/auth"
	"papafeiji/backend/internal/autorecord"
	"papafeiji/backend/internal/avatar"
	"papafeiji/backend/internal/bootstrap"
	"papafeiji/backend/internal/config"
	"papafeiji/backend/internal/db"
	"papafeiji/backend/internal/diary"
	"papafeiji/backend/internal/family"
	"papafeiji/backend/internal/file"
	"papafeiji/backend/internal/invite"
	"papafeiji/backend/internal/jobs"
	"papafeiji/backend/internal/location"
	"papafeiji/backend/internal/mcp"
	mw "papafeiji/backend/internal/middleware"
	"papafeiji/backend/internal/migration"
	"papafeiji/backend/internal/payment"
	"papafeiji/backend/internal/pkg/safe"
	"papafeiji/backend/internal/push"
	"papafeiji/backend/internal/redis"
	"papafeiji/backend/internal/system"
	"papafeiji/backend/internal/user"
	"papafeiji/backend/internal/vip"
	"papafeiji/backend/internal/wxmp"
	"papafeiji/backend/migratefs"
	"papafeiji/backend/pkg/limiter"
)

func main() {
	if err := run(); err != nil {
		slog.Error("server failed to start", slog.Any("error", err))
		os.Exit(1)
	}
}

var shuttingDown atomic.Bool

func run() error {
	ctx := context.Background()
	baseCtx, baseCancel := context.WithCancel(ctx)
	defer baseCancel()

	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("load config: %w", err)
	}

	logger := newLogger(cfg.LogLevel)
	slog.SetDefault(logger)

	pgPool, err := db.NewPool(cfg.DatabaseURL)
	if err != nil {
		return fmt.Errorf("connect database: %w", err)
	}
	defer pgPool.Close()

	pool := db.WrapPool(pgPool)

	// 开源版启动时自动执行未应用的 migration（幂等，不会重复执行已应用的）。
	// SaaS 部署由 deploy.sh 显式控制迁移时机，此处跳过。
	if cfg.DeploymentMode == "open" {
		ms, err := migratefs.LoadMigrations("backend/migrations")
		if err != nil {
			return fmt.Errorf("load migrations: %w", err)
		}
		if err := migration.Run(ctx, pgPool, ms); err != nil {
			return fmt.Errorf("run migrations: %w", err)
		}
	}

	bgPgPool, err := db.NewBackgroundPool(cfg.DatabaseURL)
	if err != nil {
		return fmt.Errorf("connect background database: %w", err)
	}
	defer bgPgPool.Close()

	bgPool := db.WrapPool(bgPgPool)

	rdb, err := redis.NewClient(cfg.RedisAddr)
	if err != nil {
		return fmt.Errorf("connect redis: %w", err)
	}
	defer rdb.Close() //nolint:errcheck

	sessions := mw.NewSessionManager(rdb)

	// 开源版启动时确保 OPEN_API_KEY 已写入 api_keys 表，供 Worker 路由鉴权使用。
	if cfg.DeploymentMode == "open" {
		if err := bootstrap.SeedOpenBackend(ctx, cfg, pool, sessions); err != nil {
			return fmt.Errorf("seed open backend: %w", err)
		}
	}

	sysCfg, err := config.LoadSysConfig(ctx, pool.Queries(), cfg)
	if err != nil {
		return fmt.Errorf("load sys config: %w", err)
	}

	lock := db.NewLock(rdb)
	sysCfgLoader := config.NewSysConfigLoader(pool.Queries(), cfg)

	vipService := vip.NewService(pool)

	aiService := ai.NewService(pool, rdb, vipService, sysCfgLoader, cfg)
	wxMPClient := wxmp.NewClient(cfg, rdb)
	familyService := family.NewService(pool, rdb, lock, sysCfg.DefaultAvatarURL)
	storage := file.NewStorage(cfg.StorageLocalPath).WithBaseURL(sysCfg.FileBaseURL)
	if cfg.OSSConfigured() {
		ossClient, err := oss.New(cfg.OSSEndpoint, cfg.OSSAccessKeyID, cfg.OSSAccessKeySecret)
		if err != nil {
			return fmt.Errorf("init oss client: %w", err)
		}
		ossClient.HTTPClient = config.HTTPClient()
		ossBucket, err := ossClient.Bucket(cfg.OSSBucket)
		if err != nil {
			return fmt.Errorf("init oss bucket: %w", err)
		}
		storage.WithOSS(file.NewOSSStore(ossBucket, cfg.OSSPublicURLBase()))
	}
	avatarService := avatar.NewService(pool, storage)
	diaryService := diary.NewService(pool, rdb, lock, vipService, storage, sysCfg, cfg.TencentMapKeys)
	pushService := push.NewService(pool, cfg, rdb, wxMPClient, vipService)
	diaryService.SetNewPlaceAlerter(pushService)
	autoRecordService := autorecord.NewService(pool, rdb, cfg, diaryService, pushService)
	bgAutoRecordService := autorecord.NewService(bgPool, rdb, cfg, diaryService, pushService)
	jobRunner := jobs.NewRunner(pool, bgPool, rdb, bgAutoRecordService, storage, pushService, cfg)
	jobRunner.Start(ctx)

	httpRouter := chi.NewRouter()
	httpRouter.Use(middleware.RequestID)
	httpRouter.Use(mw.RecoveryMiddleware(logger))
	httpRouter.Use(mw.LoggerMiddleware(logger, cfg.TrustedProxyCIDR))

	healthLimiter := mw.NewIPRateLimiter(30, time.Minute, cfg.TrustedProxyCIDR)
	httpRouter.With(healthLimiter.Handler).Get("/health", newHealthHandler(pool, rdb, &shuttingDown))

	apiRouter := chi.NewRouter()
	// Cloudflare Worker 共享密钥校验。未配置时直接放行；外部回调与 MCP 内部路由跳过。
	apiRouter.Use(mw.WorkerAuth(cfg.WorkerSecret, "/api/prod/payment/virtualPayNotify", "/wx/callback", "/internal/mcp"))

	publicLimiter := mw.NewIPRateLimiter(60, time.Minute, cfg.TrustedProxyCIDR)
	publicRouter := chi.NewRouter()
	publicRouter.Use(publicLimiter.Handler)

	mcpHandler := mcp.NewHandler(apiRouter, pool, cfg, rdb)

	authHandler := auth.NewHandlerWithBackgroundPool(apiRouter, pool, bgPool, rdb, cfg, sessions, vipService, familyService, avatarService, storage, sysCfg.DefaultAvatarURL)
	authHandler.RegisterPublic(publicRouter)

	paymentHandler := payment.NewHandler(apiRouter, pool, cfg, vipService)
	paymentHandler.RegisterPublic(publicRouter)

	inviteHandler := invite.NewHandler(pool, rdb, familyService, authHandler.GetWechatClient(), storage, cfg)
	inviteHandler.RegisterPublic(publicRouter)

	wxmpHandler := wxmp.NewHandler(apiRouter, pool, rdb, cfg, sysCfgLoader, wxMPClient, aiService)
	wxmpHandler.RegisterPublic(publicRouter)

	system.NewHandler(publicRouter, cfg)

	apiRouter.Mount("/", publicRouter)

	// MCP 客户端流量唯一入口为 Cloudflare Worker：源站仅暴露 /internal/mcp/*
	// （X-Worker-Secret 保护），不再注册公开 MCP 协议端点。
	// 开源版直接暴露 /mcp/*，不依赖 Worker，也不注册内部端点以减少攻击面。
	if cfg.DeploymentMode == "open" {
		mcpHandler.RegisterPublic(apiRouter)
	} else {
		mcpHandler.RegisterInternal(apiRouter)
	}

	apiRouter.Group(func(r chi.Router) {
		if cfg.DeploymentMode == "open" {
			r.Use(mw.NewOpenAuthMiddleware(sessions, pool, cfg.OpenAPIKey).Handler)
		} else {
			r.Use(mw.NewSessionMiddleware(sessions).Handler)
		}

		authHandler.RegisterProtected(r)
		// 账号注销单独注册，加 IP 限流 5 次/小时（绕过 session 认证后仍有必要防护）
		accountDeleteLimiter := mw.NewIPRateLimiter(5, time.Hour, cfg.TrustedProxyCIDR)
		r.With(accountDeleteLimiter.Handler).Delete("/auth/account", authHandler.DeleteAccount)

		userHandler := user.NewHandlerWithBackgroundPool(r, pool, bgPool, rdb, vipService, avatarService, storage, sysCfg.DefaultAvatarURL)
		userHandler.Register()

		familyHandler := family.NewHandler(r, pool, rdb, lock, sysCfg.DefaultAvatarURL, vipService)
		familyHandler.Register()

		fileHandler := file.NewHandler(r, pool, bgPool, rdb, storage)
		fileHandler.Register()
		fileHandler.RegisterUpload(
			func(next http.Handler) http.Handler {
				return http.TimeoutHandler(next, 6*time.Minute, `{"code":"5000","msg":"upload timeout"}`)
			},
		)

		vipHandler := vip.NewHandler(r, pool, rdb, vipService)
		vipHandler.Register()

		paymentHandler := payment.NewHandler(r, pool, cfg, vipService)
		paymentHandler.Register()

		autoRecordHandler := autorecord.NewHandler(r, pool, autoRecordService)
		autoRecordHandler.Register()

		pushHandler := push.NewHandler(r, pushService)
		pushHandler.Register()

		locationHandler := location.NewHandler(r, cfg, rdb)
		locationHandler.Register()

		mcpHandler.Register(r)

		inviteHandler.Register(r)

		diaryHandler := diary.NewHandler(r, pool, vipService, storage, diaryService)
		diaryHandler.Register()
	})

	httpRouter.Mount("/", apiRouter)

	sseRouter := chi.NewRouter()
	sseRouter.Use(middleware.RequestID)
	sseRouter.Use(mw.RecoveryMiddleware(logger))
	sseRouter.Use(mw.LoggerMiddleware(logger, cfg.TrustedProxyCIDR))
	sseRouter.With(healthLimiter.Handler).Get("/health", newHealthHandler(pool, rdb, &shuttingDown))

	// AI chat 成本最高的端点，加应用层 IP 限流作为防御纵深（主防护为日配额制）
	aiChatLimiter := mw.NewIPRateLimiter(30, time.Minute, cfg.TrustedProxyCIDR)
	sseRouter.Group(func(r chi.Router) {
		// /health 直接暴露给负载均衡，WorkerAuth 仅加在 SSE 业务路由上。
		r.Use(mw.WorkerAuth(cfg.WorkerSecret))
		if cfg.DeploymentMode == "open" {
			r.Use(mw.NewOpenAuthMiddleware(sessions, pool, cfg.OpenAPIKey).Handler)
		} else {
			r.Use(mw.NewSessionMiddleware(sessions).Handler)
		}
		r.Use(aiChatLimiter.Handler)
		aiHandler := ai.NewHandler(r, aiService)
		aiHandler.Register()
	})

	httpAddr := cfg.HTTPBind + ":" + cfg.HTTPPort
	sseAddr := cfg.SSEBind + ":" + cfg.SSEPort

	httpServer := &http.Server{
		Addr:    httpAddr,
		Handler: httpRouter,
		BaseContext: func(_ net.Listener) context.Context {
			return baseCtx
		},

		ReadTimeout:       10 * time.Minute,
		ReadHeaderTimeout: 10 * time.Second,
		WriteTimeout:      310 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	sseServer := &http.Server{
		Addr:    sseAddr,
		Handler: sseRouter,
		BaseContext: func(_ net.Listener) context.Context {
			return baseCtx
		},

		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       0,
		WriteTimeout:      0,
		IdleTimeout:       60 * time.Second,
	}

	var wg sync.WaitGroup
	wg.Add(2)
	srvErr := make(chan error, 2)

	safe.Go(ctx, nil, func() {
		defer wg.Done()
		if err := httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			srvErr <- err
		}
	})

	safe.Go(ctx, nil, func() {
		defer wg.Done()
		if err := sseServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			srvErr <- err
		}
	})

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	var startErr error
	select {
	case <-quit:
	case startErr = <-srvErr:
		logger.Error("server failed to start", slog.Any("error", startErr))
	}

	shuttingDown.Store(true)
	baseCancel()

	jobRunner.Stop()

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	_ = httpServer.Shutdown(shutdownCtx) //nolint:errcheck
	_ = sseServer.Shutdown(shutdownCtx)  //nolint:errcheck

	healthLimiter.Stop()
	publicLimiter.Stop()
	inviteHandler.Stop()
	mcpHandler.Stop()
	limiter.StopGeoCoder()
	limiter.StopStaticMap()

	wg.Wait()

	return startErr
}

func newLogger(level string) *slog.Logger {
	var lv slog.Level
	switch level {
	case "DEBUG":
		lv = slog.LevelDebug
	case "WARN":
		lv = slog.LevelWarn
	case "ERROR":
		lv = slog.LevelError
	default:
		lv = slog.LevelInfo
	}

	handler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: lv})
	return slog.New(handler)
}

func newHealthHandler(pool *db.Pool, rdb *goredis.Client, shutdownFlag *atomic.Bool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
		defer cancel()

		status := map[string]string{
			"status": "ok",
		}
		code := http.StatusOK

		if shutdownFlag.Load() {
			status["status"] = "shutting_down"
			code = http.StatusServiceUnavailable
		}

		if err := pool.Pool().Ping(ctx); err != nil {
			status["status"] = "error"
			code = http.StatusServiceUnavailable
		}

		if err := rdb.Ping(ctx).Err(); err != nil {
			status["status"] = "error"
			code = http.StatusServiceUnavailable
		}

		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(code)
		_ = json.NewEncoder(w).Encode(status) //nolint:errcheck
	}
}
