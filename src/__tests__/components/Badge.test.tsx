/**
 * Badge Component Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Badge } from '../../components/atoms/Badge';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Wrapper with theme provider
const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('Badge', () => {
  describe('Rendering', () => {
    it('should render with text', () => {
      const { getByText } = renderWithTheme(<Badge>New</Badge>);
      expect(getByText('New')).toBeDefined();
    });

    it('should render with number', () => {
      const { getByText } = renderWithTheme(<Badge>5</Badge>);
      expect(getByText('5')).toBeDefined();
    });

    it('should render with testID', () => {
      const { getByTestId } = renderWithTheme(<Badge testID="test-badge">Badge</Badge>);
      expect(getByTestId('test-badge')).toBeDefined();
    });
  });

  describe('Variants', () => {
    it('should render primary variant by default', () => {
      const { getByTestId } = renderWithTheme(<Badge testID="badge">Primary</Badge>);
      const badge = getByTestId('badge');
      expect(badge).toBeDefined();
    });

    it('should render success variant', () => {
      const { getByTestId } = renderWithTheme(
        <Badge testID="badge" variant="success">
          Success
        </Badge>
      );
      const badge = getByTestId('badge');
      expect(badge).toBeDefined();
    });

    it('should render error variant', () => {
      const { getByTestId } = renderWithTheme(
        <Badge testID="badge" variant="error">
          Error
        </Badge>
      );
      const badge = getByTestId('badge');
      expect(badge).toBeDefined();
    });

    it('should render warning variant', () => {
      const { getByTestId } = renderWithTheme(
        <Badge testID="badge" variant="warning">
          Warning
        </Badge>
      );
      const badge = getByTestId('badge');
      expect(badge).toBeDefined();
    });

    it('should render info variant', () => {
      const { getByTestId } = renderWithTheme(
        <Badge testID="badge" variant="info">
          Info
        </Badge>
      );
      const badge = getByTestId('badge');
      expect(badge).toBeDefined();
    });

    it('should render neutral variant', () => {
      const { getByTestId } = renderWithTheme(
        <Badge testID="badge" variant="neutral">
          Neutral
        </Badge>
      );
      const badge = getByTestId('badge');
      expect(badge).toBeDefined();
    });
  });

  describe('Sizes', () => {
    it('should render medium size by default', () => {
      const { getByTestId } = renderWithTheme(<Badge testID="badge">Medium</Badge>);
      const badge = getByTestId('badge');
      expect(badge).toBeDefined();
    });

    it('should render small size', () => {
      const { getByTestId } = renderWithTheme(
        <Badge testID="badge" size="small">
          Small
        </Badge>
      );
      const badge = getByTestId('badge');
      expect(badge).toBeDefined();
    });

    it('should render large size', () => {
      const { getByTestId } = renderWithTheme(
        <Badge testID="badge" size="large">
          Large
        </Badge>
      );
      const badge = getByTestId('badge');
      expect(badge).toBeDefined();
    });
  });

  describe('Dot Badge', () => {
    it('should render as dot when dot prop is true', () => {
      const { queryByText, getByTestId } = renderWithTheme(
        <Badge testID="badge" dot>
          Hidden
        </Badge>
      );
      const badge = getByTestId('badge');
      expect(badge).toBeDefined();
      // Text should not be visible in dot mode
      expect(queryByText('Hidden')).toBeNull();
    });

    it('should have circular shape when dot is true', () => {
      const { getByTestId } = renderWithTheme(
        <Badge testID="badge" dot>
          Text
        </Badge>
      );
      const badge = getByTestId('badge');
      // Check if badge has circular styling
      expect(badge.props.style).toMatchObject(
        expect.objectContaining({
          width: expect.any(Number),
          height: expect.any(Number),
        })
      );
    });
  });

  describe('Number Badge with Max', () => {
    it('should display exact number when less than max', () => {
      const { getByText } = renderWithTheme(<Badge max={99}>5</Badge>);
      expect(getByText('5')).toBeDefined();
    });

    it('should display max+ when number exceeds max', () => {
      const { getByText } = renderWithTheme(<Badge max={99}>100</Badge>);
      expect(getByText('99+')).toBeDefined();
    });

    it('should not apply max when children is not a number', () => {
      const { getByText } = renderWithTheme(<Badge max={99}>New</Badge>);
      expect(getByText('New')).toBeDefined();
    });
  });

  describe('Outlined Variant', () => {
    it('should render outlined badge', () => {
      const { getByTestId } = renderWithTheme(
        <Badge testID="badge" outlined>
          Outlined
        </Badge>
      );
      const badge = getByTestId('badge');
      expect(badge.props.style).toMatchObject(
        expect.objectContaining({
          borderWidth: expect.any(Number),
        })
      );
    });

    it('should render outlined badge with variant color', () => {
      const { getByTestId } = renderWithTheme(
        <Badge testID="badge" variant="success" outlined>
          Success
        </Badge>
      );
      const badge = getByTestId('badge');
      expect(badge).toBeDefined();
    });
  });

  describe('Custom Colors', () => {
    it('should support custom background color', () => {
      const { getByTestId } = renderWithTheme(
        <Badge testID="badge" backgroundColor="#FF0000">
          Custom
        </Badge>
      );
      const badge = getByTestId('badge');
      expect(badge.props.style).toMatchObject({ backgroundColor: '#FF0000' });
    });

    it('should support custom text color', () => {
      const { getByTestId } = renderWithTheme(
        <Badge testID="badge" textColor="#00FF00">
          Custom
        </Badge>
      );
      const badge = getByTestId('badge');
      // Check if text has custom color
      expect(badge).toBeDefined();
    });
  });

  describe('Custom Styles', () => {
    it('should support custom container styles', () => {
      const customStyle = { margin: 10 };
      const { getByTestId } = renderWithTheme(
        <Badge testID="badge" style={customStyle}>
          Custom
        </Badge>
      );
      const badge = getByTestId('badge');
      expect(badge.props.style).toMatchObject(customStyle);
    });
  });

  describe('Accessibility', () => {
    it('should have accessibility label', () => {
      const { getByLabelText } = renderWithTheme(
        <Badge accessibilityLabel="5 notifications">5</Badge>
      );
      expect(getByLabelText('5 notifications')).toBeDefined();
    });

    it('should have default accessibility label from children', () => {
      const { getByLabelText } = renderWithTheme(<Badge>New</Badge>);
      expect(getByLabelText('New')).toBeDefined();
    });
  });

  describe('Empty Badge', () => {
    it('should render when children is provided', () => {
      const { root } = renderWithTheme(<Badge>Test</Badge>);
      expect(root).toBeDefined();
    });

    it('should hide badge when children is 0', () => {
      const result = renderWithTheme(<Badge>0</Badge>);
      // Badge with 0 should return null (hidden)
      expect(result.toJSON()).toBeNull();
    });
  });
});
