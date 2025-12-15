/**
 * NetworkSelector Component
 * UI for selecting and switching between blockchain networks
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { ChainConfig, ChainType } from '../../types/chain';
import { getChainManager } from '../../services/blockchain/ChainManager';
import i18n from '../../i18n';

interface NetworkSelectorProps {
  visible: boolean;
  onClose: () => void;
  onNetworkChange?: (chain: ChainConfig) => void;
  filterType?: ChainType; // Filter by mainnet or testnet
}

export const NetworkSelector: React.FC<NetworkSelectorProps> = ({
  visible,
  onClose,
  onNetworkChange,
  filterType,
}) => {
  const { theme } = useTheme();
  const chainManager = getChainManager();

  const [currentChain, setCurrentChain] = useState<ChainConfig>(chainManager.getCurrentChain());
  const [availableChains, setAvailableChains] = useState<ChainConfig[]>([]);
  const [switching, setSwitching] = useState(false);

  // Load available chains
  useEffect(() => {
    let chains = chainManager.getSupportedChains();

    // Filter by type if specified
    if (filterType) {
      chains = chains.filter(chain => chain.type === filterType);
    }

    setAvailableChains(chains);
  }, [filterType]);

  // Subscribe to chain changes
  useEffect(() => {
    const unsubscribe = chainManager.subscribe(chain => {
      setCurrentChain(chain);
    });

    return () => unsubscribe();
  }, []);

  // Handle network switch
  const handleSelectNetwork = useCallback(
    async (chain: ChainConfig) => {
      if (chain.chainId === currentChain.chainId) {
        onClose();
        return;
      }

      setSwitching(true);

      try {
        await chainManager.switchChain(chain.chainId);
        setCurrentChain(chain);

        if (onNetworkChange) {
          onNetworkChange(chain);
        }

        onClose();
      } catch (error) {
        console.error('Failed to switch network:', error);
      } finally {
        setSwitching(false);
      }
    },
    [currentChain, onClose, onNetworkChange]
  );

  // Render network item
  const renderNetworkItem = ({ item }: { item: ChainConfig }) => {
    const isSelected = item.chainId === currentChain.chainId;
    const isTestnet = item.type === 'testnet';

    return (
      <TouchableOpacity
        testID={`network-item-${item.chainId}`}
        style={[
          styles.networkItem,
          {
            backgroundColor: isSelected ? theme.colors.primary + '20' : theme.colors.card,
            borderColor: isSelected ? theme.colors.primary : theme.colors.divider,
          },
        ]}
        onPress={() => handleSelectNetwork(item)}
        disabled={switching}
      >
        <View style={styles.networkLeft}>
          {/* Chain Symbol Badge */}
          <View
            style={[
              styles.symbolBadge,
              {
                backgroundColor: isTestnet
                  ? theme.colors.warning + '20'
                  : theme.colors.success + '20',
              },
            ]}
          >
            <Text
              style={[
                styles.symbolText,
                {
                  color: isTestnet ? theme.colors.warning : theme.colors.success,
                },
              ]}
            >
              {item.symbol}
            </Text>
          </View>

          <View style={styles.networkInfo}>
            <Text style={[styles.networkName, { color: theme.colors.text.primary }]}>
              {item.name}
            </Text>
            <Text style={[styles.networkType, { color: theme.colors.text.secondary }]}>
              {item.type === 'testnet' ? i18n.t('network.testnet') : i18n.t('network.mainnet')}
            </Text>
          </View>
        </View>

        {/* Selection Indicator */}
        {isSelected && (
          <View style={[styles.selectedIndicator, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.divider }]}>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              {i18n.t('network.selectNetwork')}
            </Text>
            <TouchableOpacity
              testID="close-button"
              onPress={onClose}
              style={styles.closeButton}
              disabled={switching}
            >
              <Text style={[styles.closeText, { color: theme.colors.primary }]}>
                {i18n.t('common.close')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Network List */}
          {switching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
                {i18n.t('network.switching')}
              </Text>
            </View>
          ) : (
            <FlatList
              testID="network-list"
              data={availableChains}
              renderItem={renderNetworkItem}
              keyExtractor={item => item.chainId.toString()}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  checkmark: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  listContent: {
    padding: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flex: 1,
    marginTop: 100,
  },
  modalOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
  },
  networkInfo: {
    flex: 1,
    marginLeft: 12,
  },
  networkItem: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    padding: 16,
  },
  networkLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  networkName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  networkType: {
    fontSize: 12,
  },
  selectedIndicator: {
    alignItems: 'center',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  symbolBadge: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  symbolText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default NetworkSelector;
