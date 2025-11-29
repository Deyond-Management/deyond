/**
 * TransactionStatusScreen
 * Shows the status of a submitted transaction
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/atoms/Card';
import { AnimatedIcon } from '../components/atoms/AnimatedIcon';
import i18n from '../i18n';

type TransactionStatus = 'pending' | 'confirmed' | 'failed';

interface TransactionStatusScreenProps {
  navigation: any;
  route: {
    params: {
      to: string;
      amount: string;
      token: string;
      txHash: string;
      status: TransactionStatus;
      error?: string;
    };
  };
}

export const TransactionStatusScreen: React.FC<TransactionStatusScreenProps> = ({
  navigation,
  route,
}) => {
  const { theme } = useTheme();
  const { to, amount, token, txHash, status, error } = route.params;

  // Format address
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format hash
  const formatHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  // Get status color
  const getStatusColor = () => {
    switch (status) {
      case 'confirmed':
        return theme.colors.success;
      case 'failed':
        return theme.colors.error;
      default:
        return theme.colors.warning;
    }
  };

  // Get status text
  const getStatusText = () => {
    switch (status) {
      case 'confirmed':
        return i18n.t('transactions.confirmed');
      case 'failed':
        return i18n.t('transactions.failed');
      default:
        return i18n.t('transactions.pending');
    }
  };

  // Handle view on explorer
  const handleViewExplorer = () => {
    const explorerUrl = `https://etherscan.io/tx/${txHash}`;
    Linking.openURL(explorerUrl);
  };

  // Handle copy hash
  const handleCopyHash = () => {
    Clipboard.setString(txHash);
  };

  // Handle done
  const handleDone = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  // Handle retry
  const handleRetry = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Status Indicator */}
        <View style={styles.statusSection}>
          {status === 'pending' && (
            <AnimatedIcon type="loading" size={120} loop={true} testID="loading-animation" />
          )}
          {status === 'confirmed' && (
            <AnimatedIcon type="success" size={120} loop={false} testID="success-animation" />
          )}
          {status === 'failed' && (
            <AnimatedIcon type="error" size={120} loop={false} testID="error-animation" />
          )}

          <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusText()}</Text>

          {error && <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>}
        </View>

        {/* Transaction Amount */}
        <Card style={styles.card} elevation={1}>
          <View style={styles.amountSection}>
            <Text style={[styles.amountLabel, { color: theme.colors.text.secondary }]}>
              {i18n.t('transactions.amountSent')}
            </Text>
            <Text style={[styles.amountValue, { color: theme.colors.text.primary }]}>
              {amount} {token}
            </Text>
          </View>
        </Card>

        {/* Transaction Details */}
        <Card style={styles.card} elevation={1}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
              {i18n.t('transactions.to')}
            </Text>
            <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
              {formatAddress(to)}
            </Text>
          </View>

          <View
            style={[
              styles.detailRow,
              {
                borderTopWidth: 1,
                borderTopColor: theme.colors.divider,
                paddingTop: 12,
                marginTop: 12,
              },
            ]}
          >
            <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
              {i18n.t('transactions.transactionHash')}
            </Text>
            <View style={styles.hashRow}>
              <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                {formatHash(txHash)}
              </Text>
              <TouchableOpacity
                onPress={handleCopyHash}
                testID="copy-hash-button"
                style={styles.copyButton}
              >
                <Text style={[styles.copyText, { color: theme.colors.primary }]}>
                  {i18n.t('transactions.copy')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* View on Explorer */}
        <TouchableOpacity style={styles.explorerButton} onPress={handleViewExplorer}>
          <Text style={[styles.explorerText, { color: theme.colors.primary }]}>
            {i18n.t('transactions.viewOnExplorer')}
          </Text>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {status === 'failed' && (
            <Button
              onPress={handleRetry}
              variant="outlined"
              size="large"
              style={styles.retryButton}
            >
              {i18n.t('transactions.retry')}
            </Button>
          )}
          <Button
            onPress={handleDone}
            variant="primary"
            size="large"
            style={status === 'failed' ? styles.doneButtonHalf : styles.doneButton}
            accessibilityLabel={i18n.t('transactions.done')}
          >
            {i18n.t('transactions.done')}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    width: '100%',
  },
  amountLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  amountSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 16,
    width: '100%',
  },
  copyButton: {
    padding: 4,
  },
  copyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailLabel: {
    fontSize: 14,
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  doneButton: {
    flex: 1,
  },
  doneButtonHalf: {
    flex: 1,
  },
  errorText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  explorerButton: {
    marginVertical: 16,
  },
  explorerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  hashRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  icon: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  retryButton: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    padding: 16,
    paddingBottom: 32,
  },
  scrollView: {
    flex: 1,
  },
  statusIcon: {
    alignItems: 'center',
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    marginBottom: 16,
    width: 80,
  },
  statusSection: {
    alignItems: 'center',
    marginVertical: 32,
  },
  statusText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default TransactionStatusScreen;
