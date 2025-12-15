/**
 * usePerformanceMonitor Hook
 * Monitors screen render performance and reports slow renders
 */

import { useEffect, useRef } from 'react';
import { getErrorReporter } from '../services/error/ErrorReporter';
import { ErrorSeverity, ErrorCategory } from '../types/error';

interface PerformanceMetrics {
  screenName: string;
  renderTime: number;
  timestamp: number;
}

const SLOW_RENDER_THRESHOLD = 500; // ms
const performanceHistory: PerformanceMetrics[] = [];
const MAX_HISTORY = 50;

export const usePerformanceMonitor = (screenName: string): void => {
  const mountTime = useRef(Date.now());
  const errorReporter = getErrorReporter();

  useEffect(() => {
    const renderTime = Date.now() - mountTime.current;

    // Record metrics
    const metrics: PerformanceMetrics = {
      screenName,
      renderTime,
      timestamp: Date.now(),
    };

    performanceHistory.push(metrics);
    if (performanceHistory.length > MAX_HISTORY) {
      performanceHistory.shift();
    }

    // Report slow renders
    if (renderTime > SLOW_RENDER_THRESHOLD) {
      console.warn(`⚠️  Slow render detected: ${screenName} took ${renderTime}ms to mount`);

      errorReporter.report(
        new Error(`Slow render: ${screenName} (${renderTime}ms)`),
        ErrorSeverity.LOW,
        ErrorCategory.UI,
        {
          screenName,
          renderTime,
          threshold: SLOW_RENDER_THRESHOLD,
        }
      );
    }

    // Log in development
    if (__DEV__) {
      console.log(`📊 [Performance] ${screenName} mounted in ${renderTime}ms`);
    }
  }, [screenName, errorReporter]);
};

/**
 * Get performance history
 */
export const getPerformanceHistory = (): PerformanceMetrics[] => {
  return [...performanceHistory];
};

/**
 * Get average render time for a screen
 */
export const getAverageRenderTime = (screenName: string): number | null => {
  const screenMetrics = performanceHistory.filter(m => m.screenName === screenName);
  if (screenMetrics.length === 0) return null;

  const total = screenMetrics.reduce((sum, m) => sum + m.renderTime, 0);
  return total / screenMetrics.length;
};

/**
 * Clear performance history
 */
export const clearPerformanceHistory = (): void => {
  performanceHistory.length = 0;
};
