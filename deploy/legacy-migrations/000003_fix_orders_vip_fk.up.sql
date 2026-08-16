-- Prevent deletion of vips rows from cascading and destroying order history.
-- Orders are the source of truth for payment idempotency and audit.
ALTER TABLE ONLY public.orders
    DROP CONSTRAINT orders_vip_id_fkey;

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_vip_id_fkey FOREIGN KEY (vip_id) REFERENCES public.vips(id) ON DELETE NO ACTION;
