-- Restore the original CASCADE behavior on rollback.
ALTER TABLE ONLY public.orders
    DROP CONSTRAINT orders_vip_id_fkey;

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_vip_id_fkey FOREIGN KEY (vip_id) REFERENCES public.vips(id) ON DELETE CASCADE;
