/**
 * ErrorDisplay Component
 * Displays error messages with optional retry functionality
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface ErrorDisplayProps {
  message: string;
  title?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryText?: string;
  variant?: 'inline' | 'banner' | 'fullscreen';
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  message,
  title = 'Error',
  onRetry,
  onDismiss,
  retryText = 'Retry',
  variant = 'inline',
  testID,
  style,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  const containerStyle = [
    styles.container,
    variant === 'inline' && styles.inline,
    variant === 'banner' && styles.banner,
    variant === 'fullscreen' && styles.fullscreen,
    { backgroundColor: colors.error + '15' },
    style,
  ];

  return (
    <View
      testID={testID}
      style={containerStyle}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      {/* Error Icon */}
      <View
        testID={testID ? `${testID}-icon` : 'error-display-icon'}
        style={[styles.iconContainer, { backgroundColor: colors.error + '20' }]}
      >
        <Text style={[styles.icon, { color: colors.error }]}>!</Text>
      </View>

      {/* Error Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.error }]}>{title}</Text>
        <Text style={[styles.message, { color: colors.text.secondary }]}>{message}</Text>
      </View>

      {/* Action Buttons */}
      {(onRetry || onDismiss) && (
        <View style={styles.actions}>
          {onRetry && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.error }]}
              onPress={onRetry}
              accessibilityLabel={retryText}
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>{retryText}</Text>
            </TouchableOpacity>
          )}
          {onDismiss && (
            <TouchableOpacity
              style={[styles.button, styles.dismissButton, { borderColor: colors.error }]}
              onPress={onDismiss}
              accessibilityLabel="Dismiss"
              accessibilityRole="button"
            >
              <Text style={[styles.dismissText, { color: colors.error }]}>Dismiss</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  banner: {
    borderRadius: 0,
    marginHorizontal: 0,
  },
  button: {
    alignItems: 'center',
    borderRadius: 8,
    minWidth: 80,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  container: {
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
  },
  content: {
    alignItems: 'center',
    marginBottom: 16,
  },
  dismissButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  dismissText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fullscreen: {
    borderRadius: 0,
    flex: 1,
    justifyContent: 'center',
    margin: 0,
  },
  icon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  iconContainer: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    marginBottom: 12,
    width: 48,
  },
  inline: {
    marginHorizontal: 16,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
});

export default ErrorDisplay;
