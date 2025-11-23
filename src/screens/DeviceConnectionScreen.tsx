/**
 * DeviceConnectionScreen
 * Handles BLE device connection and pairing
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';

type ConnectionState = 'connecting' | 'pairing' | 'connected' | 'failed';

interface Device {
  id: string;
  name: string;
  rssi: number;
  address: string;
}

interface DeviceConnectionScreenProps {
  navigation: any;
  route: {
    params: {
      device: Device;
    };
  };
  initialState?: ConnectionState;
  pairingCode?: string;
  errorMessage?: string;
}

export const DeviceConnectionScreen: React.FC<DeviceConnectionScreenProps> = ({
  navigation,
  route,
  initialState = 'connecting',
  pairingCode = '',
  errorMessage = 'Connection failed. Please try again.',
}) => {
  const { theme } = useTheme();
  const { device } = route.params;
  const [connectionState, setConnectionState] = useState<ConnectionState>(initialState);

  // Format address
  const formatAddress = (address: string) => {
    if (address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get signal strength label
  const getSignalStrength = (rssi: number) => {
    if (rssi >= -50) return 'Excellent';
    if (rssi >= -70) return 'Good';
    return 'Weak';
  };

  // Get status text
  const getStatusText = () => {
    switch (connectionState) {
      case 'connecting':
        return 'Connecting...';
      case 'pairing':
        return 'Pairing';
      case 'connected':
        return 'Connected';
      case 'failed':
        return 'Connection Failed';
      default:
        return '';
    }
  };

  // Get status color
  const getStatusColor = () => {
    switch (connectionState) {
      case 'connecting':
      case 'pairing':
        return theme.colors.primary;
      case 'connected':
        return theme.colors.success;
      case 'failed':
        return theme.colors.error;
      default:
        return theme.colors.text.primary;
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigation.goBack();
  };

  // Handle retry
  const handleRetry = () => {
    setConnectionState('connecting');
  };

  // Handle confirm pairing
  const handleConfirmPairing = () => {
    setConnectionState('connected');
  };

  // Handle continue to chat
  const handleContinue = () => {
    navigation.replace('ChatConversation', {
      peerName: device.name,
      peerAddress: device.address,
      sessionId: `session-${device.id}`,
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            testID="cancel-button"
            style={styles.cancelButton}
            onPress={handleCancel}
            accessibilityLabel="Cancel connection"
          >
            <Text style={[styles.cancelText, { color: theme.colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Device Info */}
        <View style={styles.deviceInfo}>
          <View style={[styles.deviceIcon, { backgroundColor: theme.colors.primary + '30' }]}>
            <Text style={[styles.deviceIconText, { color: theme.colors.primary }]}>
              {device.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.deviceName, { color: theme.colors.text.primary }]}>
            {device.name}
          </Text>
          <Text style={[styles.deviceAddress, { color: theme.colors.text.secondary }]}>
            {formatAddress(device.address)}
          </Text>
          <View testID="signal-strength" style={styles.signalContainer}>
            <Text style={[styles.signalLabel, { color: theme.colors.text.secondary }]}>
              Signal: {getSignalStrength(device.rssi)}
            </Text>
          </View>
        </View>

        {/* Connection Status */}
        <View
          testID="connection-status"
          style={styles.statusContainer}
          accessibilityLabel="Connection status"
        >
          {(connectionState === 'connecting' || connectionState === 'pairing') && (
            <View testID="connection-progress" style={styles.progressContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          )}

          {connectionState === 'connected' && (
            <View style={styles.statusIconContainer}>
              <Text style={[styles.statusIcon, { color: theme.colors.success }]}>✓</Text>
            </View>
          )}

          {connectionState === 'failed' && (
            <View style={styles.statusIconContainer}>
              <Text style={[styles.statusIcon, { color: theme.colors.error }]}>✕</Text>
            </View>
          )}

          <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusText()}</Text>

          {connectionState === 'failed' && (
            <Text style={[styles.errorText, { color: theme.colors.text.secondary }]}>
              {errorMessage}
            </Text>
          )}
        </View>

        {/* Pairing Code */}
        {connectionState === 'pairing' && pairingCode && (
          <View style={styles.pairingContainer}>
            <Text style={[styles.pairingLabel, { color: theme.colors.text.secondary }]}>
              Confirm this code matches on both devices
            </Text>
            <Text
              testID="pairing-code"
              style={[styles.pairingCode, { color: theme.colors.text.primary }]}
            >
              {pairingCode}
            </Text>
            <TouchableOpacity
              testID="confirm-pairing"
              style={[styles.confirmButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleConfirmPairing}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {connectionState === 'failed' && (
            <TouchableOpacity
              testID="retry-button"
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleRetry}
            >
              <Text style={styles.actionButtonText}>Retry</Text>
            </TouchableOpacity>
          )}

          {connectionState === 'connected' && (
            <TouchableOpacity
              testID="continue-button"
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleContinue}
            >
              <Text style={styles.actionButtonText}>Start Chat</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 16,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actionsContainer: {
    marginTop: 'auto',
    paddingBottom: 16,
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButton: {
    borderRadius: 8,
    paddingHorizontal: 48,
    paddingVertical: 12,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  deviceAddress: {
    fontSize: 14,
    marginBottom: 8,
  },
  deviceIcon: {
    alignItems: 'center',
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    marginBottom: 16,
    width: 80,
  },
  deviceIconText: {
    fontSize: 32,
    fontWeight: '600',
  },
  deviceInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  deviceName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    paddingHorizontal: 32,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 32,
  },
  pairingCode: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 8,
    marginBottom: 24,
  },
  pairingContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  pairingLabel: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: 16,
  },
  safeArea: {
    flex: 1,
  },
  signalContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  signalLabel: {
    fontSize: 14,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  statusIcon: {
    fontSize: 40,
  },
  statusIconContainer: {
    alignItems: 'center',
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    marginBottom: 16,
    width: 60,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
});

export default DeviceConnectionScreen;
