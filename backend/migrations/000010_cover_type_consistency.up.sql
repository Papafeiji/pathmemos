CREATE OR REPLACE FUNCTION fix_cover_type_on_null_fk()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.manual_cover_file_id IS NULL AND NEW.cover_type = 'manual' THEN
        NEW.cover_type := 'default';
        NEW.cover_file_id := NULL;
    END IF;
    IF NEW.cover_file_id IS NULL AND NEW.cover_type IN ('image', 'trajectory') THEN
        NEW.cover_type := 'default';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_family_daily_covers_fix_type ON family_daily_covers;
CREATE TRIGGER trg_family_daily_covers_fix_type
BEFORE UPDATE ON family_daily_covers
FOR EACH ROW EXECUTE FUNCTION fix_cover_type_on_null_fk();
