/**
 * GroupChatScreen
 * Screen for group chat conversation
 * Features: view group messages, send encrypted messages to all members
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../contexts/ThemeContext';
import { useDeyondCrypt } from '../hooks';
import i18n from '../i18n';
import { logger } from '../utils';

type GroupChatScreenProps = NativeStackScreenProps<RootStackParamList, 'GroupChat'>;

interface GroupMessage {
  id: string;
  content: string;
  senderAddress: string;
  senderName?: string;
  timestamp: number;
  isOwn: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

const screenLogger = logger.child({ screen: 'GroupChat' });

export const GroupChatScreen: React.FC<GroupChatScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const { groupId, groupName } = route.params;

  const { myAddress, sendGroupMessage, getGroupMessages, markGroupRead } = useDeyondCrypt();

  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Load messages on mount
  useEffect(() => {
    loadMessages();
    markGroupRead?.(groupId);
  }, [groupId]);

  // Load messages
  const loadMessages = useCallback(async () => {
    try {
      const groupMsgs = await getGroupMessages?.(groupId);
      if (groupMsgs) {
        setMessages(
          groupMsgs.map((m: any) => ({
            ...m,
            isOwn: m.senderAddress === myAddress,
          }))
        );
      }
    } catch (err) {
      screenLogger.error('Failed to load messages', err as Error);
    }
  }, [groupId, getGroupMessages, myAddress]);

  // Send message
  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setInputText('');

    // Add optimistic message
    const tempId = `temp-${Date.now()}`;
    const tempMessage: GroupMessage = {
      id: tempId,
      content: text,
      senderAddress: myAddress || '',
      timestamp: Date.now(),
      isOwn: true,
      status: 'sending',
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const result = await sendGroupMessage?.(groupId, text);
      if (result) {
        setMessages(prev =>
          prev.map(m => (m.id === tempId ? { ...m, id: result.messageId, status: 'sent' } : m))
        );
      }
    } catch (err) {
      screenLogger.error('Failed to send message', err as Error);
      // Remove failed message
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsSending(false);
    }
  }, [inputText, isSending, groupId, myAddress, sendGroupMessage]);

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render message item
  const renderMessage = ({ item }: { item: GroupMessage }) => {
    const isOwn = item.isOwn;
    return (
      <View
        testID={`message-${item.id}`}
        style={[
          styles.messageContainer,
          isOwn ? styles.ownMessageContainer : styles.otherMessageContainer,
        ]}
      >
        {!isOwn && (
          <Text style={[styles.senderName, { color: colors.primary }]}>
            {item.senderName || `${item.senderAddress.slice(0, 8)}...`}
          </Text>
        )}
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isOwn ? colors.primary : colors.surface,
            },
          ]}
        >
          <Text style={[styles.messageText, { color: isOwn ? '#FFFFFF' : colors.text.primary }]}>
            {item.content}
          </Text>
        </View>
        <View style={styles.messageFooter}>
          <Text style={[styles.messageTime, { color: colors.text.disabled }]}>
            {formatTime(item.timestamp)}
          </Text>
          {isOwn && (
            <Text style={[styles.messageStatus, { color: colors.text.disabled }]}>
              {item.status === 'sending' ? '•' : item.status === 'sent' ? '✓' : '✓✓'}
            </Text>
          )}
        </View>
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>👥</Text>
      <Text style={[styles.emptyTitle, { color: colors.text.secondary }]}>
        {i18n.t('groupChat.empty.title')}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.text.disabled }]}>
        {i18n.t('groupChat.empty.subtitle')}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          testID="back-button"
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backIcon, { color: colors.primary }]}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="group-info-button"
          style={styles.headerContent}
          onPress={() => navigation.navigate('GroupInfo', { groupId })}
        >
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>{groupName}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
            {i18n.t('groupChat.tapForInfo')}
          </Text>
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          testID="messages-list"
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.messagesList, messages.length === 0 && styles.emptyList]}
          ListEmptyComponent={renderEmptyState}
          onContentSizeChange={() => messages.length > 0 && flatListRef.current?.scrollToEnd()}
        />

        {/* Input */}
        <View style={[styles.inputContainer, { borderTopColor: colors.border }]}>
          <TextInput
            testID="message-input"
            style={[
              styles.input,
              {
                color: colors.text.primary,
                backgroundColor: colors.surface,
              },
            ]}
            placeholder={i18n.t('groupChat.inputPlaceholder')}
            placeholderTextColor={colors.text.disabled}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            testID="send-button"
            style={[
              styles.sendButton,
              {
                backgroundColor: inputText.trim() ? colors.primary : colors.primary + '40',
              },
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyList: {
    flex: 1,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  flex: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    padding: 8,
  },
  headerContent: {
    alignItems: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  input: {
    borderRadius: 20,
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  inputContainer: {
    alignItems: 'flex-end',
    borderTopWidth: 1,
    flexDirection: 'row',
    padding: 8,
  },
  messageBubble: {
    borderRadius: 16,
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  messageContainer: {
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  messageFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 4,
  },
  messageStatus: {
    fontSize: 10,
    marginLeft: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 11,
  },
  messagesList: {
    paddingVertical: 16,
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  safeArea: {
    flex: 1,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    marginLeft: 8,
  },
  sendButton: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    marginLeft: 8,
    width: 36,
  },
  sendIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default GroupChatScreen;
