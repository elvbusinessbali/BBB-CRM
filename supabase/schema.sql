-- BBB CRM database schema
-- Run this in the Supabase SQL Editor after creating a new project.

create extension if not exists "pgcrypto";

-- Each Supabase auth user owns one business.
create table public.businesses (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade unique,
  name        text not null default 'My Business',
  language    text not null default 'en' check (language in ('en','id')),
  created_at  timestamptz not null default now()
);

create table public.customers (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  first_name  text not null,
  last_name   text,
  name        text not null, -- kept for legacy reads; app writes both
  phone       text,
  email       text,
  birthday    date,
  tags        text[] not null default '{}',
  notes       text,
  status      text not null default 'cold' check (status in ('cold','warm','hot','deal_done','paused')),
  created_at  timestamptz not null default now()
);

create index customers_business_idx on public.customers(business_id);
create index customers_birthday_idx on public.customers(business_id, birthday);
create index customers_status_idx on public.customers(business_id, status);

create table public.business_tags (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name        text not null,
  color       text not null default 'pink',
  created_at  timestamptz not null default now(),
  unique (business_id, name)
);

create index business_tags_business_idx on public.business_tags(business_id);

create table public.interactions (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  kind        text not null default 'visit',
  amount      numeric(12,2),
  notes       text,
  occurred_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create index interactions_customer_idx on public.interactions(customer_id, occurred_at desc);
create index interactions_business_idx on public.interactions(business_id, occurred_at desc);

-- Create a business row automatically when a new user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.businesses (owner_id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'business_name', 'My Business'));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security: each business only sees its own data.
alter table public.businesses    enable row level security;
alter table public.customers     enable row level security;
alter table public.interactions  enable row level security;
alter table public.business_tags enable row level security;

create policy "own business: select" on public.businesses
  for select using (owner_id = auth.uid());
create policy "own business: update" on public.businesses
  for update using (owner_id = auth.uid());

create policy "own customers: all" on public.customers
  for all using (
    business_id in (select id from public.businesses where owner_id = auth.uid())
  ) with check (
    business_id in (select id from public.businesses where owner_id = auth.uid())
  );

create policy "own interactions: all" on public.interactions
  for all using (
    business_id in (select id from public.businesses where owner_id = auth.uid())
  ) with check (
    business_id in (select id from public.businesses where owner_id = auth.uid())
  );

create policy "own tags: all" on public.business_tags
  for all using (
    business_id in (select id from public.businesses where owner_id = auth.uid())
  ) with check (
    business_id in (select id from public.businesses where owner_id = auth.uid())
  );
