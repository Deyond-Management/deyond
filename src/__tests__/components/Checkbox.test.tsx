/**
 * Checkbox Component Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Checkbox } from '../../components/atoms/Checkbox';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Wrapper with theme provider
const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('Checkbox', () => {
  describe('Rendering', () => {
    it('should render unchecked by default', () => {
      const { getByTestId } = renderWithTheme(
        <Checkbox testID="checkbox" />
      );
      const checkbox = getByTestId('checkbox');
      expect(checkbox).toBeDefined();
    });

    it('should render checked when value is true', () => {
      const { getByTestId } = renderWithTheme(
        <Checkbox value={true} testID="checkbox" />
      );
      const checkbox = getByTestId('checkbox');
      expect(checkbox).toBeDefined();
    });

    it('should render with label', () => {
      const { getByText } = renderWithTheme(
        <Checkbox label="Accept terms" />
      );
      expect(getByText('Accept terms')).toBeDefined();
    });

    it('should render with testID', () => {
      const { getByTestId } = renderWithTheme(
        <Checkbox testID="test-checkbox" />
      );
      expect(getByTestId('test-checkbox')).toBeDefined();
    });
  });

  describe('States', () => {
    it('should be enabled by default', () => {
      const { getByTestId } = renderWithTheme(
        <Checkbox testID="checkbox" />
      );
      const checkbox = getByTestId('checkbox');
      expect(checkbox.props.accessibilityState).not.toMatchObject({
        disabled: true,
      });
    });

    it('should be disabled when disabled prop is true', () => {
      const { getByTestId } = renderWithTheme(
        <Checkbox disabled testID="checkbox" />
      );
      const checkbox = getByTestId('checkbox');
      expect(checkbox.props.accessibilityState).toMatchObject({
        disabled: true,
      });
    });

    it('should not toggle when disabled', () => {
      const onValueChange = jest.fn();
      const { getByTestId } = renderWithTheme(
        <Checkbox
          disabled
          onValueChange={onValueChange}
          testID="checkbox"
        />
      );

      const checkbox = getByTestId('checkbox');
      fireEvent.press(checkbox);

      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe('Interactions', () => {
    it('should call onValueChange when pressed', () => {
      const onValueChange = jest.fn();
      const { getByTestId } = renderWithTheme(
        <Checkbox onValueChange={onValueChange} testID="checkbox" />
      );

      const checkbox = getByTestId('checkbox');
      fireEvent.press(checkbox);

      expect(onValueChange).toHaveBeenCalledWith(true);
    });

    it('should toggle from checked to unchecked', () => {
      const onValueChange = jest.fn();
      const { getByTestId } = renderWithTheme(
        <Checkbox
          value={true}
          onValueChange={onValueChange}
          testID="checkbox"
        />
      );

      const checkbox = getByTestId('checkbox');
      fireEvent.press(checkbox);

      expect(onValueChange).toHaveBeenCalledWith(false);
    });

    it('should toggle from unchecked to checked', () => {
      const onValueChange = jest.fn();
      const { getByTestId } = renderWithTheme(
        <Checkbox
          value={false}
          onValueChange={onValueChange}
          testID="checkbox"
        />
      );

      const checkbox = getByTestId('checkbox');
      fireEvent.press(checkbox);

      expect(onValueChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Label Interaction', () => {
    it('should toggle when label is pressed', () => {
      const onValueChange = jest.fn();
      const { getByText } = renderWithTheme(
        <Checkbox label="Click me" onValueChange={onValueChange} />
      );

      const label = getByText('Click me');
      fireEvent.press(label);

      expect(onValueChange).toHaveBeenCalledWith(true);
    });

    it('should not toggle label when labelDisabled is true', () => {
      const onValueChange = jest.fn();
      const { getByText } = renderWithTheme(
        <Checkbox
          label="Click me"
          labelDisabled
          onValueChange={onValueChange}
        />
      );

      const label = getByText('Click me');
      // Label should not be pressable
      expect(label).toBeDefined();
    });
  });

  describe('Sizes', () => {
    it('should render medium size by default', () => {
      const { getByTestId } = renderWithTheme(
        <Checkbox testID="checkbox" />
      );
      const checkbox = getByTestId('checkbox');
      expect(checkbox.props.style).toMatchObject(
        expect.objectContaining({ width: expect.any(Number) })
      );
    });

    it('should render small size', () => {
      const { getByTestId } = renderWithTheme(
        <Checkbox size="small" testID="checkbox" />
      );
      const checkbox = getByTestId('checkbox');
      expect(checkbox.props.style).toMatchObject(
        expect.objectContaining({ width: 20 })
      );
    });

    it('should render large size', () => {
      const { getByTestId } = renderWithTheme(
        <Checkbox size="large" testID="checkbox" />
      );
      const checkbox = getByTestId('checkbox');
      expect(checkbox.props.style).toMatchObject(
        expect.objectContaining({ width: 28 })
      );
    });
  });

  describe('Colors', () => {
    it('should use theme color by default', () => {
      const { getByTestId } = renderWithTheme(
        <Checkbox value={true} testID="checkbox" />
      );
      const checkbox = getByTestId('checkbox');
      expect(checkbox.props.style).toMatchObject(
        expect.objectContaining({ backgroundColor: expect.any(String) })
      );
    });

    it('should support custom color', () => {
      const { getByTestId } = renderWithTheme(
        <Checkbox value={true} color="#FF0000" testID="checkbox" />
      );
      const checkbox = getByTestId('checkbox');
      expect(checkbox.props.style).toMatchObject({ backgroundColor: '#FF0000' });
    });
  });

  describe('Error State', () => {
    it('should display error styling when error prop is true', () => {
      const { getByTestId } = renderWithTheme(
        <Checkbox error testID="checkbox" />
      );
      const checkbox = getByTestId('checkbox');
      expect(checkbox).toBeDefined();
    });

    it('should display error message', () => {
      const { getByText } = renderWithTheme(
        <Checkbox error errorMessage="This field is required" />
      );
      expect(getByText('This field is required')).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have checkbox role', () => {
      const { getByTestId } = renderWithTheme(
        <Checkbox testID="checkbox" />
      );
      const checkbox = getByTestId('checkbox');
      expect(checkbox.props.accessibilityRole).toBe('checkbox');
    });

    it('should indicate checked state', () => {
      const { getByTestId } = renderWithTheme(
        <Checkbox value={true} testID="checkbox" />
      );
      const checkbox = getByTestId('checkbox');
      expect(checkbox.props.accessibilityState).toMatchObject({
        checked: true,
      });
    });

    it('should indicate unchecked state', () => {
      const { getByTestId } = renderWithTheme(
        <Checkbox value={false} testID="checkbox" />
      );
      const checkbox = getByTestId('checkbox');
      expect(checkbox.props.accessibilityState).toMatchObject({
        checked: false,
      });
    });

    it('should have accessibility label from label prop', () => {
      const { getByLabelText } = renderWithTheme(
        <Checkbox label="Remember me" />
      );
      expect(getByLabelText('Remember me')).toBeDefined();
    });

    it('should have custom accessibility label', () => {
      const { getByLabelText } = renderWithTheme(
        <Checkbox accessibilityLabel="Custom label" />
      );
      expect(getByLabelText('Custom label')).toBeDefined();
    });
  });

  describe('Custom Styles', () => {
    it('should support custom container styles', () => {
      const customStyle = { margin: 10 };
      const { getByTestId } = renderWithTheme(
        <Checkbox style={customStyle} testID="checkbox" />
      );
      const checkbox = getByTestId('checkbox');
      expect(checkbox.props.style).toMatchObject(customStyle);
    });
  });
});
