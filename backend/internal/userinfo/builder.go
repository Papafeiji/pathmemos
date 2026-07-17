// Package userinfo provides related functionality.
package userinfo

import (
	"context"
	"log/slog"

	"papafeiji/backend/internal/db/sqlc"
	"papafeiji/backend/internal/vip"
	"papafeiji/backend/pkg/util"
)

func Build(ctx context.Context, user *sqlc.GetUserByIDRow, vipService vip.InfoProvider, defaultAvatar string, mpSubscribed bool) map[string]interface{} {
	avatarURL := defaultAvatarURL(defaultAvatar, user.ID)
	if user.Avatar.Valid && user.Avatar.String != "" {
		avatarURL = user.Avatar.String
	}

	info, err := vipService.GetVIPInfo(ctx, user.ID)
	if err != nil {
		slog.ErrorContext(ctx, "failed to get vip info for user profile, falling back to non-vip", slog.String("user_id", user.ID), slog.Any("error", err))
		info = vip.Info{IsVIP: false, ExpireTime: nil}
	}

	return map[string]interface{}{
		"id":              user.ID,
		"avatarUrl":       avatarURL,
		"nickName":        util.ToInterface(user.Nickname),
		"isVip":           info.IsVIP,
		"expireTime":      info.ExpireTime,
		"currentFamilyId": util.ToInterface(user.CurrentFamilyID),
		"mpSubscribed":    mpSubscribed,
	}
}

func defaultAvatarURL(defaultAvatar, userID string) interface{} {
	if defaultAvatar == "" {
		return nil
	}
	return defaultAvatar + userID
}
