/**
 * DeyondCrypt - Crypto Primitives Interface
 * Extensible interface for blockchain-specific cryptographic operations
 */

import { ChainType, CurveType, KeyPair } from '../types';

// =============================================================================
// ICryptoPrimitive Interface
// =============================================================================

/**
 * Abstract interface for blockchain-specific crypto operations.
 * Each blockchain implementation (EVM, Solana, etc.) provides its own
 * implementation of this interface.
 */
export interface ICryptoPrimitive {
  /**
   * The blockchain type this primitive supports
   */
  readonly chainType: ChainType;

  /**
   * The elliptic curve used by this primitive
   */
  readonly curveType: CurveType;

  // ---------------------------------------------------------------------------
  // Key Generation
  // ---------------------------------------------------------------------------

  /**
   * Generate a new random key pair
   */
  generateKeyPair(): Promise<KeyPair>;

  /**
   * Derive a key pair from a seed (deterministic)
   * @param seed - 32-byte seed for key derivation
   */
  deriveKeyPairFromSeed(seed: Uint8Array): Promise<KeyPair>;

  /**
   * Derive a messaging key pair from wallet private key
   * Uses BIP32-like derivation: m/deyondcrypt'/chainId'/0'
   * @param walletPrivateKey - The wallet's private key
   * @param chainId - The chain ID for derivation path
   */
  deriveMessagingKeyPair(walletPrivateKey: Uint8Array, chainId: number | string): Promise<KeyPair>;

  // ---------------------------------------------------------------------------
  // Key Exchange (ECDH)
  // ---------------------------------------------------------------------------

  /**
   * Perform ECDH key exchange to derive a shared secret
   * @param privateKey - Our private key
   * @param publicKey - Their public key
   * @returns Shared secret (32 bytes)
   */
  computeSharedSecret(privateKey: Uint8Array, publicKey: Uint8Array): Promise<Uint8Array>;

  // ---------------------------------------------------------------------------
  // Signing
  // ---------------------------------------------------------------------------

  /**
   * Sign a message with a private key
   * @param message - The message to sign
   * @param privateKey - The signing private key
   * @returns The signature
   */
  sign(message: Uint8Array, privateKey: Uint8Array): Promise<Uint8Array>;

  /**
   * Verify a signature
   * @param message - The original message
   * @param signature - The signature to verify
   * @param publicKey - The public key to verify against
   * @returns True if signature is valid
   */
  verify(message: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): Promise<boolean>;

  // ---------------------------------------------------------------------------
  // Address Operations
  // ---------------------------------------------------------------------------

  /**
   * Derive the blockchain address from a public key
   * @param publicKey - The public key
   * @returns The blockchain address string
   */
  publicKeyToAddress(publicKey: Uint8Array): string;

  /**
   * Validate if an address is valid for this chain
   * @param address - The address to validate
   * @returns True if address is valid
   */
  isValidAddress(address: string): boolean;

  // ---------------------------------------------------------------------------
  // Serialization
  // ---------------------------------------------------------------------------

  /**
   * Compress a public key (if supported by curve)
   * @param publicKey - Uncompressed public key
   * @returns Compressed public key
   */
  compressPublicKey(publicKey: Uint8Array): Uint8Array;

  /**
   * Decompress a public key (if supported by curve)
   * @param compressedPublicKey - Compressed public key
   * @returns Uncompressed public key
   */
  decompressPublicKey(compressedPublicKey: Uint8Array): Uint8Array;
}

// =============================================================================
// Symmetric Encryption Interface (Chain-agnostic)
// =============================================================================

/**
 * Symmetric encryption operations using AES-256-GCM
 * This is chain-agnostic and used by all implementations
 */
export interface ISymmetricCrypto {
  /**
   * Encrypt data with AES-256-GCM
   * @param plaintext - Data to encrypt
   * @param key - 32-byte encryption key
   * @param associatedData - Optional additional authenticated data
   * @returns Object containing ciphertext and nonce
   */
  encrypt(
    plaintext: Uint8Array,
    key: Uint8Array,
    associatedData?: Uint8Array
  ): Promise<{ ciphertext: Uint8Array; nonce: Uint8Array }>;

  /**
   * Decrypt data with AES-256-GCM
   * @param ciphertext - Data to decrypt
   * @param key - 32-byte decryption key
   * @param nonce - The nonce used during encryption
   * @param associatedData - Optional additional authenticated data
   * @returns Decrypted plaintext
   */
  decrypt(
    ciphertext: Uint8Array,
    key: Uint8Array,
    nonce: Uint8Array,
    associatedData?: Uint8Array
  ): Promise<Uint8Array>;
}

// =============================================================================
// Key Derivation Interface (Chain-agnostic)
// =============================================================================

/**
 * Key derivation functions for the Double Ratchet
 */
export interface IKeyDerivation {
  /**
   * HKDF - Extract and expand a key
   * @param inputKeyMaterial - Input key material
   * @param salt - Salt (optional)
   * @param info - Context info
   * @param length - Output length in bytes
   */
  hkdf(
    inputKeyMaterial: Uint8Array,
    salt: Uint8Array | null,
    info: Uint8Array,
    length: number
  ): Promise<Uint8Array>;

  /**
   * HMAC-SHA256
   * @param key - HMAC key
   * @param data - Data to authenticate
   */
  hmacSha256(key: Uint8Array, data: Uint8Array): Promise<Uint8Array>;

  /**
   * SHA256 hash
   * @param data - Data to hash
   */
  sha256(data: Uint8Array): Promise<Uint8Array>;
}

// =============================================================================
// Registry for Crypto Primitives
// =============================================================================

/**
 * Registry for managing crypto primitives across chains
 */
export class CryptoPrimitiveRegistry {
  private static primitives: Map<ChainType, ICryptoPrimitive> = new Map();

  /**
   * Register a crypto primitive for a chain type
   */
  static register(primitive: ICryptoPrimitive): void {
    this.primitives.set(primitive.chainType, primitive);
  }

  /**
   * Get the crypto primitive for a chain type
   */
  static get(chainType: ChainType): ICryptoPrimitive {
    const primitive = this.primitives.get(chainType);
    if (!primitive) {
      throw new Error(`No crypto primitive registered for chain: ${chainType}`);
    }
    return primitive;
  }

  /**
   * Check if a primitive is registered for a chain type
   */
  static has(chainType: ChainType): boolean {
    return this.primitives.has(chainType);
  }

  /**
   * Get all registered chain types
   */
  static getRegisteredChains(): ChainType[] {
    return Array.from(this.primitives.keys());
  }

  /**
   * Clear all registered primitives (for testing)
   */
  static clear(): void {
    this.primitives.clear();
  }
}

// Re-export types
export type { KeyPair, ChainType, CurveType };
