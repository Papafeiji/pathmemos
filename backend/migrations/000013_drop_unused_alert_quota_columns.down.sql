ALTER TABLE users
    ADD COLUMN IF NOT EXISTS abnormal_subscribe_quota integer DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS new_place_alert_sent_date date;
