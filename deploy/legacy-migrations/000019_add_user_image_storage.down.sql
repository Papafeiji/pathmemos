ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_image_storage_bytes_nonnegative;
ALTER TABLE users
    DROP COLUMN IF EXISTS image_storage_bytes;
