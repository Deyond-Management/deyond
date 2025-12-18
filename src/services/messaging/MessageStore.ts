/**
 * MessageStore
 * Persistent storage for encrypted messages and chat sessions
 */

import { SecureStorageService } from '../wallet/SecureStorageService';
import { ChainType } from '../../crypto/deyondcrypt';
import { logger } from '../../utils';

// =============================================================================
// Types
// =============================================================================

export interface StoredMessage {
  id: string;
  sessionId: string;
  content: string;
  contentType: 'text' | 'image' | 'file' | 'transaction';
  timestamp: number;
  isOwn: boolean;
  senderAddress: string;
  senderChainType: ChainType;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  metadata?: Record<string, unknown>;
}

export interface StoredSession {
  id: string;
  peerAddress: string;
  peerChainType: ChainType;
  peerName: string;
  createdAt: number;
  lastMessageTime: number;
  unreadCount: number;
  isActive: boolean;
}

// =============================================================================
// Storage Keys
// =============================================================================

const STORAGE_KEYS = {
  SESSIONS: 'deyondcrypt_sessions',
  MESSAGES_PREFIX: 'deyondcrypt_messages_',
  MESSAGE_INDEX: 'deyondcrypt_message_index',
};

// =============================================================================
// MessageStore
// =============================================================================

export class MessageStore {
  private log = logger.child({ service: 'MessageStore' });
  private secureStorage: SecureStorageService;
  private initialized = false;

  // In-memory cache
  private sessionsCache: Map<string, StoredSession> = new Map();
  private messagesCache: Map<string, StoredMessage[]> = new Map();

  constructor(secureStorage?: SecureStorageService) {
    this.secureStorage = secureStorage || new SecureStorageService();
  }

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.log.info('Initializing MessageStore...');

      // Load sessions into cache
      await this.loadSessions();

