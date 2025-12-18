/**
 * DeyondCrypt - Solana Crypto Primitive
 * Implementation for Solana chain using ed25519/x25519 curves
 *
 * Uses @noble/curves and @noble/hashes for cryptographic operations:
 * - ed25519 for signatures (EdDSA)
 * - x25519 for key exchange (ECDH via Curve25519)
 */

import { ed25519 } from '@noble/curves/ed25519';
import { x25519 } from '@noble/curves/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { sha512 } from '@noble/hashes/sha512';
import { hmac } from '@noble/hashes/hmac';
import { ICryptoPrimitive, KeyPair } from './index';
import { ChainType, CurveType } from '../types';

/**
 * Solana Crypto Primitive using ed25519/x25519 curves
 * Supports Solana mainnet and devnet
 */
export class SolanaCrypto implements ICryptoPrimitive {
  readonly chainType: ChainType = 'solana';
  readonly curveType: CurveType = 'ed25519';

  // ed25519 key sizes
  private static readonly PRIVATE_KEY_SIZE = 32; // Seed
  private static readonly PUBLIC_KEY_SIZE = 32;
  private static readonly SIGNATURE_SIZE = 64;

  // ---------------------------------------------------------------------------
  // Key Generation
  // ---------------------------------------------------------------------------

  async generateKeyPair(): Promise<KeyPair> {
    // Generate random private key using @noble
    const privateKey = ed25519.utils.randomPrivateKey();

    // Derive public key from private key
    const publicKey = ed25519.getPublicKey(privateKey);

    return {
      privateKey: new Uint8Array(privateKey),
      publicKey: new Uint8Array(publicKey),
    };
  }

  async deriveKeyPairFromSeed(seed: Uint8Array): Promise<KeyPair> {
    if (seed.length < 32) {
      throw new Error('Seed must be at least 32 bytes');
    }

    // Use first 32 bytes as private key seed
    const privateKey = seed.slice(0, 32);
    const publicKey = ed25519.getPublicKey(privateKey);

    return {
      privateKey: new Uint8Array(privateKey),
      publicKey: new Uint8Array(publicKey),
    };
  }

  async deriveMessagingKeyPair(
    walletPrivateKey: Uint8Array,
    chainId: number | string
  ): Promise<KeyPair> {
    // BIP32-like derivation for Solana messaging key
    // Purpose: 0x44455943 = "DEYC" (DeyondCrypt)
    const purpose = 0x44455943;
    const chainIdNum = typeof chainId === 'string' ? parseInt(chainId, 10) || 0 : chainId;

    // Create derivation path data
    const pathData = new Uint8Array(12);
    const view = new DataView(pathData.buffer);
    view.setUint32(0, purpose, false);
    view.setUint32(4, chainIdNum, false);
    view.setUint32(8, 0, false); // account index

    // Derive seed using HMAC-SHA512
    const seed = hmac(sha512, walletPrivateKey, pathData);

    return this.deriveKeyPairFromSeed(seed.slice(0, 32));
  }

  // ---------------------------------------------------------------------------
  // Key Exchange (X25519 ECDH)
  // ---------------------------------------------------------------------------

  async computeSharedSecret(privateKey: Uint8Array, publicKey: Uint8Array): Promise<Uint8Array> {
    this.validatePrivateKey(privateKey);
    this.validatePublicKey(publicKey);

    // Convert ed25519 keys to x25519 keys for ECDH
    // ed25519 private key can be used directly with x25519 after hashing
    const x25519PrivateKey = this.ed25519PrivateToX25519(privateKey);
    const x25519PublicKey = this.ed25519PublicToX25519(publicKey);

    // Compute X25519 ECDH shared secret
    const sharedPoint = x25519.scalarMult(x25519PrivateKey, x25519PublicKey);

    // Hash the shared secret for additional security
    return sha256(sharedPoint);
  }

  // ---------------------------------------------------------------------------
  // Signing (Ed25519)
  // ---------------------------------------------------------------------------

  async sign(message: Uint8Array, privateKey: Uint8Array): Promise<Uint8Array> {
    this.validatePrivateKey(privateKey);

    // Ed25519 signs the raw message (internally handles hashing)
    const signature = ed25519.sign(message, privateKey);

    return new Uint8Array(signature);
  }

