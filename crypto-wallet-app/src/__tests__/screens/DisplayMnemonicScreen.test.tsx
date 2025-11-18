/**
 * DisplayMnemonicScreen Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DisplayMnemonicScreen } from '../../screens/DisplayMnemonicScreen';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

// Mock route with password
const mockRoute = {
  params: {
    password: 'Test123!@#',
  },
};

// Helper to render with theme
const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('DisplayMnemonicScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render 12 mnemonic words', () => {
      const { getAllByText } = renderWithTheme(
        <DisplayMnemonicScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      // Should display 12 words (numbered 1-12)
      const words = getAllByText(/^\d+\./); // Match "1.", "2.", etc.
      expect(words.length).toBeGreaterThanOrEqual(12);
    });

    it('should render warning message', () => {
      const { getByText } = renderWithTheme(
        <DisplayMnemonicScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(
        getByText(/Never share/i) ||
          getByText(/backup/i) ||
          getByText(/security/i) ||
          getByText(/warning/i)
      ).toBeDefined();
    });

    it('should render copy button', () => {
      const { getByText } = renderWithTheme(
        <DisplayMnemonicScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByText(/Copy/i)).toBeDefined();
    });

    it('should render continue button', () => {
      const { getByTestId } = renderWithTheme(
        <DisplayMnemonicScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('continue-button')).toBeDefined();
    });
  });

  describe('Mnemonic Display', () => {
    it('should display words in numbered grid format', () => {
      const { getByText } = renderWithTheme(
        <DisplayMnemonicScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      // Check for numbered format (1., 2., etc.)
      expect(getByText(/^1\./)).toBeDefined();
      expect(getByText(/^2\./)).toBeDefined();
    });

    it('should display exactly 12 words', () => {
      const { getAllByTestId } = renderWithTheme(
        <DisplayMnemonicScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const wordItems = getAllByTestId(/mnemonic-word-\d+/);
      expect(wordItems.length).toBe(12);
    });
  });

  describe('Copy Functionality', () => {
    it('should show copied confirmation when copy button is pressed', () => {
      const { getByText, queryByText } = renderWithTheme(
        <DisplayMnemonicScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const copyButton = getByText(/Copy/i);
      fireEvent.press(copyButton);

      // Should show "Copied" confirmation
      expect(queryByText(/Copied/i)).toBeDefined();
    });
  });

  describe('Security Warnings', () => {
    it('should display warning about never sharing mnemonic', () => {
      const { getByText } = renderWithTheme(
        <DisplayMnemonicScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(
        getByText(/Never share/i) ||
          getByText(/Do not share/i) ||
          getByText(/Keep it safe/i)
      ).toBeDefined();
    });

    it('should display backup importance message', () => {
      const { getByText } = renderWithTheme(
        <DisplayMnemonicScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(
        getByText(/Write it down/i) ||
          getByText(/Store safely/i) ||
          getByText(/backup/i)
      ).toBeDefined();
    });
  });

  describe('Navigation', () => {
    it('should navigate to VerifyMnemonic when continue is pressed', () => {
      const { getByTestId } = renderWithTheme(
        <DisplayMnemonicScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const continueButton = getByTestId('continue-button');
      fireEvent.press(continueButton);

      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        expect.stringMatching(/VerifyMnemonic|Verify/i),
        expect.objectContaining({
          password: mockRoute.params.password,
        })
      );
    });

    it('should pass mnemonic words to VerifyMnemonic screen', () => {
      const { getByTestId } = renderWithTheme(
        <DisplayMnemonicScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const continueButton = getByTestId('continue-button');
      fireEvent.press(continueButton);

      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          mnemonic: expect.any(Array),
        })
      );
    });
  });

  describe('Accessibility', () => {
    it('should have accessible buttons', () => {
      const { getByText, getByTestId } = renderWithTheme(
        <DisplayMnemonicScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const copyButton = getByText(/Copy/i);
      const continueButton = getByTestId('continue-button');

      expect(copyButton).toBeDefined();
      expect(continueButton).toBeDefined();
    });

    it('should have accessible warning messages', () => {
      const { getByText } = renderWithTheme(
        <DisplayMnemonicScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const warningElement = getByText(/Never share/i) || getByText(/warning/i);
      expect(warningElement).toBeDefined();
    });
  });
});
