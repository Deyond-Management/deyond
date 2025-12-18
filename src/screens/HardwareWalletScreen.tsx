/**
 * HardwareWalletScreen
 * Screen for connecting and managing hardware wallets (Ledger, Trezor)
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  scanDevices,
  connectDevice,
  disconnectDevice,
  fetchAccounts,
  selectDevice,
  selectConnectionStatus,
  selectAccounts,
  selectSelectedAccount,
  selectIsScanning,
  selectAvailableDevices,
  selectHardwareWalletError,
  selectAccount,
  clearError,
  clearDevices,
} from '../store/slices/hardwareWalletSlice';
import {
  HardwareWalletDevice,
  HardwareWalletAccount,
  ConnectionType,
  HardwareWalletType,
  BIP44_PATH,
} from '../services/hardware/types';
import i18n from '../i18n';

interface HardwareWalletScreenProps {
  navigation: any;
}

export const HardwareWalletScreen: React.FC<HardwareWalletScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();

  const device = useAppSelector(selectDevice);
  const status = useAppSelector(selectConnectionStatus);
  const accounts = useAppSelector(selectAccounts);
  const selectedAccount = useAppSelector(selectSelectedAccount);
  const isScanning = useAppSelector(selectIsScanning);
  const availableDevices = useAppSelector(selectAvailableDevices);
  const error = useAppSelector(selectHardwareWalletError);

  const [connectionType, setConnectionType] = useState<ConnectionType>('bluetooth');
  const [selectedPath, setSelectedPath] = useState(BIP44_PATH.ETHEREUM);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

  // Clear error on mount
  useEffect(() => {
    dispatch(clearError());
    return () => {
      dispatch(clearDevices());
    };
  }, [dispatch]);

  // Show error alert
  useEffect(() => {
    if (error) {
      Alert.alert(i18n.t('hardwareWallet.error'), error, [
        { text: i18n.t('common.ok'), onPress: () => dispatch(clearError()) },
      ]);
    }
  }, [error, dispatch]);

  // Handle scan for devices
  const handleScan = useCallback(() => {
    dispatch(scanDevices({ connectionType }));
  }, [dispatch, connectionType]);

  // Handle device connection
  const handleConnect = useCallback(
    async (selectedDevice: HardwareWalletDevice) => {
      const result = await dispatch(connectDevice(selectedDevice));
      if (connectDevice.fulfilled.match(result)) {
        // Fetch accounts after connecting
        setIsLoadingAccounts(true);
        await dispatch(fetchAccounts({ basePath: selectedPath }));
        setIsLoadingAccounts(false);
      }
    },
    [dispatch, selectedPath]
  );

  // Handle disconnect
  const handleDisconnect = useCallback(() => {
    Alert.alert(i18n.t('hardwareWallet.disconnect'), i18n.t('hardwareWallet.disconnectConfirm'), [
      { text: i18n.t('common.cancel'), style: 'cancel' },
      {
        text: i18n.t('common.disconnect'),
        style: 'destructive',
        onPress: () => dispatch(disconnectDevice()),
      },
    ]);
  }, [dispatch]);

  // Handle account selection
  const handleSelectAccount = useCallback(
    (account: HardwareWalletAccount) => {
      dispatch(selectAccount(account));
    },
    [dispatch]
  );

  // Handle use selected account
  const handleUseAccount = useCallback(() => {
    if (selectedAccount) {
      // Navigate back or to the screen that needs the address
      navigation.goBack();
    }
  }, [navigation, selectedAccount]);

  // Load more accounts
  const handleLoadMoreAccounts = useCallback(async () => {
    setIsLoadingAccounts(true);
    await dispatch(
      fetchAccounts({
        basePath: selectedPath,
        startIndex: accounts.length,
        count: 5,
      })
    );
    setIsLoadingAccounts(false);
  }, [dispatch, selectedPath, accounts.length]);

  // Render device item
  const renderDeviceItem = (deviceItem: HardwareWalletDevice) => (
    <TouchableOpacity
      key={deviceItem.id}
      style={[styles.deviceItem, { backgroundColor: theme.colors.card }]}
      onPress={() => handleConnect(deviceItem)}
      disabled={status === 'connecting'}
    >
      <View style={styles.deviceIcon}>
        <Text style={styles.deviceIconText}>{deviceItem.type === 'ledger' ? '🔐' : '🛡️'}</Text>
      </View>
      <View style={styles.deviceInfo}>
        <Text style={[styles.deviceName, { color: theme.colors.text.primary }]}>
          {deviceItem.name}
        </Text>
        <Text style={[styles.deviceModel, { color: theme.colors.text.secondary }]}>
          {deviceItem.model} • {deviceItem.connectionType.toUpperCase()}
        </Text>
      </View>
      {status === 'connecting' && <ActivityIndicator size="small" color={theme.colors.primary} />}
    </TouchableOpacity>
  );

  // Render account item
  const renderAccountItem = (account: HardwareWalletAccount) => {
    const isSelected = selectedAccount?.address === account.address;
    return (
      <TouchableOpacity
        key={account.address}
        style={[
          styles.accountItem,
          { backgroundColor: theme.colors.card },
          isSelected && { borderColor: theme.colors.primary, borderWidth: 2 },
        ]}
        onPress={() => handleSelectAccount(account)}
      >
        <View style={styles.accountIndex}>
          <Text style={[styles.accountIndexText, { color: theme.colors.text.secondary }]}>
            #{account.index}
          </Text>
        </View>
        <View style={styles.accountInfo}>
          <Text style={[styles.accountAddress, { color: theme.colors.text.primary }]}>
            {account.address.slice(0, 10)}...{account.address.slice(-8)}
          </Text>
          <Text style={[styles.accountPath, { color: theme.colors.text.secondary }]}>
            {account.path}
          </Text>
        </View>
        {isSelected && (
          <View style={[styles.selectedBadge, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.selectedBadgeText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

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
          {i18n.t('hardwareWallet.title')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Connection Status */}
        {status === 'connected' && device && (
          <View style={[styles.connectedCard, { backgroundColor: theme.colors.success + '20' }]}>
            <View style={styles.connectedInfo}>
              <Text style={[styles.connectedLabel, { color: theme.colors.success }]}>
                {i18n.t('hardwareWallet.connected')}
              </Text>
              <Text style={[styles.connectedDevice, { color: theme.colors.text.primary }]}>
                {device.name} ({device.model})
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.disconnectButton, { backgroundColor: theme.colors.error }]}
              onPress={handleDisconnect}
            >
              <Text style={styles.disconnectText}>{i18n.t('common.disconnect')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Not Connected - Show Scan Options */}
        {status !== 'connected' && (
          <>
            {/* Connection Type Selector */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
                {i18n.t('hardwareWallet.connectionType')}
              </Text>
              <View style={styles.connectionTypes}>
                <TouchableOpacity
                  style={[
                    styles.connectionTypeButton,
                    { backgroundColor: theme.colors.card },
                    connectionType === 'bluetooth' && {
                      borderColor: theme.colors.primary,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => setConnectionType('bluetooth')}
                >
                  <Text style={styles.connectionTypeIcon}>📶</Text>
                  <Text style={[styles.connectionTypeText, { color: theme.colors.text.primary }]}>
                    Bluetooth
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.connectionTypeButton,
                    { backgroundColor: theme.colors.card },
                    connectionType === 'usb' && {
                      borderColor: theme.colors.primary,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => setConnectionType('usb')}
                >
                  <Text style={styles.connectionTypeIcon}>🔌</Text>
                  <Text style={[styles.connectionTypeText, { color: theme.colors.text.primary }]}>
                    USB
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Scan Button */}
            <TouchableOpacity
              style={[styles.scanButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleScan}
              disabled={isScanning}
            >
              {isScanning ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.scanButtonText}>{i18n.t('hardwareWallet.scanDevices')}</Text>
              )}
            </TouchableOpacity>

            {/* Available Devices */}
            {availableDevices.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
                  {i18n.t('hardwareWallet.availableDevices')}
                </Text>
                {availableDevices.map(renderDeviceItem)}
              </View>
            )}

            {/* Supported Devices Info */}
            <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.infoTitle, { color: theme.colors.text.primary }]}>
                {i18n.t('hardwareWallet.supportedDevices')}
              </Text>
              <View style={styles.supportedList}>
                <Text style={[styles.supportedItem, { color: theme.colors.text.secondary }]}>
                  • Ledger Nano X, Nano S Plus, Stax
                </Text>
                <Text style={[styles.supportedItem, { color: theme.colors.text.secondary }]}>
                  • Trezor Model T, Safe 3, Safe 5
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Connected - Show Accounts */}
        {status === 'connected' && (
          <>
            {/* Derivation Path Selector */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
                {i18n.t('hardwareWallet.derivationPath')}
              </Text>
              <View style={styles.pathOptions}>
                {[
                  { label: 'BIP44 Standard', value: BIP44_PATH.ETHEREUM },
                  { label: 'Ledger Live', value: BIP44_PATH.LEDGER_LIVE },
                  { label: 'Legacy', value: BIP44_PATH.LEGACY },
                ].map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.pathOption,
                      { backgroundColor: theme.colors.card },
                      selectedPath === option.value && {
                        borderColor: theme.colors.primary,
                        borderWidth: 2,
                      },
                    ]}
                    onPress={() => setSelectedPath(option.value)}
                  >
                    <Text style={[styles.pathOptionText, { color: theme.colors.text.primary }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Accounts List */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
                {i18n.t('hardwareWallet.selectAccount')}
              </Text>
              {accounts.map(renderAccountItem)}

              {/* Load More Button */}
              <TouchableOpacity
                style={[styles.loadMoreButton, { borderColor: theme.colors.primary }]}
                onPress={handleLoadMoreAccounts}
                disabled={isLoadingAccounts}
              >
                {isLoadingAccounts ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <Text style={[styles.loadMoreText, { color: theme.colors.primary }]}>
                    {i18n.t('hardwareWallet.loadMore')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Use Account Button */}
            {selectedAccount && (
              <TouchableOpacity
                style={[styles.useAccountButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleUseAccount}
              >
                <Text style={styles.useAccountText}>{i18n.t('hardwareWallet.useAccount')}</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  accountAddress: {
    fontFamily: 'monospace',
    fontSize: 14,
  },
  accountIndex: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    width: 30,
  },
  accountIndexText: {
    fontSize: 12,
    fontWeight: '600',
  },
  accountInfo: {
    flex: 1,
  },
  accountItem: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    marginBottom: 8,
    padding: 16,
  },
  accountPath: {
    fontSize: 11,
    marginTop: 2,
  },
  backButton: {
    padding: 8,
    width: 50,
  },
  backText: {
    fontSize: 24,
  },
  connectedCard: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: 16,
  },
  connectedDevice: {
    fontSize: 14,
    marginTop: 2,
  },
  connectedInfo: {
    flex: 1,
  },
  connectedLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  connectionTypeButton: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
  },
  connectionTypeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  connectionTypeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  connectionTypes: {
    flexDirection: 'row',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  deviceIcon: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  deviceIconText: {
    fontSize: 24,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceItem: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    marginBottom: 8,
    padding: 16,
  },
  deviceModel: {
    fontSize: 12,
    marginTop: 2,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
  },
  disconnectButton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  disconnectText: {
    color: '#FFFFFF',
    fontSize: 14,
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
  infoCard: {
    borderRadius: 12,
    marginTop: 16,
    padding: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  loadMoreButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    padding: 12,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '500',
  },
  pathOption: {
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
  },
  pathOptionText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  pathOptions: {
    flexDirection: 'row',
  },
  placeholder: {
    width: 50,
  },
  scanButton: {
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  selectedBadge: {
    alignItems: 'center',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  selectedBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  supportedItem: {
    fontSize: 13,
    marginBottom: 4,
  },
  supportedList: {
    marginTop: 4,
  },
  useAccountButton: {
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 8,
    padding: 16,
  },
  useAccountText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HardwareWalletScreen;
