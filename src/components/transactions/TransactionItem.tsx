/**
 * TransactionItem Component
 * Displays a single transaction in the list
 * Optimized with React.memo for better performance in long lists
 * Features: FadeIn animation, swipe gestures (future)
 */

import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import i18n from '../../i18n';

export type TransactionType = 'sent' | 'received';
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: string;
  token: string;
  address: string;
  hash: string;
  status: TransactionStatus;
  timestamp: number;
  fee?: string;
}

interface TransactionItemProps {
  transaction: Transaction;
  index: number;
  onPress: (transaction: Transaction) => void;
}

// Helper functions outside component to avoid recreation
const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatTime = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) return i18n.t('transactionHistory.time.minutesAgo', { minutes });
  if (hours < 24) return i18n.t('transactionHistory.time.hoursAgo', { hours });
  return i18n.t('transactionHistory.time.daysAgo', { days });
};

const TransactionItemComponent: React.FC<TransactionItemProps> = ({
  transaction,
  index,
  onPress,
}) => {
  const { theme } = useTheme();

  // Animation values
  const scale = useSharedValue(1);

  // Memoize status color calculation
  const statusColor = useMemo(() => {
    switch (transaction.status) {
      case 'confirmed':
        return theme.colors.success;
      case 'failed':
        return theme.colors.error;
      default:
        return theme.colors.warning;
    }
  }, [transaction.status, theme.colors]);

  // Memoize formatted values
  const formattedAddress = useMemo(() => formatAddress(transaction.address), [transaction.address]);
  const formattedTime = useMemo(() => formatTime(transaction.timestamp), [transaction.timestamp]);

  // Memoize icon background color
  const iconBackgroundColor = useMemo(
    () => (transaction.type === 'sent' ? theme.colors.error + '20' : theme.colors.success + '20'),
    [transaction.type, theme.colors]
  );

  // Memoize amount color
  const amountColor = useMemo(
    () => (transaction.type === 'sent' ? theme.colors.error : theme.colors.success),
    [transaction.type, theme.colors]
  );

  // Animated style for press feedback
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  // Handle press with animation
  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50)
        .duration(400)
        .springify()}
      style={animatedStyle}
    >
      <TouchableOpacity
        testID={`transaction-item-${index}`}
        style={[
          styles.txItem,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.divider },
        ]}
        onPress={() => onPress(transaction)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        accessibilityLabel={`${transaction.type} transaction ${transaction.amount} ${transaction.token}`}
      >
        <View style={styles.txLeft}>
          <View style={[styles.txIcon, { backgroundColor: iconBackgroundColor }]}>
            <Text style={[styles.txIconText, { color: amountColor }]}>
              {transaction.type === 'sent' ? '↑' : '↓'}
            </Text>
          </View>

          <View style={styles.txInfo}>
            <Text
              testID={transaction.type === 'sent' ? 'sent-indicator' : 'received-indicator'}
              style={[styles.txType, { color: theme.colors.text.primary }]}
            >
              {transaction.type === 'sent'
                ? i18n.t('transactionHistory.sent')
                : i18n.t('transactionHistory.received')}
            </Text>
            <Text style={[styles.txAddress, { color: theme.colors.text.secondary }]}>
              {transaction.type === 'sent'
                ? i18n.t('transactionHistory.to')
                : i18n.t('transactionHistory.from')}
              {formattedAddress}
            </Text>
          </View>
        </View>

        <View style={styles.txRight}>
          <Text testID={`tx-amount-${index}`} style={[styles.txAmount, { color: amountColor }]}>
            {transaction.type === 'sent' ? '-' : '+'}
            {transaction.amount} {transaction.token}
          </Text>
          <View style={styles.txMeta}>
            <Text testID={`tx-status-${index}`} style={[styles.txStatus, { color: statusColor }]}>
              {i18n.t(`transactionHistory.status.${transaction.status}`)}
            </Text>
            <Text
              testID={`tx-time-${index}`}
              style={[styles.txTime, { color: theme.colors.text.secondary }]}
            >
              {formattedTime}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Memoize component with custom comparison
export const TransactionItem = React.memo(TransactionItemComponent, (prevProps, nextProps) => {
  // Only re-render if transaction data or index changed
  return (
    prevProps.transaction.id === nextProps.transaction.id &&
    prevProps.transaction.status === nextProps.transaction.status &&
    prevProps.transaction.timestamp === nextProps.transaction.timestamp &&
    prevProps.index === nextProps.index
  );
});

const styles = StyleSheet.create({
  txAddress: {
    fontSize: 12,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  txIcon: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  txIconText: {
    fontSize: 16,
  },
  txInfo: {
    flex: 1,
  },
  txItem: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    padding: 16,
  },
  txLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  txMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  txTime: {
    fontSize: 12,
  },
  txType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
});
