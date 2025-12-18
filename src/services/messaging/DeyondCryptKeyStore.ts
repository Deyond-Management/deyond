/**
 * DeyondCrypt Key Store
 * SecureStore-backed persistent storage for DeyondCrypt keys
 */

import { SecureStorageService } from '../wallet/SecureStorageService';
import {
  IPreKeyStore,
  IdentityKeyPair,
  SignedPreKey,
  OneTimePreKey,
  ISessionStore,
  SerializedSession,
  IGroupSessionStore,
  GroupSessionState,
  GroupSessionInfo,
  ChainType,
} from '../../crypto/deyondcrypt';
import { logger } from '../../utils';

// =============================================================================
// Storage Keys
// =============================================================================

const STORAGE_KEYS = {
  IDENTITY_KEY: 'deyondcrypt_identity_key',
  SIGNED_PRE_KEY: 'deyondcrypt_signed_pre_key',
  ONE_TIME_PRE_KEYS: 'deyondcrypt_one_time_pre_keys',
  SESSIONS: 'deyondcrypt_sessions',
  SESSION_INDEX: 'deyondcrypt_session_index',
  GROUP_SESSIONS: 'deyondcrypt_group_sessions',
  GROUP_SESSION_INDEX: 'deyondcrypt_group_session_index',
  CONTACTS: 'deyondcrypt_contacts',
};

// =============================================================================
// Serialization Helpers
// =============================================================================

function uint8ArrayToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

interface SerializedIdentityKeyPair {
  publicKey: string;
  privateKey: string;
  chainType: ChainType;
  address: string;
}

interface SerializedSignedPreKey {
  keyId: number;
  keyPair: {
    publicKey: string;
    privateKey: string;
  };
  signature: string;
  timestamp: number;
}

interface SerializedOneTimePreKey {
  keyId: number;
  keyPair: {
    publicKey: string;
    privateKey: string;
  };
}

// =============================================================================
// DeyondCrypt PreKey Store
// =============================================================================

/**
 * SecureStore-backed PreKey store implementation
 */
export class DeyondCryptPreKeyStore implements IPreKeyStore {
  private log = logger.child({ service: 'DeyondCryptPreKeyStore' });
  private secureStorage: SecureStorageService;

  // In-memory cache
  private identityKeyPair: IdentityKeyPair | null = null;
  private signedPreKey: SignedPreKey | null = null;
  private oneTimePreKeys: Map<number, OneTimePreKey> = new Map();
  private initialized = false;

  constructor(secureStorage: SecureStorageService) {
    this.secureStorage = secureStorage;
  }

