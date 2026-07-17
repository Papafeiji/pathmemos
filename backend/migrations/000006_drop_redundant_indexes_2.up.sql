-- These indexes are redundant because equivalent or superseding indexes already exist:
--   - idx_user_invites_inviter_created (inviter_id, created_at DESC)
--   - idx_auto_record_trajectories_user_recorded (user_id, recorded_at)
--   - idx_auto_record_trajectories_user_attempts (user_id, geocode_attempts)
DROP INDEX IF EXISTS idx_user_invites_inviter_id;
DROP INDEX IF EXISTS idx_auto_record_trajectories_pending;
