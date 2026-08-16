CREATE TABLE IF NOT EXISTS ai_daily_quota_usage (
    user_id TEXT NOT NULL,
    quota_date DATE NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, quota_date)
);

CREATE INDEX IF NOT EXISTS idx_ai_daily_quota_usage_date
    ON ai_daily_quota_usage(quota_date);
