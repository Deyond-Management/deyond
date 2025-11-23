/**
 * SecureStorageService
 * Secure storage using expo-secure-store for sensitive data
 */

import * as SecureStore from 'expo-secure-store';

export class SecureStorageService {
  private options: SecureStore.SecureStoreOptions;

  constructor() {
    this.options = {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    };
  }

  /**
   * Store a value securely
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value, this.options);
    } catch (error) {
      console.error('SecureStorage setItem error:', error);
      throw new Error('Failed to store secure data');
    }
  }

  /**
   * Retrieve a stored value
   */
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('SecureStorage getItem error:', error);
      throw new Error('Failed to retrieve secure data');
    }
  }

  /**
   * Delete a stored value
   */
  async deleteItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('SecureStorage deleteItem error:', error);
      throw new Error('Failed to delete secure data');
    }
  }

  /**
   * Store an object as JSON
   */
  async setObject<T>(key: string, value: T): Promise<void> {
    const jsonString = JSON.stringify(value);
    await this.setItem(key, jsonString);
  }

  /**
   * Retrieve and parse a stored object
   */
  async getObject<T>(key: string): Promise<T | null> {
    const jsonString = await this.getItem(key);

    if (jsonString === null) {
      return null;
    }

    try {
      return JSON.parse(jsonString) as T;
    } catch (error) {
      console.error('SecureStorage parse error:', error);
      throw new Error('Failed to parse secure data');
    }
  }

  /**
   * Check if a key exists
   */
  async hasItem(key: string): Promise<boolean> {
    const value = await this.getItem(key);
    return value !== null;
  }

  /**
   * Clear multiple keys
   */
  async clear(keys: string[]): Promise<void> {
    await Promise.all(keys.map(key => this.deleteItem(key)));
  }

  /**
   * Store encrypted private key
   */
  async storePrivateKey(address: string, encryptedKey: string): Promise<void> {
    const key = `pk_${address.toLowerCase()}`;
    await this.setItem(key, encryptedKey);
  }

  /**
   * Retrieve encrypted private key
   */
  async getPrivateKey(address: string): Promise<string | null> {
    const key = `pk_${address.toLowerCase()}`;
    return this.getItem(key);
  }

  /**
   * Delete private key
   */
  async deletePrivateKey(address: string): Promise<void> {
    const key = `pk_${address.toLowerCase()}`;
    await this.deleteItem(key);
  }

  /**
   * Store mnemonic phrase
   */
  async storeMnemonic(walletId: string, encryptedMnemonic: string): Promise<void> {
    const key = `mnemonic_${walletId}`;
    await this.setItem(key, encryptedMnemonic);
  }

  /**
   * Retrieve mnemonic phrase
   */
  async getMnemonic(walletId: string): Promise<string | null> {
    const key = `mnemonic_${walletId}`;
    return this.getItem(key);
  }

  /**
   * Store PIN hash
   */
  async storePINHash(hash: string): Promise<void> {
    await this.setItem('pin_hash', hash);
  }

  /**
   * Retrieve PIN hash
   */
  async getPINHash(): Promise<string | null> {
    return this.getItem('pin_hash');
  }
}

export default SecureStorageService;
