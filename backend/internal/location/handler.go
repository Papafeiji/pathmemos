package location

import (
	"log/slog"
	"math"
	"net/http"
	"strconv"

	"papafeiji/backend/internal/config"
	"papafeiji/backend/internal/middleware"
	"papafeiji/backend/pkg/errors"

	"github.com/go-chi/chi/v5"
	"github.com/redis/go-redis/v9"
)

type Handler struct {
	router         chi.Router
	tencentMapKeys []string
	client         *Client
	rdb            *redis.Client
}

func NewHandler(router chi.Router, cfg *config.Config, rdb *redis.Client) *Handler {
	return &Handler{router: router, tencentMapKeys: cfg.TencentMapKeys, client: NewClient(cfg.TencentMapKeys), rdb: rdb}
}

func (h *Handler) Register() {
	h.router.Get("/location/reverse", h.Reverse)
}

func (h *Handler) Reverse(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.UserID(ctx)

	latStr := r.URL.Query().Get("latitude")
	lonStr := r.URL.Query().Get("longitude")
	lat, err := strconv.ParseFloat(latStr, 64)
	if err != nil {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "invalid latitude")
		return
	}
	lon, err := strconv.ParseFloat(lonStr, 64)
	if err != nil {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "invalid longitude")
		return
	}
	if lat < -90 || lat > 90 || lon < -180 || lon > 180 {
		middleware.JSONError(w, r, http.StatusBadRequest, errors.CodeBadRequest, "invalid coordinates")
		return
	}

	if !CheckReverseQuota(ctx, h.rdb, userID) {
		middleware.JSONError(w, r, http.StatusTooManyRequests, errors.BizRateLimited, "daily reverse geocode quota exceeded")
		return
	}

	roundedLat := roundHalfUp(lat, 4)
	roundedLon := roundHalfUp(lon, 4)

	withPois := r.URL.Query().Get("pois") != "0"

	res, err := h.client.Reverse(ctx, roundedLat, roundedLon, withPois)
	if err != nil {
		slog.ErrorContext(ctx, "reverse geocode failed", slog.Any("error", err))
		middleware.JSONError(w, r, http.StatusInternalServerError, errors.CodeInternalError, "reverse geocode failed")
		return
	}

	resp := map[string]interface{}{
		"address":       res.Address,
		"detailAddress": res.DetailAddress,
		"landmark":      res.Landmark,
		"areaCode":      res.AreaCode,
		"areaName":      res.AreaName,
		"pois":          res.POIs,
	}
	middleware.JSON(w, r, http.StatusOK, resp)
}

func roundHalfUp(v float64, places int) float64 {
	shift := math.Pow(10, float64(places))
	return math.Round(v*shift) / shift
}
