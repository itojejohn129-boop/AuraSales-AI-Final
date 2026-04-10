/**
 * Market Data Fetcher Service
 * Fetches stock prices and daily market data using Alpha Vantage API
 */

import { MarketPrice, ServiceError } from './types';

const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

interface AlphaVantageResponse {
  'Meta Data'?: Record<string, string>;
  'Time Series (Daily)'?: Record<string, Record<string, string>>;
  'Global Quote'?: Record<string, string>;
  Note?: string;
  Information?: string;
  Error?: string;
}

export class MarketFetcher {
  private static normalizeTickerSymbol(ticker: string): string {
    const raw = String(ticker || "").trim().toUpperCase();
    const symbol = raw.includes(":") ? raw.split(":").pop() || raw : raw;
    // Compatibility alias for existing app defaults
    if (symbol === "MTN") return "MTNN";
    return symbol;
  }

  private static getApiKey(): string {
    return (process.env.ALPHA_VANTAGE_KEY || '').trim();
  }

  static isMockPrices(prices: MarketPrice[]): boolean {
    return prices.length > 0 && prices.every((p) => p.volume === 0);
  }

  private static createMockPrices(ticker: string, days: number): MarketPrice[] {
    const today = new Date();
    const safeDays = Math.max(5, Math.min(days, 120));
    const prices: MarketPrice[] = [];
    let lastClose = 100 + Math.abs(ticker.length * 3);

    for (let i = 0; i < safeDays; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const drift = Math.sin(i / 4) * 1.2;
      const close = Math.max(1, parseFloat((lastClose + drift).toFixed(2)));
      const open = parseFloat((close * 0.995).toFixed(2));
      const high = parseFloat((close * 1.01).toFixed(2));
      const low = parseFloat((close * 0.99).toFixed(2));
      const prevClose = i === 0 ? close : prices[i - 1].close;
      const changePercent = parseFloat((((close - prevClose) / prevClose) * 100).toFixed(2));

      prices.push({
        date: d.toISOString().split('T')[0],
        open,
        high,
        low,
        close,
        volume: 0, // 0 marks demo/mock series
        changePercent,
      });

      lastClose = close;
    }

    return prices;
  }

  private static createMockQuote(ticker: string) {
    const seed = 90 + ticker.length * 2;
    return {
      price: seed,
      change: 0.8,
      changePercent: 0.9,
      timestamp: new Date().toISOString(),
    };
  }

  private static async createQuoteBackedPrices(
    ticker: string,
    days: number
  ): Promise<MarketPrice[]> {
    const quote = await this.fetchCurrentQuote(ticker);
    const basePrice = Number(quote.price || 0);

    if (!Number.isFinite(basePrice) || basePrice <= 0) {
      return this.createMockPrices(ticker, days);
    }

    const today = new Date();
    const safeDays = Math.max(5, Math.min(days, 120));
    const prices: MarketPrice[] = [];

    for (let i = 0; i < safeDays; i += 1) {
      const d = new Date(today);
      d.setDate(today.getDate() - (safeDays - i));

      const drift = Math.sin(i / 4) * 0.015;
      const trend = (i / Math.max(1, safeDays - 1)) * 0.04;
      const close = Math.max(0.01, Number((basePrice * (1 + drift + trend)).toFixed(2)));
      const open = Number((close * 0.995).toFixed(2));
      const high = Number((close * 1.01).toFixed(2));
      const low = Number((close * 0.99).toFixed(2));
      const prevClose = i === 0 ? close : prices[i - 1].close;
      const changePercent = prevClose > 0 ? Number((((close - prevClose) / prevClose) * 100).toFixed(2)) : 0;

      prices.push({
        date: d.toISOString().split('T')[0],
        open,
        high,
        low,
        close,
        volume: 1000000,
        changePercent,
      });
    }

    return prices;
  }

