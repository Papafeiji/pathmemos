ALTER TABLE public.user_invite_codes
    DROP COLUMN IF EXISTS used_at,
    DROP COLUMN IF EXISTS expires_at;
