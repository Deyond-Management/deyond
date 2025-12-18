/**
 * DeyondCrypt - Group Messaging Tests
 */

import {
  SenderKeyRatchet,
  SenderKeyDistributionBuilder,
  GroupMessageBuilder,
  GroupSessionManager,
  InMemoryGroupSessionStore,
} from '../groups';
import { EVMCrypto } from '../primitives/EVMCrypto';
import { CryptoPrimitiveRegistry } from '../primitives';
import { IdentityKeyPair, SenderKeyState } from '../types';

describe('Group Messaging (Sender Keys)', () => {
  let crypto: EVMCrypto;

  beforeAll(() => {
    crypto = new EVMCrypto();
    CryptoPrimitiveRegistry.clear();
    CryptoPrimitiveRegistry.register(crypto);
  });

  describe('SenderKeyRatchet', () => {
    let ratchet: SenderKeyRatchet;

    beforeEach(() => {
      ratchet = new SenderKeyRatchet();
    });

    it('should create a new sender key state', async () => {
      const state = await ratchet.createSenderKeyState(
        '0x1234567890123456789012345678901234567890',
        'evm'
      );

      expect(state.senderAddress).toBe('0x1234567890123456789012345678901234567890');
      expect(state.senderChainType).toBe('evm');
      expect(state.chainKey).toBeInstanceOf(Uint8Array);
      expect(state.chainKey.length).toBe(32);
      expect(state.publicSigningKey).toBeInstanceOf(Uint8Array);
      expect(state.privateSigningKey).toBeInstanceOf(Uint8Array);
      expect(state.iteration).toBe(0);
      expect(state.keyId).toBeGreaterThan(0);
    });

    it('should ratchet forward and produce message keys', async () => {
      const state = await ratchet.createSenderKeyState(
        '0x1234567890123456789012345678901234567890',
        'evm'
      );

      const initialChainKey = new Uint8Array(state.chainKey);
      const { messageKey, iteration } = await ratchet.ratchetForward(state);

      expect(messageKey).toBeInstanceOf(Uint8Array);
      expect(messageKey.length).toBe(32);
      expect(iteration).toBe(0);
      expect(state.iteration).toBe(1);
      expect(state.chainKey).not.toEqual(initialChainKey);
    });

    it('should produce different message keys for each iteration', async () => {
      const state = await ratchet.createSenderKeyState(
        '0x1234567890123456789012345678901234567890',
        'evm'
      );

      const { messageKey: key1 } = await ratchet.ratchetForward(state);
      const { messageKey: key2 } = await ratchet.ratchetForward(state);
      const { messageKey: key3 } = await ratchet.ratchetForward(state);

      expect(key1).not.toEqual(key2);
      expect(key2).not.toEqual(key3);
      expect(key1).not.toEqual(key3);
    });

    it('should encrypt and decrypt messages', async () => {
      const senderState = await ratchet.createSenderKeyState(
        '0xsender0000000000000000000000000000000000',
        'evm'
      );

      // Create receiver state from sender's public info
      const receiverState: SenderKeyState = {
        senderAddress: senderState.senderAddress,
        senderChainType: senderState.senderChainType,
        keyId: senderState.keyId,
        chainKey: new Uint8Array(senderState.chainKey),
        publicSigningKey: new Uint8Array(senderState.publicSigningKey),
        iteration: 0,
        messageKeys: new Map(),
      };

      const plaintext = new TextEncoder().encode('Hello, group!');

      // Sender encrypts
      const { ciphertext, nonce, iteration } = await ratchet.encrypt(plaintext, senderState);

      expect(ciphertext).toBeInstanceOf(Uint8Array);
      expect(iteration).toBe(0);

      // Receiver decrypts
      const decrypted = await ratchet.decrypt(ciphertext, nonce, iteration, receiverState);

      expect(decrypted).toEqual(plaintext);
    });

    it('should handle out-of-order messages', async () => {
      const senderState = await ratchet.createSenderKeyState(
        '0xsender0000000000000000000000000000000000',
        'evm'
      );

      const receiverState: SenderKeyState = {
        senderAddress: senderState.senderAddress,
        senderChainType: senderState.senderChainType,
        keyId: senderState.keyId,
        chainKey: new Uint8Array(senderState.chainKey),
        publicSigningKey: new Uint8Array(senderState.publicSigningKey),
        iteration: 0,
        messageKeys: new Map(),
      };

      // Send 3 messages
      const messages: Array<{
        ciphertext: Uint8Array;
        nonce: Uint8Array;
        iteration: number;
        plaintext: Uint8Array;
      }> = [];

      for (let i = 0; i < 3; i++) {
        const plaintext = new TextEncoder().encode(`Message ${i}`);
        const { ciphertext, nonce, iteration } = await ratchet.encrypt(plaintext, senderState);
        messages.push({ ciphertext, nonce, iteration, plaintext });
      }

      // Receive in reverse order
      const decrypted2 = await ratchet.decrypt(
        messages[2].ciphertext,
        messages[2].nonce,
        messages[2].iteration,
        receiverState
      );
      expect(decrypted2).toEqual(messages[2].plaintext);

      const decrypted0 = await ratchet.decrypt(
        messages[0].ciphertext,
        messages[0].nonce,
        messages[0].iteration,
        receiverState
      );
      expect(decrypted0).toEqual(messages[0].plaintext);

      const decrypted1 = await ratchet.decrypt(
        messages[1].ciphertext,
        messages[1].nonce,
        messages[1].iteration,
        receiverState
      );
      expect(decrypted1).toEqual(messages[1].plaintext);
    });
  });

  describe('SenderKeyDistributionBuilder', () => {
    let ratchet: SenderKeyRatchet;
    let distributionBuilder: SenderKeyDistributionBuilder;

    beforeEach(() => {
      ratchet = new SenderKeyRatchet();
      distributionBuilder = new SenderKeyDistributionBuilder();
    });

    it('should create a valid distribution message', async () => {
      const state = await ratchet.createSenderKeyState(
        '0x1234567890123456789012345678901234567890',
        'evm'
      );

      const distribution = await distributionBuilder.createDistribution('group-123', state);

      expect(distribution.groupId).toBe('group-123');
      expect(distribution.senderAddress).toBe('0x1234567890123456789012345678901234567890');
      expect(distribution.senderChainType).toBe('evm');
      expect(distribution.keyId).toBe(state.keyId);
      expect(distribution.chainKey).toBeDefined();
      expect(distribution.publicSigningKey).toBeDefined();
      expect(distribution.signature).toBeDefined();
      expect(distribution.timestamp).toBeGreaterThan(0);
    });

    it('should verify a valid distribution message', async () => {
      const state = await ratchet.createSenderKeyState(
        '0x1234567890123456789012345678901234567890',
        'evm'
      );

      const distribution = await distributionBuilder.createDistribution('group-123', state);

      const isValid = await distributionBuilder.verifyDistribution(distribution);
      expect(isValid).toBe(true);
    });

    it('should reject tampered distribution message', async () => {
      const state = await ratchet.createSenderKeyState(
        '0x1234567890123456789012345678901234567890',
        'evm'
      );

      const distribution = await distributionBuilder.createDistribution('group-123', state);

      // Tamper with the chain key
      distribution.chainKey = btoa('tampered-chain-key-000000000000');

      const isValid = await distributionBuilder.verifyDistribution(distribution);
      expect(isValid).toBe(false);
    });

    it('should create sender key state from distribution', async () => {
      const originalState = await ratchet.createSenderKeyState(
        '0x1234567890123456789012345678901234567890',
        'evm'
      );

      const distribution = await distributionBuilder.createDistribution('group-123', originalState);

      const recreatedState = ratchet.createSenderKeyStateFromDistribution(distribution);

      expect(recreatedState.senderAddress).toBe(originalState.senderAddress);
      expect(recreatedState.keyId).toBe(originalState.keyId);
      expect(recreatedState.iteration).toBe(originalState.iteration);
      expect(recreatedState.chainKey).toEqual(originalState.chainKey);
      expect(recreatedState.publicSigningKey).toEqual(originalState.publicSigningKey);
      expect(recreatedState.privateSigningKey).toBeUndefined();
    });
  });

  describe('GroupMessageBuilder', () => {
    let ratchet: SenderKeyRatchet;
    let messageBuilder: GroupMessageBuilder;

    beforeEach(() => {
      ratchet = new SenderKeyRatchet();
      messageBuilder = new GroupMessageBuilder();
    });

    it('should build and decrypt a group message', async () => {
      const senderState = await ratchet.createSenderKeyState(
        '0xsender0000000000000000000000000000000000',
        'evm'
      );

      const receiverState: SenderKeyState = {
        senderAddress: senderState.senderAddress,
        senderChainType: senderState.senderChainType,
        keyId: senderState.keyId,
        chainKey: new Uint8Array(senderState.chainKey),
        publicSigningKey: new Uint8Array(senderState.publicSigningKey),
        iteration: 0,
        messageKeys: new Map(),
      };

      const plaintext = new TextEncoder().encode('Hello, group members!');

      // Build message
      const message = await messageBuilder.buildMessage('group-123', plaintext, senderState);

      expect(message.groupId).toBe('group-123');
      expect(message.senderAddress).toBe(senderState.senderAddress);
      expect(message.keyId).toBe(senderState.keyId);
      expect(message.iteration).toBe(0);
      expect(message.ciphertext).toBeDefined();
      expect(message.signature).toBeDefined();
      expect(message.messageId).toBeDefined();

      // Decrypt message
      const decrypted = await messageBuilder.decryptMessage(message, receiverState);
      expect(decrypted).toEqual(plaintext);
    });

    it('should reject message with invalid signature', async () => {
      const senderState = await ratchet.createSenderKeyState(
        '0xsender0000000000000000000000000000000000',
        'evm'
      );

      const receiverState: SenderKeyState = {
        senderAddress: senderState.senderAddress,
        senderChainType: senderState.senderChainType,
        keyId: senderState.keyId,
        chainKey: new Uint8Array(senderState.chainKey),
        publicSigningKey: new Uint8Array(senderState.publicSigningKey),
        iteration: 0,
        messageKeys: new Map(),
      };

      const plaintext = new TextEncoder().encode('Hello!');
      const message = await messageBuilder.buildMessage('group-123', plaintext, senderState);

      // Tamper with signature
      message.signature = btoa(String.fromCharCode(...new Uint8Array(64).fill(0xff)));

      await expect(messageBuilder.decryptMessage(message, receiverState)).rejects.toThrow(
        'Invalid message signature'
      );
    });
  });

  describe('GroupSessionManager', () => {
    let aliceIdentity: IdentityKeyPair;
    let bobIdentity: IdentityKeyPair;
    let charlieIdentity: IdentityKeyPair;
    let aliceManager: GroupSessionManager;
    let bobManager: GroupSessionManager;
    let charlieManager: GroupSessionManager;

    beforeEach(async () => {
      // Create identity keys
      const aliceKeyPair = await crypto.generateKeyPair();
      aliceIdentity = {
        ...aliceKeyPair,
        chainType: 'evm',
        address: crypto.publicKeyToAddress(aliceKeyPair.publicKey),
      };

      const bobKeyPair = await crypto.generateKeyPair();
      bobIdentity = {
        ...bobKeyPair,
        chainType: 'evm',
        address: crypto.publicKeyToAddress(bobKeyPair.publicKey),
      };

      const charlieKeyPair = await crypto.generateKeyPair();
      charlieIdentity = {
        ...charlieKeyPair,
        chainType: 'evm',
        address: crypto.publicKeyToAddress(charlieKeyPair.publicKey),
      };

      // Create session managers
      aliceManager = new GroupSessionManager(aliceIdentity, new InMemoryGroupSessionStore());

      bobManager = new GroupSessionManager(bobIdentity, new InMemoryGroupSessionStore());

      charlieManager = new GroupSessionManager(charlieIdentity, new InMemoryGroupSessionStore());
    });

    it('should create a new group', async () => {
      const { session, distributions } = await aliceManager.createGroup('Test Group', [
        {
          address: bobIdentity.address,
          chainType: 'evm',
          role: 'member',
          joinedAt: Date.now(),
        },
      ]);

      expect(session.groupId).toBeDefined();
      expect(session.groupName).toBe('Test Group');
      expect(session.members.length).toBe(2);
      expect(distributions.length).toBe(1);
    });

    it('should join a group and exchange messages', async () => {
      // Alice creates group
      const { session: aliceSession, distributions } = await aliceManager.createGroup(
        'Chat Group',
        []
      );

      // Bob joins by receiving Alice's distribution
      const { myDistribution: bobDistribution } = await bobManager.joinGroup(
        aliceSession.groupId,
        'Chat Group',
        distributions[0] ||
          (await new SenderKeyDistributionBuilder().createDistribution(
            aliceSession.groupId,
            aliceSession.mySenderKey
          ))
      );

      // Alice processes Bob's distribution
      await aliceManager.processDistribution(bobDistribution);

      // Alice sends message
      const aliceMessage = await aliceManager.sendMessage(
        aliceSession.groupId,
        new TextEncoder().encode('Hello from Alice!')
      );

      // Bob receives message
      const alicePlaintext = await bobManager.receiveMessage(aliceMessage);
      expect(new TextDecoder().decode(alicePlaintext)).toBe('Hello from Alice!');

      // Bob sends message
      const bobMessage = await bobManager.sendMessage(
        aliceSession.groupId,
        new TextEncoder().encode('Hello from Bob!')
      );

      // Alice receives message
      const bobPlaintext = await aliceManager.receiveMessage(bobMessage);
      expect(new TextDecoder().decode(bobPlaintext)).toBe('Hello from Bob!');
    });

    it('should handle multiple members', async () => {
      // Alice creates group
      const { session: aliceSession } = await aliceManager.createGroup('Multi Chat');

      // Create Alice's distribution
      const aliceDistribution = await new SenderKeyDistributionBuilder().createDistribution(
        aliceSession.groupId,
        aliceSession.mySenderKey
      );

      // Bob joins
      const { myDistribution: bobDistribution } = await bobManager.joinGroup(
        aliceSession.groupId,
        'Multi Chat',
        aliceDistribution
      );

      // Charlie joins
      const { myDistribution: charlieDistribution } = await charlieManager.joinGroup(
        aliceSession.groupId,
        'Multi Chat',
        aliceDistribution
      );

      // Process distributions
      await aliceManager.processDistribution(bobDistribution);
      await aliceManager.processDistribution(charlieDistribution);
      await bobManager.processDistribution(charlieDistribution);
      await charlieManager.processDistribution(bobDistribution);

      // Alice sends message
      const message = await aliceManager.sendMessage(
        aliceSession.groupId,
        new TextEncoder().encode('Hello everyone!')
      );

      // Both Bob and Charlie can decrypt
      const bobDecrypted = await bobManager.receiveMessage(message);
      const charlieDecrypted = await charlieManager.receiveMessage(message);

      expect(new TextDecoder().decode(bobDecrypted)).toBe('Hello everyone!');
      expect(new TextDecoder().decode(charlieDecrypted)).toBe('Hello everyone!');
    });

    it('should rotate sender keys', async () => {
      // Alice creates group
      const { session: aliceSession } = await aliceManager.createGroup('Key Rotation Test');

      const aliceDistribution = await new SenderKeyDistributionBuilder().createDistribution(
        aliceSession.groupId,
        aliceSession.mySenderKey
      );

      // Bob joins
      await bobManager.joinGroup(aliceSession.groupId, 'Key Rotation Test', aliceDistribution);

      // Alice rotates her sender key
      const newDistribution = await aliceManager.rotateSenderKey(aliceSession.groupId);

      // Bob processes new distribution
      await bobManager.processDistribution(newDistribution);

      // Alice sends message with new key
      const message = await aliceManager.sendMessage(
        aliceSession.groupId,
        new TextEncoder().encode('Message after key rotation')
      );

      // Bob can still decrypt
      const decrypted = await bobManager.receiveMessage(message);
      expect(new TextDecoder().decode(decrypted)).toBe('Message after key rotation');
    });

    it('should list and delete sessions', async () => {
      // Create multiple groups
      await aliceManager.createGroup('Group 1');
      await aliceManager.createGroup('Group 2');

      const sessions = await aliceManager.listSessions();
      expect(sessions.length).toBe(2);

      // Delete one
      await aliceManager.deleteSession(sessions[0].groupId);

      const remainingSessions = await aliceManager.listSessions();
      expect(remainingSessions.length).toBe(1);
      expect(remainingSessions[0].groupName).toBe('Group 2');
    });

    it('should manage group members', async () => {
      const { session } = await aliceManager.createGroup('Member Management');

      // Add Bob
      await aliceManager.addMember(session.groupId, {
        address: bobIdentity.address,
        chainType: 'evm',
        role: 'member',
        joinedAt: Date.now(),
      });

      let members = await aliceManager.getMembers(session.groupId);
      expect(members.length).toBe(2);

      // Remove Bob
      await aliceManager.removeMember(session.groupId, bobIdentity.address);

      members = await aliceManager.getMembers(session.groupId);
      expect(members.length).toBe(1);
      expect(members[0].address).toBe(aliceIdentity.address);
    });
  });

  describe('InMemoryGroupSessionStore', () => {
    let store: InMemoryGroupSessionStore;
    let ratchet: SenderKeyRatchet;

    beforeEach(() => {
      store = new InMemoryGroupSessionStore();
      ratchet = new SenderKeyRatchet();
    });

    it('should save and load group session', async () => {
      const mySenderKey = await ratchet.createSenderKeyState(
        '0x1234567890123456789012345678901234567890',
        'evm'
      );

      const session = {
        groupId: 'test-group',
        groupName: 'Test Group',
        mySenderKey,
        memberSenderKeys: new Map(),
        members: [],
        createdAt: Date.now(),
        lastActivityAt: Date.now(),
      };

      await store.saveGroupSession(session);
      const loaded = await store.loadGroupSession('test-group');

      expect(loaded).toBeDefined();
      expect(loaded!.groupId).toBe('test-group');
      expect(loaded!.groupName).toBe('Test Group');
    });

    it('should list all sessions', async () => {
      const mySenderKey1 = await ratchet.createSenderKeyState('0x1111', 'evm');
      const mySenderKey2 = await ratchet.createSenderKeyState('0x2222', 'evm');

      await store.saveGroupSession({
        groupId: 'group-1',
        groupName: 'Group 1',
        mySenderKey: mySenderKey1,
        memberSenderKeys: new Map(),
        members: [{ address: '0x1111', chainType: 'evm', role: 'admin', joinedAt: Date.now() }],
        createdAt: Date.now(),
        lastActivityAt: Date.now(),
      });

      await store.saveGroupSession({
        groupId: 'group-2',
        groupName: 'Group 2',
        mySenderKey: mySenderKey2,
        memberSenderKeys: new Map(),
        members: [],
        createdAt: Date.now(),
        lastActivityAt: Date.now(),
      });

      const sessions = await store.listGroupSessions();
      expect(sessions.length).toBe(2);
    });

    it('should delete session', async () => {
      const mySenderKey = await ratchet.createSenderKeyState('0x1111', 'evm');

      await store.saveGroupSession({
        groupId: 'to-delete',
        groupName: 'Delete Me',
        mySenderKey,
        memberSenderKeys: new Map(),
        members: [],
        createdAt: Date.now(),
        lastActivityAt: Date.now(),
      });

      await store.deleteGroupSession('to-delete');
      const loaded = await store.loadGroupSession('to-delete');

      expect(loaded).toBeNull();
    });
  });
});
