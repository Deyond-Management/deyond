/**
 * NFTGalleryScreen
 * Displays user's NFT collection in a grid layout
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { NFT, NFTCollection } from '../types/nft';
import NFTService from '../services/nft/NFTService';
import { EmptyState } from '../components/atoms/EmptyState';
import { LoadingState } from '../components/atoms/LoadingState';
import i18n from '../i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_COLUMNS = 2;
const GRID_SPACING = 12;
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - (GRID_COLUMNS + 1) * GRID_SPACING) / GRID_COLUMNS;

interface NFTGalleryScreenProps {
  navigation: any;
  route?: {
    params?: {
      walletAddress?: string;
    };
  };
}

type ViewMode = 'nfts' | 'collections';

export const NFTGalleryScreen: React.FC<NFTGalleryScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const nftService = useMemo(() => new NFTService(), []);

  // Props
  const walletAddress = route?.params?.walletAddress || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('nfts');
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [collections, setCollections] = useState<NFTCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Initial load
  useEffect(() => {
    loadNFTs(0, true);
  }, [viewMode]);

  // Load NFTs
  const loadNFTs = useCallback(
    async (page: number, isInitial: boolean = false) => {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        if (viewMode === 'nfts') {
          const fetchedNFTs = await nftService.getNFTs({
            owner: walletAddress,
            page,
            pageSize: 20,
          });

          if (isInitial) {
            setNfts(fetchedNFTs);
          } else {
            setNfts(prev => [...prev, ...fetchedNFTs]);
          }

          setHasMore(fetchedNFTs.length === 20);
          setCurrentPage(page);
        } else {
          const fetchedCollections = await nftService.getCollections(walletAddress);
          setCollections(fetchedCollections);
        }
      } catch (error) {
        console.error('Failed to load NFTs:', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [viewMode, walletAddress, nftService]
  );

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    nftService.clearCache();
    await loadNFTs(0, true);
    setRefreshing(false);
  }, [loadNFTs, nftService]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading && viewMode === 'nfts') {
      loadNFTs(currentPage + 1, false);
    }
  }, [loadingMore, hasMore, loading, currentPage, viewMode, loadNFTs]);

  // Handle NFT press
  const handleNFTPress = useCallback(
    (nft: NFT) => {
      navigation.navigate('NFTDetail', { nft });
    },
    [navigation]
  );

  // Handle collection press
  const handleCollectionPress = useCallback((collection: NFTCollection) => {
    // TODO: Filter NFTs by collection
    console.log('Collection pressed:', collection);
  }, []);

  // Render NFT item
  const renderNFTItem = useCallback(
    ({ item, index }: { item: NFT; index: number }) => (
      <TouchableOpacity
        testID={`nft-item-${index}`}
        style={[
          styles.gridItem,
          {
            width: GRID_ITEM_WIDTH,
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.divider,
          },
        ]}
        onPress={() => handleNFTPress(item)}
        activeOpacity={0.8}
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.nftImage} resizeMode="cover" />
        ) : (
          <View style={[styles.nftImagePlaceholder, { backgroundColor: theme.colors.divider }]}>
            <Text style={[styles.nftImagePlaceholderText, { color: theme.colors.text.secondary }]}>
              NFT
            </Text>
          </View>
        )}

        <View style={styles.nftInfo}>
          <Text style={[styles.nftName, { color: theme.colors.text.primary }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text
            style={[styles.nftCollection, { color: theme.colors.text.secondary }]}
            numberOfLines={1}
          >
            {item.collectionName || 'Unknown'}
          </Text>
        </View>
      </TouchableOpacity>
    ),
    [theme, handleNFTPress]
  );

  // Render collection item
  const renderCollectionItem = useCallback(
    ({ item }: { item: NFTCollection }) => (
      <TouchableOpacity
        style={[
          styles.collectionItem,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.divider },
        ]}
        onPress={() => handleCollectionPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.collectionLeft}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.collectionImage}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[styles.collectionImagePlaceholder, { backgroundColor: theme.colors.divider }]}
            >
              <Text
                style={[
                  styles.collectionImagePlaceholderText,
                  { color: theme.colors.text.secondary },
                ]}
              >
                {item.symbol.substring(0, 2)}
              </Text>
            </View>
          )}

          <View style={styles.collectionInfo}>
            <Text style={[styles.collectionName, { color: theme.colors.text.primary }]}>
              {item.name}
            </Text>
            <Text style={[styles.collectionCount, { color: theme.colors.text.secondary }]}>
              {i18n.t(item.ownedCount === 1 ? 'nft.itemCount_one' : 'nft.itemCount_other', {
                count: item.ownedCount,
              })}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [theme, handleCollectionPress]
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            {i18n.t('nft.title')}
          </Text>
        </View>
        <LoadingState message={i18n.t('common.loading')} size={80} />
      </SafeAreaView>
    );
  }

  const isEmpty = viewMode === 'nfts' ? nfts.length === 0 : collections.length === 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          {i18n.t('nft.title')}
        </Text>
      </View>

      {/* View Mode Tabs */}
      <View style={[styles.tabs, { borderBottomColor: theme.colors.divider }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            viewMode === 'nfts' && styles.tabActive,
            viewMode === 'nfts' && { borderBottomColor: theme.colors.primary },
          ]}
          onPress={() => setViewMode('nfts')}
        >
          <Text
            style={[
              styles.tabText,
              { color: theme.colors.text.secondary },
              viewMode === 'nfts' && { color: theme.colors.primary },
            ]}
          >
            {i18n.t('nft.nfts')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            viewMode === 'collections' && styles.tabActive,
            viewMode === 'collections' && { borderBottomColor: theme.colors.primary },
          ]}
          onPress={() => setViewMode('collections')}
        >
          <Text
            style={[
              styles.tabText,
              { color: theme.colors.text.secondary },
              viewMode === 'collections' && { color: theme.colors.primary },
            ]}
          >
            {i18n.t('nft.collections')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isEmpty ? (
        <View testID="empty-state" style={styles.emptyContainer}>
          <EmptyState
            title={i18n.t('nft.empty.title')}
            message={i18n.t('nft.empty.message')}
            icon="nft"
          />
        </View>
      ) : viewMode === 'nfts' ? (
        <FlatList
          testID="nft-list"
          data={nfts}
          renderItem={renderNFTItem}
          keyExtractor={item => item.id}
          numColumns={GRID_COLUMNS}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : null
          }
        />
      ) : (
        <FlatList
          testID="collection-list"
          data={collections}
          renderItem={renderCollectionItem}
          keyExtractor={item => item.contractAddress}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  collectionCount: {
    fontSize: 12,
  },
  collectionImage: {
    borderRadius: 8,
    height: 60,
    width: 60,
  },
  collectionImagePlaceholder: {
    alignItems: 'center',
    borderRadius: 8,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  collectionImagePlaceholderText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  collectionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  collectionItem: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 12,
  },
  collectionLeft: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  collectionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  footerLoader: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  gridContent: {
    padding: GRID_SPACING,
  },
  gridItem: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: GRID_SPACING,
    overflow: 'hidden',
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  header: {
    padding: 16,
  },
  listContent: {
    padding: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  nftCollection: {
    fontSize: 12,
  },
  nftImage: {
    aspectRatio: 1,
    width: '100%',
  },
  nftImagePlaceholder: {
    alignItems: 'center',
    aspectRatio: 1,
    justifyContent: 'center',
    width: '100%',
  },
  nftImagePlaceholderText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  nftInfo: {
    padding: 8,
  },
  nftName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  tab: {
    borderBottomWidth: 2,
    borderColor: 'transparent',
    flex: 1,
    paddingVertical: 12,
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabs: {
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default NFTGalleryScreen;
