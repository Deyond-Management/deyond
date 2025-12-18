/**
 * TokenListScreen
 * Displays all tokens with search and filtering capabilities
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { TokenCard } from '../components/molecules/TokenCard';
import { TokenCardSkeleton } from '../components/atoms/SkeletonLoader';
import { EmptyState } from '../components/atoms/EmptyState';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { refreshTokenBalances, selectTokens, selectTokenLoading } from '../store/slices/tokenSlice';
import i18n from '../i18n';

interface TokenListScreenProps {
  navigation: any;
}

type SortOption = 'name' | 'balance' | 'value' | 'change';
type SortOrder = 'asc' | 'desc';

export const TokenListScreen: React.FC<TokenListScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('value');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [refreshing, setRefreshing] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Redux state
  const tokens = useAppSelector(selectTokens);
  const isLoading = useAppSelector(selectTokenLoading);

  // Wallet address (would come from Redux in real app)
  const walletAddress = '0x1234567890123456789012345678901234567890';

  // Filter and sort tokens
  const filteredAndSortedTokens = useMemo(() => {
    let result = [...tokens];

    // Filter by search query
    if (searchQuery.length > 0) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        token =>
          token.name.toLowerCase().includes(query) || token.symbol.toLowerCase().includes(query)
      );
    }

    // Sort tokens
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'balance':
          comparison = parseFloat(a.balance) - parseFloat(b.balance);
          break;
        case 'value':
          comparison = parseFloat(a.usdValue) - parseFloat(b.usdValue);
          break;
        case 'change':
          comparison = (a.priceChange24h || 0) - (b.priceChange24h || 0);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [tokens, searchQuery, sortBy, sortOrder]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(refreshTokenBalances(walletAddress));
    setRefreshing(false);
  }, [dispatch, walletAddress]);

  // Handle token press
  const handleTokenPress = useCallback(
    (symbol: string) => {
      navigation.navigate('TokenDetails', { symbol });
    },
    [navigation]
  );

  // Handle sort option press
  const handleSortPress = useCallback((option: SortOption) => {
    setSortBy(prev => {
      if (prev === option) {
        setSortOrder(order => (order === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortOrder('desc');
      return option;
    });
  }, []);

  // Render sort button
  const renderSortButton = (option: SortOption, label: string) => {
    const isActive = sortBy === option;
    return (
      <TouchableOpacity
        key={option}
        style={[styles.sortButton, isActive && { backgroundColor: theme.colors.primary + '20' }]}
        onPress={() => handleSortPress(option)}
        accessibilityRole="button"
        accessibilityLabel={`${i18n.t('tokenList.sortBy')} ${label}`}
        accessibilityState={{ selected: isActive }}
      >
        <Text
          style={[
            styles.sortButtonText,
            { color: isActive ? theme.colors.primary : theme.colors.text.secondary },
          ]}
        >
          {label}
          {isActive && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render token item
  const renderTokenItem = useCallback(
    ({ item, index }: { item: (typeof tokens)[0]; index: number }) => (
      <TokenCard
        symbol={item.symbol}
        name={item.name}
        balance={item.balance}
        usdValue={item.usdValue}
        priceChange24h={item.priceChange24h}
        onPress={() => handleTokenPress(item.symbol)}
        testID={`token-card-${index}`}
        style={styles.tokenCard}
      />
    ),
    [handleTokenPress]
  );

  if (isLoading && tokens.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            {i18n.t('tokenList.title')}
          </Text>
        </View>
        <View style={styles.skeletonContainer}>
          {[...Array(5)].map((_, index) => (
            <TokenCardSkeleton key={index} style={styles.tokenCard} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          {i18n.t('tokenList.title')}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
          {i18n.t('tokenList.tokenCount', { count: tokens.length })}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <TextInput
          testID="token-search-input"
          style={[styles.searchInput, { color: theme.colors.text.primary }]}
          placeholder={i18n.t('tokenList.searchPlaceholder')}
          placeholderTextColor={theme.colors.text.hint}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={i18n.t('tokenList.searchPlaceholder')}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
            accessibilityRole="button"
            accessibilityLabel={i18n.t('common.close')}
          >
            <Text style={[styles.clearButtonText, { color: theme.colors.text.secondary }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={[styles.sortLabel, { color: theme.colors.text.secondary }]}>
          {i18n.t('tokenList.sortBy')}:
        </Text>
        <View style={styles.sortButtons}>
          {renderSortButton('value', i18n.t('tokenList.sortOptions.value'))}
          {renderSortButton('name', i18n.t('tokenList.sortOptions.name'))}
          {renderSortButton('balance', i18n.t('tokenList.sortOptions.balance'))}
          {renderSortButton('change', i18n.t('tokenList.sortOptions.change'))}
        </View>
      </View>

      {/* Token List */}
      {filteredAndSortedTokens.length > 0 ? (
        <FlatList
          testID="token-list"
          data={filteredAndSortedTokens}
          renderItem={renderTokenItem}
          keyExtractor={item => item.symbol}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            title={
              searchQuery.length > 0
                ? i18n.t('tokenList.noSearchResults')
                : i18n.t('tokenList.noTokens')
            }
            message={
              searchQuery.length > 0
                ? i18n.t('tokenList.tryDifferentSearch')
                : i18n.t('tokenList.noTokensMessage')
            }
            icon="search"
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 16,
  },
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    padding: 16,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  searchContainer: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    marginBottom: 12,
    marginHorizontal: 16,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  skeletonContainer: {
    padding: 16,
  },
  sortButton: {
    borderRadius: 16,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sortButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sortContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  sortLabel: {
    fontSize: 12,
    marginRight: 8,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  tokenCard: {
    marginBottom: 12,
  },
});

export default TokenListScreen;
