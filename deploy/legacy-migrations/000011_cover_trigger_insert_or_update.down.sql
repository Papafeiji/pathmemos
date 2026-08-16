DROP TRIGGER IF EXISTS trg_family_daily_covers_fix_type ON family_daily_covers;

CREATE TRIGGER trg_family_daily_covers_fix_type
BEFORE UPDATE ON family_daily_covers
FOR EACH ROW EXECUTE FUNCTION fix_cover_type_on_null_fk();
