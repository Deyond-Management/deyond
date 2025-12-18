/**
 * ChatConversationScreen
 * End-to-end encrypted chat interface
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useDeyondCrypt, ChatMessage } from '../hooks';
import { ChainType } from '../crypto/deyondcrypt';
import i18n from '../i18n';

interface ChatConversationScreenProps {
  navigation: any;
  route: {
    params: {
      sessionId: string;
      peerName: string;
      peerAddress: string;
      peerChainType?: ChainType;
    };
  };
  initialMessages?: ChatMessage[];
}

export const ChatConversationScreen: React.FC<ChatConversationScreenProps> = ({
  navigation,
  route,
  initialMessages,
}) => {
  const { theme } = useTheme();
  const { sessionId, peerName, peerAddress, peerChainType = 'evm' } = route.params;
  const flatListRef = useRef<FlatList>(null);

  const { getSession, sendMessage, markSessionRead, isLoading, error } = useDeyondCrypt();

  // Get session data
  const session = getSession(sessionId);
  const messages = initialMessages || session?.messages || [];

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Mark session as read when entering
  useEffect(() => {
    markSessionRead(sessionId);
  }, [sessionId, markSessionRead]);

  // Format time
  const formatTime = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes.toString().padStart(2, '0');
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  }, []);

  // Get status icon
  const getStatusIcon = useCallback((status: ChatMessage['status']) => {
    switch (status) {
      case 'sending':
        return '○';
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'read':
        return '✓✓';
      case 'failed':
        return '✗';
      default:
        return '';
    }
  }, []);

  // Handle send message
  const handleSend = useCallback(async () => {
    const trimmedText = inputText.trim();
    if (!trimmedText || isSending) return;

    setIsSending(true);
    setInputText('');

    try {
      await sendMessage(sessionId, peerAddress, peerChainType, trimmedText, 'text');

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      // Error is handled by the hook and stored in state
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  }, [inputText, isSending, sessionId, peerAddress, peerChainType, sendMessage]);

  // Handle info press
  const handleInfoPress = useCallback(() => {
    navigation.navigate('ContactDetail', {
      address: peerAddress,
      name: peerName,
    });
  }, [navigation, peerAddress, peerName]);

  // Render message item
  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <View
        testID={`message-bubble-${item.id}`}
        style={[
          styles.messageBubble,
          item.isOwn
            ? [styles.ownMessage, { backgroundColor: theme.colors.primary }]
            : [styles.otherMessage, { backgroundColor: theme.colors.card }],
        ]}
      >
        <Text
          style={[
            styles.messageText,
            { color: item.isOwn ? '#FFFFFF' : theme.colors.text.primary },
          ]}
        >
          {item.content}
        </Text>
        <View style={styles.messageFooter}>
          <Text
            testID={`message-time-${item.id}`}
            style={[
              styles.messageTime,
              { color: item.isOwn ? 'rgba(255,255,255,0.7)' : theme.colors.text.secondary },
            ]}
          >
            {formatTime(item.timestamp)}
          </Text>
          {item.isOwn && (
            <Text
              testID={`message-status-${item.id}`}
              style={[
                styles.messageStatus,
                {
                  color:
                    item.status === 'failed'
                      ? theme.colors.error
                      : item.status === 'read'
                        ? theme.colors.primary
                        : 'rgba(255,255,255,0.7)',
                },
              ]}
            >
              {getStatusIcon(item.status)}
            </Text>
          )}
        </View>
      </View>
    ),
    [theme, formatTime, getStatusIcon]
  );

  // Render empty state
  const renderEmpty = useCallback(
    () => (
      <View testID="empty-chat" style={styles.emptyContainer}>
        <Text style={[styles.encryptionBadge, { color: theme.colors.success }]}>
          🔒 {i18n.t('chatConversation.encrypted')}
        </Text>
        <Text style={[styles.emptyIcon, { color: theme.colors.text.secondary }]}>💬</Text>
        <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
          {i18n.t('chatConversation.emptyMessage', { name: peerName })}
        </Text>
        <Text style={[styles.encryptionNote, { color: theme.colors.text.secondary }]}>
          {i18n.t('chatConversation.encryptionNote')}
        </Text>
      </View>
    ),
    [theme, peerName]
  );

  const isSendDisabled = !inputText.trim() || isSending;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.divider }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={[styles.backIcon, { color: theme.colors.primary }]}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={[styles.peerName, { color: theme.colors.text.primary }]}>{peerName}</Text>
            <View style={styles.encryptedRow}>
              <Text style={[styles.encryptedIcon, { color: theme.colors.success }]}>🔒</Text>
              <Text style={[styles.encryptedText, { color: theme.colors.text.secondary }]}>
                {i18n.t('chatConversation.encryptedLabel')}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            testID="info-button"
            style={styles.infoButton}
            onPress={handleInfoPress}
          >
            <Text style={[styles.infoIcon, { color: theme.colors.primary }]}>ⓘ</Text>
          </TouchableOpacity>
        </View>

        {/* Error Banner */}
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: theme.colors.error + '20' }]}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{error.message}</Text>
          </View>
        )}

        {/* Message List */}
        <FlatList
          ref={flatListRef}
          testID="message-list"
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.messageList, messages.length === 0 && styles.emptyList]}
          ListEmptyComponent={renderEmpty}
          inverted={messages.length > 0}
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
        />

        {/* Input Area */}
        <View style={[styles.inputArea, { borderTopColor: theme.colors.divider }]}>
          <TextInput
            testID="message-input"
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.card,
                color: theme.colors.text.primary,
                borderColor: theme.colors.divider,
              },
            ]}
            placeholder={i18n.t('chatConversation.inputPlaceholder')}
            placeholderTextColor={theme.colors.text.secondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            accessibilityLabel={i18n.t('chatConversation.inputAccessibility')}
            editable={!isSending}
          />
          <TouchableOpacity
            testID="send-button"
            style={[
              styles.sendButton,
              {
                backgroundColor: isSendDisabled
                  ? theme.colors.text.secondary
                  : theme.colors.primary,
              },
            ]}
            onPress={handleSend}
            disabled={isSendDisabled}
            accessibilityLabel={i18n.t('chatConversation.sendAccessibility')}
            accessibilityState={{ disabled: isSendDisabled }}
          >
            {isSending ? (
              <Text style={styles.sendIcon}>○</Text>
            ) : (
              <Text style={styles.sendIcon}>→</Text>
            )}
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
  container: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  encryptedIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  encryptedRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 2,
  },
  encryptedText: {
    fontSize: 11,
  },
  encryptionBadge: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  encryptionNote: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  errorBanner: {
    padding: 8,
  },
  errorText: {
    fontSize: 12,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    padding: 12,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 8,
  },
  infoButton: {
    padding: 8,
  },
  infoIcon: {
    fontSize: 20,
  },
  input: {
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  inputArea: {
    alignItems: 'flex-end',
    borderTopWidth: 1,
    flexDirection: 'row',
    padding: 12,
  },
  messageBubble: {
    borderRadius: 16,
    marginBottom: 8,
    maxWidth: '80%',
    padding: 12,
  },
  messageFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageList: {
    padding: 16,
  },
  messageStatus: {
    fontSize: 11,
    marginLeft: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 11,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  peerName: {
    fontSize: 18,
    fontWeight: '600',
  },
  safeArea: {
    flex: 1,
  },
  sendButton: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    marginLeft: 8,
    width: 44,
  },
  sendIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
});

export default ChatConversationScreen;
