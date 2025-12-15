/**
 * Token Details Screen
 * Detailed view of a specific token with price chart, transactions, and actions
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { Theme } from '../constants/theme';
import { useAppSelector } from '../store/hooks';
import { selectTokens } from '../store/slices/tokenSlice';

interface TokenDetailsScreenProps {
  navigation: any;
  route: {
    params: {
      symbol: string;
    };
  };
}

const { width } = Dimensions.get('window');

export const TokenDetailsScreen: React.FC<TokenDetailsScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { symbol } = route.params;
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'1D' | '1W' | '1M' | '1Y'>('1W');

  // Get token from Redux
  const tokens = useAppSelector(selectTokens);
  const token = tokens.find(t => t.symbol === symbol);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // In production, refetch token data and price history
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const handleSend = useCallback(() => {
    navigation.navigate('Send');
  }, [navigation]);

  const handleSwap = useCallback(() => {
    navigation.navigate('Swap');
  }, [navigation]);

  const handleReceive = useCallback(() => {
    navigation.navigate('Receive');
  }, [navigation]);

  const styles = createStyles(theme);

  if (!token) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backText, { color: theme.colors.text.primary }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>Token Not Found</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.text.secondary }]}>
            Token "{symbol}" not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const priceChangeColor = token.priceChange24h >= 0 ? theme.colors.success : theme.colors.error;
  const priceChangeSign = token.priceChange24h >= 0 ? '+' : '';

  // Mock price history data for demo
  const mockPriceHistory = Array.from({ length: 20 }, (_, i) => ({
    timestamp: Date.now() - (19 - i) * 3600000,
    price: parseFloat(token.usdValue) * (1 + (Math.random() - 0.5) * 0.1),
  }));

  // Mock recent transactions
  const mockTransactions = [
    {
      type: 'send' as const,
      amount: '0.5',
      usdValue: (parseFloat(token.usdValue) * 0.5).toFixed(2),
      timestamp: Date.now() - 1000 * 60 * 30,
      hash: '0xabc...123',
    },
    {
      type: 'receive' as const,
      amount: '1.0',
      usdValue: (parseFloat(token.usdValue) * 1.0).toFixed(2),
      timestamp: Date.now() - 1000 * 60 * 60 * 5,
      hash: '0xdef...456',
    },
    {
      type: 'swap' as const,
      amount: '0.25',
      usdValue: (parseFloat(token.usdValue) * 0.25).toFixed(2),
      timestamp: Date.now() - 1000 * 60 * 60 * 24,
      hash: '0xghi...789',
    },
  ];

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);

    if (diffInMins < 60) {
      return `${diffInMins}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{token.name}</Text>
        <View style={styles.placeholder} />
      </View>

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
        {/* Token Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.tokenIcon}>
            <Text style={styles.tokenIconText}>{token.symbol.charAt(0)}</Text>
          </View>
          <Text style={styles.tokenSymbol}>{token.symbol}</Text>
          <Text style={styles.tokenName}>{token.name}</Text>

          <Text style={styles.balance}>{parseFloat(token.balance).toFixed(6)}</Text>
          <Text style={styles.usdValue}>${token.usdValue}</Text>

          <View style={styles.priceChangeContainer}>
            <Text style={[styles.priceChange, { color: priceChangeColor }]}>
              {priceChangeSign}
              {token.priceChange24h.toFixed(2)}%
            </Text>
            <Text style={styles.priceChangeLabel}>Last 24 hours</Text>
          </View>
        </View>

        {/* Price Chart Placeholder */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Price Chart</Text>
            <View style={styles.timeRangeSelector}>
              {(['1D', '1W', '1M', '1Y'] as const).map(range => (
                <TouchableOpacity
                  key={range}
                  style={[
                    styles.timeRangeButton,
                    timeRange === range && styles.timeRangeButtonActive,
                  ]}
                  onPress={() => setTimeRange(range)}
                >
                  <Text
                    style={[
                      styles.timeRangeText,
                      timeRange === range && styles.timeRangeTextActive,
                    ]}
                  >
                    {range}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Simple line chart visualization */}
          <View style={styles.chartContainer}>
            <View style={styles.chartPlaceholder}>
              <Text style={styles.chartPlaceholderText}>Price chart visualization</Text>
              <Text style={styles.chartPlaceholderSubtext}>
                Integration with charting library needed
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleSend}>
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>↑</Text>
            </View>
            <Text style={styles.actionLabel}>Send</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleReceive}>
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>↓</Text>
            </View>
            <Text style={styles.actionLabel}>Receive</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleSwap}>
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>⇅</Text>
            </View>
            <Text style={styles.actionLabel}>Swap</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('TransactionHistory')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {mockTransactions.map((tx, index) => (
            <TouchableOpacity
              key={index}
              style={styles.transactionCard}
              onPress={() => navigation.navigate('TransactionDetails', { hash: tx.hash })}
            >
              <View style={styles.transactionLeft}>
                <View
                  style={[
                    styles.transactionIcon,
                    {
                      backgroundColor:
                        tx.type === 'send'
                          ? theme.colors.error + '20'
                          : tx.type === 'receive'
                            ? theme.colors.success + '20'
                            : theme.colors.primary + '20',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.transactionIconText,
                      {
                        color:
                          tx.type === 'send'
                            ? theme.colors.error
                            : tx.type === 'receive'
                              ? theme.colors.success
                              : theme.colors.primary,
                      },
                    ]}
                  >
                    {tx.type === 'send' ? '↑' : tx.type === 'receive' ? '↓' : '⇅'}
                  </Text>
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionType}>
                    {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                  </Text>
                  <Text style={styles.transactionTime}>{formatDate(tx.timestamp)}</Text>
                </View>
              </View>

              <View style={styles.transactionRight}>
                <Text
                  style={[
                    styles.transactionAmount,
                    {
                      color: tx.type === 'send' ? theme.colors.error : theme.colors.text.primary,
                    },
                  ]}
                >
                  {tx.type === 'send' ? '-' : '+'}
                  {tx.amount} {token.symbol}
                </Text>
                <Text style={styles.transactionUsd}>${tx.usdValue}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Token Information */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Token Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Symbol</Text>
            <Text style={styles.infoValue}>{token.symbol}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{token.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Balance</Text>
            <Text style={styles.infoValue}>{parseFloat(token.balance).toFixed(6)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>USD Value</Text>
            <Text style={styles.infoValue}>${token.usdValue}</Text>
          </View>
        </View>
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
      paddingBottom: 32,
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
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    errorText: {
      fontSize: 16,
      textAlign: 'center',
    },
    infoCard: {
      backgroundColor: theme.colors.card,
      margin: 16,
      padding: 24,
      borderRadius: 16,
      alignItems: 'center',
    },
    tokenIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    tokenIconText: {
      fontSize: 32,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    tokenSymbol: {
      fontSize: 24,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: 4,
    },
    tokenName: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: 16,
    },
    balance: {
      fontSize: 36,
      fontWeight: '700',
      color: theme.colors.text.primary,
      marginBottom: 8,
    },
    usdValue: {
      fontSize: 20,
      color: theme.colors.textSecondary,
      marginBottom: 16,
    },
    priceChangeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    priceChange: {
      fontSize: 18,
      fontWeight: '600',
    },
    priceChangeLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    chartCard: {
      backgroundColor: theme.colors.card,
      marginHorizontal: 16,
      marginBottom: 16,
      padding: 16,
      borderRadius: 16,
    },
    chartHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    chartTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    timeRangeSelector: {
      flexDirection: 'row',
      gap: 8,
    },
    timeRangeButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: theme.colors.surface,
    },
    timeRangeButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    timeRangeText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    timeRangeTextActive: {
      color: '#FFFFFF',
    },
    chartContainer: {
      height: 200,
    },
    chartPlaceholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
    },
    chartPlaceholderText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: 4,
    },
    chartPlaceholderSubtext: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    actionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingHorizontal: 32,
      marginBottom: 24,
    },
    actionButton: {
      alignItems: 'center',
      gap: 8,
    },
    actionIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionIcon: {
      fontSize: 24,
      color: '#FFFFFF',
    },
    actionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    transactionsSection: {
      paddingHorizontal: 16,
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    viewAllText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    transactionCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
    },
    transactionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    transactionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    transactionIconText: {
      fontSize: 20,
    },
    transactionInfo: {
      gap: 4,
    },
    transactionType: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    transactionTime: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    transactionRight: {
      alignItems: 'flex-end',
      gap: 4,
    },
    transactionAmount: {
      fontSize: 16,
      fontWeight: '600',
    },
    transactionUsd: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    infoSection: {
      paddingHorizontal: 16,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    infoLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    infoValue: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
  });

export default TokenDetailsScreen;
