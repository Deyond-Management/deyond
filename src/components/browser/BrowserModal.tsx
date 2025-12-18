/**
 * BrowserModal
 * Modal for displaying browser bookmarks and history
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import {
  selectBookmarks,
  selectBrowserHistory,
  removeBookmark,
  removeHistoryItem,
  clearHistory,
  Bookmark,
  BrowserHistoryItem,
} from '../../store/slices/browserSlice';
import { EmptyState } from '../atoms/EmptyState';
import i18n from '../../i18n';

interface BrowserModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectUrl: (url: string) => void;
}

type TabType = 'bookmarks' | 'history';

export const BrowserModal: React.FC<BrowserModalProps> = ({ visible, onClose, onSelectUrl }) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState<TabType>('bookmarks');

  const bookmarks = useAppSelector(selectBookmarks);
  const history = useAppSelector(selectBrowserHistory);

  // Format timestamp
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - timestamp;
    const oneDay = 1000 * 60 * 60 * 24;

    if (diff < oneDay) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diff < oneDay * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Handle URL selection
  const handleSelectUrl = useCallback(
    (url: string) => {
      onSelectUrl(url);
      onClose();
    },
    [onSelectUrl, onClose]
  );

  // Handle bookmark delete
  const handleDeleteBookmark = useCallback(
    (id: string) => {
      Alert.alert(
        i18n.t('dappBrowser.deleteBookmark'),
        i18n.t('dappBrowser.deleteBookmarkConfirm'),
        [
          { text: i18n.t('common.cancel'), style: 'cancel' },
          {
            text: i18n.t('common.delete'),
            style: 'destructive',
            onPress: () => dispatch(removeBookmark(id)),
          },
        ]
      );
    },
    [dispatch]
  );

  // Handle history item delete
  const handleDeleteHistoryItem = useCallback(
    (id: string) => {
      dispatch(removeHistoryItem(id));
    },
    [dispatch]
  );

  // Handle clear history
  const handleClearHistory = useCallback(() => {
    Alert.alert(i18n.t('dappBrowser.clearHistory'), i18n.t('dappBrowser.clearHistoryConfirm'), [
      { text: i18n.t('common.cancel'), style: 'cancel' },
      {
        text: i18n.t('common.delete'),
        style: 'destructive',
        onPress: () => dispatch(clearHistory()),
      },
    ]);
  }, [dispatch]);

  // Render bookmark item
  const renderBookmarkItem = useCallback(
    ({ item }: { item: Bookmark }) => (
      <TouchableOpacity
        style={[styles.listItem, { borderBottomColor: theme.colors.divider }]}
        onPress={() => handleSelectUrl(item.url)}
        onLongPress={() => handleDeleteBookmark(item.id)}
        accessibilityRole="button"
        accessibilityLabel={item.title}
        accessibilityHint={i18n.t('dappBrowser.tapToOpen')}
      >
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.surface }]}>
          {item.favicon ? (
            <Image
              source={{ uri: item.favicon }}
              style={styles.favicon}
              defaultSource={require('../../../assets/icon.png')}
            />
          ) : (
            <Text style={[styles.iconPlaceholder, { color: theme.colors.text.secondary }]}>🌐</Text>
          )}
        </View>
        <View style={styles.itemContent}>
          <Text style={[styles.itemTitle, { color: theme.colors.text.primary }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.itemUrl, { color: theme.colors.text.secondary }]} numberOfLines={1}>
            {item.url}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => handleDeleteBookmark(item.id)}
          style={styles.deleteButton}
          accessibilityRole="button"
          accessibilityLabel={i18n.t('common.delete')}
        >
          <Text style={[styles.deleteIcon, { color: theme.colors.error }]}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    ),
    [theme, handleSelectUrl, handleDeleteBookmark]
  );

  // Render history item
  const renderHistoryItem = useCallback(
    ({ item }: { item: BrowserHistoryItem }) => (
      <TouchableOpacity
        style={[styles.listItem, { borderBottomColor: theme.colors.divider }]}
        onPress={() => handleSelectUrl(item.url)}
        accessibilityRole="button"
        accessibilityLabel={item.title}
      >
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.surface }]}>
          {item.favicon ? (
            <Image
              source={{ uri: item.favicon }}
              style={styles.favicon}
              defaultSource={require('../../../assets/icon.png')}
            />
          ) : (
            <Text style={[styles.iconPlaceholder, { color: theme.colors.text.secondary }]}>🌐</Text>
          )}
        </View>
        <View style={styles.itemContent}>
          <Text style={[styles.itemTitle, { color: theme.colors.text.primary }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.itemUrl, { color: theme.colors.text.secondary }]} numberOfLines={1}>
            {item.url}
          </Text>
        </View>
        <Text style={[styles.timestamp, { color: theme.colors.text.hint }]}>
          {formatTime(item.visitedAt)}
        </Text>
      </TouchableOpacity>
    ),
    [theme, handleSelectUrl]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.divider }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: theme.colors.primary }]}>
              {i18n.t('common.close')}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            {activeTab === 'bookmarks'
              ? i18n.t('dappBrowser.bookmarks')
              : i18n.t('dappBrowser.history')}
          </Text>
          {activeTab === 'history' && history.length > 0 ? (
            <TouchableOpacity onPress={handleClearHistory} style={styles.clearButton}>
              <Text style={[styles.clearText, { color: theme.colors.error }]}>
                {i18n.t('common.delete')}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>

        {/* Tabs */}
        <View style={[styles.tabs, { borderBottomColor: theme.colors.divider }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'bookmarks' && styles.tabActive,
              activeTab === 'bookmarks' && { borderBottomColor: theme.colors.primary },
            ]}
            onPress={() => setActiveTab('bookmarks')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'bookmarks' }}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === 'bookmarks' ? theme.colors.primary : theme.colors.text.secondary,
                },
              ]}
            >
              ★ {i18n.t('dappBrowser.bookmarks')} ({bookmarks.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'history' && styles.tabActive,
              activeTab === 'history' && { borderBottomColor: theme.colors.primary },
            ]}
            onPress={() => setActiveTab('history')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'history' }}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === 'history' ? theme.colors.primary : theme.colors.text.secondary,
                },
              ]}
            >
              🕐 {i18n.t('dappBrowser.history')} ({history.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'bookmarks' ? (
          bookmarks.length > 0 ? (
            <FlatList
              data={bookmarks}
              renderItem={renderBookmarkItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <EmptyState
              title={i18n.t('dappBrowser.noBookmarks')}
              message={i18n.t('dappBrowser.noBookmarksMessage')}
              icon="search"
            />
          )
        ) : history.length > 0 ? (
          <FlatList
            data={history}
            renderItem={renderHistoryItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <EmptyState
            title={i18n.t('dappBrowser.noHistory')}
            message={i18n.t('dappBrowser.noHistoryMessage')}
            icon="search"
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  clearButton: {
    padding: 8,
    width: 60,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  closeButton: {
    padding: 8,
    width: 60,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    flex: 1,
  },
  deleteButton: {
    padding: 8,
  },
  deleteIcon: {
    fontSize: 16,
  },
  favicon: {
    borderRadius: 4,
    height: 24,
    width: 24,
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  iconContainer: {
    alignItems: 'center',
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  iconPlaceholder: {
    fontSize: 20,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemUrl: {
    fontSize: 12,
  },
  listContent: {
    paddingVertical: 8,
  },
  listItem: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  placeholder: {
    width: 60,
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
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabs: {
    borderBottomWidth: 1,
    flexDirection: 'row',
  },
  timestamp: {
    fontSize: 12,
    marginLeft: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default BrowserModal;
