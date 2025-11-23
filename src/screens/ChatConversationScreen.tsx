/**
 * ChatConversationScreen
 * Chat interface for P2P messaging
 */

import React, { useState } from 'react';
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

interface Message {
  id: string;
  content: string;
  timestamp: number;
  isOwn: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

interface ChatConversationScreenProps {
  navigation: any;
  route: {
    params: {
      sessionId: string;
      peerName: string;
      peerAddress: string;
    };
  };
  initialMessages?: Message[];
}

export const ChatConversationScreen: React.FC<ChatConversationScreenProps> = ({
  navigation,
  route,
  initialMessages = [],
}) => {
  const { theme } = useTheme();
  const { peerName } = route.params;
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState('');

  // Format time
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes.toString().padStart(2, '0');
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  // Get status icon
  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sending':
        return '○';
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'read':
        return '✓✓';
      default:
        return '';
    }
  };

  // Handle send message
  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      content: inputText.trim(),
      timestamp: Date.now(),
      isOwn: true,
      status: 'sending',
    };

    setMessages([...messages, newMessage]);
    setInputText('');
  };

  // Handle info press
  const handleInfoPress = () => {
    // Navigate to peer info screen
  };

  // Render message item
  const renderMessage = ({ item }: { item: Message }) => (
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
        style={[styles.messageText, { color: item.isOwn ? '#FFFFFF' : theme.colors.text.primary }]}
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
                color: item.status === 'read' ? theme.colors.primary : 'rgba(255,255,255,0.7)',
              },
            ]}
          >
            {getStatusIcon(item.status)}
          </Text>
        )}
      </View>
    </View>
  );

  // Render empty state
  const renderEmpty = () => (
    <View testID="empty-chat" style={styles.emptyContainer}>
      <Text style={[styles.emptyIcon, { color: theme.colors.text.secondary }]}>💬</Text>
      <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
        Start a conversation with {peerName}
      </Text>
    </View>
  );

  const isSendDisabled = !inputText.trim();

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
          </View>
          <TouchableOpacity
            testID="info-button"
            style={styles.infoButton}
            onPress={handleInfoPress}
          >
            <Text style={[styles.infoIcon, { color: theme.colors.primary }]}>ⓘ</Text>
          </TouchableOpacity>
        </View>

        {/* Message List */}
        <FlatList
          testID="message-list"
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.messageList, messages.length === 0 && styles.emptyList]}
          ListEmptyComponent={renderEmpty}
          inverted={messages.length > 0}
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
            placeholder="Type a message..."
            placeholderTextColor={theme.colors.text.secondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            accessibilityLabel="Message input"
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
            accessibilityLabel="Send message"
            accessibilityState={{ disabled: isSendDisabled }}
          >
            <Text style={styles.sendIcon}>→</Text>
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
