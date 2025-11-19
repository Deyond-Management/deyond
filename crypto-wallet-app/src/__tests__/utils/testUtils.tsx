/**
 * Test Utilities
 * Common test wrappers and helpers
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '../../contexts/ThemeContext';
import onboardingReducer from '../../store/slices/onboardingSlice';
import walletReducer from '../../store/slices/walletSlice';

// Create a test store
export const createTestStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      onboarding: onboardingReducer,
      wallet: walletReducer,
    },
    preloadedState,
  });
};

// Render with all providers
export const renderWithProviders = (
  component: React.ReactElement,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),
    ...renderOptions
  } = {}
) => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Provider store={store}>
      <ThemeProvider>{children}</ThemeProvider>
    </Provider>
  );

  return {
    store,
    ...render(component, { wrapper: Wrapper, ...renderOptions }),
  };
};

// Re-export everything from testing-library
export * from '@testing-library/react-native';
export { renderWithProviders as render };

// Dummy test to satisfy Jest
describe('Test Utilities', () => {
  it('should export renderWithProviders', () => {
    expect(renderWithProviders).toBeDefined();
  });
});
