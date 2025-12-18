/**
 * ImageCache
 * Image caching utility for React Native
 */

import { Image } from 'react-native';
import { ImageCacheEntry, IMAGE_CACHE_OPTIONS } from './types';

class ImageCache {
  private cache: Map<string, ImageCacheEntry> = new Map();
  private totalSize: number = 0;
  private prefetchQueue: string[] = [];
  private isPrefetching: boolean = false;

  /**
   * Get cached image info
   */
  get(uri: string): ImageCacheEntry | null {
    const entry = this.cache.get(uri);
    if (!entry) return null;

    // Check if expired
    const now = Date.now();
    if (now - entry.cachedAt > IMAGE_CACHE_OPTIONS.maxAge) {
      this.cache.delete(uri);
      this.totalSize -= entry.size || 0;
      return null;
    }

    // Update last accessed time
    entry.lastAccessedAt = now;
    return entry;
  }

  /**
   * Add image to cache
   */
  set(uri: string, entry: Omit<ImageCacheEntry, 'cachedAt' | 'lastAccessedAt'>): void {
    // Evict if needed
    while (
      this.totalSize > IMAGE_CACHE_OPTIONS.maxSize ||
      this.cache.size >= IMAGE_CACHE_OPTIONS.maxEntries
    ) {
      this.evictLRU();
    }

    const now = Date.now();
    const fullEntry: ImageCacheEntry = {
      ...entry,
      cachedAt: now,
      lastAccessedAt: now,
    };

    // Update size tracking
    const existingEntry = this.cache.get(uri);
    if (existingEntry) {
      this.totalSize -= existingEntry.size || 0;
    }
    this.totalSize += entry.size || 0;

    this.cache.set(uri, fullEntry);
  }

  /**
   * Prefetch an image
   */
  async prefetch(uri: string): Promise<boolean> {
    try {
      // Check if already cached
      if (this.cache.has(uri)) {
        return true;
      }

      // Use React Native Image.prefetch
      await Image.prefetch(uri);

      // Add to cache
      this.set(uri, {
        uri,
        size: 0, // Size unknown for prefetched images
      });

      return true;
    } catch (error) {
      console.warn(`Failed to prefetch image: ${uri}`, error);
      return false;
    }
  }

  /**
   * Prefetch multiple images
   */
  async prefetchMany(uris: string[]): Promise<void> {
    this.prefetchQueue.push(...uris);
    this.processPrefetchQueue();
  }

  /**
   * Process prefetch queue
   */
  private async processPrefetchQueue(): Promise<void> {
    if (this.isPrefetching || this.prefetchQueue.length === 0) {
      return;
    }

    this.isPrefetching = true;

    // Process in batches of 3
    while (this.prefetchQueue.length > 0) {
      const batch = this.prefetchQueue.splice(0, 3);
      await Promise.all(batch.map(uri => this.prefetch(uri)));
    }

    this.isPrefetching = false;
  }

  /**
   * Check if image is cached
   */
  has(uri: string): boolean {
    const entry = this.cache.get(uri);
    if (!entry) return false;

    // Check expiration
    if (Date.now() - entry.cachedAt > IMAGE_CACHE_OPTIONS.maxAge) {
      this.cache.delete(uri);
      this.totalSize -= entry.size || 0;
      return false;
    }

    return true;
  }

  /**
   * Remove image from cache
   */
  remove(uri: string): boolean {
    const entry = this.cache.get(uri);
    if (entry) {
      this.totalSize -= entry.size || 0;
      return this.cache.delete(uri);
    }
    return false;
  }

  /**
   * Clear all cached images
   */
  clear(): void {
    this.cache.clear();
    this.totalSize = 0;
    this.prefetchQueue = [];
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    totalSize: number;
    maxSize: number;
    maxEntries: number;
  } {
    return {
      size: this.cache.size,
      totalSize: this.totalSize,
      maxSize: IMAGE_CACHE_OPTIONS.maxSize,
      maxEntries: IMAGE_CACHE_OPTIONS.maxEntries,
    };
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.lastAccessedAt < lruTime) {
        lruTime = entry.lastAccessedAt;
        lruKey = key;
      }
    }

    if (lruKey) {
      const entry = this.cache.get(lruKey);
      if (entry) {
        this.totalSize -= entry.size || 0;
      }
      this.cache.delete(lruKey);
    }
  }

  /**
   * Prune expired entries
   */
  prune(): number {
    const now = Date.now();
    let pruned = 0;

    for (const [key, entry] of this.cache) {
      if (now - entry.cachedAt > IMAGE_CACHE_OPTIONS.maxAge) {
        this.totalSize -= entry.size || 0;
        this.cache.delete(key);
        pruned++;
      }
    }

    return pruned;
  }
}

// Singleton instance
const imageCache = new ImageCache();

export { ImageCache, imageCache };
export default imageCache;
