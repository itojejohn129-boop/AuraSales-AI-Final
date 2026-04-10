-- Migration: Create MarketTrend table for storing ingested market data
-- Created: 2026-02-15

-- Create MarketTrend table
create table if not exists market_trends (
  id uuid default gen_random_uuid() primary key,
  ticker varchar(20) not null,
  ingestion_date timestamp with time zone not null default now(),
  market_data jsonb not null,
  data_source varchar(50) not null check (data_source in ('alpha-vantage', 'fmp', 'newsapi', 'cache')),
  is_cached boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add indexes for faster querying
create index if not exists idx_market_trends_ticker on market_trends (ticker);
create index if not exists idx_market_trends_ingestion_date on market_trends (ingestion_date desc);
create index if not exists idx_market_trends_ticker_date on market_trends (ticker, ingestion_date desc);

-- Add comment
comment on table market_trends is 'Stores ingested market data from multiple sources with daily price, news, and financial metrics';
comment on column market_trends.ticker is 'Stock ticker symbol (e.g., NGSE:MTN, AAPL)';
comment on column market_trends.ingestion_date is 'Date when market data was ingested';
comment on column market_trends.market_data is 'Complete market data payload including prices, news, and financials';
comment on column market_trends.data_source is 'Primary data source used to gather this information';
comment on column market_trends.is_cached is 'Whether this data was retrieved from cache due to API failure';

-- Optional: Create a view for the latest market data
create or replace view latest_market_trends as
select distinct on (ticker)
  ticker,
  ingestion_date,
  market_data,
  data_source,
  is_cached,
  created_at
from market_trends
order by ticker, ingestion_date desc;

comment on view latest_market_trends is 'View showing the latest market data for each ticker';
