-- These indexes are redundant because equivalent or superseding indexes already exist:
--   - diaries_user_id_record_date_key UNIQUE (user_id, record_date)
--   - idx_diary_entries_diary_created_at (diary_id, created_at DESC)
--   - user_invite_codes_short_code_key UNIQUE (short_code)
DROP INDEX IF EXISTS idx_diaries_user_id_record_date;
DROP INDEX IF EXISTS idx_diary_entries_diary_id;
DROP INDEX IF EXISTS idx_user_invite_codes_short_code;
