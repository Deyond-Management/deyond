/**
 * Home Screen
 * Main dashboard showing wallet balance, tokens, and recent transactions
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { TokenCard } from '../components/molecules/TokenCard';
import { TransactionCard } from '../components/molecules/TransactionCard';
import { TokenCardSkeleton } from '../components/atoms/SkeletonLoader';
import { HomeHeader } from '../components/home/HomeHeader';
import { BalanceCard } from '../components/home/BalanceCard';
import { QuickActions } from '../components/home/QuickActions';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  fetchTokenBalances,
  refreshTokenBalances,
  selectTokens,
  selectTotalBalance,
  selectTokenLoading,
} from '../store/slices/tokenSlice';
import {
  setCurrentNetwork,
  toggleShowTestnets,
  selectNetworks,
  selectCurrentNetwork,
  selectShowTestnets,
} from '../store/slices/networkSlice';
import { NetworkSelectorModal } from '../components/organisms/NetworkSelectorModal';
import { Network } from '../types/wallet';
import i18n from '../i18n';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [networkModalVisible, setNetworkModalVisible] = useState(false);

  // Get wallet state from Redux
  const isWalletInitialized = useAppSelector(state => state.wallet?.isInitialized ?? false);
  const walletAddress = '0x1234567890123456789012345678901234567890'; // Full address for API

  // Get token state from Redux
  const tokens = useAppSelector(selectTokens);
  const totalBalance = useAppSelector(selectTotalBalance);
  const isLoading = useAppSelector(selectTokenLoading);

  // Get network state from Redux
  const networks = useAppSelector(selectNetworks);
  const currentNetwork = useAppSelector(selectCurrentNetwork);
  const showTestnets = useAppSelector(selectShowTestnets);

  // Mock transactions
  const mockTransactions = [
    {
      type: 'sent' as const,
      amount: '0.5',
      symbol: 'ETH',
      to: '0x1234...5678',
      from: '0xabcd...efgh',
      timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
      status: 'confirmed' as const,
      hash: '0xhash1',
    },
    {
      type: 'received' as const,
      amount: '0.1',
      symbol: 'BTC',
      to: '0xabcd...efgh',
      from: '0x9876...4321',
      timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
      status: 'confirmed' as const,
      hash: '0xhash2',
    },
  ];

  // Fetch balances on mount
  useEffect(() => {
    dispatch(fetchTokenBalances(walletAddress));
  }, [dispatch, walletAddress]);

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(refreshTokenBalances(walletAddress));
    setRefreshing(false);
  }, [dispatch, walletAddress]);

  const handleSend = useCallback(() => {
    navigation.navigate('Send');
  }, [navigation]);

  const handleReceive = useCallback(() => {
    navigation.navigate('Receive');
  }, [navigation]);

  const handleSwap = useCallback(() => {
    navigation.navigate('Swap');
  }, [navigation]);

  const handleBuy = useCallback(() => {
    // Open external buy crypto link (placeholder)
    Linking.openURL('https://buy.crypto.example.com');
  }, []);

  const handleNetworkSelect = useCallback(() => {
    setNetworkModalVisible(true);
  }, []);

  const handleNetworkChange = useCallback(
    (network: Network) => {
      dispatch(setCurrentNetwork(network));
      setNetworkModalVisible(false);
    },
    [dispatch]
  );

  const handleToggleTestnets = useCallback(() => {
    dispatch(toggleShowTestnets());
  }, [dispatch]);

  const handleTokenPress = useCallback(
    (symbol: string) => {
      navigation.navigate('TokenDetails', { symbol });
    },
    [navigation]
  );

  const handleTransactionPress = useCallback(
    (hash: string) => {
      navigation.navigate('TransactionDetails', { hash });
    },
    [navigation]
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      testID="home-screen"
    >
      {/* Header */}
      <HomeHeader
        walletAddress={walletAddress}
        networkName={currentNetwork?.name ?? ''}
        isTestnet={currentNetwork?.isTestnet ?? false}
        onNetworkSelect={handleNetworkSelect}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        testID="home-scroll"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Total Balance Section */}
        <BalanceCard totalBalance={totalBalance} />

        {/* Action Buttons */}
        <QuickActions
          onSend={handleSend}
          onReceive={handleReceive}
          onSwap={handleSwap}
          onBuy={handleBuy}
        />

        {/* Tokens Section */}
        <View style={styles.section} accessible={true} accessibilityLabel={i18n.t('home.myTokens')}>
          <View style={styles.sectionHeader}>
            <Text
              style={[styles.sectionTitle, { color: theme.colors.text.primary }]}
              accessibilityRole="header"
            >
              {i18n.t('home.myTokens')}
            </Text>
            <TouchableOpacity
              testID="tokens-view-all"
              onPress={() => navigation.navigate('TokenList')}
              accessibilityRole="button"
              accessibilityLabel={i18n.t('home.viewAllTokens')}
            >
              <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>
                {i18n.t('home.viewAll')}
              </Text>
            </TouchableOpacity>
          </View>
          {isLoading && tokens.length === 0 ? (
            <>
              <TokenCardSkeleton testID="token-skeleton-0" style={styles.card} />
              <TokenCardSkeleton testID="token-skeleton-1" style={styles.card} />
              <TokenCardSkeleton testID="token-skeleton-2" style={styles.card} />
            </>
          ) : tokens.length > 0 ? (
            tokens.map((token, index) => (
              <TokenCard
                key={`${token.symbol}-${token.chainId || index}`}
                symbol={token.symbol}
                name={token.name}
                balance={token.balance}
                usdValue={token.usdValue}
                priceChange24h={token.priceChange24h}
                networkType={token.networkType}
                network={token.network}
                iconUrl={token.logoUrl}
                onPress={() => handleTokenPress(token.symbol)}
                testID={`token-card-${index}`}
                style={styles.card}
              />
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
              {i18n.t('home.noTokens')}
            </Text>
          )}
        </View>

        {/* Transactions Section */}
        <View
          style={styles.section}
          accessible={true}
          accessibilityLabel={i18n.t('home.recentTransactions')}
        >
          <View style={styles.sectionHeader}>
            <Text
              style={[styles.sectionTitle, { color: theme.colors.text.primary }]}
              accessibilityRole="header"
            >
              {i18n.t('home.recentTransactions')}
            </Text>
            <TouchableOpacity
              testID="history-tab"
              onPress={() => navigation.navigate('TransactionHistory')}
              accessibilityRole="button"
              accessibilityLabel={i18n.t('home.viewAllTransactions')}
              accessibilityHint={i18n.t('a11y.tapToViewAllTransactions')}
            >
              <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>
                {i18n.t('home.viewAll')}
              </Text>
            </TouchableOpacity>
          </View>
          {mockTransactions.length > 0 ? (
            mockTransactions.map((tx, index) => (
              <TransactionCard
                key={tx.hash}
                {...tx}
                onPress={() => handleTransactionPress(tx.hash)}
                testID={`tx-card-${index}`}
                style={styles.card}
              />
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
              {i18n.t('home.noTransactions')}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Network Selector Modal */}
      <NetworkSelectorModal
        visible={networkModalVisible}
        networks={networks}
        selectedNetworkId={currentNetwork?.id ?? ''}
        showTestnets={showTestnets}
        onSelect={handleNetworkChange}
        onClose={() => setNetworkModalVisible(false)}
        onToggleTestnets={handleToggleTestnets}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    paddingVertical: 32,
    textAlign: 'center',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default HomeScreen;
