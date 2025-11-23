/**
 * ChatService Tests
 * TDD: Write tests first, then implement
 */

import { ChatService, ChatSession, ChatMessage } from '../../services/ChatService';

describe('ChatService', () => {
  let chatService: ChatService;

  beforeEach(() => {
    chatService = new ChatService();
  });

  describe('Session Management', () => {
    it('should create a new chat session', async () => {
      const session = await chatService.createSession({
        peerAddress: '0x1234567890123456789012345678901234567890',
        peerName: 'Alice',
      });

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.peerAddress).toBe('0x1234567890123456789012345678901234567890');
      expect(session.peerName).toBe('Alice');
      expect(session.isActive).toBe(true);
    });

    it('should get session by id', async () => {
      const created = await chatService.createSession({
        peerAddress: '0x1234567890123456789012345678901234567890',
        peerName: 'Alice',
      });

      const session = await chatService.getSession(created.id);

      expect(session).toBeDefined();
      expect(session?.id).toBe(created.id);
    });

    it('should return null for non-existent session', async () => {
      const session = await chatService.getSession('non-existent');

      expect(session).toBeNull();
    });

    it('should get all sessions', async () => {
      await chatService.createSession({
        peerAddress: '0x1234567890123456789012345678901234567890',
        peerName: 'Alice',
      });
      await chatService.createSession({
        peerAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        peerName: 'Bob',
      });

      const sessions = await chatService.getAllSessions();

      expect(sessions.length).toBe(2);
    });

    it('should get sessions sorted by last message time', async () => {
      const session1 = await chatService.createSession({
        peerAddress: '0x1234567890123456789012345678901234567890',
        peerName: 'Alice',
      });
      const session2 = await chatService.createSession({
        peerAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        peerName: 'Bob',
      });

      // Send message to first session (making it more recent)
      await chatService.sendMessage(session1.id, 'Hello');

      const sessions = await chatService.getAllSessions();

      expect(sessions[0].id).toBe(session1.id);
    });

    it('should close a session', async () => {
      const session = await chatService.createSession({
        peerAddress: '0x1234567890123456789012345678901234567890',
        peerName: 'Alice',
      });

      await chatService.closeSession(session.id);

      const updated = await chatService.getSession(session.id);
      expect(updated?.isActive).toBe(false);
    });

    it('should delete a session', async () => {
      const session = await chatService.createSession({
        peerAddress: '0x1234567890123456789012345678901234567890',
        peerName: 'Alice',
      });

      await chatService.deleteSession(session.id);

      const deleted = await chatService.getSession(session.id);
      expect(deleted).toBeNull();
    });
  });

  describe('Message Management', () => {
    let sessionId: string;

    beforeEach(async () => {
      const session = await chatService.createSession({
        peerAddress: '0x1234567890123456789012345678901234567890',
        peerName: 'Alice',
      });
      sessionId = session.id;
    });

    it('should send a message', async () => {
      const message = await chatService.sendMessage(sessionId, 'Hello!');

      expect(message).toBeDefined();
      expect(message.id).toBeDefined();
      expect(message.content).toBe('Hello!');
      expect(message.isOwn).toBe(true);
      expect(message.status).toBe('sending');
    });

    it('should receive a message', async () => {
      const message = await chatService.receiveMessage(sessionId, {
        content: 'Hi there!',
        timestamp: Date.now(),
      });

      expect(message).toBeDefined();
      expect(message.content).toBe('Hi there!');
      expect(message.isOwn).toBe(false);
      expect(message.status).toBe('delivered');
    });

    it('should get messages for a session', async () => {
      await chatService.sendMessage(sessionId, 'Hello!');
      await chatService.sendMessage(sessionId, 'How are you?');

      const messages = await chatService.getMessages(sessionId);

      expect(messages.length).toBe(2);
    });

    it('should get messages in chronological order', async () => {
      await chatService.sendMessage(sessionId, 'First');
      await chatService.sendMessage(sessionId, 'Second');

      const messages = await chatService.getMessages(sessionId);

      expect(messages[0].content).toBe('First');
      expect(messages[1].content).toBe('Second');
    });

    it('should update message status', async () => {
      const message = await chatService.sendMessage(sessionId, 'Hello!');

      await chatService.updateMessageStatus(message.id, 'delivered');

      const messages = await chatService.getMessages(sessionId);
      const updated = messages.find(m => m.id === message.id);
      expect(updated?.status).toBe('delivered');
    });

    it('should update session last message on send', async () => {
      await chatService.sendMessage(sessionId, 'Hello!');

      const session = await chatService.getSession(sessionId);

      expect(session?.lastMessage).toBe('Hello!');
    });

    it('should increment unread count on receive', async () => {
      await chatService.receiveMessage(sessionId, {
        content: 'Hi!',
        timestamp: Date.now(),
      });

      const session = await chatService.getSession(sessionId);

      expect(session?.unreadCount).toBe(1);
    });

    it('should mark messages as read', async () => {
      await chatService.receiveMessage(sessionId, {
        content: 'Hi!',
        timestamp: Date.now(),
      });

      await chatService.markAsRead(sessionId);

      const session = await chatService.getSession(sessionId);
      expect(session?.unreadCount).toBe(0);
    });
  });

  describe('Validation', () => {
    it('should throw error for invalid peer address', async () => {
      await expect(
        chatService.createSession({
          peerAddress: 'invalid',
          peerName: 'Alice',
        })
      ).rejects.toThrow('Invalid peer address');
    });

    it('should throw error for empty peer name', async () => {
      await expect(
        chatService.createSession({
          peerAddress: '0x1234567890123456789012345678901234567890',
          peerName: '',
        })
      ).rejects.toThrow('Peer name is required');
    });

    it('should throw error for empty message', async () => {
      const session = await chatService.createSession({
        peerAddress: '0x1234567890123456789012345678901234567890',
        peerName: 'Alice',
      });

      await expect(chatService.sendMessage(session.id, '')).rejects.toThrow(
        'Message content is required'
      );
    });

    it('should throw error for non-existent session when sending', async () => {
      await expect(chatService.sendMessage('non-existent', 'Hello')).rejects.toThrow(
        'Session not found'
      );
    });
  });

  describe('Session Lifecycle', () => {
    it('should track session creation time', async () => {
      const before = Date.now();
      const session = await chatService.createSession({
        peerAddress: '0x1234567890123456789012345678901234567890',
        peerName: 'Alice',
      });
      const after = Date.now();

      expect(session.createdAt).toBeGreaterThanOrEqual(before);
      expect(session.createdAt).toBeLessThanOrEqual(after);
    });

    it('should update last message time', async () => {
      const session = await chatService.createSession({
        peerAddress: '0x1234567890123456789012345678901234567890',
        peerName: 'Alice',
      });

      const before = Date.now();
      await chatService.sendMessage(session.id, 'Hello');
      const after = Date.now();

      const updated = await chatService.getSession(session.id);

      expect(updated?.lastMessageTime).toBeGreaterThanOrEqual(before);
      expect(updated?.lastMessageTime).toBeLessThanOrEqual(after);
    });

    it('should check if session exists for peer', async () => {
      await chatService.createSession({
        peerAddress: '0x1234567890123456789012345678901234567890',
        peerName: 'Alice',
      });

      const exists = await chatService.hasSessionWithPeer(
        '0x1234567890123456789012345678901234567890'
      );

      expect(exists).toBe(true);
    });

    it('should get session by peer address', async () => {
      const created = await chatService.createSession({
        peerAddress: '0x1234567890123456789012345678901234567890',
        peerName: 'Alice',
      });

      const session = await chatService.getSessionByPeer(
        '0x1234567890123456789012345678901234567890'
      );

      expect(session?.id).toBe(created.id);
    });
  });
});
