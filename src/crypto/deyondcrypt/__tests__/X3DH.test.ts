/**
 * DeyondCrypt - X3DH Key Exchange Tests
 */

import { X3DH, InMemoryPreKeyStore } from '../keys/X3DH';
import { EVMCrypto } from '../primitives/EVMCrypto';
import { DoubleRatchet } from '../core/DoubleRatchet';

describe('X3DH', () => {
  let crypto: EVMCrypto;
  let aliceX3dh: X3DH;
  let bobX3dh: X3DH;

  beforeEach(() => {
    crypto = new EVMCrypto();
    aliceX3dh = new X3DH(crypto);
    bobX3dh = new X3DH(crypto);
  });

  describe('key generation', () => {
    it('should generate identity key pair from wallet', async () => {
      const walletPrivateKey = new Uint8Array(32).fill(0x42);
      const chainId = 1;

      const identityKey = await aliceX3dh.generateIdentityKeyPair(walletPrivateKey, chainId, 'evm');

      expect(identityKey.publicKey).toBeInstanceOf(Uint8Array);
      expect(identityKey.privateKey).toBeInstanceOf(Uint8Array);
      expect(identityKey.chainType).toBe('evm');
      expect(identityKey.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });

    it('should generate signed pre-key', async () => {
      const walletPrivateKey = new Uint8Array(32).fill(0x42);
      const identityKey = await aliceX3dh.generateIdentityKeyPair(walletPrivateKey, 1, 'evm');

      const signedPreKey = await aliceX3dh.generateSignedPreKey(identityKey, 1);

      expect(signedPreKey.keyId).toBe(1);
      expect(signedPreKey.keyPair.publicKey).toBeInstanceOf(Uint8Array);
      expect(signedPreKey.signature).toBeInstanceOf(Uint8Array);
      expect(signedPreKey.timestamp).toBeGreaterThan(0);
    });

    it('should generate one-time pre-keys', async () => {
      const preKeys = await aliceX3dh.generateOneTimePreKeys(0, 5);

      expect(preKeys).toHaveLength(5);
      preKeys.forEach((preKey, index) => {
        expect(preKey.keyId).toBe(index);
        expect(preKey.keyPair.publicKey).toBeInstanceOf(Uint8Array);
        expect(preKey.keyPair.privateKey).toBeInstanceOf(Uint8Array);
      });
    });

    it('should create pre-key bundle', async () => {
      const walletPrivateKey = new Uint8Array(32).fill(0x42);
      const identityKey = await aliceX3dh.generateIdentityKeyPair(walletPrivateKey, 1, 'evm');
      const signedPreKey = await aliceX3dh.generateSignedPreKey(identityKey, 1);
      const oneTimePreKeys = await aliceX3dh.generateOneTimePreKeys(0, 1);

      const bundle = aliceX3dh.createPreKeyBundle(identityKey, signedPreKey, oneTimePreKeys[0]);

      expect(bundle.identityKey).toEqual(identityKey.publicKey);
      expect(bundle.signedPreKey.keyId).toBe(1);
      expect(bundle.signedPreKey.publicKey).toEqual(signedPreKey.keyPair.publicKey);
      expect(bundle.oneTimePreKey?.keyId).toBe(0);
      expect(bundle.address).toBe(identityKey.address);
      expect(bundle.chainType).toBe('evm');
    });
  });

  describe('key exchange', () => {
    it('should perform key exchange without one-time pre-key', async () => {
      // Bob's keys
      const bobWalletKey = new Uint8Array(32).fill(0x01);
      const bobIdentityKey = await bobX3dh.generateIdentityKeyPair(bobWalletKey, 1, 'evm');
      const bobSignedPreKey = await bobX3dh.generateSignedPreKey(bobIdentityKey, 1);
      const bobBundle = bobX3dh.createPreKeyBundle(bobIdentityKey, bobSignedPreKey);

      // Alice's keys
      const aliceWalletKey = new Uint8Array(32).fill(0x02);
      const aliceIdentityKey = await aliceX3dh.generateIdentityKeyPair(aliceWalletKey, 1, 'evm');

      // Alice initiates
      const { result: aliceResult, initialMessage } = await aliceX3dh.initiateKeyExchange(
        aliceIdentityKey,
        bobBundle
      );

      // Bob completes
      const bobResult = await bobX3dh.completeKeyExchange(
        bobIdentityKey,
        bobSignedPreKey.keyPair,
        null,
        initialMessage
      );

      // Both should derive the same shared secret
      expect(aliceResult.sharedSecret).toEqual(bobResult.sharedSecret);
      expect(aliceResult.associatedData).toEqual(bobResult.associatedData);
    });

    it('should perform key exchange with one-time pre-key', async () => {
      // Bob's keys
      const bobWalletKey = new Uint8Array(32).fill(0x01);
      const bobIdentityKey = await bobX3dh.generateIdentityKeyPair(bobWalletKey, 1, 'evm');
      const bobSignedPreKey = await bobX3dh.generateSignedPreKey(bobIdentityKey, 1);
      const bobOneTimePreKeys = await bobX3dh.generateOneTimePreKeys(0, 1);
      const bobBundle = bobX3dh.createPreKeyBundle(
        bobIdentityKey,
        bobSignedPreKey,
        bobOneTimePreKeys[0]
      );

      // Alice's keys
      const aliceWalletKey = new Uint8Array(32).fill(0x02);
      const aliceIdentityKey = await aliceX3dh.generateIdentityKeyPair(aliceWalletKey, 1, 'evm');

      // Alice initiates
      const { result: aliceResult, initialMessage } = await aliceX3dh.initiateKeyExchange(
        aliceIdentityKey,
        bobBundle
      );

      expect(initialMessage.usedOneTimePreKeyId).toBe(0);

      // Bob completes with one-time pre-key
      const bobResult = await bobX3dh.completeKeyExchange(
        bobIdentityKey,
        bobSignedPreKey.keyPair,
        bobOneTimePreKeys[0].keyPair,
        initialMessage
      );

      // Both should derive the same shared secret
      expect(aliceResult.sharedSecret).toEqual(bobResult.sharedSecret);
    });

    it('should produce different shared secrets for different conversations', async () => {
      // Bob's keys
      const bobWalletKey = new Uint8Array(32).fill(0x01);
      const bobIdentityKey = await bobX3dh.generateIdentityKeyPair(bobWalletKey, 1, 'evm');
      const bobSignedPreKey = await bobX3dh.generateSignedPreKey(bobIdentityKey, 1);
      const bobBundle = bobX3dh.createPreKeyBundle(bobIdentityKey, bobSignedPreKey);

      // Alice's keys
      const aliceWalletKey = new Uint8Array(32).fill(0x02);
      const aliceIdentityKey = await aliceX3dh.generateIdentityKeyPair(aliceWalletKey, 1, 'evm');

      // Charlie's keys
      const charlieWalletKey = new Uint8Array(32).fill(0x03);
      const charlieX3dh = new X3DH(crypto);
      const charlieIdentityKey = await charlieX3dh.generateIdentityKeyPair(
        charlieWalletKey,
        1,
        'evm'
      );

      // Alice initiates with Bob
      const { result: aliceBobResult } = await aliceX3dh.initiateKeyExchange(
        aliceIdentityKey,
        bobBundle
      );

      // Charlie initiates with Bob
      const { result: charlieBobResult } = await charlieX3dh.initiateKeyExchange(
        charlieIdentityKey,
        bobBundle
      );

      // Shared secrets should be different
      expect(aliceBobResult.sharedSecret).not.toEqual(charlieBobResult.sharedSecret);
    });

    it('should reject invalid signed pre-key signature', async () => {
      // Bob's keys
      const bobWalletKey = new Uint8Array(32).fill(0x01);
      const bobIdentityKey = await bobX3dh.generateIdentityKeyPair(bobWalletKey, 1, 'evm');
      const bobSignedPreKey = await bobX3dh.generateSignedPreKey(bobIdentityKey, 1);

      // Create bundle with tampered signature
      const tamperedBundle = bobX3dh.createPreKeyBundle(bobIdentityKey, bobSignedPreKey);
      tamperedBundle.signedPreKey.signature = new Uint8Array(64).fill(0xff);

      // Alice's keys
      const aliceWalletKey = new Uint8Array(32).fill(0x02);
      const aliceIdentityKey = await aliceX3dh.generateIdentityKeyPair(aliceWalletKey, 1, 'evm');

      // Should reject
      await expect(aliceX3dh.initiateKeyExchange(aliceIdentityKey, tamperedBundle)).rejects.toThrow(
        'Invalid signed pre-key signature'
      );
    });
  });

  describe('integration with Double Ratchet', () => {
    it('should establish Double Ratchet session via X3DH', async () => {
      // Bob generates and publishes keys
      const bobWalletKey = new Uint8Array(32).fill(0x01);
      const bobIdentityKey = await bobX3dh.generateIdentityKeyPair(bobWalletKey, 1, 'evm');
      const bobSignedPreKey = await bobX3dh.generateSignedPreKey(bobIdentityKey, 1);
      const bobBundle = bobX3dh.createPreKeyBundle(bobIdentityKey, bobSignedPreKey);

      // Alice fetches Bob's bundle and initiates
      const aliceWalletKey = new Uint8Array(32).fill(0x02);
      const aliceIdentityKey = await aliceX3dh.generateIdentityKeyPair(aliceWalletKey, 1, 'evm');

      const { result: aliceX3dhResult, initialMessage } = await aliceX3dh.initiateKeyExchange(
        aliceIdentityKey,
        bobBundle
      );

      // Alice creates Double Ratchet session
      const aliceRatchet = await DoubleRatchet.initializeAsAlice(
        crypto,
        aliceX3dhResult.sharedSecret,
        bobSignedPreKey.keyPair.publicKey
      );

      // Bob receives initial message and completes X3DH
      const bobX3dhResult = await bobX3dh.completeKeyExchange(
        bobIdentityKey,
        bobSignedPreKey.keyPair,
        null,
        initialMessage
      );

      // Bob creates Double Ratchet session
      const bobRatchet = await DoubleRatchet.initializeAsBob(
        crypto,
        bobX3dhResult.sharedSecret,
        bobSignedPreKey.keyPair
      );

      // Test message exchange
      const message1 = new TextEncoder().encode('Hello Bob!');
      const encrypted1 = await aliceRatchet.encrypt(message1);
      const decrypted1 = await bobRatchet.decrypt(encrypted1);

      expect(decrypted1).toEqual(message1);

      // Bob replies
      const message2 = new TextEncoder().encode('Hi Alice!');
      const encrypted2 = await bobRatchet.encrypt(message2);
      const decrypted2 = await aliceRatchet.decrypt(encrypted2);

      expect(decrypted2).toEqual(message2);
    });
  });

  describe('InMemoryPreKeyStore', () => {
    let store: InMemoryPreKeyStore;

    beforeEach(() => {
      store = new InMemoryPreKeyStore();
    });

    it('should store and retrieve identity key pair', async () => {
      const walletKey = new Uint8Array(32).fill(0x42);
      const identityKey = await aliceX3dh.generateIdentityKeyPair(walletKey, 1, 'evm');

      await store.storeIdentityKeyPair(identityKey);
      const retrieved = await store.getIdentityKeyPair();

      expect(retrieved).toEqual(identityKey);
    });

    it('should store and retrieve signed pre-key', async () => {
      const walletKey = new Uint8Array(32).fill(0x42);
      const identityKey = await aliceX3dh.generateIdentityKeyPair(walletKey, 1, 'evm');
      const signedPreKey = await aliceX3dh.generateSignedPreKey(identityKey, 1);

      await store.storeSignedPreKey(signedPreKey);
      const retrieved = await store.getSignedPreKey();

      expect(retrieved).toEqual(signedPreKey);
    });

    it('should store and consume one-time pre-keys', async () => {
      const preKeys = await aliceX3dh.generateOneTimePreKeys(0, 5);

      await store.storeOneTimePreKeys(preKeys);

      expect(await store.getOneTimePreKeyCount()).toBe(5);

      const consumed = await store.consumeOneTimePreKey(2);
      expect(consumed?.keyId).toBe(2);
      expect(await store.getOneTimePreKeyCount()).toBe(4);

      // Should not find consumed key again
      const notFound = await store.consumeOneTimePreKey(2);
      expect(notFound).toBeNull();
    });
  });
});
