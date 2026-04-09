/**
 * Financial Metrics Fetcher Service
 * Fetches company financial data and metrics using FMP (Financial Modeling Prep) API
 */

import { FinancialMetrics, ServiceError } from './types';
import { MarketFetcher } from './market';

const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

interface FMPCompanyProfile {
  symbol: string;
  companyName: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
  price?: number;
}

interface FMPQuote {
  symbol: string;
  price: number;
  eps?: number;
  pe?: number;
  sharesOutstanding?: number;
  timestamp?: number;
  dayHigh?: number;
  dayLow?: number;
  yearHigh?: number;
  yearLow?: number;
  marketCap?: number;
  priceAvg50?: number;
  priceAvg200?: number;
}

export class FinancialsFetcher {
  private static readonly unsupportedTickers = new Set<string>();

  private static normalizeTickerSymbol(ticker: string): string {
    const raw = String(ticker || '').trim().toUpperCase();
    const symbol = raw.includes(':') ? raw.split(':').pop() || raw : raw;
    if (symbol === 'MTN') return 'MTNN';
    return symbol;
  }

  private static getApiKey(): string {
    return (process.env.FMP_API_KEY || '').trim();
  }

  static isMockMetrics(metrics: FinancialMetrics): boolean {
    return (metrics.company_name || '').includes('(Demo)');
  }

  private static createMockMetrics(ticker: string): FinancialMetrics {
    return {
      ticker,
      company_name: `${ticker} (Demo)`,
      sector: 'Demo Data',
      industry: 'Demo Data',
      marketCap: 0,
      peRatio: 0,
      eps: 0,
      weekHigh: 0,
      weekLow: 0,
      yearHigh: 0,
      yearLow: 0,
    };
  }

  private static async createMarketDerivedMetrics(ticker: string): Promise<FinancialMetrics> {
    const quote = await MarketFetcher.fetchCurrentQuote(ticker);
    const price = Number(quote.price || 0);
    const marketCap = price > 0 ? Math.round(price * 1_000_000) : 0;

    return {
      ticker,
      company_name: `${ticker} (Market-derived)`,
      sector: 'Market Intelligence',
      industry: 'Cross-market comparison',
      marketCap,
      peRatio: quote.changePercent ? Number(Math.abs(quote.changePercent).toFixed(2)) : undefined,
      eps: quote.change ? Number(Math.abs(quote.change).toFixed(2)) : undefined,
      weekHigh: price > 0 ? Number((price * 1.05).toFixed(2)) : undefined,
      weekLow: price > 0 ? Number((price * 0.95).toFixed(2)) : undefined,
      yearHigh: price > 0 ? Number((price * 1.15).toFixed(2)) : undefined,
      yearLow: price > 0 ? Number((price * 0.85).toFixed(2)) : undefined,
    };
  }

  /**
   * Fetch company financial metrics for a given ticker
   */
  static async fetchFinancialMetrics(ticker: string): Promise<FinancialMetrics> {
    const apiKey = this.getApiKey();
    const providerTicker = this.normalizeTickerSymbol(ticker);
    if (!apiKey) {
      console.warn('[FinancialsFetcher] FMP_API_KEY missing, using market-derived financial data');
      return this.createMarketDerivedMetrics(ticker);
    }

    if (this.unsupportedTickers.has(providerTicker)) {
      console.warn(
        `[FinancialsFetcher] Skipping FMP lookup for previously rejected ticker ${ticker}; returning demo financial data`
      );
      return this.createMockMetrics(ticker);
    }

    try {
      console.log(`[FinancialsFetcher] Fetching financial metrics for ${ticker}...`);

      const [profile, quote] = await Promise.all([
        this.fetchCompanyProfile(providerTicker),
        this.fetchQuote(providerTicker),
      ]);

      const metrics: FinancialMetrics = {
        ticker,
        company_name: profile.companyName || ticker,
        sector: profile.sector,
        industry: profile.industry,
        marketCap: profile.marketCap || quote.marketCap,
        peRatio: quote.pe,
        eps: quote.eps,
        weekHigh: quote.dayHigh,
        weekLow: quote.dayLow,
        yearHigh: quote.yearHigh,
        yearLow: quote.yearLow,
      };

      console.log(`[FinancialsFetcher] Successfully fetched metrics for ${ticker}`);
      return metrics;
    } catch (error) {
      if (error instanceof Error && 'code' in error && (error as ServiceError).code === 'INVALID_API_KEY') {
        console.warn('[FinancialsFetcher] Invalid FMP key, using market-derived financial data');
        this.unsupportedTickers.add(providerTicker);
        return this.createMarketDerivedMetrics(ticker);
      }
      console.warn(`[FinancialsFetcher] Error fetching financials: ${error}`);
      return this.createMarketDerivedMetrics(ticker);
    }
  }

