/**
 * IconButton Component
 * Icon-only button for actions and navigation
 * Follows design system and accessibility standards
 */

import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  TouchableOpacityProps,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export type IconButtonVariant = 'default' | 'primary' | 'text' | 'outlined';
export type IconButtonSize = 'small' | 'medium' | 'large';

export interface IconButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  /** Icon element to display */
  icon: React.ReactNode;
  /** Button variant */
  variant?: IconButtonVariant;
  /** Button size */
  size?: IconButtonSize;
  /** Icon color */
  color?: string;
  /** Background color */
  backgroundColor?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Custom style */
  style?: ViewStyle;
  /** On press handler */
  onPress?: () => void;
  /** Test ID */
  testID?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = 'default',
  size = 'medium',
  color,
  backgroundColor,
  disabled = false,
  loading = false,
  style,
  onPress,
  testID,
  accessibilityLabel,
  ...props
}) => {
  const { theme } = useTheme();

  // Determine if button is pressable
  const isPressable = !disabled && !loading;

  // Get button size
  const getSize = (): number => {
    switch (size) {
      case 'small':
        return 32;
      case 'large':
        return 56;
      case 'medium':
      default:
        return 44;
    }
  };

  const buttonSize = getSize();

  // Get icon size
  const getIconSize = (): number => {
    switch (size) {
      case 'small':
        return 18;
      case 'large':
        return 28;
      case 'medium':
      default:
        return 24;
    }
  };

  const iconSize = getIconSize();

  // Get background color
  const getBackgroundColor = (): string => {
    if (backgroundColor) return backgroundColor;

    if (disabled) {
      return theme.isDark ? '#2C2C2C' : '#F5F5F5';
    }

    switch (variant) {
      case 'primary':
        return theme.isDark ? '#1976D2' : '#2196F3';
      case 'text':
        return 'transparent';
      case 'outlined':
        return 'transparent';
      case 'default':
      default:
        return theme.isDark ? '#424242' : '#E0E0E0';
    }
  };

  // Get icon color
  const getIconColor = (): string => {
    if (color) return color;

    if (disabled) {
      return theme.colors.text.disabled;
    }

    switch (variant) {
      case 'primary':
        return '#FFFFFF';
      case 'text':
      case 'outlined':
        return theme.colors.text.primary;
      case 'default':
      default:
        return theme.colors.text.primary;
    }
  };

  // Get border style for outlined variant
  const getBorderStyle = () => {
    if (variant === 'outlined') {
      return {
        borderWidth: 1,
        borderColor: disabled
          ? theme.colors.text.disabled
          : color || theme.colors.text.primary,
      };
    }
    return {};
  };

  // Container style
  const containerStyle: ViewStyle = {
    width: buttonSize,
    height: buttonSize,
    borderRadius: buttonSize / 2, // Circular
    backgroundColor: getBackgroundColor(),
    alignItems: 'center',
    justifyContent: 'center',
    ...getBorderStyle(),
    ...style,
  };

  // Clone icon element with color
  const renderIcon = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size={size === 'small' ? 'small' : 'small'}
          color={getIconColor()}
        />
      );
    }

    if (React.isValidElement(icon)) {
      return React.cloneElement(icon as React.ReactElement<any>, {
        color: getIconColor(),
        size: iconSize,
      });
    }

    return icon;
  };

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={isPressable ? onPress : undefined}
      disabled={!isPressable}
      activeOpacity={0.7}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: disabled || loading }}
      {...props}
    >
      {renderIcon()}
    </TouchableOpacity>
  );
};

export default IconButton;
