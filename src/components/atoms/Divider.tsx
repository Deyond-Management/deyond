/**
 * Divider Component
 * Horizontal or vertical line separator
 * Follows design system and accessibility standards
 */

import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export type DividerOrientation = 'horizontal' | 'vertical';

export interface DividerProps {
  /** Orientation */
  orientation?: DividerOrientation;
  /** Divider thickness */
  thickness?: number;
  /** Divider color */
  color?: string;
  /** Spacing around divider */
  spacing?: number;
  /** Custom style */
  style?: ViewStyle;
  /** Test ID */
  testID?: string;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  thickness = 1,
  color,
  spacing,
  style,
  testID,
}) => {
  const { theme } = useTheme();

  // Get divider color
  const getDividerColor = (): string => {
    if (color) return color;
    return theme.colors.divider;
  };

  // Divider style
  const dividerStyle: ViewStyle = {
    backgroundColor: getDividerColor(),
    alignSelf: 'stretch',
    ...(orientation === 'horizontal'
      ? {
          height: thickness,
          ...(spacing && { marginVertical: spacing }),
        }
      : {
          width: thickness,
          ...(spacing && { marginHorizontal: spacing }),
        }),
    ...style,
  };

  return <View style={dividerStyle} testID={testID} accessibilityRole="none" />;
};

export default Divider;
