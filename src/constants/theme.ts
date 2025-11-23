/**
 * Theme Configuration
 * Combines all design tokens into theme objects
 */

import { Colors, getThemeColors, ColorScheme } from './colors';
import { Typography } from './typography';
import { Spacing, BorderRadius, IconSize } from './spacing';
import { Shadows } from './shadows';

export interface Theme {
  colors: ReturnType<typeof getThemeColors>;
  typography: typeof Typography;
  spacing: typeof Spacing;
  borderRadius: typeof BorderRadius;
  shadows: typeof Shadows;
  iconSize: typeof IconSize;
  isDark: boolean;
}

/**
 * Create theme object for given color scheme
 */
export const createTheme = (scheme: ColorScheme): Theme => ({
  colors: getThemeColors(scheme),
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  iconSize: IconSize,
  isDark: scheme === 'dark',
});

/**
 * Light theme
 */
export const lightTheme: Theme = createTheme('light');

/**
 * Dark theme
 */
export const darkTheme: Theme = createTheme('dark');

export { Colors, Typography, Spacing, Shadows };
export default createTheme;
