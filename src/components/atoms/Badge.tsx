/**
 * Badge Component
 * Reusable badge for status indicators, counts, and labels
 * Follows design system and accessibility standards
 */

import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export type BadgeVariant = 'primary' | 'success' | 'error' | 'warning' | 'info' | 'neutral';

export type BadgeSize = 'small' | 'medium' | 'large';

export interface BadgeProps {
  /** Badge content (text or number) */
  children?: React.ReactNode;
  /** Badge variant */
  variant?: BadgeVariant;
  /** Badge size */
  size?: BadgeSize;
  /** Render as dot (no text) */
  dot?: boolean;
  /** Maximum number to display (shows max+ if exceeded) */
  max?: number;
  /** Outlined style */
  outlined?: boolean;
  /** Custom background color */
  backgroundColor?: string;
  /** Custom text color */
  textColor?: string;
  /** Custom style */
  style?: ViewStyle;
  /** Test ID */
  testID?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
}

// Variant color configurations
type VariantColors = {
  light: { bg: string; text: string; border: string };
  dark: { bg: string; text: string; border: string };
};

const VARIANT_COLORS: Record<BadgeVariant, VariantColors> = {
  primary: {
    light: { bg: '#2196F3', text: '#FFFFFF', border: '#1976D2' },
    dark: { bg: '#1976D2', text: '#FFFFFF', border: '#2196F3' },
  },
  success: {
    light: { bg: '#4CAF50', text: '#FFFFFF', border: '#388E3C' },
    dark: { bg: '#388E3C', text: '#FFFFFF', border: '#4CAF50' },
  },
  error: {
    light: { bg: '#F44336', text: '#FFFFFF', border: '#D32F2F' },
    dark: { bg: '#D32F2F', text: '#FFFFFF', border: '#F44336' },
  },
  warning: {
    light: { bg: '#FF9800', text: '#FFFFFF', border: '#F57C00' },
    dark: { bg: '#F57C00', text: '#FFFFFF', border: '#FF9800' },
  },
  info: {
    light: { bg: '#03A9F4', text: '#FFFFFF', border: '#0288D1' },
    dark: { bg: '#0288D1', text: '#FFFFFF', border: '#03A9F4' },
  },
  neutral: {
    light: { bg: '#9E9E9E', text: '#FFFFFF', border: '#616161' },
    dark: { bg: '#616161', text: '#FFFFFF', border: '#9E9E9E' },
  },
};

// Size configurations for dot badges
const DOT_SIZES = {
  small: { width: 6, height: 6 },
  medium: { width: 8, height: 8 },
  large: { width: 12, height: 12 },
};

// Size configurations for text badges
const TEXT_SIZES = {
  small: { paddingHorizontal: 6, paddingVertical: 2, fontSize: 10, minWidth: 16 },
  medium: { paddingHorizontal: 8, paddingVertical: 2, fontSize: 12, minWidth: 20 },
  large: { paddingHorizontal: 12, paddingVertical: 4, fontSize: 14, minWidth: 24 },
};

// Helper function to check if badge should be hidden
const shouldHideBadge = (children: React.ReactNode, dot: boolean): boolean => {
  if (dot) return false;

  if (children === undefined || children === '') return true;

  const numValue = Number(children);
  if (!isNaN(numValue) && numValue === 0) return true;

  return false;
};

// Helper function to get variant colors based on theme
const getVariantColors = (variant: BadgeVariant, isDark: boolean) => {
  return isDark ? VARIANT_COLORS[variant].dark : VARIANT_COLORS[variant].light;
};

// Helper function to get size dimensions
const getSizeDimensions = (size: BadgeSize, dot: boolean) => {
  return dot ? DOT_SIZES[size] : TEXT_SIZES[size];
};

// Helper function to format display value
const formatDisplayValue = (
  children: React.ReactNode,
  max: number | undefined,
  dot: boolean
): string => {
  if (dot) return '';

  const numericValue = typeof children === 'number' ? children : Number(children);

  if (!isNaN(numericValue) && max && numericValue > max) {
    return `${max}+`;
  }

  return String(children);
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  dot = false,
  max,
  outlined = false,
  backgroundColor,
  textColor,
  style,
  testID,
  accessibilityLabel,
}) => {
  const { theme } = useTheme();

  // Don't render if children is 0 or empty
  if (shouldHideBadge(children, dot)) {
    return null;
  }

  const colors = getVariantColors(variant, theme.isDark);
  const dimensions = getSizeDimensions(size, dot);
  const displayValue = formatDisplayValue(children, max, dot);

  // Container style
  const containerStyle: ViewStyle = {
    backgroundColor: outlined ? 'transparent' : backgroundColor || colors.bg,
    borderRadius: dot ? (dimensions as (typeof DOT_SIZES)[BadgeSize]).width / 2 : 999,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    ...(dot
      ? {
          width: (dimensions as (typeof DOT_SIZES)[BadgeSize]).width,
          height: (dimensions as (typeof DOT_SIZES)[BadgeSize]).height,
        }
      : {
          paddingHorizontal: (dimensions as (typeof TEXT_SIZES)[BadgeSize]).paddingHorizontal,
          paddingVertical: (dimensions as (typeof TEXT_SIZES)[BadgeSize]).paddingVertical,
          minWidth: (dimensions as (typeof TEXT_SIZES)[BadgeSize]).minWidth,
        }),
    ...(outlined && {
      borderWidth: 1,
      borderColor: backgroundColor || colors.border,
    }),
    ...style,
  };

  // Text style
  const textStyles: TextStyle = {
    color: outlined ? backgroundColor || colors.border : textColor || colors.text,
    fontSize: (dimensions as (typeof TEXT_SIZES)[BadgeSize]).fontSize,
    fontWeight: '600',
    lineHeight: (dimensions as (typeof TEXT_SIZES)[BadgeSize]).fontSize
      ? (dimensions as (typeof TEXT_SIZES)[BadgeSize]).fontSize * 1.2
      : undefined,
  };

  return (
    <View
      style={containerStyle}
      testID={testID}
      accessibilityLabel={accessibilityLabel || String(children)}
      accessibilityRole="text"
    >
      {!dot && displayValue && <Text style={textStyles}>{displayValue}</Text>}
    </View>
  );
};

export default Badge;