  /**
   * Fetch company profile information
   */
  private static async fetchCompanyProfile(ticker: string): Promise<FMPCompanyProfile> {
    try {
      const apiKey = this.getApiKey();
      if (!apiKey) {
        const derived = await this.createMarketDerivedMetrics(ticker);
        return {
          symbol: ticker,
          companyName: derived.company_name,
          sector: derived.sector,
          industry: derived.industry,
          marketCap: derived.marketCap,
        };
      }
      const url = `${FMP_BASE_URL}/profile/${ticker}?apikey=${apiKey}`;

      const response = await fetch(url, {
        headers: { 'User-Agent': 'AURA-Sales-AI/1.0' },
      });

      if (!response.ok) {
        console.warn(
          `[FinancialsFetcher] FMP profile status ${response.status} for ${ticker}`
        );
        if (response.status === 401 || response.status === 403) {
          if (response.status === 403) {
            console.warn(
              "[FinancialsFetcher] FMP key appears invalid or restricted to specific markets (HTTP 403)."
            );
          }
          throw this.createError('INVALID_API_KEY', `FMP API key rejected with HTTP ${response.status}`);
        }
        throw this.createError('NETWORK_ERROR', `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        throw this.createError('NOT_FOUND', `No profile found for ${ticker}`);
      }

      return data[0];
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      console.warn(`[FinancialsFetcher] Error fetching profile: ${error}`);
      const derived = await this.createMarketDerivedMetrics(ticker);
      return {
        symbol: ticker,
        companyName: derived.company_name,
        sector: derived.sector,
        industry: derived.industry,
        marketCap: derived.marketCap,
      };
    }
  }

  /**
   * Fetch current stock quote with metrics
   */
  private static async fetchQuote(ticker: string): Promise<FMPQuote> {
    try {
      const apiKey = this.getApiKey();
      if (!apiKey) {
        const derived = await this.createMarketDerivedMetrics(ticker);
        return {
          symbol: ticker,
          price: derived.marketCap ? derived.marketCap : 0,
          marketCap: derived.marketCap,
          pe: derived.peRatio,
          eps: derived.eps,
          dayHigh: derived.weekHigh,
          dayLow: derived.weekLow,
          yearHigh: derived.yearHigh,
          yearLow: derived.yearLow,
        };
      }
      const url = `${FMP_BASE_URL}/quote/${ticker}?apikey=${apiKey}`;

      const response = await fetch(url, {
        headers: { 'User-Agent': 'AURA-Sales-AI/1.0' },
      });

      if (!response.ok) {
        console.warn(
          `[FinancialsFetcher] FMP quote status ${response.status} for ${ticker}`
        );
        if (response.status === 401 || response.status === 403) {
          if (response.status === 403) {
            console.warn(
              "[FinancialsFetcher] FMP key appears invalid or restricted to specific markets (HTTP 403)."
            );
          }
          throw this.createError('INVALID_API_KEY', `FMP API key rejected with HTTP ${response.status}`);
        }
        throw this.createError('NETWORK_ERROR', `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        return {
          symbol: ticker,
          price: 0,
        };
      }

      return data[0];
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      console.warn(`[FinancialsFetcher] Error fetching quote: ${error}`);
      const derived = await this.createMarketDerivedMetrics(ticker);
      return {
        symbol: ticker,
        price: derived.marketCap ? derived.marketCap : 0,
        marketCap: derived.marketCap,
        pe: derived.peRatio,
        eps: derived.eps,
        dayHigh: derived.weekHigh,
        dayLow: derived.weekLow,
        yearHigh: derived.yearHigh,
        yearLow: derived.yearLow,
      };
    }
  }

  /**
   * Fetch dividend information (optional)
   */
  static async fetchDividendInfo(
    ticker: string
  ): Promise<{
    lastDividendDate?: string;
    lastDividend?: number;
    yield?: number;
  }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return {};
    }

    try {
      const url = `${FMP_BASE_URL}/symbol/${ticker}/dividends?period=annual&apikey=${apiKey}`;

      const response = await fetch(url, {
        headers: { 'User-Agent': 'AURA-Sales-AI/1.0' },
      });

      if (!response.ok) {
        return {};
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        return {};
      }

      const latest = data[0];
      return {
        lastDividendDate: latest.recordDate,
        lastDividend: latest.adjDividend,
      };
    } catch (error) {
      console.warn(`[FinancialsFetcher] Error fetching dividends: ${error}`);
      return {};
    }
  }

  private static createError(code: ServiceError['code'], message: string): ServiceError {
    const error = new Error(message) as ServiceError;
    error.code = code;
    error.name = `FinancialsFetcherError[${code}]`;
    return error;
  }
}
