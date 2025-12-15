/**
 * TokenSelectorModal
 * Modal for selecting tokens for swap
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  TextInput,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { SwapToken } from '../../types/swap';

interface TokenSelectorModalProps {
  visible: boolean;
  tokens: SwapToken[];
  selectedTokenAddress?: string;
  onSelect: (token: SwapToken) => void;
  onClose: () => void;
  title?: string;
}

export const TokenSelectorModal: React.FC<TokenSelectorModalProps> = ({
  visible,
  tokens,
  selectedTokenAddress,
  onSelect,
  onClose,
  title = 'Select Token',
}) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tokens based on search query
  const filteredTokens = tokens.filter(
    token =>
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.address.toLowerCase().includes(searchQuery.toLowerCase())
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
                <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  testID="close-button"
                >
                  <Text style={[styles.closeText, { color: colors.textSecondary }]}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Search Input */}
              <View style={[styles.searchContainer, { borderBottomColor: colors.divider }]}>
                <TextInput
                  style={[styles.searchInput, { color: colors.text.primary }]}
                  placeholder="Search name or paste address"
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Token List */}
              <ScrollView style={styles.tokenList}>
                {filteredTokens.length > 0 ? (
                  filteredTokens.map(token => {
                    const isSelected = token.address === selectedTokenAddress;

                    return (
                      <TouchableOpacity
                        key={token.address}
                        style={[
                          styles.tokenItem,
                          { borderBottomColor: colors.divider },
                          isSelected && { backgroundColor: colors.surface },
                        ]}
                        onPress={() => {
                          onSelect(token);
                          onClose();
                        }}
                        accessibilityLabel={token.name}
                        accessibilityRole="button"
                      >
                        <View style={styles.tokenInfo}>
                          {/* Token Icon Placeholder */}
                          <View
                            style={[styles.tokenIcon, { backgroundColor: colors.primary + '20' }]}
                          >
                            <Text style={[styles.tokenIconText, { color: colors.primary }]}>
                              {token.symbol.charAt(0)}
                            </Text>
                          </View>

                          <View style={styles.tokenDetails}>
                            <Text style={[styles.tokenName, { color: colors.text.primary }]}>
                              {token.symbol}
                            </Text>
                            <Text style={[styles.tokenFullName, { color: colors.textSecondary }]}>
                              {token.name}
                            </Text>
                          </View>
                        </View>

                        {/* Selected indicator */}
                        {isSelected && (
                          <View
                            testID={`token-selected-${token.address}`}
                            style={[styles.selectedIndicator, { backgroundColor: colors.primary }]}
                          >
                            <Text style={styles.checkmark}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      No tokens found
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 20,
  },
  searchContainer: {
    borderBottomWidth: 1,
    padding: 16,
  },
  searchInput: {
    fontSize: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
  },
  tokenList: {
    paddingBottom: 32,
  },
  tokenItem: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  tokenInfo: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tokenIconText: {
    fontSize: 18,
    fontWeight: '600',
  },
  tokenDetails: {
    flex: 1,
  },
  tokenName: {
    fontSize: 16,
    fontWeight: '500',
  },
  tokenFullName: {
    fontSize: 14,
    marginTop: 2,
  },
  selectedIndicator: {
    alignItems: 'center',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
  },
});

export default TokenSelectorModal;