  /**
   * Initialize the store by loading from SecureStore
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load identity key
      const identityData = await this.secureStorage.getObject<SerializedIdentityKeyPair>(
        STORAGE_KEYS.IDENTITY_KEY
      );
      if (identityData) {
        this.identityKeyPair = this.deserializeIdentityKey(identityData);
      }

      // Load signed pre-key
      const signedPreKeyData = await this.secureStorage.getObject<SerializedSignedPreKey>(
        STORAGE_KEYS.SIGNED_PRE_KEY
      );
      if (signedPreKeyData) {
        this.signedPreKey = this.deserializeSignedPreKey(signedPreKeyData);
      }

      // Load one-time pre-keys
      const oneTimePreKeysData = await this.secureStorage.getObject<SerializedOneTimePreKey[]>(
        STORAGE_KEYS.ONE_TIME_PRE_KEYS
      );
      if (oneTimePreKeysData) {
        for (const keyData of oneTimePreKeysData) {
          const key = this.deserializeOneTimePreKey(keyData);
          this.oneTimePreKeys.set(key.keyId, key);
        }
      }

      this.initialized = true;
      this.log.info('PreKey store initialized', {
        hasIdentityKey: !!this.identityKeyPair,
        hasSignedPreKey: !!this.signedPreKey,
        oneTimePreKeyCount: this.oneTimePreKeys.size,
      });
    } catch (error) {
      this.log.error('Failed to initialize PreKey store', error as Error);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // IPreKeyStore Implementation
  // ---------------------------------------------------------------------------

  async storeIdentityKeyPair(keyPair: IdentityKeyPair): Promise<void> {
    this.identityKeyPair = keyPair;
    const serialized = this.serializeIdentityKey(keyPair);
    await this.secureStorage.setObject(STORAGE_KEYS.IDENTITY_KEY, serialized);
    this.log.info('Identity key stored', { address: keyPair.address });
  }

  async getIdentityKeyPair(): Promise<IdentityKeyPair | null> {
    return this.identityKeyPair;
  }

  async storeSignedPreKey(signedPreKey: SignedPreKey): Promise<void> {
    this.signedPreKey = signedPreKey;
    const serialized = this.serializeSignedPreKey(signedPreKey);
    await this.secureStorage.setObject(STORAGE_KEYS.SIGNED_PRE_KEY, serialized);
    this.log.info('Signed pre-key stored', { keyId: signedPreKey.keyId });
  }

  async getSignedPreKey(keyId: number): Promise<SignedPreKey | null> {
    if (this.signedPreKey?.keyId === keyId) {
      return this.signedPreKey;
    }
    return null;
  }

  async getCurrentSignedPreKey(): Promise<SignedPreKey | null> {
    return this.signedPreKey;
  }

  async storeOneTimePreKeys(keys: OneTimePreKey[]): Promise<void> {
    for (const key of keys) {
      this.oneTimePreKeys.set(key.keyId, key);
    }
    await this.persistOneTimePreKeys();
    this.log.info('One-time pre-keys stored', { count: keys.length });
  }

  async getOneTimePreKey(keyId: number): Promise<OneTimePreKey | null> {
    return this.oneTimePreKeys.get(keyId) || null;
  }

  async removeOneTimePreKey(keyId: number): Promise<void> {
    this.oneTimePreKeys.delete(keyId);
    await this.persistOneTimePreKeys();
  }

  async getOneTimePreKeyCount(): Promise<number> {
    return this.oneTimePreKeys.size;
  }

  // ---------------------------------------------------------------------------
  // Serialization
  // ---------------------------------------------------------------------------

  private serializeIdentityKey(key: IdentityKeyPair): SerializedIdentityKeyPair {
    return {
      publicKey: uint8ArrayToBase64(key.publicKey),
      privateKey: uint8ArrayToBase64(key.privateKey),
      chainType: key.chainType,
      address: key.address,
    };
  }

  private deserializeIdentityKey(data: SerializedIdentityKeyPair): IdentityKeyPair {
    return {
      publicKey: base64ToUint8Array(data.publicKey),
      privateKey: base64ToUint8Array(data.privateKey),
      chainType: data.chainType,
      address: data.address,
    };
  }

  private serializeSignedPreKey(key: SignedPreKey): SerializedSignedPreKey {
    return {
      keyId: key.keyId,
      keyPair: {
        publicKey: uint8ArrayToBase64(key.keyPair.publicKey),
        privateKey: uint8ArrayToBase64(key.keyPair.privateKey),
      },
      signature: uint8ArrayToBase64(key.signature),
      timestamp: key.timestamp,
    };
  }

  private deserializeSignedPreKey(data: SerializedSignedPreKey): SignedPreKey {
    return {
      keyId: data.keyId,
      keyPair: {
        publicKey: base64ToUint8Array(data.keyPair.publicKey),
        privateKey: base64ToUint8Array(data.keyPair.privateKey),
      },
      signature: base64ToUint8Array(data.signature),
      timestamp: data.timestamp,
    };
  }

  private serializeOneTimePreKey(key: OneTimePreKey): SerializedOneTimePreKey {
    return {
      keyId: key.keyId,
      keyPair: {
        publicKey: uint8ArrayToBase64(key.keyPair.publicKey),
        privateKey: uint8ArrayToBase64(key.keyPair.privateKey),
      },
    };
  }

  private deserializeOneTimePreKey(data: SerializedOneTimePreKey): OneTimePreKey {
    return {
      keyId: data.keyId,
      keyPair: {
        publicKey: base64ToUint8Array(data.keyPair.publicKey),
        privateKey: base64ToUint8Array(data.keyPair.privateKey),
      },
    };
  }

  private async persistOneTimePreKeys(): Promise<void> {
    const serialized = Array.from(this.oneTimePreKeys.values()).map(key =>
      this.serializeOneTimePreKey(key)
    );
    await this.secureStorage.setObject(STORAGE_KEYS.ONE_TIME_PRE_KEYS, serialized);
  }

  /**
   * Clear all stored keys (for wallet reset)
   */
  async clearAll(): Promise<void> {
    this.identityKeyPair = null;
    this.signedPreKey = null;
    this.oneTimePreKeys.clear();

    await this.secureStorage.deleteItem(STORAGE_KEYS.IDENTITY_KEY);
    await this.secureStorage.deleteItem(STORAGE_KEYS.SIGNED_PRE_KEY);
    await this.secureStorage.deleteItem(STORAGE_KEYS.ONE_TIME_PRE_KEYS);

    this.log.info('All keys cleared');
  }
}

// =============================================================================
// DeyondCrypt Session Store
// =============================================================================

