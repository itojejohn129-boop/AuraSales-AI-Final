/**
 * Unified Market Data Ingestion Route
 * 
 * Fetches market prices, financial metrics, and news for a ticker.
 * Sends the combined "Master Context" to DeepSeek-R1 for analysis.
 * Stores results in the MarketTrend table.
 * 
 * GET /api/ingest/all?ticker=NGSE:MTN
 */

import { NextRequest, NextResponse } from 'next/server';
import { MarketFetcher } from '@/lib/services/market';
import { FinancialsFetcher } from '@/lib/services/financials';
import { NewsFetcher } from '@/lib/services/news';
import { CacheService } from '@/lib/services/cache';
import { MarketDataPayload, ServiceError } from '@/lib/services/types';
import { createAdminClient } from '@/utils/supabase/admin';

interface IngestRequest {
  ticker: string;
  days?: number;
  newsLimit?: number;
  useCache?: boolean;
}

interface IngestResponse {
  success: boolean;
  data?: {
    ticker: string;
    timestamp: string;
    masterContext: any;
    deepseekAnalysis?: string;
    cached: boolean;
    dataSource: string[];
    demoMode?: boolean;
  };
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  warning?: string;
}

const inFlightIngestionByTicker = new Map<string, Promise<NextResponse>>();

/**
 * Core ingestion logic (wrapped by GET with in-flight dedupe)
 */
