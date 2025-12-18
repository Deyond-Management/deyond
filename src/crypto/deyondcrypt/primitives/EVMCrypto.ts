/**
 * DeyondCrypt - EVM Crypto Primitive
 * Implementation for EVM chains using secp256k1 curve
 *
 * Uses @noble/curves and @noble/hashes for cryptographic operations
 */

import { secp256k1 } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { hmac } from '@noble/hashes/hmac';
import { keccak_256 } from '@noble/hashes/sha3';
import { ICryptoPrimitive, KeyPair } from './index';
import { ChainType, CurveType } from '../types';

/**
 * EVM Crypto Primitive using secp256k1 curve
 * Supports Ethereum, Polygon, BSC, Arbitrum, and other EVM chains
 */
export class EVMCrypto implements ICryptoPrimitive {
  readonly chainType: ChainType = 'evm';
  readonly curveType: CurveType = 'secp256k1';

  // secp256k1 curve parameters
  private static readonly PRIVATE_KEY_SIZE = 32;
  private static readonly PUBLIC_KEY_SIZE = 33; // Compressed
  private static readonly UNCOMPRESSED_PUBLIC_KEY_SIZE = 65;
  private static readonly SIGNATURE_SIZE = 64; // r + s without recovery

  // ---------------------------------------------------------------------------
  // Key Generation
  // ---------------------------------------------------------------------------

  async generateKeyPair(): Promise<KeyPair> {
    // Generate random private key
    const privateKey = secp256k1.utils.randomPrivateKey();

    // Derive public key (compressed)
    const publicKey = secp256k1.getPublicKey(privateKey, true);

    return {
      privateKey: new Uint8Array(privateKey),
      publicKey: new Uint8Array(publicKey),
    };
  }

  async deriveKeyPairFromSeed(seed: Uint8Array): Promise<KeyPair> {
    if (seed.length < 32) {
      throw new Error('Seed must be at least 32 bytes');
    }

    // Use first 32 bytes as private key
    const privateKey = seed.slice(0, 32);

    // Validate private key is valid for secp256k1
    if (!secp256k1.utils.isValidPrivateKey(privateKey)) {
      throw new Error('Invalid private key derived from seed');
    }

    const publicKey = secp256k1.getPublicKey(privateKey, true);

    return {
      privateKey: new Uint8Array(privateKey),
      publicKey: new Uint8Array(publicKey),
    };
  }

  async deriveMessagingKeyPair(
    walletPrivateKey: Uint8Array,
    chainId: number | string
  ): Promise<KeyPair> {
    // BIP32-like derivation: m/deyondcrypt'/chainId'/0'
    // Purpose: 0x44455943 = "DEYC" in hex (DeyondCrypt purpose)
    const purpose = 0x44455943;
    const chainIdNum = typeof chainId === 'string' ? parseInt(chainId, 10) || 0 : chainId;

    // Create derivation path data
    const pathData = new Uint8Array(12);
    const view = new DataView(pathData.buffer);
    view.setUint32(0, purpose, false); // big-endian
    view.setUint32(4, chainIdNum, false);
    view.setUint32(8, 0, false); // account index

    // Derive seed using HMAC-SHA256
    const seed = hmac(sha256, walletPrivateKey, pathData);

    return this.deriveKeyPairFromSeed(seed);
  }

  // ---------------------------------------------------------------------------
  // Key Exchange (ECDH)
  // ---------------------------------------------------------------------------

  async computeSharedSecret(privateKey: Uint8Array, publicKey: Uint8Array): Promise<Uint8Array> {
    this.validatePrivateKey(privateKey);
    this.validatePublicKey(publicKey);

    // Perform ECDH using secp256k1
    const sharedPoint = secp256k1.getSharedSecret(privateKey, publicKey);

    // Return SHA256 hash of x-coordinate (first 32 bytes after prefix)
    // sharedPoint is 33 bytes (compressed) or 65 bytes (uncompressed)
    const xCoord = sharedPoint.slice(1, 33);
    return sha256(xCoord);
  }

  // ---------------------------------------------------------------------------
  // Signing
  // ---------------------------------------------------------------------------

  async sign(message: Uint8Array, privateKey: Uint8Array): Promise<Uint8Array> {
    this.validatePrivateKey(privateKey);

    // Hash the message first (standard ECDSA practice)
    const messageHash = sha256(message);

    // Sign using secp256k1 ECDSA
    const signature = secp256k1.sign(messageHash, privateKey);

    // Return compact signature (r || s, 64 bytes)
    return signature.toCompactRawBytes();
  }

