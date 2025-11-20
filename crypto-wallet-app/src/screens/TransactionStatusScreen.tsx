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
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Clipboard,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/atoms/Card';

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
        return 'Confirmed';
      case 'failed':
        return 'Failed';
      default:
        return 'Pending';
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
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status Indicator */}
        <View style={styles.statusSection}>
          <View
            testID="status-indicator"
            style={[
              styles.statusIcon,
              { backgroundColor: getStatusColor() + '20' },
            ]}
          >
            {status === 'pending' && (
              <ActivityIndicator size="large" color={getStatusColor()} />
            )}
            {status === 'confirmed' && (
              <Text testID="success-icon" style={[styles.icon, { color: getStatusColor() }]}>
                ✓
              </Text>
            )}
            {status === 'failed' && (
              <Text testID="error-icon" style={[styles.icon, { color: getStatusColor() }]}>
                ✕
              </Text>
            )}
          </View>

          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>

          {error && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
          )}
        </View>

        {/* Transaction Amount */}
        <Card style={styles.card} elevation={1}>
          <View style={styles.amountSection}>
            <Text style={[styles.amountLabel, { color: theme.colors.text.secondary }]}>
              Amount Sent
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
              To
            </Text>
            <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
              {formatAddress(to)}
            </Text>
          </View>

          <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: theme.colors.divider, paddingTop: 12, marginTop: 12 }]}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
              Transaction Hash
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
                  Copy
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* View on Explorer */}
        <TouchableOpacity
          style={styles.explorerButton}
          onPress={handleViewExplorer}
        >
          <Text style={[styles.explorerText, { color: theme.colors.primary }]}>
            View on Explorer
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
              Retry
            </Button>
          )}
          <Button
            onPress={handleDone}
            variant="primary"
            size="large"
            style={status === 'failed' ? styles.doneButtonHalf : styles.doneButton}
            accessibilityLabel="Done"
          >
            Done
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
    alignItems: 'center',
  },
  statusSection: {
    alignItems: 'center',
    marginVertical: 32,
  },
  statusIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    width: '100%',
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
    fontSize: 28,
    fontWeight: 'bold',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  hashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  copyButton: {
    padding: 4,
  },
  copyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  explorerButton: {
    marginVertical: 16,
  },
  explorerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 16,
    gap: 12,
  },
  retryButton: {
    flex: 1,
  },
  doneButton: {
    flex: 1,
  },
  doneButtonHalf: {
    flex: 1,
  },
});

export default TransactionStatusScreen;
