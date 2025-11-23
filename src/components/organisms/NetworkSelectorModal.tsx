/**
 * NetworkSelectorModal
 * Modal for selecting blockchain network
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export interface Network {
  id: string;
  name: string;
  chainId: number;
  rpcUrl: string;
  symbol: string;
  blockExplorer: string;
  isTestnet: boolean;
}

interface NetworkSelectorModalProps {
  visible: boolean;
  networks: Network[];
  selectedNetworkId: string;
  onSelect: (network: Network) => void;
  onClose: () => void;
}

export const NetworkSelectorModal: React.FC<NetworkSelectorModalProps> = ({
  visible,
  networks,
  selectedNetworkId,
  onSelect,
  onClose,
}) => {
  const { theme } = useTheme();
  const { colors, spacing } = theme;

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

              {/* Network List */}
              <ScrollView style={styles.networkList}>
                {networks.map(network => {
                  const isSelected = network.id === selectedNetworkId;

                  return (
                    <TouchableOpacity
                      key={network.id}
                      style={[
                        styles.networkItem,
                        { borderBottomColor: colors.divider },
                        isSelected && { backgroundColor: colors.surface },
                      ]}
                      onPress={() => onSelect(network)}
                      accessibilityLabel={network.name}
                      accessibilityRole="button"
                    >
                      <View style={styles.networkInfo}>
                        {/* Network dot indicator */}
                        <View
                          style={[
                            styles.networkDot,
                            {
                              backgroundColor: network.isTestnet ? colors.warning : colors.success,
                            },
                          ]}
                        />

                        <View style={styles.networkDetails}>
                          <View style={styles.networkNameRow}>
                            <Text style={[styles.networkName, { color: colors.text.primary }]}>
                              {network.name}
                            </Text>
                            {network.isTestnet && (
                              <View
                                style={[
                                  styles.testnetBadge,
                                  { backgroundColor: colors.warning + '20' },
                                ]}
                              >
                                <Text style={[styles.testnetText, { color: colors.warning }]}>
                                  Testnet
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.networkSymbol, { color: colors.textSecondary }]}>
                            {network.symbol}
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
                })}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    maxHeight: '70%',
  },
  networkDetails: {
    flex: 1,
  },
  networkDot: {
    borderRadius: 6,
    height: 12,
    marginRight: 12,
    width: 12,
  },
  networkInfo: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  networkItem: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  networkList: {
    paddingBottom: 32,
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
    fontSize: 14,
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
    paddingHorizontal: 8,
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
});

export default NetworkSelectorModal;