  /**
   * Fetch the last 100 days of daily prices for a given ticker
   */
  static async fetchDailyPrices(ticker: string, days: number = 100): Promise<MarketPrice[]> {
    const apiKey = this.getApiKey();
    const providerTicker = this.normalizeTickerSymbol(ticker);
    if (!apiKey) {
      console.warn('[MarketFetcher] ALPHA_VANTAGE_KEY missing, using mock price data');
      return this.createMockPrices(ticker, days);
    }

    try {
      // Fetch daily time series (outputsize=full gets past 100 days)
      const url = new URL(ALPHA_VANTAGE_BASE_URL);
      url.searchParams.append('function', 'TIME_SERIES_DAILY');
      url.searchParams.append('symbol', providerTicker);
      url.searchParams.append('outputsize', 'full');
      url.searchParams.append('apikey', apiKey);

      console.log(`[MarketFetcher] Fetching prices for ${ticker} (provider symbol: ${providerTicker})...`);
      
      const response = await fetch(url.toString(), {
        headers: { 'User-Agent': 'AURA-Sales-AI/1.0' },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.warn('[MarketFetcher] Invalid Alpha Vantage key, using quote-backed price data');
          return this.createQuoteBackedPrices(providerTicker, days);
        }
        throw this.createError('NETWORK_ERROR', `HTTP ${response.status}`);
      }

      const data: AlphaVantageResponse = await response.json();

      // Check for API errors
      if (data.Error) {
        throw this.createError('PARSE_ERROR', data.Error);
      }

      if (data.Note) {
        throw this.createError('RATE_LIMIT', data.Note);
      }

      if (data.Information) {
        if (data.Information.toLowerCase().includes('api key')) {
          console.warn('[MarketFetcher] Alpha Vantage key rejected, using quote-backed price data');
          return this.createQuoteBackedPrices(providerTicker, days);
        }
        throw this.createError('RATE_LIMIT', data.Information);
      }

      if (!data['Time Series (Daily)']) {
        console.warn('[MarketFetcher] No time series data, using quote-backed price data');
        return this.createQuoteBackedPrices(providerTicker, days);
      }

      // Convert API response to MarketPrice array
      const timeSeries = data['Time Series (Daily)'];
      const prices: MarketPrice[] = Object.entries(timeSeries)
        .slice(0, days) // Get only the first N days
        .map(([date, values]) => {
          const v = values as Record<string, string>;
          const prevDate = Object.keys(timeSeries)[Object.keys(timeSeries).indexOf(date) + 1];
          const prevClose = prevDate ? parseFloat(timeSeries[prevDate]['4. close']) : parseFloat(v['4. close']);
          const changePercent = ((parseFloat(v['4. close']) - prevClose) / prevClose) * 100;

          return {
            date,
            open: parseFloat(v['1. open']),
            high: parseFloat(v['2. high']),
            low: parseFloat(v['3. low']),
            close: parseFloat(v['4. close']),
            volume: parseInt(v['5. volume'], 10),
            changePercent: parseFloat(changePercent.toFixed(2)),
          };
        });

      console.log(`[MarketFetcher] Successfully fetched ${prices.length} days of data for ${ticker}`);
      return prices;
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw this.createError('NETWORK_ERROR', `Failed to fetch market data: ${error}`);
    }
  }

  /**
   * Fetch current quote for a ticker
   */
  static async fetchCurrentQuote(ticker: string): Promise<{
    price: number;
    change: number;
    changePercent: number;
    timestamp: string;
  }> {
    const apiKey = this.getApiKey();
    const providerTicker = this.normalizeTickerSymbol(ticker);
    if (!apiKey) {
      console.warn('[MarketFetcher] ALPHA_VANTAGE_KEY missing, using mock quote');
      return this.createMockQuote(ticker);
    }

    try {
      const url = new URL(ALPHA_VANTAGE_BASE_URL);
      url.searchParams.append('function', 'GLOBAL_QUOTE');
      url.searchParams.append('symbol', providerTicker);
      url.searchParams.append('apikey', apiKey);

      const response = await fetch(url.toString(), {
        headers: { 'User-Agent': 'AURA-Sales-AI/1.0' },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.warn('[MarketFetcher] Invalid Alpha Vantage key, using mock quote');
          return this.createMockQuote(ticker);
        }
        throw this.createError('NETWORK_ERROR', `HTTP ${response.status}`);
      }

      const data: AlphaVantageResponse = await response.json();

      if (!data['Global Quote'] || Object.keys(data['Global Quote']).length === 0) {
        console.warn(`[MarketFetcher] No quote found for ${ticker}, using mock quote`);
        return this.createMockQuote(ticker);
      }

      const quote = data['Global Quote'];
      const price = Number(quote['05. price'] || 0);
      const change = Number(quote['09. change'] || 0);
      const changePercentRaw = String(quote['10. change percent'] || '0').replace('%', '');
      return {
        price,
        change,
        changePercent: Number(changePercentRaw),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw this.createError('NETWORK_ERROR', `Failed to fetch current quote: ${error}`);
    }
  }

  private static createError(code: ServiceError['code'], message: string): ServiceError {
    const error = new Error(message) as ServiceError;
    error.code = code;
    error.name = `MarketFetcherError[${code}]`;
    return error;
  }
}
