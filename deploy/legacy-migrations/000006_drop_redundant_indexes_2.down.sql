CREATE INDEX idx_user_invites_inviter_id ON public.user_invites USING btree (inviter_id);
CREATE INDEX idx_auto_record_trajectories_pending ON public.auto_record_trajectories USING btree (user_id);
