DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM api_keys WHERE api_key IS NULL OR api_key = '') THEN
        RAISE EXCEPTION 'Migration aborted: api_keys contains NULL or empty api_key values. Fix data before applying.';
    END IF;
END $$;

ALTER TABLE api_keys ALTER COLUMN api_key SET NOT NULL;
