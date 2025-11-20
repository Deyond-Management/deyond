/**
 * Avatar Component
 * User avatar with initials or image
 * Follows design system and accessibility standards
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  ViewStyle,
  TextStyle,
  ImageSourcePropType,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export type AvatarSize = 'small' | 'medium' | 'large' | 'xlarge';
export type AvatarShape = 'circular' | 'square';
export type BadgeStatus = 'online' | 'offline' | 'busy';

export interface AvatarProps {
  /** User name (for generating initials) */
  name?: string;
  /** Custom initials */
  initials?: string;
  /** Image source */
  source?: ImageSourcePropType;
  /** Avatar size */
  size?: AvatarSize;
  /** Avatar shape */
  shape?: AvatarShape;
  /** Background color */
  backgroundColor?: string;
  /** Text color */
  textColor?: string;
  /** Badge status indicator */
  badgeStatus?: BadgeStatus;
  /** Show border */
  border?: boolean;
  /** Border color */
  borderColor?: string;
  /** Custom style */
  style?: ViewStyle;
  /** Test ID */
  testID?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  initials,
  source,
  size = 'medium',
  shape = 'circular',
  backgroundColor,
  textColor,
  badgeStatus,
  border = false,
  borderColor,
  style,
  testID,
  accessibilityLabel,
}) => {
  const { theme } = useTheme();

  // Get avatar size
  const getSize = (): number => {
    switch (size) {
      case 'small':
        return 32;
      case 'large':
        return 64;
      case 'xlarge':
        return 96;
      case 'medium':
      default:
        return 48;
    }
  };

  const avatarSize = getSize();

  // Get font size based on avatar size
  const getFontSize = (): number => {
    switch (size) {
      case 'small':
        return 12;
      case 'large':
        return 24;
      case 'xlarge':
        return 36;
      case 'medium':
      default:
        return 18;
    }
  };

  // Generate initials from name
  const getInitials = (): string => {
    if (initials) return initials.toUpperCase();
    if (!name) return '?';

    const words = name.trim().split(/\s+/);
    if (words.length === 0) return '?';
    if (words.length === 1) return words[0].charAt(0).toUpperCase();

    // Take first and last word
    const firstInitial = words[0].charAt(0);
    const lastInitial = words[words.length - 1].charAt(0);
    return (firstInitial + lastInitial).toUpperCase();
  };

  // Get border radius
  const getBorderRadius = (): number => {
    if (shape === 'square') {
      return 8;
    }
    return avatarSize / 2; // Circular
  };

  // Get background color (deterministic based on name)
  const getBackgroundColor = (): string => {
    if (backgroundColor) return backgroundColor;

    // Generate color based on name
    if (name) {
      const colors = [
        '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
        '#2196F3', '#00BCD4', '#009688', '#4CAF50',
        '#FF9800', '#FF5722', '#795548', '#607D8B',
      ];
      const charCode = name.charCodeAt(0) + name.charCodeAt(name.length - 1);
      return colors[charCode % colors.length];
    }

    return theme.isDark ? '#424242' : '#BDBDBD';
  };

  // Get text color
  const getTextColor = (): string => {
    if (textColor) return textColor;
    return '#FFFFFF';
  };

  // Get badge color
  const getBadgeColor = (): string => {
    switch (badgeStatus) {
      case 'online':
        return '#4CAF50';
      case 'offline':
        return '#9E9E9E';
      case 'busy':
        return '#F44336';
      default:
        return 'transparent';
    }
  };

  // Container style
  const containerStyle: ViewStyle = {
    width: avatarSize,
    height: avatarSize,
    borderRadius: getBorderRadius(),
    backgroundColor: getBackgroundColor(),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...(border && {
      borderWidth: 2,
      borderColor: borderColor || theme.colors.card,
    }),
    ...style,
  };

  // Text style
  const textStyle: TextStyle = {
    color: getTextColor(),
    fontSize: getFontSize(),
    fontWeight: '600',
  };

  // Badge style
  const badgeStyle: ViewStyle = {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: avatarSize * 0.25,
    height: avatarSize * 0.25,
    borderRadius: (avatarSize * 0.25) / 2,
    backgroundColor: getBadgeColor(),
    borderWidth: 2,
    borderColor: theme.colors.card,
  };

  return (
    <View>
      <View
        style={containerStyle}
        testID={testID}
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel || name || 'Avatar'}
      >
        {source ? (
          <Image
            source={source}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <Text style={textStyle}>{getInitials()}</Text>
        )}
      </View>

      {/* Badge indicator */}
      {badgeStatus && <View style={badgeStyle} testID="avatar-badge" />}
    </View>
  );
};

export default Avatar;
