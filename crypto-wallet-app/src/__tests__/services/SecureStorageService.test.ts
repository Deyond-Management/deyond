/**
 * SecureStorageService Tests
 * TDD: Write tests first, then implement
 */

import { SecureStorageService } from '../../services/SecureStorageService';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  WHEN_UNLOCKED: 'WHEN_UNLOCKED',
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  AFTER_FIRST_UNLOCK: 'AFTER_FIRST_UNLOCK',
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY',
}));

import * as SecureStore from 'expo-secure-store';

describe('SecureStorageService', () => {
  let secureStorage: SecureStorageService;

  beforeEach(() => {
    secureStorage = new SecureStorageService();
    jest.clearAllMocks();
  });

  describe('setItem', () => {
    it('should store a value securely', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      await secureStorage.setItem('test-key', 'test-value');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'test-key',
        'test-value',
        expect.any(Object)
      );
    });

    it('should use secure options', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      await secureStorage.setItem('key', 'value');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'key',
        'value',
        expect.objectContaining({
          keychainAccessible: expect.any(String),
        })
      );
    });

    it('should throw error on failure', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      await expect(
        secureStorage.setItem('key', 'value')
      ).rejects.toThrow('Failed to store secure data');
    });
  });

  describe('getItem', () => {
    it('should retrieve a stored value', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('stored-value');

      const result = await secureStorage.getItem('test-key');

      expect(result).toBe('stored-value');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('test-key');
    });

    it('should return null for non-existent key', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const result = await secureStorage.getItem('non-existent');

      expect(result).toBeNull();
    });

    it('should throw error on failure', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(
        new Error('Retrieval error')
      );

      await expect(secureStorage.getItem('key')).rejects.toThrow(
        'Failed to retrieve secure data'
      );
    });
  });

  describe('deleteItem', () => {
    it('should delete a stored value', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

      await secureStorage.deleteItem('test-key');

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('test-key');
    });

    it('should throw error on failure', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValue(
        new Error('Delete error')
      );

      await expect(secureStorage.deleteItem('key')).rejects.toThrow(
        'Failed to delete secure data'
      );
    });
  });

  describe('setObject', () => {
    it('should store an object as JSON', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      const obj = { name: 'test', value: 123 };
      await secureStorage.setObject('key', obj);

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'key',
        JSON.stringify(obj),
        expect.any(Object)
      );
    });
  });

  describe('getObject', () => {
    it('should retrieve and parse a stored object', async () => {
      const obj = { name: 'test', value: 123 };
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
        JSON.stringify(obj)
      );

      const result = await secureStorage.getObject('key');

      expect(result).toEqual(obj);
    });

    it('should return null for non-existent key', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const result = await secureStorage.getObject('key');

      expect(result).toBeNull();
    });

    it('should throw error for invalid JSON', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('invalid-json');

      await expect(secureStorage.getObject('key')).rejects.toThrow(
        'Failed to parse secure data'
      );
    });
  });

  describe('hasItem', () => {
    it('should return true for existing key', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('value');

      const result = await secureStorage.hasItem('key');

      expect(result).toBe(true);
    });

    it('should return false for non-existent key', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const result = await secureStorage.hasItem('key');

      expect(result).toBe(false);
    });
  });

  describe('clear', () => {
    it('should delete multiple keys', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

      await secureStorage.clear(['key1', 'key2', 'key3']);

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(3);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('key1');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('key2');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('key3');
    });
  });
});
