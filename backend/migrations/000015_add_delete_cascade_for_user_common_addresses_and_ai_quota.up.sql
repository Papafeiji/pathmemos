-- 添加外键约束前，先检查是否存在孤儿记录。
-- 若存在孤儿记录则中止迁移并提示人工处理，避免直接 DELETE 破坏已有数据。
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM ai_daily_quota_usage a
        WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = a.user_id)
        LIMIT 1
    ) THEN
        RAISE EXCEPTION 'ai_daily_quota_usage 存在 user_id 不在 users 表的孤儿记录，请先手工处理后再添加外键约束';
    END IF;

    IF EXISTS (
        SELECT 1 FROM user_common_addresses a
        WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = a.user_id)
        LIMIT 1
    ) THEN
        RAISE EXCEPTION 'user_common_addresses 存在 user_id 不在 users 表的孤儿记录，请先手工处理后再添加外键约束';
    END IF;
END $$;

ALTER TABLE user_common_addresses
    ADD CONSTRAINT user_common_addresses_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE ai_daily_quota_usage
    ADD CONSTRAINT ai_daily_quota_usage_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
