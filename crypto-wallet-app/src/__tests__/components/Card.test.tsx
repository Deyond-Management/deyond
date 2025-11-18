/**
 * Card Component Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card } from '../../components/atoms/Card';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Wrapper with theme provider
const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('Card', () => {
  describe('Rendering', () => {
    it('should render with children', () => {
      const { getByText } = renderWithTheme(
        <Card>
          <Text>Card Content</Text>
        </Card>
      );
      expect(getByText('Card Content')).toBeDefined();
    });

    it('should render with testID', () => {
      const { getByTestId } = renderWithTheme(
        <Card testID="test-card">
          <Text>Content</Text>
        </Card>
      );
      expect(getByTestId('test-card')).toBeDefined();
    });
  });

  describe('Elevation', () => {
    it('should render with default elevation', () => {
      const { getByTestId } = renderWithTheme(
        <Card testID="card">
          <Text>Content</Text>
        </Card>
      );
      const card = getByTestId('card');
      expect(card.props.style).toBeDefined();
    });

    it('should render with custom elevation', () => {
      const { getByTestId } = renderWithTheme(
        <Card testID="card" elevation={4}>
          <Text>Content</Text>
        </Card>
      );
      const card = getByTestId('card');
      expect(card.props.style).toBeDefined();
    });

    it('should render with zero elevation (flat)', () => {
      const { getByTestId } = renderWithTheme(
        <Card testID="card" elevation={0}>
          <Text>Content</Text>
        </Card>
      );
      const card = getByTestId('card');
      expect(card.props.style).toBeDefined();
    });
  });

  describe('Padding', () => {
    it('should have default padding', () => {
      const { getByTestId } = renderWithTheme(
        <Card testID="card">
          <Text>Content</Text>
        </Card>
      );
      const card = getByTestId('card');
      expect(card.props.style).toMatchObject(
        expect.objectContaining({ padding: expect.any(Number) })
      );
    });

    it('should support no padding', () => {
      const { getByTestId } = renderWithTheme(
        <Card testID="card" padding="none">
          <Text>Content</Text>
        </Card>
      );
      const card = getByTestId('card');
      expect(card.props.style).toMatchObject({ padding: 0 });
    });

    it('should support small padding', () => {
      const { getByTestId } = renderWithTheme(
        <Card testID="card" padding="sm">
          <Text>Content</Text>
        </Card>
      );
      const card = getByTestId('card');
      expect(card.props.style).toBeDefined();
    });

    it('should support large padding', () => {
      const { getByTestId } = renderWithTheme(
        <Card testID="card" padding="lg">
          <Text>Content</Text>
        </Card>
      );
      const card = getByTestId('card');
      expect(card.props.style).toBeDefined();
    });
  });

  describe('Border Radius', () => {
    it('should have default border radius', () => {
      const { getByTestId } = renderWithTheme(
        <Card testID="card">
          <Text>Content</Text>
        </Card>
      );
      const card = getByTestId('card');
      expect(card.props.style).toMatchObject(
        expect.objectContaining({ borderRadius: expect.any(Number) })
      );
    });

    it('should support custom border radius', () => {
      const { getByTestId } = renderWithTheme(
        <Card testID="card" borderRadius={20}>
          <Text>Content</Text>
        </Card>
      );
      const card = getByTestId('card');
      expect(card.props.style).toMatchObject({ borderRadius: 20 });
    });
  });

  describe('Background Color', () => {
    it('should use theme background color by default', () => {
      const { getByTestId } = renderWithTheme(
        <Card testID="card">
          <Text>Content</Text>
        </Card>
      );
      const card = getByTestId('card');
      expect(card.props.style).toMatchObject(
        expect.objectContaining({ backgroundColor: expect.any(String) })
      );
    });

    it('should support custom background color', () => {
      const { getByTestId } = renderWithTheme(
        <Card testID="card" backgroundColor="#FF0000">
          <Text>Content</Text>
        </Card>
      );
      const card = getByTestId('card');
      expect(card.props.style).toMatchObject({ backgroundColor: '#FF0000' });
    });
  });

  describe('Pressable', () => {
    it('should not be pressable by default', () => {
      const { getByTestId } = renderWithTheme(
        <Card testID="card">
          <Text>Content</Text>
        </Card>
      );
      const card = getByTestId('card');
      // If not pressable, it should be a View, not Pressable
      expect(card).toBeDefined();
    });

    it('should be pressable when onPress is provided', () => {
      const onPress = jest.fn();
      const { getByTestId } = renderWithTheme(
        <Card testID="card" onPress={onPress}>
          <Text>Content</Text>
        </Card>
      );
      const card = getByTestId('card');
      expect(card).toBeDefined();
    });
  });

  describe('Custom Styles', () => {
    it('should support custom container styles', () => {
      const customStyle = { margin: 10, width: 200 };
      const { getByTestId } = renderWithTheme(
        <Card testID="card" style={customStyle}>
          <Text>Content</Text>
        </Card>
      );
      const card = getByTestId('card');
      expect(card.props.style).toMatchObject(customStyle);
    });
  });

  describe('Accessibility', () => {
    it('should have accessibility role when pressable', () => {
      const onPress = jest.fn();
      const { getByTestId } = renderWithTheme(
        <Card testID="card" onPress={onPress}>
          <Text>Content</Text>
        </Card>
      );
      const card = getByTestId('card');
      expect(card).toBeDefined();
    });

    it('should support custom accessibility label', () => {
      const { getByLabelText } = renderWithTheme(
        <Card accessibilityLabel="Custom Card Label">
          <Text>Content</Text>
        </Card>
      );
      expect(getByLabelText('Custom Card Label')).toBeDefined();
    });
  });

  describe('Full Width', () => {
    it('should support full width', () => {
      const { getByTestId } = renderWithTheme(
        <Card testID="card" fullWidth>
          <Text>Content</Text>
        </Card>
      );
      const card = getByTestId('card');
      expect(card.props.style).toMatchObject({ alignSelf: 'stretch' });
    });
  });
});
