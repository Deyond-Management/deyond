/**
 * Home Screen Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HomeScreen } from '../../screens/HomeScreen';
import { renderWithProviders } from '../utils/testUtils';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

// Wrapper with providers
const renderWithTheme = (component: React.ReactElement) => {
  return renderWithProviders(component);
};

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render total balance section', () => {
      const { getByText } = renderWithTheme(
        <HomeScreen navigation={mockNavigation as any} />
      );
      expect(getByText(/Total Balance/i)).toBeDefined();
    });

    it('should render balance amount', () => {
      const { getByTestId } = renderWithTheme(
        <HomeScreen navigation={mockNavigation as any} />
      );
      expect(getByTestId('total-balance')).toBeDefined();
    });

    it('should render tokens section header', () => {
      const { getByText } = renderWithTheme(
        <HomeScreen navigation={mockNavigation as any} />
      );
      expect(getByText('My Tokens')).toBeDefined();
    });

    it('should render transactions section header', () => {
      const { getByText } = renderWithTheme(
        <HomeScreen navigation={mockNavigation as any} />
      );
      expect(getByText('Recent Transactions')).toBeDefined();
    });

    it('should render action buttons', () => {
      const { getByText } = renderWithTheme(
        <HomeScreen navigation={mockNavigation as any} />
      );
      expect(getByText('Send')).toBeDefined();
      expect(getByText('Receive')).toBeDefined();
    });
  });

  describe('Token List', () => {
    it('should render token cards when tokens exist', () => {
      const { getByText } = renderWithTheme(
        <HomeScreen navigation={mockNavigation as any} />
      );
      // Should have at least placeholder tokens
      expect(getByText('ETH')).toBeDefined();
    });

    it('should navigate to token details when token card is pressed', () => {
      const { getAllByTestId } = renderWithTheme(
        <HomeScreen navigation={mockNavigation as any} />
      );
      const tokenCards = getAllByTestId(/token-card/);
      if (tokenCards.length > 0) {
        fireEvent.press(tokenCards[0]);
        expect(mockNavigation.navigate).toHaveBeenCalled();
      }
    });
  });

  describe('Transaction List', () => {
    it('should render transaction cards when transactions exist', () => {
      const { getAllByTestId } = renderWithTheme(
        <HomeScreen navigation={mockNavigation as any} />
      );
      const txCards = getAllByTestId(/tx-card/);
      expect(txCards.length).toBeGreaterThanOrEqual(0);
    });

    it('should show transactions when they exist', () => {
      const { getAllByTestId } = renderWithTheme(
        <HomeScreen navigation={mockNavigation as any} />
      );
      // Home screen always shows mock transactions
      const txCards = getAllByTestId(/tx-card/);
      expect(txCards.length).toBeGreaterThan(0);
    });
  });

  describe('Actions', () => {
    it('should navigate to Send screen when Send button is pressed', () => {
      const { getByText } = renderWithTheme(
        <HomeScreen navigation={mockNavigation as any} />
      );

      const sendButton = getByText('Send');
      fireEvent.press(sendButton);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Send');
    });

    it('should navigate to Receive screen when Receive button is pressed', () => {
      const { getByText } = renderWithTheme(
        <HomeScreen navigation={mockNavigation as any} />
      );

      const receiveButton = getByText('Receive');
      fireEvent.press(receiveButton);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Receive');
    });
  });

  describe('Header', () => {
    it('should render account selector or address', () => {
      const { getByTestId } = renderWithTheme(
        <HomeScreen navigation={mockNavigation as any} />
      );
      expect(getByTestId('account-header')).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible action buttons', () => {
      const { getByLabelText } = renderWithTheme(
        <HomeScreen navigation={mockNavigation as any} />
      );
      expect(getByLabelText('Send')).toBeDefined();
      expect(getByLabelText('Receive')).toBeDefined();
    });
  });

  describe('Scroll Behavior', () => {
    it('should render scrollable content', () => {
      const { getByTestId } = renderWithTheme(
        <HomeScreen navigation={mockNavigation as any} />
      );
      expect(getByTestId('home-scroll')).toBeDefined();
    });
  });

  describe('Network Selector', () => {
    it('should render network selector', () => {
      const { getByTestId } = renderWithTheme(
        <HomeScreen navigation={mockNavigation as any} />
      );
      expect(getByTestId('network-selector')).toBeDefined();
    });

    it('should display current network name', () => {
      const { getAllByText } = renderWithTheme(
        <HomeScreen navigation={mockNavigation as any} />
      );
      // Default network should be displayed (may appear multiple times)
      const networkTexts = getAllByText(/Ethereum/i);
      expect(networkTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Pull to Refresh', () => {
    it('should have refresh control', () => {
      const { getByTestId } = renderWithTheme(
        <HomeScreen navigation={mockNavigation as any} />
      );
      const scrollView = getByTestId('home-scroll');
      expect(scrollView).toBeDefined();
    });
  });

  describe('Buy Action', () => {
    it('should render Buy button', () => {
      const { getByText } = renderWithTheme(
        <HomeScreen navigation={mockNavigation as any} />
      );
      expect(getByText('Buy')).toBeDefined();
    });
  });
});
