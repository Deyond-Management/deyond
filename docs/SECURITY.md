# Security Considerations for Deyond

## Document Information
- **Version**: 1.0.0
- **Date**: 2025-11-19
- **Status**: Living Document
- **Owner**: Security Team
- **Review Cycle**: Quarterly

---

## Table of Contents
1. [Security Overview](#1-security-overview)
2. [Cryptography](#2-cryptography)
3. [Authentication & Authorization](#3-authentication--authorization)
4. [Data Protection](#4-data-protection)
5. [Network Security](#5-network-security)
6. [Application Security](#6-application-security)
7. [Blockchain Security](#7-blockchain-security)
8. [Vulnerability Management](#8-vulnerability-management)
9. [Privacy Considerations](#9-privacy-considerations)
10. [Security Best Practices](#10-security-best-practices)
11. [Security Checklist](#11-security-checklist)
12. [Penetration Testing Guidelines](#12-penetration-testing-guidelines)

---

## 1. Security Overview

### 1.1 Threat Model

Deyond faces multiple threat vectors as a decentralized social crypto wallet:

#### **Critical Assets**
1. **Private Keys** - Complete compromise leads to asset theft
2. **Mnemonic Phrases** - Recovery phrase exposure = total loss
3. **Message Content** - Encrypted conversations must remain private
4. **User Identity** - Profile and contact data privacy
5. **Transaction Data** - Financial activity privacy
6. **Location Data** - GPS coordinates for feed flags
7. **Biometric Data** - Face ID/Touch ID templates
8. **Session Tokens** - API authentication credentials

#### **Threat Actors**
- **Malicious Apps** - Clipboard monitoring, screen recording
- **Network Attackers** - MITM, DNS spoofing, traffic analysis
- **Phishing Sites** - Fake dApps requesting signatures
- **Malicious Contracts** - Draining approvals, honeypots
- **Device Compromise** - Jailbreak/root exploits
- **Physical Access** - Device theft, shoulder surfing
- **Supply Chain** - Compromised dependencies
- **Insider Threats** - Malicious developers, admin abuse

#### **Attack Vectors**
1. **Key Extraction** - Memory dumps, debugger attachment, keylogger
2. **Transaction Manipulation** - Parameter tampering, replay attacks
3. **Social Engineering** - Phishing, impersonation, urgency tactics
4. **Code Injection** - XSS in browser, malicious Snaps
5. **Denial of Service** - Gas griefing, spam messages
6. **Privacy Leakage** - Metadata analysis, timing attacks
7. **Platform Exploits** - OS vulnerabilities, sandbox escapes

### 1.2 Security Principles

Deyond adheres to the following core security principles:

#### **Defense in Depth**
- **Multiple security layers**: OS keychain + app encryption + biometric
- **Fail securely**: Errors should not leak sensitive data
- **Principle of least privilege**: Minimize permission scope
- **Zero trust**: Verify all inputs, even from internal components

#### **Non-Custodial Architecture**
- **User sovereignty**: Private keys never leave device
- **No server-side keys**: Backend cannot decrypt user data
- **Zero-knowledge**: Server cannot read messages or wallet data
- **Client-side encryption**: All sensitive operations on device

#### **Privacy by Design**
- **Data minimization**: Collect only necessary data
- **Anonymity options**: Allow pseudonymous usage
- **Encrypted by default**: All sensitive data encrypted at rest
- **User control**: Users can delete all data

#### **Secure Development Lifecycle**
- **Security reviews**: All crypto code manually reviewed
- **Automated scanning**: Dependency audits, SAST, DAST
- **Threat modeling**: Before implementing features
- **Incident response**: Documented plan with roles

---

## 2. Cryptography

### 2.1 Key Generation

#### **BIP39 Mnemonic Generation**

Deyond uses BIP39 for human-readable recovery phrases:

```typescript
import { generateMnemonic, mnemonicToSeed } from 'bip39';
import { wordlist } from 'bip39/src/wordlists/english';

/**
 * Generate cryptographically secure mnemonic phrase
 * @param strength - Entropy bits (128 = 12 words, 256 = 24 words)
 */
export async function generateSecureMnemonic(
  strength: 128 | 256 = 128
): Promise<string> {
  // Use platform's secure random number generator
  const entropy = await getSecureRandomBytes(strength / 8);

  // Generate BIP39 mnemonic from entropy
  const mnemonic = generateMnemonic(strength, undefined, wordlist);

  // Validate mnemonic
  if (!validateMnemonic(mnemonic)) {
    throw new SecurityError('Generated invalid mnemonic', 'KEY_GEN_FAILED');
  }

  return mnemonic;
}

/**
 * Get cryptographically secure random bytes
 * Uses native platform RNG (SecRandom on iOS, SecureRandom on Android)
 */
async function getSecureRandomBytes(length: number): Promise<Uint8Array> {
  const bytes = new Uint8Array(length);

  // React Native Crypto API
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    // Fallback to @noble/hashes randomBytes
    const { randomBytes } = await import('@noble/hashes/utils');
    return randomBytes(length);
  }

  return bytes;
}
```

**Security Requirements**:
- ✅ Entropy source MUST be platform CSPRNG (iOS SecRandom, Android SecureRandom)
- ✅ NEVER use Math.random() or weak PRNGs
- ✅ Validate mnemonic against BIP39 wordlist
- ✅ Display mnemonic only once, require user verification
- ✅ Clear mnemonic from memory after use

#### **BIP32 Hierarchical Deterministic Derivation**

```typescript
import { HDNode } from 'ethers/lib/utils';
import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha512 } from '@noble/hashes/sha512';

/**
 * Derive HD wallet from mnemonic
 * @param mnemonic - BIP39 recovery phrase
 * @param passphrase - Optional BIP39 passphrase (25th word)
 */
export async function deriveHDWallet(
  mnemonic: string,
  passphrase: string = ''
): Promise<HDNode> {
  // Convert mnemonic to seed (PBKDF2-HMAC-SHA512, 2048 iterations)
  const seed = await mnemonicToSeed(mnemonic, passphrase);

  // Create master HD node
  const masterNode = HDNode.fromSeed(seed);

  return masterNode;
}

/**
 * Derive account from master node
 * @param masterNode - BIP32 master key
 * @param path - BIP44 derivation path (e.g., m/44'/60'/0'/0/0)
 */
export function deriveAccount(
  masterNode: HDNode,
  path: string
): { address: string; privateKey: string } {
  const node = masterNode.derivePath(path);

  return {
    address: node.address,
    privateKey: node.privateKey,
  };
}
```

#### **BIP44 Multi-Coin Derivation Paths**

| Blockchain | Coin Type | Derivation Path Template |
|------------|-----------|-------------------------|
| Ethereum | 60 | m/44'/60'/0'/0/{index} |
| Bitcoin | 0 | m/44'/0'/0'/0/{index} |
| Solana | 501 | m/44'/501'/0'/0/{index} |
| BSC | 60 | m/44'/60'/0'/0/{index} |
| Polygon | 60 | m/44'/60'/0'/0/{index} |

**Security Requirements**:
- ✅ Use hardened derivation for account level (e.g., m/44'/60'/0')
- ✅ Non-hardened derivation only for address index
- ✅ NEVER expose master private key or seed
- ✅ Derive keys on-demand, don't cache in memory

### 2.2 Key Storage

#### **iOS Keychain Integration**

```typescript
import * as Keychain from 'react-native-keychain';

/**
 * Store private key in iOS Keychain with Secure Enclave protection
 */
export async function storePrivateKeyIOS(
  accountId: string,
  privateKey: string
): Promise<void> {
  await Keychain.setGenericPassword(
    accountId,
    privateKey,
    {
      service: 'com.deyond.wallet',
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
      securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
      storage: Keychain.STORAGE_TYPE.RSA, // Use RSA encryption
    }
  );
}

/**
 * Retrieve private key with biometric authentication
 */
export async function retrievePrivateKeyIOS(
  accountId: string
): Promise<string> {
  const credentials = await Keychain.getGenericPassword({
    service: 'com.deyond.wallet',
    authenticationPrompt: {
      title: 'Authenticate to access wallet',
      subtitle: 'Sign transaction',
      cancel: 'Cancel',
    },
  });

  if (!credentials) {
    throw new SecurityError('Key not found in keychain', 'KEY_NOT_FOUND');
  }

  return credentials.password;
}
```

**iOS Keychain Configuration**:
- **Accessibility**: `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`
  - Key available only when device unlocked
  - Not included in iCloud backup
  - Not migrated to new device
- **Access Control**: `kSecAccessControlBiometryAny`
  - Requires Face ID or Touch ID
  - Falls back to passcode if biometric fails
- **Secure Enclave**: Hardware-backed key storage (iPhone 5s+)
- **Application Password**: Additional layer with app-specific encryption

#### **Android Keystore Integration**

```typescript
import { NativeModules } from 'react-native';

const { RNKeystoreModule } = NativeModules;

/**
 * Store private key in Android Keystore with StrongBox protection
 */
export async function storePrivateKeyAndroid(
  alias: string,
  privateKey: string
): Promise<void> {
  // Android native module implementation
  await RNKeystoreModule.generateKey(alias, {
    algorithm: 'AES',
    keySize: 256,
    blockMode: 'GCM',
    encryptionPadding: 'NoPadding',
    userAuthenticationRequired: true,
    userAuthenticationValidityDurationSeconds: 30,
    invalidatedByBiometricEnrollment: true,
    strongBoxBacked: true, // Use StrongBox if available (Pixel 3+)
  });

  const encrypted = await RNKeystoreModule.encrypt(alias, privateKey);
  // Store encrypted data in app storage
}
```

**Android Keystore Configuration**:
- **Algorithm**: AES-256-GCM (AEAD)
- **User Authentication**: Biometric or PIN required
- **StrongBox**: Hardware security module (Android 9+)
- **Key Invalidation**: Keys invalidated if biometric changed
- **Attestation**: Verify key stored in hardware

#### **Application-Level Encryption**

In addition to OS keychain, Deyond applies app-level encryption:

```typescript
import { CryptoUtils } from '../crypto/CryptoUtils';

/**
 * Encrypt wallet vault with user password
 * Double encryption: OS Keychain + App-level
 */
export async function encryptWalletVault(
  vault: WalletVault,
  password: string
): Promise<EncryptedVault> {
  // Serialize vault
  const vaultJson = JSON.stringify(vault);

  // Encrypt with AES-256-GCM (PBKDF2 key derivation)
  const encrypted = await CryptoUtils.encrypt(vaultJson, password);

  return {
    version: '1',
    data: encrypted.ciphertext,
    iv: encrypted.iv,
    salt: encrypted.salt,
    tag: encrypted.tag,
  };
}
```

**Encryption Stack** (Defense in Depth):
```
┌─────────────────────────────────────┐
│   User Password / Biometric         │
│   (PBKDF2, 100K iterations)         │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│   App-Level Encryption              │
│   (AES-256-GCM, unique IV/salt)     │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│   OS Keychain Encryption            │
│   (iOS Keychain / Android Keystore) │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│   Hardware Security Module          │
│   (Secure Enclave / StrongBox)      │
└─────────────────────────────────────┘
```

### 2.3 Encryption Standards

#### **AES-256-GCM (Authenticated Encryption)**

```typescript
/**
 * CryptoUtils implementation using Web Crypto API
 * Provides AEAD (Authenticated Encryption with Associated Data)
 */
export class CryptoUtils {
  private static readonly PBKDF2_ITERATIONS = 100000;
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 12; // 96 bits for GCM
  private static readonly SALT_LENGTH = 32;
  private static readonly TAG_LENGTH = 16; // 128 bits authentication tag

  static async encrypt(data: string, password: string): Promise<EncryptedData> {
    // Generate random salt and IV
    const salt = this.generateRandomBytes(this.SALT_LENGTH);
    const iv = this.generateRandomBytes(this.IV_LENGTH);

    // Derive key using PBKDF2-HMAC-SHA256
    const key = await this.deriveKey(password, salt);

    // Import key for Web Crypto API
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    // Encrypt with AES-256-GCM
    const dataBytes = new TextEncoder().encode(data);
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128, // Authentication tag length in bits
      },
      cryptoKey,
      dataBytes
    );

    // Extract ciphertext and authentication tag
    const encryptedArray = new Uint8Array(encryptedBuffer);
    const ciphertext = encryptedArray.slice(0, -this.TAG_LENGTH);
    const tag = encryptedArray.slice(-this.TAG_LENGTH);

    return {
      ciphertext: this.bytesToHex(ciphertext),
      iv: this.bytesToHex(iv),
      salt: this.bytesToHex(salt),
      tag: this.bytesToHex(tag),
    };
  }
}
```

**Why AES-256-GCM?**
- ✅ **Authenticated Encryption**: Detects tampering (AEAD)
- ✅ **Performance**: Hardware-accelerated on modern CPUs (AES-NI)
- ✅ **Security**: NIST-approved, no known practical attacks
- ✅ **Parallelizable**: Fast encryption/decryption
- ✅ **No padding**: Direct encryption without CBC padding oracle risks

#### **secp256k1 Elliptic Curve (Blockchain Signing)**

```typescript
import { Wallet } from 'ethers';
import * as secp256k1 from 'secp256k1';

/**
 * Sign transaction using secp256k1 ECDSA
 * Used by Ethereum, Bitcoin, Solana, BSC, Polygon
 */
export async function signTransaction(
  privateKey: string,
  transactionHash: string
): Promise<{ r: string; s: string; v: number }> {
  const wallet = new Wallet(privateKey);

  // Sign with secp256k1 ECDSA
  const signature = await wallet.signTransaction(transactionHash);

  // Extract r, s, v components
  return {
    r: signature.r,
    s: signature.s,
    v: signature.v,
  };
}

/**
 * Verify signature (for testing)
 */
export function verifySignature(
  message: Uint8Array,
  signature: Uint8Array,
  publicKey: Uint8Array
): boolean {
  return secp256k1.ecdsaVerify(signature, message, publicKey);
}
```

**secp256k1 Security**:
- **Key Size**: 256-bit private key (128-bit security level)
- **Curve Order**: n = 2^256 - 2^32 - 977
- **No known weaknesses**: Used by Bitcoin since 2009
- **Deterministic signatures**: RFC 6979 (prevents nonce reuse)

#### **Curve25519 (Messaging Encryption)**

Deyond uses Curve25519 for Signal Protocol message encryption:

```typescript
import { X25519KeyPair } from '@noble/curves/ed25519';

/**
 * Generate X25519 key pair for Signal Protocol
 */
export function generateX25519KeyPair(): {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
} {
  const privateKey = randomBytes(32);
  const publicKey = X25519KeyPair.getPublicKey(privateKey);

  return { publicKey, privateKey };
}

/**
 * Perform X25519 Diffie-Hellman key agreement
 */
export function computeSharedSecret(
  privateKey: Uint8Array,
  publicKey: Uint8Array
): Uint8Array {
  return X25519KeyPair.getSharedSecret(privateKey, publicKey);
}
```

**Why Curve25519?**
- ✅ **Fast**: 5x faster than NIST P-256
- ✅ **Secure**: Immune to timing attacks
- ✅ **Compact**: 32-byte keys and signatures
- ✅ **Battle-tested**: Used by Signal, WhatsApp, WireGuard

### 2.4 Signal Protocol for Messaging

Deyond implements the Signal Protocol (Double Ratchet + X3DH) for end-to-end encrypted messaging.

#### **X3DH Key Exchange (Extended Triple Diffie-Hellman)**

```typescript
/**
 * X3DH: Asynchronous key agreement for first message
 * Provides forward secrecy and deniability
 */
export class X3DHKeyExchange {
  /**
   * Generate identity key pair (long-term)
   */
  static generateIdentityKey(): KeyPair {
    return generateX25519KeyPair();
  }

  /**
   * Generate signed pre-key (medium-term, rotated weekly)
   */
  static generateSignedPreKey(identityKey: KeyPair): SignedPreKey {
    const keyPair = generateX25519KeyPair();
    const signature = this.sign(identityKey.privateKey, keyPair.publicKey);

    return {
      keyId: randomInt(0, 2**32),
      keyPair,
      signature,
      timestamp: Date.now(),
    };
  }

  /**
   * Generate one-time pre-keys (single-use)
   */
  static generateOneTimePreKeys(count: number): OneTimePreKey[] {
    return Array.from({ length: count }, (_, i) => ({
      keyId: i,
      keyPair: generateX25519KeyPair(),
    }));
  }

  /**
   * Perform X3DH key agreement (sender side)
   */
  static initiatorAgreement(
    identityKeySelf: KeyPair,
    ephemeralKey: KeyPair,
    identityKeyOther: Uint8Array,
    signedPreKey: Uint8Array,
    oneTimePreKey?: Uint8Array
  ): Uint8Array {
    // DH1: Identity key agreement
    const dh1 = computeSharedSecret(identityKeySelf.privateKey, signedPreKey);

    // DH2: Ephemeral - identity key agreement
    const dh2 = computeSharedSecret(ephemeralKey.privateKey, identityKeyOther);

    // DH3: Ephemeral - signed pre-key agreement
    const dh3 = computeSharedSecret(ephemeralKey.privateKey, signedPreKey);

    // DH4 (optional): Ephemeral - one-time pre-key
    let dhData = new Uint8Array([...dh1, ...dh2, ...dh3]);
    if (oneTimePreKey) {
      const dh4 = computeSharedSecret(ephemeralKey.privateKey, oneTimePreKey);
      dhData = new Uint8Array([...dhData, ...dh4]);
    }

    // Derive shared secret with KDF
    return hkdf(dhData, 32, 'X3DH-Deyond-v1');
  }
}
```

#### **Double Ratchet Algorithm**

```typescript
/**
 * Double Ratchet: Continuous key evolution for forward secrecy
 */
export class DoubleRatchet {
  private rootKey: Uint8Array;
  private sendingChainKey: Uint8Array;
  private receivingChainKey: Uint8Array;
  private dhRatchetKeyPair: KeyPair;
  private dhRatchetPublicOther: Uint8Array;
  private sendMessageNumber: number = 0;
  private receiveMessageNumber: number = 0;

  /**
   * Initialize ratchet from X3DH shared secret
   */
  constructor(sharedSecret: Uint8Array, isInitiator: boolean) {
    this.rootKey = sharedSecret;
    this.dhRatchetKeyPair = generateX25519KeyPair();

    if (isInitiator) {
      this.sendingChainKey = this.kdfChain(this.rootKey);
    }
  }

  /**
   * Encrypt message with ratchet
   */
  async encryptMessage(plaintext: string): Promise<RatchetMessage> {
    // Derive message key from chain key
    const messageKey = this.kdfMessageKey(this.sendingChainKey);

    // Encrypt with AES-256-CBC + HMAC-SHA256
    const ciphertext = await this.encryptWithMessageKey(plaintext, messageKey);

    // Advance chain key (forward secrecy)
    this.sendingChainKey = this.kdfChain(this.sendingChainKey);
    this.sendMessageNumber++;

    return {
      dhPublicKey: this.dhRatchetKeyPair.publicKey,
      messageNumber: this.sendMessageNumber - 1,
      previousChainLength: this.receiveMessageNumber,
      ciphertext,
    };
  }

  /**
   * Decrypt message with ratchet
   */
  async decryptMessage(message: RatchetMessage): Promise<string> {
    // Check if DH ratchet step needed
    if (!this.dhRatchetPublicOther ||
        !arrayEquals(message.dhPublicKey, this.dhRatchetPublicOther)) {
      this.performDHRatchetStep(message.dhPublicKey);
    }

    // Derive message key
    const messageKey = this.kdfMessageKey(this.receivingChainKey);

    // Decrypt
    const plaintext = await this.decryptWithMessageKey(message.ciphertext, messageKey);

    // Advance chain key
    this.receivingChainKey = this.kdfChain(this.receivingChainKey);
    this.receiveMessageNumber++;

    return plaintext;
  }

  /**
   * DH Ratchet step: Generate new DH key pair and compute shared secret
   */
  private performDHRatchetStep(remotePublicKey: Uint8Array): void {
    // Compute new shared secret
    const dhOutput = computeSharedSecret(
      this.dhRatchetKeyPair.privateKey,
      remotePublicKey
    );

    // KDF ratchet on root key
    const [newRootKey, newChainKey] = this.kdfRootKey(this.rootKey, dhOutput);

    this.rootKey = newRootKey;
    this.receivingChainKey = newChainKey;
    this.dhRatchetPublicOther = remotePublicKey;

    // Generate new DH key pair
    this.dhRatchetKeyPair = generateX25519KeyPair();
    this.receiveMessageNumber = 0;
  }

  /**
   * KDF for root key (HKDF-SHA256)
   */
  private kdfRootKey(rootKey: Uint8Array, dhOutput: Uint8Array): [Uint8Array, Uint8Array] {
    const output = hkdf(dhOutput, 64, 'DoubleRatchet-Root', rootKey);
    return [output.slice(0, 32), output.slice(32, 64)];
  }

  /**
   * KDF for chain key (HMAC-SHA256)
   */
  private kdfChain(chainKey: Uint8Array): Uint8Array {
    return hmacSha256(chainKey, new Uint8Array([0x01]));
  }

  /**
   * KDF for message key (HMAC-SHA256)
   */
  private kdfMessageKey(chainKey: Uint8Array): Uint8Array {
    return hmacSha256(chainKey, new Uint8Array([0x00]));
  }
}
```

**Signal Protocol Security Properties**:
- ✅ **Forward Secrecy**: Past messages safe if keys compromised
- ✅ **Post-Compromise Security**: Future messages safe after key rotation
- ✅ **Message Deniability**: No cryptographic proof of authorship
- ✅ **Asynchronous**: No need for both parties online simultaneously

---

## 3. Authentication & Authorization

### 3.1 Wallet Signature-Based Authentication

Deyond uses Ethereum wallet signatures for passwordless authentication:

```typescript
import { Wallet } from 'ethers';

/**
 * Generate authentication challenge
 */
export function generateAuthChallenge(): AuthChallenge {
  const nonce = randomBytes(32);
  const timestamp = Date.now();
  const expiresAt = timestamp + 5 * 60 * 1000; // 5 minutes

  return {
    nonce: bytesToHex(nonce),
    timestamp,
    expiresAt,
    message: `Sign this message to authenticate with Deyond.\n\nNonce: ${bytesToHex(nonce)}\nTimestamp: ${timestamp}`,
  };
}

/**
 * Sign authentication challenge with wallet
 */
export async function signAuthChallenge(
  challenge: AuthChallenge,
  privateKey: string
): Promise<string> {
  const wallet = new Wallet(privateKey);
  const signature = await wallet.signMessage(challenge.message);
  return signature;
}

/**
 * Verify authentication signature (server-side)
 */
export function verifyAuthSignature(
  challenge: AuthChallenge,
  signature: string,
  expectedAddress: string
): boolean {
  // Check expiration
  if (Date.now() > challenge.expiresAt) {
    throw new SecurityError('Challenge expired', 'AUTH_EXPIRED');
  }

  // Recover signer address
  const recoveredAddress = ethers.utils.verifyMessage(
    challenge.message,
    signature
  );

  // Compare addresses (case-insensitive)
  return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
}
```

**Authentication Flow**:
```
1. Client → Server: Request challenge
2. Server → Client: { nonce, timestamp, message }
3. Client: Sign message with wallet private key
4. Client → Server: { signature, address }
5. Server: Verify signature, recover address, issue JWT
6. Server → Client: { accessToken, refreshToken }
```

### 3.2 JWT + Refresh Tokens

```typescript
import jwt from 'jsonwebtoken';

/**
 * Issue JWT access token (short-lived)
 */
export function issueAccessToken(
  userId: string,
  walletAddress: string
): string {
  return jwt.sign(
    {
      sub: userId,
      wallet: walletAddress,
      type: 'access',
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: '15m', // 15 minutes
      issuer: 'deyond-api',
      audience: 'deyond-mobile',
    }
  );
}

/**
 * Issue refresh token (long-lived, stored securely)
 */
export function issueRefreshToken(
  userId: string,
  deviceId: string
): string {
  const tokenId = randomUUID();

  return jwt.sign(
    {
      sub: userId,
      jti: tokenId, // Token ID for revocation
      device: deviceId,
      type: 'refresh',
    },
    process.env.REFRESH_TOKEN_SECRET!,
    {
      expiresIn: '30d', // 30 days
      issuer: 'deyond-api',
      audience: 'deyond-mobile',
    }
  );
}

/**
 * Rotate refresh token (invalidate old, issue new)
 */
export async function rotateRefreshToken(
  oldToken: string
): Promise<{ accessToken: string; refreshToken: string }> {
  // Verify old token
  const payload = jwt.verify(oldToken, process.env.REFRESH_TOKEN_SECRET!);

  // Check if token already used (detect replay attacks)
  if (await isTokenRevoked(payload.jti)) {
    // Token reuse detected → revoke entire device session
    await revokeAllDeviceTokens(payload.device);
    throw new SecurityError('Token reuse detected', 'TOKEN_REPLAY');
  }

  // Revoke old token
  await revokeToken(payload.jti);

  // Issue new tokens
  const accessToken = issueAccessToken(payload.sub, payload.wallet);
  const refreshToken = issueRefreshToken(payload.sub, payload.device);

  return { accessToken, refreshToken };
}
```

**Token Storage**:
- **Access Token**: Memory only (not persisted)
- **Refresh Token**: iOS Keychain / Android Keystore
- **Token Rotation**: On every refresh (detect stolen tokens)

### 3.3 Biometric Authentication

```typescript
import ReactNativeBiometrics from 'react-native-biometrics';

/**
 * Check biometric support
 */
export async function checkBiometricSupport(): Promise<BiometricType> {
  const rnBiometrics = new ReactNativeBiometrics();
  const { available, biometryType } = await rnBiometrics.isSensorAvailable();

  if (!available) {
    return BiometricType.None;
  }

  return biometryType === 'FaceID' ? BiometricType.FaceID :
         biometryType === 'TouchID' ? BiometricType.TouchID :
         biometryType === 'Biometrics' ? BiometricType.Fingerprint :
         BiometricType.None;
}

/**
 * Authenticate with biometrics
 */
export async function authenticateBiometric(
  reason: string = 'Authenticate to access wallet'
): Promise<boolean> {
  const rnBiometrics = new ReactNativeBiometrics({
    allowDeviceCredentials: true, // Fallback to PIN/pattern
  });

  try {
    const { success } = await rnBiometrics.simplePrompt({
      promptMessage: reason,
      cancelButtonText: 'Cancel',
    });

    return success;
  } catch (error) {
    console.error('Biometric authentication failed:', error);
    return false;
  }
}

/**
 * Authenticate before sensitive operation (transaction signing)
 */
export async function requireAuthentication(): Promise<void> {
  const settings = await getSecuritySettings();

  // Check if auth required
  if (!settings.requireAuth) {
    return;
  }

  // Check if recent auth still valid (within 30 seconds)
  if (isRecentlyAuthenticated()) {
    return;
  }

  // Perform biometric auth
  const success = await authenticateBiometric('Confirm transaction');

  if (!success) {
    throw new SecurityError('Authentication failed', 'AUTH_REQUIRED');
  }

  // Mark as recently authenticated
  setRecentlyAuthenticated();
}
```

**Biometric Configuration**:
- **iOS**: Face ID / Touch ID
- **Android**: Fingerprint / Face Unlock
- **Fallback**: Device PIN/pattern
- **Auth Validity**: 30 seconds after successful auth
- **Required For**:
  - App unlock (optional, user setting)
  - Transaction signing > $100 (mandatory)
  - Private key export (mandatory)
  - Account deletion (mandatory)

### 3.4 Session Management

```typescript
/**
 * Session manager with timeout and invalidation
 */
export class SessionManager {
  private sessionTimeout = 15 * 60 * 1000; // 15 minutes
  private lastActivity: number = Date.now();
  private sessionTimer?: NodeJS.Timeout;

  /**
   * Start session with auto-lock timer
   */
  startSession(): void {
    this.lastActivity = Date.now();
    this.resetTimer();
  }

  /**
   * Update last activity time
   */
  updateActivity(): void {
    this.lastActivity = Date.now();
    this.resetTimer();
  }

  /**
   * Check if session expired
   */
  isSessionExpired(): boolean {
    return Date.now() - this.lastActivity > this.sessionTimeout;
  }

  /**
   * Reset inactivity timer
   */
  private resetTimer(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }

    this.sessionTimer = setTimeout(() => {
      this.lockApp();
    }, this.sessionTimeout);
  }

  /**
   * Lock app (require re-authentication)
   */
  private lockApp(): void {
    // Navigate to lock screen
    navigationService.navigate('LockScreen');

    // Clear sensitive data from memory
    this.clearSensitiveData();
  }

  /**
   * Clear sensitive data when app locked/backgrounded
   */
  private clearSensitiveData(): void {
    // Clear Redux sensitive state
    store.dispatch(clearSensitiveData());

    // Clear clipboard if contains sensitive data
    Clipboard.setString('');

    // Invalidate cached keys
    keyCache.clear();
  }
}
```

---

## 4. Data Protection

### 4.1 Encryption at Rest

#### **Local Database Encryption (SQLCipher)**

```typescript
import SQLite from 'react-native-sqlite-storage';

/**
 * Open encrypted SQLite database
 */
export async function openEncryptedDatabase(
  password: string
): Promise<SQLite.Database> {
  const db = await SQLite.openDatabase({
    name: 'deyond.db',
    location: 'default',
    // Key derived from user password
    key: await deriveDBKey(password),
    algorithm: 'aes-256-cbc',
  });

  // Enable secure deletion (overwrite deleted data)
  await db.executeSql('PRAGMA secure_delete = ON');

  // Enable Write-Ahead Logging (better performance)
  await db.executeSql('PRAGMA journal_mode = WAL');

  return db;
}

/**
 * Derive database encryption key from user password
 */
async function deriveDBKey(password: string): Promise<string> {
  const salt = await getOrCreateDBSalt();
  const key = await CryptoUtils.deriveKey(password, salt);
  return CryptoUtils.bytesToHex(key);
}
```

**Encrypted Tables**:
- `messages`: Message content, attachments
- `contacts`: Contact information, notes
- `transactions`: Transaction history
- `accounts`: Account metadata (addresses, balances)
- `settings`: User preferences

#### **Message Storage Encryption**

```typescript
/**
 * Store encrypted message in database
 */
export async function storeMessage(
  message: Message,
  sessionKey: Uint8Array
): Promise<void> {
  // Encrypt message content with session key
  const encryptedContent = await encryptMessageContent(
    message.content,
    sessionKey
  );

  // Store in SQLCipher database
  await db.executeSql(
    `INSERT INTO messages (id, chatId, senderId, content, timestamp, iv, tag)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      message.id,
      message.chatId,
      message.senderId,
      encryptedContent.ciphertext,
      message.timestamp,
      encryptedContent.iv,
      encryptedContent.tag,
    ]
  );
}

/**
 * Retrieve and decrypt message
 */
export async function retrieveMessage(
  messageId: string,
  sessionKey: Uint8Array
): Promise<Message> {
  const [row] = await db.executeSql(
    'SELECT * FROM messages WHERE id = ?',
    [messageId]
  );

  // Decrypt message content
  const content = await decryptMessageContent(
    {
      ciphertext: row.content,
      iv: row.iv,
      tag: row.tag,
    },
    sessionKey
  );

  return {
    id: row.id,
    chatId: row.chatId,
    senderId: row.senderId,
    content,
    timestamp: row.timestamp,
  };
}
```

### 4.2 Encryption in Transit

#### **TLS 1.3 Configuration**

```typescript
/**
 * API client with TLS 1.3 and certificate pinning
 */
export const apiClient = axios.create({
  baseURL: 'https://api.deyond.io',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  // Certificate pinning (React Native)
  httpsAgent: new https.Agent({
    rejectUnauthorized: true,
    minVersion: 'TLSv1.3', // Force TLS 1.3
    // Pin server certificate (SHA-256 hash of public key)
    checkServerIdentity: (host, cert) => {
      const expectedFingerprint = process.env.API_CERT_FINGERPRINT;
      const actualFingerprint = getCertificateFingerprint(cert);

      if (actualFingerprint !== expectedFingerprint) {
        throw new SecurityError(
          'Certificate pinning failed',
          'CERT_PIN_MISMATCH'
        );
      }
    },
  }),
});
```

**TLS Requirements**:
- ✅ TLS 1.3 minimum (disable TLS 1.2, 1.1, 1.0)
- ✅ Perfect Forward Secrecy (ECDHE key exchange)
- ✅ Strong cipher suites only:
  - TLS_AES_256_GCM_SHA384
  - TLS_CHACHA20_POLY1305_SHA256
  - TLS_AES_128_GCM_SHA256
- ✅ Certificate pinning (prevent MITM)
- ✅ HSTS (HTTP Strict Transport Security)
- ✅ Certificate transparency

#### **SRTP (Secure Real-time Transport Protocol) for Voice**

```typescript
import { RTCPeerConnection } from 'react-native-webrtc';

/**
 * Configure WebRTC with SRTP encryption
 */
export function createSecurePeerConnection(): RTCPeerConnection {
  return new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.deyond.io:3478' },
      {
        urls: 'turn:turn.deyond.io:3478',
        username: 'deyond-turn',
        credential: getTurnCredential(),
      },
    ],
    // Force SRTP (reject non-encrypted media)
    sdpSemantics: 'unified-plan',
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    // Encryption settings
    certificates: undefined, // Auto-generate DTLS certificate
  });
}

/**
 * Verify SRTP encryption active
 */
export async function verifyEncryption(
  connection: RTCPeerConnection
): Promise<boolean> {
  const stats = await connection.getStats();

  for (const [, report] of stats) {
    if (report.type === 'transport') {
      // Check DTLS state (required for SRTP)
      if (report.dtlsState !== 'connected') {
        return false;
      }

      // Check selected cipher suite
      const cipherSuite = report.selectedCandidatePairChanges;
      console.log('SRTP cipher:', cipherSuite);
    }
  }

  return true;
}
```

**SRTP Configuration**:
- **Key Derivation**: DTLS-SRTP (DTLS 1.2 for key exchange)
- **Cipher**: AES-128-GCM or AES-256-GCM
- **Authentication**: HMAC-SHA1 or HMAC-SHA256
- **Perfect Forward Secrecy**: New keys per call

### 4.3 Zero-Knowledge Cloud Backup

```typescript
/**
 * Backup wallet to cloud with zero-knowledge encryption
 * Provider cannot decrypt backup (user has sole decryption key)
 */
export async function backupToCloud(
  wallet: WalletVault,
  backupPassword: string
): Promise<void> {
  // Derive backup encryption key from user password
  // (NOT stored on device or server)
  const backupSalt = randomBytes(32);
  const backupKey = await CryptoUtils.deriveKey(backupPassword, backupSalt);

  // Serialize wallet data
  const walletData = JSON.stringify({
    version: '1.0',
    accounts: wallet.accounts,
    settings: wallet.settings,
    contacts: wallet.contacts,
    // Messages NOT included (too large, privacy concern)
  });

  // Encrypt with AES-256-GCM
  const encrypted = await CryptoUtils.encrypt(walletData, backupPassword);

  // Upload to cloud (Google Drive / iCloud)
  await uploadToCloudProvider({
    filename: `deyond-backup-${Date.now()}.enc`,
    data: encrypted,
    metadata: {
      version: '1.0',
      timestamp: Date.now(),
      deviceId: await getDeviceId(),
      // Salt needed for decryption
      salt: CryptoUtils.bytesToHex(backupSalt),
    },
  });
}

/**
 * Restore wallet from cloud backup
 */
export async function restoreFromCloud(
  backupFile: CloudFile,
  backupPassword: string
): Promise<WalletVault> {
  // Download encrypted backup
  const encrypted = await downloadFromCloudProvider(backupFile);

  // Decrypt with user password
  const decrypted = await CryptoUtils.decrypt(
    encrypted,
    backupPassword
  );

  // Parse wallet data
  const walletData = JSON.parse(decrypted);

  // Validate backup version
  if (walletData.version !== '1.0') {
    throw new Error('Unsupported backup version');
  }

  return walletData as WalletVault;
}
```

**Backup Security Properties**:
- ✅ **Zero-knowledge**: Cloud provider cannot decrypt
- ✅ **User-controlled**: Only backup password can decrypt
- ✅ **Forward secrecy**: New salt per backup
- ✅ **Integrity**: AEAD tag verifies no tampering
- ✅ **Privacy**: No metadata leakage

### 4.4 Data Minimization

Deyond collects and stores only essential data:

| Data Type | Collected | Stored Locally | Stored Server | Encrypted | Reason |
|-----------|-----------|----------------|---------------|-----------|---------|
| Private Keys | ✅ | ✅ | ❌ | ✅ | Required for signing |
| Mnemonic Phrase | ✅ | ✅ | ❌ | ✅ | Required for recovery |
| Transaction History | ✅ | ✅ | ❌ | ✅ | Required for UI |
| Messages | ✅ | ✅ | ❌ (relay only) | ✅ | Required for chat |
| Contacts | ✅ | ✅ | ❌ | ✅ | Required for UX |
| Profile Info | ✅ | ✅ | ✅ (encrypted) | ✅ | Required for discovery |
| GPS Location | ❌ (opt-in) | ❌ | ❌ | ✅ | Optional feed flags |
| Phone Number | ❌ (opt-in) | ✅ | ✅ | ✅ | Optional calling |
| Email | ❌ | ❌ | ❌ | - | Not collected |
| Analytics | ❌ (opt-in) | ❌ | ✅ | ❌ | Optional telemetry |

**Data Retention**:
- **Messages**: 90 days local storage (user configurable)
- **Transaction History**: Unlimited (blockchain public record)
- **Contacts**: Until user deletes
- **Profile**: Until account deletion
- **Logs**: 30 days server-side (anonymized)

---

## 5. Network Security

### 5.1 Certificate Pinning

```typescript
import { NativeModules } from 'react-native';

/**
 * Certificate pinning configuration
 * Prevents MITM attacks by validating server certificate
 */
export const certificatePins = {
  'api.deyond.io': [
    // SHA-256 hash of server public key
    'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    // Backup certificate (for rotation)
    'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
  ],
  'turn.deyond.io': [
    'sha256/CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC=',
  ],
};

/**
 * Initialize certificate pinning (iOS/Android native)
 */
export function initCertificatePinning(): void {
  const { SSLPinningModule } = NativeModules;

  SSLPinningModule.setCertificatePins(certificatePins);
}

/**
 * Verify certificate pinning on request
 */
export async function fetchWithPinning(
  url: string,
  options: RequestInit
): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...options,
      // Native pinning validates certificate
    });

    return response;
  } catch (error) {
    // Certificate pinning failed
    if (error.message.includes('certificate')) {
      throw new SecurityError(
        'Certificate validation failed - possible MITM attack',
        'CERT_PIN_FAILED'
      );
    }
    throw error;
  }
}
```

**Certificate Rotation Strategy**:
1. Pin 2 certificates (current + backup)
2. Rotate certificates every 90 days
3. Update pins via app update (before rotation)
4. Monitor pinning failures (alert on spikes)

### 5.2 API Security

#### **Rate Limiting (Client-Side)**

```typescript
/**
 * Rate limiter to prevent abuse
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  /**
   * Check if request allowed under rate limit
   */
  isAllowed(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove old requests outside window
    const recentRequests = requests.filter(
      timestamp => now - timestamp < windowMs
    );

    // Check if limit exceeded
    if (recentRequests.length >= limit) {
      return false;
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(key, recentRequests);

    return true;
  }
}

// Rate limits per endpoint
const rateLimiter = new RateLimiter();

export async function sendMessage(message: Message): Promise<void> {
  // Max 10 messages per minute
  if (!rateLimiter.isAllowed('sendMessage', 10, 60 * 1000)) {
    throw new Error('Rate limit exceeded: too many messages');
  }

  await apiClient.post('/messages', message);
}

export async function createTransaction(tx: Transaction): Promise<void> {
  // Max 5 transactions per minute
  if (!rateLimiter.isAllowed('createTransaction', 5, 60 * 1000)) {
    throw new Error('Rate limit exceeded: too many transactions');
  }

  await apiClient.post('/transactions', tx);
}
```

#### **Input Validation**

```typescript
import { z } from 'zod';

/**
 * Validate API inputs with Zod schemas
 */
const SendMessageSchema = z.object({
  chatId: z.string().uuid(),
  content: z.string().min(1).max(10000),
  attachments: z.array(z.object({
    type: z.enum(['image', 'video', 'file']),
    url: z.string().url(),
    size: z.number().max(100 * 1024 * 1024), // 100MB max
  })).max(10),
});

export async function sendMessage(data: unknown): Promise<void> {
  // Validate input
  const result = SendMessageSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Invalid message data', result.error);
  }

  const message = result.data;

  // Additional validation: sanitize content
  message.content = sanitizeHtml(message.content);

  await apiClient.post('/messages', message);
}

/**
 * Address validation
 */
export function validateEthereumAddress(address: string): boolean {
  // Check format (0x + 40 hex chars)
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return false;
  }

  // Verify checksum (EIP-55)
  return isChecksummedAddress(address);
}

function isChecksummedAddress(address: string): boolean {
  const addr = address.slice(2); // Remove 0x
  const hash = keccak256(addr.toLowerCase());

  for (let i = 0; i < addr.length; i++) {
    const charCode = addr.charCodeAt(i);
    // Skip numbers
    if (charCode >= 48 && charCode <= 57) continue;

    const hashByte = parseInt(hash[i], 16);
    const expected = hashByte >= 8 ? addr[i].toUpperCase() : addr[i].toLowerCase();

    if (addr[i] !== expected) {
      return false;
    }
  }

  return true;
}
```

### 5.3 WebSocket Security

```typescript
import WebSocket from 'react-native-websocket';

/**
 * Secure WebSocket connection with authentication
 */
export class SecureWebSocket {
  private ws: WebSocket | null = null;
  private reconnectTimer?: NodeJS.Timeout;
  private messageQueue: any[] = [];

  /**
   * Connect with JWT authentication
   */
  async connect(accessToken: string): Promise<void> {
    const wsUrl = `wss://ws.deyond.io?token=${accessToken}`;

    this.ws = new WebSocket(wsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      // TLS configuration
      rejectUnauthorized: true,
      // Certificate pinning
      ca: await getCertificateAuthority(),
    });

    this.ws.on('open', this.onOpen.bind(this));
    this.ws.on('message', this.onMessage.bind(this));
    this.ws.on('error', this.onError.bind(this));
    this.ws.on('close', this.onClose.bind(this));
  }

  /**
   * Send encrypted message over WebSocket
   */
  async send(type: string, payload: any): Promise<void> {
    const message = {
      type,
      payload,
      timestamp: Date.now(),
      nonce: randomBytes(16),
    };

    // Encrypt message payload
    const encrypted = await this.encryptMessage(message);

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(encrypted));
    } else {
      // Queue for later
      this.messageQueue.push(encrypted);
    }
  }

  /**
   * Handle incoming encrypted message
   */
  private async onMessage(event: MessageEvent): Promise<void> {
    try {
      const encrypted = JSON.parse(event.data);

      // Decrypt message
      const message = await this.decryptMessage(encrypted);

      // Validate message format
      this.validateMessage(message);

      // Dispatch to handlers
      this.handleMessage(message);
    } catch (error) {
      console.error('Failed to process WebSocket message:', error);
    }
  }

  /**
   * Reconnect with exponential backoff
   */
  private reconnect(): void {
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    this.reconnectTimer = setTimeout(() => {
      this.connect(this.accessToken);
    }, delay);
  }
}
```

**WebSocket Security**:
- ✅ WSS (TLS encryption) only
- ✅ JWT authentication in connection
- ✅ Certificate pinning
- ✅ Message-level encryption (additional layer)
- ✅ Heartbeat/ping-pong (detect disconnects)
- ✅ Exponential backoff reconnection

### 5.4 P2P Security (BLE & WebRTC)

#### **BLE Security**

```typescript
import { BleManager } from 'react-native-ble-plx';

