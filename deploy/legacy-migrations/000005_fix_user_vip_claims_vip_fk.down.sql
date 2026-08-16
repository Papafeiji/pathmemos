-- Restore the original CASCADE behavior and remove the supporting index.
DROP INDEX IF EXISTS idx_user_vip_claims_vip_id;

ALTER TABLE ONLY public.user_vip_claims
    DROP CONSTRAINT user_vip_claims_vip_id_fkey;

ALTER TABLE ONLY public.user_vip_claims
    ADD CONSTRAINT user_vip_claims_vip_id_fkey FOREIGN KEY (vip_id) REFERENCES public.vips(id) ON DELETE CASCADE;
