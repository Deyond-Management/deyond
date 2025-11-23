/**
 * Crypto Utilities
 * Provides encryption, decryption, key derivation, and hashing functions
 * Using AES-256-GCM for encryption and PBKDF2 for key derivation
 */

import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';
import { randomBytes } from '@noble/hashes/utils';
import { EncryptedData } from '../../types/wallet';

// Polyfill crypto.getRandomValues if needed
if (typeof global.crypto === 'undefined') {
  (global as any).crypto = {
    getRandomValues: <T extends Uint8Array>(array: T): T => {
      const bytes = randomBytes(array.length);
      array.set(bytes);
      return array;
    },
  };
}

export class CryptoUtils {
  private static readonly PBKDF2_ITERATIONS = 100000;
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 12; // 96 bits for GCM
  private static readonly SALT_LENGTH = 32;
  private static readonly TAG_LENGTH = 16; // 128 bits for GCM

  /**
   * Generate cryptographically secure random bytes
   */
  static generateRandomBytes(length: number): Uint8Array {
    return randomBytes(length);
  }

  /**
   * Derive encryption key from password using PBKDF2
   */
  static async deriveKey(password: string, salt: Uint8Array): Promise<Uint8Array> {
    const passwordBytes = new TextEncoder().encode(password);

    return pbkdf2(sha256, passwordBytes, salt, {
      c: this.PBKDF2_ITERATIONS,
      dkLen: this.KEY_LENGTH,
    });
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  static async encrypt(data: string, password: string): Promise<EncryptedData> {
    try {
      // Generate random salt and IV
      const salt = this.generateRandomBytes(this.SALT_LENGTH);
      const iv = this.generateRandomBytes(this.IV_LENGTH);

      // Derive encryption key
      const key = await this.deriveKey(password, salt);

      // Import key for Web Crypto API
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key as BufferSource,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );

      // Encrypt data
      const dataBytes = new TextEncoder().encode(data);
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv as BufferSource,
          tagLength: this.TAG_LENGTH * 8, // in bits
        },
        cryptoKey,
        dataBytes
      );

      // Extract ciphertext and tag
      const encryptedArray = new Uint8Array(encryptedBuffer);
      const ciphertext = encryptedArray.slice(0, encryptedArray.length - this.TAG_LENGTH);
      const tag = encryptedArray.slice(encryptedArray.length - this.TAG_LENGTH);

      return {
        ciphertext: this.bytesToHex(ciphertext),
        iv: this.bytesToHex(iv),
        salt: this.bytesToHex(salt),
        tag: this.bytesToHex(tag),
      };
    } catch (error) {
      throw new Error(
        `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  static async decrypt(encryptedData: EncryptedData, password: string): Promise<string> {
    try {
      // Convert hex strings back to bytes
      const ciphertext = this.hexToBytes(encryptedData.ciphertext);
      const iv = this.hexToBytes(encryptedData.iv);
      const salt = this.hexToBytes(encryptedData.salt);
      const tag = encryptedData.tag ? this.hexToBytes(encryptedData.tag) : new Uint8Array();

      // Derive decryption key
      const key = await this.deriveKey(password, salt);

      // Import key for Web Crypto API
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key as BufferSource,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      // Combine ciphertext and tag
      const encryptedBuffer = new Uint8Array([...ciphertext, ...tag]);

      // Decrypt data
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv as BufferSource,
          tagLength: this.TAG_LENGTH * 8, // in bits
        },
        cryptoKey,
        encryptedBuffer
      );

      return new TextDecoder().decode(decryptedBuffer);
    } catch (error) {
      throw new Error(
        `Decryption failed: ${error instanceof Error ? error.message : 'Invalid password or corrupted data'}`
      );
    }
  }

  /**
   * Hash data using SHA-256
   */
  static hashData(data: string): string {
    const dataBytes = new TextEncoder().encode(data);
    const hash = sha256(dataBytes);
    return this.bytesToHex(hash);
  }

  /**
   * Convert bytes to hexadecimal string
   */
  private static bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Convert hexadecimal string to bytes
   */
  private static hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }
}