/**
 * Secure BLE proximity discovery
 */
export class SecureBLEManager {
  private manager: BleManager;
  private encryptionKey: Uint8Array;

  /**
   * Start advertising with encrypted identity
   */
  async startAdvertising(): Promise<void> {
    // Generate ephemeral key pair
    const ephemeralKey = generateX25519KeyPair();

    // Encrypt user ID with ephemeral key
    const encryptedId = await this.encryptIdentity(
      await getUserId(),
      ephemeralKey.publicKey
    );

    // Advertise BLE service
    await this.manager.startAdvertising({
      serviceUUIDs: ['DEYOND-PROXIMITY-SERVICE'],
      manufacturerData: {
        companyId: 0xFFFF,
        data: encryptedId,
      },
      txPowerLevel: -16, // Reduce range for privacy
    });
  }

  /**
   * Scan for nearby devices
   */
  async scanForDevices(
    callback: (device: BLEDevice) => void
  ): Promise<void> {
    this.manager.startDeviceScan(
      ['DEYOND-PROXIMITY-SERVICE'],
      { allowDuplicates: false },
      async (error, device) => {
        if (error) {
          console.error('BLE scan error:', error);
          return;
        }

        if (device) {
          // Decrypt device identity
          const decryptedId = await this.decryptIdentity(
            device.manufacturerData
          );

          callback({
            id: decryptedId,
            name: device.name,
            rssi: device.rssi,
            distance: this.estimateDistance(device.rssi),
          });
        }
      }
    );
  }

