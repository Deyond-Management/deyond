/**
 * SecuritySettingsScreen Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { SecuritySettingsScreen } from '../../screens/SecuritySettingsScreen';
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

describe('SecuritySettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render security title', () => {
      const { getByText } = renderWithTheme(
        <SecuritySettingsScreen navigation={mockNavigation as any} />
      );

      expect(getByText('Security')).toBeDefined();
    });

    it('should render back button', () => {
      const { getByTestId } = renderWithTheme(
        <SecuritySettingsScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('back-button')).toBeDefined();
    });
  });

  describe('PIN Settings', () => {
    it('should have PIN toggle', () => {
      const { getByTestId } = renderWithTheme(
        <SecuritySettingsScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('pin-toggle')).toBeDefined();
    });

    it('should have change PIN option', () => {
      const { getByTestId } = renderWithTheme(
        <SecuritySettingsScreen navigation={mockNavigation as any} initialPinEnabled={true} />
      );

      expect(getByTestId('change-pin')).toBeDefined();
    });

    it('should hide change PIN when PIN is disabled', () => {
      const { queryByTestId } = renderWithTheme(
        <SecuritySettingsScreen navigation={mockNavigation as any} initialPinEnabled={false} />
      );

      expect(queryByTestId('change-pin')).toBeNull();
    });
  });

  describe('Biometrics', () => {
    it('should have biometrics toggle', () => {
      const { getByTestId } = renderWithTheme(
        <SecuritySettingsScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('biometrics-toggle')).toBeDefined();
    });

    it('should show biometrics type label', () => {
      const { getAllByText } = renderWithTheme(
        <SecuritySettingsScreen navigation={mockNavigation as any} biometricsType="Face ID" />
      );

      expect(getAllByText(/Face ID/i).length).toBeGreaterThan(0);
    });

    it('should disable biometrics toggle when PIN is disabled', () => {
      const { getByTestId } = renderWithTheme(
        <SecuritySettingsScreen navigation={mockNavigation as any} initialPinEnabled={false} />
      );

      const toggle = getByTestId('biometrics-toggle');
      expect(toggle.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('Auto-lock', () => {
    it('should have auto-lock selector', () => {
      const { getByTestId } = renderWithTheme(
        <SecuritySettingsScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('auto-lock')).toBeDefined();
    });

    it('should display current auto-lock value', () => {
      const { getByText } = renderWithTheme(
        <SecuritySettingsScreen navigation={mockNavigation as any} initialAutoLock="5 minutes" />
      );

      expect(getByText('5 minutes')).toBeDefined();
    });
  });

  describe('Transaction Signing', () => {
    it('should have require auth for transactions toggle', () => {
      const { getByTestId } = renderWithTheme(
        <SecuritySettingsScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('require-auth-transactions')).toBeDefined();
    });
  });

  describe('Session', () => {
    it('should have active sessions option', () => {
      const { getByTestId } = renderWithTheme(
        <SecuritySettingsScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('active-sessions')).toBeDefined();
    });
  });

  describe('Interactions', () => {
    it('should go back when back button is pressed', () => {
      const { getByTestId } = renderWithTheme(
        <SecuritySettingsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('back-button'));

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  describe('Security Info', () => {
    it('should display security recommendation', () => {
      const { getByTestId } = renderWithTheme(
        <SecuritySettingsScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('security-info')).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible PIN toggle', () => {
      const { getByLabelText } = renderWithTheme(
        <SecuritySettingsScreen navigation={mockNavigation as any} />
      );

      expect(getByLabelText(/PIN/i)).toBeDefined();
    });

    it('should have accessible back button', () => {
      const { getByLabelText } = renderWithTheme(
        <SecuritySettingsScreen navigation={mockNavigation as any} />
      );

      expect(getByLabelText(/back/i)).toBeDefined();
    });
  });
});
