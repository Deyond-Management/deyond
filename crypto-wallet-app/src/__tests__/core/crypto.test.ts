/**
 * Crypto Utility Tests
 * TDD: Write tests first, then implement functionality
 */

import { CryptoUtils } from '../../core/crypto/CryptoUtils';

describe('CryptoUtils', () => {
  describe('generateRandomBytes', () => {
    it('should generate random bytes of specified length', () => {
      const bytes = CryptoUtils.generateRandomBytes(32);
      expect(bytes).toBeDefined();
      expect(bytes.length).toBe(32);
    });

    it('should generate different bytes on each call', () => {
      const bytes1 = CryptoUtils.generateRandomBytes(32);
      const bytes2 = CryptoUtils.generateRandomBytes(32);
      expect(bytes1).not.toEqual(bytes2);
    });
  });

  describe('deriveKey', () => {
    it('should derive a key from password and salt', async () => {
      const password = 'test-password-123';
      const salt = CryptoUtils.generateRandomBytes(32);
      const key = await CryptoUtils.deriveKey(password, salt);

      expect(key).toBeDefined();
      expect(key.length).toBe(32);
    });

    it('should derive same key from same password and salt', async () => {
      const password = 'test-password-123';
      const salt = CryptoUtils.generateRandomBytes(32);

      const key1 = await CryptoUtils.deriveKey(password, salt);
      const key2 = await CryptoUtils.deriveKey(password, salt);

      expect(key1).toEqual(key2);
    });

    it('should derive different keys from different passwords', async () => {
      const salt = CryptoUtils.generateRandomBytes(32);

      const key1 = await CryptoUtils.deriveKey('password1', salt);
      const key2 = await CryptoUtils.deriveKey('password2', salt);

      expect(key1).not.toEqual(key2);
    });
  });

  describe('encrypt', () => {
    it('should encrypt data with password', async () => {
      const data = 'sensitive data to encrypt';
      const password = 'secure-password';

      const encrypted = await CryptoUtils.encrypt(data, password);

      expect(encrypted).toBeDefined();
      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.salt).toBeDefined();
      expect(encrypted.tag).toBeDefined();
    });

    it('should produce different ciphertext for same data', async () => {
      const data = 'sensitive data';
      const password = 'password';

      const encrypted1 = await CryptoUtils.encrypt(data, password);
      const encrypted2 = await CryptoUtils.encrypt(data, password);

      expect(encrypted1.ciphertext).not.toEqual(encrypted2.ciphertext);
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted data with correct password', async () => {
      const originalData = 'sensitive information';
      const password = 'secure-password';

      const encrypted = await CryptoUtils.encrypt(originalData, password);
      const decrypted = await CryptoUtils.decrypt(encrypted, password);

      expect(decrypted).toEqual(originalData);
    });

    it('should fail to decrypt with wrong password', async () => {
      const originalData = 'sensitive information';
      const password = 'correct-password';
      const wrongPassword = 'wrong-password';

      const encrypted = await CryptoUtils.encrypt(originalData, password);

      await expect(CryptoUtils.decrypt(encrypted, wrongPassword)).rejects.toThrow();
    });
  });

  describe('hashData', () => {
    it('should hash data consistently', () => {
      const data = 'data to hash';

      const hash1 = CryptoUtils.hashData(data);
      const hash2 = CryptoUtils.hashData(data);

      expect(hash1).toEqual(hash2);
    });

    it('should produce different hashes for different data', () => {
      const hash1 = CryptoUtils.hashData('data1');
      const hash2 = CryptoUtils.hashData('data2');

      expect(hash1).not.toEqual(hash2);
    });
  });
});
