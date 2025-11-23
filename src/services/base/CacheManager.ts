/**
 * CacheManager
 * Generic caching utility with TTL support
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CACHE_TTL } from '../../config/constants';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheManager<T = unknown> {
  private memoryCache: Map<string, CacheEntry<T>> = new Map();
  private storagePrefix: string;
  private defaultTtl: number;
  private useStorage: boolean;

  constructor(options: { prefix: string; defaultTtl?: number; useStorage?: boolean }) {
    this.storagePrefix = options.prefix;
    this.defaultTtl = options.defaultTtl || CACHE_TTL.MEDIUM;
    this.useStorage = options.useStorage ?? false;
  }

  /**
   * Get cached value
   */
  async get(key: string): Promise<T | null> {
    const cacheKey = this.getCacheKey(key);

    // Check memory cache first
    const memoryEntry = this.memoryCache.get(cacheKey);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      return memoryEntry.data;
    }

    // Check storage if enabled
    if (this.useStorage) {
      try {
        const stored = await AsyncStorage.getItem(cacheKey);
        if (stored) {
          const entry = JSON.parse(stored) as CacheEntry<T>;
          if (!this.isExpired(entry)) {
            // Update memory cache
            this.memoryCache.set(cacheKey, entry);
            return entry.data;
          }
          // Remove expired entry
          await AsyncStorage.removeItem(cacheKey);
        }
      } catch {
        // Ignore storage errors
      }
    }

    // Remove from memory if expired
    this.memoryCache.delete(cacheKey);
    return null;
  }

  /**
   * Set cached value
   */
  async set(key: string, data: T, ttl?: number): Promise<void> {
    const cacheKey = this.getCacheKey(key);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl,
    };

    // Update memory cache
    this.memoryCache.set(cacheKey, entry);

    // Update storage if enabled
    if (this.useStorage) {
      try {
        await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
      } catch {
        // Ignore storage errors
      }
    }
  }

  /**
   * Delete cached value
   */
  async delete(key: string): Promise<void> {
    const cacheKey = this.getCacheKey(key);
    this.memoryCache.delete(cacheKey);

    if (this.useStorage) {
      try {
        await AsyncStorage.removeItem(cacheKey);
      } catch {
        // Ignore storage errors
      }
    }
  }

  /**
   * Check if key exists and is valid
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  /**
   * Get or set with factory function
   */
  async getOrSet(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    const data = await factory();
    await this.set(key, data, ttl);
    return data;
  }

  /**
   * Clear all cached values
   */
  async clear(): Promise<void> {
    // Clear memory cache
    const keysToRemove: string[] = [];
    this.memoryCache.forEach((_, key) => {
      if (key.startsWith(this.storagePrefix)) {
        keysToRemove.push(key);
      }
    });
    keysToRemove.forEach(key => this.memoryCache.delete(key));

    // Clear storage if enabled
    if (this.useStorage) {
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        const cacheKeys = allKeys.filter(key => key.startsWith(this.storagePrefix));
        if (cacheKeys.length > 0) {
          await AsyncStorage.multiRemove(cacheKeys);
        }
      } catch {
        // Ignore storage errors
      }
    }
  }

  /**
   * Get all cached keys
   */
  async keys(): Promise<string[]> {
    const keys = new Set<string>();

    // Memory cache keys
    this.memoryCache.forEach((_, key) => {
      if (key.startsWith(this.storagePrefix)) {
        keys.add(key.replace(this.storagePrefix, ''));
      }
    });

    // Storage keys
    if (this.useStorage) {
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        allKeys
          .filter(key => key.startsWith(this.storagePrefix))
          .forEach(key => keys.add(key.replace(this.storagePrefix, '')));
      } catch {
        // Ignore storage errors
      }
    }

    return Array.from(keys);
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memoryEntries: number;
    totalSize: number;
  } {
    let totalSize = 0;
    this.memoryCache.forEach(entry => {
      totalSize += JSON.stringify(entry).length;
    });

    return {
      memoryEntries: this.memoryCache.size,
      totalSize,
    };
  }

  /**
   * Cleanup expired entries
   */
  async cleanup(): Promise<number> {
    let removed = 0;

    // Cleanup memory cache
    const expiredKeys: string[] = [];
    this.memoryCache.forEach((entry, key) => {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    });
    expiredKeys.forEach(key => {
      this.memoryCache.delete(key);
      removed++;
    });

    // Cleanup storage
    if (this.useStorage) {
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        const cacheKeys = allKeys.filter(key => key.startsWith(this.storagePrefix));

        for (const key of cacheKeys) {
          const stored = await AsyncStorage.getItem(key);
          if (stored) {
            const entry = JSON.parse(stored) as CacheEntry<T>;
            if (this.isExpired(entry)) {
              await AsyncStorage.removeItem(key);
              removed++;
            }
          }
        }
      } catch {
        // Ignore storage errors
      }
    }

    return removed;
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Get full cache key
   */
  private getCacheKey(key: string): string {
    return `${this.storagePrefix}${key}`;
  }
}

export default CacheManager;
