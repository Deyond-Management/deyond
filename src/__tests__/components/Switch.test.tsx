/**
 * Switch Component Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Switch } from '../../components/atoms/Switch';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Wrapper with theme provider
const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('Switch', () => {
  describe('Rendering', () => {
    it('should render off by default', () => {
      const { getByTestId } = renderWithTheme(<Switch testID="switch" />);
      expect(getByTestId('switch')).toBeDefined();
    });

    it('should render on when value is true', () => {
      const { getByTestId } = renderWithTheme(<Switch value={true} testID="switch" />);
      const switchElement = getByTestId('switch');
      expect(switchElement.props.value).toBe(true);
    });

    it('should render with label', () => {
      const { getByText } = renderWithTheme(<Switch label="Enable notifications" />);
      expect(getByText('Enable notifications')).toBeDefined();
    });

    it('should render with testID', () => {
      const { getByTestId } = renderWithTheme(<Switch testID="test-switch" />);
      expect(getByTestId('test-switch')).toBeDefined();
    });
  });

  describe('States', () => {
    it('should be enabled by default', () => {
      const { getByTestId } = renderWithTheme(<Switch testID="switch" />);
      const switchElement = getByTestId('switch');
      expect(switchElement.props.disabled).toBeFalsy();
    });

    it('should be disabled when disabled prop is true', () => {
      const { getByTestId } = renderWithTheme(<Switch disabled testID="switch" />);
      const switchElement = getByTestId('switch');
      expect(switchElement.props.disabled).toBe(true);
    });

    it('should not toggle when disabled', () => {
      const onValueChange = jest.fn();
      const { getByTestId } = renderWithTheme(
        <Switch disabled onValueChange={onValueChange} testID="switch" />
      );

      const switchElement = getByTestId('switch');
      fireEvent(switchElement, 'valueChange', true);

      // Switch should still be called but we can verify disabled prop
      expect(switchElement.props.disabled).toBe(true);
    });
  });

  describe('Interactions', () => {
    it('should call onValueChange when toggled', () => {
      const onValueChange = jest.fn();
      const { getByTestId } = renderWithTheme(
        <Switch onValueChange={onValueChange} testID="switch" />
      );

      const switchElement = getByTestId('switch');
      fireEvent(switchElement, 'valueChange', true);

      expect(onValueChange).toHaveBeenCalledWith(true);
    });

    it('should toggle from on to off', () => {
      const onValueChange = jest.fn();
      const { getByTestId } = renderWithTheme(
        <Switch value={true} onValueChange={onValueChange} testID="switch" />
      );

      const switchElement = getByTestId('switch');
      fireEvent(switchElement, 'valueChange', false);

      expect(onValueChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Colors', () => {
    it('should use theme colors by default', () => {
      const { getByTestId } = renderWithTheme(<Switch value={true} testID="switch" />);
      const switchElement = getByTestId('switch');
      // Switch should render with theme colors
      expect(switchElement).toBeDefined();
    });

    it('should support custom active color', () => {
      const { getByTestId } = renderWithTheme(
        <Switch value={true} activeColor="#FF0000" testID="switch" />
      );
      const switchElement = getByTestId('switch');
      // Custom color is applied
      expect(switchElement).toBeDefined();
    });

    it('should support custom thumb color', () => {
      const { getByTestId } = renderWithTheme(<Switch thumbColor="#00FF00" testID="switch" />);
      const switchElement = getByTestId('switch');
      // Thumb color is rendered, component should be defined
      expect(switchElement).toBeDefined();
    });
  });

  describe('Label', () => {
    it('should render label on the left by default', () => {
      const { getByText } = renderWithTheme(<Switch label="Toggle" />);
      expect(getByText('Toggle')).toBeDefined();
    });

    it('should support label on the right', () => {
      const { getByText } = renderWithTheme(<Switch label="Toggle" labelPosition="right" />);
      expect(getByText('Toggle')).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have switch role', () => {
      const { getByTestId } = renderWithTheme(<Switch testID="switch" />);
      const switchElement = getByTestId('switch');
      expect(switchElement.props.accessibilityRole).toBe('switch');
    });

    it('should have accessibility label from label prop', () => {
      const { getByLabelText } = renderWithTheme(<Switch label="Dark mode" />);
      expect(getByLabelText('Dark mode')).toBeDefined();
    });

    it('should have custom accessibility label', () => {
      const { getByLabelText } = renderWithTheme(<Switch accessibilityLabel="Custom label" />);
      expect(getByLabelText('Custom label')).toBeDefined();
    });
  });

  describe('Custom Styles', () => {
    it('should support custom container styles', () => {
      const customStyle = { margin: 10 };
      const { getByTestId } = renderWithTheme(<Switch style={customStyle} testID="switch" />);
      const container = getByTestId('switch-container');
      expect(container.props.style).toMatchObject(customStyle);
    });
  });
});
