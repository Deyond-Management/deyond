/**
 * TransactionPreviewScreen
 * Shows transaction details for confirmation before sending
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
import { Card } from '../components/atoms/Card';

interface TransactionPreviewScreenProps {
  navigation: any;
  route: {
    params: {
      to: string;
      amount: string;
      token: string;
      networkFee: string;
    };
  };
}

export const TransactionPreviewScreen: React.FC<TransactionPreviewScreenProps> = ({
  navigation,
  route,
}) => {
  const { theme } = useTheme();
  const { to, amount, token, networkFee } = route.params;

  // Mock data - in real app, this would come from Redux
  const fromAddress = '0xabcdef1234567890abcdef1234567890abcdef12';
  const ethPriceUSD = 2000;
  const gasLimit = '21000';
  const maxFeePerGas = '50'; // gwei

  // Calculate values
  const amountUSD = (parseFloat(amount) * ethPriceUSD).toFixed(2);
  const feeUSD = (parseFloat(networkFee) * ethPriceUSD).toFixed(2);
  const totalAmount = (parseFloat(amount) + parseFloat(networkFee)).toFixed(6);
  const totalUSD = (parseFloat(totalAmount) * ethPriceUSD).toFixed(2);

  // Format addresses
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleEdit = () => {
    navigation.goBack();
  };

  const handleConfirm = () => {
    navigation.navigate('TransactionStatus', {
      to,
      amount,
      token,
      networkFee,
      txHash: '0x' + 'a'.repeat(64), // Mock transaction hash
    });
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          Confirm Transaction
        </Text>

        {/* Amount Card */}
        <Card style={styles.card} elevation={1}>
          <View style={styles.amountSection}>
            <Text style={[styles.amountLabel, { color: theme.colors.text.secondary }]}>
              Amount
            </Text>
            <Text style={[styles.amountValue, { color: theme.colors.text.primary }]}>
              {amount} {token}
            </Text>
            <Text
              style={[styles.amountUSD, { color: theme.colors.text.secondary }]}
              testID="usd-value"
            >
              ≈ ${amountUSD}
            </Text>
          </View>
        </Card>

        {/* Address Details Card */}
        <Card style={styles.card} elevation={1}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
              From
            </Text>
            <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
              {formatAddress(fromAddress)}
            </Text>
          </View>

          <View style={[styles.detailRow, styles.detailRowBorder, { borderTopColor: theme.colors.divider }]}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
              To
            </Text>
            <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
              {formatAddress(to)}
            </Text>
          </View>
        </Card>

        {/* Warning for new address */}
        <View style={[styles.warningCard, { backgroundColor: theme.colors.warning + '20' }]}>
          <Text style={[styles.warningText, { color: theme.colors.warning }]}>
            First transaction to this address. Please verify it's correct.
          </Text>
        </View>

        {/* Gas Details Card */}
        <Card style={styles.card} elevation={1}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Gas Details
          </Text>

          <View style={styles.gasRow}>
            <Text style={[styles.gasLabel, { color: theme.colors.text.secondary }]}>
              Gas Limit
            </Text>
            <Text style={[styles.gasValue, { color: theme.colors.text.primary }]}>
              {gasLimit}
            </Text>
          </View>

          <View style={styles.gasRow}>
            <Text style={[styles.gasLabel, { color: theme.colors.text.secondary }]}>
              Max Fee
            </Text>
            <Text style={[styles.gasValue, { color: theme.colors.text.primary }]}>
              {maxFeePerGas} Gwei
            </Text>
          </View>

          <View style={[styles.gasRow, styles.feeRow]}>
            <Text style={[styles.gasLabel, { color: theme.colors.text.secondary }]}>
              Network Fee
            </Text>
            <View style={styles.feeValue}>
              <Text style={[styles.gasValue, { color: theme.colors.text.primary }]}>
                {networkFee} {token}
              </Text>
              <Text style={[styles.feeUSD, { color: theme.colors.text.secondary }]}>
                ≈ ${feeUSD}
              </Text>
            </View>
          </View>
        </Card>

        {/* Total Card */}
        <Card style={styles.card} elevation={2}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: theme.colors.text.secondary }]}>
              Total
            </Text>
            <View style={styles.totalValue}>
              <Text style={[styles.totalAmount, { color: theme.colors.text.primary }]}>
                {totalAmount} {token}
              </Text>
              <Text style={[styles.totalUSD, { color: theme.colors.text.secondary }]}>
                ≈ ${totalUSD}
              </Text>
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            onPress={handleEdit}
            variant="outlined"
            size="large"
            style={styles.editButton}
          >
            Edit
          </Button>
          <Button
            onPress={handleConfirm}
            variant="primary"
            size="large"
            style={styles.confirmButton}
            accessibilityLabel="Confirm"
          >
            Confirm
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    marginBottom: 16,
  },
  amountSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  amountLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  amountUSD: {
    fontSize: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailRowBorder: {
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 20,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  warningCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 12,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  gasRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gasLabel: {
    fontSize: 14,
  },
  gasValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  feeRow: {
    marginTop: 8,
    paddingTop: 8,
  },
  feeValue: {
    alignItems: 'flex-end',
  },
  feeUSD: {
    fontSize: 12,
    marginTop: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalUSD: {
    fontSize: 14,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  editButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 2,
  },
});

export default TransactionPreviewScreen;
