/**
 * Theme Tests
 * Test design tokens and theme creation
 */

import { Colors, getThemeColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows, createShadow } from '../../constants/shadows';
import { createTheme } from '../../constants/theme';

describe('Design Tokens', () => {
  describe('Colors', () => {
    it('should have primary colors defined', () => {
      expect(Colors.primary).toBeDefined();
      expect(Colors.primary[500]).toBe('#2196F3');
    });

    it('should have light theme colors', () => {
      expect(Colors.light.background).toBe('#FFFFFF');
      expect(Colors.light.text.primary).toBe('#212121');
    });

    it('should have dark theme colors', () => {
      expect(Colors.dark.background).toBe('#121212');
      expect(Colors.dark.text.primary).toBe('#FFFFFF');
    });

    it('should have crypto-specific colors', () => {
      expect(Colors.crypto.bitcoin).toBeDefined();
      expect(Colors.crypto.ethereum).toBeDefined();
    });

    it('should return correct theme colors', () => {
      const lightColors = getThemeColors('light');
      const darkColors = getThemeColors('dark');

      // Check flattened structure with semantic colors
      expect(lightColors.background).toBe('#FFFFFF');
      expect(lightColors.text).toBe('#212121');
      expect(lightColors.primary).toBe('#2196F3');
      expect(lightColors.success).toBe('#4CAF50');
      expect(lightColors.error).toBe('#F44336');

      expect(darkColors.background).toBe('#121212');
      expect(darkColors.text).toBe('#FFFFFF');
      expect(darkColors.primary).toBe('#2196F3');
    });
  });

  describe('Typography', () => {
    it('should have display styles defined', () => {
      expect(Typography.displayLarge).toBeDefined();
      expect(Typography.displayLarge.fontSize).toBe(48);
    });

    it('should have body styles defined', () => {
      expect(Typography.bodyLarge).toBeDefined();
      expect(Typography.bodyMedium).toBeDefined();
      expect(Typography.bodySmall).toBeDefined();
    });

    it('should have button style defined', () => {
      expect(Typography.button).toBeDefined();
      expect(Typography.button.textTransform).toBe('uppercase');
    });

    it('should have crypto-specific styles', () => {
      expect(Typography.address).toBeDefined();
      expect(Typography.address.fontFamily).toBe('monospace');
      expect(Typography.balance).toBeDefined();
    });
  });

  describe('Spacing', () => {
    it('should have spacing scale defined', () => {
      expect(Spacing.none).toBe(0);
      expect(Spacing.xs).toBe(8);
      expect(Spacing.md).toBe(16);
      expect(Spacing.lg).toBe(24);
    });

    it('should have border radius defined', () => {
      expect(BorderRadius.sm).toBe(4);
      expect(BorderRadius.md).toBe(8);
      expect(BorderRadius.full).toBe(9999);
    });
  });

  describe('Shadows', () => {
    it('should create shadow styles', () => {
      const shadow = createShadow(4);
      expect(shadow).toBeDefined();
    });

    it('should have predefined shadow styles', () => {
      expect(Shadows.sm).toBeDefined();
      expect(Shadows.md).toBeDefined();
      expect(Shadows.lg).toBeDefined();
    });
  });

  describe('Theme Creation', () => {
    it('should create light theme', () => {
      const theme = createTheme('light');

      expect(theme.colors.background).toBe('#FFFFFF');
      expect(theme.colors.text).toBe('#212121');
      expect(theme.colors.primary).toBe('#2196F3');
      expect(theme.typography).toEqual(Typography);
      expect(theme.isDark).toBe(false);
    });

    it('should create dark theme', () => {
      const theme = createTheme('dark');

      expect(theme.colors.background).toBe('#121212');
      expect(theme.colors.text).toBe('#FFFFFF');
      expect(theme.colors.primary).toBe('#2196F3');
      expect(theme.isDark).toBe(true);
    });

    it('should include all design tokens', () => {
      const theme = createTheme('light');

      expect(theme.colors).toBeDefined();
      expect(theme.typography).toBeDefined();
      expect(theme.spacing).toBeDefined();
      expect(theme.borderRadius).toBeDefined();
      expect(theme.shadows).toBeDefined();
      expect(theme.iconSize).toBeDefined();
    });
  });
});
