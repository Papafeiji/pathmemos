SET search_path = public;
-- 客户端操作日志：小程序本地记录关键操作事件（手动记录/自动记录等），
-- 打开小程序时批量上报，用于排查“App 端操作了但服务器未收到”的数据问题。
CREATE TABLE IF NOT EXISTS client_ops_logs (
    id             text PRIMARY KEY,
    user_id        text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device         text NOT NULL DEFAULT '',
    app_version    text NOT NULL DEFAULT '',
    events         jsonb NOT NULL,
    client_sent_at timestamptz NOT NULL,
    created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_ops_logs_user_created
    ON client_ops_logs (user_id, created_at DESC);
