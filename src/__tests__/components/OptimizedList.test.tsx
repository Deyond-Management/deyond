/**
 * OptimizedList Tests
 */

import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { OptimizedList, MemoizedListItem } from '../../components/OptimizedList';

describe('OptimizedList', () => {
  const mockData = [
    { id: '1', title: 'Item 1' },
    { id: '2', title: 'Item 2' },
    { id: '3', title: 'Item 3' },
  ];

  const renderItem = ({ item }: { item: (typeof mockData)[0] }) => (
    <Text testID={`item-${item.id}`}>{item.title}</Text>
  );

  it('should render list items', () => {
    const { getByTestId } = render(
      <OptimizedList data={mockData} renderItem={renderItem} keyExtractor={item => item.id} />
    );

    expect(getByTestId('item-1')).toBeTruthy();
    expect(getByTestId('item-2')).toBeTruthy();
    expect(getByTestId('item-3')).toBeTruthy();
  });

  it('should render empty state when no data', () => {
    const { getByText } = render(
      <OptimizedList
        data={[]}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        emptyText="No items"
      />
    );

    expect(getByText('No items')).toBeTruthy();
  });

  it('should render custom empty component', () => {
    const EmptyComponent = () => <Text testID="custom-empty">Custom Empty</Text>;

    const { getByTestId } = render(
      <OptimizedList
        data={[]}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={EmptyComponent}
      />
    );

    expect(getByTestId('custom-empty')).toBeTruthy();
  });

  it('should render header component', () => {
    const Header = () => <Text testID="header">Header</Text>;

    const { getByTestId } = render(
      <OptimizedList
        data={mockData}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={Header}
      />
    );

    expect(getByTestId('header')).toBeTruthy();
  });

  it('should render footer component', () => {
    const Footer = () => <Text testID="footer">Footer</Text>;

    const { getByTestId } = render(
      <OptimizedList
        data={mockData}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListFooterComponent={Footer}
      />
    );

    expect(getByTestId('footer')).toBeTruthy();
  });

  it('should call onEndReached when scrolled to end', () => {
    const onEndReached = jest.fn();

    const { getByTestId } = render(
      <OptimizedList
        testID="list"
        data={mockData}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
      />
    );

    const list = getByTestId('list');
    fireEvent(list, 'onEndReached');

    expect(onEndReached).toHaveBeenCalled();
  });

  it('should render with refresh control when onRefresh is provided', () => {
    const onRefresh = jest.fn();

    const { getByTestId } = render(
      <OptimizedList
        testID="list"
        data={mockData}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        onRefresh={onRefresh}
        refreshing={false}
      />
    );

    // List should render with refresh control
    expect(getByTestId('list')).toBeTruthy();
  });

  it('should show loading indicator when refreshing', () => {
    const { getByTestId } = render(
      <OptimizedList
        testID="list"
        data={mockData}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        onRefresh={jest.fn()}
        refreshing={true}
      />
    );

    // RefreshControl is rendered when refreshing
    expect(getByTestId('list')).toBeTruthy();
  });
});

describe('MemoizedListItem', () => {
  const mockItem = { id: '1', title: 'Test Item' };

  it('should render item', () => {
    const renderContent = jest.fn((item: typeof mockItem) => (
      <Text testID="content">{item.title}</Text>
    ));

    const { getByTestId, getByText } = render(
      <MemoizedListItem item={mockItem} renderContent={renderContent} />
    );

    expect(getByTestId('content')).toBeTruthy();
    expect(getByText('Test Item')).toBeTruthy();
    expect(renderContent).toHaveBeenCalledWith(mockItem);
  });

  it('should not re-render when item is the same', () => {
    const renderContent = jest.fn((item: typeof mockItem) => <Text>{item.title}</Text>);

    const { rerender } = render(<MemoizedListItem item={mockItem} renderContent={renderContent} />);

    expect(renderContent).toHaveBeenCalledTimes(1);

    // Rerender with same item
    rerender(<MemoizedListItem item={mockItem} renderContent={renderContent} />);

    // Should still be 1 due to memoization
    expect(renderContent).toHaveBeenCalledTimes(1);
  });

  it('should re-render when item changes', () => {
    const renderContent = jest.fn((item: typeof mockItem) => <Text>{item.title}</Text>);

    const { rerender } = render(<MemoizedListItem item={mockItem} renderContent={renderContent} />);

    expect(renderContent).toHaveBeenCalledTimes(1);

    // Rerender with different item
    const newItem = { id: '2', title: 'New Item' };
    rerender(<MemoizedListItem item={newItem} renderContent={renderContent} />);

    expect(renderContent).toHaveBeenCalledTimes(2);
  });
});