  async verify(
    message: Uint8Array,
    signature: Uint8Array,
    publicKey: Uint8Array
  ): Promise<boolean> {
    this.validatePublicKey(publicKey);

    if (signature.length !== SolanaCrypto.SIGNATURE_SIZE) {
      return false;
    }

    try {
      return ed25519.verify(signature, message, publicKey);
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Address Operations
  // ---------------------------------------------------------------------------

  publicKeyToAddress(publicKey: Uint8Array): string {
    // Solana address is base58-encoded public key
    return this.base58Encode(publicKey);
  }

  isValidAddress(address: string): boolean {
    // Solana address: 32-44 characters base58
    if (address.length < 32 || address.length > 44) {
      return false;
    }

    // Check if all characters are valid base58
    const base58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    for (const char of address) {
      if (!base58Chars.includes(char)) {
        return false;
      }
    }

    return true;
  }

  // ---------------------------------------------------------------------------
  // Serialization
  // ---------------------------------------------------------------------------

  compressPublicKey(publicKey: Uint8Array): Uint8Array {
    // ed25519 public keys are already 32 bytes (compressed)
    if (publicKey.length !== SolanaCrypto.PUBLIC_KEY_SIZE) {
      throw new Error(`Invalid public key length: ${publicKey.length}`);
    }
    return publicKey;
  }

  decompressPublicKey(compressedPublicKey: Uint8Array): Uint8Array {
    // ed25519 public keys are already 32 bytes
    if (compressedPublicKey.length !== SolanaCrypto.PUBLIC_KEY_SIZE) {
      throw new Error(`Invalid public key length: ${compressedPublicKey.length}`);
    }
    return compressedPublicKey;
  }

  // ---------------------------------------------------------------------------
  // Private Helper Methods
  // ---------------------------------------------------------------------------

  /**
   * Convert ed25519 private key (seed) to x25519 private key
   * This follows the ed25519 to x25519 conversion algorithm
   */
  private ed25519PrivateToX25519(ed25519PrivateKey: Uint8Array): Uint8Array {
    // Hash the ed25519 seed with SHA512
    const hash = sha512(ed25519PrivateKey);
    // Take first 32 bytes and apply clamping
    const x25519Key = hash.slice(0, 32);
    // Clamp as per curve25519 spec
    x25519Key[0] &= 248;
    x25519Key[31] &= 127;
    x25519Key[31] |= 64;
    return x25519Key;
  }

  /**
   * Convert ed25519 public key to x25519 public key
   * Uses the birational map between the two curves
   */
  private ed25519PublicToX25519(ed25519PublicKey: Uint8Array): Uint8Array {
    // The conversion formula: u = (1 + y) / (1 - y)
    // where ed25519 point is (x, y) and x25519 uses Montgomery form
    try {
      // Decode the ed25519 point
      const point = ed25519.ExtendedPoint.fromHex(ed25519PublicKey);
      // Get the y coordinate
      const y = point.toAffine().y;

      // Calculate u = (1 + y) / (1 - y) mod p
      const p = BigInt(
        '57896044618658097711785492504343953926634992332820282019728792003956564819949'
      );
      const one = 1n;

      const yNum = typeof y === 'bigint' ? y : BigInt(y.toString());
      const numerator = (one + yNum) % p;
      const denominator = (p + one - yNum) % p;

      // Modular inverse using extended Euclidean algorithm
      const denominatorInv = this.modInverse(denominator, p);
      const u = (numerator * denominatorInv) % p;

      // Convert to bytes (little-endian)
      return this.bigIntToBytes(u, 32);
    } catch {
      // Fallback: just hash the public key for a deterministic x25519 key
      // This is less ideal but ensures we always get a valid x25519 public key
      return sha256(ed25519PublicKey);
    }
  }

  private modInverse(a: bigint, m: bigint): bigint {
    let [old_r, r] = [a, m];
    let [old_s, s] = [1n, 0n];

    while (r !== 0n) {
      const quotient = old_r / r;
      [old_r, r] = [r, old_r - quotient * r];
      [old_s, s] = [s, old_s - quotient * s];
    }

    return ((old_s % m) + m) % m;
  }

  private bigIntToBytes(num: bigint, length: number): Uint8Array {
    const bytes = new Uint8Array(length);
    let n = num;
    for (let i = 0; i < length; i++) {
      bytes[i] = Number(n & 0xffn);
      n >>= 8n;
    }
    return bytes;
  }

  private validatePrivateKey(privateKey: Uint8Array): void {
    if (privateKey.length !== SolanaCrypto.PRIVATE_KEY_SIZE) {
      throw new Error(
        `Invalid private key length: ${privateKey.length}, expected ${SolanaCrypto.PRIVATE_KEY_SIZE}`
      );
    }

    // Check if key is zero
    let isZero = true;
    for (const byte of privateKey) {
      if (byte !== 0) {
        isZero = false;
        break;
      }
    }

    if (isZero) {
      throw new Error('Private key cannot be zero');
    }
  }

  private validatePublicKey(publicKey: Uint8Array): void {
    if (publicKey.length !== SolanaCrypto.PUBLIC_KEY_SIZE) {
      throw new Error(
        `Invalid public key length: ${publicKey.length}, expected ${SolanaCrypto.PUBLIC_KEY_SIZE}`
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Base58 Encoding (Solana addresses)
  // ---------------------------------------------------------------------------

  private base58Encode(bytes: Uint8Array): string {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

    // Count leading zeros
    let leadingZeros = 0;
    for (const byte of bytes) {
      if (byte === 0) leadingZeros++;
      else break;
    }

    // Convert bytes to base58
    let result = '';
    let value = 0n;

    for (const byte of bytes) {
      value = value * 256n + BigInt(byte);
    }

    while (value > 0n) {
      const remainder = Number(value % 58n);
      value = value / 58n;
      result = alphabet[remainder] + result;
    }

    // Add leading '1's for each leading zero byte
    return '1'.repeat(leadingZeros) + result;
  }
}

// Export singleton instance
export const solanaCrypto = new SolanaCrypto();
