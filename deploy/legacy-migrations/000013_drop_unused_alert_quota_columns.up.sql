-- 该 migration 会删除 users 表的废弃列。
-- 为避免破坏已有数据，若列中仍存在非默认值/非 NULL 数据，则中止迁移并提示人工处理。
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM users
        WHERE abnormal_subscribe_quota IS DISTINCT FROM 0
           OR new_place_alert_sent_date IS NOT NULL
        LIMIT 1
    ) THEN
        RAISE EXCEPTION 'users 表在 abnormal_subscribe_quota / new_place_alert_sent_date 列中仍存在非默认数据，请先手工迁移或清理后再执行本 migration';
    END IF;
END $$;

ALTER TABLE users
    DROP COLUMN IF EXISTS abnormal_subscribe_quota,
    DROP COLUMN IF EXISTS new_place_alert_sent_date;
