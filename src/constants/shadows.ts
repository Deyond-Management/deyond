/**
 * Shadow Constants
 * Design tokens for elevation and depth
 * Platform-specific shadows (iOS uses shadowColor, Android uses elevation)
 */

import { Platform, ViewStyle } from 'react-native';

/**
 * Shadow elevation levels
 * Based on Material Design elevation system
 */
export const ShadowElevation = {
  none: 0,
  sm: 2,
  md: 4,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
} as const;

/**
 * Create shadow style for a given elevation
 * Handles platform differences automatically
 */
export const createShadow = (elevation: number): ViewStyle => {
  if (Platform.OS === 'android') {
    return {
      elevation,
    };
  }

  // iOS shadow properties
  const shadowOpacity = 0.1 + elevation * 0.01;
  const shadowRadius = elevation * 0.5;
  const shadowOffset = {
    width: 0,
    height: elevation * 0.5,
  };

  return {
    shadowColor: '#000000',
    shadowOffset,
    shadowOpacity: Math.min(shadowOpacity, 0.3),
    shadowRadius,
  };
};

/**
 * Predefined shadow styles
 * Use these for consistent elevation throughout the app
 */
export const Shadows: Record<string, ViewStyle> = {
  none: createShadow(ShadowElevation.none),
  sm: createShadow(ShadowElevation.sm),
  md: createShadow(ShadowElevation.md),
  lg: createShadow(ShadowElevation.lg),
  xl: createShadow(ShadowElevation.xl),
  '2xl': createShadow(ShadowElevation['2xl']),
  '3xl': createShadow(ShadowElevation['3xl']),
};

/**
 * Card shadows
 * Specific shadow styles for cards
 */
export const CardShadows: Record<string, ViewStyle> = {
  default: Shadows.sm,
  hover: Shadows.md,
  elevated: Shadows.lg,
};

/**
 * Modal/Dialog shadows
 */
export const ModalShadow: ViewStyle = Shadows['2xl'];

/**
 * Button shadows
 */
export const ButtonShadows: Record<string, ViewStyle> = {
  default: Shadows.sm,
  pressed: Shadows.none,
  floating: Shadows.lg,
};

export default Shadows;
