/**
 * OptimizedFlatList
 * A performance-optimized FlatList wrapper
 */

import React, { memo, useCallback, useMemo } from 'react';
import {
  FlatList,
  FlatListProps,
  ListRenderItemInfo,
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
} from 'react-native';

interface OptimizedFlatListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  renderItem: (item: T, index: number) => React.ReactElement;
  estimatedItemSize?: number;
  loadingMore?: boolean;
  emptyText?: string;
  emptyComponent?: React.ReactNode;
  headerComponent?: React.ReactNode;
  footerComponent?: React.ReactNode;
}

function OptimizedFlatListInner<T>(props: OptimizedFlatListProps<T>): React.ReactElement {
  const {
    data,
    renderItem,
    keyExtractor,
    estimatedItemSize = 80,
    loadingMore = false,
    emptyText = 'No items',
    emptyComponent,
    headerComponent,
    footerComponent,
    ...rest
  } = props;

  // Memoized render item wrapper
  const renderItemCallback = useCallback(
    ({ item, index }: ListRenderItemInfo<T>) => renderItem(item, index),
    [renderItem]
  );

  // Default key extractor
  const defaultKeyExtractor = useCallback((item: T, index: number) => {
    if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, any>;
      if ('id' in obj) return String(obj.id);
      if ('key' in obj) return String(obj.key);
    }
    return String(index);
  }, []);

  // Empty component
  const ListEmptyComponent = useMemo(() => {
    if (emptyComponent) return <>{emptyComponent}</>;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }, [emptyComponent, emptyText]);

  // Header component
  const ListHeaderComponent = useMemo(() => {
    if (!headerComponent) return null;
    return <>{headerComponent}</>;
  }, [headerComponent]);

  // Footer component with loading indicator
  const ListFooterComponent = useMemo(() => {
    return (
      <View>
        {footerComponent}
        {loadingMore && (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" />
          </View>
        )}
      </View>
    );
  }, [footerComponent, loadingMore]);

  // Performance optimizations
  const getItemLayout = useMemo(() => {
    if (!estimatedItemSize) return undefined;
    return (_: ArrayLike<T> | null | undefined, index: number) => ({
      length: estimatedItemSize,
      offset: estimatedItemSize * index,
      index,
    });
  }, [estimatedItemSize]);

  return (
    <FlatList
      data={data}
      renderItem={renderItemCallback}
      keyExtractor={keyExtractor || defaultKeyExtractor}
      ListEmptyComponent={ListEmptyComponent}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      getItemLayout={getItemLayout}
      // Performance optimizations
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      windowSize={11}
      initialNumToRender={10}
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
      }}
      {...rest}
    />
  );
}

// Memoized version
export const OptimizedFlatList = memo(OptimizedFlatListInner) as typeof OptimizedFlatListInner;

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingMore: {
    padding: 16,
    alignItems: 'center',
  },
});

export default OptimizedFlatList;
