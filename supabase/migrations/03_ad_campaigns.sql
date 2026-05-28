-- Adds an ad-campaigns table (for tracking marketing spend + CAC)
-- and a nullable foreign key on customers so each customer can be attributed
-- to the campaign that brought them in.
-- Safe to re-run.

----------------------------------------------------------------------
-- Table
----------------------------------------------------------------------

create table if not exists public.ad_campaigns (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name        text not null,
  source      text,                              -- 'instagram','facebook','google','tiktok','flyer','referral','other'
  spend       numeric(12,2) not null default 0,  -- in IDR
  started_at  date,
  ended_at    date,
  notes       text,
  created_at  timestamptz not null default now()
);

create index if not exists ad_campaigns_business_idx
  on public.ad_campaigns(business_id, started_at desc);

alter table public.ad_campaigns enable row level security;

drop policy if exists "own ad_campaigns: all" on public.ad_campaigns;
create policy "own ad_campaigns: all"
  on public.ad_campaigns
  for all
  to authenticated
  using (
    business_id in (select id from public.businesses where owner_id = auth.uid())
  )
  with check (
    business_id in (select id from public.businesses where owner_id = auth.uid())
  );

----------------------------------------------------------------------
-- Customer attribution
----------------------------------------------------------------------

alter table public.customers
  add column if not exists campaign_id uuid references public.ad_campaigns(id) on delete set null;

create index if not exists customers_campaign_idx
  on public.customers(campaign_id);