  /**
   * Establish encrypted connection
   */
  async connectToDevice(deviceId: string): Promise<void> {
    const device = await this.manager.connectToDevice(deviceId);

    // Perform ECDH key exchange
    const sharedSecret = await this.performKeyExchange(device);

    // Derive session key
    this.encryptionKey = hkdf(sharedSecret, 32, 'BLE-Session');
  }

  /**
   * Send encrypted message over BLE
   */
  async sendMessage(message: string): Promise<void> {
    const encrypted = await CryptoUtils.encrypt(message, this.encryptionKey);

    // Split into BLE characteristic chunks (20 bytes)
    const chunks = this.splitIntoChunks(encrypted, 20);

    for (const chunk of chunks) {
      await this.writeCharacteristic(chunk);
    }
  }
}
```

**BLE Security Measures**:
- ✅ Encrypted identity in advertising data
- ✅ ECDH key exchange for session keys
- ✅ Message encryption (AES-256-GCM)
- ✅ Ephemeral keys (new per session)
- ✅ Distance estimation (RSSI-based)
- ✅ Reduced TX power (privacy)

#### **WebRTC Security**

Covered in SRTP section above. Additional considerations:

- ✅ ICE candidate filtering (prevent IP leaks)
- ✅ TURN authentication (prevent relay abuse)
- ✅ Media encryption (SRTP/DTLS)
- ✅ Perfect Forward Secrecy (new keys per call)

---

## 6. Application Security

### 6.1 Code Obfuscation

```javascript
// metro.config.js - Production build configuration
module.exports = {
  transformer: {
    minifierConfig: {
      keep_classnames: false,
      keep_fnames: false,
      mangle: {
        toplevel: true,
        properties: {
          regex: /^_/, // Mangle properties starting with _
        },
      },
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        dead_code: true,
        conditionals: true,
        evaluate: true,
        sequences: true,
        inline: true,
      },
      output: {
        comments: false,
        beautify: false,
      },
    },
  },
};
```

**Android ProGuard Configuration**:

```proguard
# android/app/proguard-rules.pro
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable

