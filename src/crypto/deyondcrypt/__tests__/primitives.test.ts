/**
 * DeyondCrypt - Crypto Primitives Tests
 */

import { EVMCrypto, evmCrypto } from '../primitives/EVMCrypto';
import {
  SymmetricCrypto,
  KeyDerivation,
  symmetricCrypto,
  keyDerivation,
  AES_KEY_SIZE,
} from '../primitives/SymmetricCrypto';
import { CryptoPrimitiveRegistry } from '../primitives';
import { initializeDeyondCrypt } from '../index';

describe('DeyondCrypt Crypto Primitives', () => {
  describe('EVMCrypto', () => {
    let crypto: EVMCrypto;

    beforeEach(() => {
      crypto = new EVMCrypto();
    });

    describe('properties', () => {
      it('should have correct chain type', () => {
        expect(crypto.chainType).toBe('evm');
      });

      it('should have correct curve type', () => {
        expect(crypto.curveType).toBe('secp256k1');
      });
    });

    describe('generateKeyPair', () => {
      it('should generate a valid key pair', async () => {
        const keyPair = await crypto.generateKeyPair();

        expect(keyPair.privateKey).toBeInstanceOf(Uint8Array);
        expect(keyPair.publicKey).toBeInstanceOf(Uint8Array);
        expect(keyPair.privateKey.length).toBe(32);
        expect(keyPair.publicKey.length).toBe(33); // Compressed
      });

      it('should generate unique key pairs', async () => {
        const keyPair1 = await crypto.generateKeyPair();
        const keyPair2 = await crypto.generateKeyPair();

        // Private keys should be different
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
        const chainId = 1;

        const keyPair = await crypto.deriveMessagingKeyPair(walletPrivateKey, chainId);

        expect(keyPair.privateKey).toBeInstanceOf(Uint8Array);
        expect(keyPair.publicKey).toBeInstanceOf(Uint8Array);
      });

      it('should derive different keys for different chains', async () => {
        const walletPrivateKey = new Uint8Array(32).fill(1);

        const keyPairEth = await crypto.deriveMessagingKeyPair(walletPrivateKey, 1);
        const keyPairPolygon = await crypto.deriveMessagingKeyPair(walletPrivateKey, 137);

        expect(keyPairEth.privateKey).not.toEqual(keyPairPolygon.privateKey);
      });

      it('should handle string chain IDs', async () => {
        const walletPrivateKey = new Uint8Array(32).fill(1);

        const keyPair = await crypto.deriveMessagingKeyPair(walletPrivateKey, '1');

        expect(keyPair.privateKey).toBeInstanceOf(Uint8Array);
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
    });

    describe('sign and verify', () => {
      it('should sign a message', async () => {
        const keyPair = await crypto.generateKeyPair();
        const message = new TextEncoder().encode('Hello, DeyondCrypt!');

        const signature = await crypto.sign(message, keyPair.privateKey);

        expect(signature).toBeInstanceOf(Uint8Array);
        expect(signature.length).toBe(64); // r + s
      });

      it('should verify a valid signature', async () => {
        const keyPair = await crypto.generateKeyPair();
        const message = new TextEncoder().encode('Hello, DeyondCrypt!');

        const signature = await crypto.sign(message, keyPair.privateKey);
        const isValid = await crypto.verify(message, signature, keyPair.publicKey);

        expect(isValid).toBe(true);
      });
    });

    describe('publicKeyToAddress', () => {
      it('should derive address from public key', async () => {
        const keyPair = await crypto.generateKeyPair();
        const address = crypto.publicKeyToAddress(keyPair.publicKey);

        expect(address).toMatch(/^0x[0-9a-fA-F]{40}$/);
      });
    });

    describe('isValidAddress', () => {
      it('should validate correct EVM addresses', () => {
        expect(crypto.isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f7C2B0')).toBe(true);
        expect(crypto.isValidAddress('0x0000000000000000000000000000000000000000')).toBe(true);
      });

      it('should reject invalid addresses', () => {
        expect(crypto.isValidAddress('0x123')).toBe(false);
        expect(crypto.isValidAddress('742d35Cc6634C0532925a3b844Bc9e7595f7C2B0')).toBe(false);
        expect(crypto.isValidAddress('0xGGGG35Cc6634C0532925a3b844Bc9e7595f7C2B0')).toBe(false);
      });
    });

    describe('compressPublicKey', () => {
      it('should compress an uncompressed public key', async () => {
        // Generate a real key pair to get valid keys
        const keyPair = await crypto.generateKeyPair();
        // Decompress to get uncompressed version
        const uncompressed = crypto.decompressPublicKey(keyPair.publicKey);

        const compressed = crypto.compressPublicKey(uncompressed);

        expect(compressed.length).toBe(33);
        expect(compressed[0]).toBeGreaterThanOrEqual(0x02);
        expect(compressed[0]).toBeLessThanOrEqual(0x03);
        expect(compressed).toEqual(keyPair.publicKey);
      });

      it('should return already compressed key unchanged', async () => {
        const keyPair = await crypto.generateKeyPair();
        // publicKey from generateKeyPair is already compressed (33 bytes)
        const compressed = keyPair.publicKey;

        const result = crypto.compressPublicKey(compressed);

        expect(result).toEqual(compressed);
      });
    });

    describe('decompressPublicKey', () => {
      it('should decompress a compressed public key', async () => {
        const keyPair = await crypto.generateKeyPair();
        // publicKey from generateKeyPair is compressed (33 bytes)
        const compressed = keyPair.publicKey;

        const uncompressed = crypto.decompressPublicKey(compressed);

        expect(uncompressed.length).toBe(65);
        expect(uncompressed[0]).toBe(0x04);
      });

      it('should return already uncompressed key unchanged', async () => {
        const keyPair = await crypto.generateKeyPair();
        const uncompressed = crypto.decompressPublicKey(keyPair.publicKey);

        const result = crypto.decompressPublicKey(uncompressed);

        expect(result).toEqual(uncompressed);
      });
    });
  });

  describe('SymmetricCrypto', () => {
    let crypto: SymmetricCrypto;

    beforeEach(() => {
      crypto = new SymmetricCrypto();
    });

    describe('encrypt and decrypt', () => {
      it('should encrypt and decrypt data', async () => {
        const plaintext = new TextEncoder().encode('Secret message');
        const key = new Uint8Array(AES_KEY_SIZE).fill(0x42);

        const { ciphertext, nonce } = await crypto.encrypt(plaintext, key);

        expect(ciphertext).toBeInstanceOf(Uint8Array);
        expect(nonce).toBeInstanceOf(Uint8Array);
        expect(nonce.length).toBe(12);

        const decrypted = await crypto.decrypt(ciphertext, key, nonce);

        expect(decrypted).toEqual(plaintext);
      });

      it('should produce different ciphertext for same plaintext', async () => {
        const plaintext = new TextEncoder().encode('Same message');
        const key = new Uint8Array(AES_KEY_SIZE).fill(0x42);

        const result1 = await crypto.encrypt(plaintext, key);
        const result2 = await crypto.encrypt(plaintext, key);

        // Nonces should be different
        expect(result1.nonce).not.toEqual(result2.nonce);
        // Ciphertext should be different due to different nonces
        expect(result1.ciphertext).not.toEqual(result2.ciphertext);
      });

      it('should fail decryption with wrong key', async () => {
        const plaintext = new TextEncoder().encode('Secret');
        const key1 = new Uint8Array(AES_KEY_SIZE).fill(0x42);
        const key2 = new Uint8Array(AES_KEY_SIZE).fill(0x43);

        const { ciphertext, nonce } = await crypto.encrypt(plaintext, key1);

        await expect(crypto.decrypt(ciphertext, key2, nonce)).rejects.toThrow(
          'Authentication failed'
        );
      });

      it('should reject invalid key length', async () => {
        const plaintext = new TextEncoder().encode('Test');
        const shortKey = new Uint8Array(16);

        await expect(crypto.encrypt(plaintext, shortKey)).rejects.toThrow('Invalid key length');
      });
    });
  });

  describe('KeyDerivation', () => {
    let kdf: KeyDerivation;

    beforeEach(() => {
      kdf = new KeyDerivation();
    });

    describe('sha256', () => {
      it('should hash data', async () => {
        const data = new TextEncoder().encode('Hello');
        const hash = await kdf.sha256(data);

        expect(hash).toBeInstanceOf(Uint8Array);
        expect(hash.length).toBe(32);
      });

      it('should produce consistent hashes', async () => {
        const data = new TextEncoder().encode('Test');

        const hash1 = await kdf.sha256(data);
        const hash2 = await kdf.sha256(data);

        expect(hash1).toEqual(hash2);
      });
    });

    describe('hmacSha256', () => {
      it('should compute HMAC', async () => {
        const key = new Uint8Array(32).fill(0x42);
        const data = new TextEncoder().encode('Message');

        const hmac = await kdf.hmacSha256(key, data);

        expect(hmac).toBeInstanceOf(Uint8Array);
        expect(hmac.length).toBe(32);
      });

      it('should produce different HMACs for different keys', async () => {
        const key1 = new Uint8Array(32).fill(0x42);
        const key2 = new Uint8Array(32).fill(0x43);
        const data = new TextEncoder().encode('Message');

        const hmac1 = await kdf.hmacSha256(key1, data);
        const hmac2 = await kdf.hmacSha256(key2, data);

        expect(hmac1).not.toEqual(hmac2);
      });
    });

    describe('hkdf', () => {
      it('should derive key material', async () => {
        const ikm = new Uint8Array(32).fill(0x42);
        const salt = new Uint8Array(32).fill(0x01);
        const info = new TextEncoder().encode('DeyondCrypt');

        const okm = await kdf.hkdf(ikm, salt, info, 64);

        expect(okm).toBeInstanceOf(Uint8Array);
        expect(okm.length).toBe(64);
      });

      it('should work with null salt', async () => {
        const ikm = new Uint8Array(32).fill(0x42);
        const info = new TextEncoder().encode('Info');

        const okm = await kdf.hkdf(ikm, null, info, 32);

        expect(okm.length).toBe(32);
      });

      it('should produce deterministic output', async () => {
        const ikm = new Uint8Array(32).fill(0x42);
        const salt = new Uint8Array(32).fill(0x01);
        const info = new TextEncoder().encode('Test');

        const okm1 = await kdf.hkdf(ikm, salt, info, 32);
        const okm2 = await kdf.hkdf(ikm, salt, info, 32);

        expect(okm1).toEqual(okm2);
      });
    });
  });

  describe('CryptoPrimitiveRegistry', () => {
    beforeEach(() => {
      CryptoPrimitiveRegistry.clear();
    });

    it('should register and retrieve primitives', () => {
      CryptoPrimitiveRegistry.register(evmCrypto);

      const retrieved = CryptoPrimitiveRegistry.get('evm');

      expect(retrieved).toBe(evmCrypto);
    });

    it('should throw on unregistered chain', () => {
      expect(() => CryptoPrimitiveRegistry.get('solana')).toThrow(
        'No crypto primitive registered for chain: solana'
      );
    });

    it('should check if primitive is registered', () => {
      expect(CryptoPrimitiveRegistry.has('evm')).toBe(false);

      CryptoPrimitiveRegistry.register(evmCrypto);

      expect(CryptoPrimitiveRegistry.has('evm')).toBe(true);
    });

    it('should list registered chains', () => {
      expect(CryptoPrimitiveRegistry.getRegisteredChains()).toEqual([]);

      CryptoPrimitiveRegistry.register(evmCrypto);

      expect(CryptoPrimitiveRegistry.getRegisteredChains()).toEqual(['evm']);
    });
  });

  describe('initializeDeyondCrypt', () => {
    beforeEach(() => {
      CryptoPrimitiveRegistry.clear();
    });

    it('should register EVM crypto primitive', () => {
      initializeDeyondCrypt();

      expect(CryptoPrimitiveRegistry.has('evm')).toBe(true);
    });
  });

  describe('Singleton exports', () => {
    it('should export evmCrypto singleton', () => {
      expect(evmCrypto).toBeInstanceOf(EVMCrypto);
    });

    it('should export symmetricCrypto singleton', () => {
      expect(symmetricCrypto).toBeInstanceOf(SymmetricCrypto);
    });

    it('should export keyDerivation singleton', () => {
      expect(keyDerivation).toBeInstanceOf(KeyDerivation);
    });
  });
});
