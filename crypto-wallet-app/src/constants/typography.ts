/**
 * Typography Constants
 * Design tokens for text styles
 * Following Material Design 3 type scale
 */

import { TextStyle } from 'react-native';

export const FontFamily = {
  regular: 'System',
  medium: 'System',
  semibold: 'System',
  bold: 'System',
  // Can be replaced with custom fonts like:
  // regular: 'Roboto-Regular',
  // medium: 'Roboto-Medium',
  // etc.
} as const;

export const FontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;

export const FontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const LineHeight = {
  xs: 16,
  sm: 20,
  base: 24,
  lg: 28,
  xl: 28,
  '2xl': 32,
  '3xl': 36,
  '4xl': 40,
  '5xl': 48,
} as const;

/**
 * Typography Styles
 * Predefined text styles for consistency
 */
export const Typography: Record<string, TextStyle> = {
  // Display Styles (Large headings)
  displayLarge: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['5xl'],
    lineHeight: LineHeight['5xl'],
    fontWeight: FontWeight.bold,
  },
  displayMedium: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['4xl'],
    lineHeight: LineHeight['4xl'],
    fontWeight: FontWeight.bold,
  },
  displaySmall: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['3xl'],
    lineHeight: LineHeight['3xl'],
    fontWeight: FontWeight.bold,
  },

  // Headline Styles
  headlineLarge: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize['2xl'],
    lineHeight: LineHeight['2xl'],
    fontWeight: FontWeight.semibold,
  },
  headlineMedium: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.xl,
    lineHeight: LineHeight.xl,
    fontWeight: FontWeight.semibold,
  },
  headlineSmall: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.lg,
    lineHeight: LineHeight.lg,
    fontWeight: FontWeight.semibold,
  },

  // Title Styles
  titleLarge: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.lg,
    lineHeight: LineHeight.lg,
    fontWeight: FontWeight.medium,
  },
  titleMedium: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    lineHeight: LineHeight.base,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    lineHeight: LineHeight.sm,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.1,
  },

  // Body Styles
  bodyLarge: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    lineHeight: LineHeight.base,
    fontWeight: FontWeight.regular,
    letterSpacing: 0.5,
  },
  bodyMedium: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    lineHeight: LineHeight.sm,
    fontWeight: FontWeight.regular,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    lineHeight: LineHeight.xs,
    fontWeight: FontWeight.regular,
    letterSpacing: 0.4,
  },

  // Label Styles (Buttons, tabs, etc.)
  labelLarge: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    lineHeight: LineHeight.sm,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    lineHeight: LineHeight.xs,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.5,
  },

  // Specialized Styles
  button: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    lineHeight: LineHeight.base,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    lineHeight: LineHeight.xs,
    fontWeight: FontWeight.regular,
    letterSpacing: 0.4,
  },
  overline: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    lineHeight: 16,
    fontWeight: FontWeight.medium,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: FontSize.sm,
    lineHeight: LineHeight.sm,
    fontWeight: FontWeight.regular,
  },

  // Crypto-specific
  address: {
    fontFamily: 'monospace',
    fontSize: FontSize.sm,
    lineHeight: LineHeight.sm,
    fontWeight: FontWeight.regular,
    letterSpacing: 0.5,
  },
  balance: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize['3xl'],
    lineHeight: LineHeight['3xl'],
    fontWeight: FontWeight.semibold,
  },
  price: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    lineHeight: LineHeight.base,
    fontWeight: FontWeight.medium,
  },
};

export default Typography;
