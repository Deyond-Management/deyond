/**
 * NFTDetailScreen
 * Displays detailed information about a single NFT
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Share,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { NFT } from '../types/nft';
import { getChainManager } from '../services/blockchain/ChainManager';
import i18n from '../i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_SIZE = SCREEN_WIDTH - 32;

interface NFTDetailScreenProps {
  navigation: any;
  route: {
    params: {
      nft: NFT;
    };
  };
}

export const NFTDetailScreen: React.FC<NFTDetailScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { nft } = route.params;
  const chainManager = useMemo(() => getChainManager(), []);

  // Get blockchain info
  const chainConfig = useMemo(() => {
    return chainManager.getChainConfig(nft.chainId);
  }, [nft.chainId, chainManager]);

  // Handle view on explorer
  const handleViewOnExplorer = () => {
    const explorerUrl = chainManager.getTokenExplorerUrl(
      nft.chainId,
      nft.contractAddress,
      nft.tokenId
    );
    Linking.openURL(explorerUrl);
  };

  // Handle share
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this NFT: ${nft.name}\n${chainManager.getTokenExplorerUrl(
          nft.chainId,
          nft.contractAddress,
          nft.tokenId
        )}`,
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  // Handle send
  const handleSend = () => {
    // TODO: Navigate to send screen with NFT pre-selected
    console.log('Send NFT:', nft.id);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* NFT Image */}
        <View style={styles.imageContainer}>
          {nft.imageUrl ? (
            <Image
              source={{ uri: nft.imageUrl }}
              style={[styles.nftImage, { backgroundColor: theme.colors.divider }]}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.nftImagePlaceholder, { backgroundColor: theme.colors.divider }]}>
              <Text
                style={[styles.nftImagePlaceholderText, { color: theme.colors.text.secondary }]}
              >
                NFT
              </Text>
            </View>
          )}
        </View>

        {/* NFT Info */}
        <View style={styles.infoSection}>
          <Text style={[styles.collectionName, { color: theme.colors.text.secondary }]}>
            {nft.collectionName || 'Unknown Collection'}
          </Text>
          <Text style={[styles.nftName, { color: theme.colors.text.primary }]}>{nft.name}</Text>
        </View>

        {/* Description */}
        {nft.description && (
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              {i18n.t('nft.detail.description')}
            </Text>
            <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
              {nft.description}
            </Text>
          </View>
        )}

        {/* Properties */}
        {nft.attributes && nft.attributes.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              {i18n.t('nft.detail.properties')}
            </Text>
            <View style={styles.propertiesGrid}>
              {nft.attributes.map((attr, index) => (
                <View
                  key={index}
                  style={[
                    styles.propertyItem,
                    { backgroundColor: theme.colors.card, borderColor: theme.colors.divider },
                  ]}
                >
                  <Text style={[styles.propertyType, { color: theme.colors.text.secondary }]}>
                    {attr.trait_type}
                  </Text>
                  <Text style={[styles.propertyValue, { color: theme.colors.text.primary }]}>
                    {attr.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            {i18n.t('nft.detail.details')}
          </Text>
          <View style={[styles.detailsCard, { backgroundColor: theme.colors.card }]}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                {i18n.t('nft.detail.contractAddress')}
              </Text>
              <Text
                style={[styles.detailValue, { color: theme.colors.text.primary }]}
                numberOfLines={1}
              >
                {nft.contractAddress.slice(0, 6)}...{nft.contractAddress.slice(-4)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                {i18n.t('nft.detail.tokenId')}
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                {nft.tokenId}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                {i18n.t('nft.detail.tokenStandard')}
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                {nft.standard}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                {i18n.t('nft.detail.blockchain')}
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                {chainConfig?.name || 'Unknown'}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.divider },
            ]}
            onPress={handleViewOnExplorer}
          >
            <Text style={[styles.actionButtonText, { color: theme.colors.text.primary }]}>
              {i18n.t('nft.detail.viewOnExplorer')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.divider },
            ]}
            onPress={handleShare}
          >
            <Text style={[styles.actionButtonText, { color: theme.colors.text.primary }]}>
              {i18n.t('nft.detail.share')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.sendButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={handleSend}
          >
            <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
              {i18n.t('nft.detail.send')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  collectionName: {
    fontSize: 14,
    marginBottom: 4,
  },
  container: {
    flex: 1,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  detailLabel: {
    flex: 1,
    fontSize: 14,
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  detailsCard: {
    borderRadius: 12,
    marginTop: 12,
    padding: 16,
  },
  imageContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  nftImage: {
    borderRadius: 16,
    height: IMAGE_SIZE,
    width: IMAGE_SIZE,
  },
  nftImagePlaceholder: {
    alignItems: 'center',
    borderRadius: 16,
    height: IMAGE_SIZE,
    justifyContent: 'center',
    width: IMAGE_SIZE,
  },
  nftImagePlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  nftName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  propertiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  propertyItem: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    marginRight: 8,
    padding: 12,
    width: (SCREEN_WIDTH - 48) / 2,
  },
  propertyType: {
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  propertyValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 16,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sendButton: {
    borderWidth: 0,
  },
});

export default NFTDetailScreen;
