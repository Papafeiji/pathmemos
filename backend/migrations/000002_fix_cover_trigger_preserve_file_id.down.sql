-- 回滚 B3-08：恢复旧行为（manual→default 时清空 cover_file_id）。
CREATE OR REPLACE FUNCTION public.fix_cover_type_on_null_fk() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;
