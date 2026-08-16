-- 为用户增加图片存储用量字段，用于快速判断存储上限。
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS image_storage_bytes bigint DEFAULT 0 NOT NULL;

-- 防止异常扣减导致负值。
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_image_storage_bytes_nonnegative;
ALTER TABLE users ADD CONSTRAINT users_image_storage_bytes_nonnegative CHECK (image_storage_bytes >= 0);

-- 初始化现有用户数据：仅统计用户主动上传的图片（file_type = 'image'）。
-- 系统生成文件（轨迹图、头像 marker、邀请二维码等）不计入。
UPDATE users u
SET image_storage_bytes = (
    SELECT COALESCE(SUM(f.size_bytes), 0)
    FROM files f
    WHERE f.created_by = u.id
      AND f.file_type = 'image'
);
