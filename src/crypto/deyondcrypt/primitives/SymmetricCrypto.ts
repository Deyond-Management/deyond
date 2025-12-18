/**
 * DeyondCrypt - Symmetric Encryption
 * AES-256-GCM implementation for message encryption
 * This module is chain-agnostic and used by all chain implementations
 *
 * Uses @noble/ciphers for AES-GCM and @noble/hashes for key derivation
 */

import { gcm } from '@noble/ciphers/aes.js';
import { sha256 } from '@noble/hashes/sha256';
import { hmac } from '@noble/hashes/hmac';
import { hkdf } from '@noble/hashes/hkdf';
import { randomBytes } from '@noble/hashes/utils';
import { ISymmetricCrypto, IKeyDerivation } from './index';

// =============================================================================
// AES-256-GCM Constants
// =============================================================================

const AES_KEY_SIZE = 32; // 256 bits
const GCM_NONCE_SIZE = 12; // 96 bits (recommended for GCM)
const GCM_TAG_SIZE = 16; // 128 bits

// =============================================================================
// Symmetric Crypto Implementation
// =============================================================================

/**
 * AES-256-GCM symmetric encryption
 * Used for encrypting messages after key derivation
 */
export class SymmetricCrypto implements ISymmetricCrypto {
  async encrypt(
    plaintext: Uint8Array,
    key: Uint8Array,
    associatedData?: Uint8Array
  ): Promise<{ ciphertext: Uint8Array; nonce: Uint8Array }> {
    this.validateKey(key);

    // Generate random nonce using secure random
    const nonce = randomBytes(GCM_NONCE_SIZE);

    // Create AES-256-GCM cipher instance
    const cipher = gcm(key, nonce, associatedData);

    // Encrypt and get ciphertext with authentication tag appended
    const ciphertext = cipher.encrypt(plaintext);

    return { ciphertext, nonce };
  }

  async decrypt(
    ciphertext: Uint8Array,
    key: Uint8Array,
    nonce: Uint8Array,
    associatedData?: Uint8Array
  ): Promise<Uint8Array> {
    this.validateKey(key);
    this.validateNonce(nonce);

    if (ciphertext.length < GCM_TAG_SIZE) {
      throw new Error('Ciphertext too short');
    }

    // Create AES-256-GCM cipher instance
    const cipher = gcm(key, nonce, associatedData);

    // Decrypt and verify authentication tag
    try {
      return cipher.decrypt(ciphertext);
    } catch {
      throw new Error('Authentication failed: invalid tag');
    }
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  private validateKey(key: Uint8Array): void {
    if (key.length !== AES_KEY_SIZE) {
      throw new Error(`Invalid key length: ${key.length}, expected ${AES_KEY_SIZE}`);
    }
  }

  private validateNonce(nonce: Uint8Array): void {
    if (nonce.length !== GCM_NONCE_SIZE) {
      throw new Error(`Invalid nonce length: ${nonce.length}, expected ${GCM_NONCE_SIZE}`);
    }
  }
}

// =============================================================================
// Key Derivation Implementation
// =============================================================================

/**
 * Key derivation functions for Double Ratchet
 * HKDF, HMAC-SHA256, SHA256
 * Uses @noble/hashes for all operations
 */
export class KeyDerivation implements IKeyDerivation {
  async hkdf(
    inputKeyMaterial: Uint8Array,
    salt: Uint8Array | null,
    info: Uint8Array,
    length: number
  ): Promise<Uint8Array> {
    // HKDF as per RFC 5869 using @noble/hashes
    // Use default salt if not provided
    const actualSalt = salt || new Uint8Array(32);

    return hkdf(sha256, inputKeyMaterial, actualSalt, info, length);
  }

  async hmacSha256(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
    // HMAC-SHA256 using @noble/hashes
    return hmac(sha256, key, data);
  }

  async sha256(data: Uint8Array): Promise<Uint8Array> {
    // SHA256 using @noble/hashes
    return sha256(data);
  }
}

// =============================================================================
// Exports
// =============================================================================

export const symmetricCrypto = new SymmetricCrypto();
export const keyDerivation = new KeyDerivation();

// Export constants for testing
export { AES_KEY_SIZE, GCM_NONCE_SIZE, GCM_TAG_SIZE };
