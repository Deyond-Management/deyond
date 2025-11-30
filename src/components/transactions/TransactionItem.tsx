/**
 * TransactionItem Component
 * Displays a single transaction in the list
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  index,
  onPress,
}) => {
  const { theme } = useTheme();

  // Format address
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return i18n.t('transactionHistory.time.minutesAgo', { minutes });
    if (hours < 24) return i18n.t('transactionHistory.time.hoursAgo', { hours });
    return i18n.t('transactionHistory.time.daysAgo', { days });
  };

  // Get status color
  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case 'confirmed':
        return theme.colors.success;
      case 'failed':
        return theme.colors.error;
      default:
        return theme.colors.warning;
    }
  };

  return (
    <TouchableOpacity
      testID={`transaction-item-${index}`}
      style={[
        styles.txItem,
        { backgroundColor: theme.colors.card, borderColor: theme.colors.divider },
      ]}
      onPress={() => onPress(transaction)}
      accessibilityLabel={`${transaction.type} transaction ${transaction.amount} ${transaction.token}`}
    >
      <View style={styles.txLeft}>
        <View
          style={[
            styles.txIcon,
            {
              backgroundColor:
                transaction.type === 'sent'
                  ? theme.colors.error + '20'
                  : theme.colors.success + '20',
            },
          ]}
        >
          <Text
            style={{
              color: transaction.type === 'sent' ? theme.colors.error : theme.colors.success,
              fontSize: 16,
            }}
          >
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
            {formatAddress(transaction.address)}
          </Text>
        </View>
      </View>

      <View style={styles.txRight}>
        <Text
          testID={`tx-amount-${index}`}
          style={[
            styles.txAmount,
            {
              color: transaction.type === 'sent' ? theme.colors.error : theme.colors.success,
            },
          ]}
        >
          {transaction.type === 'sent' ? '-' : '+'}
          {transaction.amount} {transaction.token}
        </Text>
        <View style={styles.txMeta}>
          <Text
            testID={`tx-status-${index}`}
            style={[styles.txStatus, { color: getStatusColor(transaction.status) }]}
          >
            {i18n.t(`transactionHistory.status.${transaction.status}`)}
          </Text>
          <Text
            testID={`tx-time-${index}`}
            style={[styles.txTime, { color: theme.colors.text.secondary }]}
          >
            {formatTime(transaction.timestamp)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

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
