/**
 * TransactionHistoryScreen
 * Displays list of past transactions with filters
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { EmptyState } from '../components/atoms/EmptyState';

type TransactionType = 'sent' | 'received';
type TransactionStatus = 'pending' | 'confirmed' | 'failed';
type FilterType = 'all' | 'sent' | 'received';

interface Transaction {
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

interface TransactionHistoryScreenProps {
  navigation: any;
  initialTransactions?: Transaction[];
  initialLoading?: boolean;
}

// Mock transactions
const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'sent',
    amount: '0.5',
    token: 'ETH',
    address: '0x1234567890123456789012345678901234567890',
    hash: '0xabcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234',
    status: 'confirmed',
    timestamp: Date.now() - 1000 * 60 * 30,
    fee: '0.0021',
  },
  {
    id: '2',
    type: 'received',
    amount: '1.0',
    token: 'ETH',
    address: '0x9876543210987654321098765432109876543210',
    hash: '0xefgh5678901234efgh5678901234efgh5678901234efgh5678901234efgh5678',
    status: 'confirmed',
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    id: '3',
    type: 'sent',
    amount: '100',
    token: 'USDT',
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    hash: '0xijkl9012345678ijkl9012345678ijkl9012345678ijkl9012345678ijkl9012',
    status: 'pending',
    timestamp: Date.now() - 1000 * 60 * 5,
    fee: '0.0015',
  },
  {
    id: '4',
    type: 'received',
    amount: '0.25',
    token: 'ETH',
    address: '0xfedcba0987654321fedcba0987654321fedcba09',
    hash: '0xmnop3456789012mnop3456789012mnop3456789012mnop3456789012mnop3456',
    status: 'confirmed',
    timestamp: Date.now() - 1000 * 60 * 60 * 24,
  },
];

export const TransactionHistoryScreen: React.FC<TransactionHistoryScreenProps> = ({
  navigation,
  initialTransactions,
  initialLoading = false,
}) => {
  const { theme } = useTheme();
  const [transactions] = useState<Transaction[]>(initialTransactions ?? mockTransactions);
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading] = useState(initialLoading);

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    return tx.type === filter;
  });

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

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
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

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // In real app, fetch new transactions
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    // In real app, load more transactions
  }, []);

  // Handle transaction press
  const handleTransactionPress = (tx: Transaction) => {
    navigation.navigate('TransactionDetail', { transaction: tx });
  };

  // Render transaction item
  const renderTransaction = ({ item, index }: { item: Transaction; index: number }) => (
    <TouchableOpacity
      testID={`tx-item-${index}`}
      style={[
        styles.txItem,
        { backgroundColor: theme.colors.card, borderColor: theme.colors.divider },
      ]}
      onPress={() => handleTransactionPress(item)}
      accessibilityLabel={`${item.type} transaction ${item.amount} ${item.token}`}
    >
      <View style={styles.txLeft}>
        <View
          style={[
            styles.txIcon,
            {
              backgroundColor:
                item.type === 'sent' ? theme.colors.error + '20' : theme.colors.success + '20',
            },
          ]}
        >
          <Text
            style={{
              color: item.type === 'sent' ? theme.colors.error : theme.colors.success,
              fontSize: 16,
            }}
          >
            {item.type === 'sent' ? '↑' : '↓'}
          </Text>
        </View>

        <View style={styles.txInfo}>
          <Text style={[styles.txType, { color: theme.colors.text.primary }]}>
            {item.type === 'sent' ? 'Sent' : 'Received'}
          </Text>
          <Text style={[styles.txAddress, { color: theme.colors.text.secondary }]}>
            {item.type === 'sent' ? 'To: ' : 'From: '}
            {formatAddress(item.address)}
          </Text>
        </View>
      </View>

      <View style={styles.txRight}>
        <Text
          testID={`tx-amount-${index}`}
          style={[
            styles.txAmount,
            {
              color: item.type === 'sent' ? theme.colors.error : theme.colors.success,
            },
          ]}
        >
          {item.type === 'sent' ? '-' : '+'}
          {item.amount} {item.token}
        </Text>
        <View style={styles.txMeta}>
          <Text
            testID={`tx-status-${index}`}
            style={[styles.txStatus, { color: getStatusColor(item.status) }]}
          >
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
          <Text
            testID={`tx-time-${index}`}
            style={[styles.txTime, { color: theme.colors.text.secondary }]}
          >
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render filter button
  const renderFilterButton = (filterType: FilterType, label: string) => (
    <TouchableOpacity
      testID={`filter-${filterType}`}
      style={[
        styles.filterButton,
        filter === filterType && {
          backgroundColor: theme.colors.primary,
        },
        filter !== filterType && {
          backgroundColor: theme.colors.surface,
        },
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text
        style={[
          styles.filterText,
          {
            color: filter === filterType ? '#FFFFFF' : theme.colors.text.primary,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator testID="loading-indicator" size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          Transaction History
        </Text>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {renderFilterButton('all', 'All')}
        {renderFilterButton('sent', 'Sent')}
        {renderFilterButton('received', 'Received')}
      </View>

      {/* Transaction List */}
      {filteredTransactions.length > 0 ? (
        <FlatList
          testID="transaction-list"
          data={filteredTransactions}
          renderItem={renderTransaction}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
        />
      ) : (
        <View testID="empty-state" style={styles.emptyContainer}>
          <EmptyState
            title="No transactions"
            message="Your transaction history will appear here"
            icon="transaction"
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  filterButton: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  header: {
    padding: 16,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
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

export default TransactionHistoryScreen;
