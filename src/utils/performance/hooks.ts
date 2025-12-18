/**
 * Performance Hooks
 * Custom hooks for performance optimization
 */

import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { InteractionManager } from 'react-native';
import { PerformanceMetrics, PERFORMANCE_THRESHOLDS } from './types';

/**
 * Debounce hook
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle hook
 */
export function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdated = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    if (now - lastUpdated.current >= interval) {
      setThrottledValue(value);
      lastUpdated.current = now;
    } else {
      const timerId = setTimeout(
        () => {
          setThrottledValue(value);
          lastUpdated.current = Date.now();
        },
        interval - (now - lastUpdated.current)
      );

      return () => clearTimeout(timerId);
    }
  }, [value, interval]);

  return throttledValue;
}

/**
 * Debounced callback hook
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Throttled callback hook
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  interval: number
): T {
  const lastCallRef = useRef<number>(0);
  const pendingArgsRef = useRef<Parameters<T> | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const elapsed = now - lastCallRef.current;

      if (elapsed >= interval) {
        lastCallRef.current = now;
        callback(...args);
      } else {
        pendingArgsRef.current = args;
        if (!timeoutRef.current) {
          timeoutRef.current = setTimeout(() => {
            if (pendingArgsRef.current) {
              lastCallRef.current = Date.now();
              callback(...pendingArgsRef.current);
              pendingArgsRef.current = null;
            }
            timeoutRef.current = undefined;
          }, interval - elapsed);
        }
      }
    },
    [callback, interval]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}

/**
 * Lazy initialization hook
 */
export function useLazyInit<T>(initializer: () => T): T {
  const ref = useRef<{ value: T; initialized: boolean }>({
    value: undefined as T,
    initialized: false,
  });

  if (!ref.current.initialized) {
    ref.current.value = initializer();
    ref.current.initialized = true;
  }

  return ref.current.value;
}

/**
 * Run after interactions hook
 */
export function useAfterInteractions(callback: () => void): void {
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(callback);
    return () => task.cancel();
  }, [callback]);
}

/**
 * Render tracking hook for performance monitoring
 */
export function useRenderTracking(componentName: string): PerformanceMetrics {
  const metricsRef = useRef<PerformanceMetrics>({
    renderTime: 0,
    firstRenderTime: 0,
    rerenderCount: 0,
    lastRenderTimestamp: 0,
    averageRenderTime: 0,
  });

  const renderStartRef = useRef<number>(0);
  const isFirstRenderRef = useRef<boolean>(true);

  // Mark render start
  renderStartRef.current = performance.now();

  useEffect(() => {
    const renderEnd = performance.now();
    const renderTime = renderEnd - renderStartRef.current;

    if (isFirstRenderRef.current) {
      metricsRef.current.firstRenderTime = renderTime;
      isFirstRenderRef.current = false;
    }

    metricsRef.current.rerenderCount++;
    metricsRef.current.renderTime = renderTime;
    metricsRef.current.lastRenderTimestamp = Date.now();

    // Calculate average
    const prevAvg = metricsRef.current.averageRenderTime;
    const count = metricsRef.current.rerenderCount;
    metricsRef.current.averageRenderTime = (prevAvg * (count - 1) + renderTime) / count;

    // Log slow renders
    if (renderTime > PERFORMANCE_THRESHOLDS.slowRender) {
      console.warn(`[Performance] Slow render in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }
  });

  return metricsRef.current;
}

/**
 * Previous value hook
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Stable callback hook (like useCallback but more stable)
 */
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(((...args) => callbackRef.current?.(...args)) as T, []);
}

/**
 * Deep compare memo hook
 */
export function useDeepCompareMemo<T>(factory: () => T, deps: React.DependencyList): T {
  const ref = useRef<{
    deps: React.DependencyList;
    value: T;
    initialized: boolean;
  }>({
    deps: [],
    value: undefined as T,
    initialized: false,
  });

  if (!ref.current.initialized || !deepEqual(ref.current.deps, deps)) {
    ref.current.deps = deps;
    ref.current.value = factory();
    ref.current.initialized = true;
  }

  return ref.current.value;
}

/**
 * Simple deep equality check
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object' || a === null || b === null) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key) || !deepEqual(a[key], b[key])) {
      return false;
    }
  }

  return true;
}

/**
 * Intersection observer hook for lazy loading
 */
export function useIntersectionObserver(
  callback: (isIntersecting: boolean) => void,
  options?: IntersectionObserverInit
): React.RefObject<any> {
  const ref = useRef<any>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // Note: IntersectionObserver is not available in React Native
    // This hook is placeholder for web compatibility
    // In React Native, use onViewableItemsChanged for FlatList
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      callbackRef.current(entry.isIntersecting);
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return ref;
}
