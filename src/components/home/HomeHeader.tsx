/**
 * HomeHeader Component
 * Header with account info and network selector
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import i18n from '../../i18n';

interface HomeHeaderProps {
  walletAddress: string;
  networkName: string;
  isTestnet: boolean;
  onNetworkSelect: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  walletAddress,
  networkName,
  isTestnet,
  onNetworkSelect,
}) => {
  const { theme } = useTheme();

  // Truncate address for display
  const truncatedAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

  return (
    <View
      style={[
        styles.header,
        { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.divider },
      ]}
      testID="account-header"
    >
      <View style={styles.headerTop}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            {i18n.t('home.title')}
          </Text>
          <Text style={[styles.headerAddress, { color: theme.colors.text.secondary }]}>
            {truncatedAddress}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.networkSelector, { backgroundColor: theme.colors.surface }]}
          onPress={onNetworkSelect}
          testID="network-selector"
        >
          <View
            style={[styles.networkDot, { backgroundColor: isTestnet ? '#FF9800' : '#4CAF50' }]}
          />
          <Text style={[styles.networkName, { color: theme.colors.text.primary }]}>
            {networkName || i18n.t('home.selectNetwork')}
          </Text>
          <Text style={[styles.networkArrow, { color: theme.colors.text.secondary }]}>▼</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    padding: 16,
  },
  headerAddress: {
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  networkArrow: {
    fontSize: 8,
  },
  networkDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  networkName: {
    fontSize: 12,
    fontWeight: '600',
  },
  networkSelector: {
    alignItems: 'center',
    borderRadius: 20,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
