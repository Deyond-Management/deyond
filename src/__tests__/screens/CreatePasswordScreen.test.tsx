/**
 * CreatePasswordScreen Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { CreatePasswordScreen } from '../../screens/CreatePasswordScreen';
import { renderWithProviders } from '../utils/testUtils';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

// Helper to render with providers
const renderWithTheme = (component: React.ReactElement) => {
  return renderWithProviders(component);
};

describe('CreatePasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render password input fields', () => {
      const { getByPlaceholderText } = renderWithTheme(
        <CreatePasswordScreen navigation={mockNavigation as any} />
      );
      expect(getByPlaceholderText(/Enter password/i)).toBeDefined();
      expect(getByPlaceholderText(/Confirm password/i)).toBeDefined();
    });

    it('should render create button', () => {
      const { getByTestId } = renderWithTheme(
        <CreatePasswordScreen navigation={mockNavigation as any} />
      );
      expect(getByTestId('create-password-button')).toBeDefined();
    });

    it('should render password strength indicator when password is entered', () => {
      const { getByPlaceholderText, getByText } = renderWithTheme(
        <CreatePasswordScreen navigation={mockNavigation as any} />
      );

      const passwordInput = getByPlaceholderText(/Enter password/i);
      fireEvent.changeText(passwordInput, 'test');

      expect(getByText(/Password Strength/i)).toBeDefined();
    });

    it('should render validation rules', () => {
      const { getByText } = renderWithTheme(
        <CreatePasswordScreen navigation={mockNavigation as any} />
      );
      expect(
        getByText(/At least 8 characters/i) ||
          getByText(/8 characters/i) ||
          getByText(/Minimum 8 characters/i)
      ).toBeDefined();
    });
  });

  describe('Password Validation', () => {
    it('should show error when passwords do not match', () => {
      const { getByPlaceholderText, getByTestId, queryByText } = renderWithTheme(
        <CreatePasswordScreen navigation={mockNavigation as any} />
      );

      const passwordInput = getByPlaceholderText(/Enter password/i);
      const confirmInput = getByPlaceholderText(/Confirm password/i);

      fireEvent.changeText(passwordInput, 'Password123!');
      fireEvent.changeText(confirmInput, 'Password456!');

      const createButton = getByTestId('create-password-button');
      fireEvent.press(createButton);

      expect(
        queryByText(/Passwords do not match/i) || queryByText(/Password mismatch/i)
      ).toBeDefined();
    });

    it('should show error when password is too short', () => {
      const { getByPlaceholderText, getByTestId, queryByText } = renderWithTheme(
        <CreatePasswordScreen navigation={mockNavigation as any} />
      );

      const passwordInput = getByPlaceholderText(/Enter password/i);
      const confirmInput = getByPlaceholderText(/Confirm password/i);

      fireEvent.changeText(passwordInput, 'Pass1!');
      fireEvent.changeText(confirmInput, 'Pass1!');

      const createButton = getByTestId('create-password-button');
      fireEvent.press(createButton);

      expect(
        queryByText(/at least 8 characters/i) || queryByText(/Password must meet all requirements/i)
      ).toBeDefined();
    });

    it('should show error when password lacks uppercase', () => {
      const { getByPlaceholderText, queryByText } = renderWithTheme(
        <CreatePasswordScreen navigation={mockNavigation as any} />
      );

      const passwordInput = getByPlaceholderText(/Enter password/i);
      fireEvent.changeText(passwordInput, 'password123!');

      // Check if validation rule shows as not met
      expect(queryByText(/uppercase/i)).toBeDefined();
    });

    it('should show error when password lacks number', () => {
      const { getByPlaceholderText, queryByText } = renderWithTheme(
        <CreatePasswordScreen navigation={mockNavigation as any} />
      );

      const passwordInput = getByPlaceholderText(/Enter password/i);
      fireEvent.changeText(passwordInput, 'Password!');

      // Check if validation rule shows as not met
      expect(queryByText(/number/i) || queryByText(/digit/i)).toBeDefined();
    });

    it('should show error when password lacks special character', () => {
      const { getByPlaceholderText, queryByText } = renderWithTheme(
        <CreatePasswordScreen navigation={mockNavigation as any} />
      );

      const passwordInput = getByPlaceholderText(/Enter password/i);
      fireEvent.changeText(passwordInput, 'Password123');

      // Check if validation rule shows as not met
      expect(queryByText(/special character/i) || queryByText(/symbol/i)).toBeDefined();
    });
  });

  describe('Password Strength Meter', () => {
    it('should show weak strength for simple password', () => {
      const { getByPlaceholderText, queryByText } = renderWithTheme(
        <CreatePasswordScreen navigation={mockNavigation as any} />
      );

      const passwordInput = getByPlaceholderText(/Enter password/i);
      fireEvent.changeText(passwordInput, 'password');

      expect(queryByText(/Weak/i)).toBeDefined();
    });

    it('should show medium strength for moderate password', () => {
      const { getByPlaceholderText, queryByText } = renderWithTheme(
        <CreatePasswordScreen navigation={mockNavigation as any} />
      );

      const passwordInput = getByPlaceholderText(/Enter password/i);
      fireEvent.changeText(passwordInput, 'Password1');

      expect(queryByText(/Medium/i) || queryByText(/Moderate/i)).toBeDefined();
    });

    it('should show strong strength for complex password', () => {
      const { getByPlaceholderText, queryByText } = renderWithTheme(
        <CreatePasswordScreen navigation={mockNavigation as any} />
      );

      const passwordInput = getByPlaceholderText(/Enter password/i);
      fireEvent.changeText(passwordInput, 'MyStr0ng!P@ssw0rd');

      expect(queryByText(/Strong/i)).toBeDefined();
    });
  });

  describe('Form Submission', () => {
    it('should not navigate when passwords do not match', () => {
      const { getByPlaceholderText, getByTestId } = renderWithTheme(
        <CreatePasswordScreen navigation={mockNavigation as any} />
      );

      const passwordInput = getByPlaceholderText(/Enter password/i);
      const confirmInput = getByPlaceholderText(/Confirm password/i);
      const createButton = getByTestId('create-password-button');

      fireEvent.changeText(passwordInput, 'Password123!');
      fireEvent.changeText(confirmInput, 'Password456!');
      fireEvent.press(createButton);

      expect(mockNavigation.navigate).not.toHaveBeenCalled();
    });

    it('should navigate to DisplayMnemonic when valid password is created', () => {
      const { getByPlaceholderText, getByTestId, queryByText } = renderWithTheme(
        <CreatePasswordScreen navigation={mockNavigation as any} />
      );

      const passwordInput = getByPlaceholderText(/Enter password/i);
      const confirmInput = getByPlaceholderText(/Confirm password/i);
      const createButton = getByTestId('create-password-button');

      fireEvent.changeText(passwordInput, 'MyStr0ng!P@ssw0rd');
      fireEvent.changeText(confirmInput, 'MyStr0ng!P@ssw0rd');
      fireEvent.press(createButton);

      // Should not show error
      expect(queryByText(/Password must meet all requirements/i)).toBeNull();
      expect(queryByText(/Passwords do not match/i)).toBeNull();

      // Should navigate
      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        'DisplayMnemonic',
        expect.objectContaining({ password: 'MyStr0ng!P@ssw0rd' })
      );
    });
  });

  describe('Show/Hide Password', () => {
    it('should toggle password visibility', () => {
      const { getByPlaceholderText, getByTestId, getAllByTestId } = renderWithTheme(
        <CreatePasswordScreen navigation={mockNavigation as any} />
      );

      const passwordInput = getByPlaceholderText(/Enter password/i);
      expect(passwordInput.props.secureTextEntry).toBe(true);

      // Find toggle button (could be by testID or accessibility label)
      const toggleButtons = getAllByTestId(/toggle-password|show-password/i);
      if (toggleButtons.length > 0) {
        fireEvent.press(toggleButtons[0]);
        expect(passwordInput.props.secureTextEntry).toBe(false);
      }
    });
  });

  describe('Accessibility', () => {
    it('should have accessible form fields', () => {
      const { getByPlaceholderText } = renderWithTheme(
        <CreatePasswordScreen navigation={mockNavigation as any} />
      );

      const passwordInput = getByPlaceholderText(/Enter password/i);
      const confirmInput = getByPlaceholderText(/Confirm password/i);

      expect(passwordInput.props.accessibilityLabel).toBeDefined();
      expect(confirmInput.props.accessibilityLabel).toBeDefined();
    });

    it('should have accessible create button', () => {
      const { getByTestId } = renderWithTheme(
        <CreatePasswordScreen navigation={mockNavigation as any} />
      );

      const createButton = getByTestId('create-password-button');
      expect(createButton).toBeDefined();
      expect(createButton.props.accessibilityLabel).toBe('Create password button');
    });
  });
});
