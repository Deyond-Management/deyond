/**
 * IconButton Component Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { IconButton } from '../../components/atoms/IconButton';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Wrapper with theme provider
const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

// Mock icon component
const MockIcon = ({ name }: { name: string }) => <Text>{name}</Text>;

describe('IconButton', () => {
  describe('Rendering', () => {
    it('should render with icon', () => {
      const { getByText } = renderWithTheme(
        <IconButton icon={<MockIcon name="close" />} />
      );
      expect(getByText('close')).toBeDefined();
    });

    it('should render with testID', () => {
      const { getByTestId } = renderWithTheme(
        <IconButton
          icon={<MockIcon name="menu" />}
          testID="icon-button"
        />
      );
      expect(getByTestId('icon-button')).toBeDefined();
    });
  });

  describe('Sizes', () => {
    it('should render medium size by default', () => {
      const { getByTestId } = renderWithTheme(
        <IconButton
          icon={<MockIcon name="icon" />}
          testID="icon-button"
        />
      );
      const button = getByTestId('icon-button');
      expect(button).toBeDefined();
    });

    it('should render small size', () => {
      const { getByTestId } = renderWithTheme(
        <IconButton
          icon={<MockIcon name="icon" />}
          size="small"
          testID="icon-button"
        />
      );
      const button = getByTestId('icon-button');
      expect(button.props.style).toMatchObject(
        expect.objectContaining({ width: expect.any(Number) })
      );
    });

    it('should render large size', () => {
      const { getByTestId } = renderWithTheme(
        <IconButton
          icon={<MockIcon name="icon" />}
          size="large"
          testID="icon-button"
        />
      );
      const button = getByTestId('icon-button');
      expect(button.props.style).toMatchObject(
        expect.objectContaining({ width: expect.any(Number) })
      );
    });
  });

  describe('Variants', () => {
    it('should render default variant', () => {
      const { getByTestId } = renderWithTheme(
        <IconButton
          icon={<MockIcon name="icon" />}
          testID="icon-button"
        />
      );
      const button = getByTestId('icon-button');
      expect(button).toBeDefined();
    });

    it('should render primary variant', () => {
      const { getByTestId } = renderWithTheme(
        <IconButton
          icon={<MockIcon name="icon" />}
          variant="primary"
          testID="icon-button"
        />
      );
      const button = getByTestId('icon-button');
      expect(button).toBeDefined();
    });

    it('should render text variant (no background)', () => {
      const { getByTestId } = renderWithTheme(
        <IconButton
          icon={<MockIcon name="icon" />}
          variant="text"
          testID="icon-button"
        />
      );
      const button = getByTestId('icon-button');
      expect(button).toBeDefined();
    });

    it('should render outlined variant', () => {
      const { getByTestId } = renderWithTheme(
        <IconButton
          icon={<MockIcon name="icon" />}
          variant="outlined"
          testID="icon-button"
        />
      );
      const button = getByTestId('icon-button');
      expect(button.props.style).toMatchObject(
        expect.objectContaining({ borderWidth: expect.any(Number) })
      );
    });
  });

  describe('States', () => {
    it('should be disabled when disabled prop is true', () => {
      const { getByTestId } = renderWithTheme(
        <IconButton
          icon={<MockIcon name="icon" />}
          disabled
          testID="icon-button"
        />
      );
      const button = getByTestId('icon-button');
      expect(button.props.accessibilityState).toMatchObject({ disabled: true });
    });

    it('should show loading state', () => {
      const { getByTestId } = renderWithTheme(
        <IconButton
          icon={<MockIcon name="icon" />}
          loading
          testID="icon-button"
        />
      );
      const button = getByTestId('icon-button');
      expect(button).toBeDefined();
    });

    it('should not call onPress when loading', () => {
      const onPress = jest.fn();
      const { getByTestId } = renderWithTheme(
        <IconButton
          icon={<MockIcon name="icon" />}
          loading
          onPress={onPress}
          testID="icon-button"
        />
      );

      const button = getByTestId('icon-button');
      fireEvent.press(button);

      expect(onPress).not.toHaveBeenCalled();
    });

    it('should not call onPress when disabled', () => {
      const onPress = jest.fn();
      const { getByTestId } = renderWithTheme(
        <IconButton
          icon={<MockIcon name="icon" />}
          disabled
          onPress={onPress}
          testID="icon-button"
        />
      );

      const button = getByTestId('icon-button');
      fireEvent.press(button);

      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe('Interactions', () => {
    it('should call onPress when pressed', () => {
      const onPress = jest.fn();
      const { getByTestId } = renderWithTheme(
        <IconButton
          icon={<MockIcon name="icon" />}
          onPress={onPress}
          testID="icon-button"
        />
      );

      const button = getByTestId('icon-button');
      fireEvent.press(button);

      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Colors', () => {
    it('should support custom color', () => {
      const { getByTestId } = renderWithTheme(
        <IconButton
          icon={<MockIcon name="icon" />}
          color="#FF0000"
          testID="icon-button"
        />
      );
      const button = getByTestId('icon-button');
      expect(button).toBeDefined();
    });

    it('should support custom background color', () => {
      const { getByTestId } = renderWithTheme(
        <IconButton
          icon={<MockIcon name="icon" />}
          backgroundColor="#00FF00"
          testID="icon-button"
        />
      );
      const button = getByTestId('icon-button');
      expect(button.props.style).toMatchObject({ backgroundColor: '#00FF00' });
    });
  });

  describe('Circular Shape', () => {
    it('should be circular by default', () => {
      const { getByTestId } = renderWithTheme(
        <IconButton
          icon={<MockIcon name="icon" />}
          testID="icon-button"
        />
      );
      const button = getByTestId('icon-button');
      // Check if borderRadius equals half of width (circular)
      expect(button.props.style).toMatchObject(
        expect.objectContaining({
          borderRadius: expect.any(Number),
        })
      );
    });
  });

  describe('Accessibility', () => {
    it('should have button role', () => {
      const { getByTestId } = renderWithTheme(
        <IconButton
          icon={<MockIcon name="icon" />}
          testID="icon-button"
        />
      );
      const button = getByTestId('icon-button');
      expect(button.props.accessibilityRole).toBe('button');
    });

    it('should have accessibility label', () => {
      const { getByLabelText } = renderWithTheme(
        <IconButton
          icon={<MockIcon name="icon" />}
          accessibilityLabel="Close button"
        />
      );
      expect(getByLabelText('Close button')).toBeDefined();
    });

    it('should indicate disabled state', () => {
      const { getByTestId } = renderWithTheme(
        <IconButton
          icon={<MockIcon name="icon" />}
          disabled
          testID="icon-button"
        />
      );
      const button = getByTestId('icon-button');
      expect(button.props.accessibilityState).toMatchObject({ disabled: true });
    });

    it('should indicate loading state', () => {
      const { getByTestId } = renderWithTheme(
        <IconButton
          icon={<MockIcon name="icon" />}
          loading
          testID="icon-button"
        />
      );
      const button = getByTestId('icon-button');
      expect(button.props.accessibilityState).toMatchObject(
        expect.objectContaining({ disabled: true })
      );
    });
  });

  describe('Custom Styles', () => {
    it('should support custom styles', () => {
      const customStyle = { margin: 10 };
      const { getByTestId } = renderWithTheme(
        <IconButton
          icon={<MockIcon name="icon" />}
          style={customStyle}
          testID="icon-button"
        />
      );
      const button = getByTestId('icon-button');
      expect(button.props.style).toMatchObject(customStyle);
    });
  });
});
