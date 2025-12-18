/**
 * NetworkSelectorModal
 * Modal for selecting blockchain network
 * Supports EVM, Solana, and Bitcoin networks
 */

import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  Switch,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Network, NetworkType } from '../../types/wallet';

interface NetworkSelectorModalProps {
  visible: boolean;
  networks: Network[];
  selectedNetworkId: string;
  showTestnets: boolean;
  onSelect: (network: Network) => void;
  onClose: () => void;
  onToggleTestnets: () => void;
}

/**
 * Network type badge colors and labels
 */
const NETWORK_TYPE_CONFIG: Record<NetworkType, { label: string; color: string; bgColor: string }> =
  {
    evm: { label: 'EVM', color: '#627EEA', bgColor: '#627EEA20' },
    solana: { label: 'SOL', color: '#14F195', bgColor: '#14F19520' },
    bitcoin: { label: 'BTC', color: '#F7931A', bgColor: '#F7931A20' },
    cosmos: { label: 'ATOM', color: '#2E3148', bgColor: '#2E314820' },
  };

/**
 * Network type display order
 */
const NETWORK_TYPE_ORDER: NetworkType[] = ['evm', 'solana', 'bitcoin', 'cosmos'];

export const NetworkSelectorModal: React.FC<NetworkSelectorModalProps> = ({
  visible,
  networks,
  selectedNetworkId,
  showTestnets,
  onSelect,
  onClose,
  onToggleTestnets,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  // Filter networks based on testnet toggle
  const visibleNetworks = useMemo(() => {
    return showTestnets ? networks : networks.filter(n => !n.isTestnet);
  }, [networks, showTestnets]);

  // Group networks by type
  const groupedNetworks = useMemo(() => {
    const groups: Record<NetworkType, Network[]> = {
      evm: [],
      solana: [],
      bitcoin: [],
      cosmos: [],
    };

    visibleNetworks.forEach(network => {
      if (groups[network.networkType]) {
        groups[network.networkType].push(network);
      }
    });

    return groups;
  }, [visibleNetworks]);

  const renderNetworkItem = useCallback(
    (network: Network) => {
      const isSelected = network.id === selectedNetworkId;
      const typeConfig = NETWORK_TYPE_CONFIG[network.networkType];

      return (
        <TouchableOpacity
          key={network.id}
          style={[
            styles.networkItem,
            { borderBottomColor: colors.divider },
            isSelected && { backgroundColor: colors.surface },
          ]}
          onPress={() => onSelect(network)}
          accessibilityLabel={`${network.name} network`}
          accessibilityRole="button"
          accessibilityState={{ selected: isSelected }}
        >
          <View style={styles.networkInfo}>
            {/* Network type badge */}
            <View style={[styles.typeBadge, { backgroundColor: typeConfig.bgColor }]}>
              <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>
                {typeConfig.label}
              </Text>
            </View>

            <View style={styles.networkDetails}>
              <View style={styles.networkNameRow}>
                <Text style={[styles.networkName, { color: colors.text.primary }]}>
                  {network.name}
                </Text>
                {network.isTestnet && (
                  <View style={[styles.testnetBadge, { backgroundColor: colors.warning + '20' }]}>
                    <Text style={[styles.testnetText, { color: colors.warning }]}>Testnet</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.networkSymbol, { color: colors.textSecondary }]}>
                {network.currencySymbol}
              </Text>
            </View>
          </View>

          {/* Selected indicator */}
          {isSelected && (
            <View
              testID={`network-selected-${network.id}`}
              style={[styles.selectedIndicator, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.checkmark}>✓</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [selectedNetworkId, colors, onSelect]
  );

  const renderNetworkGroup = useCallback(
    (type: NetworkType) => {
      const networksInGroup = groupedNetworks[type];
      if (networksInGroup.length === 0) return null;

      const typeConfig = NETWORK_TYPE_CONFIG[type];
      const groupLabel = {
        evm: 'EVM Networks',
        solana: 'Solana',
        bitcoin: 'Bitcoin',
        cosmos: 'Cosmos',
      }[type];

      return (
        <View key={type}>
          <View style={[styles.groupHeader, { backgroundColor: colors.surface }]}>
            <View style={[styles.groupDot, { backgroundColor: typeConfig.color }]} />
            <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>{groupLabel}</Text>
          </View>
          {networksInGroup.map(renderNetworkItem)}
        </View>
      );
    },
    [groupedNetworks, colors, renderNetworkItem]
  );

  if (!visible) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} testID="modal-backdrop">
          <TouchableWithoutFeedback>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              {/* Header */}
              <View style={[styles.header, { borderBottomColor: colors.divider }]}>
                <Text style={[styles.title, { color: colors.text.primary }]}>Select Network</Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  testID="close-button"
                >
                  <Text style={[styles.closeText, { color: colors.textSecondary }]}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Testnet Toggle */}
              <View style={[styles.toggleRow, { borderBottomColor: colors.divider }]}>
                <Text style={[styles.toggleLabel, { color: colors.text.primary }]}>
                  Show Testnets
                </Text>
                <Switch
                  value={showTestnets}
                  onValueChange={onToggleTestnets}
                  trackColor={{ false: colors.divider, true: colors.primary + '60' }}
                  thumbColor={showTestnets ? colors.primary : colors.textSecondary}
                  testID="testnet-toggle"
                />
              </View>

              {/* Network List */}
              <ScrollView style={styles.networkList} showsVerticalScrollIndicator={false}>
                {NETWORK_TYPE_ORDER.map(renderNetworkGroup)}
                <View style={styles.bottomPadding} />
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  bottomPadding: {
    height: 32,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 20,
  },
  groupDot: {
    borderRadius: 4,
    height: 8,
    marginRight: 8,
    width: 8,
  },
  groupHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  networkDetails: {
    flex: 1,
  },
  networkInfo: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  networkItem: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  networkList: {
    flexGrow: 1,
  },
  networkName: {
    fontSize: 16,
    fontWeight: '500',
  },
  networkNameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  networkSymbol: {
    fontSize: 13,
    marginTop: 2,
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  selectedIndicator: {
    alignItems: 'center',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  testnetBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  testnetText: {
    fontSize: 10,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  toggleLabel: {
    fontSize: 15,
  },
  toggleRow: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  typeBadge: {
    borderRadius: 6,
    marginRight: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

export default NetworkSelectorModal;
