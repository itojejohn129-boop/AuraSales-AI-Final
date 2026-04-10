/**
 * Market Data Status Component
 * 
 * Shows live data status, cached data warning, and error messaging.
 * Displays when live data ingestion is offline.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useTranslatedTexts } from '@/hooks/useTranslatedTexts';

export interface MarketDataStatus {
  isLive: boolean;
  lastUpdated: string;
  cachedSince: string;
  demoMode?: boolean;
  partialLive?: boolean;
  error?: {
    code: string;
    message: string;
  };
  dataSource: string[];
}

interface MarketDataStatusComponentProps {
  ticker?: string;
  status: MarketDataStatus;
  onRetry?: () => void;
  children?: React.ReactNode;
  targetLanguage?: string;
}

export const MarketDataStatusComponent: React.FC<MarketDataStatusComponentProps> = ({
  ticker = 'NGSE:MTN',
  status,
  onRetry,
  children,
  targetLanguage = 'en',
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [
    translatedDemoMode,
    translatedPartialLive,
    translatedLiveOffline,
    translatedUsingCached,
    translatedDataSources,
    translatedUpdated,
    translatedDemoBody,
    translatedPartialBody,
    translatedOfflineBody,
    translatedCachedBody,
    translatedRetry,
    translatedRetrying,
    translatedLastAttempt,
    translatedLiveFor,
    translatedNoLiveData,
    translatedFallbackBody,
    translatedRefreshData,
  ] = useTranslatedTexts(targetLanguage, [
    'Demo Mode',
    'Partial Live Data',
    'Live Data Offline',
    'Using Cached Market Data',
    'Data sources:',
    'Updated',
    'Live APIs are unavailable or invalid. Showing sample market/news data.',
    'Some providers are unavailable, but live data is still being served from available sources.',
    'Unable to fetch live market data:',
    'Real-time data ingestion is currently unavailable. Showing cached data from',
    'Retry',
    'Retrying...',
    'Last attempt:',
    'Live market data for',
    'No Live Data Available',
    'Market data ingestion is temporarily offline. Please check your API configuration or try again later.',
    'Refresh Data',
  ]);

  const handleRetry = async () => {
    setIsRetrying(true);
    if (onRetry) {
      await onRetry();
    }
    setIsRetrying(false);
  };

  return (
    <div className="space-y-4" data-aura-translate-skip>
      {status.demoMode && (
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
          {translatedDemoMode}
        </div>
      )}

      {status.isLive && status.partialLive && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-amber-900">
              {translatedPartialLive}
            </h3>
            <p className="mt-2 text-sm text-amber-800">
              {translatedPartialBody}
            </p>
            {status.dataSource && status.dataSource.length > 0 && (
              <p className="mt-2 text-xs text-amber-700">
                {translatedDataSources} {status.dataSource.join(', ')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Status Banner */}
      {!status.isLive && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {status.error ? (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-amber-600" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-amber-900">
              {status.demoMode
                ? translatedDemoMode
                : status.error
                ? translatedLiveOffline
                : translatedUsingCached}
            </h3>

            <p className="mt-2 text-sm text-amber-800">
              {status.demoMode
                ? translatedDemoBody
                : status.error
                ? `${translatedOfflineBody} ${status.error.message}`
                : `${translatedCachedBody} ${getTimeAgo(status.cachedSince)}.`}
            </p>

            {status.dataSource && status.dataSource.length > 0 && (
              <p className="mt-2 text-xs text-amber-700">
                Data sources: {status.dataSource.join(', ')}
              </p>
            )}

            <div className="mt-3 flex gap-2">
              {onRetry && (
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-amber-700 bg-white border border-amber-300 rounded hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
                  {isRetrying ? translatedRetrying : translatedRetry}
                </button>
              )}
              <span className="inline-flex items-center px-3 py-2 text-xs font-medium text-amber-600 bg-amber-100 rounded">
                {translatedLastAttempt} {getTimeAgo(status.lastUpdated)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Live Data Indicator */}
      {status.isLive && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 flex items-center gap-2">
          <Wifi className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              {translatedLiveFor} {ticker}
              <span className="ml-2 text-xs text-green-700">
              {translatedUpdated} {getTimeAgo(status.lastUpdated)}
              </span>
            </span>
        </div>
      )}

      {/* Main Content */}
      {children}

      {/* Fallback Message */}
      {!status.isLive && !children && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
          <WifiOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            {translatedNoLiveData}
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            {translatedFallbackBody}
          </p>
          {onRetry && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? translatedRetrying : translatedRefreshData}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Hook for managing market data status
 */
export const useMarketDataStatus = (ticker: string = 'NGSE:MTNN') => {
  const [status, setStatus] = useState<MarketDataStatus>({
    isLive: false,
    lastUpdated: new Date().toISOString(),
    cachedSince: new Date().toISOString(),
    dataSource: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, [ticker]);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ingest/all?ticker=${ticker}`);
      const data = await response.json();

      if (data.success) {
        const dataSource: string[] = data.data?.dataSource || [];
        const normalizedSources = dataSource.map((s) => String(s).toLowerCase());
        const hasMockSource = normalizedSources.some((s) => s.includes('mock'));
        const hasCacheSource = normalizedSources.includes('cache');
        const hasLiveSource = normalizedSources.some(
          (s) =>
            s === 'alpha-vantage' ||
            s === 'fmp' ||
            s === 'newsapi' ||
            s === 'analysis'
        );
        const hasUsableCachedData = hasCacheSource && !hasMockSource;
        const isDataAvailable = hasLiveSource || hasUsableCachedData;
        const demoMode =
          Boolean(data.data?.demoMode) ||
          hasMockSource ||
          (typeof data.warning === 'string' &&
            data.warning.toLowerCase().includes('demo mode'));

        setStatus({
          isLive: isDataAvailable,
          lastUpdated: new Date().toISOString(),
          cachedSince: data.data?.cached
            ? new Date().toISOString()
            : new Date().toISOString(),
          dataSource,
          demoMode: hasMockSource || demoMode,
          partialLive: hasLiveSource && hasMockSource,
          error: !isDataAvailable
            ? {
                code: 'DEMO_MODE',
                message: 'Using sample data due to missing/invalid market or news API keys.',
              }
            : undefined,
        });
      } else {
        setStatus((prev) => ({
          ...prev,
          isLive: false,
          error: data.error,
          lastUpdated: new Date().toISOString(),
        }));
      }
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        isLive: false,
        error: {
          code: 'FETCH_ERROR',
          message: (error as Error).message,
        },
        lastUpdated: new Date().toISOString(),
      }));
    } finally {
      setLoading(false);
    }
  };

  return { status, loading, refetch: fetchStatus };
};

/**
 * Utility function to format time
 */
function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400)
    return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default MarketDataStatusComponent;
