/**
 * Shared types for market data ingestion services
 */

export interface MarketPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  changePercent?: number;
}

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  relevanceScore?: number;
}

export interface FinancialMetrics {
  ticker: string;
  company_name: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
  peRatio?: number;
  eps?: number;
  dividendYield?: number;
  weekHigh?: number;
  weekLow?: number;
  yearHigh?: number;
  yearLow?: number;
}

export interface MarketDataPayload {
  ticker: string;
  timestamp: string;
  prices: MarketPrice[];
  news: NewsArticle[];
  financials: FinancialMetrics;
  cached?: boolean;
  error?: string;
}

export interface MarketTrendEntry {
  id?: string;
  ticker: string;
  ingestion_date: string;
  market_data: MarketDataPayload;
  data_source:
    | 'alpha-vantage'
    | 'fmp'
    | 'newsapi'
    | 'cache'
    | 'analysis'
    | 'mock'
    | 'mock-market'
    | 'mock-financials'
    | 'mock-news';
  is_cached: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CacheEntry {
  ticker: string;
  data: MarketDataPayload;
  timestamp: string;
  expiry: string;
}

export interface ServiceError extends Error {
  code: 'RATE_LIMIT' | 'INVALID_API_KEY' | 'NETWORK_ERROR' | 'PARSE_ERROR' | 'NOT_FOUND';
  details?: Record<string, any>;
}
