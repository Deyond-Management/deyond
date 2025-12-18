/**
 * DeyondCrypt - Double Ratchet Algorithm
 *
 * Implements the Signal Protocol's Double Ratchet algorithm for
 * forward secrecy and post-compromise security.
 *
 * The algorithm combines:
 * 1. DH Ratchet: Updates keys with each message exchange using ECDH
 * 2. Symmetric Ratchet: Derives message keys from chain keys using KDF
 *
 * Reference: https://signal.org/docs/specifications/doubleratchet/
 */

import { KeyPair, SessionState, MessageHeader, EncryptedMessage } from '../types';
import { ICryptoPrimitive, IKeyDerivation, ISymmetricCrypto } from '../primitives';
import { keyDerivation, symmetricCrypto } from '../primitives/SymmetricCrypto';

// =============================================================================
// Constants
// =============================================================================

const MAX_SKIP = 1000; // Maximum number of message keys to skip
const INFO_ROOT_KEY = new TextEncoder().encode('DeyondCrypt-RootKey');
const INFO_CHAIN_KEY = new TextEncoder().encode('DeyondCrypt-ChainKey');
const INFO_MESSAGE_KEY = new TextEncoder().encode('DeyondCrypt-MessageKey');

// =============================================================================
// Types
// =============================================================================

interface RatchetState {
  rootKey: Uint8Array;
  chainKey: Uint8Array | null;
  messageNumber: number;
  previousChainLength: number;
}

interface SkippedMessageKey {
  dhPublicKey: string; // Base64 encoded
  messageNumber: number;
  messageKey: Uint8Array;
}

// =============================================================================
// Double Ratchet Implementation
// =============================================================================

/**
 * Double Ratchet session for secure message exchange
 */
export class DoubleRatchet {
  private cryptoPrimitive: ICryptoPrimitive;
  private kdf: IKeyDerivation;
  private symmetric: ISymmetricCrypto;

  // Session state
  private dhKeyPair: KeyPair;
  private remoteDhPublicKey: Uint8Array | null = null;
  private rootKey: Uint8Array;

  // Sending chain
  private sendingChainKey: Uint8Array | null = null;
  private sendingMessageNumber: number = 0;
  private previousSendingChainLength: number = 0;

  // Receiving chain
  private receivingChainKey: Uint8Array | null = null;
  private receivingMessageNumber: number = 0;

  // Skipped message keys for out-of-order messages
  private skippedMessageKeys: Map<string, Uint8Array> = new Map();

  constructor(
    cryptoPrimitive: ICryptoPrimitive,
    dhKeyPair: KeyPair,
    rootKey: Uint8Array,
    kdf: IKeyDerivation = keyDerivation,
    symmetric: ISymmetricCrypto = symmetricCrypto
  ) {
    this.cryptoPrimitive = cryptoPrimitive;
    this.dhKeyPair = dhKeyPair;
    this.rootKey = rootKey;
    this.kdf = kdf;
    this.symmetric = symmetric;
  }

  // ---------------------------------------------------------------------------
  // Factory Methods
  // ---------------------------------------------------------------------------

  /**
   * Initialize a session as Alice (initiator)
   * Called after X3DH key agreement
   */
  static async initializeAsAlice(
    cryptoPrimitive: ICryptoPrimitive,
    sharedSecret: Uint8Array,
    bobPublicKey: Uint8Array,
    kdf: IKeyDerivation = keyDerivation,
    symmetric: ISymmetricCrypto = symmetricCrypto
  ): Promise<DoubleRatchet> {
    // Generate our first DH key pair
    const dhKeyPair = await cryptoPrimitive.generateKeyPair();

    // Derive initial root key from shared secret
    const rootKey = await kdf.hkdf(sharedSecret, null, INFO_ROOT_KEY, 32);

    const ratchet = new DoubleRatchet(cryptoPrimitive, dhKeyPair, rootKey, kdf, symmetric);

    // Set Bob's public key and perform initial DH ratchet
    ratchet.remoteDhPublicKey = bobPublicKey;
    await ratchet.dhRatchetSend();

    return ratchet;
  }

  /**
   * Initialize a session as Bob (responder)
   * Called after X3DH key agreement
   */
  static async initializeAsBob(
    cryptoPrimitive: ICryptoPrimitive,
    sharedSecret: Uint8Array,
    ourSignedPreKey: KeyPair,
    kdf: IKeyDerivation = keyDerivation,
    symmetric: ISymmetricCrypto = symmetricCrypto
  ): Promise<DoubleRatchet> {
    // Use our signed pre-key as the initial DH key pair
    const dhKeyPair = ourSignedPreKey;

    // Derive initial root key from shared secret
    const rootKey = await kdf.hkdf(sharedSecret, null, INFO_ROOT_KEY, 32);

    return new DoubleRatchet(cryptoPrimitive, dhKeyPair, rootKey, kdf, symmetric);
  }

  // ---------------------------------------------------------------------------
  // Encryption
  // ---------------------------------------------------------------------------

