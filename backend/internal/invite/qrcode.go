// Package invite provides related functionality.
package invite

import (
	"bytes"
	"context"
	"encoding/json"
	stderrors "errors"
	"fmt"
	"image"
	"image/draw"
	"image/jpeg"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"papafeiji/backend/internal/config"
	"papafeiji/backend/internal/db"
	"papafeiji/backend/internal/db/sqlc"
	"papafeiji/backend/internal/file"
	dbx "papafeiji/backend/pkg/db"
	"papafeiji/backend/pkg/util"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/redis/go-redis/v9"
)

const (
	inviteShortCodePrefix   = ""
	inviteShortCodeCacheKey = "invite:code:%s"
	inviteShortCodeCacheTTL = 30 * 24 * time.Hour
	inviteQRCodeCacheKey    = "invite:qrcode:%s"
	inviteQRCodeCacheTTL    = 6 * 24 * time.Hour
	inviteQRCodeTargetRatio = 0.20
	inviteQRCodeMargin      = 40
	inviteShortCodeLen      = 8
)

type WechatClient interface {
	GetAccessToken(ctx context.Context) (string, error)
	ClearAccessToken(ctx context.Context)
}

type QRCodeGenerator struct {
	wechat      WechatClient
	pool        *db.Pool
	storage     *file.Storage
	bgImagePath string
}

func NewQRCodeGenerator(wechat WechatClient, pool *db.Pool, storage *file.Storage, bgImagePath string) *QRCodeGenerator {
	return &QRCodeGenerator{
		wechat:      wechat,
		pool:        pool,
		storage:     storage,
		bgImagePath: bgImagePath,
	}
}

func (g *QRCodeGenerator) Generate(ctx context.Context, rdb *redis.Client, userID string) (string, error) {
	return g.generate(ctx, rdb, userID, false)
}

func (g *QRCodeGenerator) GenerateRaw(ctx context.Context, rdb *redis.Client, userID string) (string, error) {
	return g.generate(ctx, rdb, userID, true)
}