  async verify(
    message: Uint8Array,
    signature: Uint8Array,
    publicKey: Uint8Array
  ): Promise<boolean> {
    this.validatePublicKey(publicKey);

    if (signature.length !== EVMCrypto.SIGNATURE_SIZE) {
      return false;
    }

    try {
      // Hash the message
      const messageHash = sha256(message);

      // Verify using secp256k1 ECDSA
      return secp256k1.verify(signature, messageHash, publicKey);
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Address Operations
  // ---------------------------------------------------------------------------

  publicKeyToAddress(publicKey: Uint8Array): string {
    // For EVM: address = '0x' + keccak256(publicKey[1:])[12:]
    // Using uncompressed public key without the 0x04 prefix

    let uncompressedKey = publicKey;
    if (publicKey.length === EVMCrypto.PUBLIC_KEY_SIZE) {
      // Decompress the public key
      const point = secp256k1.ProjectivePoint.fromHex(publicKey);
      uncompressedKey = point.toRawBytes(false); // uncompressed
    }

    // Remove the 0x04 prefix
    const keyWithoutPrefix = uncompressedKey.slice(1);

    // Keccak256 hash and take last 20 bytes
    const hash = keccak_256(keyWithoutPrefix);
    const addressBytes = hash.slice(12);

    return '0x' + this.bytesToHex(addressBytes);
  }

  isValidAddress(address: string): boolean {
    // EVM address: 0x followed by 40 hex characters
    if (!address.startsWith('0x')) {
      return false;
    }

    const hexPart = address.slice(2);
    if (hexPart.length !== 40) {
      return false;
    }

    return /^[0-9a-fA-F]{40}$/.test(hexPart);
  }

  // ---------------------------------------------------------------------------
  // Serialization
  // ---------------------------------------------------------------------------

  compressPublicKey(publicKey: Uint8Array): Uint8Array {
    if (publicKey.length === EVMCrypto.PUBLIC_KEY_SIZE) {
      // Already compressed
      return publicKey;
    }

    if (publicKey.length !== EVMCrypto.UNCOMPRESSED_PUBLIC_KEY_SIZE) {
      throw new Error(
        `Invalid public key length: ${publicKey.length}, expected ${EVMCrypto.UNCOMPRESSED_PUBLIC_KEY_SIZE}`
      );
    }

    // Use noble to compress
    const point = secp256k1.ProjectivePoint.fromHex(publicKey);
    return point.toRawBytes(true); // compressed
  }

  decompressPublicKey(compressedPublicKey: Uint8Array): Uint8Array {
    if (compressedPublicKey.length === EVMCrypto.UNCOMPRESSED_PUBLIC_KEY_SIZE) {
      // Already uncompressed
      return compressedPublicKey;
    }

    if (compressedPublicKey.length !== EVMCrypto.PUBLIC_KEY_SIZE) {
      throw new Error(`Invalid compressed public key length: ${compressedPublicKey.length}`);
    }

    // Use noble to decompress
    const point = secp256k1.ProjectivePoint.fromHex(compressedPublicKey);
    return point.toRawBytes(false); // uncompressed
  }

  // ---------------------------------------------------------------------------
  // Private Helper Methods
  // ---------------------------------------------------------------------------

  private validatePrivateKey(privateKey: Uint8Array): void {
    if (privateKey.length !== EVMCrypto.PRIVATE_KEY_SIZE) {
      throw new Error(
        `Invalid private key length: ${privateKey.length}, expected ${EVMCrypto.PRIVATE_KEY_SIZE}`
      );
    }

    if (!secp256k1.utils.isValidPrivateKey(privateKey)) {
      throw new Error('Invalid private key');
    }
  }

  private validatePublicKey(publicKey: Uint8Array): void {
    if (
      publicKey.length !== EVMCrypto.PUBLIC_KEY_SIZE &&
      publicKey.length !== EVMCrypto.UNCOMPRESSED_PUBLIC_KEY_SIZE
    ) {
      throw new Error(
        `Invalid public key length: ${publicKey.length}, expected ${EVMCrypto.PUBLIC_KEY_SIZE} or ${EVMCrypto.UNCOMPRESSED_PUBLIC_KEY_SIZE}`
      );
    }

    // Check prefix
    if (publicKey.length === EVMCrypto.PUBLIC_KEY_SIZE) {
      if (publicKey[0] !== 0x02 && publicKey[0] !== 0x03) {
        throw new Error('Invalid compressed public key prefix');
      }
    } else {
      if (publicKey[0] !== 0x04) {
        throw new Error('Invalid uncompressed public key prefix');
      }
    }
  }

  private bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

// Export singleton instance
export const evmCrypto = new EVMCrypto();
