package vip

import (
	"context"
	"errors"
	"fmt"

	"time"

	"papafeiji/backend/internal/db"
	"papafeiji/backend/internal/db/sqlc"
	"papafeiji/backend/pkg/timeutil"
	"papafeiji/backend/pkg/util"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

const (
	trialVIPID = "vip-trial-0001"
	freeVIPID  = "vip-free-0001"
)

type Service struct {
	pool *db.Pool
}

func NewService(pool *db.Pool) *Service {
	return &Service{pool: pool}
}

type Info struct {
	IsVIP      bool
	ExpireTime interface{}
}

type InfoProvider interface {
	GetVIPInfo(ctx context.Context, userID string) (Info, error)
}

var _ InfoProvider = (*Service)(nil)

func (s *Service) IssueTrialVIPWithTx(ctx context.Context, userID string, q *sqlc.Queries) error {
	return s.ActivateVIPWithTx(ctx, userID, trialVIPID, q)
}

func (s *Service) ClaimTrialVIP(ctx context.Context, userID string) error {
	return db.WithTx(ctx, s.pool.Pool(), func(ctx context.Context, q *sqlc.Queries) error {
		return s.ActivateVIPWithTx(ctx, userID, trialVIPID, q)
	})
}

func (s *Service) ClaimFreeVIP(ctx context.Context, userID, vipID string) error {
	return db.WithTx(ctx, s.pool.Pool(), func(ctx context.Context, q *sqlc.Queries) error {
		vipRecord, err := q.GetVIPByID(ctx, vipID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return ErrInvalidVIP
			}

			return fmt.Errorf("get vip by id: %w", err)
		}
		if vipRecord.Type != "free" || !vipRecord.IsActive {
			return ErrInvalidVIP
		}
		return s.activateVIPWithTx(ctx, userID, vipRecord, q)
	})
}

func (s *Service) HasVIPClaim(ctx context.Context, userID, vipID string) (bool, error) {
	if userID == "" {
		return false, fmt.Errorf("empty user id")
	}
	exists, err := s.pool.Queries().HasVIPClaim(ctx, sqlc.HasVIPClaimParams{
		UserID: userID,
		VipID:  vipID,
	})
	if err != nil {
		return false, err
	}
	return exists, nil
}

func (s *Service) ExtendVIPDays(ctx context.Context, userID string, days int) error {
	if userID == "" || days <= 0 {
		return nil
	}

	return db.WithTx(ctx, s.pool.Pool(), func(ctx context.Context, q *sqlc.Queries) error {
		return s.ExtendVIPDaysWithTx(ctx, userID, days, q)
	})
}

func (s *Service) ExtendVIPDaysWithTx(ctx context.Context, userID string, days int, q *sqlc.Queries) error {
	if userID == "" || days <= 0 {
		return nil
	}

	now := timeutil.NowShanghai()
	existing, err := q.GetUserVIPForUpdate(ctx, userID)
	var begin time.Time
	var expire time.Time
	var id string
	if err == nil {
		begin = existing.BeginTime.Time
		base := now
		if existing.ExpireTime.Time.After(now) {
			base = existing.ExpireTime.Time
		}
		expire = base.AddDate(0, 0, days)
		id = existing.ID
	} else if errors.Is(err, pgx.ErrNoRows) {
		begin = now
		expire = now.AddDate(0, 0, days)
		newID, err := util.NewUUID()
		if err != nil {
			return fmt.Errorf("generate user vip id: %w", err)
		}
		id = newID
	} else {
		return fmt.Errorf("get user vip: %w", err)
	}

	_, err = q.UpsertUserVIP(ctx, sqlc.UpsertUserVIPParams{
		ID:         id,
		UserID:     userID,
		BeginTime:  pgtype.Timestamptz{Time: begin, Valid: true},
		ExpireTime: pgtype.Timestamptz{Time: expire, Valid: true},
	})
	if err != nil {
		return fmt.Errorf("upsert user vip: %w", err)
	}
	return nil
}

