/**
 * News Fetcher Service
 * Fetches top news articles for a specific ticker using NewsAPI
 */

import { NewsArticle, ServiceError } from './types';

const NEWS_API_BASE_URL = 'https://newsapi.org/v2/everything';

interface NewsAPIArticle {
  title: string;
  description: string;
  url: string;
  source: { name: string };
  publishedAt: string;
  content?: string;
}

interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: NewsAPIArticle[];
  error?: { code: string; message: string };
}

export class NewsFetcher {
  private static getApiKey(): string {
    return (process.env.NEWS_API_KEY || '').trim();
  }

  static isMockNews(articles: NewsArticle[]): boolean {
    return articles.length > 0 && articles.every((a) => a.source === 'Demo News Feed');
  }

  private static getTrackedTickers(): string[] {
    const raw = process.env.MARKET_DATA_TICKERS || '';
    if (!raw.trim()) return [];
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  private static normalizeTicker(ticker: string): string {
    const raw = (ticker || '').trim();
    if (!raw) return raw;
    return raw.includes(':') ? raw.split(':').pop() || raw : raw;
  }

  private static getCompanyTerm(ticker: string): string {
    const symbol = this.normalizeTicker(ticker).toUpperCase();
    const queries: Record<string, string> = {
      MTNN: 'MTN Nigeria',
      ZENITHBANK: 'Zenith Bank',
      GTCO: 'GTCO',
      DANGCEM: 'Dangote Cement',
      AAPL: 'Apple Inc',
      NVDA: 'NVIDIA',
      TSLA: 'Tesla',
      BTC: 'Bitcoin',
      BTCUSD: 'Bitcoin',
      'BTC-USD': 'Bitcoin',
    };

    return queries[symbol] || symbol;
  }

  private static buildTrackedQuery(ticker: string): string {
    const tracked = this.getTrackedTickers().map((t) => this.normalizeTicker(t));
    const primary = this.normalizeTicker(ticker);
    const scoped = Array.from(new Set([primary, ...tracked])).slice(0, 8);
    const terms = scoped.map((symbol) => this.getCompanyTerm(symbol));
    return terms.map((term) => `"${term}"`).join(' OR ');
  }

  private static createMockNews(ticker: string, limit: number): NewsArticle[] {
    const now = new Date();
    const companyTerm = this.getCompanyTerm(ticker);
    return Array.from({ length: Math.max(1, Math.min(limit, 5)) }).map((_, idx) => ({
      id: `demo-${ticker}-${idx}`,
      title: `${companyTerm}: Demo headline ${idx + 1}`,
      description:
        'Demo Mode is enabled because NEWS_API_KEY is missing or invalid. Connect a valid key for live headlines.',
      url: '#',
      source: 'Demo News Feed',
      publishedAt: new Date(now.getTime() - idx * 3600_000).toISOString(),
      relevanceScore: 100 - idx * 5,
    }));
  }

  /**
   * Fetch top news articles for a given ticker
   */
  static async fetchNewsForTicker(ticker: string, limit: number = 5): Promise<NewsArticle[]> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.warn('[NewsFetcher] NEWS_API_KEY missing, using demo headlines');
      return this.createMockNews(ticker, limit);
    }

    try {
      // Scope query to tracked symbols from MARKET_DATA_TICKERS for relevant headlines.
      const searchQuery = this.buildTrackedQuery(ticker);

      const url = new URL(NEWS_API_BASE_URL);
      url.searchParams.append('q', searchQuery);
      url.searchParams.append('sortBy', 'publishedAt');
      url.searchParams.append('language', 'en');
      url.searchParams.append('pageSize', Math.min(limit + 5, 100).toString()); // Get extra to filter
      url.searchParams.append('apiKey', apiKey);

      console.log(`[NewsFetcher] Fetching news for ${ticker}...`);

      const response = await fetch(url.toString(), {
        headers: { 'User-Agent': 'AURA-Sales-AI/1.0' },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.warn('[NewsFetcher] News API key rejected, using demo headlines');
          return this.createMockNews(ticker, limit);
        }
        throw this.createError('NETWORK_ERROR', `HTTP ${response.status}`);
      }

      const data: NewsAPIResponse = await response.json();

      if (data.error) {
        if (data.error.code === 'apiKeyInvalid' || data.error.code === 'apiKeyInvalidOrMissing') {
          console.warn('[NewsFetcher] News API key invalid, using demo headlines');
          return this.createMockNews(ticker, limit);
        }
        if (data.error.code === 'rateLimited') {
          throw this.createError('RATE_LIMIT', data.error.message);
        }
        throw this.createError('PARSE_ERROR', data.error.message);
      }

      if (data.status !== 'ok') {
        throw this.createError('PARSE_ERROR', `NewsAPI returned status: ${data.status}`);
      }

      if (!data.articles || data.articles.length === 0) {
        console.log(`[NewsFetcher] No articles found for ${ticker}`);
        return this.createMockNews(ticker, limit);
      }

      // Convert and filter articles
      const articles: NewsArticle[] = data.articles
        .slice(0, limit)
        .map((article, index) => ({
          id: `${ticker}-${article.publishedAt}-${index}`,
          title: article.title,
          description: article.description || article.content || '',
          url: article.url,
          source: article.source.name,
          publishedAt: article.publishedAt,
          relevanceScore: this.calculateRelevance(article.title, ticker),
        }))
        .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

      console.log(`[NewsFetcher] Successfully fetched ${articles.length} articles for ${ticker}`);
      return articles;
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw this.createError('NETWORK_ERROR', `Failed to fetch news: ${error}`);
    }
  }

  /**
   * Calculate relevance score based on keyword matching
   */
  private static calculateRelevance(title: string, ticker: string): number {
    let score = 0;
    const lowerTitle = title.toLowerCase();
    const companyName = this.getCompanyTerm(ticker).toLowerCase();

    // Exact ticker match
    if (lowerTitle.includes(ticker.toLowerCase())) score += 10;

    // Company name match
    if (lowerTitle.includes(companyName)) score += 5;

    // Sector keywords
    const sectorKeywords = ['stock', 'market', 'trading', 'finance', 'earnings', 'dividend'];
    sectorKeywords.forEach((keyword) => {
      if (lowerTitle.includes(keyword)) score += 2;
    });

    return Math.min(score, 100); // Cap at 100
  }

  private static createError(code: ServiceError['code'], message: string): ServiceError {
    const error = new Error(message) as ServiceError;
    error.code = code;
    error.name = `NewsFetcherError[${code}]`;
    return error;
  }
}
