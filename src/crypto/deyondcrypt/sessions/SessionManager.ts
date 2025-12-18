/**
 * DeyondCrypt - Session Manager
 *
 * Manages multiple encrypted messaging sessions with different parties.
 * Handles session creation, persistence, and lifecycle.
 */

import {
  ChainType,
  SessionState,
  SessionInfo,
  IdentityKeyPair,
  PreKeyBundle,
  DeyondCryptError,
  DeyondCryptErrorCode,
} from '../types';
import { ICryptoPrimitive, CryptoPrimitiveRegistry } from '../primitives';
import { DoubleRatchet } from '../core/DoubleRatchet';
import { X3DH, IPreKeyStore, X3DHInitialMessage } from '../keys/X3DH';

// =============================================================================
// Types
// =============================================================================

/**
 * Full session data including ratchet state
 */
export interface Session {
  id: string;
  remoteAddress: string;
  remoteChainType: ChainType;
  remoteIdentityKey: Uint8Array;
  ratchet: DoubleRatchet;
  createdAt: number;
  lastActivityAt: number;
  messageCount: number;
}

/**
 * Serialized session for storage
 */
export interface SerializedSession {
  id: string;
  remoteAddress: string;
  remoteChainType: ChainType;
  remoteIdentityKey: string; // Base64
  state: SerializedSessionState;
  createdAt: number;
  lastActivityAt: number;
  messageCount: number;
}

/**
 * Serialized session state
 */
interface SerializedSessionState {
  dhRatchetKeyPair: {
    publicKey: string;
    privateKey: string;
  };
  remoteDhRatchetKey: string | null;
  rootKey: string;
  sendingChainKey: string | null;
  sendingMessageNumber: number;
  previousSendingChainLength: number;
  receivingChainKey: string | null;
  receivingMessageNumber: number;
  skippedMessageKeys: Array<[string, string]>;
}

/**
 * Session storage interface
 */
export interface ISessionStore {
  /**
   * Save a session
   */
  saveSession(session: SerializedSession): Promise<void>;

  /**
   * Load a session by ID
   */
  loadSession(sessionId: string): Promise<SerializedSession | null>;

  /**
   * Load session by remote address
   */
  loadSessionByAddress(address: string, chainType: ChainType): Promise<SerializedSession | null>;

  /**
   * Delete a session
   */
  deleteSession(sessionId: string): Promise<void>;

  /**
   * List all session IDs
   */
  listSessionIds(): Promise<string[]>;

  /**
   * List session info (without full state)
   */
  listSessions(): Promise<SessionInfo[]>;
}

// =============================================================================
// Session Manager
// =============================================================================

/**
 * Manages encrypted messaging sessions
 */
