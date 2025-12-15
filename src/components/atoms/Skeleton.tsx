/**
 * Skeleton Component
 * Animated loading placeholder using Reanimated
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const { theme } = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 1000 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.isDark ? '#333' : '#E0E0E0',
        } as ViewStyle,
        animatedStyle,
        style,
      ]}
    />
  );
};

interface SkeletonTransactionItemProps {
  index?: number;
}

export const SkeletonTransactionItem: React.FC<SkeletonTransactionItemProps> = ({ index = 0 }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.txItem,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.divider,
        },
      ]}
    >
      <View style={styles.txLeft}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={styles.txInfo}>
          <Skeleton width={100} height={16} style={{ marginBottom: 8 }} />
          <Skeleton width={150} height={12} />
        </View>
      </View>

      <View style={styles.txRight}>
        <Skeleton width={80} height={16} style={{ marginBottom: 8 }} />
        <Skeleton width={60} height={12} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  txItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  txInfo: {
    flex: 1,
    marginLeft: 12,
  },
  txRight: {
    alignItems: 'flex-end',
  },
});
