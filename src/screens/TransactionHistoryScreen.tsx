/**
 * TransactionHistoryScreen
 * Displays list of past transactions with filters and infinite scroll
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { EmptyState } from '../components/atoms/EmptyState';
import { SkeletonTransactionItem } from '../components/atoms/Skeleton';
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
import TransactionService, { TransactionHistory } from '../services/blockchain/TransactionService';
import ExportService, { TransactionExportData } from '../services/export/ExportService';
import i18n from '../i18n';

// Export types for external use
export type { Transaction, TransactionType, TransactionStatus };

interface TransactionHistoryScreenProps {
  navigation: any;
  walletAddress?: string;
  initialLoading?: boolean;
}

// Convert TransactionHistory to Transaction format for UI
const convertToTransaction = (tx: TransactionHistory, currentAddress: string): Transaction => {
  const isSent = tx.from.toLowerCase() === currentAddress.toLowerCase();

  return {
    id: tx.hash,
    type: isSent ? 'sent' : 'received',
    amount: tx.value,
    token: 'ETH',
    address: isSent ? tx.to : tx.from,
    hash: tx.hash,
    status: tx.status,
    timestamp: tx.timestamp,
    fee: tx.gasUsed,
  };
};

export const TransactionHistoryScreen: React.FC<TransactionHistoryScreenProps> = ({
  navigation,
  walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', // Default demo address
  initialLoading = false,
}) => {
  const { theme } = useTheme();

  // Services
  const transactionService = useMemo(() => new TransactionService(), []);
  const exportService = useMemo(() => ExportService.getInstance(), []);

  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>('allTime');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('allStatus');
  const [tokenFilter, setTokenFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(initialLoading);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [exporting, setExporting] = useState(false);
  const PAGE_SIZE = 20;

  // Initial load
  useEffect(() => {
    loadTransactions(0, true);
  }, []);

  // Load transactions from service
  const loadTransactions = useCallback(
    async (page: number, isInitial: boolean = false) => {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const history = await transactionService.getTransactionHistory({
          address: walletAddress,
          page,
          pageSize: PAGE_SIZE,
        });

        const newTransactions = history.map(tx => convertToTransaction(tx, walletAddress));

        if (isInitial) {
          setTransactions(newTransactions);
        } else {
          setTransactions(prev => [...prev, ...newTransactions]);
        }

        setHasMore(newTransactions.length === PAGE_SIZE);
        setCurrentPage(page);
      } catch (error) {
        console.error('Failed to load transactions:', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [walletAddress, transactionService, PAGE_SIZE]
  );

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
    transactionService.clearTransactionCache();
    await loadTransactions(0, true);
    setRefreshing(false);
  }, [loadTransactions, transactionService]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      loadTransactions(currentPage + 1, false);
    }
  }, [loadingMore, hasMore, loading, currentPage, loadTransactions]);

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

  // Convert transactions to export format
  const convertToExportData = useCallback((txs: Transaction[]): TransactionExportData[] => {
    return txs.map(tx => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      token: tx.token,
      address: tx.address,
      hash: tx.hash,
      status: tx.status,
      timestamp: tx.timestamp,
      fee: tx.fee,
    }));
  }, []);

  // Handle export
  const handleExport = useCallback(() => {
    if (filteredTransactions.length === 0) {
      Alert.alert(
        i18n.t('transactionHistory.export.title'),
        i18n.t('transactionHistory.export.noData')
      );
      return;
    }

    Alert.alert(i18n.t('transactionHistory.export.title'), '', [
      {
        text: i18n.t('transactionHistory.export.csv'),
        onPress: () => handleExportCSV(),
      },
      {
        text: i18n.t('transactionHistory.export.json'),
        onPress: () => handleExportJSON(),
      },
      {
        text: i18n.t('common.cancel'),
        style: 'cancel',
      },
    ]);
  }, [filteredTransactions]);

  // Export as CSV
  const handleExportCSV = useCallback(async () => {
    setExporting(true);
    try {
      const exportData = convertToExportData(filteredTransactions);
      const result = await exportService.exportTransactionsToCSV(exportData);

      if (result.success) {
        Alert.alert(i18n.t('common.success'), i18n.t('transactionHistory.export.success'));
      } else {
        Alert.alert(i18n.t('common.error'), i18n.t('transactionHistory.export.error'));
      }
    } catch (error) {
      Alert.alert(i18n.t('common.error'), i18n.t('transactionHistory.export.error'));
    } finally {
      setExporting(false);
    }
  }, [filteredTransactions, convertToExportData, exportService]);

  // Export as JSON
  const handleExportJSON = useCallback(async () => {
    setExporting(true);
    try {
      const exportData = convertToExportData(filteredTransactions);
      const result = await exportService.exportTransactionsToJSON(exportData);

      if (result.success) {
        Alert.alert(i18n.t('common.success'), i18n.t('transactionHistory.export.success'));
      } else {
        Alert.alert(i18n.t('common.error'), i18n.t('transactionHistory.export.error'));
      }
    } catch (error) {
      Alert.alert(i18n.t('common.error'), i18n.t('transactionHistory.export.error'));
    } finally {
      setExporting(false);
    }
  }, [filteredTransactions, convertToExportData, exportService]);

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
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            {i18n.t('transactionHistory.title')}
          </Text>
        </View>

        {/* Skeleton Loading */}
        <View style={styles.skeletonContainer}>
          {[...Array(8)].map((_, index) => (
            <SkeletonTransactionItem key={index} index={index} />
          ))}
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
        <TouchableOpacity
          testID="export-button"
          style={[styles.exportButton, { backgroundColor: theme.colors.surface }]}
          onPress={handleExport}
          disabled={exporting}
          accessibilityRole="button"
          accessibilityLabel={i18n.t('transactionHistory.export.title')}
        >
          {exporting ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Text style={[styles.exportButtonText, { color: theme.colors.primary }]}>
              {i18n.t('transactionHistory.export.title')}
            </Text>
          )}
        </TouchableOpacity>
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
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : null
          }
        />
      ) : loading ? null : (
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
  exportButton: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  skeletonContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default TransactionHistoryScreen;
