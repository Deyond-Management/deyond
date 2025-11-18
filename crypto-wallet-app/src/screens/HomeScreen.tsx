/**
 * Home Screen
 * Main dashboard showing wallet balance, tokens, and recent transactions
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/atoms/Button';
import { TokenCard } from '../components/molecules/TokenCard';
import { TransactionCard } from '../components/molecules/TransactionCard';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();

  // Mock data - in real app, this would come from Redux store
  const mockTokens = [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      balance: '1.5',
      usdValue: '2250.00',
      priceChange24h: 5.23,
    },
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      balance: '0.05',
      usdValue: '1500.00',
      priceChange24h: -2.15,
    },
  ];

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

  // Calculate total balance
  const calculateTotalBalance = (): string => {
    const total = mockTokens.reduce(
      (sum, token) => sum + parseFloat(token.usdValue),
      0
    );
    return total.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleSend = () => {
    navigation.navigate('Send');
  };

  const handleReceive = () => {
    navigation.navigate('Receive');
  };

  const handleTokenPress = (symbol: string) => {
    navigation.navigate('TokenDetails', { symbol });
  };

  const handleTransactionPress = (hash: string) => {
    navigation.navigate('TransactionDetails', { hash });
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.divider },
        ]}
        testID="account-header"
      >
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          Wallet
        </Text>
        <Text style={[styles.headerAddress, { color: theme.colors.text.secondary }]}>
          0x1234...5678
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        testID="home-scroll"
      >
        {/* Total Balance Section */}
        <View style={styles.balanceSection}>
          <Text style={[styles.balanceLabel, { color: theme.colors.text.secondary }]}>
            Total Balance
          </Text>
          <Text
            style={[styles.balanceAmount, { color: theme.colors.text.primary }]}
            testID="total-balance"
          >
            ${calculateTotalBalance()}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            onPress={handleSend}
            variant="primary"
            style={styles.actionButton}
            accessibilityLabel="Send"
          >
            Send
          </Button>
          <Button
            onPress={handleReceive}
            variant="outlined"
            style={styles.actionButton}
            accessibilityLabel="Receive"
          >
            Receive
          </Button>
        </View>

        {/* Tokens Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            My Tokens
          </Text>
          {mockTokens.map((token, index) => (
            <TokenCard
              key={token.symbol}
              {...token}
              onPress={() => handleTokenPress(token.symbol)}
              testID={`token-card-${index}`}
              style={styles.card}
            />
          ))}
        </View>

        {/* Transactions Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Recent Transactions
          </Text>
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
              No transactions yet
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerAddress: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  balanceSection: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  card: {
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 32,
  },
});

export default HomeScreen;
