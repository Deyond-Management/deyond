/**
 * Card Component
 * Reusable card container with elevation and customization
 * Follows design system and accessibility standards
 */

import React from 'react';
import {
  View,
  Pressable,
  ViewStyle,
  StyleProp,
  StyleSheet,
  PressableProps,
  ViewProps,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { createShadow } from '../../constants/shadows';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps {
  /** Card content */
  children: React.ReactNode;
  /** Elevation level (0-24) */
  elevation?: number;
  /** Padding size */
  padding?: CardPadding;
  /** Border radius */
  borderRadius?: number;
  /** Background color */
  backgroundColor?: string;
  /** Custom style */
  style?: StyleProp<ViewStyle>;
  /** On press handler (makes card pressable) */
  onPress?: () => void;
  /** Test ID */
  testID?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Full width */
  fullWidth?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  elevation = 2,
  padding = 'md',
  borderRadius,
  backgroundColor,
  style,
  onPress,
  testID,
  accessibilityLabel,
  fullWidth = false,
}) => {
  const { theme } = useTheme();

  // Get padding value
  const getPaddingValue = (): number => {
    switch (padding) {
      case 'none':
        return 0;
      case 'sm':
        return theme.spacing.sm;
      case 'lg':
        return theme.spacing.lg;
      case 'md':
      default:
        return theme.spacing.md;
    }
  };

  // Card style
  const cardStyle: StyleProp<ViewStyle> = [
    {
      backgroundColor: backgroundColor || theme.colors.card,
      borderRadius: borderRadius ?? theme.borderRadius.lg,
      padding: getPaddingValue(),
      ...createShadow(elevation),
      ...(fullWidth && { alignSelf: 'stretch' }),
    },
    style,
  ];

  // If onPress is provided, use Pressable
  if (onPress) {
    return (
      <Pressable
        style={cardStyle}
        onPress={onPress}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        android_ripple={{ color: theme.isDark ? '#FFFFFF20' : '#00000020' }}
      >
        {children}
      </Pressable>
    );
  }

  // Otherwise, use View
  return (
    <View style={cardStyle} testID={testID} accessibilityLabel={accessibilityLabel}>
      {children}
    </View>
  );
};

export default Card;
