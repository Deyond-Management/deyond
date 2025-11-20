/**
 * ErrorDisplay Component
 * Displays error messages with optional retry functionality
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from 'react-native';
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
        <Text style={[styles.title, { color: colors.error }]}>
          {title}
        </Text>
        <Text style={[styles.message, { color: colors.text.secondary }]}>
          {message}
        </Text>
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
              style={[
                styles.button,
                styles.dismissButton,
                { borderColor: colors.error },
              ]}
              onPress={onDismiss}
              accessibilityLabel="Dismiss"
              accessibilityRole="button"
            >
              <Text style={[styles.dismissText, { color: colors.error }]}>
                Dismiss
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  inline: {
    marginHorizontal: 16,
  },
  banner: {
    borderRadius: 0,
    marginHorizontal: 0,
  },
  fullscreen: {
    flex: 1,
    justifyContent: 'center',
    margin: 0,
    borderRadius: 0,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  dismissText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ErrorDisplay;