  /**
   * Encrypt a message
   */
  async encrypt(plaintext: Uint8Array): Promise<EncryptedMessage> {
    // Ensure we have a sending chain
    if (!this.sendingChainKey) {
      throw new Error('No sending chain key - session not properly initialized');
    }

    // Derive message key from chain key
    const { messageKey, nextChainKey } = await this.deriveMessageKey(this.sendingChainKey);
    this.sendingChainKey = nextChainKey;

    // Encrypt the message
    const { ciphertext, nonce } = await this.symmetric.encrypt(plaintext, messageKey);

    // Create message header
    const header: MessageHeader = {
      ephemeralKey: this.dhKeyPair.publicKey,
      previousChainLength: this.previousSendingChainLength,
      messageNumber: this.sendingMessageNumber,
    };

    this.sendingMessageNumber++;

    // Combine nonce with ciphertext for transmission
    const fullCiphertext = new Uint8Array(nonce.length + ciphertext.length);
    fullCiphertext.set(nonce);
    fullCiphertext.set(ciphertext, nonce.length);

    return {
      header,
      ciphertext: fullCiphertext,
      nonce,
    };
  }

  /**
   * Decrypt a message
   */
  async decrypt(message: EncryptedMessage): Promise<Uint8Array> {
    // Try to use a skipped message key first
    const skippedKey = this.getSkippedMessageKey(
      message.header.ephemeralKey,
      message.header.messageNumber
    );

    if (skippedKey) {
      return this.decryptWithKey(message, skippedKey);
    }

    // Check if we need to perform a DH ratchet step
    const remoteKeyChanged =
      !this.remoteDhPublicKey ||
      !this.arraysEqual(this.remoteDhPublicKey, message.header.ephemeralKey);

    if (remoteKeyChanged) {
      // Skip any missed messages from the previous receiving chain
      if (this.receivingChainKey) {
        await this.skipMessageKeys(message.header.previousChainLength);
      }

      // Perform DH ratchet
      await this.dhRatchetReceive(message.header);
    }

    // Skip any missed messages in the current chain
    await this.skipMessageKeys(message.header.messageNumber);

    // Derive the message key
    if (!this.receivingChainKey) {
      throw new Error('No receiving chain key');
    }

    const { messageKey, nextChainKey } = await this.deriveMessageKey(this.receivingChainKey);
    this.receivingChainKey = nextChainKey;
    this.receivingMessageNumber++;

    return this.decryptWithKey(message, messageKey);
  }

  // ---------------------------------------------------------------------------
  // DH Ratchet
  // ---------------------------------------------------------------------------

  /**
   * Perform DH ratchet step for sending
   */
  private async dhRatchetSend(): Promise<void> {
    // Save previous sending chain length
    this.previousSendingChainLength = this.sendingMessageNumber;
    this.sendingMessageNumber = 0;

    // Compute DH shared secret
    if (!this.remoteDhPublicKey) {
      throw new Error('No remote DH public key');
    }

    const dhOutput = await this.cryptoPrimitive.computeSharedSecret(
      this.dhKeyPair.privateKey,
      this.remoteDhPublicKey
    );

    // Derive new root key and sending chain key
    const { rootKey, chainKey } = await this.kdfRootKey(this.rootKey, dhOutput);

    this.rootKey = rootKey;
    this.sendingChainKey = chainKey;
  }

  /**
   * Perform DH ratchet step for receiving
   */
  private async dhRatchetReceive(header: MessageHeader): Promise<void> {
    // Store the new remote DH public key
    this.remoteDhPublicKey = header.ephemeralKey;

    // Reset receiving chain
    this.receivingMessageNumber = 0;

    // Compute DH shared secret with our current key pair
    const dhOutput = await this.cryptoPrimitive.computeSharedSecret(
      this.dhKeyPair.privateKey,
      this.remoteDhPublicKey
    );

    // Derive new root key and receiving chain key
    const { rootKey, chainKey } = await this.kdfRootKey(this.rootKey, dhOutput);

    this.rootKey = rootKey;
    this.receivingChainKey = chainKey;

    // Generate a new DH key pair for our next sending
    this.dhKeyPair = await this.cryptoPrimitive.generateKeyPair();

    // Perform another DH ratchet for sending
    await this.dhRatchetSend();
  }

  // ---------------------------------------------------------------------------
  // Key Derivation
  // ---------------------------------------------------------------------------

  /**
   * KDF for root key - derives new root key and chain key
   */
  private async kdfRootKey(
    rootKey: Uint8Array,
    dhOutput: Uint8Array
  ): Promise<{ rootKey: Uint8Array; chainKey: Uint8Array }> {
    // Derive 64 bytes: 32 for new root key, 32 for chain key
    const output = await this.kdf.hkdf(dhOutput, rootKey, INFO_ROOT_KEY, 64);

    return {
      rootKey: output.slice(0, 32),
      chainKey: output.slice(32, 64),
    };
  }

