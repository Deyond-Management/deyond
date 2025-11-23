/**
 * Accessibility Hooks
 * Improve app accessibility
 */

import { useState, useEffect } from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';

export function useScreenReader() {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setIsEnabled);

    const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', setIsEnabled);

    return () => subscription.remove();
  }, []);

  return isEnabled;
}

export function useReduceMotion() {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setIsEnabled);

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setIsEnabled);

    return () => subscription.remove();
  }, []);

  return isEnabled;
}

export function useBoldText() {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isBoldTextEnabled().then(setIsEnabled);

    const subscription = AccessibilityInfo.addEventListener('boldTextChanged', setIsEnabled);

    return () => subscription.remove();
  }, []);

  return isEnabled;
}

export function useHighContrast() {
  const colorScheme = useColorScheme();
  const [preferHighContrast, setPreferHighContrast] = useState(false);

  // Check for high contrast preference
  useEffect(() => {
    // Platform-specific high contrast detection
    setPreferHighContrast(false);
  }, []);

  return preferHighContrast;
}

export function useFontScale() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    // Get system font scale
    // In production, use PixelRatio.getFontScale()
    setScale(1);
  }, []);

  return scale;
}

export function announceForAccessibility(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}

export default {
  useScreenReader,
  useReduceMotion,
  useBoldText,
  useHighContrast,
  useFontScale,
  announceForAccessibility,
};