func (g *QRCodeGenerator) generate(ctx context.Context, rdb *redis.Client, userID string, raw bool) (string, error) {
	if userID == "" {
		return "", fmt.Errorf("user id is empty")
	}

	cacheKey := fmt.Sprintf(inviteQRCodeCacheKey, userID)
	if raw {
		cacheKey += ":raw"
	}
	if rdb != nil {
		cached, err := rdb.Get(ctx, cacheKey).Result()
		if err == nil && cached != "" {
			return cached, nil
		}
		if err != nil && err != redis.Nil {
			slog.WarnContext(ctx, "read invite qrcode cache failed", slog.String("user_id", userID), slog.Bool("raw", raw), slog.Any("error", err))
		}
	}

	shortCode, err := g.ensureShortCode(ctx, g.pool.Queries(), userID)
	if err != nil {
		return "", fmt.Errorf("ensure short code: %w", err)
	}

	user, err := g.pool.Queries().GetUserByID(ctx, userID)
	if err != nil {
		return "", fmt.Errorf("get user: %w", err)
	}
	familyID := util.ToString(user.CurrentFamilyID)
	if familyID == "" {
		familyID = util.ToString(user.PersonalFamilyID)
	}
	rawStr := "false"
	if raw {
		rawStr = "true"
	}
	metadata, err := json.Marshal(map[string]string{
		"family_id": familyID,
		"raw":       rawStr,
	})
	if err != nil {
		return "", fmt.Errorf("marshal qrcode metadata: %w", err)
	}

	qrBytes, err := g.fetchWxaCode(ctx, shortCode)
	if err != nil {
		return "", fmt.Errorf("fetch wxa code: %w", err)
	}

	var imageBytes []byte
	var suffix string
	if raw {
		imageBytes = qrBytes
		suffix = "png"
	} else {
		imageBytes, err = g.composite(qrBytes)
		if err != nil {
			return "", fmt.Errorf("composite invite image: %w", err)
		}
		suffix = "jpg"
	}

	fileName := shortCode + "." + suffix
	key, storageType, size, err := g.storage.SaveSystemWithName(bytes.NewReader(imageBytes), "."+suffix, shortCode)
	if err != nil {
		return "", fmt.Errorf("save invite image: %w", err)
	}

	fileID, err := util.NewUUID()
	if err != nil {
		return "", fmt.Errorf("generate invite file id: %w", err)
	}

	// 事务内查询旧文件、创建新文件记录并删除旧文件记录；物理文件删除在 DB 提交成功后进行。
	// 旧文件列表在事务内读取，避免并发生成时误删刚创建的新二维码。
	var oldFiles []sqlc.ListUserInviteQRCodeFilesRow
	if err := db.WithTx(ctx, g.pool.Pool(), func(ctx context.Context, q *sqlc.Queries) error {
		oldFiles, err = q.ListUserInviteQRCodeFiles(ctx, sqlc.ListUserInviteQRCodeFilesParams{
			CreatedBy: pgtype.Text{String: userID, Valid: true},
			Metadata:  []byte(rawStr),
		})
		if err != nil {
			return fmt.Errorf("list old invite qrcode files: %w", err)
		}
		if _, err := q.CreateFile(ctx, sqlc.CreateFileParams{
			ID:          fileID,
			CreatedBy:   pgtype.Text{String: userID, Valid: true},
			Path:        key,
			Name:        fileName,
			Suffix:      suffix,
			SizeBytes:   size,
			FileType:    "system",
			StorageType: storageType,
			Metadata:    metadata,
		}); err != nil {
			return fmt.Errorf("record invite qrcode file: %w", err)
		}
		if len(oldFiles) > 0 {
			oldIDs := make([]string, 0, len(oldFiles))
			for _, f := range oldFiles {
				oldIDs = append(oldIDs, f.ID)
			}
			if _, err := q.BatchDeleteFiles(ctx, oldIDs); err != nil {
				return fmt.Errorf("delete old invite qrcode file records: %w", err)
			}
		}
		return nil
	}); err != nil {
		return "", err
	}

	// DB 提交成功后再清理旧物理文件；清理失败可接受少量孤儿文件。
	for _, f := range oldFiles {
		if delErr := g.storage.DeleteFile(f.Path, f.StorageType); delErr != nil {
			slog.WarnContext(ctx, "delete old invite qrcode physical file failed", slog.String("path", f.Path), slog.String("user_id", userID), slog.Any("error", delErr))
		}
	}

	imageURL, urlErr := g.storage.URL(key, storageType)
	if urlErr != nil {
		return "", fmt.Errorf("get invite qrcode url: %w", urlErr)
	}

	if rdb != nil {
		if err := rdb.Set(ctx, cacheKey, imageURL, inviteQRCodeCacheTTL).Err(); err != nil {
			slog.WarnContext(ctx, "cache invite qrcode url failed", slog.String("user_id", userID), slog.Bool("raw", raw), slog.Any("error", err))
		}
	}

	return imageURL, nil
}

func (g *QRCodeGenerator) ensureShortCode(ctx context.Context, q *sqlc.Queries, userID string) (string, error) {
	existing, err := q.GetUserInviteCode(ctx, userID)
	if err == nil && existing != "" {
		return existing, nil
	}
	if err != nil && !isPgNoRows(err) {
		return "", fmt.Errorf("get user invite code: %w", err)
	}

	code, err := util.NewShortCode(inviteShortCodeLen)
	if err != nil {
		return "", fmt.Errorf("generate short code: %w", err)
	}
	if _, dbErr := q.CreateUserInviteCode(ctx, sqlc.CreateUserInviteCodeParams{
		UserID:    userID,
		ShortCode: code,
	}); dbErr != nil {
		if dbx.IsUniqueViolation(dbErr) {
			existing, getErr := q.GetUserInviteCode(ctx, userID)
			if getErr != nil {
				return "", fmt.Errorf("get user invite code after conflict: %w", getErr)
			}
			if existing != "" {
				return existing, nil
			}
		}
		return "", fmt.Errorf("create user invite code: %w", dbErr)
	}
	return code, nil
}

func isPgNoRows(err error) bool {
	return stderrors.Is(err, pgx.ErrNoRows)
}

