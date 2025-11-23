/**
 * Main App Component
 * Entry point with all providers and navigation
 */

import React, { useState, useEffect } from 'react';
import { StatusBar, View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './store';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AppNavigator } from './navigation/AppNavigator';

// App Content with theme access
const AppContent: React.FC = () => {
  const { theme, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Simulate app initialization
    const initializeApp = async () => {
      try {
        // Check for stored wallet
        // Check authentication state
        // Load user preferences
        await new Promise((resolve) => setTimeout(resolve, 500));
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
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
        <AppNavigator
          initialRouteName={isAuthenticated ? 'Home' : 'Welcome'}
        />
      </NavigationContainer>
    </>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <SafeAreaProvider>
          <AppContent />
        </SafeAreaProvider>
      </ThemeProvider>
    </Provider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
