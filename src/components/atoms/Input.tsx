/**
 * Input Component
 * Reusable input with multiple types and validation support
 * Follows design system and accessibility standards
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export type InputType = 'text' | 'password' | 'email' | 'number';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  /** Input label */
  label?: string;
  /** Input type */
  type?: InputType;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Container style */
  containerStyle?: ViewStyle;
  /** Input style */
  inputStyle?: TextStyle;
  /** Label style */
  labelStyle?: TextStyle;
  /** Test ID */
  testID?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** On change text handler */
  onChangeText?: (text: string) => void;
  /** On focus handler */
  onFocus?: () => void;
  /** On blur handler */
  onBlur?: () => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  type = 'text',
  error,
  helperText,
  disabled = false,
  containerStyle,
  inputStyle,
  labelStyle,
  testID,
  accessibilityLabel,
  onChangeText,
  onFocus,
  onBlur,
  ...props
}) => {
  const { theme } = useTheme();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Determine keyboard type based on input type
  const getKeyboardType = (): TextInputProps['keyboardType'] => {
    switch (type) {
      case 'email':
        return 'email-address';
      case 'number':
        return 'numeric';
      default:
        return 'default';
    }
  };

  // Determine if secure text entry
  const isSecureTextEntry = type === 'password' && !isPasswordVisible;

  // Get border color based on state
  const getBorderColor = (): string => {
    if (error) {
      return theme.isDark ? '#EF5350' : '#D32F2F';
    }
    if (isFocused) {
      return theme.colors.text.primary;
    }
    if (disabled) {
      return theme.colors.text.disabled;
    }
    return theme.isDark ? '#424242' : '#E0E0E0';
  };

  // Get background color
  const getBackgroundColor = (): string => {
    if (disabled) {
      return theme.isDark ? '#1E1E1E' : '#F5F5F5';
    }
    return theme.isDark ? '#2C2C2C' : '#FFFFFF';
  };

  // Container style
  const containerStyles: ViewStyle = {
    width: '100%',
    ...containerStyle,
  };

  // Input container style
  const inputContainerStyles: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: getBorderColor(),
    borderRadius: theme.borderRadius.md,
    backgroundColor: getBackgroundColor(),
    paddingHorizontal: theme.spacing.md,
    minHeight: 44,
  };

  // Input text style
  const inputTextStyles: TextStyle = {
    flex: 1,
    color: disabled ? theme.colors.text.disabled : theme.colors.text.primary,
    fontSize: 16,
    paddingVertical: theme.spacing.sm,
    ...inputStyle,
  };

  // Label style
  const labelStyles: TextStyle = {
    color: theme.colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
    ...labelStyle,
  };

  // Helper/Error text style
  const helperTextStyles: TextStyle = {
    fontSize: 12,
    marginTop: theme.spacing.xs,
    color: error
      ? theme.isDark
        ? '#EF5350'
        : '#D32F2F'
      : theme.colors.text.secondary,
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  // Handle blur
  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={containerStyles} testID={testID ? `${testID}-container` : undefined}>
      {/* Label */}
      {label && <Text style={labelStyles}>{label}</Text>}

      {/* Input Container */}
      <View style={inputContainerStyles}>
        <TextInput
          testID={testID}
          style={inputTextStyles}
          placeholderTextColor={theme.colors.text.hint}
          editable={!disabled}
          keyboardType={getKeyboardType()}
          secureTextEntry={isSecureTextEntry}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          accessibilityLabel={accessibilityLabel || label}
          accessibilityState={{ disabled }}
          {...props}
        />

        {/* Password Toggle Button */}
        {type === 'password' && (
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            testID="password-toggle"
            accessibilityLabel={
              isPasswordVisible ? 'Hide password' : 'Show password'
            }
            accessibilityRole="button"
            style={{ padding: theme.spacing.xs }}
          >
            <Text style={{ color: theme.colors.text.secondary, fontSize: 12 }}>
              {isPasswordVisible ? 'HIDE' : 'SHOW'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Helper Text or Error */}
      {(error || helperText) && (
        <Text style={helperTextStyles}>{error || helperText}</Text>
      )}
    </View>
  );
};

export default Input;
