/**
 * Color Constants
 * Design tokens for the app's color palette
 * Supports light and dark themes
 */

export const Colors = {
  // Primary Colors
  primary: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#2196F3', // Main primary
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1',
  },

  // Secondary Colors (for accents)
  secondary: {
    50: '#F3E5F5',
    100: '#E1BEE7',
    200: '#CE93D8',
    300: '#BA68C8',
    400: '#AB47BC',
    500: '#9C27B0', // Main secondary
    600: '#8E24AA',
    700: '#7B1FA2',
    800: '#6A1B9A',
    900: '#4A148C',
  },

  // Success Colors
  success: {
    50: '#E8F5E9',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#4CAF50', // Main success
    600: '#43A047',
    700: '#388E3C',
    800: '#2E7D32',
    900: '#1B5E20',
  },

  // Error Colors
  error: {
    50: '#FFEBEE',
    100: '#FFCDD2',
    200: '#EF9A9A',
    300: '#E57373',
    400: '#EF5350',
    500: '#F44336', // Main error
    600: '#E53935',
    700: '#D32F2F',
    800: '#C62828',
    900: '#B71C1C',
  },

  // Warning Colors
  warning: {
    50: '#FFF3E0',
    100: '#FFE0B2',
    200: '#FFCC80',
    300: '#FFB74D',
    400: '#FFA726',
    500: '#FF9800', // Main warning
    600: '#FB8C00',
    700: '#F57C00',
    800: '#EF6C00',
    900: '#E65100',
  },

  // Info Colors
  info: {
    50: '#E1F5FE',
    100: '#B3E5FC',
    200: '#81D4FA',
    300: '#4FC3F7',
    400: '#29B6F6',
    500: '#03A9F4', // Main info
    600: '#039BE5',
    700: '#0288D1',
    800: '#0277BD',
    900: '#01579B',
  },

  // Neutral/Gray Colors
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },

  // Semantic Colors - Light Theme
  light: {
    background: '#FFFFFF',
    surface: '#F5F5F5',
    card: '#FFFFFF',
    text: {
      primary: '#212121',
      secondary: '#757575',
      disabled: '#BDBDBD',
      hint: '#9E9E9E',
    },
    divider: '#E0E0E0',
    border: '#E0E0E0',
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },

  // Semantic Colors - Dark Theme
  dark: {
    background: '#121212',
    surface: '#1E1E1E',
    card: '#2C2C2C',
    text: {
      primary: '#FFFFFF',
      secondary: '#B3B3B3',
      disabled: '#666666',
      hint: '#808080',
    },
    divider: '#333333',
    border: '#333333',
    overlay: 'rgba(255, 255, 255, 0.1)',
    shadow: 'rgba(0, 0, 0, 0.5)',
  },

  // Special Colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Blockchain/Crypto specific colors
  crypto: {
    bitcoin: '#F7931A',
    ethereum: '#627EEA',
    polygon: '#8247E5',
    bnb: '#F3BA2F',
    positive: '#00C853', // Green for price up
    negative: '#FF1744', // Red for price down
  },
} as const;

export type ColorScheme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
    hint: string;
  };
  textSecondary: string;
  divider: string;
  border: string;
  overlay: string;
  shadow: string;
  primary: string;
  secondary: string;
  success: string;
  error: string;
  warning: string;
  info: string;
}

/**
 * Get colors for current theme
 */
export const getThemeColors = (scheme: ColorScheme): ThemeColors => {
  const base = scheme === 'dark' ? Colors.dark : Colors.light;
  return {
    background: base.background,
    surface: base.surface,
    card: base.card,
    text: base.text,
    textSecondary: base.text.secondary,
    divider: base.divider,
    border: base.border,
    overlay: base.overlay,
    shadow: base.shadow,
    primary: Colors.primary[500],
    secondary: Colors.secondary[500],
    success: Colors.success[500],
    error: Colors.error[500],
    warning: Colors.warning[500],
    info: Colors.info[500],
  };
};

export default Colors;
