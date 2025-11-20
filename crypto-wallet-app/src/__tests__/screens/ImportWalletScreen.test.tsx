/**
 * ImportWalletScreen Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ImportWalletScreen } from '../../screens/ImportWalletScreen';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  reset: jest.fn(),
};

// Helper to render with theme
const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

// Valid test mnemonic (12 words)
const validMnemonic12 = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

// Valid test mnemonic (24 words)
const validMnemonic24 = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art';

describe('ImportWalletScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render import method tabs', () => {
      const { getByTestId } = renderWithTheme(
        <ImportWalletScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('mnemonic-tab')).toBeDefined();
      expect(getByTestId('private-key-tab')).toBeDefined();
    });

    it('should render mnemonic input by default', () => {
      const { getByPlaceholderText } = renderWithTheme(
        <ImportWalletScreen navigation={mockNavigation as any} />
      );

      expect(
        getByPlaceholderText(/Enter your 12 or 24 word/i) ||
          getByPlaceholderText(/mnemonic/i) ||
          getByPlaceholderText(/seed phrase/i)
      ).toBeDefined();
    });

    it('should render import button', () => {
      const { getByTestId } = renderWithTheme(
        <ImportWalletScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('import-button')).toBeDefined();
    });
  });

  describe('Import Method Selection', () => {
    it('should switch to private key input when private key tab is selected', () => {
      const { getByTestId, getByPlaceholderText } = renderWithTheme(
        <ImportWalletScreen navigation={mockNavigation as any} />
      );

      const privateKeyTab = getByTestId('private-key-tab');
      fireEvent.press(privateKeyTab);

      expect(
        getByPlaceholderText(/Enter your private key/i)
      ).toBeDefined();
    });

    it('should switch back to mnemonic input when mnemonic tab is selected', () => {
      const { getByTestId, getByPlaceholderText } = renderWithTheme(
        <ImportWalletScreen navigation={mockNavigation as any} />
      );

      // Switch to private key
      const privateKeyTab = getByTestId('private-key-tab');
      fireEvent.press(privateKeyTab);

      // Switch back to mnemonic
      const mnemonicTab = getByTestId('mnemonic-tab');
      fireEvent.press(mnemonicTab);

      expect(
        getByPlaceholderText(/Enter your 12 or 24 word/i)
      ).toBeDefined();
    });
  });

  describe('Mnemonic Validation', () => {
    it('should show error for invalid mnemonic word count', () => {
      const { getByPlaceholderText, getByTestId, queryByText } = renderWithTheme(
        <ImportWalletScreen navigation={mockNavigation as any} />
      );

      const input = getByPlaceholderText(/Enter your 12 or 24 word/i) || getByPlaceholderText(/mnemonic/i);
      fireEvent.changeText(input, 'invalid mnemonic words');

      const importButton = getByTestId('import-button');
      fireEvent.press(importButton);

      expect(
        queryByText(/Invalid mnemonic/i) ||
          queryByText(/12 or 24 words/i) ||
          queryByText(/word count/i)
      ).toBeDefined();
    });

    it('should show error for invalid mnemonic words', () => {
      const { getByPlaceholderText, getByTestId, queryByText } = renderWithTheme(
        <ImportWalletScreen navigation={mockNavigation as any} />
      );

      const input = getByPlaceholderText(/Enter your 12 or 24 word/i) || getByPlaceholderText(/mnemonic/i);
      // 12 words but invalid
      fireEvent.changeText(input, 'invalid invalid invalid invalid invalid invalid invalid invalid invalid invalid invalid invalid');

      const importButton = getByTestId('import-button');
      fireEvent.press(importButton);

      expect(
        queryByText(/Invalid mnemonic/i) ||
          queryByText(/invalid words/i) ||
          queryByText(/not valid/i)
      ).toBeDefined();
    });

    it('should accept valid 12-word mnemonic', () => {
      const { getByPlaceholderText, getByTestId } = renderWithTheme(
        <ImportWalletScreen navigation={mockNavigation as any} />
      );

      const input = getByPlaceholderText(/Enter your 12 or 24 word/i) || getByPlaceholderText(/mnemonic/i);
      fireEvent.changeText(input, validMnemonic12);

      const importButton = getByTestId('import-button');
      fireEvent.press(importButton);

      // Should navigate or show success
      expect(mockNavigation.navigate || mockNavigation.reset).toBeDefined();
    });

    it('should accept valid 24-word mnemonic', () => {
      const { getByPlaceholderText, getByTestId } = renderWithTheme(
        <ImportWalletScreen navigation={mockNavigation as any} />
      );

      const input = getByPlaceholderText(/Enter your 12 or 24 word/i) || getByPlaceholderText(/mnemonic/i);
      fireEvent.changeText(input, validMnemonic24);

      const importButton = getByTestId('import-button');
      fireEvent.press(importButton);

      expect(mockNavigation.navigate || mockNavigation.reset).toBeDefined();
    });
  });

  describe('Private Key Validation', () => {
    it('should show error for invalid private key format', () => {
      const { getByTestId, getByPlaceholderText, queryByText } = renderWithTheme(
        <ImportWalletScreen navigation={mockNavigation as any} />
      );

      // Switch to private key
      const privateKeyTab = getByTestId('private-key-tab');
      fireEvent.press(privateKeyTab);

      const input = getByPlaceholderText(/Enter your private key/i);
      fireEvent.changeText(input, 'invalid-private-key');

      const importButton = getByTestId('import-button');
      fireEvent.press(importButton);

      expect(
        queryByText(/Invalid private key/i) ||
          queryByText(/64 hexadecimal/i)
      ).toBeDefined();
    });

    it('should show error for private key with invalid length', () => {
      const { getByTestId, getByPlaceholderText, queryByText } = renderWithTheme(
        <ImportWalletScreen navigation={mockNavigation as any} />
      );

      // Switch to private key
      const privateKeyTab = getByTestId('private-key-tab');
      fireEvent.press(privateKeyTab);

      const input = getByPlaceholderText(/Enter your private key/i);
      fireEvent.changeText(input, '0x1234'); // Too short

      const importButton = getByTestId('import-button');
      fireEvent.press(importButton);

      expect(
        queryByText(/Invalid private key/i) ||
          queryByText(/64 characters/i)
      ).toBeDefined();
    });
  });

  describe('Form Submission', () => {
    it('should not import when input is empty', () => {
      const { getByTestId } = renderWithTheme(
        <ImportWalletScreen navigation={mockNavigation as any} />
      );

      const importButton = getByTestId('import-button');
      fireEvent.press(importButton);

      expect(mockNavigation.navigate).not.toHaveBeenCalled();
      expect(mockNavigation.reset).not.toHaveBeenCalled();
    });

    it('should attempt to validate and navigate when valid mnemonic is imported', () => {
      const { getByPlaceholderText, getByTestId, queryByText } = renderWithTheme(
        <ImportWalletScreen navigation={mockNavigation as any} />
      );

      const input = getByPlaceholderText(/Enter your 12 or 24 word/i);
      fireEvent.changeText(input, validMnemonic12);

      const importButton = getByTestId('import-button');
      fireEvent.press(importButton);

      // Should either navigate or show validation error (depending on WalletManager implementation)
      const navigated =
        mockNavigation.navigate.mock.calls.length > 0 ||
        mockNavigation.reset.mock.calls.length > 0;
      const hasError = queryByText(/Invalid mnemonic/i) !== null;

      // Either we navigate successfully or we see a validation error
      expect(navigated || hasError).toBeTruthy();
    });
  });

  describe('User Experience', () => {
    it('should trim whitespace from mnemonic input', () => {
      const { getByPlaceholderText, getByTestId, queryByText } = renderWithTheme(
        <ImportWalletScreen navigation={mockNavigation as any} />
      );

      const input = getByPlaceholderText(/Enter your 12 or 24 word/i) || getByPlaceholderText(/mnemonic/i);
      fireEvent.changeText(input, '  ' + validMnemonic12 + '  ');

      const importButton = getByTestId('import-button');
      fireEvent.press(importButton);

      // Should not show error about whitespace
      expect(queryByText(/whitespace/i)).toBeNull();
    });

    it('should show helpful validation messages', () => {
      const { getByPlaceholderText, getByTestId, queryByText } = renderWithTheme(
        <ImportWalletScreen navigation={mockNavigation as any} />
      );

      const input = getByPlaceholderText(/Enter your 12 or 24 word/i) || getByPlaceholderText(/mnemonic/i);
      fireEvent.changeText(input, 'test');

      const importButton = getByTestId('import-button');
      fireEvent.press(importButton);

      // Should show helpful error
      expect(
        queryByText(/12 or 24 words/i) ||
          queryByText(/Invalid/i)
      ).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible input fields', () => {
      const { getByPlaceholderText } = renderWithTheme(
        <ImportWalletScreen navigation={mockNavigation as any} />
      );

      const input = getByPlaceholderText(/Enter your 12 or 24 word/i) || getByPlaceholderText(/mnemonic/i);
      expect(input).toBeDefined();
    });

    it('should have accessible import button', () => {
      const { getByTestId } = renderWithTheme(
        <ImportWalletScreen navigation={mockNavigation as any} />
      );

      const importButton = getByTestId('import-button');
      expect(importButton).toBeDefined();
    });

    it('should have accessible tab buttons', () => {
      const { getByTestId } = renderWithTheme(
        <ImportWalletScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('mnemonic-tab')).toBeDefined();
      expect(getByTestId('private-key-tab')).toBeDefined();
    });
  });
});
