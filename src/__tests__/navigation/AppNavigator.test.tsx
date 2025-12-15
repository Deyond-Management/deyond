/**
 * AppNavigator Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator, RootStackParamList } from '../../navigation/AppNavigator';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { Provider } from 'react-redux';
import { store } from '../../store';

// Mock TransactionService for TransactionHistory screen
jest.mock('../../services/blockchain/TransactionService', () => {
  return jest.fn().mockImplementation(() => ({
    getTransactionHistory: jest.fn().mockResolvedValue([
      {
        hash: '0x123abc',
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        to: '0xABC123',
        value: '1.5',
        gasUsed: '0.002',
        status: 'confirmed',
        timestamp: Date.now() - 1000 * 60 * 30,
        blockNumber: 12345,
      },
    ]),
    clearTransactionCache: jest.fn(),
  }));
});

// Helper to render navigator
const renderNavigator = (initialRoute?: keyof RootStackParamList) => {
  return render(
    <Provider store={store}>
      <ThemeProvider>
        <NavigationContainer>
          <AppNavigator initialRouteName={initialRoute} />
        </NavigationContainer>
      </ThemeProvider>
    </Provider>
  );
};

describe('AppNavigator', () => {
  describe('Screen Registration', () => {
    it('should have Welcome screen', () => {
      const { getByTestId } = renderNavigator('Welcome');

      expect(getByTestId('welcome-container')).toBeDefined();
    });

    it('should have Home screen', () => {
      const { getByTestId } = renderNavigator('Home');

      expect(getByTestId('home-scroll')).toBeDefined();
    });

    it('should have Send screen', () => {
      const { getByTestId } = renderNavigator('Send');

      expect(getByTestId('recipient-address-input')).toBeDefined();
    });

    it('should have Receive screen', () => {
      const { getByTestId } = renderNavigator('Receive');

      expect(getByTestId('qr-code')).toBeDefined();
    });

    it('should have Settings screen', () => {
      const { getByText } = renderNavigator('Settings');

      expect(getByText('Settings')).toBeDefined();
    });

    it('should have TransactionHistory screen', async () => {
      const { getByText, getByTestId } = renderNavigator('TransactionHistory');

      // Title should be visible immediately
      expect(getByText('Transaction History')).toBeDefined();

      // Wait for filter buttons to appear after loading
      await waitFor(
        () => {
          expect(getByTestId('filter-all')).toBeDefined();
        },
        { timeout: 3000 }
      );
    });

    it('should have ChatHome screen', () => {
      const { getByText } = renderNavigator('ChatHome');

      expect(getByText('Messages')).toBeDefined();
    });
  });

  describe('Default Route', () => {
    it('should default to Welcome screen when not authenticated', () => {
      const { getByTestId } = renderNavigator();

      expect(getByTestId('welcome-container')).toBeDefined();
    });
  });

  describe('Stack Configuration', () => {
    it('should render without crashing', () => {
      const { toJSON } = renderNavigator('Welcome');

      expect(toJSON()).toBeTruthy();
    });
  });
});
