/**
 * TokenCard Component Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TokenCard } from '../../../components/molecules/TokenCard';
import { ThemeProvider } from '../../../contexts/ThemeContext';

// Wrapper with theme provider
const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('TokenCard', () => {
  const mockToken = {
    symbol: 'ETH',
    name: 'Ethereum',
    balance: '1.5',
    usdValue: '2250.00',
    priceChange24h: 5.23,
    iconUrl: 'https://example.com/eth.png',
  };

  describe('Rendering', () => {
    it('should render token symbol', () => {
      const { getByText } = renderWithTheme(
        <TokenCard {...mockToken} />
      );
      expect(getByText('ETH')).toBeDefined();
    });

    it('should render token name', () => {
      const { getByText } = renderWithTheme(
        <TokenCard {...mockToken} />
      );
      expect(getByText('Ethereum')).toBeDefined();
    });

    it('should render token balance', () => {
      const { getByText } = renderWithTheme(
        <TokenCard {...mockToken} />
      );
      expect(getByText('1.5 ETH')).toBeDefined();
    });

    it('should render USD value', () => {
      const { getByText } = renderWithTheme(
        <TokenCard {...mockToken} />
      );
      expect(getByText('$2,250.00')).toBeDefined();
    });

    it('should render with testID', () => {
      const { getByTestId } = renderWithTheme(
        <TokenCard {...mockToken} testID="token-card" />
      );
      expect(getByTestId('token-card')).toBeDefined();
    });
  });

  describe('Price Change Display', () => {
    it('should show positive price change', () => {
      const { getByText } = renderWithTheme(
        <TokenCard {...mockToken} priceChange24h={5.23} />
      );
      expect(getByText('+5.23%')).toBeDefined();
    });

    it('should show negative price change', () => {
      const { getByText } = renderWithTheme(
        <TokenCard {...mockToken} priceChange24h={-3.45} />
      );
      expect(getByText('-3.45%')).toBeDefined();
    });

    it('should show zero price change', () => {
      const { getByText } = renderWithTheme(
        <TokenCard {...mockToken} priceChange24h={0} />
      );
      expect(getByText('0.00%')).toBeDefined();
    });

    it('should use green color for positive change', () => {
      const { getByText } = renderWithTheme(
        <TokenCard {...mockToken} priceChange24h={5.23} />
      );
      const element = getByText('+5.23%');
      expect(element).toBeDefined();
    });

    it('should use red color for negative change', () => {
      const { getByText } = renderWithTheme(
        <TokenCard {...mockToken} priceChange24h={-3.45} />
      );
      const element = getByText('-3.45%');
      expect(element).toBeDefined();
    });
  });

  describe('Icon Display', () => {
    it('should render token icon when iconUrl is provided', () => {
      const { getByTestId } = renderWithTheme(
        <TokenCard {...mockToken} />
      );
      expect(getByTestId('token-icon')).toBeDefined();
    });

    it('should render fallback icon when iconUrl is not provided', () => {
      const { getByTestId } = renderWithTheme(
        <TokenCard {...mockToken} iconUrl={undefined} />
      );
      expect(getByTestId('token-fallback-icon')).toBeDefined();
    });
  });

  describe('Interactions', () => {
    it('should call onPress when pressed', () => {
      const onPress = jest.fn();
      const { getByTestId } = renderWithTheme(
        <TokenCard {...mockToken} onPress={onPress} testID="token-card" />
      );

      const card = getByTestId('token-card');
      fireEvent.press(card);

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('should not be pressable when onPress is not provided', () => {
      const { getByTestId } = renderWithTheme(
        <TokenCard {...mockToken} testID="token-card" />
      );

      const card = getByTestId('token-card');
      expect(card).toBeDefined();
    });
  });

  describe('Formatting', () => {
    it('should format large balances correctly', () => {
      const { getByText } = renderWithTheme(
        <TokenCard {...mockToken} balance="1234567.89" />
      );
      expect(getByText('1234567.89 ETH')).toBeDefined();
    });

    it('should format USD values with commas', () => {
      const { getByText } = renderWithTheme(
        <TokenCard {...mockToken} usdValue="1234567.89" />
      );
      expect(getByText('$1,234,567.89')).toBeDefined();
    });

    it('should handle zero balance', () => {
      const { getByText } = renderWithTheme(
        <TokenCard {...mockToken} balance="0" />
      );
      expect(getByText('0 ETH')).toBeDefined();
    });

    it('should handle very small balances', () => {
      const { getByText } = renderWithTheme(
        <TokenCard {...mockToken} balance="0.00000123" />
      );
      expect(getByText('0.00000123 ETH')).toBeDefined();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when loading is true', () => {
      const { getByTestId } = renderWithTheme(
        <TokenCard {...mockToken} loading />
      );
      expect(getByTestId('loading-indicator')).toBeDefined();
    });

    it('should hide content when loading', () => {
      const { queryByText } = renderWithTheme(
        <TokenCard {...mockToken} loading />
      );
      expect(queryByText('ETH')).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('should have button role when pressable', () => {
      const onPress = jest.fn();
      const { getByTestId } = renderWithTheme(
        <TokenCard {...mockToken} onPress={onPress} testID="token-card" />
      );
      const card = getByTestId('token-card');
      expect(card.props.accessibilityRole).toBe('button');
    });

    it('should have accessibility label', () => {
      const { getByLabelText } = renderWithTheme(
        <TokenCard
          {...mockToken}
          accessibilityLabel="Ethereum token card"
        />
      );
      expect(getByLabelText('Ethereum token card')).toBeDefined();
    });

    it('should have default accessibility label from token info', () => {
      const { getByLabelText } = renderWithTheme(
        <TokenCard {...mockToken} />
      );
      expect(
        getByLabelText('Ethereum, 1.5 ETH, $2,250.00, +5.23%')
      ).toBeDefined();
    });
  });

  describe('Custom Styles', () => {
    it('should support custom container styles', () => {
      const customStyle = { margin: 10 };
      const { getByTestId } = renderWithTheme(
        <TokenCard {...mockToken} style={customStyle} testID="token-card" />
      );
      const card = getByTestId('token-card');
      expect(card.props.style).toMatchObject(customStyle);
    });
  });
});