func (g *QRCodeGenerator) fetchWxaCode(ctx context.Context, scene string) ([]byte, error) {
	for attempt := 0; attempt < 2; attempt++ {
		if attempt > 0 {
			g.wechat.ClearAccessToken(ctx)
		}

		token, err := g.wechat.GetAccessToken(ctx)
		if err != nil {
			return nil, fmt.Errorf("get access token: %w", err)
		}

		u := fmt.Sprintf("https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=%s", url.QueryEscape(token))
		payload, err := json.Marshal(map[string]interface{}{
			"scene":      scene,
			"page":       "pages/index/index",
			"is_hyaline": true,
			"width":      800,
		})
		if err != nil {
			return nil, fmt.Errorf("marshal wxacode request: %w", err)
		}

		req, err := http.NewRequestWithContext(ctx, http.MethodPost, u, bytes.NewReader(payload))
		if err != nil {
			return nil, err
		}
		req.Header.Set("Content-Type", "application/json")

		httpClient := config.HTTPClient()
		resp, err := httpClient.Do(req)
		if err != nil {
			return nil, fmt.Errorf("request wxa code: %w", err)
		}

		body, err := io.ReadAll(io.LimitReader(resp.Body, 2*1024*1024))
		resp.Body.Close() //nolint:errcheck
		if err != nil {
			return nil, fmt.Errorf("read wxa code response: %w", err)
		}

		if len(body) > 0 && body[0] == '{' {
			var result struct {
				ErrCode int    `json:"errcode"`
				ErrMsg  string `json:"errmsg"`
			}
			if err := json.Unmarshal(body, &result); err == nil && result.ErrCode != 0 {
				if (result.ErrCode == 40001 || result.ErrCode == 42001) && attempt == 0 {
					continue
				}
				return nil, fmt.Errorf("wxa code error: code=%d msg=%s", result.ErrCode, result.ErrMsg)
			}
		}

		if len(body) == 0 {
			return nil, fmt.Errorf("empty wxa code response")
		}
		return body, nil
	}
	return nil, fmt.Errorf("fetch wxa code failed after retry")
}

func (g *QRCodeGenerator) composite(qrBytes []byte) ([]byte, error) {
	bgFile, err := os.Open(g.bgImagePath)
	if err != nil {
		return nil, fmt.Errorf("open background image: %w", err)
	}
	//nolint:errcheck
	defer bgFile.Close()

	bgImg, _, err := image.Decode(bgFile)
	if err != nil {
		return nil, fmt.Errorf("decode background image: %w", err)
	}

	qrImg, _, err := image.Decode(bytes.NewReader(qrBytes))
	if err != nil {
		return nil, fmt.Errorf("decode qrcode image: %w", err)
	}

	bounds := bgImg.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()

	targetSize := int(float64(width) * inviteQRCodeTargetRatio)
	if targetSize < 120 {
		targetSize = 120
	}
	scaledQR := resizeNearest(qrImg, targetSize, targetSize)

	dst := image.NewRGBA(bounds)
	draw.Draw(dst, bounds, bgImg, bounds.Min, draw.Src)

	margin := inviteQRCodeMargin
	offset := 300
	x := width - scaledQR.Bounds().Dx() - margin - offset
	y := height - scaledQR.Bounds().Dy() - margin - offset
	if x < 0 {
		x = 0
	}
	if y < 0 {
		y = 0
	}
	draw.Draw(dst, scaledQR.Bounds().Add(image.Pt(x, y)), scaledQR, image.Point{}, draw.Over)

	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, dst, &jpeg.Options{Quality: 90}); err != nil {
		return nil, fmt.Errorf("encode composite image: %w", err)
	}
	return buf.Bytes(), nil
}

func resizeNearest(src image.Image, w, h int) image.Image {
	dst := image.NewRGBA(image.Rect(0, 0, w, h))
	bounds := src.Bounds()
	sw := bounds.Dx()
	sh := bounds.Dy()
	for y := 0; y < h; y++ {
		sy := bounds.Min.Y + y*sh/h
		for x := 0; x < w; x++ {
			sx := bounds.Min.X + x*sw/w
			dst.Set(x, y, src.At(sx, sy))
		}
	}
	return dst
}

func ResolveInviterFromCode(ctx context.Context, q *sqlc.Queries, code string) (string, error) {
	if code == "" {
		return "", nil
	}
	code = strings.ToUpper(strings.TrimSpace(code))

	userID, err := q.ResolveInviterFromCode(ctx, code)
	if err != nil {
		if isPgNoRows(err) {
			return "", nil
		}
		return "", fmt.Errorf("resolve inviter from code: %w", err)
	}
	return userID, nil
}
