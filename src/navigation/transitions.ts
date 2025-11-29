/**
 * Custom Navigation Transitions
 * Smooth screen transitions using React Navigation Native Stack
 */

import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Platform } from 'react-native';

/**
 * Default slide from right transition
 * Smooth, fast slide animation for most screens
 */
export const slideFromRight: NativeStackNavigationOptions = {
  animation: 'slide_from_right',
};

/**
 * Slide from bottom transition
 * Used for modal-style screens (Transaction preview, etc.)
 */
export const slideFromBottom: NativeStackNavigationOptions = {
  animation: 'slide_from_bottom',
  presentation: 'modal',
};

/**
 * Fade transition
 * Subtle fade for quick transitions
 */
export const fade: NativeStackNavigationOptions = {
  animation: 'fade',
};

/**
 * Fade with scale transition
 * Combined fade and slight scale for polished look
 */
export const fadeFromCenter: NativeStackNavigationOptions = {
  animation: 'fade_from_bottom',
};

/**
 * Simple fade transition
 * Very fast fade for settings and auxiliary screens
 */
export const simpleFade: NativeStackNavigationOptions = {
  animation: 'default',
};

/**
 * No animation
 * Instant transition for auth checks and status screens
 */
export const none: NativeStackNavigationOptions = {
  animation: 'none',
};

/**
 * Get platform-specific default transition
 */
export const getDefaultTransition = (): NativeStackNavigationOptions => {
  return Platform.select({
    ios: {
      animation: 'default',
    },
    android: {
      animation: 'slide_from_right',
    },
    default: slideFromRight,
  }) as NativeStackNavigationOptions;
};

/**
 * Transaction flow specific transitions
 */
export const transactionTransitions = {
  preview: {
    animation: 'slide_from_bottom' as const,
    presentation: 'modal' as const,
  },
  status: {
    animation: 'fade' as const,
    gestureEnabled: false,
  },
  confirm: {
    animation: 'slide_from_bottom' as const,
    presentation: 'modal' as const,
  },
};

/**
 * Auth flow specific transitions
 */
export const authTransitions = {
  welcome: {
    animation: 'fade' as const,
  },
  login: {
    animation: 'slide_from_right' as const,
  },
  biometric: {
    animation: 'fade_from_bottom' as const,
  },
};

/**
 * Settings flow specific transitions
 */
export const settingsTransitions = {
  main: {
    animation: 'slide_from_right' as const,
  },
  detail: {
    animation: 'default' as const,
  },
};
