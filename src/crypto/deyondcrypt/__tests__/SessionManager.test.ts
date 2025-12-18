/**
 * DeyondCrypt - Session Manager Tests
 */

import { SessionManager, InMemorySessionStore, Session } from '../sessions/SessionManager';
import { X3DH, InMemoryPreKeyStore } from '../keys/X3DH';
import { EVMCrypto } from '../primitives/EVMCrypto';
import { CryptoPrimitiveRegistry } from '../primitives';
import { IdentityKeyPair, PreKeyBundle } from '../types';

describe('SessionManager', () => {
  let crypto: EVMCrypto;
  let aliceSessionManager: SessionManager;
  let bobSessionManager: SessionManager;
  let aliceIdentityKey: IdentityKeyPair;
  let bobIdentityKey: IdentityKeyPair;
  let alicePreKeyStore: InMemoryPreKeyStore;
  let bobPreKeyStore: InMemoryPreKeyStore;
  let aliceSessionStore: InMemorySessionStore;
  let bobSessionStore: InMemorySessionStore;
  let bobPreKeyBundle: PreKeyBundle;

  beforeAll(() => {
    // Register crypto primitive
    crypto = new EVMCrypto();
    CryptoPrimitiveRegistry.clear();
    CryptoPrimitiveRegistry.register(crypto);
  });

  beforeEach(async () => {
    // Create Alice's identity and stores
    const aliceX3dh = new X3DH(crypto);
    const aliceWalletKey = new Uint8Array(32).fill(0x01);
    aliceIdentityKey = await aliceX3dh.generateIdentityKeyPair(aliceWalletKey, 1, 'evm');
    alicePreKeyStore = new InMemoryPreKeyStore();
    aliceSessionStore = new InMemorySessionStore();
    await alicePreKeyStore.storeIdentityKeyPair(aliceIdentityKey);

    // Create Bob's identity and stores
    const bobX3dh = new X3DH(crypto);
    const bobWalletKey = new Uint8Array(32).fill(0x02);
    bobIdentityKey = await bobX3dh.generateIdentityKeyPair(bobWalletKey, 1, 'evm');
    bobPreKeyStore = new InMemoryPreKeyStore();
    bobSessionStore = new InMemorySessionStore();
    await bobPreKeyStore.storeIdentityKeyPair(bobIdentityKey);

    // Generate Bob's pre-keys
    const bobSignedPreKey = await bobX3dh.generateSignedPreKey(bobIdentityKey, 1);
    const bobOneTimePreKeys = await bobX3dh.generateOneTimePreKeys(0, 10);
    await bobPreKeyStore.storeSignedPreKey(bobSignedPreKey);
    await bobPreKeyStore.storeOneTimePreKeys(bobOneTimePreKeys);

    // Create Bob's pre-key bundle
    bobPreKeyBundle = bobX3dh.createPreKeyBundle(
      bobIdentityKey,
      bobSignedPreKey,
      bobOneTimePreKeys[0]
    );

    // Create session managers
    aliceSessionManager = new SessionManager(aliceIdentityKey, alicePreKeyStore, aliceSessionStore);

    bobSessionManager = new SessionManager(bobIdentityKey, bobPreKeyStore, bobSessionStore);
  });

  describe('session creation', () => {
    it('should create a new session as initiator', async () => {
      const { session, initialMessage } = await aliceSessionManager.createSession(bobPreKeyBundle);

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.remoteAddress).toBe(bobPreKeyBundle.address);
      expect(session.remoteChainType).toBe('evm');
      expect(session.messageCount).toBe(0);
      expect(initialMessage).toBeDefined();
      expect(initialMessage.identityKey).toEqual(aliceIdentityKey.publicKey);
    });

    it('should accept a session as responder', async () => {
      // Alice creates session
      const { initialMessage } = await aliceSessionManager.createSession(bobPreKeyBundle);

      // Bob accepts session
      const bobSession = await bobSessionManager.acceptSession(initialMessage, 'evm');

      expect(bobSession).toBeDefined();
      expect(bobSession.remoteChainType).toBe('evm');
    });

    it('should use one-time pre-key when available', async () => {
      const initialCount = await bobPreKeyStore.getOneTimePreKeyCount();

      // Alice creates session (uses one-time pre-key)
      const { initialMessage } = await aliceSessionManager.createSession(bobPreKeyBundle);

      expect(initialMessage.usedOneTimePreKeyId).toBe(0);

      // Bob accepts session (consumes one-time pre-key)
      await bobSessionManager.acceptSession(initialMessage, 'evm');

      const afterCount = await bobPreKeyStore.getOneTimePreKeyCount();
      expect(afterCount).toBe(initialCount - 1);
    });
  });

  describe('session retrieval', () => {
    let session: Session;

    beforeEach(async () => {
      const result = await aliceSessionManager.createSession(bobPreKeyBundle);
      session = result.session;
    });

    it('should get session by ID', () => {
      const retrieved = aliceSessionManager.getSession(session.id);
      expect(retrieved).toBe(session);
    });

    it('should get session by address', () => {
      const retrieved = aliceSessionManager.getSessionByAddress(bobPreKeyBundle.address, 'evm');
      expect(retrieved).toBe(session);
    });

    it('should check if session exists', () => {
      expect(aliceSessionManager.hasSession(bobPreKeyBundle.address, 'evm')).toBe(true);
      expect(
        aliceSessionManager.hasSession('0x1234567890123456789012345678901234567890', 'evm')
      ).toBe(false);
    });

    it('should return null for non-existent session', () => {
      expect(aliceSessionManager.getSession('non-existent')).toBeNull();
      expect(aliceSessionManager.getSessionByAddress('0x0000', 'evm')).toBeNull();
    });

    it('should get all sessions', async () => {
      // Create another session with different bundle
      const anotherX3dh = new X3DH(crypto);
      const anotherWalletKey = new Uint8Array(32).fill(0x03);
      const anotherIdentityKey = await anotherX3dh.generateIdentityKeyPair(
        anotherWalletKey,
        1,
        'evm'
      );
      const anotherSignedPreKey = await anotherX3dh.generateSignedPreKey(anotherIdentityKey, 1);
      const anotherBundle = anotherX3dh.createPreKeyBundle(anotherIdentityKey, anotherSignedPreKey);

      await aliceSessionManager.createSession(anotherBundle);

      const sessions = aliceSessionManager.getAllSessions();
      expect(sessions.length).toBe(2);
    });

    it('should get session info', () => {
      const info = aliceSessionManager.getSessionInfo(session.id);

      expect(info).toBeDefined();
      expect(info!.sessionId).toBe(session.id);
      expect(info!.remoteAddress).toBe(session.remoteAddress);
      expect(info!.remoteChainType).toBe(session.remoteChainType);
      expect(info!.messageCount).toBe(0);
    });

    it('should list all session info', async () => {
      const infoList = aliceSessionManager.listSessionInfo();

      expect(infoList.length).toBe(1);
      expect(infoList[0].sessionId).toBe(session.id);
    });
  });

  describe('message encryption/decryption', () => {
    let aliceSession: Session;
    let bobSession: Session;

    beforeEach(async () => {
      // Alice creates session
      const { session, initialMessage } = await aliceSessionManager.createSession(bobPreKeyBundle);
      aliceSession = session;

      // Bob accepts session
      bobSession = await bobSessionManager.acceptSession(initialMessage, 'evm');
    });

    it('should encrypt and decrypt a message', async () => {
      const plaintext = new TextEncoder().encode('Hello, Bob!');

      // Alice encrypts
      const { ciphertext, header } = await aliceSessionManager.encryptMessage(
        aliceSession.id,
        plaintext
      );

      expect(ciphertext).toBeInstanceOf(Uint8Array);
      expect(header).toBeDefined();

      // Bob decrypts
      const decrypted = await bobSessionManager.decryptMessage(bobSession.id, ciphertext, header);

      expect(decrypted).toEqual(plaintext);
    });

    it('should update message count after encryption', async () => {
      const plaintext = new TextEncoder().encode('Test');

      await aliceSessionManager.encryptMessage(aliceSession.id, plaintext);

      const session = aliceSessionManager.getSession(aliceSession.id);
      expect(session!.messageCount).toBe(1);
    });

    it('should handle bidirectional communication', async () => {
      // Alice sends to Bob
      const msg1 = new TextEncoder().encode('Hello Bob');
      const enc1 = await aliceSessionManager.encryptMessage(aliceSession.id, msg1);
      const dec1 = await bobSessionManager.decryptMessage(
        bobSession.id,
        enc1.ciphertext,
        enc1.header
      );
      expect(dec1).toEqual(msg1);

      // Bob sends to Alice
      const msg2 = new TextEncoder().encode('Hello Alice');
      const enc2 = await bobSessionManager.encryptMessage(bobSession.id, msg2);
      const dec2 = await aliceSessionManager.decryptMessage(
        aliceSession.id,
        enc2.ciphertext,
        enc2.header
      );
      expect(dec2).toEqual(msg2);
    });

    it('should throw error for non-existent session', async () => {
      const plaintext = new TextEncoder().encode('Test');

      await expect(aliceSessionManager.encryptMessage('non-existent', plaintext)).rejects.toThrow(
        'Session not found'
      );
    });
  });

  describe('session lifecycle', () => {
    it('should delete a session', async () => {
      const { session } = await aliceSessionManager.createSession(bobPreKeyBundle);

      expect(aliceSessionManager.hasSession(bobPreKeyBundle.address, 'evm')).toBe(true);

      await aliceSessionManager.deleteSession(session.id);

      expect(aliceSessionManager.hasSession(bobPreKeyBundle.address, 'evm')).toBe(false);
      expect(aliceSessionManager.getSession(session.id)).toBeNull();
    });

    it('should persist session to store', async () => {
      await aliceSessionManager.createSession(bobPreKeyBundle);

      const sessionIds = await aliceSessionStore.listSessionIds();
      expect(sessionIds.length).toBe(1);
    });

    it('should load session from store', async () => {
      const { session } = await aliceSessionManager.createSession(bobPreKeyBundle);

      // Create new session manager with same store
      const newSessionManager = new SessionManager(
        aliceIdentityKey,
        alicePreKeyStore,
        aliceSessionStore
      );

      // Load session
      const loaded = await newSessionManager.loadSession(session.id);

      expect(loaded).toBeDefined();
      expect(loaded!.id).toBe(session.id);
      expect(loaded!.remoteAddress).toBe(session.remoteAddress);
    });

    it('should load all sessions from store', async () => {
      await aliceSessionManager.createSession(bobPreKeyBundle);

      // Create new session manager with same store
      const newSessionManager = new SessionManager(
        aliceIdentityKey,
        alicePreKeyStore,
        aliceSessionStore
      );

      await newSessionManager.loadAllSessions();

      const sessions = newSessionManager.getAllSessions();
      expect(sessions.length).toBe(1);
    });

    it('should continue conversation after session reload', async () => {
      // Create session and exchange messages
      const { session, initialMessage } = await aliceSessionManager.createSession(bobPreKeyBundle);
      const bobSession = await bobSessionManager.acceptSession(initialMessage, 'evm');

      const msg1 = new TextEncoder().encode('Before reload');
      const enc1 = await aliceSessionManager.encryptMessage(session.id, msg1);
      await bobSessionManager.decryptMessage(bobSession.id, enc1.ciphertext, enc1.header);

      // Reload Alice's session
      const newAliceSessionManager = new SessionManager(
        aliceIdentityKey,
        alicePreKeyStore,
        aliceSessionStore
      );
      await newAliceSessionManager.loadAllSessions();

      // Continue conversation
      const msg2 = new TextEncoder().encode('After reload');
      const enc2 = await newAliceSessionManager.encryptMessage(session.id, msg2);
      const dec2 = await bobSessionManager.decryptMessage(
        bobSession.id,
        enc2.ciphertext,
        enc2.header
      );

      expect(dec2).toEqual(msg2);
    });
  });

  describe('InMemorySessionStore', () => {
    let store: InMemorySessionStore;

    beforeEach(() => {
      store = new InMemorySessionStore();
    });

    it('should save and load session', async () => {
      const { session } = await aliceSessionManager.createSession(bobPreKeyBundle);

      const loaded = await aliceSessionStore.loadSession(session.id);
      expect(loaded).toBeDefined();
      expect(loaded!.id).toBe(session.id);
    });

    it('should load session by address', async () => {
      const { session } = await aliceSessionManager.createSession(bobPreKeyBundle);

      const loaded = await aliceSessionStore.loadSessionByAddress(bobPreKeyBundle.address, 'evm');

      expect(loaded).toBeDefined();
      expect(loaded!.id).toBe(session.id);
    });

    it('should delete session', async () => {
      const { session } = await aliceSessionManager.createSession(bobPreKeyBundle);

      await aliceSessionStore.deleteSession(session.id);

      const loaded = await aliceSessionStore.loadSession(session.id);
      expect(loaded).toBeNull();
    });

    it('should list session IDs', async () => {
      await aliceSessionManager.createSession(bobPreKeyBundle);

      const ids = await aliceSessionStore.listSessionIds();
      expect(ids.length).toBe(1);
    });

    it('should list sessions info', async () => {
      await aliceSessionManager.createSession(bobPreKeyBundle);

      const sessions = await aliceSessionStore.listSessions();
      expect(sessions.length).toBe(1);
      expect(sessions[0].remoteAddress).toBe(bobPreKeyBundle.address);
    });
  });
});
