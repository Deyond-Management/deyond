/**
 * Swap History Screen
 * Display list of completed and pending token swaps
 */

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { Theme } from '../constants/theme';
import { useAppSelector } from '../store/hooks';
import { SwapHistory } from '../types/swap';

interface SwapHistoryScreenProps {
  navigation: any;
}

type FilterType = 'all' | 'pending' | 'confirmed' | 'failed';

export const SwapHistoryScreen: React.FC<SwapHistoryScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  // Get swap history from Redux
  const swapHistory = useAppSelector(state => state.swap?.history ?? []);

  // Filter history based on selected filter
  const filteredHistory = useMemo(() => {
    if (filter === 'all') {
      return swapHistory;
    }
    return swapHistory.filter(swap => swap.status === filter);
  }, [swapHistory, filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    // In production, refetch swap history from blockchain
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleSwapPress = (swap: SwapHistory) => {
    navigation.navigate('TransactionDetails', { hash: swap.txHash });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 1) {
      return 'Just now';
    } else if (diffInMins < 60) {
      return `${diffInMins}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatAmount = (amount: string, decimals: number) => {
    return (parseFloat(amount) / 10 ** decimals).toFixed(6);
  };

  const getStatusColor = (status: SwapHistory['status']) => {
    switch (status) {
      case 'confirmed':
        return theme.colors.success;
      case 'pending':
        return theme.colors.warning;
      case 'failed':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusText = (status: SwapHistory['status']) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Swap History</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
            All ({swapHistory.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'confirmed' && styles.filterTabActive]}
          onPress={() => setFilter('confirmed')}
        >
          <Text
            style={[styles.filterTabText, filter === 'confirmed' && styles.filterTabTextActive]}
          >
            Confirmed ({swapHistory.filter(s => s.status === 'confirmed').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'pending' && styles.filterTabActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterTabText, filter === 'pending' && styles.filterTabTextActive]}>
            Pending ({swapHistory.filter(s => s.status === 'pending').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* History List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {filteredHistory.length > 0 ? (
          filteredHistory.map(swap => (
            <TouchableOpacity
              key={swap.id}
              style={styles.swapCard}
              onPress={() => handleSwapPress(swap)}
              activeOpacity={0.7}
            >
              <View style={styles.swapCardHeader}>
                <View style={styles.swapTokens}>
                  <Text style={styles.swapTokenSymbol}>{swap.fromToken.symbol}</Text>
                  <Text style={styles.swapArrow}>→</Text>
                  <Text style={styles.swapTokenSymbol}>{swap.toToken.symbol}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(swap.status) + '20' },
                  ]}
                >
                  <Text style={[styles.statusText, { color: getStatusColor(swap.status) }]}>
                    {getStatusText(swap.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.swapCardBody}>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>From:</Text>
                  <Text style={styles.amountValue}>
                    {formatAmount(swap.fromAmount, swap.fromToken.decimals)} {swap.fromToken.symbol}
                  </Text>
                </View>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>To:</Text>
                  <Text style={styles.amountValue}>
                    {formatAmount(swap.toAmount, swap.toToken.decimals)} {swap.toToken.symbol}
                  </Text>
                </View>
              </View>

              <View style={styles.swapCardFooter}>
                <Text style={styles.timestamp}>{formatDate(swap.timestamp)}</Text>
                <Text style={styles.txHash} numberOfLines={1} ellipsizeMode="middle">
                  {swap.txHash.substring(0, 10)}...{swap.txHash.substring(swap.txHash.length - 8)}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {filter === 'all' ? 'No swap history yet' : `No ${filter} swaps`}
            </Text>
            <Text style={styles.emptySubtext}>Your token swaps will appear here</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backText: {
      fontSize: 24,
      color: theme.colors.text.primary,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    placeholder: {
      width: 40,
    },
    filterContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    filterTab: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
    },
    filterTabActive: {
      backgroundColor: theme.colors.primary,
    },
    filterTabText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
    filterTabTextActive: {
      color: '#FFFFFF',
    },
    swapCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.divider,
    },
    swapCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    swapTokens: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    swapTokenSymbol: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    swapArrow: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
    },
    swapCardBody: {
      marginBottom: 12,
    },
    amountRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    amountLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    amountValue: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text.primary,
    },
    swapCardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.divider,
    },
    timestamp: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    txHash: {
      fontSize: 12,
      fontFamily: 'monospace',
      color: theme.colors.primary,
      flex: 1,
      textAlign: 'right',
      marginLeft: 16,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 64,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
  });

export default SwapHistoryScreen;
