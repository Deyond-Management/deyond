/**
 * ChatHomeScreen
 * Shows list of active chat sessions with end-to-end encryption
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { EmptyState } from '../components/atoms/EmptyState';
import { LoadingState } from '../components/atoms/LoadingState';
import { useDeyondCrypt, ChatSession } from '../hooks';
import i18n from '../i18n';

interface ChatHomeScreenProps {
  navigation: any;
  initialSessions?: ChatSession[];
}

export const ChatHomeScreen: React.FC<ChatHomeScreenProps> = ({ navigation, initialSessions }) => {
  const { theme } = useTheme();
  const { isInitialized, isLoading, hasIdentity, sessions, initialize } = useDeyondCrypt();

  // Use initial sessions for testing, otherwise use hook sessions
  const displaySessions = initialSessions || sessions;

  // Format time
  const formatTime = useCallback((timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return i18n.t('chatHome.time.minutes', { minutes });
    if (hours < 24) return i18n.t('chatHome.time.hours', { hours });
    return i18n.t('chatHome.time.days', { days });
  }, []);

  // Handle new chat
  const handleNewChat = useCallback(() => {
    if (!hasIdentity) {
      // Need to setup messaging first
      navigation.navigate('MessagingSetup');
    } else {
      navigation.navigate('DeviceDiscovery');
    }
  }, [navigation, hasIdentity]);

  // Handle session press
  const handleSessionPress = useCallback(
    (session: ChatSession) => {
      navigation.navigate('ChatConversation', {
        sessionId: session.id,
        peerName: session.peerName,
        peerAddress: session.peerAddress,
      });
    },
    [navigation]
  );

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await initialize();
  }, [initialize]);

  // Render session item
  const renderSession = useCallback(
    ({ item }: { item: ChatSession }) => (
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
            <View style={styles.messageRow}>
              {/* Encryption indicator */}
              <Text style={[styles.encryptionIcon, { color: theme.colors.success }]}>🔒</Text>
              <Text
                style={[
                  styles.lastMessage,
                  {
                    color:
                      item.unreadCount > 0
                        ? theme.colors.text.primary
                        : theme.colors.text.secondary,
                    fontWeight: item.unreadCount > 0 ? '600' : '400',
                  },
                ]}
                numberOfLines={1}
              >
                {item.lastMessage || i18n.t('chatHome.noMessages')}
              </Text>
            </View>
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
    ),
    [theme, formatTime, handleSessionPress]
  );

  // Render setup prompt
  const renderSetupPrompt = () => (
    <View testID="setup-prompt" style={styles.setupContainer}>
      <View style={[styles.setupCard, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.setupIcon]}>🔐</Text>
        <Text style={[styles.setupTitle, { color: theme.colors.text.primary }]}>
          {i18n.t('chatHome.setup.title')}
        </Text>
        <Text style={[styles.setupDescription, { color: theme.colors.text.secondary }]}>
          {i18n.t('chatHome.setup.description')}
        </Text>
        <TouchableOpacity
          testID="setup-button"
          style={[styles.setupButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('MessagingSetup')}
        >
          <Text style={styles.setupButtonText}>{i18n.t('chatHome.setup.button')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Show loading state
  if (isLoading && !isInitialized) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <LoadingState message={i18n.t('chatHome.loading')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            {i18n.t('chatHome.title')}
          </Text>
          {hasIdentity && (
            <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
              {i18n.t('chatHome.encrypted')}
            </Text>
          )}
        </View>
        <TouchableOpacity
          testID="new-chat-button"
          style={[styles.newChatButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleNewChat}
          accessibilityLabel={i18n.t('chatHome.newChat')}
        >
          <Text style={styles.newChatText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Show setup prompt if no identity */}
      {!hasIdentity && !initialSessions ? (
        renderSetupPrompt()
      ) : displaySessions.length > 0 ? (
        <FlatList
          testID="session-list"
          data={displaySessions}
          renderItem={renderSession}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
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
  encryptionIcon: {
    fontSize: 12,
    marginRight: 4,
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
  messageRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
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
  setupButton: {
    borderRadius: 12,
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  setupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  setupCard: {
    alignItems: 'center',
    borderRadius: 16,
    margin: 16,
    padding: 24,
  },
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  setupDescription: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  setupIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  setupTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
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
