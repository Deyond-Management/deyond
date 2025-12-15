/**
 * Main App Component
 * Entry point with all providers and navigation
 */

import React, { useState, useEffect } from 'react';
import { StatusBar, View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './src/store';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import Toast from './src/components/Toast';
import { validateEnvironment, getEnvironmentSummary } from './src/config/env.validation';

// App Content with theme access
const AppContent: React.FC = () => {
  const { theme, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated] = useState(false);

  useEffect(() => {
    // Simulate app initialization
    const initializeApp = async () => {
      try {
        // Validate environment variables
        const envValidation = validateEnvironment();

        // Log validation results
        if (envValidation.warnings.length > 0) {
          console.warn('Environment validation warnings:');
          envValidation.warnings.forEach(warning => console.warn(`  - ${warning}`));
        }

        if (!envValidation.isValid) {
          console.error('Environment validation errors:');
          envValidation.errors.forEach(error => console.error(`  - ${error}`));
          throw new Error('Environment validation failed. Check console for details.');
        }

        // Log environment summary
        const summary = getEnvironmentSummary();
        console.log('Environment summary:', {
          demoMode: summary.demoMode,
          appEnv: summary.appEnv,
          hasRpcProviders: summary.hasRpcProviders,
          configuredNetworks: summary.configuredNetworks,
        });

        // Check for stored wallet
        // Check authentication state
        // Load user preferences
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('App initialization failed:', error);
        // In production, you might want to show an error screen
        // For now, we'll just log and continue
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <NavigationContainer
        theme={{
          dark: isDark,
          colors: {
            primary: theme.colors.primary,
            background: theme.colors.background,
            card: theme.colors.card,
            text: theme.colors.text.primary,
            border: theme.colors.divider,
            notification: theme.colors.primary,
          },
          fonts: {
            regular: { fontFamily: 'System', fontWeight: '400' },
            medium: { fontFamily: 'System', fontWeight: '500' },
            bold: { fontFamily: 'System', fontWeight: '600' },
            heavy: { fontFamily: 'System', fontWeight: '700' },
          },
        }}
      >
        <AppNavigator initialRouteName={isAuthenticated ? 'Home' : 'Welcome'} />
      </NavigationContainer>
    </>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <ThemeProvider>
          <SafeAreaProvider>
            <AppContent />
            <Toast />
          </SafeAreaProvider>
        </ThemeProvider>
      </Provider>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});

export default App;
