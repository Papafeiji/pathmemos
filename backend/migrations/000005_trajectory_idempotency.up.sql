SET search_path = public;
-- PPJ-C04 / DA-P1-03：轨迹上报幂等。
-- 前端上报失败会重试，服务端原先无去重，客户端未收到响应时整批重传会产生重复轨迹，
-- 进而聚类出重复驻点/自动日记。以「同一用户 + 同一时刻 + 同一坐标 = 同一个点」为自然键
-- 建唯一索引，并让 INSERT ... ON CONFLICT DO NOTHING 静默忽略重复（见 db/sqlc/auto_record.sql）。
-- 不引入 Redis 去重或批次表，符合 AGENTS.md「简单优先」。

-- 建索引前清理历史重复：同组保留 created_at 最早、id 最小的一条。
DELETE FROM public.auto_record_trajectories t
USING public.auto_record_trajectories d
WHERE t.user_id = d.user_id
  AND t.recorded_at = d.recorded_at
  AND t.lat = d.lat
  AND t.lon = d.lon
  AND (t.created_at, t.id) > (d.created_at, d.id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_auto_record_trajectories_point
    ON public.auto_record_trajectories USING btree (user_id, recorded_at, lat, lon);
