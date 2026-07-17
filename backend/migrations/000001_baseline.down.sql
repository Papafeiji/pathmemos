-- Baseline down migration：一次性清空整个数据库，用于全新环境回滚到空库。
-- 该脚本会删除所有业务表及数据，属于基线迁移的固有破坏性回滚；生产环境回滚应使用增量 down 脚本或数据备份恢复，而非直接执行本脚本。
DROP TABLE IF EXISTS wx_mp_accounts, user_vip_claims, user_vips, user_invites, user_invite_codes, user_avatar_markers, sys_configs, orders, memories, files, diary_entry_images, diary_entries, diaries, family_daily_covers, family_members, families, users, vips, api_keys, auto_record_trajectories, ai_dialog_logs CASCADE;
