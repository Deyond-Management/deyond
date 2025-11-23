/**
 * Chat Manager
 * Manages encrypted P2P chat messages over BLE
 */

import { ChatMessage, MessageStatus } from '../../types/ble';
import { BLESessionManager } from '../ble/BLESessionManager';
import { CryptoUtils } from '../crypto/CryptoUtils';

export class ChatManager {
  private messages: Map<string, ChatMessage[]> = new Map(); // sessionId -> messages[]

  constructor(private sessionManager: BLESessionManager) {}

  /**
   * Send encrypted message through established session
   */
  async sendMessage(
    sessionId: string,
    from: string,
    to: string,
    content: string
  ): Promise<ChatMessage> {
    // Verify session is established
    if (!this.sessionManager.isSessionValid(sessionId)) {
      throw new Error('Session is not established or has expired');
    }

    const session = this.sessionManager.getSession(sessionId);
    if (!session || !session.sharedSecret) {
      throw new Error('Session not found or shared secret not available');
    }

    try {
      // Encrypt message content with shared secret
      const encryptedContent = await CryptoUtils.encrypt(content, session.sharedSecret);

      // Create message
      const message: ChatMessage = {
        id: this.generateMessageId(),
        sessionId,
        from,
        to,
        content: JSON.stringify(encryptedContent),
        timestamp: Date.now(),
        encrypted: true,
        status: MessageStatus.SENDING,
      };

      // Store message
      this.storeMessage(sessionId, message);

      // In real implementation, this would send via BLE
      // For now, just update status to SENT
      message.status = MessageStatus.SENT;

      return message;
    } catch (error) {
      throw new Error(
        `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Receive and decrypt message
   */
  async receiveMessage(encryptedMessage: ChatMessage): Promise<ChatMessage> {
    // If message is not encrypted, return as is
    if (!encryptedMessage.encrypted) {
      this.storeMessage(encryptedMessage.sessionId, encryptedMessage);
      return encryptedMessage;
    }

    const session = this.sessionManager.getSession(encryptedMessage.sessionId);
    if (!session || !session.sharedSecret) {
      throw new Error('Session not found or shared secret not available');
    }

    try {
      // Parse encrypted data
      const encryptedData = JSON.parse(encryptedMessage.content);

      // Decrypt content
      const decryptedContent = await CryptoUtils.decrypt(encryptedData, session.sharedSecret);

      // Create decrypted message
      const message: ChatMessage = {
        ...encryptedMessage,
        content: decryptedContent,
        status: MessageStatus.DELIVERED,
      };

      // Store message
      this.storeMessage(encryptedMessage.sessionId, message);

      return message;
    } catch (error) {
      throw new Error(
        `Failed to receive message: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get conversation history for a session
   */
  getConversationHistory(sessionId: string): ChatMessage[] {
    return this.messages.get(sessionId) || [];
  }

  /**
   * Mark message as delivered
   */
  markMessageAsDelivered(messageId: string): void {
    for (const messages of this.messages.values()) {
      const message = messages.find(m => m.id === messageId);
      if (message) {
        message.status = MessageStatus.DELIVERED;
        return;
      }
    }
  }

  /**
   * Mark message as failed
   */
  markMessageAsFailed(messageId: string): void {
    for (const messages of this.messages.values()) {
      const message = messages.find(m => m.id === messageId);
      if (message) {
        message.status = MessageStatus.FAILED;
        return;
      }
    }
  }

  /**
   * Delete a message
   */
  deleteMessage(messageId: string): void {
    for (const [sessionId, messages] of this.messages.entries()) {
      const index = messages.findIndex(m => m.id === messageId);
      if (index !== -1) {
        messages.splice(index, 1);
        return;
      }
    }
  }

  /**
   * Clear all messages for a session
   */
  clearConversation(sessionId: string): void {
    this.messages.delete(sessionId);
  }

  /**
   * Get unread message count for a session
   */
  getUnreadCount(sessionId: string): number {
    const messages = this.messages.get(sessionId) || [];
    return messages.filter(m => m.status === MessageStatus.SENT).length;
  }

  /**
   * Store message in conversation history
   */
  private storeMessage(sessionId: string, message: ChatMessage): void {
    const sessionMessages = this.messages.get(sessionId) || [];
    sessionMessages.push(message);
    this.messages.set(sessionId, sessionMessages);
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    const randomBytes = CryptoUtils.generateRandomBytes(16);
    return Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
