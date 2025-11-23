/**
 * ChatHomeScreen
 * Shows list of active chat sessions and new chat button
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { EmptyState } from '../components/atoms/EmptyState';

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

    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
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
          <Text
            style={[styles.peerName, { color: theme.colors.text.primary }]}
            numberOfLines={1}
          >
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
                color: item.unreadCount > 0
                  ? theme.colors.text.primary
                  : theme.colors.text.secondary,
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
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          Messages
        </Text>
        <TouchableOpacity
          testID="new-chat-button"
          style={[styles.newChatButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleNewChat}
          accessibilityLabel="New chat"
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
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View testID="empty-state" style={styles.emptyContainer}>
          <EmptyState
            title="No conversations"
            message="Start a new chat to connect with nearby devices"
            icon="search"
            actionLabel="New Chat"
            onAction={handleNewChat}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newChatText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  sessionContent: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  peerName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  time: {
    fontSize: 12,
    marginLeft: 8,
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
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
});

export default ChatHomeScreen;