# Obfuscate sensitive classes
-keep class com.deyond.crypto.** { *; }
-keep class com.deyond.wallet.** { *; }

# Remove logging
-assumenosideeffects class android.util.Log {
  public static *** d(...);
  public static *** v(...);
  public static *** i(...);
}

# Encrypt strings
-adaptclassstrings
-obfuscationdictionary obfuscation-dict.txt
```

### 6.2 Jailbreak/Root Detection

```typescript
import JailMonkey from 'jail-monkey';
import { NativeModules } from 'react-native';

/**
 * Detect if device is jailbroken/rooted
 */
export async function detectDeviceCompromise(): Promise<CompromiseStatus> {
  const checks = {
    isJailBroken: JailMonkey.isJailBroken(),
    canMockLocation: await JailMonkey.canMockLocation(),
    trustFallback: JailMonkey.trustFall(),
    isDebuggedMode: await isDebuggerAttached(),
    hookDetected: await detectFridaHooks(),
    isEmulator: await detectEmulator(),
  };

  const compromised = Object.values(checks).some(v => v === true);

  return {
    isCompromised: compromised,
    checks,
    severity: calculateSeverity(checks),
  };
}

/**
 * Check for debugger attachment
 */
async function isDebuggerAttached(): Promise<boolean> {
  // iOS: Check for debugger
  if (Platform.OS === 'ios') {
    const { DebuggerDetection } = NativeModules;
    return await DebuggerDetection.isAttached();
  }

  // Android: Check for debuggable flag
  if (Platform.OS === 'android') {
    return NativeModules.ApplicationInfo.isDebuggable();
  }

  return false;
}

