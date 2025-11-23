/**
 * Theme Context
 * Provides theme to all components
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ColorScheme } from '../constants/colors';
import { createTheme, Theme } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

interface ThemeContextType {
  theme: Theme;
  colorScheme: ColorScheme | 'auto';
  isDark: boolean;
  setColorScheme: (scheme: ColorScheme | 'auto') => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@theme_preference';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme | 'auto'>('auto');
  const [systemColorScheme, setSystemColorScheme] = useState<ColorScheme>(
    Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'
  );

  // Determine actual theme based on preference
  const actualScheme: ColorScheme = colorScheme === 'auto' ? systemColorScheme : colorScheme;

  const theme = createTheme(actualScheme);

  // Load saved preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved && (saved === 'light' || saved === 'dark' || saved === 'auto')) {
          setColorSchemeState(saved as ColorScheme | 'auto');
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };
    loadTheme();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme: newScheme }) => {
      setSystemColorScheme(newScheme === 'dark' ? 'dark' : 'light');
    });

    return () => subscription.remove();
  }, []);

  const setColorScheme = useCallback(async (scheme: ColorScheme | 'auto') => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, scheme);
      setColorSchemeState(scheme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const newScheme: ColorScheme = actualScheme === 'dark' ? 'light' : 'dark';
    setColorScheme(newScheme);
  }, [actualScheme, setColorScheme]);

  const value: ThemeContextType = {
    theme,
    colorScheme,
    isDark: actualScheme === 'dark',
    setColorScheme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/**
 * Hook to access theme
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export default ThemeContext;
