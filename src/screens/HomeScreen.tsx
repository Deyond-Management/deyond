/**
 * Home Screen
 * Main dashboard showing wallet balance, tokens, and recent transactions
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/atoms/Button';
import { TokenCard } from '../components/molecules/TokenCard';
import { TransactionCard } from '../components/molecules/TransactionCard';
import { TokenCardSkeleton, TransactionCardSkeleton } from '../components/atoms/SkeletonLoader';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  fetchTokenBalances,
  refreshTokenBalances,
  selectTokens,
  selectTotalBalance,
  selectTokenLoading,
} from '../store/slices/tokenSlice';
import { setCurrentNetwork } from '../store/slices/networkSlice';
import { NetworkSelectorModal, Network } from '../components/organisms/NetworkSelectorModal';
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
  const networks = useAppSelector(state => state.network?.networks ?? []);
  const currentNetwork = useAppSelector(state => state.network?.currentNetwork);

  // Map networks to modal format - memoized to prevent recalculation
  const modalNetworks: Network[] = useMemo(
    () =>
      networks.map(n => ({
        id: n.id,
        name: n.name,
        chainId: n.chainId,
        rpcUrl: n.rpcUrl,
        symbol: n.currencySymbol,
        blockExplorer: n.blockExplorerUrl || '',
        isTestnet: n.isTestnet,
      })),
    [networks]
  );

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

  // Format total balance for display - memoized to prevent recalculation
  const formattedTotalBalance = useMemo(
    () =>
      parseFloat(totalBalance).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [totalBalance]
  );

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

  // Truncate address for display - memoized
  const truncatedAddress = useMemo(
    () => `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
    [walletAddress]
  );

  const handleSend = useCallback(() => {
    navigation.navigate('Send');
  }, [navigation]);

  const handleReceive = useCallback(() => {
    navigation.navigate('Receive');
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
      // Find the original network from Redux state
      const originalNetwork = networks.find(n => n.id === network.id);
      if (originalNetwork) {
        dispatch(setCurrentNetwork(originalNetwork));
      }
      setNetworkModalVisible(false);
    },
    [networks, dispatch]
  );

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
      <View
        style={[
          styles.header,
          { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.divider },
        ]}
        testID="account-header"
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
              {i18n.t('home.title')}
            </Text>
            <Text style={[styles.headerAddress, { color: theme.colors.text.secondary }]}>
              {truncatedAddress}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.networkSelector, { backgroundColor: theme.colors.surface }]}
            onPress={handleNetworkSelect}
            testID="network-selector"
          >
            <View
              style={[
                styles.networkDot,
                { backgroundColor: currentNetwork?.isTestnet ? '#FF9800' : '#4CAF50' },
              ]}
            />
            <Text style={[styles.networkName, { color: theme.colors.text.primary }]}>
              {currentNetwork?.name ?? i18n.t('home.selectNetwork')}
            </Text>
            <Text style={[styles.networkArrow, { color: theme.colors.text.secondary }]}>▼</Text>
          </TouchableOpacity>
        </View>
      </View>

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
        <View style={styles.balanceSection}>
          <Text style={[styles.balanceLabel, { color: theme.colors.text.secondary }]}>
            {i18n.t('home.totalBalance')}
          </Text>
          <Text
            style={[styles.balanceAmount, { color: theme.colors.text.primary }]}
            testID="total-balance"
          >
            ${formattedTotalBalance}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            testID="send-button"
            onPress={handleSend}
            variant="primary"
            style={styles.actionButton}
            accessibilityLabel={i18n.t('home.send')}
          >
            {i18n.t('home.send')}
          </Button>
          <Button
            testID="receive-button"
            onPress={handleReceive}
            variant="outlined"
            style={styles.actionButton}
            accessibilityLabel={i18n.t('home.receive')}
          >
            {i18n.t('home.receive')}
          </Button>
          <Button
            testID="buy-button"
            onPress={handleBuy}
            variant="outlined"
            style={styles.actionButton}
            accessibilityLabel={i18n.t('home.buy')}
          >
            {i18n.t('home.buy')}
          </Button>
        </View>

        {/* Tokens Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            {i18n.t('home.myTokens')}
          </Text>
          {isLoading && tokens.length === 0 ? (
            <>
              <TokenCardSkeleton testID="token-skeleton-0" style={styles.card} />
              <TokenCardSkeleton testID="token-skeleton-1" style={styles.card} />
              <TokenCardSkeleton testID="token-skeleton-2" style={styles.card} />
            </>
          ) : tokens.length > 0 ? (
            tokens.map((token, index) => (
              <TokenCard
                key={token.symbol}
                symbol={token.symbol}
                name={token.name}
                balance={token.balance}
                usdValue={token.usdValue}
                priceChange24h={token.priceChange24h}
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
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              {i18n.t('home.recentTransactions')}
            </Text>
            <TouchableOpacity
              testID="history-tab"
              onPress={() => navigation.navigate('TransactionHistory')}
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
        networks={modalNetworks}
        selectedNetworkId={currentNetwork?.id ?? ''}
        onSelect={handleNetworkChange}
        onClose={() => setNetworkModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  balanceSection: {
    alignItems: 'center',
    marginBottom: 16,
    padding: 24,
  },
  card: {
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    paddingVertical: 32,
    textAlign: 'center',
  },
  header: {
    borderBottomWidth: 1,
    padding: 16,
  },
  headerAddress: {
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  networkArrow: {
    fontSize: 8,
  },
  networkDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  networkName: {
    fontSize: 12,
    fontWeight: '600',
  },
  networkSelector: {
    alignItems: 'center',
    borderRadius: 20,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
