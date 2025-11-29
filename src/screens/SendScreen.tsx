/**
 * Send Screen
 * Screen for sending cryptocurrency to another address
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';
import { Card } from '../components/atoms/Card';
import i18n from '../i18n';

interface SendScreenProps {
  navigation: any;
}

export const SendScreen: React.FC<SendScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();

  // Form state
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [addressError, setAddressError] = useState('');
  const [amountError, setAmountError] = useState('');

  // Mock data - in real app, this would come from Redux
  const selectedToken = {
    symbol: 'ETH',
    balance: '1.5',
    usdPrice: 1500,
  };

  const networkFee = '0.0021'; // Mock gas fee in ETH
  const networkFeeUSD = '3.15';

  // Validate Ethereum address format
  const validateAddress = useCallback((address: string): boolean => {
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(address);
  }, []);

  // Validate amount
  const validateAmount = useCallback(
    (value: string): boolean => {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) return false;
      if (numValue > parseFloat(selectedToken.balance)) return false;
      return true;
    },
    [selectedToken.balance]
  );

  // Check if form is valid - memoized to prevent recalculation
  const isFormValid = useMemo(
    () =>
      recipientAddress.length > 0 &&
      validateAddress(recipientAddress) &&
      amount.length > 0 &&
      validateAmount(amount),
    [recipientAddress, amount, validateAddress, validateAmount]
  );

  // Handle address change
  const handleAddressChange = useCallback(
    (value: string) => {
      setRecipientAddress(value);
      if (value.length > 0 && !validateAddress(value)) {
        setAddressError(i18n.t('send.errors.invalidAddress'));
      } else {
        setAddressError('');
      }
    },
    [validateAddress]
  );

  // Handle amount change
  const handleAmountChange = useCallback(
    (value: string) => {
      setAmount(value);
      if (value.length > 0) {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue <= 0) {
          setAmountError(i18n.t('send.errors.invalidAmount'));
        } else if (numValue > parseFloat(selectedToken.balance)) {
          setAmountError(i18n.t('send.errors.insufficientBalance'));
        } else {
          setAmountError('');
        }
      } else {
        setAmountError('');
      }
    },
    [selectedToken.balance]
  );

  // Handle max button
  const handleMaxPress = useCallback(() => {
    const maxAmount = parseFloat(selectedToken.balance) - parseFloat(networkFee);
    if (maxAmount > 0) {
      setAmount(maxAmount.toFixed(6));
      setAmountError('');
    }
  }, [selectedToken.balance, networkFee]);

  // Calculate USD equivalent - memoized
  const usdEquivalent = useMemo(() => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return '$0.00';
    const usdValue = numAmount * selectedToken.usdPrice;
    return `$${usdValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }, [amount, selectedToken.usdPrice]);

  // Handle send
  const handleSend = useCallback(() => {
    if (!isFormValid) return;

    navigation.navigate('ConfirmTransaction', {
      to: recipientAddress,
      amount,
      token: selectedToken.symbol,
      networkFee,
    });
  }, [isFormValid, navigation, recipientAddress, amount, selectedToken.symbol, networkFee]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Token Selection Card */}
        <Card style={styles.card} elevation={1}>
          <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
            {i18n.t('send.token')}
          </Text>
          <View style={styles.tokenRow} testID="selected-token">
            <Text style={[styles.tokenSymbol, { color: theme.colors.text.primary }]}>
              {selectedToken.symbol}
            </Text>
          </View>
          <Text
            style={[styles.balanceText, { color: theme.colors.text.secondary }]}
            testID="token-balance"
          >
            {i18n.t('send.balance', {
              balance: selectedToken.balance,
              symbol: selectedToken.symbol,
            })}
          </Text>
        </Card>

        {/* Recipient Address Input */}
        <Card style={styles.card} elevation={1}>
          <Input
            testID="recipient-address-input"
            label={i18n.t('send.recipientAddress')}
            placeholder={i18n.t('send.recipientPlaceholder')}
            value={recipientAddress}
            onChangeText={handleAddressChange}
            error={addressError}
            accessibilityLabel={i18n.t('send.recipientAddress')}
          />
        </Card>

        {/* Amount Input */}
        <Card style={styles.card} elevation={1}>
          <View style={styles.amountContainer}>
            <Input
              testID="amount-input"
              label={i18n.t('send.amount')}
              placeholder={i18n.t('send.amountPlaceholder')}
              value={amount}
              onChangeText={handleAmountChange}
              type="number"
              error={amountError}
              accessibilityLabel={i18n.t('send.amount')}
            />
            <TouchableOpacity
              style={[styles.maxButton, { backgroundColor: theme.isDark ? '#2196F3' : '#1976D2' }]}
              onPress={handleMaxPress}
            >
              <Text style={styles.maxButtonText}>{i18n.t('send.max')}</Text>
            </TouchableOpacity>
          </View>

          {amount && !amountError && (
            <Text
              style={[styles.usdEquivalent, { color: theme.colors.text.secondary }]}
              testID="usd-equivalent"
            >
              ≈ {usdEquivalent}
            </Text>
          )}
        </Card>

        {/* Network Fee */}
        <Card style={styles.card} elevation={1}>
          <View style={styles.feeRow}>
            <Text style={[styles.feeLabel, { color: theme.colors.text.secondary }]}>
              {i18n.t('send.networkFee')}
            </Text>
            <View style={styles.feeValue}>
              <Text style={[styles.feeAmount, { color: theme.colors.text.primary }]}>
                {networkFee} {selectedToken.symbol}
              </Text>
              <Text style={[styles.feeUSD, { color: theme.colors.text.secondary }]}>
                ≈ ${networkFeeUSD}
              </Text>
            </View>
          </View>
        </Card>

        {/* Send Button */}
        <Button
          testID="continue-button"
          onPress={handleSend}
          variant="primary"
          size="large"
          fullWidth
          disabled={!isFormValid}
          style={styles.sendButton}
          accessibilityLabel={i18n.t('send.continue')}
        >
          {i18n.t('send.continue')}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  amountContainer: {
    position: 'relative',
  },
  balanceText: {
    fontSize: 14,
  },
  card: {
    marginBottom: 16,
  },
  feeAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  feeLabel: {
    fontSize: 14,
  },
  feeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  feeUSD: {
    fontSize: 12,
    marginTop: 2,
  },
  feeValue: {
    alignItems: 'flex-end',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  maxButton: {
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    position: 'absolute',
    right: 12,
    top: 38,
  },
  maxButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  scrollView: {
    flex: 1,
  },
  sendButton: {
    marginTop: 16,
  },
  tokenRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
  },
  tokenSymbol: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  usdEquivalent: {
    fontSize: 14,
    marginTop: 8,
  },
});

export default SendScreen;
