/**
 * Performance Hooks Tests
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import {
  useDebounce,
  useThrottle,
  useMemoizedCallback,
  useDeepMemo,
} from '../../hooks/usePerformance';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated' });
    expect(result.current).toBe('initial');

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe('updated');
  });

  it('should cancel previous timeout on new value', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'first' });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    rerender({ value: 'second' });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe('initial');

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(result.current).toBe('second');
  });
});

describe('useThrottle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should throttle value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useThrottle(value, 500),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current).toBe('initial');

    // First update should go through
    act(() => {
      jest.advanceTimersByTime(500);
    });
    rerender({ value: 'updated' });
    expect(result.current).toBe('updated');

    // Immediate second update should be throttled
    rerender({ value: 'throttled' });
    expect(result.current).toBe('updated');

    act(() => {
      jest.advanceTimersByTime(500);
    });

    rerender({ value: 'after-throttle' });
    expect(result.current).toBe('after-throttle');
  });
});

describe('useMemoizedCallback', () => {
  it('should memoize callback with dependencies', () => {
    const { result, rerender } = renderHook(
      ({ dep }) => useMemoizedCallback(() => dep * 2, [dep]),
      { initialProps: { dep: 1 } }
    );

    const firstCallback = result.current;
    rerender({ dep: 1 });
    expect(result.current).toBe(firstCallback);

    rerender({ dep: 2 });
    // Callback reference should change when deps change
    expect(result.current).not.toBe(firstCallback);
  });
});

describe('useDeepMemo', () => {
  it('should memoize based on deep equality', () => {
    const factory = jest.fn(() => ({ result: 'computed' }));

    const { result, rerender } = renderHook(
      ({ deps }) => useDeepMemo(factory, deps),
      { initialProps: { deps: [{ a: 1 }] } }
    );

    const firstResult = result.current;
    expect(factory).toHaveBeenCalledTimes(1);

    // Same deep value
    rerender({ deps: [{ a: 1 }] });
    expect(result.current).toBe(firstResult);
    expect(factory).toHaveBeenCalledTimes(1);

    // Different value
    rerender({ deps: [{ a: 2 }] });
    expect(result.current).not.toBe(firstResult);
    expect(factory).toHaveBeenCalledTimes(2);
  });
});
