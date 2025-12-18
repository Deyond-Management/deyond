/**
 * MessagingSetupScreen Tests
 */

import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { MessagingSetupScreen } from '../../screens/MessagingSetupScreen';
import { renderWithProviders } from '../utils/testUtils';

// Mock useDeyondCrypt hook
const mockSetupMessaging = jest.fn();
const mockGetMyPreKeyBundle = jest.fn();

jest.mock('../../hooks', () => ({
  ...jest.requireActual('../../hooks'),
  useDeyondCrypt: jest.fn(() => ({
    isLoading: false,
    hasIdentity: false,
    myAddress: '0x1234567890123456789012345678901234567890',
    setupMessaging: mockSetupMessaging,
    getMyPreKeyBundle: mockGetMyPreKeyBundle,
  })),
}));

// Mock expo-clipboard
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));

// Mock SecureStorageService
jest.mock('../../services/wallet/SecureStorageService', () => ({
  SecureStorageService: jest.fn().mockImplementation(() => ({
    getPrivateKey: jest
      .fn()
      .mockResolvedValue('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'),
  })),
}));

// Mock wallet selector - now returns currentWallet object
jest.mock('../../store/hooks', () => ({
  useAppSelector: jest.fn(() => ({
    currentWallet: {
      address: '0x1234567890123456789012345678901234567890',
    },
  })),
  useAppDispatch: jest.fn(() => jest.fn()),
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  replace: jest.fn(),
};

describe('MessagingSetupScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSetupMessaging.mockResolvedValue(undefined);
    mockGetMyPreKeyBundle.mockResolvedValue({ identityKey: 'test' });
  });

  describe('Initial State', () => {
    it('should render title', () => {
      const { getByText } = renderWithProviders(
        <MessagingSetupScreen navigation={mockNavigation as any} route={{} as any} />
      );

      expect(getByText('Secure Messaging')).toBeDefined();
    });

    it('should render setup button', () => {
      const { getByTestId } = renderWithProviders(
        <MessagingSetupScreen navigation={mockNavigation as any} route={{} as any} />
      );

      expect(getByTestId('setup-button')).toBeDefined();
    });

    it('should render back button', () => {
      const { getByTestId } = renderWithProviders(
        <MessagingSetupScreen navigation={mockNavigation as any} route={{} as any} />
      );

      expect(getByTestId('back-button')).toBeDefined();
    });

    it('should render feature items', () => {
      const { getByText } = renderWithProviders(
        <MessagingSetupScreen navigation={mockNavigation as any} route={{} as any} />
      );

      expect(getByText('End-to-End Encryption')).toBeDefined();
      expect(getByText('Your Keys, Your Privacy')).toBeDefined();
      expect(getByText('Connect Securely')).toBeDefined();
    });
  });

  describe('Navigation', () => {
    it('should go back when back button pressed', () => {
      const { getByTestId } = renderWithProviders(
        <MessagingSetupScreen navigation={mockNavigation as any} route={{} as any} />
      );

      fireEvent.press(getByTestId('back-button'));
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  describe('Setup Flow', () => {
    it('should call setupMessaging when setup button pressed', async () => {
      const { getByTestId } = renderWithProviders(
        <MessagingSetupScreen navigation={mockNavigation as any} route={{} as any} />
      );

      fireEvent.press(getByTestId('setup-button'));

      await waitFor(() => {
        expect(mockSetupMessaging).toHaveBeenCalled();
      });
    });
  });
});
