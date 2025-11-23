/**
 * Welcome Screen Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { WelcomeScreen } from '../../screens/WelcomeScreen';
import { ThemeProvider } from '../../contexts/ThemeContext';

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

describe('WelcomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render welcome title', () => {
      const { getByText } = renderWithTheme(<WelcomeScreen navigation={mockNavigation as any} />);
      expect(getByText(/Welcome/i)).toBeDefined();
    });

    it('should render app name or logo', () => {
      const { getByText } = renderWithTheme(<WelcomeScreen navigation={mockNavigation as any} />);
      expect(getByText(/Crypto Wallet/i)).toBeDefined();
    });

    it('should render description text', () => {
      const { getByText } = renderWithTheme(<WelcomeScreen navigation={mockNavigation as any} />);
      expect(getByText(/Secure, decentralized, and easy to use/i)).toBeDefined();
    });

    it('should render create wallet button', () => {
      const { getByText } = renderWithTheme(<WelcomeScreen navigation={mockNavigation as any} />);
      expect(getByText('Create New Wallet')).toBeDefined();
    });

    it('should render import wallet button', () => {
      const { getByText } = renderWithTheme(<WelcomeScreen navigation={mockNavigation as any} />);
      expect(getByText('Import Existing Wallet')).toBeDefined();
    });
  });

  describe('Navigation', () => {
    it('should navigate to CreateWallet when create button is pressed', () => {
      const { getByText } = renderWithTheme(<WelcomeScreen navigation={mockNavigation as any} />);

      const createButton = getByText('Create New Wallet');
      fireEvent.press(createButton);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('CreatePassword');
    });

    it('should navigate to ImportWallet when import button is pressed', () => {
      const { getByText } = renderWithTheme(<WelcomeScreen navigation={mockNavigation as any} />);

      const importButton = getByText('Import Existing Wallet');
      fireEvent.press(importButton);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('ImportWallet');
    });
  });

  describe('Layout', () => {
    it('should have centered content', () => {
      const { getByTestId } = renderWithTheme(<WelcomeScreen navigation={mockNavigation as any} />);
      const container = getByTestId('welcome-container');
      expect(container.props.style).toMatchObject(
        expect.objectContaining({ justifyContent: expect.any(String) })
      );
    });

    it('should render buttons in correct order', () => {
      const { getAllByRole } = renderWithTheme(
        <WelcomeScreen navigation={mockNavigation as any} />
      );
      const buttons = getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible buttons', () => {
      const { getByLabelText } = renderWithTheme(
        <WelcomeScreen navigation={mockNavigation as any} />
      );
      expect(getByLabelText('Create New Wallet')).toBeDefined();
      expect(getByLabelText('Import Existing Wallet')).toBeDefined();
    });
  });

  describe('Visual Elements', () => {
    it('should render logo or icon placeholder', () => {
      const { getByTestId } = renderWithTheme(<WelcomeScreen navigation={mockNavigation as any} />);
      expect(getByTestId('app-logo')).toBeDefined();
    });
  });
});