/**
 * Detect Frida hooks (dynamic instrumentation)
 */
async function detectFridaHooks(): Promise<boolean> {
  try {
    // Check for Frida server
    const response = await fetch('http://localhost:27042/');
    return response.ok; // Frida detected
  } catch {
    return false; // Frida not detected
  }
}

/**
 * Handle compromised device
 */
export async function handleCompromisedDevice(
  status: CompromiseStatus
): Promise<void> {
  if (!status.isCompromised) {
    return;
  }

  // Log security event
  await logSecurityEvent('device_compromise_detected', status.checks);

  // Warn user
  Alert.alert(
    'Security Warning',
    'This device may be compromised. Sensitive features will be disabled for your protection.',
    [
      {
        text: 'Continue Anyway',
        style: 'destructive',
        onPress: () => {
          // Allow usage but disable sensitive features
          store.dispatch(setSecurityMode('restricted'));
        },
      },
      {
        text: 'Exit',
        onPress: () => {
          // Exit app
          BackHandler.exitApp();
        },
      },
    ]
  );
}
```

**Restricted Mode Actions**:
- ❌ Disable private key export
- ❌ Disable transaction signing
- ❌ Disable message decryption
- ✅ Allow read-only access to wallet
- ✅ Allow viewing transaction history

### 6.3 Screen Capture Protection

```typescript
import { NativeModules, Platform } from 'react-native';

/**
 * Disable screenshots on sensitive screens
 */
export function disableScreenCapture(): void {
  if (Platform.OS === 'android') {
    NativeModules.PreventScreenshotModule.forbid();
  } else if (Platform.OS === 'ios') {
    // iOS: Use react-native-privacy-snapshot
    NativeModules.PrivacySnapshot.enabled(true);
  }
}

/**
 * Enable screenshots (default)
 */
export function enableScreenCapture(): void {
  if (Platform.OS === 'android') {
    NativeModules.PreventScreenshotModule.allow();
  } else if (Platform.OS === 'ios') {
    NativeModules.PrivacySnapshot.enabled(false);
  }
}

/**
 * Hook to disable screenshots on screen
 */
export function useScreenCaptureProtection() {
  useEffect(() => {
    disableScreenCapture();

    return () => {
      enableScreenCapture();
    };
  }, []);
}

// Usage in sensitive screens
export function RecoveryPhraseScreen() {
  useScreenCaptureProtection();

  return (
    <View>
      <Text>Your recovery phrase:</Text>
      <Text>{mnemonic}</Text>
    </View>
  );
}
```

**Protected Screens**:
- Recovery phrase display
- Private key export
- PIN entry
- Transaction confirmation
- Biometric authentication prompts

### 6.4 Clipboard Security

```typescript
import Clipboard from '@react-native-clipboard/clipboard';

/**
 * Clipboard manager with auto-clear
 */
export class SecureClipboard {
  private clearTimer?: NodeJS.Timeout;
  private static readonly CLEAR_DELAY = 30000; // 30 seconds

