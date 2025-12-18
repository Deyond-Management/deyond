/**
 * DeyondCrypt - Double Ratchet Tests
 */

import { DoubleRatchet } from '../core/DoubleRatchet';
import { EVMCrypto } from '../primitives/EVMCrypto';
import { KeyDerivation } from '../primitives/SymmetricCrypto';

describe('DoubleRatchet', () => {
  let crypto: EVMCrypto;
  let kdf: KeyDerivation;

  beforeEach(() => {
    crypto = new EVMCrypto();
    kdf = new KeyDerivation();
  });

  describe('initialization', () => {
    it('should initialize as Alice', async () => {
      const sharedSecret = new Uint8Array(32).fill(0x42);
      const bobKeyPair = await crypto.generateKeyPair();

      const alice = await DoubleRatchet.initializeAsAlice(
        crypto,
        sharedSecret,
        bobKeyPair.publicKey
      );

      expect(alice).toBeInstanceOf(DoubleRatchet);
      expect(alice.getPublicKey()).toBeInstanceOf(Uint8Array);
    });

    it('should initialize as Bob', async () => {
      const sharedSecret = new Uint8Array(32).fill(0x42);
      const signedPreKey = await crypto.generateKeyPair();

      const bob = await DoubleRatchet.initializeAsBob(crypto, sharedSecret, signedPreKey);

      expect(bob).toBeInstanceOf(DoubleRatchet);
      expect(bob.getPublicKey()).toEqual(signedPreKey.publicKey);
    });
  });

  describe('message encryption/decryption', () => {
    let alice: DoubleRatchet;
    let bob: DoubleRatchet;

    beforeEach(async () => {
      // Simulate X3DH key agreement result
      const sharedSecret = new Uint8Array(32).fill(0x42);
      const bobSignedPreKey = await crypto.generateKeyPair();

      // Initialize Bob first (responder)
      bob = await DoubleRatchet.initializeAsBob(crypto, sharedSecret, bobSignedPreKey);

      // Initialize Alice (initiator) with Bob's public key
      alice = await DoubleRatchet.initializeAsAlice(
        crypto,
        sharedSecret,
        bobSignedPreKey.publicKey
      );
    });

    it('should encrypt and decrypt a single message from Alice to Bob', async () => {
      const plaintext = new TextEncoder().encode('Hello, Bob!');

      // Alice encrypts
      const encrypted = await alice.encrypt(plaintext);

      expect(encrypted.header).toBeDefined();
      expect(encrypted.ciphertext).toBeInstanceOf(Uint8Array);
      expect(encrypted.header.ephemeralKey).toBeInstanceOf(Uint8Array);
      expect(encrypted.header.messageNumber).toBe(0);

      // Bob decrypts
      const decrypted = await bob.decrypt(encrypted);

      expect(decrypted).toEqual(plaintext);
    });

    it('should encrypt and decrypt multiple messages in sequence', async () => {
      const messages = ['Hello, Bob!', 'How are you?', 'Nice to meet you.'];

      for (let i = 0; i < messages.length; i++) {
        const plaintext = new TextEncoder().encode(messages[i]);
        const encrypted = await alice.encrypt(plaintext);

        expect(encrypted.header.messageNumber).toBe(i);

        const decrypted = await bob.decrypt(encrypted);
        expect(new TextDecoder().decode(decrypted)).toBe(messages[i]);
      }
    });

    it('should handle bidirectional communication', async () => {
      // Alice sends to Bob
      const msg1 = new TextEncoder().encode('Hello Bob');
      const enc1 = await alice.encrypt(msg1);
      const dec1 = await bob.decrypt(enc1);
      expect(dec1).toEqual(msg1);

      // Bob sends to Alice
      const msg2 = new TextEncoder().encode('Hello Alice');
      const enc2 = await bob.encrypt(msg2);
      const dec2 = await alice.decrypt(enc2);
      expect(dec2).toEqual(msg2);

      // Alice sends again
      const msg3 = new TextEncoder().encode('How are you?');
      const enc3 = await alice.encrypt(msg3);
      const dec3 = await bob.decrypt(enc3);
      expect(dec3).toEqual(msg3);
    });

    it('should handle out-of-order messages', async () => {
      // Alice sends 3 messages
      const msg1 = new TextEncoder().encode('Message 1');
      const msg2 = new TextEncoder().encode('Message 2');
      const msg3 = new TextEncoder().encode('Message 3');

      const enc1 = await alice.encrypt(msg1);
      const enc2 = await alice.encrypt(msg2);
      const enc3 = await alice.encrypt(msg3);

      // Bob receives in reverse order
      const dec3 = await bob.decrypt(enc3);
      const dec1 = await bob.decrypt(enc1);
      const dec2 = await bob.decrypt(enc2);

      expect(dec1).toEqual(msg1);
      expect(dec2).toEqual(msg2);
      expect(dec3).toEqual(msg3);
    });

    it('should produce different ciphertext for same plaintext', async () => {
      const plaintext = new TextEncoder().encode('Same message');

      const enc1 = await alice.encrypt(plaintext);
      const enc2 = await alice.encrypt(plaintext);

      // Ciphertext should be different due to ratcheting
      expect(enc1.ciphertext).not.toEqual(enc2.ciphertext);
      expect(enc1.header.messageNumber).toBe(0);
      expect(enc2.header.messageNumber).toBe(1);
    });

    it('should update DH keys on message exchange', async () => {
      const msg1 = new TextEncoder().encode('From Alice');
      const enc1 = await alice.encrypt(msg1);
      const aliceKey1 = enc1.header.ephemeralKey;

      await bob.decrypt(enc1);

      // Bob replies, triggering DH ratchet
      const msg2 = new TextEncoder().encode('From Bob');
      const enc2 = await bob.encrypt(msg2);
      const bobKey1 = enc2.header.ephemeralKey;

      await alice.decrypt(enc2);

      // Alice sends again with new key
      const msg3 = new TextEncoder().encode('From Alice again');
      const enc3 = await alice.encrypt(msg3);
      const aliceKey2 = enc3.header.ephemeralKey;

      // Alice should have a new DH key
      expect(aliceKey1).not.toEqual(aliceKey2);
    });
  });

  describe('state export/import', () => {
    it('should export and restore session state', async () => {
      const sharedSecret = new Uint8Array(32).fill(0x42);
      const bobSignedPreKey = await crypto.generateKeyPair();

      const bob = await DoubleRatchet.initializeAsBob(crypto, sharedSecret, bobSignedPreKey);

      const alice = await DoubleRatchet.initializeAsAlice(
        crypto,
        sharedSecret,
        bobSignedPreKey.publicKey
      );

      // Exchange some messages
      const msg1 = new TextEncoder().encode('Hello');
      const enc1 = await alice.encrypt(msg1);
      await bob.decrypt(enc1);

      // Export Alice's state
      const aliceState = alice.exportState();

      // Create new ratchet from state
      const aliceRestored = DoubleRatchet.fromState(crypto, aliceState);

      // Should be able to continue conversation
      const msg2 = new TextEncoder().encode('After restore');
      const enc2 = await aliceRestored.encrypt(msg2);
      const dec2 = await bob.decrypt(enc2);

      expect(dec2).toEqual(msg2);
    });

    it('should preserve skipped message keys in exported state', async () => {
      const sharedSecret = new Uint8Array(32).fill(0x42);
      const bobSignedPreKey = await crypto.generateKeyPair();

      const bob = await DoubleRatchet.initializeAsBob(crypto, sharedSecret, bobSignedPreKey);

      const alice = await DoubleRatchet.initializeAsAlice(
        crypto,
        sharedSecret,
        bobSignedPreKey.publicKey
      );

      // Alice sends 3 messages
      const msg1 = new TextEncoder().encode('Message 1');
      const msg2 = new TextEncoder().encode('Message 2');
      const msg3 = new TextEncoder().encode('Message 3');

      const enc1 = await alice.encrypt(msg1);
      const enc2 = await alice.encrypt(msg2);
      const enc3 = await alice.encrypt(msg3);

      // Bob receives message 3 first (skips 1 and 2)
      await bob.decrypt(enc3);

      // Export and restore Bob's state
      const bobState = bob.exportState();
      const bobRestored = DoubleRatchet.fromState(crypto, bobState);

      // Should still be able to decrypt skipped messages
      const dec1 = await bobRestored.decrypt(enc1);
      const dec2 = await bobRestored.decrypt(enc2);

      expect(dec1).toEqual(msg1);
      expect(dec2).toEqual(msg2);
    });
  });

  describe('error handling', () => {
    it('should reject too many skipped messages', async () => {
      const sharedSecret = new Uint8Array(32).fill(0x42);
      const bobSignedPreKey = await crypto.generateKeyPair();

      const bob = await DoubleRatchet.initializeAsBob(crypto, sharedSecret, bobSignedPreKey);

      const alice = await DoubleRatchet.initializeAsAlice(
        crypto,
        sharedSecret,
        bobSignedPreKey.publicKey
      );

      // Alice sends a message
      const msg = new TextEncoder().encode('Test');
      const encrypted = await alice.encrypt(msg);

      // Tamper with message number to simulate too many skipped
      encrypted.header.messageNumber = 2000;

      await expect(bob.decrypt(encrypted)).rejects.toThrow('Too many skipped messages');
    });

    it('should fail decryption with wrong key', async () => {
      const sharedSecret1 = new Uint8Array(32).fill(0x42);
      const sharedSecret2 = new Uint8Array(32).fill(0x43);

      const bobSignedPreKey = await crypto.generateKeyPair();

      const bob = await DoubleRatchet.initializeAsBob(crypto, sharedSecret1, bobSignedPreKey);

      // Alice uses different shared secret
      const alice = await DoubleRatchet.initializeAsAlice(
        crypto,
        sharedSecret2,
        bobSignedPreKey.publicKey
      );

      const msg = new TextEncoder().encode('Test');
      const encrypted = await alice.encrypt(msg);

      // Bob should fail to decrypt
      await expect(bob.decrypt(encrypted)).rejects.toThrow();
    });
  });

  describe('forward secrecy', () => {
    it('should use different keys for each message', async () => {
      const sharedSecret = new Uint8Array(32).fill(0x42);
      const bobSignedPreKey = await crypto.generateKeyPair();

      const bob = await DoubleRatchet.initializeAsBob(crypto, sharedSecret, bobSignedPreKey);

      const alice = await DoubleRatchet.initializeAsAlice(
        crypto,
        sharedSecret,
        bobSignedPreKey.publicKey
      );

      // Send multiple messages
      const messages: Uint8Array[] = [];
      for (let i = 0; i < 5; i++) {
        const msg = new TextEncoder().encode(`Message ${i}`);
        const encrypted = await alice.encrypt(msg);
        messages.push(encrypted.ciphertext);
      }

      // Verify all ciphertexts are different
      for (let i = 0; i < messages.length; i++) {
        for (let j = i + 1; j < messages.length; j++) {
          expect(messages[i]).not.toEqual(messages[j]);
        }
      }
    });
  });
});
