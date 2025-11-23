/**
 * Toast Component
 * Displays temporary notification messages
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastAction {
  label: string;
  onPress: () => void;
}

interface ToastProps {
  message: string;
  visible: boolean;
  type?: ToastType;
  duration?: number;
  onDismiss?: () => void;
  action?: ToastAction;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  visible,
  type = 'info',
  duration = 3000,
  onDismiss,
  action,
}) => {
  const { theme } = useTheme();

  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        onDismiss?.();
      }, duration);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [visible, duration, onDismiss]);

  if (!visible) {
    return null;
  }

  // Get colors based on type
  const getTypeColors = () => {
    switch (type) {
      case 'success':
        return {
          background: theme.colors.success,
          icon: '✓',
        };
      case 'error':
        return {
          background: theme.colors.error,
          icon: '✕',
        };
      case 'warning':
        return {
          background: '#F59E0B',
          icon: '⚠',
        };
      case 'info':
      default:
        return {
          background: theme.colors.primary,
          icon: 'ℹ',
        };
    }
  };

  const colors = getTypeColors();

  return (
    <View
      testID={`toast-container`}
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLabel={message}
    >
      <View testID={`toast-${type}`} style={[styles.toast, { backgroundColor: colors.background }]}>
        <Text style={styles.icon}>{colors.icon}</Text>
        <Text style={styles.message}>{message}</Text>
        {action && (
          <TouchableOpacity
            testID="toast-action"
            style={styles.actionButton}
            onPress={action.onPress}
          >
            <Text style={styles.actionText}>{action.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  container: {
    bottom: 100,
    left: 16,
    position: 'absolute',
    right: 16,
    zIndex: 1000,
  },
  icon: {
    color: '#FFFFFF',
    fontSize: 16,
    marginRight: 12,
  },
  message: {
    color: '#FFFFFF',
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  toast: {
    alignItems: 'center',
    borderRadius: 12,
    elevation: 5,
    flexDirection: 'row',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default Toast;
