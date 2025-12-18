/**
 * TransactionRequestModal
 * Enhanced transaction request modal with simulation and warnings
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { TransactionRequest } from '../../types/dapp';
import { getProviderManager } from '../../services/blockchain/ProviderManager';
import { ethers } from 'ethers';
import i18n from '../../i18n';

// Common ERC-20 function signatures
const ERC20_SIGNATURES = {
  TRANSFER: '0xa9059cbb', // transfer(address,uint256)
  APPROVE: '0x095ea7b3', // approve(address,uint256)
  TRANSFER_FROM: '0x23b872dd', // transferFrom(address,address,uint256)
};

// Common contract interaction patterns
const CONTRACT_PATTERNS = {
  SWAP: ['swap', 'exchange'],
  APPROVE: ['approve', 'setApprovalForAll'],
  MINT: ['mint', 'safeMint'],
  STAKE: ['stake', 'deposit'],
  UNSTAKE: ['unstake', 'withdraw'],
};

export interface TransactionSimulation {
  success: boolean;
  gasEstimate?: bigint;
  errorMessage?: string;
  warnings: string[];
  isTokenApproval?: boolean;
  approvalDetails?: {
    token: string;
    spender: string;
    amount: string;
    isUnlimited: boolean;
  };
  isContractInteraction: boolean;
  methodName?: string;
}

interface TransactionRequestModalProps {
  visible: boolean;
  transaction: TransactionRequest | null;
  dappName: string;
  dappIcon?: string;
  onApprove: () => void;
  onReject: () => void;
}

export const TransactionRequestModal: React.FC<TransactionRequestModalProps> = ({
  visible,
  transaction,
  dappName,
  dappIcon,
  onApprove,
  onReject,
}) => {
  const { theme } = useTheme();
  const [simulation, setSimulation] = useState<TransactionSimulation | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [gasPrice, setGasPrice] = useState<string>('');

  // Simulate transaction
  const simulateTransaction = useCallback(async (tx: TransactionRequest) => {
    setIsSimulating(true);
    const warnings: string[] = [];

    try {
      const provider = getProviderManager().getCurrentProvider().getProvider();

      // Check if it's a contract interaction
      const isContractInteraction = tx.data && tx.data !== '0x';
      let methodName: string | undefined;
      let isTokenApproval = false;
      let approvalDetails: TransactionSimulation['approvalDetails'];

      if (isContractInteraction && tx.data) {
        const functionSelector = tx.data.slice(0, 10);

        // Check for token approval
        if (functionSelector === ERC20_SIGNATURES.APPROVE) {
          isTokenApproval = true;
          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
            ['address', 'uint256'],
            '0x' + tx.data.slice(10)
          );
          const spender = decoded[0] as string;
          const amount = decoded[1] as bigint;
          const isUnlimited = amount === ethers.MaxUint256;

          approvalDetails = {
            token: tx.to || '',
            spender,
            amount: isUnlimited ? 'Unlimited' : ethers.formatUnits(amount, 18),
            isUnlimited,
          };

          if (isUnlimited) {
            warnings.push(i18n.t('walletConnectRequest.warnings.unlimitedApproval'));
          }
          methodName = 'Token Approval';
        } else if (functionSelector === ERC20_SIGNATURES.TRANSFER) {
          methodName = 'Token Transfer';
        } else if (functionSelector === ERC20_SIGNATURES.TRANSFER_FROM) {
          methodName = 'Transfer From';
        }
      }

      // Estimate gas
      let gasEstimate: bigint | undefined;
      try {
        gasEstimate = await provider.estimateGas({
          from: tx.from,
          to: tx.to,
          data: tx.data,
          value: tx.value ? BigInt(tx.value) : undefined,
        });
      } catch (error: any) {
        warnings.push(i18n.t('walletConnectRequest.warnings.gasEstimateFailed'));
        console.error('Gas estimation failed:', error);
      }

      // Get gas price
      const feeData = await provider.getFeeData();
      if (feeData.gasPrice) {
        setGasPrice(ethers.formatUnits(feeData.gasPrice, 'gwei'));
      }

      // Check for high value transactions
      if (tx.value) {
        const value = BigInt(tx.value);
        const ethValue = Number(ethers.formatEther(value));
        if (ethValue > 0.1) {
          warnings.push(
            i18n.t('walletConnectRequest.warnings.highValue', { value: ethValue.toFixed(4) })
          );
        }
      }

      // Check if sending to a new contract
      if (tx.to) {
        const code = await provider.getCode(tx.to);
        if (code !== '0x' && !isTokenApproval) {
          warnings.push(i18n.t('walletConnectRequest.warnings.contractInteraction'));
        }
      }

      setSimulation({
        success: true,
        gasEstimate,
        warnings,
        isTokenApproval,
        approvalDetails,
        isContractInteraction: !!isContractInteraction,
        methodName,
      });
    } catch (error: any) {
      setSimulation({
        success: false,
        errorMessage: error.message || 'Transaction simulation failed',
        warnings,
        isContractInteraction: !!(tx.data && tx.data !== '0x'),
      });
    } finally {
      setIsSimulating(false);
    }
  }, []);

  // Run simulation when transaction changes
  useEffect(() => {
    if (visible && transaction) {
      simulateTransaction(transaction);
    } else {
      setSimulation(null);
    }
  }, [visible, transaction, simulateTransaction]);

  if (!transaction) return null;

  const value = transaction.value ? ethers.formatEther(transaction.value) : '0';
  const hasWarnings = simulation && simulation.warnings.length > 0;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <ScrollView contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                {i18n.t('walletConnectRequest.transactionRequest')}
              </Text>
              <Text style={[styles.dappName, { color: theme.colors.text.secondary }]}>
                {dappName}
              </Text>
            </View>

            {/* Method Type */}
            {simulation?.methodName && (
              <View style={[styles.methodBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                <Text style={[styles.methodText, { color: theme.colors.primary }]}>
                  {simulation.methodName}
                </Text>
              </View>
            )}

            {/* Simulation Status */}
            {isSimulating && (
              <View style={styles.simulationStatus}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={[styles.simulatingText, { color: theme.colors.text.secondary }]}>
                  {i18n.t('walletConnectRequest.simulating')}
                </Text>
              </View>
            )}

            {/* Warnings */}
            {hasWarnings && (
              <View style={[styles.warningsContainer, { backgroundColor: '#FFF3CD' }]}>
                <Text style={styles.warningsTitle}>
                  {i18n.t('walletConnectRequest.warnings.title')}
                </Text>
                {simulation.warnings.map((warning, index) => (
                  <Text key={index} style={styles.warningText}>
                    {warning}
                  </Text>
                ))}
              </View>
            )}

            {/* Token Approval Details */}
            {simulation?.approvalDetails && (
              <View style={[styles.approvalContainer, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                  {i18n.t('walletConnectRequest.approvalDetails')}
                </Text>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                    {i18n.t('walletConnectRequest.spender')}
                  </Text>
                  <Text
                    style={[styles.detailValue, { color: theme.colors.text.primary }]}
                    numberOfLines={1}
                  >
                    {simulation.approvalDetails.spender.slice(0, 8)}...
                    {simulation.approvalDetails.spender.slice(-6)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                    {i18n.t('walletConnectRequest.amount')}
                  </Text>
                  <Text
                    style={[
                      styles.detailValue,
                      {
                        color: simulation.approvalDetails.isUnlimited
                          ? theme.colors.error
                          : theme.colors.text.primary,
                      },
                    ]}
                  >
                    {simulation.approvalDetails.amount}
                  </Text>
                </View>
              </View>
            )}

            {/* Transaction Details */}
            <View style={[styles.detailsContainer, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                {i18n.t('walletConnectRequest.transactionDetails')}
              </Text>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                  {i18n.t('send.to')}
                </Text>
                <Text
                  style={[styles.detailValue, { color: theme.colors.text.primary }]}
                  numberOfLines={1}
                >
                  {transaction.to
                    ? `${transaction.to.slice(0, 8)}...${transaction.to.slice(-6)}`
                    : 'Contract Creation'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                  {i18n.t('send.amount')}
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                  {value} ETH
                </Text>
              </View>

              {simulation?.gasEstimate && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                    {i18n.t('walletConnectRequest.estimatedGas')}
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                    {simulation.gasEstimate.toString()}
                  </Text>
                </View>
              )}

              {gasPrice && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                    {i18n.t('walletConnectRequest.gasPrice')}
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                    {parseFloat(gasPrice).toFixed(2)} Gwei
                  </Text>
                </View>
              )}

              {transaction.data && transaction.data !== '0x' && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                    {i18n.t('walletConnectRequest.data')}
                  </Text>
                  <Text
                    style={[styles.detailValue, { color: theme.colors.text.primary }]}
                    numberOfLines={1}
                  >
                    {transaction.data.slice(0, 20)}...
                  </Text>
                </View>
              )}
            </View>

            {/* Simulation Error */}
            {simulation && !simulation.success && simulation.errorMessage && (
              <View style={[styles.errorContainer, { backgroundColor: theme.colors.error + '20' }]}>
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {simulation.errorMessage}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.rejectButton, { borderColor: theme.colors.error }]}
              onPress={onReject}
              accessibilityRole="button"
              accessibilityLabel={i18n.t('common.cancel')}
            >
              <Text style={[styles.rejectButtonText, { color: theme.colors.error }]}>
                {i18n.t('common.cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.approveButton, { backgroundColor: theme.colors.primary }]}
              onPress={onApprove}
              accessibilityRole="button"
              accessibilityLabel={i18n.t('common.confirm')}
            >
              <Text style={styles.approveButtonText}>{i18n.t('common.confirm')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  approvalContainer: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  approveButton: {
    borderRadius: 12,
    flex: 1,
    marginLeft: 8,
    paddingVertical: 14,
  },
  approveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flex: 1,
    marginTop: 100,
  },
  content: {
    padding: 24,
  },
  dappName: {
    fontSize: 14,
    marginTop: 4,
  },
  detailLabel: {
    flex: 1,
    fontSize: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  detailValue: {
    flex: 2,
    fontSize: 14,
    textAlign: 'right',
  },
  detailsContainer: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  errorContainer: {
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    fontSize: 14,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  methodBadge: {
    alignSelf: 'center',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  methodText: {
    fontSize: 14,
    fontWeight: '600',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
  },
  rejectButton: {
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    marginRight: 8,
    paddingVertical: 14,
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  simulatingText: {
    fontSize: 14,
    marginLeft: 8,
  },
  simulationStatus: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  warningText: {
    color: '#856404',
    fontSize: 14,
    marginTop: 4,
  },
  warningsContainer: {
    borderRadius: 8,
    marginBottom: 16,
    padding: 12,
  },
  warningsTitle: {
    color: '#856404',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TransactionRequestModal;
