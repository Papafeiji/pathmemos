-- Prevent deletion of vips rows from cascading and destroying VIP claim history.
-- user_vip_claims is the source of truth for free/trial VIP claim idempotency
-- (enforced by the (user_id, vip_id) unique constraint).
ALTER TABLE ONLY public.user_vip_claims
    DROP CONSTRAINT user_vip_claims_vip_id_fkey;

ALTER TABLE ONLY public.user_vip_claims
    ADD CONSTRAINT user_vip_claims_vip_id_fkey FOREIGN KEY (vip_id) REFERENCES public.vips(id) ON DELETE NO ACTION;

-- Support efficient FK enforcement and lookups by vip_id.
CREATE INDEX idx_user_vip_claims_vip_id ON public.user_vip_claims USING btree (vip_id);
