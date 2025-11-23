/**
 * Avatar Component Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Avatar } from '../../components/atoms/Avatar';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Wrapper with theme provider
const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('Avatar', () => {
  describe('Rendering', () => {
    it('should render with initials', () => {
      const { getByText } = renderWithTheme(<Avatar name="John Doe" />);
      expect(getByText('JD')).toBeDefined();
    });

    it('should render with single name initial', () => {
      const { getByText } = renderWithTheme(<Avatar name="John" />);
      expect(getByText('J')).toBeDefined();
    });

    it('should render with custom initials', () => {
      const { getByText } = renderWithTheme(<Avatar initials="AB" />);
      expect(getByText('AB')).toBeDefined();
    });

    it('should render with testID', () => {
      const { getByTestId } = renderWithTheme(<Avatar name="John Doe" testID="avatar" />);
      expect(getByTestId('avatar')).toBeDefined();
    });

    it('should render with image source', () => {
      const { getByTestId } = renderWithTheme(
        <Avatar source={{ uri: 'https://example.com/avatar.jpg' }} testID="avatar" />
      );
      expect(getByTestId('avatar')).toBeDefined();
    });
  });

  describe('Sizes', () => {
    it('should render medium size by default', () => {
      const { getByTestId } = renderWithTheme(<Avatar name="John" testID="avatar" />);
      const avatar = getByTestId('avatar');
      expect(avatar.props.style).toMatchObject(
        expect.objectContaining({ width: expect.any(Number) })
      );
    });

    it('should render small size', () => {
      const { getByTestId } = renderWithTheme(<Avatar name="John" size="small" testID="avatar" />);
      const avatar = getByTestId('avatar');
      expect(avatar.props.style).toMatchObject(expect.objectContaining({ width: 32 }));
    });

    it('should render large size', () => {
      const { getByTestId } = renderWithTheme(<Avatar name="John" size="large" testID="avatar" />);
      const avatar = getByTestId('avatar');
      expect(avatar.props.style).toMatchObject(expect.objectContaining({ width: 64 }));
    });

    it('should render xlarge size', () => {
      const { getByTestId } = renderWithTheme(<Avatar name="John" size="xlarge" testID="avatar" />);
      const avatar = getByTestId('avatar');
      expect(avatar.props.style).toMatchObject(expect.objectContaining({ width: 96 }));
    });
  });

  describe('Shapes', () => {
    it('should be circular by default', () => {
      const { getByTestId } = renderWithTheme(<Avatar name="John" testID="avatar" />);
      const avatar = getByTestId('avatar');
      expect(avatar.props.style).toMatchObject(
        expect.objectContaining({ borderRadius: expect.any(Number) })
      );
    });

    it('should support square shape', () => {
      const { getByTestId } = renderWithTheme(
        <Avatar name="John" shape="square" testID="avatar" />
      );
      const avatar = getByTestId('avatar');
      const style = avatar.props.style;
      // Square should have smaller border radius
      expect(style.borderRadius).toBeLessThan(style.width / 2);
    });
  });

  describe('Colors', () => {
    it('should have default background color', () => {
      const { getByTestId } = renderWithTheme(<Avatar name="John" testID="avatar" />);
      const avatar = getByTestId('avatar');
      expect(avatar.props.style).toMatchObject(
        expect.objectContaining({ backgroundColor: expect.any(String) })
      );
    });

    it('should support custom background color', () => {
      const { getByTestId } = renderWithTheme(
        <Avatar name="John" backgroundColor="#FF0000" testID="avatar" />
      );
      const avatar = getByTestId('avatar');
      expect(avatar.props.style).toMatchObject({ backgroundColor: '#FF0000' });
    });

    it('should support custom text color', () => {
      const { getByTestId } = renderWithTheme(
        <Avatar name="John" textColor="#00FF00" testID="avatar" />
      );
      const avatar = getByTestId('avatar');
      expect(avatar).toBeDefined();
    });
  });

  describe('Badge', () => {
    it('should render without badge by default', () => {
      const { queryByTestId } = renderWithTheme(<Avatar name="John" />);
      expect(queryByTestId('avatar-badge')).toBeNull();
    });

    it('should render with online badge', () => {
      const { getByTestId } = renderWithTheme(<Avatar name="John" badgeStatus="online" />);
      expect(getByTestId('avatar-badge')).toBeDefined();
    });

    it('should render with offline badge', () => {
      const { getByTestId } = renderWithTheme(<Avatar name="John" badgeStatus="offline" />);
      expect(getByTestId('avatar-badge')).toBeDefined();
    });

    it('should render with busy badge', () => {
      const { getByTestId } = renderWithTheme(<Avatar name="John" badgeStatus="busy" />);
      expect(getByTestId('avatar-badge')).toBeDefined();
    });
  });

  describe('Initials Generation', () => {
    it('should generate initials from full name', () => {
      const { getByText } = renderWithTheme(<Avatar name="Jane Smith" />);
      expect(getByText('JS')).toBeDefined();
    });

    it('should handle names with more than two words', () => {
      const { getByText } = renderWithTheme(<Avatar name="John Paul Smith" />);
      // Should take first and last name initials
      expect(getByText('JS')).toBeDefined();
    });

    it('should handle empty name', () => {
      const { getByText } = renderWithTheme(<Avatar name="" />);
      expect(getByText('?')).toBeDefined();
    });

    it('should convert initials to uppercase', () => {
      const { getByText } = renderWithTheme(<Avatar name="john doe" />);
      expect(getByText('JD')).toBeDefined();
    });
  });

  describe('Border', () => {
    it('should support border', () => {
      const { getByTestId } = renderWithTheme(<Avatar name="John" border testID="avatar" />);
      const avatar = getByTestId('avatar');
      expect(avatar.props.style).toMatchObject(
        expect.objectContaining({ borderWidth: expect.any(Number) })
      );
    });

    it('should support custom border color', () => {
      const { getByTestId } = renderWithTheme(
        <Avatar name="John" border borderColor="#FF00FF" testID="avatar" />
      );
      const avatar = getByTestId('avatar');
      expect(avatar.props.style).toMatchObject({ borderColor: '#FF00FF' });
    });
  });

  describe('Accessibility', () => {
    it('should have accessibility label from name', () => {
      const { getByLabelText } = renderWithTheme(<Avatar name="John Doe" />);
      expect(getByLabelText('John Doe')).toBeDefined();
    });

    it('should have custom accessibility label', () => {
      const { getByLabelText } = renderWithTheme(
        <Avatar name="John" accessibilityLabel="User profile picture" />
      );
      expect(getByLabelText('User profile picture')).toBeDefined();
    });

    it('should have image role', () => {
      const { getByTestId } = renderWithTheme(<Avatar name="John" testID="avatar" />);
      const avatar = getByTestId('avatar');
      expect(avatar.props.accessibilityRole).toBe('image');
    });
  });

  describe('Custom Styles', () => {
    it('should support custom container styles', () => {
      const customStyle = { margin: 10 };
      const { getByTestId } = renderWithTheme(
        <Avatar name="John" style={customStyle} testID="avatar" />
      );
      const avatar = getByTestId('avatar');
      expect(avatar.props.style).toMatchObject(customStyle);
    });
  });
});
