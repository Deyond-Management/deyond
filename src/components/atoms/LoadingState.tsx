/**
 * LoadingState Component
 * Full-screen or inline loading state with animated Lottie spinner
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { AnimatedIcon } from './AnimatedIcon';

interface LoadingStateProps {
  /** Optional message to display below spinner */
  message?: string;
  /** Size of the spinner (default: 100) */
  size?: number;
  /** Whether to take full screen */
  fullScreen?: boolean;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
  /** Test ID for testing */
  testID?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  size = 100,
  fullScreen = false,
  style,
  testID = 'loading-state',
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        fullScreen && styles.fullScreen,
        fullScreen && { backgroundColor: colors.background },
        style,
      ]}
    >
      <AnimatedIcon
        type="loading"
        size={size}
        loop={true}
        autoPlay={true}
        testID={`${testID}-animation`}
      />
      {message && <Text style={[styles.message, { color: colors.text.secondary }]}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fullScreen: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  message: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default LoadingState;
