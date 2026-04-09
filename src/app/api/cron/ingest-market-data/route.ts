/**
 * Scheduled Cron Job for Daily Market Data Ingestion
 * 
 * Runs every day at 12:00 AM UTC
 * Fetches latest market data and stores in MarketTrend table
 * 
 * URL: /api/cron/ingest-market-data
 * Schedule: 0 0 * * * (midnight UTC)
 */

import { NextRequest, NextResponse } from 'next/server';

// Vercel Cron functions require Authorization header
const CRON_SECRET = process.env.CRON_SECRET;

const DEFAULT_TICKERS = [
  'NGSE:MTN', // MTN Nigeria
  'AAPL', // Apple
  'GOOGL', // Google
  'MSFT', // Microsoft
];

/**
 * Cron job handler - triggered by Vercel Cron
 */
export async function GET(request: NextRequest) {
  try {
    if (!CRON_SECRET) {
      console.error('[CronJob] CRON_SECRET is not configured');
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    // Verify authorization header (security measure)
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      console.warn('[CronJob] Unauthorized cron request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[CronJob] Starting scheduled market data ingestion...');
    const startTime = Date.now();

    // Get tickers from environment or use defaults
    const tickers = (process.env.MARKET_DATA_TICKERS || DEFAULT_TICKERS.join(',')).split(',');

    const results: Record<string, any> = {
      timestamp: new Date().toISOString(),
      tickers_processed: 0,
      successful: 0,
      failed: 0,
      details: [] as any[],
    };

    // Process each ticker
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    for (const ticker of tickers) {
      try {
        console.log(`[CronJob] Ingesting data for ${ticker}...`);

        // Call the unified ingest endpoint
        const ingestUrl = new URL('/api/ingest/all', baseUrl);
        ingestUrl.searchParams.set('ticker', ticker.trim());

        const ingestResponse = await fetch(ingestUrl.toString(), {
          method: 'GET',
          headers: {
            'User-Agent': 'AURA-Cron-Job/1.0',
            'X-Cron-Request': 'true',
          },
        });

        if (!ingestResponse.ok) {
          throw new Error(`HTTP ${ingestResponse.status}`);
        }

        const ingestData = await ingestResponse.json();

        results.details.push({
          ticker: ticker.trim(),
          success: ingestData.success,
          cached: ingestData.data?.cached || false,
          dataSource: ingestData.data?.dataSource || [],
          error: ingestData.error?.message,
        });

        if (ingestData.success) {
          results.successful++;
        } else {
          results.failed++;
        }

        results.tickers_processed++;
      } catch (tickerError) {
        const err = tickerError as Error;
        console.error(`[CronJob] Error processing ${ticker}: ${err.message}`);

        results.details.push({
          ticker: ticker.trim(),
          success: false,
          error: err.message,
        });

        results.failed++;
        results.tickers_processed++;
      }
    }

    const duration = Date.now() - startTime;
    results.duration_ms = duration;

    console.log(`[CronJob] Completed in ${duration}ms. Summary:`, results);

    return NextResponse.json(
      {
        success: results.failed === 0,
        message: `Market data ingestion completed. Processed: ${results.tickers_processed}, Successful: ${results.successful}, Failed: ${results.failed}`,
        ...results,
      },
      { status: 200 }
    );
  } catch (error) {
    const err = error as Error;
    console.error(`[CronJob] Cron job error: ${err.message}`);

    return NextResponse.json(
      {
        success: false,
        error: err.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
