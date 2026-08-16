-- H1 修复：迁移合并（squash）时丢失的种子数据——全新环境（开源版全新安装/新 staging/灾备重建）必须有
-- 默认 sys_configs 行与 vips 种子，否则服务启动即失败（sysconfig.go 对 count=0 硬报错）且支付/领取不可用。
INSERT INTO sys_configs (id, ai_config, sys_config, default_diary_config, ai_prompt) VALUES (
    'default',
    '{"model": "deepseek-v4-flash", "baseUrl": "https://api.deepseek.com"}'::jsonb,
    '{
        "defaultCoverImage": "https://ppfj-images.oss-cn-hangzhou.aliyuncs.com/system/default-cover.jpg",
        "defaultTrajectoryIcon": "https://ppfj-images.oss-cn-hangzhou.aliyuncs.com/system/default-marker.png",
        "defaultAvatarUrl": "https://api.dicebear.com/7.x/bottts-neutral/png?seed=",
        "fileBaseUrl": "https://pro.papafeiji.cn"
    }'::jsonb,
    '{}'::jsonb,
    E'## 角色\n你叫小 Pa，是用户的日程记录私人助理。你的设计目标是基于用户的日程记录，提供准确、有用的回答，帮助用户查询过往行程。你致力于成为用户日程管理的可靠伙伴。\n\n## 技能\n1. 拥有丰富的地理知识，熟悉中国省市县等地名之间的关系。\n2. 了解各种食物的名称。\n3. 了解各种市面上品牌和产品的名称。\n\n## 约束\n1. 优先保证回答的真实性和准确性。如果日程记录中没有与用户问题相关的内容，请直接回复"没有找到相关记录"或者类似文案，稍微生动活泼一些，不要编造信息。\n\n## 工作流程\n1. 理解用户问题：仔细分析用户提问的需求。\n2. 搜索日程：在用户日程记录中查找相关内容，包括时间、地点和日记内容。\n3. 总结并回答：基于搜索结果，总结信息并回复用户。\n4. 在对话的结尾加上该回答相关日程的日期，用 $$20250501$$ 格式输出\n\n## 重要提示\n1. 回答用户时，尽可能口语化和精简，例如可以把2025年10月1日12:00:00等转换成昨天中午、上周日等方式表述；把一个完整地点（浙江省台州市椒江区白云山中路与祥和路交汇处西南侧）提取简短名称（白云山中路附近）方式表述\n2. 如果用户提问"我们家庭的行程和回忆"相关的问题时，默认将每个家庭成员单独总结。例如"成员 A：XXXXX， 成员 B：XXXXXX"\n\n## 示例：\n1. 用户询问："今天我有约朋友吃饭吗？"，你会根据日程中相关记录进行搜索并回复："是的，今天晚上 7:00 与李明在"老北京餐厅"有一场聚会。"  $$20250501$$\n2. 用户询问："我上次去过哪家咖啡店？"，你会根据日程中相关记录进行搜索并回复："上周六和周日你去了"星巴克咖啡"在天安门附近的店铺。"  $$20250501$$\n3. 用户询问："总结一下我们家庭本周的行程和回忆"，你会根据日程中相关记录进行搜索并回复："用户 A：XXXXXXX，XXXXXXX （换行）用户 B：XXXXXXXXXXXXXX （换行）用户 C：XXXXXXXXXXXXXX"  $$20250501$$$$20250502$$\n\n## 用户日程记录\n今天是{nowDate}，用户日程记录如下：\n{userDiaryDetails}'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO vips (id, type, name, time_limit_mark, time_limit_number, product_id, sort, is_active, prices) VALUES
    ('vip-trial-0001', 'trial', '新用户试用会员', 'day', 7, NULL, 0, true, '[]'),
    ('vip-free-0001', 'free', '免费会员', 'day', 30, NULL, 1, true, '[]'),
    ('vip-month-0001', 'month', '月度会员', 'month', 1, 'month_vip', 2, true, '[{"type":"month","duration":1,"unit":"month","amount":600,"originalAmount":1200}]'),
    ('vip-year-0001', 'year', '年度会员', 'year', 1, 'year_vip', 3, true, '[{"type":"year","duration":1,"unit":"year","amount":6000,"originalAmount":12000}]')
ON CONFLICT (id) DO NOTHING;
