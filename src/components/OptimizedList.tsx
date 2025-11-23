/**
 * OptimizedList
 * Performance-optimized FlatList wrapper
 */

import React, { memo, useCallback, useMemo } from 'react';
import {
  FlatList,
  FlatListProps,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  ListRenderItem,
} from 'react-native';

interface OptimizedListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  emptyText?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  testID?: string;
}

export function OptimizedList<T>({
  data,
  renderItem,
  keyExtractor,
  emptyText = 'No items',
  onRefresh,
  refreshing = false,
  ListEmptyComponent,
  ListHeaderComponent,
  ListFooterComponent,
  onEndReached,
  onEndReachedThreshold = 0.5,
  testID,
  ...props
}: OptimizedListProps<T>) {
  // Memoize render item callback
  const memoizedRenderItem = useCallback(
    (info: { item: T; index: number }) => renderItem(info),
    [renderItem]
  );

  // Default empty component
  const DefaultEmpty = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    ),
    [emptyText]
  );

  // Refresh control
  const refreshControl = useMemo(
    () =>
      onRefresh ? (
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      ) : undefined,
    [onRefresh, refreshing]
  );

  // Get item layout for fixed height items (improves performance)
  const getItemLayout = useCallback(
    (_data: T[] | null | undefined, index: number) => ({
      length: 80, // Approximate item height
      offset: 80 * index,
      index,
    }),
    []
  );

  return (
    <FlatList
      testID={testID}
      data={data}
      renderItem={memoizedRenderItem}
      keyExtractor={keyExtractor}
      ListEmptyComponent={ListEmptyComponent || DefaultEmpty}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      refreshControl={refreshControl}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      // Performance optimizations
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={5}
      // Optional: use if all items have same height
      // getItemLayout={getItemLayout}
      {...props}
    />
  );
}

// Memoized list item wrapper
interface MemoizedListItemProps<T> {
  item: T;
  renderContent: (item: T) => React.ReactElement;
}

function MemoizedListItemComponent<T>({
  item,
  renderContent,
}: MemoizedListItemProps<T>) {
  return renderContent(item);
}

// Use memo with custom comparison
export const MemoizedListItem = memo(
  MemoizedListItemComponent,
  (prevProps, nextProps) => {
    // Only re-render if item reference changes
    return prevProps.item === nextProps.item;
  }
) as typeof MemoizedListItemComponent;

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default OptimizedList;
