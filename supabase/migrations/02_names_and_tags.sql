-- Split customer name into first_name + last_name, and add per-business tags table.
-- Safe to re-run.

----------------------------------------------------------------------
-- 1. Customer first/last name
----------------------------------------------------------------------

alter table public.customers
  add column if not exists first_name text;
alter table public.customers
  add column if not exists last_name text;

-- Backfill: split existing single `name` on the first space.
update public.customers
   set first_name = case
                      when position(' ' in name) > 0
                        then trim(substring(name from 1 for position(' ' in name) - 1))
                      else name
                    end,
       last_name  = case
                      when position(' ' in name) > 0
                        then trim(substring(name from position(' ' in name) + 1))
                      else null
                    end
 where first_name is null;

-- Enforce: first_name cannot be null going forward.
alter table public.customers
  alter column first_name set not null;

-- We keep `name` column for backwards-compat (computed at write time by app).
-- New rows will be inserted with both name + first_name + last_name set.

----------------------------------------------------------------------
-- 2. Business-defined tag catalog
----------------------------------------------------------------------

create table if not exists public.business_tags (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name        text not null,
  color       text not null default 'pink',
  created_at  timestamptz not null default now(),
  unique (business_id, name)
);

create index if not exists business_tags_business_idx
  on public.business_tags(business_id);

alter table public.business_tags enable row level security;

drop policy if exists "business_tags_owner_all" on public.business_tags;
create policy "business_tags_owner_all"
  on public.business_tags
  for all
  to authenticated
  using (
    business_id in (
      select id from public.businesses where owner_id = auth.uid()
    )
  )
  with check (
    business_id in (
      select id from public.businesses where owner_id = auth.uid()
    )
  );

-- Seed: when a business is created, give it a starter palette of tags.
create or replace function public.seed_default_tags()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.business_tags (business_id, name, color)
  values
    (new.id, 'VIP',     'rose'),
    (new.id, 'Regular', 'sky'),
    (new.id, 'New',     'emerald')
  on conflict do nothing;
  return new;
end
$$;

drop trigger if exists seed_default_tags_trigger on public.businesses;
create trigger seed_default_tags_trigger
  after insert on public.businesses
  for each row
  execute function public.seed_default_tags();

-- Backfill default tags for existing businesses that have none.
insert into public.business_tags (business_id, name, color)
select b.id, t.name, t.color
  from public.businesses b
 cross join (
   values ('VIP','rose'), ('Regular','sky'), ('New','emerald')
 ) as t(name, color)
 where not exists (
   select 1 from public.business_tags bt where bt.business_id = b.id
 )
on conflict do nothing;
