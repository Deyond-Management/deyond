/**
 * Divider Component Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Divider } from '../../components/atoms/Divider';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Wrapper with theme provider
const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('Divider', () => {
  describe('Rendering', () => {
    it('should render horizontal divider by default', () => {
      const { getByTestId } = renderWithTheme(<Divider testID="divider" />);
      const divider = getByTestId('divider');
      expect(divider).toBeDefined();
      expect(divider.props.style).toMatchObject(
        expect.objectContaining({ height: expect.any(Number) })
      );
    });

    it('should render vertical divider', () => {
      const { getByTestId } = renderWithTheme(<Divider orientation="vertical" testID="divider" />);
      const divider = getByTestId('divider');
      expect(divider.props.style).toMatchObject(
        expect.objectContaining({ width: expect.any(Number) })
      );
    });

    it('should render with testID', () => {
      const { getByTestId } = renderWithTheme(<Divider testID="test-divider" />);
      expect(getByTestId('test-divider')).toBeDefined();
    });
  });

  describe('Thickness', () => {
    it('should have default thickness of 1', () => {
      const { getByTestId } = renderWithTheme(<Divider testID="divider" />);
      const divider = getByTestId('divider');
      expect(divider.props.style).toMatchObject({ height: 1 });
    });

    it('should support custom thickness for horizontal divider', () => {
      const { getByTestId } = renderWithTheme(<Divider thickness={2} testID="divider" />);
      const divider = getByTestId('divider');
      expect(divider.props.style).toMatchObject({ height: 2 });
    });

    it('should support custom thickness for vertical divider', () => {
      const { getByTestId } = renderWithTheme(
        <Divider orientation="vertical" thickness={2} testID="divider" />
      );
      const divider = getByTestId('divider');
      expect(divider.props.style).toMatchObject({ width: 2 });
    });
  });

  describe('Colors', () => {
    it('should use theme color by default', () => {
      const { getByTestId } = renderWithTheme(<Divider testID="divider" />);
      const divider = getByTestId('divider');
      expect(divider.props.style).toMatchObject(
        expect.objectContaining({ backgroundColor: expect.any(String) })
      );
    });

    it('should support custom color', () => {
      const { getByTestId } = renderWithTheme(<Divider color="#FF0000" testID="divider" />);
      const divider = getByTestId('divider');
      expect(divider.props.style).toMatchObject({
        backgroundColor: '#FF0000',
      });
    });
  });

  describe('Spacing', () => {
    it('should have no spacing by default', () => {
      const { getByTestId } = renderWithTheme(<Divider testID="divider" />);
      const divider = getByTestId('divider');
      const style = divider.props.style;
      expect(style.marginVertical).toBeUndefined();
      expect(style.marginHorizontal).toBeUndefined();
    });

    it('should support vertical spacing for horizontal divider', () => {
      const { getByTestId } = renderWithTheme(<Divider spacing={16} testID="divider" />);
      const divider = getByTestId('divider');
      expect(divider.props.style).toMatchObject({ marginVertical: 16 });
    });

    it('should support horizontal spacing for vertical divider', () => {
      const { getByTestId } = renderWithTheme(
        <Divider orientation="vertical" spacing={16} testID="divider" />
      );
      const divider = getByTestId('divider');
      expect(divider.props.style).toMatchObject({ marginHorizontal: 16 });
    });
  });

  describe('Full Width/Height', () => {
    it('should be full width by default for horizontal divider', () => {
      const { getByTestId } = renderWithTheme(<Divider testID="divider" />);
      const divider = getByTestId('divider');
      expect(divider.props.style).toMatchObject({ alignSelf: 'stretch' });
    });

    it('should be full height for vertical divider', () => {
      const { getByTestId } = renderWithTheme(<Divider orientation="vertical" testID="divider" />);
      const divider = getByTestId('divider');
      expect(divider.props.style).toMatchObject({ alignSelf: 'stretch' });
    });
  });

  describe('Custom Styles', () => {
    it('should support custom styles', () => {
      const customStyle = { opacity: 0.5 };
      const { getByTestId } = renderWithTheme(<Divider style={customStyle} testID="divider" />);
      const divider = getByTestId('divider');
      expect(divider.props.style).toMatchObject(customStyle);
    });
  });

  describe('Accessibility', () => {
    it('should have none accessibility role', () => {
      const { getByTestId } = renderWithTheme(<Divider testID="divider" />);
      const divider = getByTestId('divider');
      expect(divider.props.accessibilityRole).toBe('none');
    });
  });
});
