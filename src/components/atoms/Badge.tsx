/**
 * Badge Component
 * Reusable badge for status indicators, counts, and labels
 * Follows design system and accessibility standards
 */

import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export type BadgeVariant =
  | 'primary'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'neutral';

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
  const numValue = Number(children);
  if (
    children === 0 ||
    children === '0' ||
    (!isNaN(numValue) && numValue === 0) ||
    (children === '' && !dot) ||
    (children === undefined && !dot)
  ) {
    return null;
  }

  // Get variant colors
  const getVariantColors = (): { bg: string; text: string; border: string } => {
    switch (variant) {
      case 'success':
        return {
          bg: theme.isDark ? '#388E3C' : '#4CAF50',
          text: '#FFFFFF',
          border: theme.isDark ? '#4CAF50' : '#388E3C',
        };
      case 'error':
        return {
          bg: theme.isDark ? '#D32F2F' : '#F44336',
          text: '#FFFFFF',
          border: theme.isDark ? '#F44336' : '#D32F2F',
        };
      case 'warning':
        return {
          bg: theme.isDark ? '#F57C00' : '#FF9800',
          text: '#FFFFFF',
          border: theme.isDark ? '#FF9800' : '#F57C00',
        };
      case 'info':
        return {
          bg: theme.isDark ? '#0288D1' : '#03A9F4',
          text: '#FFFFFF',
          border: theme.isDark ? '#03A9F4' : '#0288D1',
        };
      case 'neutral':
        return {
          bg: theme.isDark ? '#616161' : '#9E9E9E',
          text: '#FFFFFF',
          border: theme.isDark ? '#9E9E9E' : '#616161',
        };
      case 'primary':
      default:
        return {
          bg: theme.isDark ? '#1976D2' : '#2196F3',
          text: '#FFFFFF',
          border: theme.isDark ? '#2196F3' : '#1976D2',
        };
    }
  };

  const colors = getVariantColors();

  // Get size dimensions
  const getSizeDimensions = () => {
    if (dot) {
      switch (size) {
        case 'small':
          return { width: 6, height: 6 };
        case 'large':
          return { width: 12, height: 12 };
        case 'medium':
        default:
          return { width: 8, height: 8 };
      }
    }

    switch (size) {
      case 'small':
        return {
          paddingHorizontal: 6,
          paddingVertical: 2,
          fontSize: 10,
          minWidth: 16,
        };
      case 'large':
        return {
          paddingHorizontal: 12,
          paddingVertical: 4,
          fontSize: 14,
          minWidth: 24,
        };
      case 'medium':
      default:
        return {
          paddingHorizontal: 8,
          paddingVertical: 2,
          fontSize: 12,
          minWidth: 20,
        };
    }
  };

  const dimensions = getSizeDimensions();

  // Format display value
  const getDisplayValue = (): string => {
    if (dot) return '';

    // Check if children is a number or string representation of a number
    const numericValue =
      typeof children === 'number' ? children : Number(children);

    if (!isNaN(numericValue) && max && numericValue > max) {
      return `${max}+`;
    }

    return String(children);
  };

  const displayValue = getDisplayValue();

  // Container style
  const containerStyle: ViewStyle = {
    backgroundColor: outlined
      ? 'transparent'
      : backgroundColor || colors.bg,
    borderRadius: dot ? (dimensions.width as number) / 2 : 999,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    ...(dot
      ? {
          width: dimensions.width,
          height: dimensions.height,
        }
      : {
          paddingHorizontal: dimensions.paddingHorizontal,
          paddingVertical: dimensions.paddingVertical,
          minWidth: dimensions.minWidth,
        }),
    ...(outlined && {
      borderWidth: 1,
      borderColor: backgroundColor || colors.border,
    }),
    ...style,
  };

  // Text style
  const textStyles: TextStyle = {
    color: outlined
      ? backgroundColor || colors.border
      : textColor || colors.text,
    fontSize: dimensions.fontSize,
    fontWeight: '600',
    lineHeight: dimensions.fontSize ? dimensions.fontSize * 1.2 : undefined,
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