export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private sessionsByAddress: Map<string, string> = new Map(); // address:chainType -> sessionId
  private identityKeyPair: IdentityKeyPair;
  private preKeyStore: IPreKeyStore;
  private sessionStore: ISessionStore;

  constructor(
    identityKeyPair: IdentityKeyPair,
    preKeyStore: IPreKeyStore,
    sessionStore: ISessionStore
  ) {
    this.identityKeyPair = identityKeyPair;
    this.preKeyStore = preKeyStore;
    this.sessionStore = sessionStore;
  }

  // ---------------------------------------------------------------------------
  // Session Creation
  // ---------------------------------------------------------------------------

  /**
   * Create a new session with a remote party (as initiator)
   */
  async createSession(
    remotePreKeyBundle: PreKeyBundle
  ): Promise<{ session: Session; initialMessage: X3DHInitialMessage }> {
    const crypto = this.getCryptoPrimitive(remotePreKeyBundle.chainType);
    const x3dh = new X3DH(crypto);

    // Perform X3DH key exchange
    const { result, initialMessage } = await x3dh.initiateKeyExchange(
      this.identityKeyPair,
      remotePreKeyBundle
    );

    // Initialize Double Ratchet as Alice (initiator)
    const ratchet = await DoubleRatchet.initializeAsAlice(
      crypto,
      result.sharedSecret,
      remotePreKeyBundle.signedPreKey.publicKey
    );

    // Create session
    const sessionId = this.generateSessionId();
    const session: Session = {
      id: sessionId,
      remoteAddress: remotePreKeyBundle.address,
      remoteChainType: remotePreKeyBundle.chainType,
      remoteIdentityKey: remotePreKeyBundle.identityKey,
      ratchet,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      messageCount: 0,
    };

    // Store session
    this.sessions.set(sessionId, session);
    this.sessionsByAddress.set(
      this.makeAddressKey(remotePreKeyBundle.address, remotePreKeyBundle.chainType),
      sessionId
    );

    // Persist session
    await this.persistSession(session);

    return { session, initialMessage };
  }

  /**
   * Accept a session from a remote party (as responder)
   */
  async acceptSession(
    initialMessage: X3DHInitialMessage,
    remoteChainType: ChainType
  ): Promise<Session> {
    const crypto = this.getCryptoPrimitive(remoteChainType);
    const x3dh = new X3DH(crypto);

    // Get our signed pre-key
    const signedPreKey = await this.preKeyStore.getSignedPreKey();
    if (!signedPreKey) {
      throw new DeyondCryptError('No signed pre-key available', DeyondCryptErrorCode.KEY_NOT_FOUND);
    }

    // Get one-time pre-key if used
    let oneTimePreKey = null;
    if (initialMessage.usedOneTimePreKeyId !== undefined) {
      oneTimePreKey = await this.preKeyStore.consumeOneTimePreKey(
        initialMessage.usedOneTimePreKeyId
      );
    }

    // Complete X3DH key exchange
    const result = await x3dh.completeKeyExchange(
      this.identityKeyPair,
      signedPreKey.keyPair,
      oneTimePreKey?.keyPair ?? null,
      initialMessage
    );

    // Initialize Double Ratchet as Bob (responder)
    const ratchet = await DoubleRatchet.initializeAsBob(
      crypto,
      result.sharedSecret,
      signedPreKey.keyPair
    );

    // Derive remote address from identity key
    const remoteAddress = crypto.publicKeyToAddress(initialMessage.identityKey);

    // Create session
    const sessionId = this.generateSessionId();
    const session: Session = {
      id: sessionId,
      remoteAddress,
      remoteChainType,
      remoteIdentityKey: initialMessage.identityKey,
      ratchet,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      messageCount: 0,
    };

    // Store session
    this.sessions.set(sessionId, session);
    this.sessionsByAddress.set(this.makeAddressKey(remoteAddress, remoteChainType), sessionId);

    // Persist session
    await this.persistSession(session);

    return session;
  }

  // ---------------------------------------------------------------------------
  // Session Retrieval
  // ---------------------------------------------------------------------------

  /**
   * Get session by ID
   */
  getSession(sessionId: string): Session | null {
    return this.sessions.get(sessionId) ?? null;
  }

  /**
   * Get session by remote address
   */
  getSessionByAddress(address: string, chainType: ChainType): Session | null {
    const key = this.makeAddressKey(address, chainType);
    const sessionId = this.sessionsByAddress.get(key);
    if (!sessionId) return null;
    return this.sessions.get(sessionId) ?? null;
  }

  /**
   * Check if session exists for address
   */
  hasSession(address: string, chainType: ChainType): boolean {
    return this.sessionsByAddress.has(this.makeAddressKey(address, chainType));
  }

  /**
   * Get all sessions
   */
  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get session info (lightweight)
   */
  getSessionInfo(sessionId: string): SessionInfo | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    return {
      sessionId: session.id,
      remoteAddress: session.remoteAddress,
      remoteChainType: session.remoteChainType,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
      messageCount: session.messageCount,
    };
  }

  /**
   * List all session info
   */
  listSessionInfo(): SessionInfo[] {
    return this.getAllSessions().map(session => ({
      sessionId: session.id,
      remoteAddress: session.remoteAddress,
      remoteChainType: session.remoteChainType,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
      messageCount: session.messageCount,
    }));
  }

  // ---------------------------------------------------------------------------
  // Message Operations
  // ---------------------------------------------------------------------------

  /**
   * Encrypt a message for a session
   */
  async encryptMessage(
    sessionId: string,
    plaintext: Uint8Array
  ): Promise<{ ciphertext: Uint8Array; header: any }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new DeyondCryptError(
        `Session not found: ${sessionId}`,
        DeyondCryptErrorCode.SESSION_NOT_FOUND
      );
    }

    const encrypted = await session.ratchet.encrypt(plaintext);

    // Update session metadata
    session.lastActivityAt = Date.now();
    session.messageCount++;

    // Persist updated session
    await this.persistSession(session);

    return {
      ciphertext: encrypted.ciphertext,
      header: encrypted.header,
    };
  }

  /**
   * Decrypt a message for a session
   */
  async decryptMessage(
    sessionId: string,
    ciphertext: Uint8Array,
    header: any
  ): Promise<Uint8Array> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new DeyondCryptError(
        `Session not found: ${sessionId}`,
        DeyondCryptErrorCode.SESSION_NOT_FOUND
      );
    }

    const decrypted = await session.ratchet.decrypt({
      ciphertext,
      header,
      nonce: ciphertext.slice(0, 12),
    });

    // Update session metadata
    session.lastActivityAt = Date.now();
    session.messageCount++;

    // Persist updated session
    await this.persistSession(session);

    return decrypted;
  }

  // ---------------------------------------------------------------------------
  // Session Lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessionsByAddress.delete(
        this.makeAddressKey(session.remoteAddress, session.remoteChainType)
      );
      this.sessions.delete(sessionId);
      await this.sessionStore.deleteSession(sessionId);
    }
  }

  /**
   * Load all sessions from storage
   */
  async loadAllSessions(): Promise<void> {
    const sessionIds = await this.sessionStore.listSessionIds();

    for (const sessionId of sessionIds) {
      try {
        await this.loadSession(sessionId);
      } catch (error) {
        console.warn(`Failed to load session ${sessionId}:`, error);
      }
    }
  }

  /**
   * Load a specific session from storage
   */
  async loadSession(sessionId: string): Promise<Session | null> {
    const serialized = await this.sessionStore.loadSession(sessionId);
    if (!serialized) return null;

    const session = this.deserializeSession(serialized);
    this.sessions.set(session.id, session);
    this.sessionsByAddress.set(
      this.makeAddressKey(session.remoteAddress, session.remoteChainType),
      session.id
    );

    return session;
  }

  // ---------------------------------------------------------------------------
  // Persistence
  // ---------------------------------------------------------------------------

  /**
   * Persist a session to storage
   */
  private async persistSession(session: Session): Promise<void> {
    const serialized = this.serializeSession(session);
    await this.sessionStore.saveSession(serialized);
  }

  /**
   * Serialize a session for storage
   */
  private serializeSession(session: Session): SerializedSession {
    const state = session.ratchet.exportState();

    const serializedState: SerializedSessionState = {
      dhRatchetKeyPair: {
        publicKey: this.bytesToBase64(state.dhRatchetKeyPair.publicKey),
        privateKey: this.bytesToBase64(state.dhRatchetKeyPair.privateKey),
      },
      remoteDhRatchetKey: state.remoteDhRatchetKey
        ? this.bytesToBase64(state.remoteDhRatchetKey)
        : null,
      rootKey: this.bytesToBase64(state.rootKey),
      sendingChainKey: state.sendingChainKey ? this.bytesToBase64(state.sendingChainKey) : null,
      sendingMessageNumber: state.sendingMessageNumber,
      previousSendingChainLength: state.previousSendingChainLength,
      receivingChainKey: state.receivingChainKey
        ? this.bytesToBase64(state.receivingChainKey)
        : null,
      receivingMessageNumber: state.receivingMessageNumber,
      skippedMessageKeys: Array.from(state.skippedMessageKeys.entries()).map(([key, value]) => [
        key,
        this.bytesToBase64(value),
      ]),
    };

    return {
      id: session.id,
      remoteAddress: session.remoteAddress,
      remoteChainType: session.remoteChainType,
      remoteIdentityKey: this.bytesToBase64(session.remoteIdentityKey),
      state: serializedState,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
      messageCount: session.messageCount,
    };
  }

  /**
   * Deserialize a session from storage
   */
  private deserializeSession(serialized: SerializedSession): Session {
    const crypto = this.getCryptoPrimitive(serialized.remoteChainType);

    const state: SessionState = {
      remoteAddress: serialized.remoteAddress,
      remoteChainType: serialized.remoteChainType,
      remoteIdentityKey: this.base64ToBytes(serialized.remoteIdentityKey),
      dhRatchetKeyPair: {
        publicKey: this.base64ToBytes(serialized.state.dhRatchetKeyPair.publicKey),
        privateKey: this.base64ToBytes(serialized.state.dhRatchetKeyPair.privateKey),
      },
      remoteDhRatchetKey: serialized.state.remoteDhRatchetKey
        ? this.base64ToBytes(serialized.state.remoteDhRatchetKey)
        : null,
      rootKey: this.base64ToBytes(serialized.state.rootKey),
      sendingChainKey: serialized.state.sendingChainKey
        ? this.base64ToBytes(serialized.state.sendingChainKey)
        : null,
      sendingMessageNumber: serialized.state.sendingMessageNumber,
      previousSendingChainLength: serialized.state.previousSendingChainLength,
      receivingChainKey: serialized.state.receivingChainKey
        ? this.base64ToBytes(serialized.state.receivingChainKey)
        : null,
      receivingMessageNumber: serialized.state.receivingMessageNumber,
      skippedMessageKeys: new Map(
        serialized.state.skippedMessageKeys.map(([key, value]) => [key, this.base64ToBytes(value)])
      ),
      sessionId: serialized.id,
      createdAt: serialized.createdAt,
      lastActivityAt: serialized.lastActivityAt,
    };

    const ratchet = DoubleRatchet.fromState(crypto, state);

    return {
      id: serialized.id,
      remoteAddress: serialized.remoteAddress,
      remoteChainType: serialized.remoteChainType,
      remoteIdentityKey: this.base64ToBytes(serialized.remoteIdentityKey),
      ratchet,
      createdAt: serialized.createdAt,
      lastActivityAt: serialized.lastActivityAt,
      messageCount: serialized.messageCount,
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private getCryptoPrimitive(chainType: ChainType): ICryptoPrimitive {
    return CryptoPrimitiveRegistry.get(chainType);
  }

  private generateSessionId(): string {
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return this.bytesToHex(bytes);
  }

  private makeAddressKey(address: string, chainType: ChainType): string {
    return `${chainType}:${address.toLowerCase()}`;
  }

  private bytesToBase64(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...bytes));
  }

  private base64ToBytes(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  private bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

// =============================================================================
// In-Memory Session Store
// =============================================================================

/**
 * In-memory implementation of session store (for testing)
 */
export class InMemorySessionStore implements ISessionStore {
  private sessions: Map<string, SerializedSession> = new Map();

  async saveSession(session: SerializedSession): Promise<void> {
    this.sessions.set(session.id, session);
  }

  async loadSession(sessionId: string): Promise<SerializedSession | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async loadSessionByAddress(
    address: string,
    chainType: ChainType
  ): Promise<SerializedSession | null> {
    for (const session of this.sessions.values()) {
      if (
        session.remoteAddress.toLowerCase() === address.toLowerCase() &&
        session.remoteChainType === chainType
      ) {
        return session;
      }
    }
    return null;
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async listSessionIds(): Promise<string[]> {
    return Array.from(this.sessions.keys());
  }

  async listSessions(): Promise<SessionInfo[]> {
    return Array.from(this.sessions.values()).map(session => ({
      sessionId: session.id,
      remoteAddress: session.remoteAddress,
      remoteChainType: session.remoteChainType,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
      messageCount: session.messageCount,
    }));
  }
}