  /**
   * Copy sensitive data with auto-clear
   */
  static copySensitive(text: string): void {
    // Copy to clipboard
    Clipboard.setString(text);

    // Show warning
    Toast.show({
      type: 'warning',
      text1: 'Copied to clipboard',
      text2: 'Will be cleared in 30 seconds',
      position: 'bottom',
    });

    // Schedule auto-clear
    if (this.clearTimer) {
      clearTimeout(this.clearTimer);
    }

    this.clearTimer = setTimeout(() => {
      this.clear();
    }, this.CLEAR_DELAY);
  }

  /**
   * Clear clipboard
   */
  static clear(): void {
    Clipboard.setString('');
  }

  /**
   * Get clipboard content with validation
   */
  static async getValidatedAddress(): Promise<string | null> {
    const content = await Clipboard.getString();

    // Validate Ethereum address
    if (validateEthereumAddress(content)) {
      return content;
    }

    // Validate Solana address
    if (validateSolanaAddress(content)) {
      return content;
    }

    return null;
  }
}

// Usage
export function CopyPrivateKeyButton({ privateKey }: Props) {
  return (
    <Button
      title="Copy Private Key"
      onPress={() => {
        SecureClipboard.copySensitive(privateKey);
      }}
    />
  );
}
```

### 6.5 Memory Protection

```typescript
/**
 * Secure string that clears itself from memory
 */
export class SecureString {
  private data: Uint8Array;

  constructor(value: string) {
    this.data = new TextEncoder().encode(value);
  }

  /**
   * Get string value (use immediately and don't store)
   */
  getValue(): string {
    return new TextDecoder().decode(this.data);
  }

  /**
   * Clear from memory
   */
  clear(): void {
    // Overwrite with zeros
    this.data.fill(0);
  }

  /**
   * Auto-clear when garbage collected
   */
  [Symbol.dispose](): void {
    this.clear();
  }
}

// Usage with automatic cleanup
export async function signTransactionSecure(
  privateKey: SecureString,
  transaction: Transaction
): Promise<string> {
  try {
    // Use private key
    const signature = await signWithPrivateKey(
      privateKey.getValue(),
      transaction
    );

    return signature;
  } finally {
    // Always clear private key from memory
    privateKey.clear();
  }
}
```

**Memory Security Practices**:
- ✅ Clear sensitive data after use
- ✅ Avoid string concatenation (creates copies)
- ✅ Use Uint8Array for binary data
- ✅ Overwrite with zeros before deallocation
- ✅ Minimize lifetime of sensitive data in memory
- ✅ Use native secure memory (when available)

---

## 7. Blockchain Security

### 7.1 Transaction Simulation

```typescript
import { ethers } from 'ethers';

/**
 * Simulate transaction before signing
 * Detects malicious contracts, gas griefing, etc.
 */
export async function simulateTransaction(
  transaction: Transaction
): Promise<SimulationResult> {
  const provider = new ethers.providers.JsonRpcProvider(getRpcUrl());

  try {
    // Call eth_call to simulate execution
    const result = await provider.call({
      to: transaction.to,
      from: transaction.from,
      data: transaction.data,
      value: transaction.value,
      gasLimit: transaction.gasLimit,
    });

    // Analyze result
    const analysis = await analyzeSimulation(result, transaction);

    return {
      success: true,
      gasUsed: analysis.gasUsed,
      returnValue: result,
      warnings: analysis.warnings,
      risks: analysis.risks,
    };
  } catch (error: any) {
    // Transaction would revert
    return {
      success: false,
      error: error.message,
      risks: [
        {
          severity: 'high',
          type: 'transaction_revert',
          description: 'Transaction would fail',
        },
      ],
    };
  }
}

/**
 * Analyze simulation result for risks
 */
async function analyzeSimulation(
  result: string,
  transaction: Transaction
): Promise<SimulationAnalysis> {
  const warnings: string[] = [];
  const risks: Risk[] = [];

  // Check for unlimited approvals
  if (transaction.data.startsWith('0x095ea7b3')) { // approve()
    const amount = ethers.BigNumber.from('0x' + transaction.data.slice(74));
    if (amount.eq(ethers.constants.MaxUint256)) {
      risks.push({
        severity: 'high',
        type: 'unlimited_approval',
        description: 'Approving unlimited token spend',
      });
    }
  }

  // Check for value transfer to contract
  if (transaction.value && transaction.value.gt(0)) {
    const code = await provider.getCode(transaction.to);
    if (code !== '0x') {
      warnings.push('Sending ETH to contract');
    }
  }

  // Check gas usage
  const gasUsed = await provider.estimateGas(transaction);
  if (gasUsed.gt(ethers.BigNumber.from(1000000))) {
    risks.push({
      severity: 'medium',
      type: 'high_gas',
      description: 'Transaction requires unusually high gas',
    });
  }

  return { warnings, risks, gasUsed };
}
```

**Transaction Simulation UI**:
```tsx
export function TransactionConfirmModal({ transaction }: Props) {
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);

  useEffect(() => {
    simulateTransaction(transaction).then(setSimulation);
  }, [transaction]);

  if (simulation?.risks.some(r => r.severity === 'high')) {
    return (
      <View>
        <Text style={{ color: 'red' }}>⚠️ High Risk Transaction</Text>
        {simulation.risks.map(risk => (
          <Text key={risk.type}>{risk.description}</Text>
        ))}
        <Button title="Cancel" onPress={onCancel} />
        <Button title="Sign Anyway" onPress={onConfirm} />
      </View>
    );
  }

  return <StandardConfirmModal />;
}
```

### 7.2 Phishing Detection

```typescript
/**
 * Phishing detection for dApp connections
 */
export class PhishingDetector {
  private blacklist: Set<string> = new Set();
  private whitelist: Set<string> = new Set();

  /**
   * Load phishing database
   */
  async initialize(): Promise<void> {
    // Load from MetaMask's eth-phishing-detect
    const response = await fetch(
      'https://github.com/MetaMask/eth-phishing-detect/raw/master/src/config.json'
    );
    const data = await response.json();

    this.blacklist = new Set(data.blacklist);
    this.whitelist = new Set(data.whitelist);
  }

  /**
   * Check if domain is phishing site
   */
  async checkDomain(url: string): Promise<PhishingResult> {
    const domain = this.extractDomain(url);

    // Check whitelist first
    if (this.whitelist.has(domain)) {
      return { safe: true, reason: 'whitelisted' };
    }

    // Check blacklist
    if (this.blacklist.has(domain)) {
      return {
        safe: false,
        reason: 'blacklisted',
        severity: 'critical',
      };
    }

    // Check for lookalike domains
    const lookalike = await this.detectLookalike(domain);
    if (lookalike) {
      return {
        safe: false,
        reason: 'lookalike',
        target: lookalike,
        severity: 'high',
      };
    }

    // Check domain age and WHOIS
    const suspiciousAge = await this.checkDomainAge(domain);
    if (suspiciousAge) {
      return {
        safe: false,
        reason: 'new_domain',
        severity: 'medium',
      };
    }

    return { safe: true };
  }

  /**
   * Detect lookalike domains (homograph attacks)
   */
  private async detectLookalike(domain: string): Promise<string | null> {
    const popularDomains = [
      'uniswap.org',
      'opensea.io',
      'metamask.io',
      'etherscan.io',
    ];

    for (const popular of popularDomains) {
      // Levenshtein distance
      const distance = this.levenshteinDistance(domain, popular);
      if (distance <= 2) {
        return popular;
      }

      // Homograph detection (unicode lookalikes)
      if (this.hasHomographs(domain, popular)) {
        return popular;
      }
    }

    return null;
  }

  /**
   * Detect unicode homograph characters
   */
  private hasHomographs(domain1: string, domain2: string): boolean {
    // Map of lookalike characters
    const homographs: Record<string, string[]> = {
      'a': ['а', 'ɑ', 'α'],
      'e': ['е', 'ε'],
      'o': ['о', 'ο', '0'],
      'i': ['і', 'ι', '1', 'l'],
      // ... more mappings
    };

    // Check if domain1 uses homographs to mimic domain2
    // Implementation details...
    return false;
  }
}
```

**Phishing Warning UI**:
```tsx
export function PhishingWarning({ domain, result }: Props) {
  return (
    <Modal visible={!result.safe}>
      <View style={styles.warning}>
        <Icon name="warning" size={64} color="red" />
        <Text style={styles.title}>⚠️ Phishing Warning</Text>
        <Text style={styles.message}>
          This site may be impersonating "{result.target}"
        </Text>
        <Text style={styles.advice}>
          Do not connect your wallet or sign transactions.
        </Text>
        <Button title="Go Back" onPress={goBack} />
      </View>
    </Modal>
  );
}
```

### 7.3 Contract Analysis

```typescript
/**
 * Analyze smart contract for security risks
 */
export async function analyzeContract(
  contractAddress: string
): Promise<ContractAnalysis> {
  const provider = new ethers.providers.JsonRpcProvider(getRpcUrl());

  // Get contract bytecode
  const bytecode = await provider.getCode(contractAddress);

  if (bytecode === '0x') {
    throw new Error('No contract at address');
  }

  // Analyze bytecode
  const risks: Risk[] = [];

  // Check for selfdestruct
  if (bytecode.includes('ff')) {
    risks.push({
      severity: 'high',
      type: 'selfdestruct',
      description: 'Contract can self-destruct',
    });
  }

  // Check for delegatecall
  if (bytecode.includes('f4')) {
    risks.push({
      severity: 'medium',
      type: 'delegatecall',
      description: 'Contract uses delegatecall',
    });
  }

  // Check contract age
  const creationTx = await getContractCreationTx(contractAddress);
  const block = await provider.getBlock(creationTx.blockNumber);
  const age = Date.now() - block.timestamp * 1000;

  if (age < 7 * 24 * 60 * 60 * 1000) { // < 7 days
    risks.push({
      severity: 'medium',
      type: 'new_contract',
      description: 'Contract deployed recently',
    });
  }

  // Check if verified on Etherscan
  const isVerified = await checkEtherscanVerification(contractAddress);
  if (!isVerified) {
    risks.push({
      severity: 'medium',
      type: 'unverified',
      description: 'Contract source code not verified',
    });
  }

  // Query external services (Blockaid, Forta)
  const externalAnalysis = await queryBlockaid(contractAddress);
  risks.push(...externalAnalysis.risks);

  return {
    address: contractAddress,
    risks,
    isVerified,
    age,
    recommendation: calculateRecommendation(risks),
  };
}
```

### 7.4 Hardware Wallet Integration

```typescript
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble';
import Eth from '@ledgerhq/hw-app-eth';

