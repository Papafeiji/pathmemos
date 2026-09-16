-- 可逆：重建 sys_configs 表结构（种子数据由 000003 或人工回填）。
CREATE TABLE IF NOT EXISTS sys_configs (
    id text DEFAULT 'default'::text NOT NULL,
    ai_config jsonb,
    sys_config jsonb,
    default_diary_config jsonb,
    ai_prompt text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sys_configs_id_check CHECK ((id = 'default'::text))
);
