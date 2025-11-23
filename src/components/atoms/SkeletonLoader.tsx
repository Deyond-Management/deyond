/**
 * SkeletonLoader Components
 * Loading state placeholders with shimmer animation
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  animated?: boolean;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  testID,
  animated = true,
}) => {
  const { theme } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animated, animatedValue]);

  const opacity = animated
    ? animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
      })
    : 0.5;

  const baseStyle: ViewStyle = {
    width: typeof width === 'number' ? width : undefined,
    height,
    borderRadius,
    backgroundColor: theme.colors.surface,
  };

  // Handle string width separately
  if (typeof width === 'string') {
    baseStyle.width = width as any;
  }

  return <Animated.View testID={testID} style={[styles.skeleton, baseStyle, { opacity }, style]} />;
};

interface SkeletonTextProps {
  width?: number | string;
  height?: number;
  lines?: number;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  width = '100%',
  height = 16,
  lines = 1,
  testID,
  style,
}) => {
  if (lines === 1) {
    return <SkeletonLoader width={width} height={height} testID={testID} style={style} />;
  }

  return (
    <View style={style}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonLoader
          key={index}
          width={index === lines - 1 ? '70%' : width}
          height={height}
          testID={`${testID}-${index}`}
          style={index > 0 ? { marginTop: 8 } : undefined}
        />
      ))}
    </View>
  );
};

interface SkeletonCardProps {
  height?: number;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ height = 80, testID, style }) => {
  const { theme } = useTheme();

  return (
    <View
      testID={testID}
      style={[
        styles.card,
        {
          height,
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.divider,
        },
        style,
      ]}
    >
      <SkeletonLoader width="100%" height={height - 32} borderRadius={8} />
    </View>
  );
};

interface TokenCardSkeletonProps {
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export const TokenCardSkeleton: React.FC<TokenCardSkeletonProps> = ({ testID, style }) => {
  const { theme } = useTheme();

  return (
    <View
      testID={testID}
      style={[
        styles.tokenCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.divider,
        },
        style,
      ]}
    >
      <View style={styles.tokenContent}>
        {/* Icon placeholder */}
        <SkeletonLoader width={40} height={40} borderRadius={20} testID={`${testID}-icon`} />

        {/* Text content */}
        <View style={styles.tokenTextContent}>
          <SkeletonLoader width={100} height={16} testID={`${testID}-name`} />
          <SkeletonLoader
            width={60}
            height={14}
            testID={`${testID}-balance`}
            style={{ marginTop: 4 }}
          />
        </View>

        {/* Value */}
        <View style={styles.tokenValue}>
          <SkeletonLoader width={80} height={16} />
          <SkeletonLoader width={50} height={12} style={{ marginTop: 4 }} />
        </View>
      </View>
    </View>
  );
};

interface TransactionCardSkeletonProps {
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export const TransactionCardSkeleton: React.FC<TransactionCardSkeletonProps> = ({
  testID,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <View
      testID={testID}
      style={[
        styles.txCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.divider,
        },
        style,
      ]}
    >
      <View style={styles.txContent}>
        {/* Icon placeholder */}
        <SkeletonLoader width={36} height={36} borderRadius={18} testID={`${testID}-icon`} />

        {/* Text content */}
        <View style={styles.txTextContent}>
          <SkeletonLoader width={80} height={14} testID={`${testID}-type`} />
          <SkeletonLoader
            width={120}
            height={12}
            testID={`${testID}-amount`}
            style={{ marginTop: 4 }}
          />
        </View>

        {/* Timestamp */}
        <SkeletonLoader width={60} height={12} />
      </View>
    </View>
  );
};

interface BalanceSkeletonProps {
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export const BalanceSkeleton: React.FC<BalanceSkeletonProps> = ({ testID, style }) => {
  return (
    <View testID={testID} style={[styles.balanceContainer, style]}>
      <SkeletonLoader
        width={100}
        height={14}
        testID={`${testID}-label`}
        style={{ marginBottom: 8 }}
      />
      <SkeletonLoader width={180} height={36} borderRadius={8} testID={`${testID}-amount`} />
    </View>
  );
};

const styles = StyleSheet.create({
  balanceContainer: {
    alignItems: 'center',
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  skeleton: {
    overflow: 'hidden',
  },
  tokenCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  tokenContent: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  tokenTextContent: {
    flex: 1,
    marginLeft: 12,
  },
  tokenValue: {
    alignItems: 'flex-end',
  },
  txCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  txContent: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  txTextContent: {
    flex: 1,
    marginLeft: 12,
  },
});

export default SkeletonLoader;