/**
 * Hardware wallet manager (Ledger)
 */
export class HardwareWalletManager {
  private transport: TransportBLE | null = null;
  private eth: Eth | null = null;

  /**
   * Connect to Ledger device via Bluetooth
   */
  async connect(): Promise<void> {
    // Scan for devices
    const devices = await TransportBLE.list();

    if (devices.length === 0) {
      throw new Error('No Ledger devices found');
    }

    // Connect to first device
    this.transport = await TransportBLE.open(devices[0]);
    this.eth = new Eth(this.transport);
  }

  /**
   * Get Ethereum address from Ledger
   */
  async getAddress(path: string = "44'/60'/0'/0/0"): Promise<string> {
    if (!this.eth) {
      throw new Error('Not connected to device');
    }

    const result = await this.eth.getAddress(path, false, true);
    return result.address;
  }

  /**
   * Sign transaction with Ledger
   */
  async signTransaction(
    path: string,
    rawTx: string
  ): Promise<{ v: string; r: string; s: string }> {
    if (!this.eth) {
      throw new Error('Not connected to device');
    }

    // Parse transaction
    const tx = ethers.utils.parseTransaction(rawTx);

    // Serialize for Ledger
    const serialized = this.serializeTransaction(tx);

    // Sign on device (user confirms on Ledger screen)
    const signature = await this.eth.signTransaction(path, serialized);

    return {
      v: '0x' + signature.v,
      r: '0x' + signature.r,
      s: '0x' + signature.s,
    };
  }

  /**
   * Disconnect from device
   */
  async disconnect(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
      this.eth = null;
    }
  }
}
```

**Hardware Wallet Benefits**:
- ✅ Private keys never leave device
- ✅ Transaction confirmation on device screen
- ✅ Physical button press required
- ✅ Secure element storage
- ✅ Immune to malware on phone

---

## 8. Vulnerability Management

### 8.1 Dependency Scanning

```json
// package.json scripts
{
  "scripts": {
    "audit": "npm audit --audit-level=moderate",
    "audit:fix": "npm audit fix",
    "audit:snyk": "snyk test",
    "audit:ci": "npm audit --production --audit-level=high"
  }
}
```

```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
  schedule:
    - cron: '0 0 * * 1' # Weekly on Monday

jobs:
  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run npm audit
        run: npm audit --production --audit-level=high
        continue-on-error: true

      - name: Run Snyk scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

      - name: Run OWASP Dependency Check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: 'Deyond'
          path: '.'
          format: 'JSON'

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: security-reports
          path: dependency-check-report.json
```

**Vulnerability Response SLA**:
- **Critical**: Patch within 24 hours
- **High**: Patch within 7 days
- **Medium**: Patch within 30 days
- **Low**: Patch in next release

### 8.2 Security Audits

**Audit Checklist**:

- [ ] **Cryptography Review** (by cryptography expert)
  - Key generation randomness
  - Encryption algorithms and parameters
  - Secure storage implementation
  - Protocol correctness (Signal, BIP39, etc.)

- [ ] **Smart Contract Audit** (if any custom contracts)
  - Reentrancy vulnerabilities
  - Integer overflow/underflow
  - Access control
  - Gas optimization

- [ ] **Mobile Security Audit** (by mobile security firm)
  - Reverse engineering resistance
  - Runtime protection
  - Data storage security
  - Network security

- [ ] **Penetration Testing** (by external firm)
  - API security testing
  - Authentication bypass attempts
  - Data exfiltration tests
  - Social engineering tests

- [ ] **Privacy Audit** (by privacy expert)
  - Data collection review
  - Metadata leakage analysis
  - GDPR/CCPA compliance
  - Anonymity guarantees

**Recommended Audit Firms**:
- **Cryptography**: Trail of Bits, NCC Group
- **Smart Contracts**: OpenZeppelin, ConsenSys Diligence
- **Mobile**: NowSecure, Zimperium
- **Penetration Testing**: Cure53, Bishop Fox

### 8.3 Bug Bounty Program

```markdown
# Deyond Security Bug Bounty Program

## Scope

**In Scope:**
- Deyond mobile app (iOS & Android)
- API servers (api.deyond.io)
- WebSocket servers (ws.deyond.io)
- Smart contracts (if deployed)

**Out of Scope:**
- Third-party services (Infura, Firebase, etc.)
- Blockchain protocols themselves
- Social engineering attacks
- Physical attacks
- DDoS attacks

## Rewards

| Severity | Description | Reward |
|----------|-------------|--------|
| Critical | Private key extraction, authentication bypass, remote code execution | $10,000 - $50,000 |
| High | Transaction manipulation, message decryption, account takeover | $5,000 - $10,000 |
| Medium | Information disclosure, authorization flaws, XSS | $1,000 - $5,000 |
| Low | Minor security improvements, configuration issues | $100 - $1,000 |

## Rules

1. **Responsible Disclosure**: Report vulnerabilities privately, give 90 days to fix
2. **No Exploiting**: Do not exploit vulnerabilities beyond proof-of-concept
3. **No Data Theft**: Do not access user data or funds
4. **No DDoS**: Do not perform denial-of-service attacks
5. **One Report Per Vulnerability**: Duplicate reports not eligible
6. **Legal**: Must comply with all applicable laws

## Reporting

Email: security@deyond.io
PGP Key: [Public Key URL]

Include:
- Detailed description
- Steps to reproduce
- Proof-of-concept code/video
- Impact assessment
- Suggested remediation

## Timeline

1. **Acknowledgment**: Within 24 hours
2. **Initial Assessment**: Within 3 days
3. **Bounty Decision**: Within 14 days
4. **Payment**: Within 30 days of fix deployment
```

### 8.4 Incident Response Plan

**Incident Response Team**:
- **Incident Commander**: CTO
- **Security Lead**: Security Engineer
- **Communications**: Marketing Director
- **Legal**: Legal Counsel
- **Engineering**: Lead Backend Engineer

**Response Phases**:

#### **1. Detection & Analysis**
- Monitor security alerts (Sentry, CloudWatch, etc.)
- Receive bug reports from users or researchers
- Automated anomaly detection
- Threat intelligence feeds

#### **2. Containment**
- **Short-term**: Isolate affected systems, revoke compromised credentials
- **Long-term**: Apply patches, update firewall rules

#### **3. Eradication**
- Remove malware/backdoors
- Patch vulnerabilities
- Reset compromised credentials
- Review access logs

#### **4. Recovery**
- Restore from clean backups
- Gradually restore services
- Monitor for re-infection
- Verify system integrity

#### **5. Post-Incident**
- Document lessons learned
- Update incident response procedures
- Implement preventive measures
- External audit if needed

**Communication Plan**:

```typescript
/**
 * Security incident notification template
 */
export const incidentNotification = {
  critical: {
    subject: 'Critical Security Incident - Action Required',
    channels: ['email', 'push', 'in-app'],
    audience: 'all_users',
    template: `
      We have identified a critical security vulnerability that may affect your account.

      Action Required:
      - Update to version ${latestVersion} immediately
      - Review your transaction history for suspicious activity
      - Change your password/PIN

      We are working to resolve this issue and will provide updates every 6 hours.

      For questions: security@deyond.io
    `,
  },
  high: {
    subject: 'Security Update Available',
    channels: ['push', 'in-app'],
    audience: 'affected_users',
    template: `
      A security update is available for Deyond.

      Please update to version ${latestVersion} at your earliest convenience.

      This update addresses a vulnerability that could potentially affect account security.
    `,
  },
};
```

**Incident Severity Levels**:

| Level | Description | Response Time | Notification |
|-------|-------------|---------------|--------------|
| S1 - Critical | Active exploit, funds at risk | < 1 hour | All users |
| S2 - High | Vulnerability disclosed, no known exploit | < 4 hours | Affected users |
| S3 - Medium | Limited impact, low likelihood | < 24 hours | None (fix in update) |
| S4 - Low | Minor issue, no security impact | < 7 days | None |

---

## 9. Privacy Considerations

### 9.1 Anonymous Usage

Deyond allows fully anonymous usage of core features:

**No Account Required**:
- ✅ Wallet creation (local only)
- ✅ Transaction signing (broadcast via public RPC)
- ✅ Message encryption (peer-to-peer)
- ✅ BLE discovery (ephemeral identifiers)

**Optional Account (for sync)**:
- Virtual phone number (for calling)
- Cloud backup (encrypted)
- Feed flags (pseudonymous)
- Social integration (user's choice)

**Privacy-Preserving Identifiers**:
```typescript
/**
 * Generate ephemeral identifier for BLE discovery
 * Rotates every 15 minutes to prevent tracking
 */
export function generateEphemeralId(
  accountId: string,
  timestamp: number
): string {
  const epoch = Math.floor(timestamp / (15 * 60 * 1000)); // 15-minute epochs
  const seed = `${accountId}:${epoch}`;
  const hash = sha256(new TextEncoder().encode(seed));
  return CryptoUtils.bytesToHex(hash).slice(0, 16); // 8 bytes
}
```

### 9.2 Data Collection Minimization

**What Deyond Does NOT Collect**:
- ❌ Email address (unless user opts in for notifications)
- ❌ Phone number (unless user activates calling)
- ❌ GPS location (unless user posts feed flag)
- ❌ Contact list (unless user enables sync)
- ❌ Message content (end-to-end encrypted)
- ❌ Transaction details (on blockchain only)
- ❌ Browsing history (in-app browser)
- ❌ Biometric templates (stored on device only)

**What Deyond Collects (with consent)**:
- ✅ Crash reports (anonymized)
- ✅ Performance metrics (anonymized)
- ✅ Feature usage analytics (opt-in)
- ✅ Push notification token (for notifications)

### 9.3 GDPR/CCPA Compliance

```typescript
/**
 * GDPR: Right to access (Article 15)
 */
export async function exportUserData(
  userId: string
): Promise<UserDataExport> {
  return {
    personal_info: await getProfileData(userId),
    transactions: await getTransactionHistory(userId),
    messages: await getMessageHistory(userId),
    contacts: await getContacts(userId),
    settings: await getSettings(userId),
    analytics: await getAnalyticsData(userId),
  };
}

/**
 * GDPR: Right to erasure (Article 17)
 */
