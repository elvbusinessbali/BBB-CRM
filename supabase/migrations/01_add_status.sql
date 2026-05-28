-- Adds a pipeline status to each customer.
-- Safe to re-run.

alter table public.customers
  add column if not exists status text not null default 'cold';

-- Allowed values: cold / warm / hot / deal_done / paused
alter table public.customers
  drop constraint if exists customers_status_check;
alter table public.customers
  add constraint customers_status_check
  check (status in ('cold', 'warm', 'hot', 'deal_done', 'paused'));

-- Backfill: existing customers with at least one interaction → 'deal_done'.
update public.customers c
   set status = 'deal_done'
 where c.status = 'cold'
   and exists (
     select 1 from public.interactions i where i.customer_id = c.id
   );

create index if not exists customers_status_idx
  on public.customers(business_id, status);
