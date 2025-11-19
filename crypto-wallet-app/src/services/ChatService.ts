/**
 * ChatService
 * Manages chat sessions and messages
 */

export interface ChatMessage {
  id: string;
  sessionId: string;
  content: string;
  timestamp: number;
  isOwn: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

export interface ChatSession {
  id: string;
  peerAddress: string;
  peerName: string;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
  isActive: boolean;
  createdAt: number;
}

interface CreateSessionParams {
  peerAddress: string;
  peerName: string;
}

interface ReceiveMessageParams {
  content: string;
  timestamp: number;
}

export class ChatService {
  private sessions: Map<string, ChatSession> = new Map();
  private messages: Map<string, ChatMessage[]> = new Map();

  /**
   * Create a new chat session
   */
  async createSession(params: CreateSessionParams): Promise<ChatSession> {
    // Validate peer address
    if (!this.isValidAddress(params.peerAddress)) {
      throw new Error('Invalid peer address');
    }

    // Validate peer name
    if (!params.peerName || params.peerName.trim() === '') {
      throw new Error('Peer name is required');
    }

    const now = Date.now();
    const session: ChatSession = {
      id: `session-${now}-${Math.random().toString(36).substr(2, 9)}`,
      peerAddress: params.peerAddress,
      peerName: params.peerName.trim(),
      lastMessage: '',
      lastMessageTime: now,
      unreadCount: 0,
      isActive: true,
      createdAt: now,
    };

    this.sessions.set(session.id, session);
    this.messages.set(session.id, []);

    return session;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<ChatSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get all sessions sorted by last message time
   */
  async getAllSessions(): Promise<ChatSession[]> {
    const sessions = Array.from(this.sessions.values());
    return sessions.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
  }

  /**
   * Close a session
   */
  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.sessions.set(sessionId, session);
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
    this.messages.delete(sessionId);
  }

  /**
   * Send a message
   */
  async sendMessage(sessionId: string, content: string): Promise<ChatMessage> {
    // Validate session exists
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Validate content
    if (!content || content.trim() === '') {
      throw new Error('Message content is required');
    }

    const now = Date.now();
    const message: ChatMessage = {
      id: `msg-${now}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      content: content.trim(),
      timestamp: now,
      isOwn: true,
      status: 'sending',
    };

    // Add message to session
    const sessionMessages = this.messages.get(sessionId) || [];
    sessionMessages.push(message);
    this.messages.set(sessionId, sessionMessages);

    // Update session
    session.lastMessage = content.trim();
    session.lastMessageTime = now;
    this.sessions.set(sessionId, session);

    return message;
  }

  /**
   * Receive a message
   */
  async receiveMessage(
    sessionId: string,
    params: ReceiveMessageParams
  ): Promise<ChatMessage> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const message: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      content: params.content,
      timestamp: params.timestamp,
      isOwn: false,
      status: 'delivered',
    };

    // Add message to session
    const sessionMessages = this.messages.get(sessionId) || [];
    sessionMessages.push(message);
    this.messages.set(sessionId, sessionMessages);

    // Update session
    session.lastMessage = params.content;
    session.lastMessageTime = params.timestamp;
    session.unreadCount += 1;
    this.sessions.set(sessionId, session);

    return message;
  }

  /**
   * Get messages for a session
   */
  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    const messages = this.messages.get(sessionId) || [];
    return messages.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Update message status
   */
  async updateMessageStatus(
    messageId: string,
    status: ChatMessage['status']
  ): Promise<void> {
    for (const [sessionId, messages] of this.messages) {
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      if (messageIndex !== -1) {
        messages[messageIndex].status = status;
        this.messages.set(sessionId, messages);
        return;
      }
    }
  }

  /**
   * Mark all messages in session as read
   */
  async markAsRead(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.unreadCount = 0;
      this.sessions.set(sessionId, session);
    }

    const messages = this.messages.get(sessionId) || [];
    messages.forEach((msg) => {
      if (!msg.isOwn && msg.status !== 'read') {
        msg.status = 'read';
      }
    });
    this.messages.set(sessionId, messages);
  }

  /**
   * Check if session exists for peer
   */
  async hasSessionWithPeer(peerAddress: string): Promise<boolean> {
    for (const session of this.sessions.values()) {
      if (session.peerAddress.toLowerCase() === peerAddress.toLowerCase()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get session by peer address
   */
  async getSessionByPeer(peerAddress: string): Promise<ChatSession | null> {
    for (const session of this.sessions.values()) {
      if (session.peerAddress.toLowerCase() === peerAddress.toLowerCase()) {
        return session;
      }
    }
    return null;
  }

  /**
   * Validate Ethereum address
   */
  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}

export default ChatService;
