/**
 * Chat Manager Tests
 * TDD: Testing encrypted P2P chat functionality
 */

import { ChatManager } from '../../core/chat/ChatManager';
import { BLESessionManager } from '../../core/ble/BLESessionManager';
import { SessionStatus, MessageStatus } from '../../types/ble';

describe('ChatManager', () => {
  let chatManager: ChatManager;
  let sessionManager: BLESessionManager;
  const mockWalletAddress = '0x1234567890123456789012345678901234567890';
  const mockPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

  beforeEach(() => {
    sessionManager = new BLESessionManager(mockWalletAddress, mockPrivateKey);
    chatManager = new ChatManager(sessionManager);
  });

  describe('sendMessage', () => {
    it('should send encrypted message in established session', async () => {
      // Create and establish session
      const session = await sessionManager.initiateSession('dev1', 'addr1', 'Test Device');
      const testSession = sessionManager.getSession(session.id);
      if (testSession) {
        testSession.status = SessionStatus.ESTABLISHED;
        testSession.sharedSecret = 'test-shared-secret-for-encryption';
      }

      const message = await chatManager.sendMessage(
        session.id,
        mockWalletAddress,
        '0x0987654321098765432109876543210987654321',
        'Hello, this is a test message!'
      );

      expect(message).toBeDefined();
      expect(message.id).toBeDefined();
      expect(message.sessionId).toEqual(session.id);
      expect(message.from).toEqual(mockWalletAddress);
      expect(message.encrypted).toBe(true);
      expect(message.status).toEqual(MessageStatus.SENT);
    });

    it('should fail to send message in non-established session', async () => {
      const session = await sessionManager.initiateSession('dev1', 'addr1', 'Test Device');

      await expect(
        chatManager.sendMessage(
          session.id,
          mockWalletAddress,
          '0x0987654321098765432109876543210987654321',
          'Test message'
        )
      ).rejects.toThrow();
    });

    it('should create unique message IDs', async () => {
      const session = await sessionManager.initiateSession('dev1', 'addr1', 'Test Device');
      const testSession = sessionManager.getSession(session.id);
      if (testSession) {
        testSession.status = SessionStatus.ESTABLISHED;
        testSession.sharedSecret = 'test-shared-secret';
      }

      const message1 = await chatManager.sendMessage(session.id, mockWalletAddress, '0x09...', 'Message 1');
      const message2 = await chatManager.sendMessage(session.id, mockWalletAddress, '0x09...', 'Message 2');

      expect(message1.id).not.toEqual(message2.id);
    });
  });

  describe('receiveMessage', () => {
    it('should decrypt received encrypted message', async () => {
      const session = await sessionManager.initiateSession('dev1', 'addr1', 'Test Device');
      const testSession = sessionManager.getSession(session.id);
      if (testSession) {
        testSession.status = SessionStatus.ESTABLISHED;
        testSession.sharedSecret = 'test-shared-secret-for-encryption';
      }

      const originalContent = 'Secret message content';

      // Send message (encrypt)
      const sentMessage = await chatManager.sendMessage(
        session.id,
        mockWalletAddress,
        '0x0987654321098765432109876543210987654321',
        originalContent
      );

      // Receive message (decrypt)
      const receivedMessage = await chatManager.receiveMessage(sentMessage);

      expect(receivedMessage.content).toEqual(originalContent);
      expect(receivedMessage.encrypted).toBe(true);
    });

    it('should handle non-encrypted messages', async () => {
      const plainMessage = {
        id: 'msg-123',
        sessionId: 'session-123',
        from: mockWalletAddress,
        to: '0x0987654321098765432109876543210987654321',
        content: 'Plain text message',
        timestamp: Date.now(),
        encrypted: false,
        status: MessageStatus.SENT,
      };

      const receivedMessage = await chatManager.receiveMessage(plainMessage);

      expect(receivedMessage.content).toEqual('Plain text message');
    });
  });

  describe('getConversationHistory', () => {
    it('should return messages for a session', async () => {
      const session = await sessionManager.initiateSession('dev1', 'addr1', 'Test Device');
      const testSession = sessionManager.getSession(session.id);
      if (testSession) {
        testSession.status = SessionStatus.ESTABLISHED;
        testSession.sharedSecret = 'test-shared-secret';
      }

      await chatManager.sendMessage(session.id, mockWalletAddress, '0x09...', 'Message 1');
      await chatManager.sendMessage(session.id, mockWalletAddress, '0x09...', 'Message 2');
      await chatManager.sendMessage(session.id, mockWalletAddress, '0x09...', 'Message 3');

      const history = chatManager.getConversationHistory(session.id);

      expect(history).toHaveLength(3);
      expect(history[0].content).toBeDefined();
      expect(history[1].content).toBeDefined();
      expect(history[2].content).toBeDefined();
    });

    it('should return empty array for session with no messages', () => {
      const history = chatManager.getConversationHistory('non-existent-session');

      expect(history).toEqual([]);
    });
  });

  describe('markMessageAsDelivered', () => {
    it('should update message status to delivered', async () => {
      const session = await sessionManager.initiateSession('dev1', 'addr1', 'Test Device');
      const testSession = sessionManager.getSession(session.id);
      if (testSession) {
        testSession.status = SessionStatus.ESTABLISHED;
        testSession.sharedSecret = 'test-shared-secret';
      }

      const message = await chatManager.sendMessage(session.id, mockWalletAddress, '0x09...', 'Test');

      chatManager.markMessageAsDelivered(message.id);

      const history = chatManager.getConversationHistory(session.id);
      const deliveredMessage = history.find(m => m.id === message.id);

      expect(deliveredMessage?.status).toEqual(MessageStatus.DELIVERED);
    });
  });

  describe('deleteMessage', () => {
    it('should delete message from conversation', async () => {
      const session = await sessionManager.initiateSession('dev1', 'addr1', 'Test Device');
      const testSession = sessionManager.getSession(session.id);
      if (testSession) {
        testSession.status = SessionStatus.ESTABLISHED;
        testSession.sharedSecret = 'test-shared-secret';
      }

      const message = await chatManager.sendMessage(session.id, mockWalletAddress, '0x09...', 'Test');

      chatManager.deleteMessage(message.id);

      const history = chatManager.getConversationHistory(session.id);
      const deletedMessage = history.find(m => m.id === message.id);

      expect(deletedMessage).toBeUndefined();
    });
  });

  describe('clearConversation', () => {
    it('should clear all messages for a session', async () => {
      const session = await sessionManager.initiateSession('dev1', 'addr1', 'Test Device');
      const testSession = sessionManager.getSession(session.id);
      if (testSession) {
        testSession.status = SessionStatus.ESTABLISHED;
        testSession.sharedSecret = 'test-shared-secret';
      }

      await chatManager.sendMessage(session.id, mockWalletAddress, '0x09...', 'Message 1');
      await chatManager.sendMessage(session.id, mockWalletAddress, '0x09...', 'Message 2');

      chatManager.clearConversation(session.id);

      const history = chatManager.getConversationHistory(session.id);

      expect(history).toEqual([]);
    });
  });
});