async function runIngestion(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request parameters
    const searchParams = request.nextUrl.searchParams;
    const ticker = searchParams.get('ticker') || 'NGSE:MTNN';
    const days = parseInt(searchParams.get('days') || '100', 10);
    const newsLimit = parseInt(searchParams.get('newsLimit') || '5', 10);
    const useCache = searchParams.get('useCache') !== 'false';
    const hasFmpApiKey = Boolean(process.env.FMP_API_KEY?.trim());
    const hasAlphaVantageApiKey = Boolean(process.env.ALPHA_VANTAGE_KEY?.trim());
    const canAttemptLiveFetch = hasFmpApiKey && hasAlphaVantageApiKey;

    console.log(`[IngestRoute] Starting ingestion for ${ticker}...`);
    console.log("Using API Key:", process.env.FMP_API_KEY ? "Present" : "Missing");
    console.log(
      `[IngestRoute] ALPHA_VANTAGE_KEY: ${hasAlphaVantageApiKey ? 'Present' : 'Missing'}`
    );

    // Check cache first if enabled
    if (useCache) {
      const cachedData = await CacheService.get(ticker);
      if (cachedData) {
        const cachedDemoMode =
          MarketFetcher.isMockPrices(cachedData.prices || []) ||
          FinancialsFetcher.isMockMetrics(
            cachedData.financials || { ticker, company_name: ticker }
          ) ||
          NewsFetcher.isMockNews(cachedData.news || []);
        const shouldBypassDemoCache = canAttemptLiveFetch && cachedDemoMode;

        if (shouldBypassDemoCache) {
          console.log(
            `[IngestRoute] Cached demo data detected for ${ticker} with keys present. Attempting live fetch before fallback.`
          );
        } else {
          console.log(`[IngestRoute] Using cached data for ${ticker}`);
          return NextResponse.json({
            success: true,
            data: {
              ticker,
              timestamp: new Date().toISOString(),
              masterContext: cachedData,
              cached: true,
              dataSource: cachedDemoMode ? ['cache', 'mock'] : ['cache'],
              demoMode: cachedDemoMode,
            },
          } as IngestResponse);
        }
      }
    }

    // Fetch data from all sources in parallel
    console.log(`[IngestRoute] Fetching data from all sources...`);
    const dataSources: string[] = [];
    let marketData: MarketDataPayload;

    try {
      const [prices, financials, news] = await Promise.allSettled([
        MarketFetcher.fetchDailyPrices(ticker, days),
        FinancialsFetcher.fetchFinancialMetrics(ticker),
        NewsFetcher.fetchNewsForTicker(ticker, newsLimit),
      ]);

      // Handle results - even if some fail, continue with what we have
      const marketPrices =
        prices.status === 'fulfilled' && prices.value.length > 0
          ? prices.value
          : [];
      const financialMetrics =
        financials.status === 'fulfilled'
          ? financials.value
          : {
              ticker,
              company_name: `${ticker} (Demo)`,
            };
      const newsArticles = news.status === 'fulfilled' ? news.value : [];

      const usingMockMarket = MarketFetcher.isMockPrices(marketPrices);
      const usingMockFinancials = FinancialsFetcher.isMockMetrics(financialMetrics);
      const usingMockNews = NewsFetcher.isMockNews(newsArticles);
      const demoMode = usingMockMarket || usingMockFinancials || usingMockNews;

      // Track which sources succeeded
      if (marketPrices.length > 0) dataSources.push(usingMockMarket ? 'mock-market' : 'alpha-vantage');
      if (financialMetrics && Object.keys(financialMetrics).length > 1) {
        dataSources.push(usingMockFinancials ? 'mock-financials' : 'fmp');
      }
      if (newsArticles.length > 0) dataSources.push(usingMockNews ? 'mock-news' : 'newsapi');
      if (demoMode && !dataSources.includes('mock')) {
        dataSources.push('mock');
      }

      // Create master context payload
      marketData = {
        ticker,
        timestamp: new Date().toISOString(),
        prices: marketPrices,
        news: newsArticles,
        financials: financialMetrics,
        cached: demoMode,
      };
    } catch (error) {
      const err = error as ServiceError;
      console.error(`[IngestRoute] Error fetching data: ${err.code} - ${err.message}`);

      // Try to use cache as fallback
      const cachedData = await CacheService.get(ticker);
      if (cachedData) {
        console.warn(`[IngestRoute] Using cached data as fallback...`);
        const cachedDemoMode =
          MarketFetcher.isMockPrices(cachedData.prices || []) ||
          FinancialsFetcher.isMockMetrics(
            cachedData.financials || { ticker, company_name: ticker }
          ) ||
          NewsFetcher.isMockNews(cachedData.news || []);
        return NextResponse.json(
          {
            success: true,
            data: {
              ticker,
              timestamp: new Date().toISOString(),
              masterContext: cachedData,
              cached: true,
              dataSource: cachedDemoMode ? ['cache', 'mock'] : ['cache'],
              demoMode: cachedDemoMode,
            },
            warning: `Live data offline - using cached data. Error: ${err.message}`,
          },
          { status: 200 }
        );
      }

      // No cache available, return error
      return NextResponse.json(
        {
          success: false,
          error: {
            code: err.code || 'UNKNOWN_ERROR',
            message: err.message,
            details: `Could not fetch live data and no cache available for ${ticker}`,
          },
        },
        { status: 500 }
      );
    }

    // Cache the successful data
    await CacheService.set(ticker, marketData);
    const demoMode =
      MarketFetcher.isMockPrices(marketData.prices || []) ||
      FinancialsFetcher.isMockMetrics(
        marketData.financials || { ticker, company_name: ticker }
      ) ||
      NewsFetcher.isMockNews(marketData.news || []);

    // Save to database
    try {
      const supabase = await createAdminClient();
      const { error: dbError } = await supabase.from('market_trends').insert({
        ticker,
        ingestion_date: new Date().toISOString(),
        market_data: marketData,
        data_source: dataSources.length > 0 ? dataSources[0] : (demoMode ? 'mock' : 'unknown'),
        is_cached: demoMode,
      });

      if (dbError) {
        console.warn(
          `[IngestRoute] Database save failed: ${dbError.message}`
        );
      }
    } catch (dbErr) {
      console.warn(
        `[IngestRoute] Error saving to database: ${(dbErr as Error).message}`
      );
      // Don't fail the entire request if database write fails
    }

    // Return successful response with master context
    return NextResponse.json(
      {
        success: true,
        data: {
          ticker,
          timestamp: marketData.timestamp,
          masterContext: marketData,
          cached: demoMode,
          dataSource: dataSources,
          demoMode,
        },
        warning: demoMode
          ? 'Demo Mode active: one or more API keys are missing/invalid, using sample market/news data.'
          : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    const err = error as Error;
    console.error(`[IngestRoute] Unexpected error: ${err.message}`);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: err.message,
          details: 'An unexpected error occurred during data ingestion',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Main handler for market data ingestion
 * Dedupes concurrent requests by ticker so only one fetch is executed.
 */
export async function GET(request: NextRequest) {
  const ticker = (request.nextUrl.searchParams.get('ticker') || 'NGSE:MTNN')
    .trim()
    .toUpperCase();

  const existingInFlight = inFlightIngestionByTicker.get(ticker);
  if (existingInFlight) {
    console.log(`[IngestRoute] Awaiting in-flight ingestion for ${ticker}`);
    const sharedResponse = await existingInFlight;
    return sharedResponse.clone();
  }

  const inFlight = runIngestion(request);
  inFlightIngestionByTicker.set(ticker, inFlight);

  try {
    const response = await inFlight;
    return response.clone();
  } finally {
    inFlightIngestionByTicker.delete(ticker);
  }
}

/**
 * POST handler for triggered ingestion with custom parameters
 */
export async function POST(request: NextRequest) {
  try {
    const body: IngestRequest = await request.json();
    const { ticker = 'NGSE:MTNN', days = 100, newsLimit = 5, useCache = true } =
      body;

    // Reuse GET logic by calling it with query parameters
    const url = new URL(request.url);
    url.searchParams.set('ticker', ticker);
    url.searchParams.set('days', days.toString());
    url.searchParams.set('newsLimit', newsLimit.toString());
    url.searchParams.set('useCache', useCache.toString());

    const getRequest = new NextRequest(url, { method: 'GET' });
    return GET(getRequest);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: err.message,
          details: 'Invalid request body',
        },
      },
      { status: 400 }
    );
  }
}
