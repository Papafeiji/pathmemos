// admin 提供一个一次性的命令行工具，用于按手机号彻底删除用户及其数据。
// 仅在运维场景下通过 deploy/delete-user.sh 调用，不会作为常驻服务运行。
// Package main provides related functionality.
package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/aliyun/aliyun-oss-go-sdk/oss"

	"github.com/jackc/pgx/v5"

	"papafeiji/backend/internal/config"
	"papafeiji/backend/internal/db"
	"papafeiji/backend/internal/family"
	"papafeiji/backend/internal/file"
	mw "papafeiji/backend/internal/middleware"
	"papafeiji/backend/internal/redis"
	"papafeiji/backend/internal/user"
)

func main() {
	phone := os.Getenv("TARGET_PHONE")
	if phone == "" {
		log.Fatal("TARGET_PHONE is required")
	}

	databaseURL := os.Getenv("DATABASE_URL")
	redisAddr := os.Getenv("REDIS_ADDR")
	if databaseURL == "" || redisAddr == "" {
		log.Fatal("DATABASE_URL and REDIS_ADDR are required")
	}

	ctx := context.Background()

	pgPool, err := db.NewPool(databaseURL)
	if err != nil {
		log.Fatalf("connect database: %v", err)
	}
	defer pgPool.Close()
	pool := db.WrapPool(pgPool)

	rdb, err := redis.NewClient(redisAddr)
	if err != nil {
		log.Fatalf("connect redis: %v", err)
	}
	defer rdb.Close() //nolint:errcheck

	lock := db.NewLock(rdb)
	sessions := mw.NewSessionManager(rdb)
	familyService := family.NewService(pool, rdb, lock, "")

	// 与 server main.go 一致：本地存储路径读 STORAGE_LOCAL_PATH（生产为 /opt/papafeiji/uploads），
	// 否则 NewStorage("") 回落 DefaultUploadDir(/opt/pathmemos/uploads) 会导致删除用户时物理文件残留。
	storage := file.NewStorage(os.Getenv("STORAGE_LOCAL_PATH")).WithBaseURL(strings.TrimSuffix(os.Getenv("OSS_PUBLIC_URL"), "/"))
	if os.Getenv("OSS_ACCESS_KEY_ID") != "" && os.Getenv("OSS_ACCESS_KEY_SECRET") != "" &&
		os.Getenv("OSS_ENDPOINT") != "" && os.Getenv("OSS_BUCKET") != "" {
		ossClient, err := oss.New(
			os.Getenv("OSS_ENDPOINT"),
			os.Getenv("OSS_ACCESS_KEY_ID"),
			os.Getenv("OSS_ACCESS_KEY_SECRET"),
		)
		if err != nil {
			log.Fatalf("init oss client: %v", err)
		}
		// 与 server 端一致：OSS 删除/上传走带超时的 HTTP 客户端，避免运维工具无限挂起。
		ossClient.HTTPClient = config.HTTPClient()
		ossBucket, err := ossClient.Bucket(os.Getenv("OSS_BUCKET"))
		if err != nil {
			log.Fatalf("init oss bucket: %v", err)
		}
		storage.WithOSS(file.NewOSSStore(ossBucket, strings.TrimSuffix(os.Getenv("OSS_PUBLIC_URL"), "/")))
	}

	var userID, currentFamilyID, personalFamilyID string
	err = pool.Pool().QueryRow(ctx,
		`SELECT id, current_family_id, personal_family_id FROM users WHERE phone_number = $1`,
		phone,
	).Scan(&userID, &currentFamilyID, &personalFamilyID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			fmt.Printf("user with phone %s not found, nothing to delete\n", phone)
			return
		}
		log.Fatalf("find user by phone %s: %v", phone, err)
	}

	fmt.Printf("found user %s, current_family=%s, personal_family=%s\n", userID, currentFamilyID, personalFamilyID)

	// 先删除用户所有 session，再删 DB，避免“DB 已删、session 仍可用”。
	// Redis 等依赖故障时关键安全校验不允许降级放行，删除失败必须中止。
	if err := sessions.DeleteAll(ctx, userID); err != nil {
		log.Fatalf("delete user sessions failed: %v", err)
	}

	cleanup, err := familyService.DeleteAccount(ctx, userID)
	if err != nil {
		log.Fatalf("delete account failed: %v", err)
	}

	fmt.Printf("delete account succeeded, affected=%d, files=%d, family=%s\n", len(cleanup.AffectedUserIDs), len(cleanup.Paths), cleanup.FamilyID)

	// 同步清理给 2 分钟上限：OSS 删除卡住时运维工具不应无限挂起。
	cleanupCtx, cancel := context.WithTimeout(ctx, 2*time.Minute)
	defer cancel()
	user.CleanupAfterAccountDeletion(cleanupCtx, pool, nil, sessions, storage, cleanup, userID)

	if cleanup.MarkerDeletable() {
		fmt.Printf("deleted avatar marker %s\n", cleanup.MarkerPath)
	}

	fmt.Println("done")
}
