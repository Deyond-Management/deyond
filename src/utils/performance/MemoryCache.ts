/**
 * MemoryCache
 * In-memory caching utility with TTL support
 */

import { CacheEntry, CacheOptions, CacheStats, DEFAULT_CACHE_OPTIONS } from './types';

class MemoryCache<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private options: CacheOptions;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    hitRate: 0,
  };

  constructor(options: Partial<CacheOptions> = {}) {
    this.options = { ...DEFAULT_CACHE_OPTIONS, ...options };
  }

  /**
   * Get item from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.size--;
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    this.stats.hits++;
    this.updateHitRate();
    return entry.data;
  }

  /**
   * Set item in cache
   */
  set(key: string, data: T, maxAge?: number): void {
    const ttl = maxAge ?? this.options.maxAge;
    const now = Date.now();

    // Evict if at max size
    if (this.options.maxSize && this.cache.size >= this.options.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    };

    const existed = this.cache.has(key);
    this.cache.set(key, entry);

    if (!existed) {
      this.stats.size++;
    }
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.size--;
      return false;
    }

    return true;
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    const existed = this.cache.delete(key);
    if (existed) {
      this.stats.size--;
    }
    return existed;
  }

  /**
   * Clear all items from cache
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get or set with async fetcher
   */
  async getOrSet(key: string, fetcher: () => Promise<T>, maxAge?: number): Promise<T> {
    // Check cache first
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch new data
    const data = await fetcher();
    this.set(key, data, maxAge);
    return data;
  }

  /**
   * Evict oldest entry
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.size--;
    }
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Prune expired entries
   */
  prune(): number {
    const now = Date.now();
    let pruned = 0;

    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        pruned++;
      }
    }

    this.stats.size -= pruned;
    return pruned;
  }
}

// Create named cache instances
const apiCache = new MemoryCache({ maxAge: 30 * 1000, maxSize: 100 }); // 30s TTL
const priceCache = new MemoryCache({ maxAge: 10 * 1000, maxSize: 50 }); // 10s TTL
const tokenCache = new MemoryCache({ maxAge: 5 * 60 * 1000, maxSize: 200 }); // 5min TTL

export { MemoryCache, apiCache, priceCache, tokenCache };

export default MemoryCache;
