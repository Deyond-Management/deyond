/**
 * Button Component
 * Reusable button with multiple variants and sizes
 * Follows design system and accessibility standards
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export type ButtonVariant = 'primary' | 'secondary' | 'text' | 'outlined';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  /** Button content */
  children: React.ReactNode;
  /** Button variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Full width button */
  fullWidth?: boolean;
  /** Custom style */
  style?: ViewStyle;
  /** Text style */
  textStyle?: TextStyle;
  /** On press handler */
  onPress?: () => void;
  /** Test ID */
  testID?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  onPress,
  testID,
  accessibilityLabel,
  ...props
}) => {
  const { theme } = useTheme();

  // Determine if button is pressable
  const isPressable = !disabled && !loading;

  // Get button background color
  const getBackgroundColor = (): string => {
    if (disabled) {
      return theme.colors.text.disabled;
    }

    switch (variant) {
      case 'primary':
        return theme.colors.text.primary;
      case 'secondary':
        return theme.isDark ? '#424242' : '#E0E0E0';
      case 'text':
      case 'outlined':
        return 'transparent';
      default:
        return theme.colors.text.primary;
    }
  };

  // Get text color
  const getTextColor = (): string => {
    if (disabled) {
      return theme.colors.text.hint;
    }

    switch (variant) {
      case 'primary':
        return theme.isDark ? '#FFFFFF' : '#FFFFFF';
      case 'secondary':
        return theme.colors.text.primary;
      case 'text':
      case 'outlined':
        return theme.colors.text.primary;
      default:
        return '#FFFFFF';
    }
  };

  // Get padding based on size
  const getPadding = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: theme.spacing.md,
        };
      case 'large':
        return {
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.xl,
        };
      case 'medium':
      default:
        return {
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.lg,
        };
    }
  };

  // Get font size based on size
  const getFontSize = () => {
    switch (size) {
      case 'small':
        return 14;
      case 'large':
        return 18;
      case 'medium':
      default:
        return 16;
    }
  };

  // Get border style for outlined variant
  const getBorderStyle = () => {
    if (variant === 'outlined') {
      return {
        borderWidth: 1,
        borderColor: disabled ? theme.colors.text.disabled : theme.colors.text.primary,
      };
    }
    return {};
  };

  // Container style
  const containerStyle: ViewStyle = {
    backgroundColor: getBackgroundColor(),
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: size === 'small' ? 36 : size === 'large' ? 56 : 44,
    ...getPadding(),
    ...getBorderStyle(),
    ...(fullWidth && { alignSelf: 'stretch' }),
    ...style,
  };

  // Text style
  const buttonTextStyle: TextStyle = {
    color: getTextColor(),
    fontSize: getFontSize(),
    fontWeight: '600',
    ...textStyle,
  };

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={isPressable ? onPress : undefined}
      disabled={!isPressable}
      activeOpacity={0.7}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : undefined)}
      accessibilityState={{ disabled: disabled || loading }}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={getTextColor()}
          size={size === 'small' ? 'small' : 'small'}
        />
      ) : (
        <Text style={buttonTextStyle}>{children}</Text>
      )}
    </TouchableOpacity>
  );
};

export default Button;