export async function deleteUserData(userId: string): Promise<void> {
  // Delete from database
  await db.execute('DELETE FROM users WHERE id = ?', [userId]);
  await db.execute('DELETE FROM messages WHERE user_id = ?', [userId]);
  await db.execute('DELETE FROM contacts WHERE user_id = ?', [userId]);

  // Delete from cloud storage
  await deleteFromCloud(userId);

  // Revoke authentication tokens
  await revokeAllTokens(userId);

  // Note: Cannot delete blockchain transactions (public record)
  // But we can delete local cache
  await db.execute('DELETE FROM transaction_cache WHERE user_id = ?', [userId]);
}

/**
 * CCPA: Right to opt-out (§ 1798.120)
 */
export async function optOutOfDataSale(userId: string): Promise<void> {
  // Deyond does NOT sell user data, but we provide this for compliance
  await db.execute(
    'UPDATE users SET data_sale_opt_out = TRUE WHERE id = ?',
    [userId]
  );

  // Disable analytics
  await disableAnalytics(userId);

  // Remove from marketing lists
  await removeFromMarketing(userId);
}
```

**Privacy Policy Requirements**:
1. **Transparency**: Clear explanation of data collection
2. **Consent**: Explicit opt-in for non-essential data
3. **Access**: Users can download all their data
4. **Deletion**: Users can delete all their data
5. **Portability**: Data export in JSON format
6. **Breach Notification**: 72-hour notification requirement

---

## 10. Security Best Practices

### 10.1 From System Prompt Additions

Deyond follows the security best practices defined in the codebase:

#### **No throw statements in normal operation paths**
```typescript
// ❌ BAD: Throwing in normal flow
export function sendTransaction(tx: Transaction): void {
  if (!isValidAddress(tx.to)) {
    throw new Error('Invalid address'); // ❌ Throws for expected validation
  }
}

// ✅ GOOD: Return Result type
export function sendTransaction(tx: Transaction): Result<string, Error> {
  if (!isValidAddress(tx.to)) {
    return { ok: false, error: new ValidationError('Invalid address') };
  }

  return { ok: true, value: txHash };
}
```

#### **No resource leaks**
```typescript
// ✅ Proper cleanup with try-finally
export async function signTransaction(
  tx: Transaction
): Promise<string> {
  const key = await retrievePrivateKey();

  try {
    return await sign(key, tx);
  } finally {
    // Always clear key from memory
    key.clear();
  }
}
```

#### **No data corruption potential**
```typescript
// ✅ Atomic database updates
export async function updateBalance(
  accountId: string,
  delta: BigNumber
): Promise<void> {
  await db.transaction(async (trx) => {
    // Read current balance
    const account = await trx('accounts')
      .where({ id: accountId })
      .forUpdate() // Lock row
      .first();

    // Update balance
    const newBalance = account.balance.add(delta);

    await trx('accounts')
      .where({ id: accountId })
      .update({ balance: newBalance.toString() });
  });
}
```

#### **Consistent error handling patterns**
```typescript
// ✅ Custom error hierarchy
export class SecurityError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'SecurityError';
  }
}

export class CryptoError extends SecurityError {
  constructor(message: string) {
    super(message, 'CRYPTO_ERROR', false);
  }
}

// Usage
try {
  await encryptData(data, key);
} catch (error) {
  if (error instanceof CryptoError) {
    // Handle crypto-specific error
    logSecurityEvent('encryption_failed', error);
  }
  throw error;
}
```

#### **Proper type guards for runtime checking**
```typescript
// ✅ Type guards with Zod
import { z } from 'zod';

const TransactionSchema = z.object({
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  value: z.string().regex(/^[0-9]+$/),
  data: z.string().regex(/^0x[a-fA-F0-9]*$/),
  gasLimit: z.number().positive(),
});

export function validateTransaction(data: unknown): Transaction {
  const result = TransactionSchema.safeParse(data);

  if (!result.success) {
    throw new ValidationError('Invalid transaction', result.error);
  }

  return result.data;
}
```

### 10.2 Secure Coding Checklist

**Before Committing Code**:

- [ ] All async operations have error handling
- [ ] Sensitive data cleared from memory after use
- [ ] No console.log with sensitive data
- [ ] Input validation with Zod schemas
- [ ] No `any` types (use `unknown` with type guards)
- [ ] Resources properly cleaned up (connections, timers)
- [ ] No hardcoded secrets (use environment variables)
- [ ] Error messages don't leak sensitive information
- [ ] Rate limiting on API calls
- [ ] SQL queries use parameterized statements
- [ ] File paths validated (no directory traversal)
- [ ] User input sanitized (XSS prevention)
- [ ] Cryptographic randomness (no Math.random())
- [ ] TLS/HTTPS for all network calls
- [ ] Authentication required for sensitive operations

---

## 11. Security Checklist

### 11.1 Pre-Release Security Checklist

**Code Review**:
- [ ] All cryptographic code reviewed by security expert
- [ ] No hardcoded secrets or API keys
- [ ] All dependencies up-to-date (no critical vulnerabilities)
- [ ] Code obfuscation enabled for production build
- [ ] Debug logs disabled in production

**Authentication**:
- [ ] Biometric authentication tested (Face ID, Touch ID, Fingerprint)
- [ ] PIN fallback working
- [ ] Session timeout configured (15 minutes)
- [ ] Failed login attempts limited (5 attempts)
- [ ] Account lockout after failed attempts

**Encryption**:
- [ ] Private keys stored in native keychain (iOS Keychain, Android Keystore)
- [ ] Wallet vault encrypted with AES-256-GCM
- [ ] Message encryption with Signal Protocol verified
- [ ] TLS 1.3 enforced for all API calls
- [ ] Certificate pinning implemented

**Transaction Security**:
- [ ] Transaction simulation working
- [ ] Phishing detection enabled
- [ ] Contract analysis integrated
- [ ] Hardware wallet support tested
- [ ] Transaction signing requires authentication

**Privacy**:
- [ ] Data collection minimized (no email/phone required)
- [ ] Analytics opt-in (not opt-out)
- [ ] GDPR data export implemented
- [ ] GDPR data deletion implemented
- [ ] Privacy policy updated and accessible

**Mobile Security**:
- [ ] Jailbreak/root detection implemented
- [ ] Screen capture disabled on sensitive screens
- [ ] Clipboard auto-clear after 30 seconds
- [ ] Memory protection (clear sensitive data)
- [ ] Background snapshot blur enabled

**Network Security**:
- [ ] Rate limiting implemented
- [ ] Input validation with Zod schemas
- [ ] WebSocket encryption enabled
- [ ] SRTP for voice calling
- [ ] BLE encryption with X3DH + Double Ratchet

**Testing**:
- [ ] Security audit completed by external firm
- [ ] Penetration testing completed
- [ ] Bug bounty program launched
- [ ] Incident response plan documented
- [ ] Security training for team completed

### 11.2 Developer Security Checklist

**Daily Development**:
- [ ] Run `npm audit` before committing
- [ ] No sensitive data in git commits
- [ ] Use environment variables for secrets
- [ ] Enable TypeScript strict mode
- [ ] Write tests for security-critical code

**Code Reviews**:
- [ ] Verify input validation
- [ ] Check for SQL injection vulnerabilities
- [ ] Review cryptographic code carefully
- [ ] Ensure error messages don't leak info
- [ ] Confirm proper resource cleanup

**Deployment**:
- [ ] Secrets rotated (API keys, JWT secrets)
- [ ] Environment variables configured
- [ ] Monitoring and alerting enabled
- [ ] Backup and disaster recovery tested
- [ ] Rollback plan documented

---

## 12. Penetration Testing Guidelines

### 12.1 Scope of Testing

**Mobile Application**:
- iOS app (latest 2 major versions)
- Android app (latest 2 major versions)
- Deep link handling
- URL scheme handling
- Biometric bypass attempts
- Local data storage inspection
- Network traffic analysis
- Reverse engineering resistance

**Backend Services**:
- REST API endpoints
- WebSocket connections
- Authentication flows
- Authorization checks
- Rate limiting
- Input validation
- SQL injection attempts
- API abuse scenarios

**Web3 Integration**:
- WalletConnect session hijacking
- Transaction replay attacks
- Signature validation
- Contract interaction security
- RPC endpoint abuse

### 12.2 Test Scenarios

#### **Authentication Bypass**
1. Attempt to bypass biometric authentication
2. Try to extract private keys from device
3. Session hijacking attempts
4. JWT token manipulation
5. Refresh token reuse

#### **Transaction Manipulation**
1. Modify transaction parameters (to, value, data)
2. Replay old transactions
3. Front-running attacks
4. Gas manipulation
5. Contract interaction tampering

#### **Data Exfiltration**
1. Extract messages from database
2. Decrypt stored data
3. Intercept network traffic
4. Screen recording sensitive data
5. Clipboard hijacking

#### **Denial of Service**
1. Flood API with requests
2. Exhaust device resources
3. Trigger crashes with malformed input
4. WebSocket connection flooding
5. BLE discovery spam

### 12.3 Expected Findings

**Acceptable Risks**:
- Information disclosure (app version, device type)
- Non-sensitive analytics data
- Public blockchain data

**Unacceptable Findings** (must be fixed before release):
- Private key extraction
- Authentication bypass
- Transaction manipulation
- Message decryption
- Account takeover
- Remote code execution

---

## Document Maintenance

**Review Schedule**:
- **Quarterly**: Review and update security measures
- **After Incidents**: Update based on lessons learned
- **Before Major Releases**: Comprehensive security review
- **Annual**: Full security audit by external firm

**Changelog**:
| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2025-11-19 | Initial security considerations document | Security Team |

---

## References

1. **Standards & Protocols**:
   - BIP39: Mnemonic code for generating deterministic keys
   - BIP32: Hierarchical Deterministic Wallets
   - BIP44: Multi-Account Hierarchy for Deterministic Wallets
   - Signal Protocol: https://signal.org/docs/
   - EIP-55: Checksummed addresses
   - EIP-1559: Fee market change

2. **Security Guidelines**:
   - OWASP Mobile Security Project
   - NIST Cryptographic Standards (FIPS 140-2)
   - Apple iOS Security Guide
   - Android Security Best Practices

3. **Regulatory**:
   - GDPR (EU General Data Protection Regulation)
   - CCPA (California Consumer Privacy Act)
   - SOC 2 Type II compliance guidelines

4. **Tools & Libraries**:
   - ethers.js: https://docs.ethers.io/
   - @noble/curves: https://github.com/paulmillr/noble-curves
   - react-native-keychain: https://github.com/oblador/react-native-keychain
   - @signalapp/libsignal-client

---

**For security concerns or to report vulnerabilities, contact: security@deyond.io**

**PGP Key Fingerprint**: [To be added upon key generation]
