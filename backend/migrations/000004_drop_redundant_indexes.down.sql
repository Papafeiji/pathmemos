CREATE INDEX idx_diaries_user_id_record_date ON public.diaries USING btree (user_id, record_date);
CREATE INDEX idx_diary_entries_diary_id ON public.diary_entries USING btree (diary_id);
CREATE INDEX idx_user_invite_codes_short_code ON public.user_invite_codes USING btree (short_code);
