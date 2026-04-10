/**
 * Cache utility for AURA AI responses
 * Stores responses in memory with a 5-minute TTL
 */

export interface CachedResponse {
  answer: string;
  timestamp: number;
}

class ResponseCache {
  private cache: Map<string, CachedResponse> = new Map();
  private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly CACHE_VERSION = "v9";

  /**
   * Generate a cache key from the user's message
   * Uses lowercase for case-insensitive matching
   */
  private generateKey(message: string): string {
    return `${this.CACHE_VERSION}:${message.toLowerCase().trim()}`;
  }

  /**
   * Check if a response is in cache and still valid
   */
  get(message: string): string | null {
    const key = this.generateKey(message);
    const cached = this.cache.get(key);

    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.TTL_MS) {
      // Cache expired, remove it
      this.cache.delete(key);
      return null;
    }

    console.log(`[CACHE HIT] "${message}" (age: ${Math.round(age / 1000)}s)`);
    return cached.answer;
  }

  /**
   * Store a response in the cache
   */
  set(message: string, answer: string): void {
    const key = this.generateKey(message);
    this.cache.set(key, {
      answer,
      timestamp: Date.now(),
    });
    console.log(`[CACHE SET] "${message}"`);
  }

  /**
   * Remove a cached response for a message.
   */
  delete(message: string): void {
    const key = this.generateKey(message);
    this.cache.delete(key);
  }

  /**
   * Clear the cache (useful for testing)
   */
  clear(): void {
    this.cache.clear();
    console.log("[CACHE CLEARED]");
  }

  /**
   * Get cache stats (for debugging)
   */
  getStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const responseCache = new ResponseCache();
