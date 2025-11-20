/**
 * NetworkStatus Component
 * Displays network connectivity status
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

type NetworkType = 'wifi' | 'cellular' | 'unknown';

interface NetworkStatusProps {
  isConnected: boolean;
  networkType?: NetworkType;
  showIndicator?: boolean;
  offlineMessage?: string;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({
  isConnected,
  networkType = 'unknown',
  showIndicator = false,
  offlineMessage = 'You are offline. Some features may be unavailable.',
}) => {
  const { theme } = useTheme();

  // Get network icon
  const getNetworkIcon = () => {
    switch (networkType) {
      case 'wifi':
        return '📶';
      case 'cellular':
        return '📱';
      default:
        return '🌐';
    }
  };

  // Render network indicator (when online)
  if (isConnected && showIndicator) {
    return (
      <View testID="network-indicator" style={styles.indicator}>
        <Text style={styles.indicatorIcon}>{getNetworkIcon()}</Text>
      </View>
    );
  }

  // Don't render anything when online without indicator
  if (isConnected) {
    return null;
  }

  // Render offline banner
  return (
    <View
      testID="network-banner"
      style={[styles.banner, { backgroundColor: theme.colors.error }]}
      accessibilityLabel="Network status: offline"
      accessibilityRole="alert"
    >
      <Text testID="offline-icon" style={styles.offlineIcon}>
        ⚠️
      </Text>
      <Text style={styles.offlineText}>{offlineMessage}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  offlineIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  offlineText: {
    flex: 1,
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  indicator: {
    padding: 4,
  },
  indicatorIcon: {
    fontSize: 12,
  },
});

export default NetworkStatus;
