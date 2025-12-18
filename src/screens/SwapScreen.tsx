/**
 * Swap Screen
 * Token swap interface with quote preview and execution
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { Theme } from '../constants/theme';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  setFromToken,
  setToToken,
  setFromAmount,
  swapTokens as swapTokensAction,
  setError,
  setQuote,
  setLoadingQuote,
  setSwapping,
  addSwapHistory,
  resetSwap,
} from '../store/slices/swapSlice';
import { SwapToken } from '../types/swap';
import { TokenSelectorModal } from '../components/swap/TokenSelectorModal';
import { getSwapService } from '../services/swap/SwapService';
import i18n from '../i18n';

interface SwapScreenProps {
  navigation: any;
}

export const SwapScreen: React.FC<SwapScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();

  // Get swap state from Redux
  const { fromToken, toToken, fromAmount, quote, isLoadingQuote, isSwapping, error } =
    useAppSelector(state => state.swap);

  // Get network and wallet state from Redux
  const currentNetwork = useAppSelector(state => state.network?.currentNetwork);
  const walletAddress =
    useAppSelector(state => state.wallet?.currentWallet?.address) ||
    '0x0000000000000000000000000000000000000000';

  const [localAmount, setLocalAmount] = useState(fromAmount);
  const [fromTokenModalVisible, setFromTokenModalVisible] = useState(false);
  const [toTokenModalVisible, setToTokenModalVisible] = useState(false);

  // Sample tokens for demo (should be fetched from service)
  const availableTokens: SwapToken[] = [
    {
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      chainId: 1,
    },
    {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 1,
    },
    {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chainId: 1,
    },
    {
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      chainId: 1,
    },
    {
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      decimals: 8,
      chainId: 1,
    },
  ];

  useEffect(() => {
    // Initialize with default tokens if not set
    if (!fromToken) {
      dispatch(setFromToken(availableTokens[0]));
    }
    if (!toToken) {
      dispatch(setToToken(availableTokens[1]));
    }
  }, []);

  // Auto-fetch quote when inputs change
  useEffect(() => {
    // Don't fetch if any required field is missing
    if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0 || !currentNetwork) {
      dispatch(setQuote(null));
      return;
    }

    // Debounce quote fetching
    const timeoutId = setTimeout(async () => {
      try {
        dispatch(setLoadingQuote(true));
        dispatch(setError(null));

        // Initialize swap service with network RPC URL
        const swapService = getSwapService({
          rpcUrl: currentNetwork.rpcUrl,
        });

        // Convert amount to wei
        const amountInWei = (parseFloat(fromAmount) * 10 ** fromToken.decimals).toString();

        // Validate amount is not too large
        const maxSafeAmount = Number.MAX_SAFE_INTEGER;
        if (parseFloat(amountInWei) > maxSafeAmount) {
          throw new Error('Amount too large');
        }

        // Swap only supports EVM chains with numeric chainIds
        const chainId = typeof currentNetwork.chainId === 'number' ? currentNetwork.chainId : 1;

        const quoteResult = await swapService.getQuote({
          fromTokenAddress: fromToken.address,
          toTokenAddress: toToken.address,
          amount: amountInWei,
          fromAddress: walletAddress,
          slippage: 0.5, // 0.5% default slippage
          chainId,
        });

        dispatch(setQuote(quoteResult));
      } catch (error) {
        console.error('Failed to fetch quote:', error);

        // Handle specific error types
        let errorMessage = 'Failed to fetch quote';
        if (error instanceof Error) {
          if (error.message.includes('network')) {
            errorMessage = 'Network error. Please check your connection and try again.';
          } else if (error.message.includes('timeout')) {
            errorMessage = 'Request timed out. Please try again.';
          } else if (error.message.includes('liquidity')) {
            errorMessage = 'Insufficient liquidity for this swap.';
          } else if (error.message.includes('Amount too large')) {
            errorMessage = 'Amount is too large. Please enter a smaller amount.';
          } else {
            errorMessage = error.message;
          }
        }

        dispatch(setError(errorMessage));
      } finally {
        dispatch(setLoadingQuote(false));
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [fromToken, toToken, fromAmount, currentNetwork, walletAddress, dispatch]);

  const handleAmountChange = (text: string) => {
    // Allow only numbers and one decimal point
    const filtered = text.replace(/[^0-9.]/g, '');
    const parts = filtered.split('.');
    const formatted = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : filtered;

    setLocalAmount(formatted);
    dispatch(setFromAmount(formatted));
  };

  const handleSwapTokens = () => {
    dispatch(swapTokensAction());
    setLocalAmount('');
  };

  const handleSwap = async () => {
    if (!fromToken || !toToken || !quote || !currentNetwork) {
      dispatch(setError('Missing required swap parameters'));
      return;
    }

    // Confirm swap with user
    Alert.alert(
      'Confirm Swap',
      `Swap ${fromAmount} ${fromToken.symbol} for ${(parseFloat(quote.toAmount) / 10 ** toToken.decimals).toFixed(6)} ${toToken.symbol}?\n\nPrice Impact: ${quote.priceImpact}%\nEstimated Gas: ${quote.estimatedGas}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: () => executeSwap(),
        },
      ]
    );
  };

  const executeSwap = async () => {
    if (!fromToken || !toToken || !quote || !currentNetwork) {
      Alert.alert('Error', 'Missing required information. Please try again.');
      return;
    }

    try {
      dispatch(setSwapping(true));
      dispatch(setError(null));

      // Validate price impact
      const priceImpact = parseFloat(quote.priceImpact);
      if (priceImpact > 15) {
        Alert.alert(
          'High Price Impact Warning',
          `This swap has a very high price impact of ${priceImpact.toFixed(2)}%. You may receive significantly less than expected. Do you want to continue?`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => dispatch(setSwapping(false)) },
            { text: 'Continue Anyway', style: 'destructive', onPress: () => continueSwap() },
          ]
        );
        return;
      }

      await continueSwap();
    } catch (error) {
      handleSwapError(error);
    }
  };

  const continueSwap = async () => {
    if (!fromToken || !toToken || !quote || !currentNetwork) {
      return;
    }

    try {
      // Convert amount to wei
      const amountInWei = (parseFloat(fromAmount) * 10 ** fromToken.decimals).toString();

      // Create swap history entry
      const swapHistoryId = `swap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Add pending swap to history
      // Swap only supports EVM chains with numeric chainIds
      const swapChainId = typeof currentNetwork.chainId === 'number' ? currentNetwork.chainId : 1;

      dispatch(
        addSwapHistory({
          id: swapHistoryId,
          fromToken,
          toToken,
          fromAmount: amountInWei,
          toAmount: quote.toAmount,
          txHash: swapHistoryId, // Temporary, will be replaced with real tx hash
          status: 'pending',
          timestamp: Date.now(),
          chainId: swapChainId,
        })
      );

      // TODO: In production, execute actual swap transaction
      // For demo, simulate swap execution
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate random success/failure for demo
      const shouldSucceed = Math.random() > 0.1; // 90% success rate

      if (!shouldSucceed) {
        throw new Error('Transaction reverted. The swap could not be completed.');
      }

      // Simulate successful swap
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;

      // Update swap history with confirmed status
      dispatch(
        addSwapHistory({
          id: mockTxHash,
          fromToken,
          toToken,
          fromAmount: amountInWei,
          toAmount: quote.toAmount,
          txHash: mockTxHash,
          status: 'confirmed',
          timestamp: Date.now(),
          chainId: swapChainId,
        })
      );

      // Show success message
      Alert.alert(
        'Swap Successful',
        `Successfully swapped ${fromAmount} ${fromToken.symbol} for ${(parseFloat(quote.toAmount) / 10 ** toToken.decimals).toFixed(6)} ${toToken.symbol}`,
        [
          {
            text: 'View Transaction',
            onPress: () => {
              // Navigate to transaction details
              navigation.navigate('TransactionDetails', { hash: mockTxHash });
            },
          },
          {
            text: 'OK',
            onPress: () => {
              // Reset swap form
              dispatch(resetSwap());
            },
          },
        ]
      );
    } catch (error) {
      handleSwapError(error);
    } finally {
      dispatch(setSwapping(false));
    }
  };

  const handleSwapError = (error: unknown) => {
    console.error('Swap failed:', error);

    let errorTitle = 'Swap Failed';
    let errorMessage = 'An error occurred during the swap';

    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('insufficient')) {
        errorTitle = 'Insufficient Balance';
        errorMessage = 'You do not have enough tokens to complete this swap.';
      } else if (error.message.includes('reverted')) {
        errorTitle = 'Transaction Failed';
        errorMessage =
          'The swap transaction was reverted. This could be due to insufficient liquidity, price changes, or slippage tolerance.';
      } else if (error.message.includes('rejected')) {
        errorTitle = 'Transaction Rejected';
        errorMessage = 'You rejected the transaction.';
      } else if (error.message.includes('network')) {
        errorTitle = 'Network Error';
        errorMessage = 'Failed to connect to the blockchain network. Please check your connection.';
      } else if (error.message.includes('gas')) {
        errorTitle = 'Gas Estimation Failed';
        errorMessage = 'Failed to estimate gas for this transaction. The swap may fail.';
      } else {
        errorMessage = error.message;
      }
    }

    dispatch(setError(errorMessage));

    Alert.alert(errorTitle, errorMessage, [
      {
        text: 'Try Again',
        onPress: () => {
          dispatch(setError(null));
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{i18n.t('swap.title')}</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('SwapHistory')}
            style={styles.historyButton}
          >
            <Text style={styles.historyText}>{i18n.t('swap.history')}</Text>
          </TouchableOpacity>
        </View>

        {/* From Section */}
        <View style={styles.swapSection}>
          <Text style={styles.sectionLabel}>{i18n.t('swap.from')}</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.amountInput}
              value={localAmount}
              onChangeText={handleAmountChange}
              placeholder="0.0"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="decimal-pad"
            />
            <TouchableOpacity
              style={styles.tokenButton}
              onPress={() => setFromTokenModalVisible(true)}
            >
              <Text style={styles.tokenSymbol}>{fromToken?.symbol || i18n.t('swap.select')}</Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>
          </View>
          {fromToken && (
            <Text style={styles.balanceText}>
              {i18n.t('swap.balance', { balance: '0.0', symbol: fromToken.symbol })}
            </Text>
          )}
        </View>

        {/* Swap Button */}
        <View style={styles.swapButtonContainer}>
          <TouchableOpacity style={styles.swapIconButton} onPress={handleSwapTokens}>
            <Text style={styles.swapIcon}>⇅</Text>
          </TouchableOpacity>
        </View>

        {/* To Section */}
        <View style={styles.swapSection}>
          <Text style={styles.sectionLabel}>{i18n.t('swap.to')}</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.estimatedAmount}>
              {quote?.toAmount && toToken
                ? (parseFloat(quote.toAmount) / 10 ** toToken.decimals).toFixed(6)
                : '0.0'}
            </Text>
            <TouchableOpacity
              style={styles.tokenButton}
              onPress={() => setToTokenModalVisible(true)}
            >
              <Text style={styles.tokenSymbol}>{toToken?.symbol || i18n.t('swap.select')}</Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>
          </View>
          {toToken && (
            <Text style={styles.balanceText}>
              {i18n.t('swap.balance', { balance: '0.0', symbol: toToken.symbol })}
            </Text>
          )}
        </View>

        {/* Quote Info */}
        {quote && fromToken && toToken && (
          <View style={styles.quoteInfo}>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>{i18n.t('swap.rate')}</Text>
              <Text style={styles.quoteValue}>
                1 {fromToken.symbol} ≈{' '}
                {(
                  parseFloat(quote.toAmount) /
                  10 ** toToken.decimals /
                  (parseFloat(quote.fromAmount) / 10 ** fromToken.decimals)
                ).toFixed(6)}{' '}
                {toToken.symbol}
              </Text>
            </View>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>{i18n.t('swap.priceImpact')}</Text>
              <Text
                style={[
                  styles.quoteValue,
                  parseFloat(quote.priceImpact) > 5 && { color: theme.colors.warning },
                ]}
              >
                {parseFloat(quote.priceImpact).toFixed(2)}%
              </Text>
            </View>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>{i18n.t('swap.estimatedGas')}</Text>
              <Text style={styles.quoteValue}>{quote.estimatedGas}</Text>
            </View>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>{i18n.t('swap.minimumReceived')}</Text>
              <Text style={styles.quoteValue}>
                {((parseFloat(quote.toAmount) / 10 ** toToken.decimals) * 0.995).toFixed(6)}{' '}
                {toToken.symbol}
              </Text>
            </View>
          </View>
        )}

        {/* Loading Indicator */}
        {isLoadingQuote && fromAmount && parseFloat(fromAmount) > 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              {i18n.t('swap.fetchingPrice')}
            </Text>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={styles.errorContainer}>
            <View style={styles.errorHeader}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorTitle}>{i18n.t('swap.error')}</Text>
            </View>
            <Text style={styles.errorText}>{error}</Text>
            {error.includes('network') || error.includes('timeout') ? (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  dispatch(setError(null));
                  // Trigger quote refetch by clearing and resetting amount
                  const currentAmount = fromAmount;
                  dispatch(setFromAmount(''));
                  setTimeout(() => dispatch(setFromAmount(currentAmount)), 100);
                }}
              >
                <Text style={styles.retryButtonText}>{i18n.t('swap.retry')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {/* Swap Action Button */}
        <TouchableOpacity
          style={[
            styles.swapButton,
            (!fromToken || !toToken || !localAmount || !quote || isSwapping) &&
              styles.swapButtonDisabled,
          ]}
          onPress={handleSwap}
          disabled={!fromToken || !toToken || !localAmount || !quote || isSwapping}
        >
          {isSwapping ? (
            <View style={styles.swapButtonContent}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={[styles.swapButtonText, { marginLeft: 8 }]}>
                {i18n.t('swap.swapping')}
              </Text>
            </View>
          ) : isLoadingQuote ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.swapButtonText}>{i18n.t('swap.swapButton')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Token Selector Modals */}
      <TokenSelectorModal
        visible={fromTokenModalVisible}
        tokens={availableTokens}
        selectedTokenAddress={fromToken?.address}
        onSelect={token => dispatch(setFromToken(token))}
        onClose={() => setFromTokenModalVisible(false)}
        title={i18n.t('swap.selectFromToken')}
      />
      <TokenSelectorModal
        visible={toTokenModalVisible}
        tokens={availableTokens}
        selectedTokenAddress={toToken?.address}
        onSelect={token => dispatch(setToToken(token))}
        onClose={() => setToTokenModalVisible(false)}
        title={i18n.t('swap.selectToToken')}
      />
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
    contentContainer: {
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
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
    historyButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: theme.colors.surface,
    },
    historyText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    swapSection: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 8,
    },
    sectionLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 12,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    amountInput: {
      flex: 1,
      fontSize: 32,
      fontWeight: '600',
      color: theme.colors.text.primary,
      padding: 0,
    },
    estimatedAmount: {
      flex: 1,
      fontSize: 32,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    tokenButton: {
      backgroundColor: theme.colors.background,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    tokenSymbol: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    dropdownIcon: {
      fontSize: 10,
      color: theme.colors.textSecondary,
    },
    balanceText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 8,
    },
    swapButtonContainer: {
      alignItems: 'center',
      marginVertical: -4,
      zIndex: 1,
    },
    swapIconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.card,
      borderWidth: 4,
      borderColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    swapIcon: {
      fontSize: 20,
      color: theme.colors.text.primary,
    },
    quoteInfo: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 16,
      marginTop: 16,
    },
    quoteRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    quoteLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    quoteValue: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text.primary,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      gap: 8,
    },
    loadingText: {
      fontSize: 14,
    },
    errorContainer: {
      backgroundColor: '#FF3B3020',
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
      borderWidth: 1,
      borderColor: '#FF3B3040',
    },
    errorHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      gap: 8,
    },
    errorIcon: {
      fontSize: 18,
    },
    errorTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FF3B30',
    },
    errorText: {
      color: '#FF3B30',
      fontSize: 14,
      lineHeight: 20,
    },
    retryButton: {
      backgroundColor: '#FF3B30',
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 16,
      marginTop: 12,
      alignItems: 'center',
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    swapButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      padding: 18,
      alignItems: 'center',
      marginTop: 24,
    },
    swapButtonDisabled: {
      opacity: 0.5,
    },
    swapButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    swapButtonText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });

export default SwapScreen;
