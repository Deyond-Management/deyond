/**
 * TokenApprovalScreen
 * Screen for managing token approvals
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import i18n from '../i18n';
import { useTheme } from '../contexts/ThemeContext';
import { AppDispatch } from '../store';
import {
  loadMockApprovals,
  revokeApproval,
  setSelectedApproval,
  selectActiveApprovals,
  selectApprovalStats,
  selectApprovalLoading,
  selectApprovalRevoking,
  selectApprovalError,
  selectLastScanned,
  selectSelectedApproval,
} from '../store/slices/tokenApprovalSlice';
import { TokenApproval, ApprovalRiskLevel } from '../services/approval/types';

const t = (key: string, params?: Record<string, any>): string => i18n.t(key, params) as string;

export const TokenApprovalScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();

  const approvals = useSelector(selectActiveApprovals);
  const stats = useSelector(selectApprovalStats);
  const isLoading = useSelector(selectApprovalLoading);
  const isRevoking = useSelector(selectApprovalRevoking);
  const error = useSelector(selectApprovalError);
  const lastScanned = useSelector(selectLastScanned);
  const selectedApproval = useSelector(selectSelectedApproval);

  const [showDetails, setShowDetails] = useState(false);
  const [filter, setFilter] = useState<'all' | 'high_risk' | 'unlimited'>('all');

  useEffect(() => {
    // Load mock approvals for demo
    dispatch(loadMockApprovals());
  }, [dispatch]);

  const handleRefresh = useCallback(() => {
    dispatch(loadMockApprovals());
  }, [dispatch]);

  const handleApprovalPress = (approval: TokenApproval) => {
    dispatch(setSelectedApproval(approval));
    setShowDetails(true);
  };

  const handleRevoke = (approval: TokenApproval) => {
    Alert.alert(
      t('tokenApproval.revokeTitle'),
      t('tokenApproval.revokeConfirm', {
        token: approval.tokenSymbol,
        spender: approval.spenderName,
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('tokenApproval.revoke'),
          style: 'destructive',
          onPress: () => {
            // In production, this would use the actual signer
            Alert.alert(t('common.success'), t('tokenApproval.revokeSuccess'));
          },
        },
      ]
    );
  };

  const getFilteredApprovals = () => {
    switch (filter) {
      case 'high_risk':
        return approvals.filter(a => a.riskLevel === 'high' || a.riskLevel === 'critical');
      case 'unlimited':
        return approvals.filter(a => a.isUnlimited);
      default:
        return approvals;
    }
  };

  const getRiskColor = (level: ApprovalRiskLevel) => {
    switch (level) {
      case 'critical':
        return '#FF3B30';
      case 'high':
        return '#FF9500';
      case 'medium':
        return '#FFCC00';
      case 'low':
        return '#34C759';
      default:
        return theme.colors.textSecondary;
    }
  };

  const getRiskLabel = (level: ApprovalRiskLevel) => {
    switch (level) {
      case 'critical':
        return t('tokenApproval.riskCritical');
      case 'high':
        return t('tokenApproval.riskHigh');
      case 'medium':
        return t('tokenApproval.riskMedium');
      case 'low':
        return t('tokenApproval.riskLow');
      default:
        return level;
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleDateString();
  };

  const styles = createStyles(theme);
  const filteredApprovals = getFilteredApprovals();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('tokenApproval.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.activeApprovals}</Text>
            <Text style={styles.statLabel}>{t('tokenApproval.active')}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardWarning]}>
            <Text style={styles.statValue}>{stats.highRiskApprovals}</Text>
            <Text style={styles.statLabel}>{t('tokenApproval.highRisk')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.unlimitedApprovals}</Text>
            <Text style={styles.statLabel}>{t('tokenApproval.unlimited')}</Text>
          </View>
        </View>

        {/* Info Banner */}
        {stats.highRiskApprovals > 0 && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              {t('tokenApproval.highRiskWarning', {
                count: stats.highRiskApprovals,
              })}
            </Text>
          </View>
        )}

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
              {t('tokenApproval.filterAll')} ({approvals.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'high_risk' && styles.filterTabActive]}
            onPress={() => setFilter('high_risk')}
          >
            <Text
              style={[styles.filterTabText, filter === 'high_risk' && styles.filterTabTextActive]}
            >
              {t('tokenApproval.filterHighRisk')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'unlimited' && styles.filterTabActive]}
            onPress={() => setFilter('unlimited')}
          >
            <Text
              style={[styles.filterTabText, filter === 'unlimited' && styles.filterTabTextActive]}
            >
              {t('tokenApproval.filterUnlimited')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Approvals List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>{t('tokenApproval.scanning')}</Text>
          </View>
        ) : filteredApprovals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>✓</Text>
            <Text style={styles.emptyTitle}>{t('tokenApproval.noApprovals')}</Text>
            <Text style={styles.emptyMessage}>{t('tokenApproval.noApprovalsMessage')}</Text>
          </View>
        ) : (
          <View style={styles.approvalsList}>
            {filteredApprovals.map(approval => (
              <TouchableOpacity
                key={approval.id}
                style={styles.approvalCard}
                onPress={() => handleApprovalPress(approval)}
              >
                {/* Risk Badge */}
                <View
                  style={[
                    styles.riskBadge,
                    { backgroundColor: getRiskColor(approval.riskLevel) + '20' },
                  ]}
                >
                  <Text style={[styles.riskBadgeText, { color: getRiskColor(approval.riskLevel) }]}>
                    {getRiskLabel(approval.riskLevel)}
                  </Text>
                </View>

                {/* Token Info */}
                <View style={styles.approvalHeader}>
                  <View style={styles.tokenInfo}>
                    <View style={styles.tokenIcon}>
                      <Text style={styles.tokenIconText}>{approval.tokenSymbol.charAt(0)}</Text>
                    </View>
                    <View>
                      <Text style={styles.tokenSymbol}>{approval.tokenSymbol}</Text>
                      <Text style={styles.tokenName}>{approval.tokenName}</Text>
                    </View>
                  </View>
                  <View style={styles.allowanceInfo}>
                    <Text
                      style={[styles.allowanceValue, approval.isUnlimited && styles.unlimitedText]}
                    >
                      {approval.allowanceFormatted}
                    </Text>
                    {approval.isUnlimited && <Text style={styles.unlimitedBadge}>∞</Text>}
                  </View>
                </View>

                {/* Spender Info */}
                <View style={styles.spenderInfo}>
                  <Text style={styles.spenderLabel}>{t('tokenApproval.spender')}:</Text>
                  <Text style={styles.spenderName}>{approval.spenderName}</Text>
                </View>

                {/* Approved Date */}
                <View style={styles.dateInfo}>
                  <Text style={styles.dateLabel}>{t('tokenApproval.approvedAt')}:</Text>
                  <Text style={styles.dateValue}>{formatDate(approval.approvedAt)}</Text>
                </View>

                {/* Risk Reasons */}
                {approval.riskReasons.length > 0 && (
                  <View style={styles.riskReasons}>
                    {approval.riskReasons.map((reason, index) => (
                      <Text key={index} style={styles.riskReason}>
                        • {reason}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Actions */}
                <View style={styles.approvalActions}>
                  <TouchableOpacity
                    style={styles.detailsButton}
                    onPress={() => handleApprovalPress(approval)}
                  >
                    <Text style={styles.detailsButtonText}>{t('tokenApproval.viewDetails')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.revokeButton}
                    onPress={() => handleRevoke(approval)}
                  >
                    <Text style={styles.revokeButtonText}>{t('tokenApproval.revoke')}</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Last Scanned Info */}
        {lastScanned && (
          <View style={styles.lastScanned}>
            <Text style={styles.lastScannedText}>
              {t('tokenApproval.lastScanned')}: {new Date(lastScanned).toLocaleString()}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: 8,
    },
    backButtonText: {
      fontSize: 24,
      color: theme.colors.text,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    placeholder: {
      width: 40,
    },
    content: {
      flex: 1,
    },
    statsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 16,
      gap: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    statCardWarning: {
      backgroundColor: '#FF950020',
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.text,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    warningBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FF950020',
      marginHorizontal: 16,
      marginBottom: 16,
      padding: 12,
      borderRadius: 8,
    },
    warningIcon: {
      fontSize: 20,
      marginRight: 8,
    },
    warningText: {
      flex: 1,
      fontSize: 14,
      color: '#FF9500',
    },
    filterTabs: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      marginBottom: 16,
      gap: 8,
    },
    filterTab: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
    },
    filterTabActive: {
      backgroundColor: theme.colors.primary,
    },
    filterTabText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    filterTabTextActive: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    loadingContainer: {
      padding: 60,
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    emptyContainer: {
      padding: 60,
      alignItems: 'center',
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    emptyMessage: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    approvalsList: {
      paddingHorizontal: 16,
    },
    approvalCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
    },
    riskBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginBottom: 12,
    },
    riskBadgeText: {
      fontSize: 12,
      fontWeight: '600',
    },
    approvalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    tokenInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    tokenIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    tokenIconText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    tokenSymbol: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    tokenName: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    allowanceInfo: {
      alignItems: 'flex-end',
    },
    allowanceValue: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    unlimitedText: {
      color: '#FF9500',
    },
    unlimitedBadge: {
      fontSize: 20,
      color: '#FF9500',
    },
    spenderInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    spenderLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginRight: 8,
    },
    spenderName: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '500',
    },
    dateInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    dateLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginRight: 8,
    },
    dateValue: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    riskReasons: {
      backgroundColor: theme.colors.background,
      padding: 10,
      borderRadius: 8,
      marginBottom: 12,
    },
    riskReason: {
      fontSize: 12,
      color: '#FF9500',
      marginBottom: 2,
    },
    approvalActions: {
      flexDirection: 'row',
      gap: 12,
    },
    detailsButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
    },
    detailsButtonText: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '500',
    },
    revokeButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      backgroundColor: '#FF3B3020',
      alignItems: 'center',
    },
    revokeButtonText: {
      fontSize: 14,
      color: '#FF3B30',
      fontWeight: '600',
    },
    lastScanned: {
      padding: 16,
      alignItems: 'center',
    },
    lastScannedText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
  });

export default TokenApprovalScreen;
