/**
 * Custom Navigation Transitions
 * Smooth screen transitions using React Navigation
 */

import { StackNavigationOptions } from '@react-navigation/stack';
import { Platform } from 'react-native';

/**
 * Default slide from right transition
 * Smooth, fast slide animation for most screens
 */
export const slideFromRight: StackNavigationOptions = {
  animation: 'slide_from_right',
  animationDuration: 300,
};

/**
 * Slide from bottom transition
 * Used for modal-style screens (Transaction preview, etc.)
 */
export const slideFromBottom: StackNavigationOptions = {
  animation: 'slide_from_bottom',
  animationDuration: 350,
  presentation: 'modal',
};

/**
 * Fade transition
 * Subtle fade for quick transitions
 */
export const fade: StackNavigationOptions = {
  animation: 'fade',
  animationDuration: 250,
};

/**
 * Fade with scale transition
 * Combined fade and slight scale for polished look
 */
export const fadeFromCenter: StackNavigationOptions = {
  animation: 'fade_from_bottom',
  animationDuration: 300,
};

/**
 * Simple fade transition
 * Very fast fade for settings and auxiliary screens
 */
export const simpleFade: StackNavigationOptions = {
  animation: 'simple_push',
  animationDuration: 200,
};

/**
 * No animation
 * Instant transition for auth checks and status screens
 */
export const none: StackNavigationOptions = {
  animation: 'none',
  animationDuration: 0,
};

/**
 * Get platform-specific default transition
 */
export const getDefaultTransition = (): StackNavigationOptions => {
  return Platform.select({
    ios: {
      animation: 'default',
      animationDuration: 350,
    },
    android: {
      animation: 'slide_from_right',
      animationDuration: 300,
    },
    default: slideFromRight,
  });
};

/**
 * Transaction flow specific transitions
 */
export const transactionTransitions = {
  preview: {
    animation: 'slide_from_bottom' as const,
    animationDuration: 350,
    presentation: 'modal' as const,
  },
  status: {
    animation: 'fade' as const,
    animationDuration: 300,
    gestureEnabled: false,
  },
  confirm: {
    animation: 'slide_from_bottom' as const,
    animationDuration: 300,
    presentation: 'modal' as const,
  },
};

/**
 * Auth flow specific transitions
 */
export const authTransitions = {
  welcome: {
    animation: 'fade' as const,
    animationDuration: 400,
  },
  login: {
    animation: 'slide_from_right' as const,
    animationDuration: 300,
  },
  biometric: {
    animation: 'fade_from_bottom' as const,
    animationDuration: 250,
  },
};

/**
 * Settings flow specific transitions
 */
export const settingsTransitions = {
  main: {
    animation: 'slide_from_right' as const,
    animationDuration: 300,
  },
  detail: {
    animation: 'simple_push' as const,
    animationDuration: 250,
  },
};
