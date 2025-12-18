/**
 * Performance Types
 * Type definitions for performance utilities
 */

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  renderTime: number;
  firstRenderTime: number;
  rerenderCount: number;
  lastRenderTimestamp: number;
  averageRenderTime: number;
}

/**
 * Cache entry
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  size?: number;
}

/**
 * Cache options
 */
export interface CacheOptions {
  maxAge: number; // milliseconds
  maxSize?: number; // max entries
  staleWhileRevalidate?: boolean;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

/**
 * Image cache entry
 */
export interface ImageCacheEntry {
  uri: string;
  localPath?: string;
  width?: number;
  height?: number;
  size?: number;
  cachedAt: number;
  lastAccessedAt: number;
}

/**
 * Bundle analysis result
 */
export interface BundleAnalysis {
  totalSize: number;
  packages: PackageInfo[];
  largestPackages: PackageInfo[];
  potentialSavings: number;
}

/**
 * Package info
 */
export interface PackageInfo {
  name: string;
  size: number;
  percentage: number;
}

/**
 * Render optimization suggestion
 */
export interface OptimizationSuggestion {
  component: string;
  issue: string;
  suggestion: string;
  impact: 'low' | 'medium' | 'high';
}

/**
 * Default cache settings
 */
export const DEFAULT_CACHE_OPTIONS: CacheOptions = {
  maxAge: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
  staleWhileRevalidate: true,
};

/**
 * Image cache settings
 */
export const IMAGE_CACHE_OPTIONS = {
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxSize: 50 * 1024 * 1024, // 50MB
  maxEntries: 500,
};

/**
 * Performance thresholds
 */
export const PERFORMANCE_THRESHOLDS = {
  slowRender: 16, // ms (60fps target)
  verySlowRender: 100, // ms
  memoryWarning: 0.8, // 80% of available
  bundleSizeWarning: 10 * 1024 * 1024, // 10MB
};
