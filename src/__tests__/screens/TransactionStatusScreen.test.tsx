/**
 * TransactionStatusScreen Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { TransactionStatusScreen } from '../../screens/TransactionStatusScreen';
import { renderWithProviders } from '../utils/testUtils';

// Mock navigation and route
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
};

const mockRoute = {
  params: {
    to: '0x1234567890123456789012345678901234567890',
    amount: '0.5',
    token: 'ETH',
    txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
    status: 'pending',
  },
};

// Helper to render with theme
const renderWithTheme = (component: React.ReactElement) => {
  return renderWithProviders(component);
};

describe('TransactionStatusScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Pending State', () => {
    it('should render pending status', () => {
      const { getByText } = renderWithTheme(
        <TransactionStatusScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByText(/Pending/i)).toBeDefined();
    });

    it('should display transaction hash', () => {
      const { getByText } = renderWithTheme(
        <TransactionStatusScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      // Show truncated hash
      expect(getByText(/0xabcd...90ab/)).toBeDefined();
    });
  });

  describe('Confirmed State', () => {
    const confirmedRoute = {
      params: {
        ...mockRoute.params,
        status: 'confirmed',
      },
    };

    it('should render confirmed status', () => {
      const { getByText } = renderWithTheme(
        <TransactionStatusScreen navigation={mockNavigation as any} route={confirmedRoute as any} />
      );

      expect(getByText(/Confirmed/i)).toBeDefined();
    });
  });

  describe('Failed State', () => {
    const failedRoute = {
      params: {
        ...mockRoute.params,
        status: 'failed',
        error: 'Transaction reverted',
      },
    };

    it('should render failed status', () => {
      const { getByText } = renderWithTheme(
        <TransactionStatusScreen navigation={mockNavigation as any} route={failedRoute as any} />
      );

      expect(getByText(/Failed/i)).toBeDefined();
    });

    it('should display error message', () => {
      const { getByText } = renderWithTheme(
        <TransactionStatusScreen navigation={mockNavigation as any} route={failedRoute as any} />
      );

      expect(getByText(/Transaction reverted/)).toBeDefined();
    });
  });

  describe('Transaction Details', () => {
    it('should display amount sent', () => {
      const { getByText } = renderWithTheme(
        <TransactionStatusScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByText('0.5 ETH')).toBeDefined();
    });

    it('should display recipient address', () => {
      const { getByText } = renderWithTheme(
        <TransactionStatusScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByText(/0x1234...7890/)).toBeDefined();
    });
  });

  describe('Actions', () => {
    it('should have view on explorer button', () => {
      const { getByText } = renderWithTheme(
        <TransactionStatusScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByText(/View on Explorer/i)).toBeDefined();
    });

    it('should have done button', () => {
      const { getByText } = renderWithTheme(
        <TransactionStatusScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByText('Done')).toBeDefined();
    });

    it('should navigate to home when done is pressed', () => {
      const { getByText } = renderWithTheme(
        <TransactionStatusScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByText('Done'));

      expect(mockNavigation.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    });

    it('should have retry button for failed transactions', () => {
      const failedRoute = {
        params: {
          ...mockRoute.params,
          status: 'failed',
        },
      };

      const { getByText } = renderWithTheme(
        <TransactionStatusScreen navigation={mockNavigation as any} route={failedRoute as any} />
      );

      expect(getByText('Retry')).toBeDefined();
    });
  });

  describe('Copy Hash', () => {
    it('should have copy hash button', () => {
      const { getByTestId } = renderWithTheme(
        <TransactionStatusScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('copy-hash-button')).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible done button', () => {
      const { getByLabelText } = renderWithTheme(
        <TransactionStatusScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByLabelText('Done')).toBeDefined();
    });
  });
});