func (s *Service) GetVIPInfo(ctx context.Context, userID string) (Info, error) {
	uv, err := s.pool.Queries().GetUserVIP(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Info{IsVIP: false, ExpireTime: nil}, nil
		}
		return Info{}, fmt.Errorf("get user vip: %w", err)
	}

	isVIP := uv.ExpireTime.Time.After(timeutil.NowShanghai())
	expire := uv.ExpireTime.Time.In(timeutil.Shanghai).Format("2006-01-02T15:04:05-07:00")

	return Info{IsVIP: isVIP, ExpireTime: expire}, nil
}

func (s *Service) ActivateVIPWithTx(ctx context.Context, userID, vipID string, q *sqlc.Queries) error {
	vipRecord, err := q.GetVIPByID(ctx, vipID)
	if err != nil {
		return fmt.Errorf("get vip by id: %w", err)
	}
	return s.activateVIPWithTx(ctx, userID, vipRecord, q)
}

func (s *Service) activateVIPWithTx(ctx context.Context, userID string, vipRecord sqlc.Vip, q *sqlc.Queries) error {
	duration, unit, err := ParseVIPDuration(vipRecord.TimeLimitMark, int(vipRecord.TimeLimitNumber))
	if err != nil {
		return fmt.Errorf("parse vip duration: %w", err)
	}

	now := timeutil.NowShanghai()
	var expire time.Time
	switch unit {
	case "day":
		expire = now.AddDate(0, 0, duration)
	case "month":
		expire = now.AddDate(0, duration, 0)
	case "year":
		expire = now.AddDate(duration, 0, 0)
	}

	claimID, err := util.NewUUID()
	if err != nil {
		return fmt.Errorf("generate vip claim id: %w", err)
	}
	rowsAffected, err := q.UpsertVIPClaim(ctx, sqlc.UpsertVIPClaimParams{
		ID:     claimID,
		UserID: userID,
		VipID:  vipRecord.ID,
	})
	if err != nil {
		return fmt.Errorf("upsert vip claim: %w", err)
	}
	if rowsAffected == 0 {
		switch vipRecord.Type {
		case "trial":
			return ErrTrialVIPAlreadyClaimed
		case "free":
			return ErrFreeVIPAlreadyClaimed
		}
	}

	existing, err := q.GetUserVIPForUpdate(ctx, userID)
	if err == nil {
		begin := existing.BeginTime.Time
		base := now
		if existing.ExpireTime.Time.After(now) {
			base = existing.ExpireTime.Time
		}
		var added time.Time
		switch unit {
		case "day":
			added = base.AddDate(0, 0, duration)
		case "month":
			added = base.AddDate(0, duration, 0)
		case "year":
			added = base.AddDate(duration, 0, 0)
		}
		expire = added

		_, err = q.UpsertUserVIP(ctx, sqlc.UpsertUserVIPParams{
			ID:         existing.ID,
			UserID:     userID,
			BeginTime:  pgtype.Timestamptz{Time: begin, Valid: true},
			ExpireTime: pgtype.Timestamptz{Time: expire, Valid: true},
		})
		if err != nil {
			return fmt.Errorf("upsert user vip (extend): %w", err)
		}
	} else if errors.Is(err, pgx.ErrNoRows) {
		newUserVipID, err := util.NewUUID()
		if err != nil {
			return fmt.Errorf("generate user vip id: %w", err)
		}
		_, err = q.UpsertUserVIP(ctx, sqlc.UpsertUserVIPParams{
			ID:         newUserVipID,
			UserID:     userID,
			BeginTime:  pgtype.Timestamptz{Time: now, Valid: true},
			ExpireTime: pgtype.Timestamptz{Time: expire, Valid: true},
		})
		if err != nil {
			return fmt.Errorf("upsert user vip (create): %w", err)
		}
	} else {
		return fmt.Errorf("get user vip: %w", err)
	}

	return nil
}

func ParseVIPDuration(mark string, number int) (int, string, error) {
	if number <= 0 {
		return 0, "", fmt.Errorf("invalid vip time_limit_number: %d (must be > 0)", number)
	}
	switch mark {
	case "day", "month", "year":
		return number, mark, nil
	default:
		return 0, "", fmt.Errorf("invalid vip time_limit_mark: %s", mark)
	}
}
