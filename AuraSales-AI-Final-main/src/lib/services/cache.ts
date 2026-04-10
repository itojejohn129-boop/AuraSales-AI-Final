/**
 * Market Data Cache Service
 * Provides in-memory and persistent caching for market data
 * Falls back to cached data when APIs fail or hit rate limits
 */

import { MarketDataPayload, CacheEntry } from './types';

// In-memory cache (will be reset on server restart)
const memoryCache = new Map<string, CacheEntry>();

// Cache TTL in milliseconds (24 hours)
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export class CacheService {
  /**
   * Get cached market data for a ticker
   */
  static async get(ticker: string): Promise<MarketDataPayload | null> {
    const cacheKey = this.getCacheKey(ticker);

    // Check memory cache first
    const memEntry = memoryCache.get(cacheKey);
    if (memEntry && this.isValid(memEntry)) {
      console.log(`[CacheService] Cache HIT (memory): ${ticker}`);
      return {
        ...memEntry.data,
        cached: true,
      };
    }

    // Try to load from persistent storage (localStorage simulation)
    try {
      const storedData = this.getFromStorage(cacheKey);
      if (storedData && this.isValid(storedData)) {
        // Restore to memory cache
        memoryCache.set(cacheKey, storedData);
        console.log(`[CacheService] Cache HIT (storage): ${ticker}`);
        return {
          ...storedData.data,
          cached: true,
        };
      }
    } catch (error) {
      console.warn(`[CacheService] Error reading from storage: ${error}`);
    }

    console.log(`[CacheService] Cache MISS: ${ticker}`);
    return null;
  }

  /**
   * Set market data in cache
   */
  static async set(ticker: string, data: MarketDataPayload): Promise<void> {
    const cacheKey = this.getCacheKey(ticker);
    const expiryTime = new Date(Date.now() + CACHE_TTL_MS).toISOString();

    const cacheEntry: CacheEntry = {
      ticker,
      data: {
        ...data,
        cached: false,
      },
      timestamp: new Date().toISOString(),
      expiry: expiryTime,
    };

    // Store in memory
    memoryCache.set(cacheKey, cacheEntry);

    // Try to persist to storage
    try {
      this.saveToStorage(cacheKey, cacheEntry);
      console.log(`[CacheService] Data cached (${CACHE_TTL_MS / 1000 / 3600}h): ${ticker}`);
    } catch (error) {
      console.warn(`[CacheService] Error saving to storage: ${error}`);
    }
  }

  /**
   * Clear cache for a specific ticker
   */
  static async clear(ticker: string): Promise<void> {
    const cacheKey = this.getCacheKey(ticker);
    memoryCache.delete(cacheKey);

    try {
      this.removeFromStorage(cacheKey);
    } catch (error) {
      console.warn(`[CacheService] Error clearing storage: ${error}`);
    }
  }

  /**
   * Clear all cache
   */
  static async clearAll(): Promise<void> {
    memoryCache.clear();
  }

  /**
   * Get cache statistics
   */
  static getStats(): {
    size: number;
    entries: Array<{ ticker: string; expiresIn: string }>;
  } {
    const entries: Array<{ ticker: string; expiresIn: string }> = [];

    memoryCache.forEach((entry, key) => {
      const expiryDate = new Date(entry.expiry);
      const now = new Date();
      const hoursLeft = Math.max(0, (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60));

      entries.push({
        ticker: entry.ticker,
        expiresIn: hoursLeft > 0 ? `${hoursLeft.toFixed(1)}h` : 'expired',
      });
    });

    return {
      size: memoryCache.size,
      entries,
    };
  }

  /**
   * Validate cache entry
   */
  private static isValid(entry: CacheEntry): boolean {
    const now = new Date();
    const expiry = new Date(entry.expiry);
    return expiry > now;
  }

  /**
   * Generate cache key
   */
  private static getCacheKey(ticker: string): string {
    return `market_data_${ticker.toUpperCase()}`;
  }

  /**
   * Save to storage (simulated with global variable for serverless)
   */
  private static saveToStorage(key: string, data: CacheEntry): void {
    // In production, this would write to Redis, MongoDB, or file system
    // For now, we'll use process.env for persistence (won't survive restart)
    if (typeof global !== 'undefined') {
      (global as any).__marketCache = (global as any).__marketCache || {};
      (global as any).__marketCache[key] = JSON.stringify(data);
    }
  }

  /**
   * Retrieve from storage
   */
  private static getFromStorage(key: string): CacheEntry | null {
    try {
      if (typeof global !== 'undefined' && (global as any).__marketCache && (global as any).__marketCache[key]) {
        return JSON.parse((global as any).__marketCache[key]);
      }
    } catch (error) {
      console.warn(`[CacheService] Error parsing stored data: ${error}`);
    }
    return null;
  }

  /**
   * Remove from storage
   */
  private static removeFromStorage(key: string): void {
    if (typeof global !== 'undefined' && (global as any).__marketCache) {
      delete (global as any).__marketCache[key];
    }
  }
}
