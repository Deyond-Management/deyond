/**
 * Spacing Constants
 * Design tokens for consistent spacing throughout the app
 * Based on 4px grid system
 */

/**
 * Base unit for spacing (4px)
 * All spacing values are multiples of this base unit
 */
export const SPACING_UNIT = 4;

/**
 * Spacing scale
 * Use these values for consistent margins, padding, and gaps
 */
export const Spacing = {
  none: 0,
  xxs: SPACING_UNIT * 1, // 4px
  xs: SPACING_UNIT * 2, // 8px
  sm: SPACING_UNIT * 3, // 12px
  md: SPACING_UNIT * 4, // 16px
  lg: SPACING_UNIT * 6, // 24px
  xl: SPACING_UNIT * 8, // 32px
  '2xl': SPACING_UNIT * 12, // 48px
  '3xl': SPACING_UNIT * 16, // 64px
  '4xl': SPACING_UNIT * 24, // 96px
} as const;

/**
 * Screen padding
 * Horizontal padding for screens
 */
export const ScreenPadding = {
  horizontal: Spacing.md, // 16px
  vertical: Spacing.lg, // 24px
} as const;

/**
 * Component spacing
 * Spacing between components
 */
export const ComponentSpacing = {
  tight: Spacing.xs, // 8px
  normal: Spacing.md, // 16px
  loose: Spacing.lg, // 24px
  extraLoose: Spacing.xl, // 32px
} as const;

/**
 * List item spacing
 */
export const ListSpacing = {
  gap: Spacing.sm, // 12px between items
  padding: Spacing.md, // 16px inside items
} as const;

/**
 * Border radius
 * For rounded corners
 */
export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999, // Fully rounded (pill shape)
} as const;

/**
 * Border width
 */
export const BorderWidth = {
  none: 0,
  thin: 1,
  medium: 2,
  thick: 4,
} as const;

/**
 * Icon sizes
 */
export const IconSize = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
  '2xl': 64,
} as const;

/**
 * Touch target minimum sizes
 * Following accessibility guidelines (44x44 points)
 */
export const TouchTarget = {
  minimum: 44,
  recommended: 48,
} as const;

/**
 * Container max widths
 * For responsive layouts
 */
export const MaxWidth = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export default Spacing;
