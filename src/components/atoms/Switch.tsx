/**
 * Switch Component
 * Toggle switch with label support
 * Follows design system and accessibility standards
 */

import React from 'react';
import { View, Text, Switch as RNSwitch, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export type LabelPosition = 'left' | 'right';

export interface SwitchProps {
  /** Switch state */
  value?: boolean;
  /** Label text */
  label?: string;
  /** Label position */
  labelPosition?: LabelPosition;
  /** Active color */
  activeColor?: string;
  /** Thumb color */
  thumbColor?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Custom container style */
  style?: ViewStyle;
  /** On value change handler */
  onValueChange?: (value: boolean) => void;
  /** Test ID */
  testID?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  value = false,
  label,
  labelPosition = 'left',
  activeColor,
  thumbColor,
  disabled = false,
  style,
  onValueChange,
  testID,
  accessibilityLabel,
}) => {
  const { theme } = useTheme();

  // Get track colors
  const getTrackColor = () => {
    return {
      false: theme.isDark ? '#616161' : '#BDBDBD',
      true: activeColor || (theme.isDark ? '#2196F3' : '#1976D2'),
    };
  };

  // Get thumb color
  const getThumbColor = (): string => {
    if (thumbColor) return thumbColor;
    return '#FFFFFF';
  };

  // Container style
  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    ...style,
  };

  // Label style
  const labelStyle: TextStyle = {
    color: disabled ? theme.colors.text.disabled : theme.colors.text.primary,
    fontSize: 16,
    ...(labelPosition === 'left'
      ? { marginRight: theme.spacing.sm }
      : { marginLeft: theme.spacing.sm }),
  };

  return (
    <View style={containerStyle} testID={testID ? `${testID}-container` : undefined}>
      {/* Label on left */}
      {label && labelPosition === 'left' && <Text style={labelStyle}>{label}</Text>}

      {/* Switch */}
      <RNSwitch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={getTrackColor()}
        thumbColor={getThumbColor()}
        testID={testID}
        accessibilityRole="switch"
        accessibilityLabel={accessibilityLabel || label}
      />

      {/* Label on right */}
      {label && labelPosition === 'right' && <Text style={labelStyle}>{label}</Text>}
    </View>
  );
};

export default Switch;
