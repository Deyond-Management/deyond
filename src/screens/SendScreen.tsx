/**
 * Send Screen
 * Screen for sending cryptocurrency to another address
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';
import { Card } from '../components/atoms/Card';

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
  const validateAddress = (address: string): boolean => {
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(address);
  };

  // Validate amount
  const validateAmount = (value: string): boolean => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return false;
    if (numValue > parseFloat(selectedToken.balance)) return false;
    return true;
  };

  // Check if form is valid
  const isFormValid = (): boolean => {
    return (
      recipientAddress.length > 0 &&
      validateAddress(recipientAddress) &&
      amount.length > 0 &&
      validateAmount(amount)
    );
  };

  // Handle address change
  const handleAddressChange = (value: string) => {
    setRecipientAddress(value);
    if (value.length > 0 && !validateAddress(value)) {
      setAddressError('Invalid address format');
    } else {
      setAddressError('');
    }
  };

  // Handle amount change
  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (value.length > 0) {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) {
        setAmountError('Invalid amount');
      } else if (numValue > parseFloat(selectedToken.balance)) {
        setAmountError('Insufficient balance');
      } else {
        setAmountError('');
      }
    } else {
      setAmountError('');
    }
  };

  // Handle max button
  const handleMaxPress = () => {
    const maxAmount = parseFloat(selectedToken.balance) - parseFloat(networkFee);
    if (maxAmount > 0) {
      setAmount(maxAmount.toFixed(6));
      setAmountError('');
    }
  };

  // Calculate USD equivalent
  const getUSDEquivalent = (): string => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return '$0.00';
    const usdValue = numAmount * selectedToken.usdPrice;
    return `$${usdValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Handle send
  const handleSend = () => {
    if (!isFormValid()) return;

    navigation.navigate('ConfirmTransaction', {
      to: recipientAddress,
      amount,
      token: selectedToken.symbol,
      networkFee,
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Token Selection Card */}
        <Card style={styles.card} elevation={1}>
          <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Token</Text>
          <View style={styles.tokenRow} testID="selected-token">
            <Text style={[styles.tokenSymbol, { color: theme.colors.text.primary }]}>
              {selectedToken.symbol}
            </Text>
          </View>
          <Text
            style={[styles.balanceText, { color: theme.colors.text.secondary }]}
            testID="token-balance"
          >
            Balance: {selectedToken.balance} {selectedToken.symbol}
          </Text>
        </Card>

        {/* Recipient Address Input */}
        <Card style={styles.card} elevation={1}>
          <Input
            label="Recipient Address"
            placeholder="Recipient address (0x...)"
            value={recipientAddress}
            onChangeText={handleAddressChange}
            error={addressError}
            accessibilityLabel="Recipient address"
          />
        </Card>

        {/* Amount Input */}
        <Card style={styles.card} elevation={1}>
          <View style={styles.amountContainer}>
            <Input
              label="Amount"
              placeholder="Amount"
              value={amount}
              onChangeText={handleAmountChange}
              type="number"
              error={amountError}
              accessibilityLabel="Amount"
            />
            <TouchableOpacity
              style={[styles.maxButton, { backgroundColor: theme.isDark ? '#2196F3' : '#1976D2' }]}
              onPress={handleMaxPress}
            >
              <Text style={styles.maxButtonText}>MAX</Text>
            </TouchableOpacity>
          </View>

          {amount && !amountError && (
            <Text
              style={[styles.usdEquivalent, { color: theme.colors.text.secondary }]}
              testID="usd-equivalent"
            >
              ≈ {getUSDEquivalent()}
            </Text>
          )}
        </Card>

        {/* Network Fee */}
        <Card style={styles.card} elevation={1}>
          <View style={styles.feeRow}>
            <Text style={[styles.feeLabel, { color: theme.colors.text.secondary }]}>
              Network Fee
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
          onPress={handleSend}
          variant="primary"
          size="large"
          fullWidth
          disabled={!isFormValid()}
          style={styles.sendButton}
          accessibilityLabel="Send"
        >
          Send
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
