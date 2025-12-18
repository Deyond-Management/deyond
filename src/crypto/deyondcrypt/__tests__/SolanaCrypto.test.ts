/**
 * DeyondCrypt - Solana Crypto Tests
 */

import { SolanaCrypto, solanaCrypto } from '../primitives/SolanaCrypto';
import { EVMCrypto, evmCrypto } from '../primitives/EVMCrypto';
import { CryptoPrimitiveRegistry } from '../primitives';

describe('SolanaCrypto', () => {
  let crypto: SolanaCrypto;

  beforeEach(() => {
    crypto = new SolanaCrypto();
  });

  describe('properties', () => {
    it('should have correct chain type', () => {
      expect(crypto.chainType).toBe('solana');
    });

    it('should have correct curve type', () => {
      expect(crypto.curveType).toBe('ed25519');
    });
  });

  describe('generateKeyPair', () => {
    it('should generate a valid key pair', async () => {
      const keyPair = await crypto.generateKeyPair();

      expect(keyPair.privateKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.publicKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.privateKey.length).toBe(32);
      expect(keyPair.publicKey.length).toBe(32);
    });

    it('should generate unique key pairs', async () => {
      const keyPair1 = await crypto.generateKeyPair();
      const keyPair2 = await crypto.generateKeyPair();

      expect(keyPair1.privateKey).not.toEqual(keyPair2.privateKey);
    });
  });

  describe('deriveKeyPairFromSeed', () => {
    it('should derive deterministic key pair from seed', async () => {
      const seed = new Uint8Array(32).fill(42);

      const keyPair1 = await crypto.deriveKeyPairFromSeed(seed);
      const keyPair2 = await crypto.deriveKeyPairFromSeed(seed);

      expect(keyPair1.privateKey).toEqual(keyPair2.privateKey);
      expect(keyPair1.publicKey).toEqual(keyPair2.publicKey);
    });

    it('should throw on short seed', async () => {
      const shortSeed = new Uint8Array(16);

      await expect(crypto.deriveKeyPairFromSeed(shortSeed)).rejects.toThrow(
        'Seed must be at least 32 bytes'
      );
    });
  });

  describe('deriveMessagingKeyPair', () => {
    it('should derive messaging key pair from wallet private key', async () => {
      const walletPrivateKey = new Uint8Array(32).fill(1);
      const chainId = 'mainnet-beta';

      const keyPair = await crypto.deriveMessagingKeyPair(walletPrivateKey, chainId);

      expect(keyPair.privateKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.publicKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.privateKey.length).toBe(32);
    });

    it('should derive different keys for different chains', async () => {
      const walletPrivateKey = new Uint8Array(32).fill(1);

      const keyPairMainnet = await crypto.deriveMessagingKeyPair(walletPrivateKey, 101);
      const keyPairDevnet = await crypto.deriveMessagingKeyPair(walletPrivateKey, 102);

      expect(keyPairMainnet.privateKey).not.toEqual(keyPairDevnet.privateKey);
    });
  });

  describe('computeSharedSecret', () => {
    it('should compute shared secret from key pairs', async () => {
      const alice = await crypto.generateKeyPair();
      const bob = await crypto.generateKeyPair();

      const sharedSecretAlice = await crypto.computeSharedSecret(alice.privateKey, bob.publicKey);

      expect(sharedSecretAlice).toBeInstanceOf(Uint8Array);
      expect(sharedSecretAlice.length).toBe(32);
    });

    it('should produce same shared secret for both parties (ECDH commutativity)', async () => {
      const alice = await crypto.generateKeyPair();
      const bob = await crypto.generateKeyPair();

      const sharedSecretAlice = await crypto.computeSharedSecret(alice.privateKey, bob.publicKey);

      const sharedSecretBob = await crypto.computeSharedSecret(bob.privateKey, alice.publicKey);

      expect(sharedSecretAlice).toEqual(sharedSecretBob);
    });
  });

  describe('sign and verify', () => {
    it('should sign a message', async () => {
      const keyPair = await crypto.generateKeyPair();
      const message = new TextEncoder().encode('Hello, Solana!');

      const signature = await crypto.sign(message, keyPair.privateKey);

      expect(signature).toBeInstanceOf(Uint8Array);
      expect(signature.length).toBe(64);
    });

    it('should verify a valid signature', async () => {
      const keyPair = await crypto.generateKeyPair();
      const message = new TextEncoder().encode('Hello, Solana!');

      const signature = await crypto.sign(message, keyPair.privateKey);
      const isValid = await crypto.verify(message, signature, keyPair.publicKey);

      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', async () => {
      const keyPair = await crypto.generateKeyPair();
      const message = new TextEncoder().encode('Hello, Solana!');

      const tamperedSignature = new Uint8Array(64).fill(0xff);
      const isValid = await crypto.verify(message, tamperedSignature, keyPair.publicKey);

      expect(isValid).toBe(false);
    });

    it('should reject signature with wrong public key', async () => {
      const alice = await crypto.generateKeyPair();
      const bob = await crypto.generateKeyPair();
      const message = new TextEncoder().encode('Hello!');

      const signature = await crypto.sign(message, alice.privateKey);
      const isValid = await crypto.verify(message, signature, bob.publicKey);

      expect(isValid).toBe(false);
    });
  });

  describe('publicKeyToAddress', () => {
    it('should derive Solana address from public key', async () => {
      const keyPair = await crypto.generateKeyPair();
      const address = crypto.publicKeyToAddress(keyPair.publicKey);

      // Solana addresses are base58 encoded
      expect(address.length).toBeGreaterThanOrEqual(32);
      expect(address.length).toBeLessThanOrEqual(44);
    });
  });

  describe('isValidAddress', () => {
    it('should validate correct Solana addresses', () => {
      // Example Solana addresses
      expect(crypto.isValidAddress('11111111111111111111111111111111')).toBe(true);
      expect(crypto.isValidAddress('So11111111111111111111111111111111111111112')).toBe(true);
    });

    it('should reject invalid addresses', () => {
      expect(crypto.isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f7C2B0')).toBe(false);
      expect(crypto.isValidAddress('short')).toBe(false);
      expect(crypto.isValidAddress('contains0OIl')).toBe(false); // 0, O, I, l are not in base58
    });
  });

  describe('key compression', () => {
    it('should return ed25519 keys unchanged (already compressed)', async () => {
      const keyPair = await crypto.generateKeyPair();

      const compressed = crypto.compressPublicKey(keyPair.publicKey);
      const decompressed = crypto.decompressPublicKey(compressed);

      expect(compressed).toEqual(keyPair.publicKey);
      expect(decompressed).toEqual(keyPair.publicKey);
    });

    it('should reject invalid key length', () => {
      const invalidKey = new Uint8Array(16);

      expect(() => crypto.compressPublicKey(invalidKey)).toThrow('Invalid public key length');
      expect(() => crypto.decompressPublicKey(invalidKey)).toThrow('Invalid public key length');
    });
  });

  describe('CryptoPrimitiveRegistry integration', () => {
    beforeEach(() => {
      CryptoPrimitiveRegistry.clear();
    });

    it('should register Solana crypto primitive', () => {
      CryptoPrimitiveRegistry.register(solanaCrypto);

      expect(CryptoPrimitiveRegistry.has('solana')).toBe(true);
      expect(CryptoPrimitiveRegistry.get('solana')).toBe(solanaCrypto);
    });

    it('should coexist with EVM crypto primitive', () => {
      CryptoPrimitiveRegistry.register(evmCrypto);
      CryptoPrimitiveRegistry.register(solanaCrypto);

      expect(CryptoPrimitiveRegistry.getRegisteredChains()).toContain('evm');
      expect(CryptoPrimitiveRegistry.getRegisteredChains()).toContain('solana');
    });
  });

  describe('singleton export', () => {
    it('should export solanaCrypto singleton', () => {
      expect(solanaCrypto).toBeInstanceOf(SolanaCrypto);
    });
  });
});
