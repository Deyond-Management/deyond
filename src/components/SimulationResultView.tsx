/**
 * SimulationResultView
 * Component for displaying transaction simulation results
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import {
  SimulationResult,
  SimulationRiskLevel,
  TokenTransfer,
  ApprovalChange,
  SimulationWarning,
  BalanceChange,
} from '../services/simulation/types';
import i18n from '../i18n';

const t = (key: string, params?: Record<string, any>): string => i18n.t(key, params) as string;

interface SimulationResultViewProps {
  simulation: SimulationResult | null;
  isLoading: boolean;
  onRetry?: () => void;
  compact?: boolean;
}

export const SimulationResultView: React.FC<SimulationResultViewProps> = ({
  simulation,
  isLoading,
  onRetry,
  compact = false,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme, compact);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('simulation.simulating')}</Text>
      </View>
    );
  }

  if (!simulation) {
    return null;
  }

  const getRiskColor = (level: SimulationRiskLevel) => {
    switch (level) {
      case 'critical':
        return '#FF3B30';
      case 'high':
        return '#FF9500';
      case 'medium':
        return '#FFCC00';
      case 'low':
        return '#34C759';
      case 'safe':
        return '#34C759';
      default:
        return theme.colors.textSecondary;
    }
  };

  const getRiskLabel = (level: SimulationRiskLevel) => {
    switch (level) {
      case 'critical':
        return t('simulation.riskCritical');
      case 'high':
        return t('simulation.riskHigh');
      case 'medium':
        return t('simulation.riskMedium');
      case 'low':
        return t('simulation.riskLow');
      case 'safe':
        return t('simulation.riskSafe');
      default:
        return level;
    }
  };

  const renderWarnings = () => {
    if (simulation.warnings.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('simulation.warnings')}</Text>
        {simulation.warnings.map((warning, index) => (
          <View
            key={index}
            style={[styles.warningCard, { borderLeftColor: getRiskColor(warning.severity) }]}
          >
            <Text style={styles.warningMessage}>{warning.message}</Text>
            {warning.details && <Text style={styles.warningDetails}>{warning.details}</Text>}
          </View>
        ))}
      </View>
    );
  };

  const renderTokenTransfers = () => {
    if (simulation.tokenTransfers.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('simulation.tokenTransfers')}</Text>
        {simulation.tokenTransfers.map((transfer, index) => (
          <View key={index} style={styles.transferCard}>
            <View style={styles.transferIcon}>
              <Text style={styles.transferIconText}>
                {transfer.type === 'transfer_in' ? '↓' : '↑'}
              </Text>
            </View>
            <View style={styles.transferDetails}>
              <Text style={styles.transferAmount}>
                {transfer.type === 'transfer_in' ? '+' : '-'}
                {transfer.amountFormatted}
              </Text>
              <Text style={styles.transferAddress}>
                {transfer.type === 'transfer_in' ? 'From: ' : 'To: '}
                {(transfer.type === 'transfer_in' ? transfer.from : transfer.to).slice(0, 10)}
                ...
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderApprovalChanges = () => {
    if (simulation.approvalChanges.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('simulation.approvalChanges')}</Text>
        {simulation.approvalChanges.map((approval, index) => (
          <View key={index} style={styles.approvalCard}>
            <View style={styles.approvalHeader}>
              <Text style={styles.approvalToken}>{approval.tokenSymbol}</Text>
              {approval.isUnlimited && (
                <View style={styles.unlimitedBadge}>
                  <Text style={styles.unlimitedBadgeText}>{t('simulation.unlimited')}</Text>
                </View>
              )}
            </View>
            <Text style={styles.approvalSpender}>
              {t('simulation.spender')}: {approval.spenderName || approval.spender.slice(0, 10)}...
            </Text>
            <Text style={styles.approvalAllowance}>
              {t('simulation.newAllowance')}: {approval.newAllowance}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderGasEstimation = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('simulation.gasEstimation')}</Text>
        <View style={styles.gasCard}>
          <View style={styles.gasRow}>
            <Text style={styles.gasLabel}>{t('simulation.gasLimit')}</Text>
            <Text style={styles.gasValue}>{simulation.gasEstimation.gasLimit}</Text>
          </View>
          <View style={styles.gasRow}>
            <Text style={styles.gasLabel}>{t('simulation.estimatedCost')}</Text>
            <Text style={styles.gasValue}>
              {simulation.gasEstimation.estimatedCost} ETH
              {simulation.gasEstimation.estimatedCostUSD &&
                ` (${simulation.gasEstimation.estimatedCostUSD})`}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Status Header */}
      <View
        style={[
          styles.statusHeader,
          {
            backgroundColor: simulation.success
              ? getRiskColor(simulation.riskLevel) + '20'
              : '#FF3B3020',
          },
        ]}
      >
        <View style={styles.statusIcon}>
          <Text style={styles.statusIconText}>{simulation.success ? '✓' : '✕'}</Text>
        </View>
        <View style={styles.statusInfo}>
          <Text
            style={[
              styles.statusTitle,
              { color: simulation.success ? getRiskColor(simulation.riskLevel) : '#FF3B30' },
            ]}
          >
            {simulation.success
              ? t('simulation.simulationSuccess')
              : t('simulation.simulationFailed')}
          </Text>
          {simulation.success ? (
            <Text style={styles.statusSubtitle}>
              {t('simulation.riskLevel')}: {getRiskLabel(simulation.riskLevel)}
            </Text>
          ) : (
            <Text style={styles.errorMessage}>
              {simulation.revertReason || simulation.errorMessage}
            </Text>
          )}
        </View>
      </View>

      {/* Warnings */}
      {renderWarnings()}

      {/* Token Transfers */}
      {renderTokenTransfers()}

      {/* Approval Changes */}
      {renderApprovalChanges()}

      {/* Gas Estimation */}
      {renderGasEstimation()}

      {/* Contract Info */}
      {simulation.contractInteraction && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('simulation.contractInfo')}</Text>
          <View style={styles.contractCard}>
            <Text style={styles.contractMethod}>
              {simulation.contractInteraction.method || t('simulation.unknownMethod')}
            </Text>
            <Text style={styles.contractAddress}>
              {simulation.contractInteraction.address.slice(0, 20)}...
            </Text>
            {simulation.contractInteraction.isVerified && (
              <Text style={styles.verifiedBadge}>✓ {t('simulation.verified')}</Text>
            )}
          </View>
        </View>
      )}

      {/* Retry Button */}
      {!simulation.success && onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>{t('simulation.retry')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const createStyles = (theme: any, compact: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: compact ? 12 : 16,
    },
    loadingContainer: {
      padding: 40,
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    statusHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
    },
    statusIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    statusIconText: {
      fontSize: 20,
    },
    statusInfo: {
      flex: 1,
    },
    statusTitle: {
      fontSize: 16,
      fontWeight: '600',
    },
    statusSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    errorMessage: {
      fontSize: 14,
      color: '#FF3B30',
      marginTop: 2,
    },
    section: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    warningCard: {
      backgroundColor: theme.colors.background,
      borderLeftWidth: 4,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
    },
    warningMessage: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    warningDetails: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    transferCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
    },
    transferIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    transferIconText: {
      fontSize: 16,
      color: theme.colors.primary,
    },
    transferDetails: {
      flex: 1,
    },
    transferAmount: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    transferAddress: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    approvalCard: {
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
    },
    approvalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    approvalToken: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    unlimitedBadge: {
      backgroundColor: '#FF950020',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 8,
    },
    unlimitedBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FF9500',
    },
    approvalSpender: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    approvalAllowance: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    gasCard: {
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      padding: 12,
    },
    gasRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    gasLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    gasValue: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    contractCard: {
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      padding: 12,
    },
    contractMethod: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    contractAddress: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    verifiedBadge: {
      fontSize: 12,
      color: '#34C759',
      marginTop: 4,
    },
    retryButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      padding: 14,
      alignItems: 'center',
      marginTop: 8,
    },
    retryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });

export default SimulationResultView;
