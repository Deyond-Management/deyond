/**
 * TransactionHistoryScreen
 * Displays list of past transactions with filters
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { EmptyState } from '../components/atoms/EmptyState';
import i18n from '../i18n';

type TransactionType = 'sent' | 'received';
type TransactionStatus = 'pending' | 'confirmed' | 'failed';
type FilterType = 'all' | 'sent' | 'received';
type DateRangeFilter = 'today' | 'thisWeek' | 'thisMonth' | 'allTime';
type StatusFilter = 'allStatus' | 'pending' | 'confirmed' | 'failed';

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

  // Format address
  const formatAddress = useCallback((address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  // Format timestamp
  const formatTime = useCallback((timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return i18n.t('transactionHistory.time.minutesAgo', { minutes });
    if (hours < 24) return i18n.t('transactionHistory.time.hoursAgo', { hours });
    return i18n.t('transactionHistory.time.daysAgo', { days });
  }, []);

  // Get status color
  const getStatusColor = useCallback(
    (status: TransactionStatus) => {
      switch (status) {
        case 'confirmed':
          return theme.colors.success;
        case 'failed':
          return theme.colors.error;
        default:
          return theme.colors.warning;
      }
    },
    [theme.colors.success, theme.colors.error, theme.colors.warning]
  );

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
    setFilter('all');
    setDateRangeFilter('allTime');
    setStatusFilter('allStatus');
    setTokenFilter('all');
    setSearchQuery('');
  }, []);

  // Check if any advanced filter is active
  const hasActiveAdvancedFilters = useMemo(() => {
    return (
      dateRangeFilter !== 'allTime' ||
      statusFilter !== 'allStatus' ||
      tokenFilter !== 'all' ||
      searchQuery.length > 0
    );
  }, [dateRangeFilter, statusFilter, tokenFilter, searchQuery]);

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
      <TouchableOpacity
        testID={`transaction-item-${index}`}
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
            <Text
              testID={item.type === 'sent' ? 'sent-indicator' : 'received-indicator'}
              style={[styles.txType, { color: theme.colors.text.primary }]}
            >
              {item.type === 'sent'
                ? i18n.t('transactionHistory.sent')
                : i18n.t('transactionHistory.received')}
            </Text>
            <Text style={[styles.txAddress, { color: theme.colors.text.secondary }]}>
              {item.type === 'sent'
                ? i18n.t('transactionHistory.to')
                : i18n.t('transactionHistory.from')}
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
              {i18n.t(`transactionHistory.status.${item.status}`)}
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
    ),
    [theme, handleTransactionPress, formatAddress, formatTime, getStatusColor]
  );

  // Render filter button
  const renderFilterButton = useCallback(
    (filterType: FilterType, label: string) => (
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
    ),
    [theme, filter]
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
      <View style={styles.searchContainer}>
        <TextInput
          testID="search-input"
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.isDark ? '#424242' : '#F5F5F5',
              color: theme.colors.text.primary,
            },
          ]}
          placeholder={i18n.t('transactionHistory.searchPlaceholder')}
          placeholderTextColor={theme.colors.text.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Basic Filters */}
      <View style={styles.filters}>
        {renderFilterButton('all', i18n.t('transactionHistory.filters.all'))}
        {renderFilterButton('sent', i18n.t('transactionHistory.filters.sent'))}
        {renderFilterButton('received', i18n.t('transactionHistory.filters.received'))}
      </View>

      {/* Advanced Filters Toggle */}
      <TouchableOpacity
        testID="advanced-filters-toggle"
        style={styles.advancedToggle}
        onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
      >
        <Text style={[styles.advancedToggleText, { color: theme.colors.primary }]}>
          {showAdvancedFilters ? '▼' : '▶'} {i18n.t('transactionHistory.filterBy')}
          {hasActiveAdvancedFilters && ' (Active)'}
        </Text>
      </TouchableOpacity>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <View style={[styles.advancedFilters, { backgroundColor: theme.colors.surface }]}>
          {/* Date Range */}
          <Text style={[styles.filterLabel, { color: theme.colors.text.secondary }]}>
            {i18n.t('transactionHistory.dateRange')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {(['allTime', 'today', 'thisWeek', 'thisMonth'] as DateRangeFilter[]).map(range => (
              <TouchableOpacity
                key={range}
                testID={`date-filter-${range}`}
                style={[
                  styles.smallFilterButton,
                  dateRangeFilter === range && {
                    backgroundColor: theme.colors.primary,
                  },
                  dateRangeFilter !== range && {
                    backgroundColor: theme.isDark ? '#424242' : '#E0E0E0',
                  },
                ]}
                onPress={() => setDateRangeFilter(range)}
              >
                <Text
                  style={[
                    styles.smallFilterText,
                    {
                      color: dateRangeFilter === range ? '#FFFFFF' : theme.colors.text.primary,
                    },
                  ]}
                >
                  {i18n.t(`transactionHistory.filters.${range}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Status Filter */}
          <Text style={[styles.filterLabel, { color: theme.colors.text.secondary }]}>
            {i18n.t('transactionHistory.status')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {(['allStatus', 'pending', 'confirmed', 'failed'] as StatusFilter[]).map(status => (
              <TouchableOpacity
                key={status}
                testID={`status-filter-${status}`}
                style={[
                  styles.smallFilterButton,
                  statusFilter === status && {
                    backgroundColor: theme.colors.primary,
                  },
                  statusFilter !== status && {
                    backgroundColor: theme.isDark ? '#424242' : '#E0E0E0',
                  },
                ]}
                onPress={() => setStatusFilter(status)}
              >
                <Text
                  style={[
                    styles.smallFilterText,
                    {
                      color: statusFilter === status ? '#FFFFFF' : theme.colors.text.primary,
                    },
                  ]}
                >
                  {i18n.t(`transactionHistory.filters.${status}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Token Filter */}
          <Text style={[styles.filterLabel, { color: theme.colors.text.secondary }]}>
            {i18n.t('transactionHistory.token')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {availableTokens.map(token => (
              <TouchableOpacity
                key={token}
                testID={`token-filter-${token}`}
                style={[
                  styles.smallFilterButton,
                  tokenFilter === token && {
                    backgroundColor: theme.colors.primary,
                  },
                  tokenFilter !== token && {
                    backgroundColor: theme.isDark ? '#424242' : '#E0E0E0',
                  },
                ]}
                onPress={() => setTokenFilter(token)}
              >
                <Text
                  style={[
                    styles.smallFilterText,
                    {
                      color: tokenFilter === token ? '#FFFFFF' : theme.colors.text.primary,
                    },
                  ]}
                >
                  {token === 'all' ? i18n.t('transactionHistory.filters.allTokens') : token}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Clear Filters Button */}
          {hasActiveAdvancedFilters && (
            <TouchableOpacity
              testID="clear-filters-button"
              style={[styles.clearButton, { borderColor: theme.colors.primary }]}
              onPress={handleClearFilters}
            >
              <Text style={[styles.clearButtonText, { color: theme.colors.primary }]}>
                {i18n.t('transactionHistory.clearFilters')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

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
  advancedFilters: {
    borderRadius: 8,
    marginBottom: 16,
    marginHorizontal: 16,
    padding: 12,
  },
  advancedToggle: {
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  advancedToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    paddingVertical: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  filterButton: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  filterRow: {
    flexGrow: 0,
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
  searchContainer: {
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  searchInput: {
    borderRadius: 8,
    fontSize: 14,
    height: 44,
    paddingHorizontal: 16,
  },
  smallFilterButton: {
    borderRadius: 16,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  smallFilterText: {
    fontSize: 12,
    fontWeight: '600',
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