/**
 * SecureStore-backed Session store implementation
 */
export class DeyondCryptSessionStore implements ISessionStore {
  private log = logger.child({ service: 'DeyondCryptSessionStore' });
  private secureStorage: SecureStorageService;

  // Session index for quick lookups
  private sessionIndex: Map<string, { id: string; address: string; chainType: ChainType }> =
    new Map();

  constructor(secureStorage: SecureStorageService) {
    this.secureStorage = secureStorage;
  }

  async initialize(): Promise<void> {
    try {
      const indexData = await this.secureStorage.getObject<
        Array<{ id: string; address: string; chainType: ChainType }>
      >(STORAGE_KEYS.SESSION_INDEX);

      if (indexData) {
        for (const entry of indexData) {
          this.sessionIndex.set(entry.id, entry);
        }
      }

      this.log.info('Session store initialized', { sessionCount: this.sessionIndex.size });
    } catch (error) {
      this.log.error('Failed to initialize session store', error as Error);
    }
  }

  async saveSession(session: SerializedSession): Promise<void> {
    const key = `${STORAGE_KEYS.SESSIONS}_${session.id}`;
    await this.secureStorage.setObject(key, session);

    // Update index
    this.sessionIndex.set(session.id, {
      id: session.id,
      address: session.remoteAddress,
      chainType: session.remoteChainType,
    });
    await this.persistIndex();
  }

  async loadSession(sessionId: string): Promise<SerializedSession | null> {
    const key = `${STORAGE_KEYS.SESSIONS}_${sessionId}`;
    return this.secureStorage.getObject<SerializedSession>(key);
  }

  async loadSessionByAddress(
    address: string,
    chainType: ChainType
  ): Promise<SerializedSession | null> {
    for (const entry of this.sessionIndex.values()) {
      if (entry.address.toLowerCase() === address.toLowerCase() && entry.chainType === chainType) {
        return this.loadSession(entry.id);
      }
    }
    return null;
  }

  async deleteSession(sessionId: string): Promise<void> {
    const key = `${STORAGE_KEYS.SESSIONS}_${sessionId}`;
    await this.secureStorage.deleteItem(key);

    this.sessionIndex.delete(sessionId);
    await this.persistIndex();
  }

  async listSessionIds(): Promise<string[]> {
    return Array.from(this.sessionIndex.keys());
  }

  async listSessions(): Promise<SerializedSession[]> {
    const sessions: SerializedSession[] = [];
    for (const entry of this.sessionIndex.values()) {
      const session = await this.loadSession(entry.id);
      if (session) {
        sessions.push(session);
      }
    }
    return sessions;
  }

  private async persistIndex(): Promise<void> {
    const indexData = Array.from(this.sessionIndex.values());
    await this.secureStorage.setObject(STORAGE_KEYS.SESSION_INDEX, indexData);
  }

  async clearAll(): Promise<void> {
    for (const sessionId of this.sessionIndex.keys()) {
      const key = `${STORAGE_KEYS.SESSIONS}_${sessionId}`;
      await this.secureStorage.deleteItem(key);
    }
    this.sessionIndex.clear();
    await this.secureStorage.deleteItem(STORAGE_KEYS.SESSION_INDEX);

    this.log.info('All sessions cleared');
  }
}

// =============================================================================
// DeyondCrypt Group Session Store
// =============================================================================

/**
 * SecureStore-backed Group Session store implementation
 */
export class DeyondCryptGroupSessionStore implements IGroupSessionStore {
  private log = logger.child({ service: 'DeyondCryptGroupSessionStore' });
  private secureStorage: SecureStorageService;

  // Group session index
  private groupIndex: Map<string, GroupSessionInfo> = new Map();

  constructor(secureStorage: SecureStorageService) {
    this.secureStorage = secureStorage;
  }

  async initialize(): Promise<void> {
    try {
      const indexData = await this.secureStorage.getObject<GroupSessionInfo[]>(
        STORAGE_KEYS.GROUP_SESSION_INDEX
      );

      if (indexData) {
        for (const info of indexData) {
          this.groupIndex.set(info.groupId, info);
        }
      }

      this.log.info('Group session store initialized', {
        groupCount: this.groupIndex.size,
      });
    } catch (error) {
      this.log.error('Failed to initialize group session store', error as Error);
    }
  }

  async saveGroupSession(session: GroupSessionState): Promise<void> {
    const key = `${STORAGE_KEYS.GROUP_SESSIONS}_${session.groupId}`;

    // Serialize for storage (Maps need special handling)
    const serialized = this.serializeGroupSession(session);
    await this.secureStorage.setObject(key, serialized);

    // Update index
    this.groupIndex.set(session.groupId, {
      groupId: session.groupId,
      groupName: session.groupName,
      memberCount: session.members.length,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
    });
    await this.persistIndex();
  }

