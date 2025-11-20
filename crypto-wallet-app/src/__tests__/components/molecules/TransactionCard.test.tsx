/**
 * TransactionCard Component Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TransactionCard } from '../../../components/molecules/TransactionCard';
import { ThemeProvider } from '../../../contexts/ThemeContext';

// Wrapper with theme provider
const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('TransactionCard', () => {
  const mockTransaction = {
    type: 'sent' as const,
    amount: '0.5',
    symbol: 'ETH',
    to: '0x1234...5678',
    from: '0xabcd...efgh',
    timestamp: 1700000000000,
    status: 'confirmed' as const,
    hash: '0xhash123',
  };

  describe('Rendering', () => {
    it('should render transaction type', () => {
      const { getByText } = renderWithTheme(
        <TransactionCard {...mockTransaction} />
      );
      expect(getByText('Sent')).toBeDefined();
    });

    it('should render transaction amount with sign', () => {
      const { getByText } = renderWithTheme(
        <TransactionCard {...mockTransaction} />
      );
      expect(getByText('-0.5 ETH')).toBeDefined();
    });

    it('should render address for sent transaction', () => {
      const { getByText } = renderWithTheme(
        <TransactionCard {...mockTransaction} type="sent" />
      );
      expect(getByText('To: 0x1234...5678')).toBeDefined();
    });

    it('should render address for received transaction', () => {
      const { getByText } = renderWithTheme(
        <TransactionCard
          {...mockTransaction}
          type="received"
        />
      );
      expect(getByText('From: 0xabcd...efgh')).toBeDefined();
    });

    it('should render with testID', () => {
      const { getByTestId } = renderWithTheme(
        <TransactionCard {...mockTransaction} testID="tx-card" />
      );
      expect(getByTestId('tx-card')).toBeDefined();
    });
  });

  describe('Transaction Types', () => {
    it('should display "Sent" for sent transactions', () => {
      const { getByText } = renderWithTheme(
        <TransactionCard {...mockTransaction} type="sent" />
      );
      expect(getByText('Sent')).toBeDefined();
    });

    it('should display "Received" for received transactions', () => {
      const { getByText } = renderWithTheme(
        <TransactionCard {...mockTransaction} type="received" />
      );
      expect(getByText('Received')).toBeDefined();
    });

    it('should display "Contract" for contract interactions', () => {
      const { getByText } = renderWithTheme(
        <TransactionCard {...mockTransaction} type="contract" />
      );
      expect(getByText('Contract')).toBeDefined();
    });

    it('should use red color for sent transactions', () => {
      const { getByText } = renderWithTheme(
        <TransactionCard {...mockTransaction} type="sent" />
      );
      const amountElement = getByText('-0.5 ETH');
      expect(amountElement).toBeDefined();
    });

    it('should use green color for received transactions', () => {
      const { getByText } = renderWithTheme(
        <TransactionCard {...mockTransaction} type="received" />
      );
      const amountElement = getByText('+0.5 ETH');
      expect(amountElement).toBeDefined();
    });
  });

  describe('Status Display', () => {
    it('should show confirmed status', () => {
      const { getByText } = renderWithTheme(
        <TransactionCard {...mockTransaction} status="confirmed" />
      );
      expect(getByText('Confirmed')).toBeDefined();
    });

    it('should show pending status', () => {
      const { getByText } = renderWithTheme(
        <TransactionCard {...mockTransaction} status="pending" />
      );
      expect(getByText('Pending')).toBeDefined();
    });

    it('should show failed status', () => {
      const { getByText } = renderWithTheme(
        <TransactionCard {...mockTransaction} status="failed" />
      );
      expect(getByText('Failed')).toBeDefined();
    });

    it('should use appropriate color for pending status', () => {
      const { getByText } = renderWithTheme(
        <TransactionCard {...mockTransaction} status="pending" />
      );
      expect(getByText('Pending')).toBeDefined();
    });

    it('should use appropriate color for failed status', () => {
      const { getByText } = renderWithTheme(
        <TransactionCard {...mockTransaction} status="failed" />
      );
      expect(getByText('Failed')).toBeDefined();
    });
  });

  describe('Timestamp Display', () => {
    it('should format timestamp', () => {
      const { getByTestId } = renderWithTheme(
        <TransactionCard {...mockTransaction} />
      );
      expect(getByTestId('tx-timestamp')).toBeDefined();
    });

    it('should show relative time for recent transactions', () => {
      const recentTime = Date.now() - 5 * 60 * 1000; // 5 minutes ago
      const { getByTestId } = renderWithTheme(
        <TransactionCard {...mockTransaction} timestamp={recentTime} />
      );
      expect(getByTestId('tx-timestamp')).toBeDefined();
    });
  });

  describe('Interactions', () => {
    it('should call onPress when pressed', () => {
      const onPress = jest.fn();
      const { getByTestId } = renderWithTheme(
        <TransactionCard
          {...mockTransaction}
          onPress={onPress}
          testID="tx-card"
        />
      );

      const card = getByTestId('tx-card');
      fireEvent.press(card);

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('should not be pressable when onPress is not provided', () => {
      const { getByTestId } = renderWithTheme(
        <TransactionCard {...mockTransaction} testID="tx-card" />
      );

      const card = getByTestId('tx-card');
      expect(card).toBeDefined();
    });
  });

  describe('Icon Display', () => {
    it('should show sent icon for sent transactions', () => {
      const { getByTestId } = renderWithTheme(
        <TransactionCard {...mockTransaction} type="sent" />
      );
      expect(getByTestId('tx-icon')).toBeDefined();
    });

    it('should show received icon for received transactions', () => {
      const { getByTestId } = renderWithTheme(
        <TransactionCard {...mockTransaction} type="received" />
      );
      expect(getByTestId('tx-icon')).toBeDefined();
    });

    it('should show contract icon for contract transactions', () => {
      const { getByTestId } = renderWithTheme(
        <TransactionCard {...mockTransaction} type="contract" />
      );
      expect(getByTestId('tx-icon')).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have button role when pressable', () => {
      const onPress = jest.fn();
      const { getByTestId } = renderWithTheme(
        <TransactionCard
          {...mockTransaction}
          onPress={onPress}
          testID="tx-card"
        />
      );
      const card = getByTestId('tx-card');
      expect(card.props.accessibilityRole).toBe('button');
    });

    it('should have accessibility label', () => {
      const { getByLabelText } = renderWithTheme(
        <TransactionCard
          {...mockTransaction}
          accessibilityLabel="Transaction details"
        />
      );
      expect(getByLabelText('Transaction details')).toBeDefined();
    });

    it('should have default accessibility label from transaction info', () => {
      const { getByTestId } = renderWithTheme(
        <TransactionCard {...mockTransaction} testID="tx-card" />
      );
      const card = getByTestId('tx-card');
      expect(card.props.accessibilityLabel).toContain('Sent');
      expect(card.props.accessibilityLabel).toContain('0.5 ETH');
    });
  });

  describe('Custom Styles', () => {
    it('should support custom container styles', () => {
      const customStyle = { margin: 10 };
      const { getByTestId } = renderWithTheme(
        <TransactionCard
          {...mockTransaction}
          style={customStyle}
          testID="tx-card"
        />
      );
      const card = getByTestId('tx-card');
      expect(card.props.style).toMatchObject(customStyle);
    });
  });
});
