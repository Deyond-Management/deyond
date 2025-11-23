/**
 * Button Component Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../../components/atoms/Button';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Wrapper with theme provider
const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('Button', () => {
  describe('Rendering', () => {
    it('should render with text', () => {
      const { getByText } = renderWithTheme(<Button>Click Me</Button>);
      expect(getByText('Click Me')).toBeDefined();
    });

    it('should render with testID', () => {
      const { getByTestId } = renderWithTheme(<Button testID="test-button">Click Me</Button>);
      expect(getByTestId('test-button')).toBeDefined();
    });
  });

  describe('Variants', () => {
    it('should render primary variant by default', () => {
      const { getByTestId } = renderWithTheme(<Button testID="btn">Primary</Button>);
      const button = getByTestId('btn');
      expect(button).toBeDefined();
    });

    it('should render secondary variant', () => {
      const { getByTestId } = renderWithTheme(
        <Button variant="secondary" testID="btn">
          Secondary
        </Button>
      );
      expect(getByTestId('btn')).toBeDefined();
    });

    it('should render text variant', () => {
      const { getByTestId } = renderWithTheme(
        <Button variant="text" testID="btn">
          Text
        </Button>
      );
      expect(getByTestId('btn')).toBeDefined();
    });

    it('should render outlined variant', () => {
      const { getByTestId } = renderWithTheme(
        <Button variant="outlined" testID="btn">
          Outlined
        </Button>
      );
      expect(getByTestId('btn')).toBeDefined();
    });
  });

  describe('Sizes', () => {
    it('should render medium size by default', () => {
      const { getByTestId } = renderWithTheme(<Button testID="btn">Medium</Button>);
      expect(getByTestId('btn')).toBeDefined();
    });

    it('should render small size', () => {
      const { getByTestId } = renderWithTheme(
        <Button size="small" testID="btn">
          Small
        </Button>
      );
      expect(getByTestId('btn')).toBeDefined();
    });

    it('should render large size', () => {
      const { getByTestId } = renderWithTheme(
        <Button size="large" testID="btn">
          Large
        </Button>
      );
      expect(getByTestId('btn')).toBeDefined();
    });
  });

  describe('States', () => {
    it('should be disabled when disabled prop is true', () => {
      const onPress = jest.fn();
      const { getByTestId } = renderWithTheme(
        <Button disabled onPress={onPress} testID="btn">
          Disabled
        </Button>
      );

      const button = getByTestId('btn');
      fireEvent.press(button);

      expect(onPress).not.toHaveBeenCalled();
    });

    it('should show loading state', () => {
      const { getByTestId, queryByText } = renderWithTheme(
        <Button loading testID="btn">
          Loading
        </Button>
      );

      expect(getByTestId('btn')).toBeDefined();
      // Text should be hidden when loading
      expect(queryByText('Loading')).toBeNull();
    });

    it('should not call onPress when loading', () => {
      const onPress = jest.fn();
      const { getByTestId } = renderWithTheme(
        <Button loading onPress={onPress} testID="btn">
          Loading
        </Button>
      );

      fireEvent.press(getByTestId('btn'));

      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe('Interactions', () => {
    it('should call onPress when pressed', () => {
      const onPress = jest.fn();
      const { getByTestId } = renderWithTheme(
        <Button onPress={onPress} testID="btn">
          Press Me
        </Button>
      );

      fireEvent.press(getByTestId('btn'));

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('should not call onPress when disabled', () => {
      const onPress = jest.fn();
      const { getByTestId } = renderWithTheme(
        <Button disabled onPress={onPress} testID="btn">
          Disabled
        </Button>
      );

      fireEvent.press(getByTestId('btn'));

      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe('Full Width', () => {
    it('should render full width when fullWidth is true', () => {
      const { getByTestId } = renderWithTheme(
        <Button fullWidth testID="btn">
          Full Width
        </Button>
      );

      const button = getByTestId('btn');
      expect(button.props.style).toMatchObject({
        alignSelf: 'stretch',
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible role', () => {
      const { getByRole } = renderWithTheme(<Button>Accessible</Button>);
      expect(getByRole('button')).toBeDefined();
    });

    it('should have accessibility label', () => {
      const { getByLabelText } = renderWithTheme(
        <Button accessibilityLabel="Custom Label">Button</Button>
      );
      expect(getByLabelText('Custom Label')).toBeDefined();
    });

    it('should indicate disabled state to screen readers', () => {
      const { getByTestId } = renderWithTheme(
        <Button disabled testID="btn">
          Disabled
        </Button>
      );

      const button = getByTestId('btn');
      expect(button.props.accessibilityState).toEqual({ disabled: true });
    });
  });
});
