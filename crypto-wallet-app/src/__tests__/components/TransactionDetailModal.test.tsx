/**
 * TransactionDetailModal Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { TransactionDetailModal } from '../../components/organisms/TransactionDetailModal';
import { renderWithProviders } from '../utils/testUtils';

const mockTransaction = {
  id: '1',
  type: 'sent' as const,
  amount: '0.5',
  token: 'ETH',
  address: '0x1234567890123456789012345678901234567890',
  hash: '0xabcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234',
  status: 'confirmed' as const,
  timestamp: Date.now() - 1000 * 60 * 30,
  fee: '0.0021',
  blockNumber: 12345678,
  nonce: 42,
};

const mockOnClose = jest.fn();

// Helper to render with theme
const renderWithTheme = (component: React.ReactElement) => {
  return renderWithProviders(component);
};

describe('TransactionDetailModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render when visible', () => {
      const { getByText } = renderWithTheme(
        <TransactionDetailModal
          visible={true}
          transaction={mockTransaction}
          onClose={mockOnClose}
        />
      );

      expect(getByText('Transaction Details')).toBeDefined();
    });

    it('should not render when not visible', () => {
      const { queryByText } = renderWithTheme(
        <TransactionDetailModal
          visible={false}
          transaction={mockTransaction}
          onClose={mockOnClose}
        />
      );

      expect(queryByText('Transaction Details')).toBeNull();
    });
  });

  describe('Transaction Info', () => {
    it('should display transaction type', () => {
      const { getByText } = renderWithTheme(
        <TransactionDetailModal
          visible={true}
          transaction={mockTransaction}
          onClose={mockOnClose}
        />
      );

      expect(getByText(/Sent/i)).toBeDefined();
    });

    it('should display amount and token', () => {
      const { getAllByText } = renderWithTheme(
        <TransactionDetailModal
          visible={true}
          transaction={mockTransaction}
          onClose={mockOnClose}
        />
      );

      // Amount is displayed as "-0.5 ETH" for sent transactions
      expect(getAllByText(/0\.5/).length).toBeGreaterThan(0);
      // ETH appears in amount and fee
      expect(getAllByText(/ETH/).length).toBeGreaterThan(0);
    });

    it('should display status', () => {
      const { getByText } = renderWithTheme(
        <TransactionDetailModal
          visible={true}
          transaction={mockTransaction}
          onClose={mockOnClose}
        />
      );

      expect(getByText(/Confirmed/i)).toBeDefined();
    });

    it('should display transaction hash', () => {
      const { getByText } = renderWithTheme(
        <TransactionDetailModal
          visible={true}
          transaction={mockTransaction}
          onClose={mockOnClose}
        />
      );

      expect(getByText(/0xabcd...1234/)).toBeDefined();
    });

    it('should display address', () => {
      const { getByText } = renderWithTheme(
        <TransactionDetailModal
          visible={true}
          transaction={mockTransaction}
          onClose={mockOnClose}
        />
      );

      expect(getByText(/0x1234...7890/)).toBeDefined();
    });

    it('should display network fee', () => {
      const { getByText } = renderWithTheme(
        <TransactionDetailModal
          visible={true}
          transaction={mockTransaction}
          onClose={mockOnClose}
        />
      );

      expect(getByText(/0.0021/)).toBeDefined();
    });

    it('should display block number', () => {
      const { getByText } = renderWithTheme(
        <TransactionDetailModal
          visible={true}
          transaction={mockTransaction}
          onClose={mockOnClose}
        />
      );

      expect(getByText(/12345678/)).toBeDefined();
    });
  });

  describe('Actions', () => {
    it('should have close button', () => {
      const { getByTestId } = renderWithTheme(
        <TransactionDetailModal
          visible={true}
          transaction={mockTransaction}
          onClose={mockOnClose}
        />
      );

      expect(getByTestId('close-button')).toBeDefined();
    });

    it('should call onClose when close button is pressed', () => {
      const { getByTestId } = renderWithTheme(
        <TransactionDetailModal
          visible={true}
          transaction={mockTransaction}
          onClose={mockOnClose}
        />
      );

      fireEvent.press(getByTestId('close-button'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should have copy hash button', () => {
      const { getByTestId } = renderWithTheme(
        <TransactionDetailModal
          visible={true}
          transaction={mockTransaction}
          onClose={mockOnClose}
        />
      );

      expect(getByTestId('copy-hash')).toBeDefined();
    });

    it('should have view on explorer button', () => {
      const { getByText } = renderWithTheme(
        <TransactionDetailModal
          visible={true}
          transaction={mockTransaction}
          onClose={mockOnClose}
        />
      );

      expect(getByText(/View on Explorer/i)).toBeDefined();
    });
  });

  describe('Timestamp', () => {
    it('should display formatted timestamp', () => {
      const { getByTestId } = renderWithTheme(
        <TransactionDetailModal
          visible={true}
          transaction={mockTransaction}
          onClose={mockOnClose}
        />
      );

      expect(getByTestId('timestamp')).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible close button', () => {
      const { getByLabelText } = renderWithTheme(
        <TransactionDetailModal
          visible={true}
          transaction={mockTransaction}
          onClose={mockOnClose}
        />
      );

      expect(getByLabelText('Close')).toBeDefined();
    });
  });
});
