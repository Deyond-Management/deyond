/**
 * Checkbox Component
 * Custom checkbox with label support
 * Follows design system and accessibility standards
 */

import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export type CheckboxSize = 'small' | 'medium' | 'large';

export interface CheckboxProps {
  /** Checked state */
  value?: boolean;
  /** Label text */
  label?: string;
  /** Checkbox size */
  size?: CheckboxSize;
  /** Custom color */
  color?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Disable label press */
  labelDisabled?: boolean;
  /** Custom style */
  style?: ViewStyle;
  /** On value change handler */
  onValueChange?: (value: boolean) => void;
  /** Test ID */
  testID?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  value = false,
  label,
  size = 'medium',
  color,
  disabled = false,
  error = false,
  errorMessage,
  labelDisabled = false,
  style,
  onValueChange,
  testID,
  accessibilityLabel,
}) => {
  const { theme } = useTheme();

  // Handle press
  const handlePress = () => {
    if (!disabled && onValueChange) {
      onValueChange(!value);
    }
  };

  // Get checkbox size
  const getSize = (): number => {
    switch (size) {
      case 'small':
        return 20;
      case 'large':
        return 28;
      case 'medium':
      default:
        return 24;
    }
  };

  const checkboxSize = getSize();

  // Get checkbox color
  const getCheckboxColor = (): string => {
    if (disabled) {
      return theme.colors.text.disabled;
    }
    if (error) {
      return theme.isDark ? '#EF5350' : '#D32F2F';
    }
    if (value) {
      return color || (theme.isDark ? '#2196F3' : '#1976D2');
    }
    return 'transparent';
  };

  // Get border color
  const getBorderColor = (): string => {
    if (disabled) {
      return theme.colors.text.disabled;
    }
    if (error) {
      return theme.isDark ? '#EF5350' : '#D32F2F';
    }
    if (value) {
      return color || (theme.isDark ? '#2196F3' : '#1976D2');
    }
    return theme.isDark ? '#757575' : '#9E9E9E';
  };

  // Checkbox style
  const checkboxStyle: ViewStyle = {
    width: checkboxSize,
    height: checkboxSize,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: getBorderColor(),
    backgroundColor: getCheckboxColor(),
    alignItems: 'center',
    justifyContent: 'center',
    ...style,
  };

  // Container style
  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
  };

  // Label style
  const labelStyle: TextStyle = {
    marginLeft: theme.spacing.sm,
    color: disabled ? theme.colors.text.disabled : theme.colors.text.primary,
    fontSize: 16,
  };

  // Error message style
  const errorStyle: TextStyle = {
    color: theme.isDark ? '#EF5350' : '#D32F2F',
    fontSize: 12,
    marginTop: theme.spacing.xs,
  };

  // Checkmark icon size
  const checkmarkSize = checkboxSize * 0.6;

  return (
    <View>
      <View style={containerStyle}>
        <TouchableOpacity
          style={checkboxStyle}
          onPress={handlePress}
          disabled={disabled}
          activeOpacity={0.7}
          testID={testID}
          accessibilityRole="checkbox"
          accessibilityLabel={accessibilityLabel || label}
          accessibilityState={{
            checked: value,
            disabled,
          }}
        >
          {/* Checkmark */}
          {value && (
            <View
              style={{
                width: checkmarkSize,
                height: checkmarkSize * 0.5,
                borderLeftWidth: 2,
                borderBottomWidth: 2,
                borderColor: disabled ? theme.colors.text.hint : '#FFFFFF',
                transform: [{ rotate: '-45deg' }, { translateY: -2 }],
              }}
            />
          )}
        </TouchableOpacity>

        {/* Label */}
        {label &&
          (labelDisabled ? (
            <Text style={labelStyle}>{label}</Text>
          ) : (
            <TouchableOpacity onPress={handlePress} disabled={disabled} activeOpacity={0.7}>
              <Text style={labelStyle}>{label}</Text>
            </TouchableOpacity>
          ))}
      </View>

      {/* Error message */}
      {error && errorMessage && <Text style={errorStyle}>{errorMessage}</Text>}
    </View>
  );
};

export default Checkbox;
