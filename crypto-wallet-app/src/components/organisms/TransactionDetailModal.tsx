/**
 * TransactionDetailModal
 * Modal showing detailed transaction information
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  Linking,
  Clipboard,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

type TransactionType = 'sent' | 'received';
type TransactionStatus = 'pending' | 'confirmed' | 'failed';

interface Transaction {
  id: string;
  type: TransactionType;
  amount: string;
  token: string;
  address: string;
  hash: string;
  status: TransactionStatus;
  timestamp: number;
  fee?: string;
  blockNumber?: number;
  nonce?: number;
}

interface TransactionDetailModalProps {
  visible: boolean;
  transaction: Transaction;
  onClose: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  visible,
  transaction,
  onClose,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  if (!visible) {
    return null;
  }

  // Format address/hash
  const formatHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Get status color
  const getStatusColor = () => {
    switch (transaction.status) {
      case 'confirmed':
        return colors.success;
      case 'failed':
        return colors.error;
      default:
        return colors.warning;
    }
  };

  // Handle copy hash
  const handleCopyHash = () => {
    Clipboard.setString(transaction.hash);
  };

  // Handle view on explorer
  const handleViewExplorer = () => {
    const url = `https://etherscan.io/tx/${transaction.hash}`;
    Linking.openURL(url);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[styles.modalContent, { backgroundColor: colors.background }]}
            >
              {/* Header */}
              <View style={[styles.header, { borderBottomColor: colors.divider }]}>
                <Text style={[styles.title, { color: colors.text.primary }]}>
                  Transaction Details
                </Text>
                <TouchableOpacity
                  testID="close-button"
                  onPress={onClose}
                  style={styles.closeButton}
                  accessibilityLabel="Close"
                >
                  <Text style={[styles.closeText, { color: colors.text.secondary }]}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.content}>
                {/* Type and Amount */}
                <View style={styles.amountSection}>
                  <Text style={[styles.typeText, { color: colors.text.secondary }]}>
                    {transaction.type === 'sent' ? 'Sent' : 'Received'}
                  </Text>
                  <Text
                    style={[
                      styles.amountText,
                      {
                        color:
                          transaction.type === 'sent'
                            ? colors.error
                            : colors.success,
                      },
                    ]}
                  >
                    {transaction.type === 'sent' ? '-' : '+'}
                    {transaction.amount} {transaction.token}
                  </Text>
                </View>

                {/* Status */}
                <View style={[styles.row, { borderBottomColor: colors.divider }]}>
                  <Text style={[styles.label, { color: colors.text.secondary }]}>
                    Status
                  </Text>
                  <Text style={[styles.value, { color: getStatusColor() }]}>
                    {transaction.status.charAt(0).toUpperCase() +
                      transaction.status.slice(1)}
                  </Text>
                </View>

                {/* Address */}
                <View style={[styles.row, { borderBottomColor: colors.divider }]}>
                  <Text style={[styles.label, { color: colors.text.secondary }]}>
                    {transaction.type === 'sent' ? 'To' : 'From'}
                  </Text>
                  <Text style={[styles.value, { color: colors.text.primary }]}>
                    {formatHash(transaction.address)}
                  </Text>
                </View>

                {/* Transaction Hash */}
                <View style={[styles.row, { borderBottomColor: colors.divider }]}>
                  <Text style={[styles.label, { color: colors.text.secondary }]}>
                    Transaction Hash
                  </Text>
                  <View style={styles.hashRow}>
                    <Text style={[styles.value, { color: colors.text.primary }]}>
                      {formatHash(transaction.hash)}
                    </Text>
                    <TouchableOpacity
                      testID="copy-hash"
                      onPress={handleCopyHash}
                      style={styles.copyButton}
                    >
                      <Text style={[styles.copyText, { color: colors.primary }]}>
                        Copy
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Timestamp */}
                <View style={[styles.row, { borderBottomColor: colors.divider }]}>
                  <Text style={[styles.label, { color: colors.text.secondary }]}>
                    Time
                  </Text>
                  <Text
                    testID="timestamp"
                    style={[styles.value, { color: colors.text.primary }]}
                  >
                    {formatTimestamp(transaction.timestamp)}
                  </Text>
                </View>

                {/* Network Fee */}
                {transaction.fee && (
                  <View style={[styles.row, { borderBottomColor: colors.divider }]}>
                    <Text style={[styles.label, { color: colors.text.secondary }]}>
                      Network Fee
                    </Text>
                    <Text style={[styles.value, { color: colors.text.primary }]}>
                      {transaction.fee} {transaction.token}
                    </Text>
                  </View>
                )}

                {/* Block Number */}
                {transaction.blockNumber && (
                  <View style={[styles.row, { borderBottomColor: colors.divider }]}>
                    <Text style={[styles.label, { color: colors.text.secondary }]}>
                      Block
                    </Text>
                    <Text style={[styles.value, { color: colors.text.primary }]}>
                      {transaction.blockNumber}
                    </Text>
                  </View>
                )}

                {/* Nonce */}
                {transaction.nonce !== undefined && (
                  <View style={[styles.row, { borderBottomColor: colors.divider }]}>
                    <Text style={[styles.label, { color: colors.text.secondary }]}>
                      Nonce
                    </Text>
                    <Text style={[styles.value, { color: colors.text.primary }]}>
                      {transaction.nonce}
                    </Text>
                  </View>
                )}

                {/* View on Explorer */}
                <TouchableOpacity
                  style={[styles.explorerButton, { backgroundColor: colors.primary }]}
                  onPress={handleViewExplorer}
                >
                  <Text style={styles.explorerText}>View on Explorer</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 20,
  },
  content: {
    padding: 16,
  },
  amountSection: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 16,
  },
  typeText: {
    fontSize: 14,
    marginBottom: 8,
  },
  amountText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
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
    marginTop: 24,
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  explorerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TransactionDetailModal;