      this.initialized = true;
      this.log.info('MessageStore initialized', {
        sessionCount: this.sessionsCache.size,
      });
    } catch (error) {
      this.log.error('Failed to initialize MessageStore', error as Error);
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // ---------------------------------------------------------------------------
  // Session Management
  // ---------------------------------------------------------------------------

  async createSession(session: StoredSession): Promise<void> {
    this.sessionsCache.set(session.id, session);
    this.messagesCache.set(session.id, []);
    await this.persistSessions();

    this.log.info('Session created', { sessionId: session.id });
  }

  async updateSession(sessionId: string, updates: Partial<StoredSession>): Promise<void> {
    const session = this.sessionsCache.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const updatedSession = { ...session, ...updates };
    this.sessionsCache.set(sessionId, updatedSession);
    await this.persistSessions();
  }

  getSession(sessionId: string): StoredSession | undefined {
    return this.sessionsCache.get(sessionId);
  }

  getSessionByAddress(address: string): StoredSession | undefined {
    for (const session of this.sessionsCache.values()) {
      if (session.peerAddress.toLowerCase() === address.toLowerCase()) {
        return session;
      }
    }
    return undefined;
  }

  getAllSessions(): StoredSession[] {
    return Array.from(this.sessionsCache.values()).sort(
      (a, b) => b.lastMessageTime - a.lastMessageTime
    );
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.sessionsCache.delete(sessionId);
    this.messagesCache.delete(sessionId);

    // Delete messages from storage
    await this.secureStorage.deleteItem(`${STORAGE_KEYS.MESSAGES_PREFIX}${sessionId}`);

    await this.persistSessions();
    this.log.info('Session deleted', { sessionId });
  }

  // ---------------------------------------------------------------------------
  // Message Management
  // ---------------------------------------------------------------------------

  async addMessage(message: StoredMessage): Promise<void> {
    const messages = this.messagesCache.get(message.sessionId) || [];
    messages.push(message);
    this.messagesCache.set(message.sessionId, messages);

    // Update session's last message time
    const session = this.sessionsCache.get(message.sessionId);
    if (session) {
      session.lastMessageTime = message.timestamp;
      if (!message.isOwn) {
        session.unreadCount += 1;
      }
      await this.persistSessions();
    }

    await this.persistMessages(message.sessionId);

    this.log.debug('Message added', {
      messageId: message.id,
      sessionId: message.sessionId,
    });
  }

  async updateMessage(
    sessionId: string,
    messageId: string,
    updates: Partial<StoredMessage>
  ): Promise<void> {
    const messages = this.messagesCache.get(sessionId);
    if (!messages) return;

    const index = messages.findIndex(m => m.id === messageId);
    if (index === -1) return;

    messages[index] = { ...messages[index], ...updates };
    await this.persistMessages(sessionId);
  }

  getMessages(sessionId: string, limit?: number, offset?: number): StoredMessage[] {
    const messages = this.messagesCache.get(sessionId) || [];

    // Sort by timestamp descending (newest first)
    const sorted = [...messages].sort((a, b) => b.timestamp - a.timestamp);

    if (offset !== undefined && limit !== undefined) {
      return sorted.slice(offset, offset + limit);
    }

    if (limit !== undefined) {
      return sorted.slice(0, limit);
    }

    return sorted;
  }

  async loadMessagesForSession(sessionId: string): Promise<StoredMessage[]> {
    if (this.messagesCache.has(sessionId)) {
      return this.messagesCache.get(sessionId) || [];
    }

    try {
      const messages = await this.secureStorage.getObject<StoredMessage[]>(
        `${STORAGE_KEYS.MESSAGES_PREFIX}${sessionId}`
      );

      const loadedMessages = messages || [];
      this.messagesCache.set(sessionId, loadedMessages);

      return loadedMessages;
    } catch (error) {
      this.log.warn('Failed to load messages', { sessionId, error });
      return [];
    }
  }

  async deleteMessage(sessionId: string, messageId: string): Promise<void> {
    const messages = this.messagesCache.get(sessionId);
    if (!messages) return;

    const index = messages.findIndex(m => m.id === messageId);
    if (index !== -1) {
      messages.splice(index, 1);
      await this.persistMessages(sessionId);
    }
  }

  // ---------------------------------------------------------------------------
  // Unread Count
  // ---------------------------------------------------------------------------

  async markSessionRead(sessionId: string): Promise<void> {
    const session = this.sessionsCache.get(sessionId);
    if (session && session.unreadCount > 0) {
      session.unreadCount = 0;
      await this.persistSessions();
    }
  }

  getTotalUnreadCount(): number {
    let total = 0;
    for (const session of this.sessionsCache.values()) {
      total += session.unreadCount;
    }
    return total;
  }

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------

  async searchMessages(query: string, sessionId?: string): Promise<StoredMessage[]> {
    const results: StoredMessage[] = [];
    const lowerQuery = query.toLowerCase();

    const sessionsToSearch = sessionId ? [sessionId] : Array.from(this.sessionsCache.keys());

    for (const sid of sessionsToSearch) {
      const messages = await this.loadMessagesForSession(sid);
      for (const message of messages) {
        if (message.content.toLowerCase().includes(lowerQuery)) {
          results.push(message);
        }
      }
    }

    return results.sort((a, b) => b.timestamp - a.timestamp);
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  async clearAllData(): Promise<void> {
    // Clear all session messages
    for (const sessionId of this.sessionsCache.keys()) {
      await this.secureStorage.deleteItem(`${STORAGE_KEYS.MESSAGES_PREFIX}${sessionId}`);
    }

    // Clear sessions
    await this.secureStorage.deleteItem(STORAGE_KEYS.SESSIONS);
    await this.secureStorage.deleteItem(STORAGE_KEYS.MESSAGE_INDEX);

    // Clear caches
    this.sessionsCache.clear();
    this.messagesCache.clear();

    this.log.info('All MessageStore data cleared');
  }

  async deleteOldMessages(olderThanDays: number): Promise<number> {
    const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const [sessionId, messages] of this.messagesCache) {
      const filteredMessages = messages.filter(m => m.timestamp >= cutoff);
      deletedCount += messages.length - filteredMessages.length;

      if (filteredMessages.length !== messages.length) {
        this.messagesCache.set(sessionId, filteredMessages);
        await this.persistMessages(sessionId);
      }
    }

    this.log.info('Old messages deleted', { deletedCount, olderThanDays });
    return deletedCount;
  }

  // ---------------------------------------------------------------------------
  // Private Methods
  // ---------------------------------------------------------------------------

  private async loadSessions(): Promise<void> {
    try {
      const sessions = await this.secureStorage.getObject<StoredSession[]>(STORAGE_KEYS.SESSIONS);

      if (sessions) {
        for (const session of sessions) {
          this.sessionsCache.set(session.id, session);
        }
      }
    } catch (error) {
      this.log.warn('Failed to load sessions', { error });
    }
  }

  private async persistSessions(): Promise<void> {
    const sessions = Array.from(this.sessionsCache.values());
    await this.secureStorage.setObject(STORAGE_KEYS.SESSIONS, sessions);
  }

  private async persistMessages(sessionId: string): Promise<void> {
    const messages = this.messagesCache.get(sessionId) || [];
    await this.secureStorage.setObject(`${STORAGE_KEYS.MESSAGES_PREFIX}${sessionId}`, messages);
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let messageStoreInstance: MessageStore | null = null;

export function getMessageStore(): MessageStore {
  if (!messageStoreInstance) {
    messageStoreInstance = new MessageStore();
  }
  return messageStoreInstance;
}

export default MessageStore;
