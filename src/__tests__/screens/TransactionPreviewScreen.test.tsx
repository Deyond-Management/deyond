/**
 * TransactionPreviewScreen Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { TransactionPreviewScreen } from '../../screens/TransactionPreviewScreen';
import { renderWithProviders } from '../utils/testUtils';

// Mock navigation and route
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

const mockRoute = {
  params: {
    to: '0x1234567890123456789012345678901234567890',
    amount: '0.5',
    token: 'ETH',
    networkFee: '0.0021',
  },
};

// Helper to render with theme
const renderWithTheme = (component: React.ReactElement) => {
  return renderWithProviders(component);
};

describe('TransactionPreviewScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render transaction preview title', () => {
      const { getByText } = renderWithTheme(
        <TransactionPreviewScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      expect(getByText('Confirm Transaction')).toBeDefined();
    });

    it('should display recipient address', () => {
      const { getByText } = renderWithTheme(
        <TransactionPreviewScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      expect(getByText(/0x1234...7890/)).toBeDefined();
    });

    it('should display amount and token', () => {
      const { getByText } = renderWithTheme(
        <TransactionPreviewScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      expect(getByText('0.5 ETH')).toBeDefined();
    });

    it('should display network fee', () => {
      const { getByText } = renderWithTheme(
        <TransactionPreviewScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      expect(getByText(/Network Fee/i)).toBeDefined();
      expect(getByText(/0.0021/)).toBeDefined();
    });

    it('should display total amount', () => {
      const { getByText } = renderWithTheme(
        <TransactionPreviewScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      expect(getByText(/Total/i)).toBeDefined();
    });
  });

  describe('Transaction Details', () => {
    it('should show from address', () => {
      const { getByText } = renderWithTheme(
        <TransactionPreviewScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      expect(getByText(/From/i)).toBeDefined();
    });

    it('should show to address', () => {
      const { getAllByText } = renderWithTheme(
        <TransactionPreviewScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      // "To" appears in the label, get all matches
      const toElements = getAllByText(/To/i);
      expect(toElements.length).toBeGreaterThan(0);
    });

    it('should show USD equivalent', () => {
      const { getByTestId } = renderWithTheme(
        <TransactionPreviewScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      expect(getByTestId('usd-value')).toBeDefined();
    });
  });

  describe('Gas Details', () => {
    it('should show gas limit', () => {
      const { getByText } = renderWithTheme(
        <TransactionPreviewScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      expect(getByText(/Gas Limit/i)).toBeDefined();
    });

    it('should show max fee', () => {
      const { getByText } = renderWithTheme(
        <TransactionPreviewScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      expect(getByText(/Max Fee/i)).toBeDefined();
    });
  });

  describe('Actions', () => {
    it('should have confirm button', () => {
      const { getByText } = renderWithTheme(
        <TransactionPreviewScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      expect(getByText('Confirm')).toBeDefined();
    });

    it('should have edit button', () => {
      const { getByText } = renderWithTheme(
        <TransactionPreviewScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      expect(getByText('Edit')).toBeDefined();
    });

    it('should navigate back when edit is pressed', () => {
      const { getByText } = renderWithTheme(
        <TransactionPreviewScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      fireEvent.press(getByText('Edit'));

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });

    it('should navigate to status screen when confirm is pressed', () => {
      const { getByText } = renderWithTheme(
        <TransactionPreviewScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      fireEvent.press(getByText('Confirm'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        'TransactionStatus',
        expect.any(Object)
      );
    });
  });

  describe('Security Warning', () => {
    it('should show warning for new addresses', () => {
      const { getByText } = renderWithTheme(
        <TransactionPreviewScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      expect(getByText(/First transaction to this address/i)).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible confirm button', () => {
      const { getByLabelText } = renderWithTheme(
        <TransactionPreviewScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      expect(getByLabelText('Confirm')).toBeDefined();
    });
  });
});
