-- Migration: user credits tracking + market_trends source expansion
-- Created: 2026-02-19 (Updated with Fix for last_counted_sign_in_at)

create table if not exists public.user_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'enterprise')),
  credits_used integer not null default 0 check (credits_used >= 0),
  credits_limit integer check (credits_limit is null or credits_limit >= 0),
  last_counted_sign_in_at timestamptz, 
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_credits is 'Tracks per-user AI credit usage and subscription plan state';
comment on column public.user_credits.last_counted_sign_in_at is 'Prevents double-charging credits on page refresh';

-- Indicies for performance
create index if not exists idx_user_credits_plan on public.user_credits(plan);
create index if not exists idx_user_credits_email on public.user_credits(email);

-- Market Trends Constraint Update (Enables your "Demo Mode" to work without errors)
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'market_trends_data_source_check'
      and conrelid = 'public.market_trends'::regclass
  ) then
    alter table public.market_trends drop constraint market_trends_data_source_check;
  end if;
end $$;

alter table public.market_trends
  add constraint market_trends_data_source_check
  check (
    data_source in (
      'alpha-vantage', 'fmp', 'newsapi', 'cache', 
      'analysis', 'mock', 'mock-market', 
      'mock-financials', 'mock-news'
    )
  );