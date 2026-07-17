ALTER TABLE user_common_addresses
    DROP CONSTRAINT IF EXISTS user_common_addresses_user_id_fkey;

ALTER TABLE ai_daily_quota_usage
    DROP CONSTRAINT IF EXISTS ai_daily_quota_usage_user_id_fkey;
