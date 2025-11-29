/**
 * ChatHomeScreen
 * Shows list of active chat sessions and new chat button
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { EmptyState } from '../components/atoms/EmptyState';
import i18n from '../i18n';

interface ChatSession {
  id: string;
  peerAddress: string;
  peerName: string;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
  isActive: boolean;
}

interface ChatHomeScreenProps {
  navigation: any;
  initialSessions?: ChatSession[];
}

export const ChatHomeScreen: React.FC<ChatHomeScreenProps> = ({
  navigation,
  initialSessions = [],
}) => {
  const { theme } = useTheme();
  const [sessions] = useState<ChatSession[]>(initialSessions);

  // Format time
  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return i18n.t('chatHome.time.minutes', { minutes });
    if (hours < 24) return i18n.t('chatHome.time.hours', { hours });
    return i18n.t('chatHome.time.days', { days });
  };

  // Handle new chat
  const handleNewChat = () => {
    navigation.navigate('DeviceDiscovery');
  };

  // Handle session press
  const handleSessionPress = (session: ChatSession) => {
    navigation.navigate('ChatConversation', { sessionId: session.id });
  };

  // Render session item
  const renderSession = ({ item }: { item: ChatSession }) => (
    <TouchableOpacity
      testID={`session-item-${item.id}`}
      style={[
        styles.sessionItem,
        { backgroundColor: theme.colors.card, borderColor: theme.colors.divider },
      ]}
      onPress={() => handleSessionPress(item)}
    >
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: theme.colors.primary + '30' }]}>
        <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
          {item.peerName.charAt(0).toUpperCase()}
        </Text>
        {item.isActive && (
          <View
            testID={`active-indicator-${item.id}`}
            style={[styles.activeIndicator, { backgroundColor: theme.colors.success }]}
          />
        )}
      </View>

      {/* Content */}
      <View style={styles.sessionContent}>
        <View style={styles.sessionHeader}>
          <Text style={[styles.peerName, { color: theme.colors.text.primary }]} numberOfLines={1}>
            {item.peerName}
          </Text>
          <Text style={[styles.time, { color: theme.colors.text.secondary }]}>
            {formatTime(item.lastMessageTime)}
          </Text>
        </View>
        <View style={styles.sessionFooter}>
          <Text
            style={[
              styles.lastMessage,
              {
                color:
                  item.unreadCount > 0 ? theme.colors.text.primary : theme.colors.text.secondary,
                fontWeight: item.unreadCount > 0 ? '600' : '400',
              },
            ]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.unreadCount > 0 && (
            <View
              testID={`unread-badge-${item.id}`}
              style={[styles.badge, { backgroundColor: theme.colors.primary }]}
            >
              <Text style={styles.badgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          {i18n.t('chatHome.title')}
        </Text>
        <TouchableOpacity
          testID="new-chat-button"
          style={[styles.newChatButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleNewChat}
          accessibilityLabel={i18n.t('chatHome.newChat')}
        >
          <Text style={styles.newChatText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Session List */}
      {sessions.length > 0 ? (
        <FlatList
          testID="session-list"
          data={sessions}
          renderItem={renderSession}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View testID="empty-state" style={styles.emptyContainer}>
          <EmptyState
            title={i18n.t('chatHome.empty.title')}
            message={i18n.t('chatHome.empty.message')}
            icon="search"
            actionLabel={i18n.t('chatHome.empty.action')}
            onAction={handleNewChat}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  activeIndicator: {
    borderColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 2,
    bottom: 2,
    height: 12,
    position: 'absolute',
    right: 2,
    width: 12,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
    width: 50,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
  },
  badge: {
    alignItems: 'center',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    marginLeft: 8,
    minWidth: 20,
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  newChatButton: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  newChatText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  peerName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  safeArea: {
    flex: 1,
  },
  sessionContent: {
    flex: 1,
  },
  sessionFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sessionItem: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 12,
    padding: 12,
  },
  time: {
    fontSize: 12,
    marginLeft: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
});

export default ChatHomeScreen;