  async loadGroupSession(groupId: string): Promise<GroupSessionState | null> {
    const key = `${STORAGE_KEYS.GROUP_SESSIONS}_${groupId}`;
    const data = await this.secureStorage.getObject<SerializedGroupSession>(key);

    if (!data) return null;

    return this.deserializeGroupSession(data);
  }

  async deleteGroupSession(groupId: string): Promise<void> {
    const key = `${STORAGE_KEYS.GROUP_SESSIONS}_${groupId}`;
    await this.secureStorage.deleteItem(key);

    this.groupIndex.delete(groupId);
    await this.persistIndex();
  }

  async listGroupSessions(): Promise<GroupSessionInfo[]> {
    return Array.from(this.groupIndex.values());
  }

  private async persistIndex(): Promise<void> {
    const indexData = Array.from(this.groupIndex.values());
    await this.secureStorage.setObject(STORAGE_KEYS.GROUP_SESSION_INDEX, indexData);
  }

  // Serialization helpers for GroupSessionState (which contains Maps)
  private serializeGroupSession(session: GroupSessionState): SerializedGroupSession {
    return {
      ...session,
      mySenderKey: this.serializeSenderKeyState(session.mySenderKey),
      memberSenderKeys: Array.from(session.memberSenderKeys.entries()).map(([addr, state]) => ({
        address: addr,
        state: this.serializeSenderKeyState(state),
      })),
    };
  }

  private deserializeGroupSession(data: SerializedGroupSession): GroupSessionState {
    return {
      groupId: data.groupId,
      groupName: data.groupName,
      mySenderKey: this.deserializeSenderKeyState(data.mySenderKey),
      memberSenderKeys: new Map(
        data.memberSenderKeys.map(entry => [
          entry.address,
          this.deserializeSenderKeyState(entry.state),
        ])
      ),
      members: data.members,
      createdAt: data.createdAt,
      lastActivityAt: data.lastActivityAt,
    };
  }

  private serializeSenderKeyState(state: any): SerializedSenderKeyState {
    return {
      senderAddress: state.senderAddress,
      senderChainType: state.senderChainType,
      keyId: state.keyId,
      chainKey: uint8ArrayToBase64(state.chainKey),
      publicSigningKey: uint8ArrayToBase64(state.publicSigningKey),
      privateSigningKey: state.privateSigningKey
        ? uint8ArrayToBase64(state.privateSigningKey)
        : undefined,
      iteration: state.iteration,
      messageKeys: Array.from(state.messageKeys.entries()).map(([iter, key]) => ({
        iteration: iter as number,
        key: uint8ArrayToBase64(key as Uint8Array),
      })),
    };
  }

  private deserializeSenderKeyState(data: SerializedSenderKeyState): any {
    return {
      senderAddress: data.senderAddress,
      senderChainType: data.senderChainType,
      keyId: data.keyId,
      chainKey: base64ToUint8Array(data.chainKey),
      publicSigningKey: base64ToUint8Array(data.publicSigningKey),
      privateSigningKey: data.privateSigningKey
        ? base64ToUint8Array(data.privateSigningKey)
        : undefined,
      iteration: data.iteration,
      messageKeys: new Map(
        data.messageKeys.map(entry => [entry.iteration, base64ToUint8Array(entry.key)])
      ),
    };
  }

  async clearAll(): Promise<void> {
    for (const groupId of this.groupIndex.keys()) {
      const key = `${STORAGE_KEYS.GROUP_SESSIONS}_${groupId}`;
      await this.secureStorage.deleteItem(key);
    }
    this.groupIndex.clear();
    await this.secureStorage.deleteItem(STORAGE_KEYS.GROUP_SESSION_INDEX);

    this.log.info('All group sessions cleared');
  }
}

// =============================================================================
// Types for Serialization
// =============================================================================

interface SerializedGroupSession {
  groupId: string;
  groupName: string;
  mySenderKey: SerializedSenderKeyState;
  memberSenderKeys: Array<{
    address: string;
    state: SerializedSenderKeyState;
  }>;
  members: any[];
  createdAt: number;
  lastActivityAt: number;
}

interface SerializedSenderKeyState {
  senderAddress: string;
  senderChainType: ChainType;
  keyId: number;
  chainKey: string;
  publicSigningKey: string;
  privateSigningKey?: string;
  iteration: number;
  messageKeys: Array<{ iteration: number; key: string }>;
}
