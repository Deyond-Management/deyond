/**
 * TransactionHistoryScreen
 * Displays list of past transactions with filters
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { EmptyState } from '../components/atoms/EmptyState';
import {
  TransactionItem,
  Transaction,
  TransactionType,
  TransactionStatus,
} from '../components/transactions/TransactionItem';
import {
  TransactionFilters,
  FilterType,
  DateRangeFilter,
  StatusFilter,
} from '../components/transactions/TransactionFilters';
import { TransactionSearchBar } from '../components/transactions/TransactionSearchBar';
import i18n from '../i18n';

// Export types for external use
export type { Transaction, TransactionType, TransactionStatus };

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

  // State
  const [transactions] = useState<Transaction[]>(initialTransactions ?? mockTransactions);
  const [filter, setFilter] = useState<FilterType>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>('allTime');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('allStatus');
  const [tokenFilter, setTokenFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading] = useState(initialLoading);

  // Get unique tokens from transactions
  const availableTokens = useMemo(() => {
    const tokens = new Set(transactions.map(tx => tx.token));
    return ['all', ...Array.from(tokens)];
  }, [transactions]);

  // Helper: Check if transaction is within date range
  const isInDateRange = useCallback((timestamp: number, range: DateRangeFilter): boolean => {
    if (range === 'allTime') return true;

    const now = Date.now();
    const diff = now - timestamp;
    const oneDay = 1000 * 60 * 60 * 24;

    switch (range) {
      case 'today':
        return diff < oneDay;
      case 'thisWeek':
        return diff < oneDay * 7;
      case 'thisMonth':
        return diff < oneDay * 30;
      default:
        return true;
    }
  }, []);

  // Filter transactions - memoized to prevent recalculation
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Type filter
      if (filter !== 'all' && tx.type !== filter) return false;

      // Date range filter
      if (!isInDateRange(tx.timestamp, dateRangeFilter)) return false;

      // Status filter
      if (statusFilter !== 'allStatus' && tx.status !== statusFilter) return false;

      // Token filter
      if (tokenFilter !== 'all' && tx.token !== tokenFilter) return false;

      // Search filter
      if (searchQuery.length > 0) {
        const query = searchQuery.toLowerCase();
        const matchesAddress = tx.address.toLowerCase().includes(query);
        const matchesHash = tx.hash.toLowerCase().includes(query);
        if (!matchesAddress && !matchesHash) return false;
      }

      return true;
    });
  }, [
    transactions,
    filter,
    dateRangeFilter,
    statusFilter,
    tokenFilter,
    searchQuery,
    isInDateRange,
  ]);

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

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setDateRangeFilter('allTime');
    setStatusFilter('allStatus');
    setTokenFilter('all');
  }, []);

  // Handle transaction press
  const handleTransactionPress = useCallback(
    (tx: Transaction) => {
      navigation.navigate('TransactionDetail', { transaction: tx });
    },
    [navigation]
  );

  // Render transaction item
  const renderTransaction = useCallback(
    ({ item, index }: { item: Transaction; index: number }) => (
      <TransactionItem transaction={item} index={index} onPress={handleTransactionPress} />
    ),
    [handleTransactionPress]
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
          {i18n.t('transactionHistory.title')}
        </Text>
      </View>

      {/* Search Bar */}
      <TransactionSearchBar value={searchQuery} onChangeText={setSearchQuery} />

      {/* Filters */}
      <TransactionFilters
        filter={filter}
        dateRangeFilter={dateRangeFilter}
        statusFilter={statusFilter}
        tokenFilter={tokenFilter}
        availableTokens={availableTokens}
        showAdvancedFilters={showAdvancedFilters}
        onFilterChange={setFilter}
        onDateRangeChange={setDateRangeFilter}
        onStatusFilterChange={setStatusFilter}
        onTokenFilterChange={setTokenFilter}
        onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
        onClearFilters={handleClearFilters}
      />

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
            title={i18n.t('transactionHistory.empty.title')}
            message={i18n.t('transactionHistory.empty.message')}
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
});

export default TransactionHistoryScreen;
