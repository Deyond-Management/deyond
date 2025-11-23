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
        {[1, 2, 3].map((level) => (
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
        <View
          style={[styles.deviceIcon, { backgroundColor: theme.colors.primary + '30' }]}
        >
          <Text style={[styles.deviceIconText, { color: theme.colors.primary }]}>
            📱
          </Text>
        </View>
        <View style={styles.deviceDetails}>
          <Text style={[styles.deviceName, { color: theme.colors.text.primary }]}>
            {item.name}
          </Text>
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
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      >
        <View testID="bluetooth-warning" style={styles.warningContainer}>
          <Text style={[styles.warningIcon]}>📵</Text>
          <Text style={[styles.warningTitle, { color: theme.colors.text.primary }]}>
            Bluetooth Disabled
          </Text>
          <Text style={[styles.warningText, { color: theme.colors.text.secondary }]}>
            Please enable Bluetooth to discover nearby devices
          </Text>
          <Button
            variant="primary"
            onPress={() => {}}
            style={styles.enableButton}
          >
            Enable Bluetooth
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          Find Devices
        </Text>
      </View>

      {/* Scan Button */}
      <View style={styles.scanSection}>
        <TouchableOpacity
          testID="scan-button"
          style={[
            styles.scanButton,
            {
              backgroundColor: scanning
                ? theme.colors.surface
                : theme.colors.primary,
            },
          ]}
          onPress={handleScan}
          disabled={scanning}
          accessibilityLabel="Scan for devices"
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
            style={[
              styles.scanButtonText,
              { color: scanning ? theme.colors.primary : '#FFFFFF' },
            ]}
          >
            {scanning ? 'Scanning...' : 'Scan'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Device List */}
      {devices.length > 0 ? (
        <FlatList
          testID="device-list"
          data={devices}
          renderItem={renderDevice}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View testID="empty-state" style={styles.emptyContainer}>
          <EmptyState
            title="No devices found"
            message="Make sure nearby devices have Bluetooth enabled and are discoverable"
            icon="search"
            actionLabel="Scan Again"
            onAction={handleScan}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  scanSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  scanButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  scanIndicator: {
    marginRight: 8,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deviceIconText: {
    fontSize: 20,
  },
  deviceDetails: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  deviceAddress: {
    fontSize: 12,
  },
  signalContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  signalBar: {
    width: 4,
    borderRadius: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  warningContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  warningIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  enableButton: {
    minWidth: 200,
  },
});

export default DeviceDiscoveryScreen;
