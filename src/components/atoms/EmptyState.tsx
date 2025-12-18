/**
 * EmptyState Component
 * Displays a friendly empty state with optional action
 * Supports both static emoji icons and animated Lottie icons
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { AnimatedIcon, AnimationType } from './AnimatedIcon';

type IconType =
  | 'wallet'
  | 'transaction'
  | 'search'
  | 'generic'
  | 'nft'
  | 'loading'
  | 'error'
  | 'success';

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: IconType;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  /** Use animated Lottie icon instead of emoji */
  animated?: boolean;
}

const IconSymbol: Record<IconType, string> = {
  wallet: '👛',
  transaction: '📋',
  search: '🔍',
  generic: '📭',
  nft: '🖼️',
  loading: '⏳',
  error: '❌',
  success: '✅',
};

// Map icon types to animation types
const AnimatedIconMap: Partial<Record<IconType, AnimationType>> = {
  loading: 'loading',
  error: 'error',
  success: 'success',
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
  animated = false,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  // Check if icon can be animated
  const animationType = AnimatedIconMap[icon];
  const shouldAnimate = animated && animationType;

  return (
    <View testID={testID} style={[styles.container, compact && styles.compact, style]}>
      {/* Icon - Static or Animated */}
      {shouldAnimate ? (
        <View
          testID={testID ? `${testID}-icon` : 'empty-icon'}
          style={[styles.animatedIconContainer, compact && styles.iconCompact]}
        >
          <AnimatedIcon
            type={animationType}
            size={compact ? 56 : 80}
            loop={icon === 'loading'}
            autoPlay={true}
          />
        </View>
      ) : (
        <View
          testID={testID ? `${testID}-icon` : 'empty-icon'}
          style={[
            styles.iconContainer,
            { backgroundColor: colors.surface },
            compact && styles.iconCompact,
          ]}
        >
          <Text style={[styles.icon, compact && styles.iconTextCompact]}>{IconSymbol[icon]}</Text>
        </View>
      )}

      {/* Content */}
      <Text style={[styles.title, { color: colors.text.primary }, compact && styles.titleCompact]}>
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
  animatedIconContainer: {
    alignItems: 'center',
    height: 80,
    justifyContent: 'center',
    marginBottom: 16,
    width: 80,
  },
  button: {
    alignItems: 'center',
    borderRadius: 8,
    minWidth: 120,
    paddingHorizontal: 24,
    paddingVertical: 12,
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
  compact: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  container: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  icon: {
    fontSize: 36,
  },
  iconCompact: {
    borderRadius: 28,
    height: 56,
    marginBottom: 12,
    width: 56,
  },
  iconContainer: {
    alignItems: 'center',
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    marginBottom: 16,
    width: 80,
  },
  iconTextCompact: {
    fontSize: 24,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  messageCompact: {
    fontSize: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 16,
    marginBottom: 4,
  },
});

export default EmptyState;
