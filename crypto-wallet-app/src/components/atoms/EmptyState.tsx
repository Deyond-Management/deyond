/**
 * EmptyState Component
 * Displays a friendly empty state with optional action
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

type IconType = 'wallet' | 'transaction' | 'search' | 'generic';

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: IconType;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

const IconSymbol: Record<IconType, string> = {
  wallet: '👛',
  transaction: '📋',
  search: '🔍',
  generic: '📭',
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon = 'generic',
  actionLabel,
  onAction,
  compact = false,
  testID,
  style,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        compact && styles.compact,
        style,
      ]}
    >
      {/* Icon */}
      <View
        testID={testID ? `${testID}-icon` : 'empty-icon'}
        style={[
          styles.iconContainer,
          { backgroundColor: colors.surface },
          compact && styles.iconCompact,
        ]}
      >
        <Text style={[styles.icon, compact && styles.iconTextCompact]}>
          {IconSymbol[icon]}
        </Text>
      </View>

      {/* Content */}
      <Text
        style={[
          styles.title,
          { color: colors.text.primary },
          compact && styles.titleCompact,
        ]}
      >
        {title}
      </Text>

      {message && (
        <Text
          style={[
            styles.message,
            { color: colors.text.secondary },
            compact && styles.messageCompact,
          ]}
        >
          {message}
        </Text>
      )}

      {/* Action Button */}
      {actionLabel && onAction && (
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            compact && styles.buttonCompact,
          ]}
          onPress={onAction}
          accessibilityLabel={actionLabel}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  compact: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCompact: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 12,
  },
  icon: {
    fontSize: 36,
  },
  iconTextCompact: {
    fontSize: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  titleCompact: {
    fontSize: 16,
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  messageCompact: {
    fontSize: 12,
    marginBottom: 12,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonCompact: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default EmptyState;