  /**
   * KDF for chain key - derives message key and next chain key
   */
  private async deriveMessageKey(
    chainKey: Uint8Array
  ): Promise<{ messageKey: Uint8Array; nextChainKey: Uint8Array }> {
    // Derive message key
    const messageKey = await this.kdf.hmacSha256(chainKey, INFO_MESSAGE_KEY);

    // Derive next chain key
    const nextChainKey = await this.kdf.hmacSha256(chainKey, INFO_CHAIN_KEY);

    return { messageKey, nextChainKey };
  }

  // ---------------------------------------------------------------------------
  // Skipped Message Keys
  // ---------------------------------------------------------------------------

  /**
   * Skip message keys and store them for later retrieval
   */
  private async skipMessageKeys(until: number): Promise<void> {
    if (!this.receivingChainKey) {
      return;
    }

    if (until - this.receivingMessageNumber > MAX_SKIP) {
      throw new Error('Too many skipped messages');
    }

    while (this.receivingMessageNumber < until) {
      const { messageKey, nextChainKey } = await this.deriveMessageKey(this.receivingChainKey);

      // Store the skipped key
      this.storeSkippedMessageKey(this.remoteDhPublicKey!, this.receivingMessageNumber, messageKey);

      this.receivingChainKey = nextChainKey;
      this.receivingMessageNumber++;
    }
  }

  /**
   * Store a skipped message key
   */
  private storeSkippedMessageKey(
    dhPublicKey: Uint8Array,
    messageNumber: number,
    messageKey: Uint8Array
  ): void {
    const key = this.makeSkippedKeyId(dhPublicKey, messageNumber);

    // Limit stored keys
    if (this.skippedMessageKeys.size >= MAX_SKIP) {
      // Remove oldest key
      const firstKey = this.skippedMessageKeys.keys().next().value;
      if (firstKey) {
        this.skippedMessageKeys.delete(firstKey);
      }
    }

    this.skippedMessageKeys.set(key, messageKey);
  }

  /**
   * Get a skipped message key
   */
  private getSkippedMessageKey(dhPublicKey: Uint8Array, messageNumber: number): Uint8Array | null {
    const key = this.makeSkippedKeyId(dhPublicKey, messageNumber);
    const messageKey = this.skippedMessageKeys.get(key);

    if (messageKey) {
      this.skippedMessageKeys.delete(key);
      return messageKey;
    }

    return null;
  }

  /**
   * Create unique key ID for skipped message storage
   */
  private makeSkippedKeyId(dhPublicKey: Uint8Array, messageNumber: number): string {
    return `${this.bytesToBase64(dhPublicKey)}:${messageNumber}`;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Decrypt message with a specific key
   */
  private async decryptWithKey(
    message: EncryptedMessage,
    messageKey: Uint8Array
  ): Promise<Uint8Array> {
    // Extract nonce from ciphertext
    const nonce = message.ciphertext.slice(0, 12);
    const ciphertext = message.ciphertext.slice(12);

    return this.symmetric.decrypt(ciphertext, messageKey, nonce);
  }

  /**
   * Compare two arrays
   */
  private arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  /**
   * Convert bytes to base64
   */
  private bytesToBase64(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...bytes));
  }

  // ---------------------------------------------------------------------------
  // State Export/Import
  // ---------------------------------------------------------------------------

  /**
   * Export session state for persistence
   */
  exportState(): SessionState {
    return {
      remoteAddress: '', // Set by caller
      remoteChainType: 'evm', // Set by caller
      remoteIdentityKey: new Uint8Array(0), // Set by caller
      dhRatchetKeyPair: this.dhKeyPair,
      remoteDhRatchetKey: this.remoteDhPublicKey,
      rootKey: this.rootKey,
      sendingChainKey: this.sendingChainKey,
      sendingMessageNumber: this.sendingMessageNumber,
      previousSendingChainLength: this.previousSendingChainLength,
      receivingChainKey: this.receivingChainKey,
      receivingMessageNumber: this.receivingMessageNumber,
      skippedMessageKeys: this.skippedMessageKeys,
      sessionId: '', // Set by caller
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
    };
  }

  /**
   * Import session state from persistence
   */
  static fromState(
    cryptoPrimitive: ICryptoPrimitive,
    state: SessionState,
    kdf: IKeyDerivation = keyDerivation,
    symmetric: ISymmetricCrypto = symmetricCrypto
  ): DoubleRatchet {
    const ratchet = new DoubleRatchet(
      cryptoPrimitive,
      state.dhRatchetKeyPair,
      state.rootKey,
      kdf,
      symmetric
    );

    ratchet.remoteDhPublicKey = state.remoteDhRatchetKey;
    ratchet.sendingChainKey = state.sendingChainKey;
    ratchet.sendingMessageNumber = state.sendingMessageNumber;
    ratchet.previousSendingChainLength = state.previousSendingChainLength;
    ratchet.receivingChainKey = state.receivingChainKey;
    ratchet.receivingMessageNumber = state.receivingMessageNumber;
    ratchet.skippedMessageKeys = state.skippedMessageKeys;

    return ratchet;
  }

  /**
   * Get current DH public key for message headers
   */
  getPublicKey(): Uint8Array {
    return this.dhKeyPair.publicKey;
  }
}
