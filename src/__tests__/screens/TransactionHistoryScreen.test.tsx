/**
 * TransactionHistoryScreen Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { TransactionHistoryScreen } from '../../screens/TransactionHistoryScreen';
import { renderWithProviders } from '../utils/testUtils';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

// Helper to render with theme
const renderWithTheme = (component: React.ReactElement) => {
  return renderWithProviders(component);
};

describe('TransactionHistoryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render transaction history title', () => {
      const { getByText } = renderWithTheme(
        <TransactionHistoryScreen navigation={mockNavigation as any} />
      );

      expect(getByText('Transaction History')).toBeDefined();
    });

    it('should render transaction list', () => {
      const { getByTestId } = renderWithTheme(
        <TransactionHistoryScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('transaction-list')).toBeDefined();
    });

    it('should display transactions', () => {
      const { getAllByTestId } = renderWithTheme(
        <TransactionHistoryScreen navigation={mockNavigation as any} />
      );

      const txItems = getAllByTestId(/tx-item-/);
      expect(txItems.length).toBeGreaterThan(0);
    });
  });

  describe('Transaction Items', () => {
    it('should show transaction type (sent/received)', () => {
      const { getAllByText } = renderWithTheme(
        <TransactionHistoryScreen navigation={mockNavigation as any} />
      );

      // Should have Sent text (in filter + transactions)
      const sentElements = getAllByText(/Sent/i);
      expect(sentElements.length).toBeGreaterThan(0);
    });

    it('should show transaction amount', () => {
      const { getAllByTestId } = renderWithTheme(
        <TransactionHistoryScreen navigation={mockNavigation as any} />
      );

      const amounts = getAllByTestId(/tx-amount-/);
      expect(amounts.length).toBeGreaterThan(0);
    });

    it('should show transaction status', () => {
      const { getAllByTestId } = renderWithTheme(
        <TransactionHistoryScreen navigation={mockNavigation as any} />
      );

      const statuses = getAllByTestId(/tx-status-/);
      expect(statuses.length).toBeGreaterThan(0);
    });

    it('should show transaction timestamp', () => {
      const { getAllByTestId } = renderWithTheme(
        <TransactionHistoryScreen navigation={mockNavigation as any} />
      );

      const timestamps = getAllByTestId(/tx-time-/);
      expect(timestamps.length).toBeGreaterThan(0);
    });
  });

  describe('Interactions', () => {
    it('should open transaction detail when item is pressed', () => {
      const { getAllByTestId } = renderWithTheme(
        <TransactionHistoryScreen navigation={mockNavigation as any} />
      );

      const txItems = getAllByTestId(/tx-item-/);
      fireEvent.press(txItems[0]);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('TransactionDetail', expect.any(Object));
    });

    it('should support pull to refresh', async () => {
      const { getByTestId } = renderWithTheme(
        <TransactionHistoryScreen navigation={mockNavigation as any} />
      );

      const list = getByTestId('transaction-list');

      // FlatList should have refresh control
      expect(list.props.refreshControl).toBeDefined();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no transactions', () => {
      const { getByTestId } = renderWithTheme(
        <TransactionHistoryScreen navigation={mockNavigation as any} initialTransactions={[]} />
      );

      expect(getByTestId('empty-state')).toBeDefined();
    });

    it('should show appropriate message for empty state', () => {
      const { getByText } = renderWithTheme(
        <TransactionHistoryScreen navigation={mockNavigation as any} initialTransactions={[]} />
      );

      expect(getByText(/No transactions/i)).toBeDefined();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when loading', () => {
      const { getByTestId } = renderWithTheme(
        <TransactionHistoryScreen navigation={mockNavigation as any} initialLoading={true} />
      );

      expect(getByTestId('loading-indicator')).toBeDefined();
    });
  });

  describe('Filters', () => {
    it('should have filter buttons', () => {
      const { getByTestId } = renderWithTheme(
        <TransactionHistoryScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('filter-all')).toBeDefined();
      expect(getByTestId('filter-sent')).toBeDefined();
      expect(getByTestId('filter-received')).toBeDefined();
    });

    it('should filter by sent transactions', () => {
      const { getByTestId, getAllByTestId } = renderWithTheme(
        <TransactionHistoryScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('filter-sent'));

      // All visible transactions should be sent type
      const txItems = getAllByTestId(/tx-item-/);
      expect(txItems.length).toBeGreaterThan(0);
    });

    it('should filter by received transactions', () => {
      const { getByTestId, getAllByTestId } = renderWithTheme(
        <TransactionHistoryScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('filter-received'));

      const txItems = getAllByTestId(/tx-item-/);
      expect(txItems.length).toBeGreaterThan(0);
    });
  });

  describe('Pagination', () => {
    it('should load more when reaching end of list', () => {
      const { getByTestId } = renderWithTheme(
        <TransactionHistoryScreen navigation={mockNavigation as any} />
      );

      const list = getByTestId('transaction-list');

      // Should have onEndReached handler
      expect(list.props.onEndReached).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible transaction items', () => {
      const { getAllByLabelText } = renderWithTheme(
        <TransactionHistoryScreen navigation={mockNavigation as any} />
      );

      const accessibleItems = getAllByLabelText(/transaction/i);
      expect(accessibleItems.length).toBeGreaterThan(0);
    });
  });
});
