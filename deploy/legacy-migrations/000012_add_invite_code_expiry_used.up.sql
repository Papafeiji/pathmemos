ALTER TABLE public.user_invite_codes
    ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone,
    ADD COLUMN IF NOT EXISTS used_at timestamp with time zone;

-- 已有二维码的默认有效期补充，由 scripts/backfill_invite_code_expiry.sql 在 migration
-- 执行完毕、服务部署后单独运行，避免在 migration 中执行业务数据订正。
