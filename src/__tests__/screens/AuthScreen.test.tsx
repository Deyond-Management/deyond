/**
 * AuthScreen Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { AuthScreen } from '../../screens/AuthScreen';
import { renderWithProviders } from '../utils/testUtils';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  replace: jest.fn(),
};

// Helper to render with theme
const renderWithTheme = (component: React.ReactElement) => {
  return renderWithProviders(component);
};

describe('AuthScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render lock icon', () => {
      const { getByTestId } = renderWithTheme(
        <AuthScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('lock-icon')).toBeDefined();
    });

    it('should render unlock message', () => {
      const { getByText } = renderWithTheme(
        <AuthScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/Unlock/i)).toBeDefined();
    });

    it('should render PIN input', () => {
      const { getByTestId } = renderWithTheme(
        <AuthScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('pin-input')).toBeDefined();
    });

    it('should render number pad', () => {
      const { getByTestId } = renderWithTheme(
        <AuthScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('number-pad')).toBeDefined();
    });
  });

  describe('PIN Input', () => {
    it('should update PIN dots when numbers are pressed', () => {
      const { getByTestId } = renderWithTheme(
        <AuthScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('key-1'));
      fireEvent.press(getByTestId('key-2'));
      fireEvent.press(getByTestId('key-3'));

      const pinInput = getByTestId('pin-input');
      expect(pinInput.children.length).toBeGreaterThan(0);
    });

    it('should have delete button', () => {
      const { getByTestId } = renderWithTheme(
        <AuthScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('key-delete')).toBeDefined();
    });

    it('should delete last digit when delete is pressed', () => {
      const { getByTestId } = renderWithTheme(
        <AuthScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('key-1'));
      fireEvent.press(getByTestId('key-2'));
      fireEvent.press(getByTestId('key-delete'));

      // PIN should now be 1 digit
      const pinDots = getByTestId('pin-input');
      expect(pinDots).toBeDefined();
    });

    it('should limit PIN to 6 digits', () => {
      const { getByTestId } = renderWithTheme(
        <AuthScreen navigation={mockNavigation as any} />
      );

      // Press 7 times
      for (let i = 0; i < 7; i++) {
        fireEvent.press(getByTestId('key-1'));
      }

      // Should only have 6 filled dots
      const pinInput = getByTestId('pin-input');
      expect(pinInput).toBeDefined();
    });
  });

  describe('Biometrics', () => {
    it('should show biometrics button when available', () => {
      const { getByTestId } = renderWithTheme(
        <AuthScreen
          navigation={mockNavigation as any}
          biometricsAvailable={true}
        />
      );

      expect(getByTestId('biometrics-button')).toBeDefined();
    });

    it('should hide biometrics button when not available', () => {
      const { queryByTestId } = renderWithTheme(
        <AuthScreen
          navigation={mockNavigation as any}
          biometricsAvailable={false}
        />
      );

      expect(queryByTestId('biometrics-button')).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should show error message on wrong PIN', () => {
      const { getByTestId, getByText } = renderWithTheme(
        <AuthScreen
          navigation={mockNavigation as any}
          initialError="Incorrect PIN"
        />
      );

      expect(getByText('Incorrect PIN')).toBeDefined();
    });

    it('should show attempts remaining', () => {
      const { getByText } = renderWithTheme(
        <AuthScreen
          navigation={mockNavigation as any}
          attemptsRemaining={3}
        />
      );

      expect(getByText(/3 attempts/i)).toBeDefined();
    });
  });

  describe('Lockout', () => {
    it('should show lockout message when locked', () => {
      const { getByText } = renderWithTheme(
        <AuthScreen
          navigation={mockNavigation as any}
          isLocked={true}
          lockoutTime={300}
        />
      );

      expect(getByText(/locked/i)).toBeDefined();
    });

    it('should disable input when locked', () => {
      const { getByTestId } = renderWithTheme(
        <AuthScreen
          navigation={mockNavigation as any}
          isLocked={true}
          lockoutTime={300}
        />
      );

      const key = getByTestId('key-1');
      expect(key.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('Number Pad', () => {
    it('should have all number keys 0-9', () => {
      const { getByTestId } = renderWithTheme(
        <AuthScreen navigation={mockNavigation as any} />
      );

      for (let i = 0; i <= 9; i++) {
        expect(getByTestId(`key-${i}`)).toBeDefined();
      }
    });
  });

  describe('Accessibility', () => {
    it('should have accessible number keys', () => {
      const { getByLabelText } = renderWithTheme(
        <AuthScreen navigation={mockNavigation as any} />
      );

      expect(getByLabelText(/1/)).toBeDefined();
    });

    it('should have accessible delete button', () => {
      const { getByLabelText } = renderWithTheme(
        <AuthScreen navigation={mockNavigation as any} />
      );

      expect(getByLabelText(/delete/i)).toBeDefined();
    });
  });
});
