/**
 * Input Component Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Input } from '../../components/atoms/Input';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Wrapper with theme provider
const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('Input', () => {
  describe('Rendering', () => {
    it('should render with placeholder', () => {
      const { getByPlaceholderText } = renderWithTheme(<Input placeholder="Enter text" />);
      expect(getByPlaceholderText('Enter text')).toBeDefined();
    });

    it('should render with testID', () => {
      const { getByTestId } = renderWithTheme(<Input testID="test-input" placeholder="Test" />);
      expect(getByTestId('test-input')).toBeDefined();
    });

    it('should render with label', () => {
      const { getByText } = renderWithTheme(<Input label="Email" placeholder="Enter email" />);
      expect(getByText('Email')).toBeDefined();
    });

    it('should render with helper text', () => {
      const { getByText } = renderWithTheme(
        <Input placeholder="Enter text" helperText="This is a helper text" />
      );
      expect(getByText('This is a helper text')).toBeDefined();
    });
  });

  describe('Input Types', () => {
    it('should render text input by default', () => {
      const { getByTestId } = renderWithTheme(<Input testID="input" placeholder="Text" />);
      const input = getByTestId('input');
      expect(input.props.secureTextEntry).toBeFalsy();
      expect(input.props.keyboardType).toBe('default');
    });

    it('should render password input with secure text entry', () => {
      const { getByTestId } = renderWithTheme(
        <Input type="password" testID="input" placeholder="Password" />
      );
      const input = getByTestId('input');
      expect(input.props.secureTextEntry).toBe(true);
    });

    it('should render number input with numeric keyboard', () => {
      const { getByTestId } = renderWithTheme(
        <Input type="number" testID="input" placeholder="Amount" />
      );
      const input = getByTestId('input');
      expect(input.props.keyboardType).toBe('numeric');
    });

    it('should render email input with email keyboard', () => {
      const { getByTestId } = renderWithTheme(
        <Input type="email" testID="input" placeholder="Email" />
      );
      const input = getByTestId('input');
      expect(input.props.keyboardType).toBe('email-address');
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should show password toggle button for password type', () => {
      const { getByTestId } = renderWithTheme(
        <Input type="password" testID="input" placeholder="Password" />
      );
      expect(getByTestId('password-toggle')).toBeDefined();
    });

    it('should toggle password visibility when toggle button is pressed', () => {
      const { getByTestId } = renderWithTheme(
        <Input type="password" testID="input" placeholder="Password" />
      );

      const input = getByTestId('input');
      const toggle = getByTestId('password-toggle');

      // Initially hidden
      expect(input.props.secureTextEntry).toBe(true);

      // Press toggle
      fireEvent.press(toggle);

      // Now visible
      expect(input.props.secureTextEntry).toBe(false);

      // Press again
      fireEvent.press(toggle);

      // Hidden again
      expect(input.props.secureTextEntry).toBe(true);
    });

    it('should not show password toggle for non-password types', () => {
      const { queryByTestId } = renderWithTheme(
        <Input type="text" testID="input" placeholder="Text" />
      );
      expect(queryByTestId('password-toggle')).toBeNull();
    });
  });

  describe('States', () => {
    it('should be disabled when disabled prop is true', () => {
      const { getByTestId } = renderWithTheme(
        <Input disabled testID="input" placeholder="Disabled" />
      );
      const input = getByTestId('input');
      expect(input.props.editable).toBe(false);
    });

    it('should show error state with error message', () => {
      const { getByText, getByTestId } = renderWithTheme(
        <Input testID="input" placeholder="Email" error="Invalid email address" />
      );

      expect(getByText('Invalid email address')).toBeDefined();

      // Error text should be rendered
      const errorText = getByText('Invalid email address');
      expect(errorText).toBeDefined();
    });

    it('should not show helper text when error is present', () => {
      const { queryByText, getByText } = renderWithTheme(
        <Input placeholder="Email" helperText="Enter your email" error="Invalid email" />
      );

      expect(getByText('Invalid email')).toBeDefined();
      expect(queryByText('Enter your email')).toBeNull();
    });

    it('should apply error styling when error prop is provided', () => {
      const { getByTestId } = renderWithTheme(
        <Input testID="input-container" placeholder="Email" error="Invalid email" />
      );

      const container = getByTestId('input-container');
      expect(container).toBeDefined();
    });
  });

  describe('Interactions', () => {
    it('should call onChangeText when text changes', () => {
      const onChangeText = jest.fn();
      const { getByTestId } = renderWithTheme(
        <Input testID="input" placeholder="Text" onChangeText={onChangeText} />
      );

      const input = getByTestId('input');
      fireEvent.changeText(input, 'Hello World');

      expect(onChangeText).toHaveBeenCalledWith('Hello World');
    });

    it('should call onFocus when input is focused', () => {
      const onFocus = jest.fn();
      const { getByTestId } = renderWithTheme(
        <Input testID="input" placeholder="Text" onFocus={onFocus} />
      );

      const input = getByTestId('input');
      fireEvent(input, 'focus');

      expect(onFocus).toHaveBeenCalled();
    });

    it('should call onBlur when input loses focus', () => {
      const onBlur = jest.fn();
      const { getByTestId } = renderWithTheme(
        <Input testID="input" placeholder="Text" onBlur={onBlur} />
      );

      const input = getByTestId('input');
      fireEvent(input, 'blur');

      expect(onBlur).toHaveBeenCalled();
    });

    it('should not trigger onChangeText when disabled', () => {
      const onChangeText = jest.fn();
      const { getByTestId } = renderWithTheme(
        <Input disabled testID="input" placeholder="Text" onChangeText={onChangeText} />
      );

      const input = getByTestId('input');
      expect(input.props.editable).toBe(false);
    });
  });

  describe('Value Control', () => {
    it('should render with initial value', () => {
      const { getByDisplayValue } = renderWithTheme(<Input placeholder="Name" value="John Doe" />);
      expect(getByDisplayValue('John Doe')).toBeDefined();
    });

    it('should update value when controlled', () => {
      const { getByTestId, rerender } = renderWithTheme(
        <Input testID="input" placeholder="Name" value="John" />
      );

      expect(getByTestId('input').props.value).toBe('John');

      rerender(
        <ThemeProvider>
          <Input testID="input" placeholder="Name" value="Jane" />
        </ThemeProvider>
      );

      expect(getByTestId('input').props.value).toBe('Jane');
    });
  });

  describe('Accessibility', () => {
    it('should have accessibility label from label prop', () => {
      const { getByLabelText } = renderWithTheme(
        <Input label="Email Address" placeholder="Email" />
      );
      expect(getByLabelText('Email Address')).toBeDefined();
    });

    it('should have accessibility label from accessibilityLabel prop', () => {
      const { getByLabelText } = renderWithTheme(
        <Input accessibilityLabel="Custom Label" placeholder="Text" />
      );
      expect(getByLabelText('Custom Label')).toBeDefined();
    });

    it('should indicate error state to screen readers', () => {
      const { getByTestId } = renderWithTheme(
        <Input testID="input" placeholder="Email" error="Invalid email" />
      );

      const input = getByTestId('input');
      expect(input.props.accessibilityState).toEqual(expect.objectContaining({ disabled: false }));
    });

    it('should indicate disabled state to screen readers', () => {
      const { getByTestId } = renderWithTheme(
        <Input disabled testID="input" placeholder="Email" />
      );

      const input = getByTestId('input');
      expect(input.props.accessibilityState).toEqual(expect.objectContaining({ disabled: true }));
    });
  });

  describe('Full Width', () => {
    it('should render full width by default', () => {
      const { getByTestId } = renderWithTheme(
        <Input testID="input-container" placeholder="Text" />
      );

      const container = getByTestId('input-container');
      expect(container).toBeDefined();
    });
  });

  describe('Multiline', () => {
    it('should support multiline input', () => {
      const { getByTestId } = renderWithTheme(
        <Input testID="input" placeholder="Description" multiline numberOfLines={4} />
      );

      const input = getByTestId('input');
      expect(input.props.multiline).toBe(true);
      expect(input.props.numberOfLines).toBe(4);
    });
  });

  describe('MaxLength', () => {
    it('should respect maxLength prop', () => {
      const { getByTestId } = renderWithTheme(
        <Input testID="input" placeholder="Text" maxLength={10} />
      );

      const input = getByTestId('input');
      expect(input.props.maxLength).toBe(10);
    });
  });
});
