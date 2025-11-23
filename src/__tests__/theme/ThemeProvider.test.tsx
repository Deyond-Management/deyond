/**
 * Theme System Tests
 */

import React from 'react';
import { Text, View } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import { renderHook } from '@testing-library/react-native';
import {
  ThemeProvider,
  useTheme,
  useThemeMode,
  lightTheme,
  darkTheme,
} from '../../theme/ThemeProvider';

describe('ThemeProvider', () => {
  it('should provide default light theme', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    expect(result.current.colors.background).toBe(lightTheme.colors.background);
  });

  it('should provide dark theme when mode is dark', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider initialMode="dark">{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.colors.background).toBe(darkTheme.colors.background);
  });

  it('should toggle theme mode', () => {
    const { result } = renderHook(() => useThemeMode(), {
      wrapper: ThemeProvider,
    });

    expect(result.current.mode).toBe('light');

    act(() => {
      result.current.toggleMode();
    });

    expect(result.current.mode).toBe('dark');
  });

  it('should set specific theme mode', () => {
    const { result } = renderHook(() => useThemeMode(), {
      wrapper: ThemeProvider,
    });

    act(() => {
      result.current.setMode('dark');
    });

    expect(result.current.mode).toBe('dark');

    act(() => {
      result.current.setMode('light');
    });

    expect(result.current.mode).toBe('light');
  });

  it('should follow system theme when set to system', () => {
    const { result } = renderHook(() => useThemeMode(), {
      wrapper: ThemeProvider,
    });

    act(() => {
      result.current.setMode('system');
    });

    expect(result.current.mode).toBe('system');
  });
});

describe('Theme Colors', () => {
  it('should have correct light theme colors', () => {
    expect(lightTheme.colors.background).toBe('#FFFFFF');
    expect(lightTheme.colors.text).toBe('#000000');
    expect(lightTheme.colors.primary).toBe('#007AFF');
  });

  it('should have correct dark theme colors', () => {
    expect(darkTheme.colors.background).toBe('#000000');
    expect(darkTheme.colors.text).toBe('#FFFFFF');
    expect(darkTheme.colors.primary).toBe('#0A84FF');
  });

  it('should have all required color properties', () => {
    const requiredColors = [
      'background',
      'surface',
      'text',
      'textSecondary',
      'primary',
      'secondary',
      'success',
      'warning',
      'error',
      'border',
    ];

    requiredColors.forEach(color => {
      expect(lightTheme.colors).toHaveProperty(color);
      expect(darkTheme.colors).toHaveProperty(color);
    });
  });
});

describe('Theme Spacing', () => {
  it('should have spacing scale', () => {
    expect(lightTheme.spacing.xs).toBe(4);
    expect(lightTheme.spacing.sm).toBe(8);
    expect(lightTheme.spacing.md).toBe(16);
    expect(lightTheme.spacing.lg).toBe(24);
    expect(lightTheme.spacing.xl).toBe(32);
  });
});

describe('Theme Typography', () => {
  it('should have font sizes', () => {
    expect(lightTheme.typography.sizes.xs).toBe(12);
    expect(lightTheme.typography.sizes.sm).toBe(14);
    expect(lightTheme.typography.sizes.md).toBe(16);
    expect(lightTheme.typography.sizes.lg).toBe(18);
    expect(lightTheme.typography.sizes.xl).toBe(24);
  });

  it('should have font weights', () => {
    expect(lightTheme.typography.weights.regular).toBe('400');
    expect(lightTheme.typography.weights.medium).toBe('500');
    expect(lightTheme.typography.weights.semibold).toBe('600');
    expect(lightTheme.typography.weights.bold).toBe('700');
  });
});

describe('useTheme hook', () => {
  it('should return current theme', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    expect(result.current).toHaveProperty('colors');
    expect(result.current).toHaveProperty('spacing');
    expect(result.current).toHaveProperty('typography');
    expect(result.current).toHaveProperty('borderRadius');
  });
});
