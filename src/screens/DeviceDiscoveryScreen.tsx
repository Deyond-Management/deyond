/**
 * DeviceDiscoveryScreen
 * Scans for nearby Bluetooth devices and shows them in a list
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { EmptyState } from '../components/atoms/EmptyState';
import { Button } from '../components/atoms/Button';
import i18n from '../i18n';

interface BLEDevice {
  id: string;
  name: string;
  rssi: number;
  address: string;
}

interface DeviceDiscoveryScreenProps {
  navigation: any;
  initialDevices?: BLEDevice[];
  initialScanning?: boolean;
  bluetoothEnabled?: boolean;
}

export const DeviceDiscoveryScreen: React.FC<DeviceDiscoveryScreenProps> = ({
  navigation,
  initialDevices = [],
  initialScanning = false,
  bluetoothEnabled = true,
}) => {
  const { theme } = useTheme();
  const [devices, setDevices] = useState<BLEDevice[]>(initialDevices);
  const [scanning, setScanning] = useState(initialScanning);

  // Get signal strength level (1-3)
  const getSignalStrength = (rssi: number): number => {
    if (rssi >= -50) return 3; // Strong
    if (rssi >= -70) return 2; // Medium
    return 1; // Weak
  };

  // Get signal color
  const getSignalColor = (rssi: number) => {
    const strength = getSignalStrength(rssi);
    if (strength === 3) return theme.colors.success;
    if (strength === 2) return theme.colors.warning;
    return theme.colors.error;
  };

  // Handle scan
  const handleScan = () => {
    setScanning(true);
    // In real app, this would start BLE scanning
    // For now, simulate with timeout
    setTimeout(() => {
      setScanning(false);
    }, 3000);
  };

  // Handle device press
  const handleDevicePress = (device: BLEDevice) => {
    navigation.navigate('DeviceConnection', { device });
  };

  // Render signal indicator
  const renderSignalIndicator = (rssi: number, deviceId: string) => {
    const strength = getSignalStrength(rssi);
    const color = getSignalColor(rssi);

    return (
      <View testID={`signal-indicator-${deviceId}`} style={styles.signalContainer}>
        {[1, 2, 3].map(level => (
          <View
            key={level}
            style={[
              styles.signalBar,
              {
                height: 4 + level * 4,
                backgroundColor: level <= strength ? color : theme.colors.surface,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  // Render device item
  const renderDevice = ({ item }: { item: BLEDevice }) => (
    <TouchableOpacity
      testID={`device-item-${item.id}`}
      style={[
        styles.deviceItem,
        { backgroundColor: theme.colors.card, borderColor: theme.colors.divider },
      ]}
      onPress={() => handleDevicePress(item)}
    >
      <View style={styles.deviceInfo}>
        <View style={[styles.deviceIcon, { backgroundColor: theme.colors.primary + '30' }]}>
          <Text style={[styles.deviceIconText, { color: theme.colors.primary }]}>📱</Text>
        </View>
        <View style={styles.deviceDetails}>
          <Text style={[styles.deviceName, { color: theme.colors.text.primary }]}>{item.name}</Text>
          <Text style={[styles.deviceAddress, { color: theme.colors.text.secondary }]}>
            {item.address.slice(0, 10)}...
          </Text>
        </View>
      </View>
      {renderSignalIndicator(item.rssi, item.id)}
    </TouchableOpacity>
  );

  // Render bluetooth warning
  if (!bluetoothEnabled) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View testID="bluetooth-warning" style={styles.warningContainer}>
          <Text style={styles.warningIcon}>📵</Text>
          <Text style={[styles.warningTitle, { color: theme.colors.text.primary }]}>
            {i18n.t('deviceDiscovery.bluetoothDisabled.title')}
          </Text>
          <Text style={[styles.warningText, { color: theme.colors.text.secondary }]}>
            {i18n.t('deviceDiscovery.bluetoothDisabled.message')}
          </Text>
          <Button variant="primary" onPress={() => {}} style={styles.enableButton}>
            {i18n.t('deviceDiscovery.bluetoothDisabled.action')}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          {i18n.t('deviceDiscovery.title')}
        </Text>
      </View>

      {/* Scan Button */}
      <View style={styles.scanSection}>
        <TouchableOpacity
          testID="scan-button"
          style={[
            styles.scanButton,
            {
              backgroundColor: scanning ? theme.colors.surface : theme.colors.primary,
            },
          ]}
          onPress={handleScan}
          disabled={scanning}
          accessibilityLabel={i18n.t('deviceDiscovery.scanAccessibility')}
        >
          {scanning && (
            <ActivityIndicator
              testID="scanning-indicator"
              size="small"
              color={theme.colors.primary}
              style={styles.scanIndicator}
            />
          )}
          <Text
            style={[styles.scanButtonText, { color: scanning ? theme.colors.primary : '#FFFFFF' }]}
          >
            {scanning ? i18n.t('deviceDiscovery.scanning') : i18n.t('deviceDiscovery.scan')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Device List */}
      {devices.length > 0 ? (
        <FlatList
          testID="device-list"
          data={devices}
          renderItem={renderDevice}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View testID="empty-state" style={styles.emptyContainer}>
          <EmptyState
            title={i18n.t('deviceDiscovery.empty.title')}
            message={i18n.t('deviceDiscovery.empty.message')}
            icon="search"
            actionLabel={i18n.t('deviceDiscovery.empty.action')}
            onAction={handleScan}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  deviceAddress: {
    fontSize: 12,
  },
  deviceDetails: {
    flex: 1,
  },
  deviceIcon: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    marginRight: 12,
    width: 44,
  },
  deviceIconText: {
    fontSize: 20,
  },
  deviceInfo: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  deviceItem: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    padding: 16,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  enableButton: {
    minWidth: 200,
  },
  header: {
    padding: 16,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  safeArea: {
    flex: 1,
  },
  scanButton: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scanIndicator: {
    marginRight: 8,
  },
  scanSection: {
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  signalBar: {
    borderRadius: 2,
    width: 4,
  },
  signalContainer: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  warningContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  warningIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
});

export default DeviceDiscoveryScreen;
