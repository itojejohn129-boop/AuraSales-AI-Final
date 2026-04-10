/**
 * Market Data Analysis & Correlation Route
 * 
 * Fetches market data and analyzes correlations with internal sales data.
 * Generates recommendations and auto tasks.
 * 
 * GET /api/analyze/market-correlation?ticker=NGSE:MTN
 */

import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { DataCorrelationEngine } from '@/lib/services/correlation';
import { MarketFetcher } from '@/lib/services/market';
import { FinancialsFetcher } from '@/lib/services/financials';
import { NewsFetcher } from '@/lib/services/news';
import { CacheService } from '@/lib/services/cache';
import { MarketDataPayload } from '@/lib/services/types';
import { createAdminClient } from '@/utils/supabase/admin';
import { summarizeCSVData } from '@/lib/csvSummarizer';
import type { SalesDataSnapshot } from '@/lib/services/correlation';

function parseUploadedRows(csvContent?: string | null): Record<string, unknown>[] {
  if (!csvContent || !csvContent.trim()) return [];

  const raw = csvContent.trim();

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((row) => row && typeof row === 'object') as Record<string, unknown>[];
    }
    if (parsed && typeof parsed === 'object') {
      const record = parsed as Record<string, unknown>;
      if (Array.isArray(record.rows)) {
        return record.rows.filter((row) => row && typeof row === 'object') as Record<string, unknown>[];
      }
      if (Array.isArray(record.data)) {
        return record.data.filter((row) => row && typeof row === 'object') as Record<string, unknown>[];
      }
      if (Array.isArray(record.batch)) {
        return record.batch.filter((row) => row && typeof row === 'object') as Record<string, unknown>[];
      }
    }
  } catch {
    // Fall back to CSV parsing below.
  }

  const parsed = Papa.parse<Record<string, unknown>>(raw, {
    header: true,
    skipEmptyLines: true,
  });

  return Array.isArray(parsed.data)
    ? parsed.data.filter((row) => row && Object.keys(row).some((key) => String(row[key] || '').trim().length > 0))
    : [];
}

function buildSalesSnapshotFromUploadedContent(csvContent?: string | null): SalesDataSnapshot | null {
  const rows = parseUploadedRows(csvContent);
  if (rows.length === 0) return null;

  const summary = summarizeCSVData(rows);
  const deliveryCosts = Math.round(summary.totalRevenue * 0.08);
  const costOfGoods = Math.round(summary.totalRevenue * 0.6);
  const trend =
    summary.trend.percentChange > 0
      ? 'increasing'
      : summary.trend.percentChange < 0
        ? 'decreasing'
        : 'stable';

  return {
    period: 'Uploaded dataset',
    totalSales: summary.totalRevenue,
    costOfGoods,
    deliveryCosts,
    deliveryCostPercentage: summary.totalRevenue > 0 ? Number(((deliveryCosts / summary.totalRevenue) * 100).toFixed(1)) : 0,
    costTrend: trend,
    urgencyIndicators: [
      `Rows analyzed: ${summary.recordCount}`,
      `Top product: ${summary.topProducts[0]?.name || 'N/A'}`,
      `Top region: ${summary.topRegions[0]?.name || 'N/A'}`,
      `Trend: ${summary.trend.description}`,
    ],
  };
}

/**
 * Analyze market data and correlate with internal metrics
 */
export async function GET(request: NextRequest) {
  return analyzeMarketCorrelation(request.nextUrl.searchParams.get('ticker') || 'NGSE:MTNN', request.nextUrl.searchParams.get('includeSalesData') === 'true');
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const ticker = typeof body.ticker === 'string' && body.ticker.trim() ? body.ticker.trim() : 'NGSE:MTNN';
    const includeSalesData = body.includeSalesData !== false;
    const csvContent = typeof body.csvContent === 'string' ? body.csvContent : '';

    return await analyzeMarketCorrelation(ticker, includeSalesData, csvContent);
  } catch (error) {
    const err = error as Error;
    console.error('[AnalysisRoute] Error:', err.message);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ANALYSIS_ERROR',
          message: err.message,
        },
      },
      { status: 500 }
    );
  }
}

