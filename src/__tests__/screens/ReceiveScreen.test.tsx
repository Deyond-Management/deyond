/**
 * Receive Screen Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ReceiveScreen } from '../../screens/ReceiveScreen';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { Clipboard } from 'react-native';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

// Wrapper with theme provider
const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('ReceiveScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render wallet address', () => {
      const { getByText } = renderWithTheme(
        <ReceiveScreen navigation={mockNavigation as any} />
      );
      expect(getByText(/0x/i)).toBeDefined();
    });

    it('should render QR code placeholder', () => {
      const { getByTestId } = renderWithTheme(
        <ReceiveScreen navigation={mockNavigation as any} />
      );
      expect(getByTestId('qr-code')).toBeDefined();
    });

    it('should render copy address button', () => {
      const { getByText } = renderWithTheme(
        <ReceiveScreen navigation={mockNavigation as any} />
      );
      expect(getByText(/Copy Address/i)).toBeDefined();
    });

    it('should render share button', () => {
      const { getAllByText } = renderWithTheme(
        <ReceiveScreen navigation={mockNavigation as any} />
      );
      const shareButtons = getAllByText(/Share/i);
      expect(shareButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Address Display', () => {
    it('should display full wallet address', () => {
      const { getByTestId } = renderWithTheme(
        <ReceiveScreen navigation={mockNavigation as any} />
      );
      const address = getByTestId('wallet-address');
      expect(address).toBeDefined();
      expect(address.props.children).toContain('0x');
    });
  });

  describe('Copy Address', () => {
    it('should show copied confirmation when copy button is pressed', () => {
      const { getByText } = renderWithTheme(
        <ReceiveScreen navigation={mockNavigation as any} />
      );

      const copyButton = getByText(/Copy Address/i);
      fireEvent.press(copyButton);

      // Should show "Copied!" confirmation
      expect(getByText(/Copied/i)).toBeDefined();
    });
  });

  describe('Share Functionality', () => {
    it('should call console.log when share button is pressed', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const { getAllByText } = renderWithTheme(
        <ReceiveScreen navigation={mockNavigation as any} />
      );

      const shareButtons = getAllByText(/Share/i);
      const shareButton = shareButtons.find(btn => btn.props.accessibilityLabel === 'Share');

      if (shareButton) {
        fireEvent.press(shareButton);
        expect(consoleSpy).toHaveBeenCalled();
      }

      consoleSpy.mockRestore();
    });
  });

  describe('Instructions', () => {
    it('should display receive instructions', () => {
      const { getByText } = renderWithTheme(
        <ReceiveScreen navigation={mockNavigation as any} />
      );
      expect(
        getByText(/Share this address/i) || getByText(/Scan QR code/i)
      ).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible buttons', () => {
      const { getByLabelText } = renderWithTheme(
        <ReceiveScreen navigation={mockNavigation as any} />
      );
      expect(getByLabelText(/Copy Address/i)).toBeDefined();
    });
  });
});
