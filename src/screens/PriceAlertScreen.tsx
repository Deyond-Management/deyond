/**
 * PriceAlertScreen
 * Screen for managing price alerts
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  selectPriceAlerts,
  selectPriceAlertLoading,
  createPriceAlert,
  deletePriceAlert,
  togglePriceAlert,
  checkPriceAlerts,
  startPriceMonitoring,
} from '../store/slices/priceAlertSlice';
import { PriceAlert, AlertCondition, CreateAlertParams } from '../services/price/types';
import i18n from '../i18n';

interface PriceAlertScreenProps {
  navigation: any;
}

// Common tokens for quick selection
const POPULAR_TOKENS = [
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'USDC', name: 'USD Coin' },
  { symbol: 'MATIC', name: 'Polygon' },
  { symbol: 'ARB', name: 'Arbitrum' },
  { symbol: 'OP', name: 'Optimism' },
];

export const PriceAlertScreen: React.FC<PriceAlertScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();

  const alerts = useAppSelector(selectPriceAlerts);
  const isLoading = useAppSelector(selectPriceAlertLoading);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState('ETH');
  const [condition, setCondition] = useState<AlertCondition>('above');
  const [targetPrice, setTargetPrice] = useState('');
  const [changePercent, setChangePercent] = useState('5');
  const [changeDirection, setChangeDirection] = useState<'up' | 'down' | 'any'>('any');
  const [timeframe, setTimeframe] = useState<'1h' | '24h' | '7d'>('24h');
  const [repeating, setRepeating] = useState(false);

  // Start monitoring on mount
  useEffect(() => {
    dispatch(startPriceMonitoring());
  }, [dispatch]);

  // Handle create alert
  const handleCreateAlert = useCallback(async () => {
    const params: CreateAlertParams = {
      tokenSymbol: selectedToken,
      chainId: 1, // Ethereum mainnet
      condition,
      repeating,
    };

    if (condition === 'above' || condition === 'below') {
      const price = parseFloat(targetPrice);
      if (isNaN(price) || price <= 0) {
        Alert.alert(i18n.t('priceAlert.error'), i18n.t('priceAlert.invalidPrice'));
        return;
      }
      params.targetPrice = price;
    } else if (condition === 'change_percent') {
      const percent = parseFloat(changePercent);
      if (isNaN(percent) || percent <= 0) {
        Alert.alert(i18n.t('priceAlert.error'), i18n.t('priceAlert.invalidPercent'));
        return;
      }
      params.changePercent = percent;
      params.changeDirection = changeDirection;
      params.timeframe = timeframe;
    }

    await dispatch(createPriceAlert(params));
    setShowCreateModal(false);
    resetForm();
  }, [
    dispatch,
    selectedToken,
    condition,
    targetPrice,
    changePercent,
    changeDirection,
    timeframe,
    repeating,
  ]);

  // Reset form
  const resetForm = () => {
    setSelectedToken('ETH');
    setCondition('above');
    setTargetPrice('');
    setChangePercent('5');
    setChangeDirection('any');
    setTimeframe('24h');
    setRepeating(false);
  };

  // Handle delete alert
  const handleDeleteAlert = useCallback(
    (alert: PriceAlert) => {
      Alert.alert(i18n.t('priceAlert.deleteTitle'), i18n.t('priceAlert.deleteConfirm'), [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        {
          text: i18n.t('common.delete'),
          style: 'destructive',
          onPress: () => dispatch(deletePriceAlert(alert.id)),
        },
      ]);
    },
    [dispatch]
  );

  // Handle toggle alert
  const handleToggleAlert = useCallback(
    (alert: PriceAlert) => {
      dispatch(togglePriceAlert(alert.id));
    },
    [dispatch]
  );

  // Handle refresh
  const handleRefresh = useCallback(() => {
    dispatch(checkPriceAlerts());
  }, [dispatch]);

  // Format price
  const formatPrice = (price: number | undefined): string => {
    if (price === undefined) return '-';
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Get condition text
  const getConditionText = (alert: PriceAlert): string => {
    switch (alert.condition) {
      case 'above':
        return `${i18n.t('priceAlert.above')} ${formatPrice(alert.targetPrice)}`;
      case 'below':
        return `${i18n.t('priceAlert.below')} ${formatPrice(alert.targetPrice)}`;
      case 'change_percent':
        const direction =
          alert.changeDirection === 'up' ? '↑' : alert.changeDirection === 'down' ? '↓' : '↕';
        return `${direction} ${alert.changePercent}% (${alert.timeframe})`;
      default:
        return '';
    }
  };

  // Get status color
  const getStatusColor = (status: PriceAlert['status']): string => {
    switch (status) {
      case 'active':
        return theme.colors.success;
      case 'triggered':
        return theme.colors.warning;
      case 'disabled':
        return theme.colors.text.secondary;
      default:
        return theme.colors.text.secondary;
    }
  };

  // Render alert item
  const renderAlertItem = (alert: PriceAlert) => (
    <View key={alert.id} style={[styles.alertItem, { backgroundColor: theme.colors.card }]}>
      <TouchableOpacity style={styles.alertContent} onPress={() => handleToggleAlert(alert)}>
        <View style={styles.alertHeader}>
          <Text style={[styles.alertToken, { color: theme.colors.text.primary }]}>
            {alert.tokenSymbol}
          </Text>
          <View
            style={[styles.statusBadge, { backgroundColor: getStatusColor(alert.status) + '20' }]}
          >
            <Text style={[styles.statusText, { color: getStatusColor(alert.status) }]}>
              {i18n.t(`priceAlert.status.${alert.status}`)}
            </Text>
          </View>
        </View>
        <Text style={[styles.alertCondition, { color: theme.colors.text.secondary }]}>
          {getConditionText(alert)}
        </Text>
        {alert.currentPrice && (
          <Text style={[styles.alertCurrentPrice, { color: theme.colors.text.secondary }]}>
            {i18n.t('priceAlert.currentPrice')}: {formatPrice(alert.currentPrice)}
          </Text>
        )}
        {alert.repeating && (
          <Text style={[styles.alertRepeating, { color: theme.colors.primary }]}>
            🔄 {i18n.t('priceAlert.repeating')}
          </Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteAlert(alert)}>
        <Text style={[styles.deleteButtonText, { color: theme.colors.error }]}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  // Render create modal
  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCreateModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
              {i18n.t('priceAlert.createAlert')}
            </Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={[styles.closeButton, { color: theme.colors.text.secondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            {/* Token Selection */}
            <Text style={[styles.sectionLabel, { color: theme.colors.text.secondary }]}>
              {i18n.t('priceAlert.selectToken')}
            </Text>
            <View style={styles.tokenGrid}>
              {POPULAR_TOKENS.map(token => (
                <TouchableOpacity
                  key={token.symbol}
                  style={[
                    styles.tokenOption,
                    { backgroundColor: theme.colors.card },
                    selectedToken === token.symbol && {
                      borderColor: theme.colors.primary,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => setSelectedToken(token.symbol)}
                >
                  <Text style={[styles.tokenSymbol, { color: theme.colors.text.primary }]}>
                    {token.symbol}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Condition Selection */}
            <Text style={[styles.sectionLabel, { color: theme.colors.text.secondary }]}>
              {i18n.t('priceAlert.condition')}
            </Text>
            <View style={styles.conditionOptions}>
              {(['above', 'below', 'change_percent'] as AlertCondition[]).map(cond => (
                <TouchableOpacity
                  key={cond}
                  style={[
                    styles.conditionOption,
                    { backgroundColor: theme.colors.card },
                    condition === cond && {
                      borderColor: theme.colors.primary,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => setCondition(cond)}
                >
                  <Text style={[styles.conditionText, { color: theme.colors.text.primary }]}>
                    {i18n.t(`priceAlert.conditions.${cond}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Price/Percent Input */}
            {(condition === 'above' || condition === 'below') && (
              <View style={styles.inputSection}>
                <Text style={[styles.sectionLabel, { color: theme.colors.text.secondary }]}>
                  {i18n.t('priceAlert.targetPrice')}
                </Text>
                <View style={[styles.priceInput, { backgroundColor: theme.colors.card }]}>
                  <Text style={[styles.currencySymbol, { color: theme.colors.text.secondary }]}>
                    $
                  </Text>
                  <TextInput
                    style={[styles.input, { color: theme.colors.text.primary }]}
                    value={targetPrice}
                    onChangeText={setTargetPrice}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={theme.colors.text.secondary}
                  />
                </View>
              </View>
            )}

            {condition === 'change_percent' && (
              <>
                <View style={styles.inputSection}>
                  <Text style={[styles.sectionLabel, { color: theme.colors.text.secondary }]}>
                    {i18n.t('priceAlert.changePercent')}
                  </Text>
                  <View style={[styles.priceInput, { backgroundColor: theme.colors.card }]}>
                    <TextInput
                      style={[styles.input, { color: theme.colors.text.primary }]}
                      value={changePercent}
                      onChangeText={setChangePercent}
                      keyboardType="decimal-pad"
                      placeholder="5"
                      placeholderTextColor={theme.colors.text.secondary}
                    />
                    <Text style={[styles.currencySymbol, { color: theme.colors.text.secondary }]}>
                      %
                    </Text>
                  </View>
                </View>

                <Text style={[styles.sectionLabel, { color: theme.colors.text.secondary }]}>
                  {i18n.t('priceAlert.direction')}
                </Text>
                <View style={styles.directionOptions}>
                  {(['up', 'down', 'any'] as const).map(dir => (
                    <TouchableOpacity
                      key={dir}
                      style={[
                        styles.directionOption,
                        { backgroundColor: theme.colors.card },
                        changeDirection === dir && {
                          borderColor: theme.colors.primary,
                          borderWidth: 2,
                        },
                      ]}
                      onPress={() => setChangeDirection(dir)}
                    >
                      <Text style={[styles.directionText, { color: theme.colors.text.primary }]}>
                        {dir === 'up' ? '↑' : dir === 'down' ? '↓' : '↕'}{' '}
                        {i18n.t(`priceAlert.directions.${dir}`)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.sectionLabel, { color: theme.colors.text.secondary }]}>
                  {i18n.t('priceAlert.timeframe')}
                </Text>
                <View style={styles.timeframeOptions}>
                  {(['1h', '24h', '7d'] as const).map(tf => (
                    <TouchableOpacity
                      key={tf}
                      style={[
                        styles.timeframeOption,
                        { backgroundColor: theme.colors.card },
                        timeframe === tf && {
                          borderColor: theme.colors.primary,
                          borderWidth: 2,
                        },
                      ]}
                      onPress={() => setTimeframe(tf)}
                    >
                      <Text style={[styles.timeframeText, { color: theme.colors.text.primary }]}>
                        {tf}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Repeating Toggle */}
            <TouchableOpacity
              style={[styles.repeatOption, { backgroundColor: theme.colors.card }]}
              onPress={() => setRepeating(!repeating)}
            >
              <Text style={[styles.repeatText, { color: theme.colors.text.primary }]}>
                {i18n.t('priceAlert.repeatAlert')}
              </Text>
              <View
                style={[
                  styles.checkbox,
                  { borderColor: theme.colors.primary },
                  repeating && { backgroundColor: theme.colors.primary },
                ]}
              >
                {repeating && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
          </ScrollView>

          {/* Create Button */}
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleCreateAlert}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.createButtonText}>{i18n.t('priceAlert.create')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.divider }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel={i18n.t('common.back')}
        >
          <Text style={[styles.backText, { color: theme.colors.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          {i18n.t('priceAlert.title')}
        </Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Text style={[styles.refreshText, { color: theme.colors.primary }]}>↻</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Active Alerts Count */}
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>
            {i18n.t('priceAlert.activeAlerts')}
          </Text>
          <Text style={[styles.summaryCount, { color: theme.colors.primary }]}>
            {alerts.filter(a => a.status === 'active').length}
          </Text>
        </View>

        {/* Alerts List */}
        {alerts.length > 0 ? (
          <View style={styles.alertsList}>{alerts.map(renderAlertItem)}</View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
              {i18n.t('priceAlert.noAlerts')}
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
              {i18n.t('priceAlert.noAlertsMessage')}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add Alert Button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => setShowCreateModal(true)}
      >
        <Text style={styles.addButtonText}>+ {i18n.t('priceAlert.addAlert')}</Text>
      </TouchableOpacity>

      {renderCreateModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  addButton: {
    alignItems: 'center',
    borderRadius: 12,
    margin: 16,
    padding: 16,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  alertCondition: {
    fontSize: 14,
    marginTop: 4,
  },
  alertContent: {
    flex: 1,
  },
  alertCurrentPrice: {
    fontSize: 12,
    marginTop: 4,
  },
  alertHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  alertItem: {
    borderRadius: 12,
    flexDirection: 'row',
    marginBottom: 8,
    padding: 16,
  },
  alertRepeating: {
    fontSize: 12,
    marginTop: 4,
  },
  alertToken: {
    fontSize: 18,
    fontWeight: '600',
  },
  alertsList: {
    marginTop: 16,
  },
  backButton: {
    padding: 8,
    width: 50,
  },
  backText: {
    fontSize: 24,
  },
  checkbox: {
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 24,
    padding: 8,
  },
  conditionOption: {
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
  },
  conditionOptions: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  conditionText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  createButton: {
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 16,
    padding: 16,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  currencySymbol: {
    fontSize: 18,
    marginHorizontal: 8,
  },
  deleteButton: {
    justifyContent: 'center',
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  directionOption: {
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
  },
  directionOptions: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  directionText: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 48,
    padding: 16,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  input: {
    flex: 1,
    fontSize: 18,
    padding: 8,
  },
  inputSection: {
    marginBottom: 16,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    padding: 16,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  priceInput: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    padding: 8,
  },
  refreshButton: {
    padding: 8,
    width: 50,
  },
  refreshText: {
    fontSize: 24,
    textAlign: 'right',
  },
  repeatOption: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    padding: 16,
  },
  repeatText: {
    fontSize: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  summaryCard: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  summaryCount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 16,
  },
  timeframeOption: {
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
  },
  timeframeOptions: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timeframeText: {
    fontSize: 14,
    textAlign: 'center',
  },
  tokenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tokenOption: {
    borderRadius: 8,
    marginBottom: 8,
    marginRight: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tokenSymbol: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PriceAlertScreen;