async function analyzeMarketCorrelation(ticker: string, includeSalesData: boolean, csvContent = '') {
  try {
    console.log(`[AnalysisRoute] Analyzing correlations for ${ticker}...`);

    // Check cache first
    const cachedData = await CacheService.get(ticker);
    let marketData: MarketDataPayload | null = cachedData || null;
    const dataSources: string[] = [];

    if (!marketData) {
      // Fetch fresh data
      try {
        const [prices, financials, news] = await Promise.allSettled([
          MarketFetcher.fetchDailyPrices(ticker, 100),
          FinancialsFetcher.fetchFinancialMetrics(ticker),
          NewsFetcher.fetchNewsForTicker(ticker, 5),
        ]);

        const marketPrices =
          prices.status === 'fulfilled' && prices.value.length > 0 ? prices.value : [];
        const financialMetrics =
          financials.status === 'fulfilled'
            ? financials.value
            : { ticker, company_name: `${ticker} (Demo)` };
        const newsArticles = news.status === 'fulfilled' ? news.value : [];

        const usingMockMarket = MarketFetcher.isMockPrices(marketPrices);
        const usingMockFinancials = FinancialsFetcher.isMockMetrics(financialMetrics);
        const usingMockNews = NewsFetcher.isMockNews(newsArticles);
        const demoMode = usingMockMarket || usingMockFinancials || usingMockNews;

        if (marketPrices.length > 0) {
          dataSources.push(usingMockMarket ? 'mock-market' : 'alpha-vantage');
        }
        if (financialMetrics && Object.keys(financialMetrics).length > 1) {
          dataSources.push(usingMockFinancials ? 'mock-financials' : 'fmp');
        }
        if (newsArticles.length > 0) {
          dataSources.push(usingMockNews ? 'mock-news' : 'newsapi');
        }
        if (demoMode && !dataSources.includes('mock')) {
          dataSources.push('mock');
        }

        marketData = {
          ticker,
          timestamp: new Date().toISOString(),
          prices: marketPrices,
          news: newsArticles,
          financials: financialMetrics,
          cached: demoMode,
        };

        // Cache the data
        await CacheService.set(ticker, marketData);
      } catch (error) {
        console.error('[AnalysisRoute] Error fetching market data:', error);

        // Try using cache
        const cachedFallback = await CacheService.get(ticker);
        if (cachedFallback) {
          marketData = cachedFallback;
          console.log('[AnalysisRoute] Using cached fallback data');
          return NextResponse.json(
            {
              success: true,
              analysis: {
                ...generateErrorAnalysis(ticker),
                dataSource: ['cache'],
              },
              warning: 'Using cached data due to API failure',
            },
            { status: 200 }
          );
        }

        throw error;
      }
    }

    // Fetch sales data if requested (mock data for now)
    let salesData = undefined;
    if (includeSalesData) {
      salesData =
        buildSalesSnapshotFromUploadedContent(csvContent) ||
        {
          period: `${new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}`,
          totalSales: 1250000,
          costOfGoods: 750000,
          deliveryCosts: 120000,
          deliveryCostPercentage: 9.6,
          costTrend: 'increasing' as const,
          urgencyIndicators: ['Delivery costs up 12%', 'Fuel surcharge added'],
        };
      if (csvContent.trim()) {
        dataSources.push('csv-upload');
      }
    }

    // Perform correlation analysis
    const analysis = await DataCorrelationEngine.analyzeCorrelations(marketData, salesData);
    const demoMode =
      !csvContent.trim() &&
      (MarketFetcher.isMockPrices(marketData.prices || []) ||
      FinancialsFetcher.isMockMetrics(
        marketData.financials || { ticker, company_name: ticker }
      ) ||
      NewsFetcher.isMockNews(marketData.news || []));

    const salesSnapshotNote = salesData && csvContent.trim()
      ? ` Uploaded dataset analyzed: ${salesData.period}, total sales $${salesData.totalSales.toLocaleString('en-US')}, delivery cost ${salesData.deliveryCostPercentage.toFixed(1)}%, trend ${salesData.costTrend}.`
      : '';

    // Save analysis to database
    try {
      const supabase = await createAdminClient();
      await supabase.from('market_trends').insert({
        ticker,
        ingestion_date: new Date().toISOString(),
        market_data: marketData,
        data_source: dataSources.length > 0 ? dataSources[0] : (demoMode ? 'mock' : 'analysis'),
        is_cached: demoMode,
      });
    } catch (dbErr) {
      console.warn('[AnalysisRoute] Database save failed:', (dbErr as Error).message);
    }

    return NextResponse.json(
      {
        success: true,
        analysis: {
          ...analysis,
          summaryText: `${analysis.summaryText}${salesSnapshotNote}`,
          dataSource: dataSources.length > 0 ? dataSources : ['cache'],
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
    console.error('[AnalysisRoute] Error:', err.message);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ANALYSIS_ERROR',
          message: err.message,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Generate error analysis with empty correlations
 */
function generateErrorAnalysis(ticker: string) {
  return {
    ticker,
    timestamp: new Date().toISOString(),
    correlations: [],
    recommendations: [
      {
        id: 'rec-1',
        title: 'Live Data Offline - Using Cached Data',
        description:
          'The system is currently unable to fetch live market data. Showing previous analysis.',
        actionItems: ['Check API connectivity', 'Verify API keys are configured'],
        estimatedImpact: 'Restore live market insights',
        priority: 'high',
        relatedCorrelations: [],
      },
    ],
    autoGeneratedTasks: [],
    riskLevel: 'medium',
    summaryText:
      'Live data ingestion is temporarily offline. Previous cached analysis shown. System will resume automatic updates when connectivity is restored.',
  };
}
