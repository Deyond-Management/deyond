/**
 * DeyondCrypt - Sender Keys Implementation
 *
 * Sender Keys protocol for efficient group messaging.
 * Instead of encrypting a message for each recipient (O(n)),
 * the sender encrypts once and all members can decrypt (O(1)).
 *
 * Each sender maintains their own symmetric ratchet chain key.
 * When sending, they ratchet forward and encrypt with derived key.
 * Other members store the sender's chain key and can derive message keys.
 */

import { sha256 } from '@noble/hashes/sha256';
import { hmac } from '@noble/hashes/hmac';
import { randomBytes } from '@noble/hashes/utils';
import {
  ChainType,
  SenderKeyState,
  SenderKeyDistributionMessage,
  GroupMessage,
  DeyondCryptError,
  DeyondCryptErrorCode,
} from '../types';
import { ICryptoPrimitive, CryptoPrimitiveRegistry } from '../primitives';
import { SymmetricCrypto } from '../primitives/SymmetricCrypto';

// =============================================================================
// Constants
// =============================================================================

const SENDER_KEY_MESSAGE_KEY_INFO = new TextEncoder().encode('DeyondCrypt_SenderKey_MessageKey');
const SENDER_KEY_CHAIN_KEY_INFO = new TextEncoder().encode('DeyondCrypt_SenderKey_ChainKey');
const MAX_FORWARD_RATCHETS = 2000; // Maximum iterations to look ahead

// =============================================================================
// Sender Key Ratchet
// =============================================================================

/**
 * Manages the symmetric ratchet for a single sender's key
 */
export class SenderKeyRatchet {
  private symmetricCrypto = new SymmetricCrypto();

  /**
   * Create a new sender key state for ourselves
   */
  async createSenderKeyState(
    senderAddress: string,
    senderChainType: ChainType
  ): Promise<SenderKeyState> {
    const crypto = CryptoPrimitiveRegistry.get(senderChainType);

    // Generate signing key pair
    const signingKeyPair = await crypto.generateKeyPair();

    // Generate random chain key
    const chainKey = randomBytes(32);

    // Generate random key ID
    const keyId = this.generateKeyId();

    return {
      senderAddress,
      senderChainType,
      keyId,
      chainKey: new Uint8Array(chainKey),
      publicSigningKey: signingKeyPair.publicKey,
      privateSigningKey: signingKeyPair.privateKey,
      iteration: 0,
      messageKeys: new Map(),
    };
  }

  /**
   * Create sender key state from a distribution message (for other members)
   */
  createSenderKeyStateFromDistribution(distribution: SenderKeyDistributionMessage): SenderKeyState {
    return {
      senderAddress: distribution.senderAddress,
      senderChainType: distribution.senderChainType,
      keyId: distribution.keyId,
      chainKey: this.base64ToBytes(distribution.chainKey),
      publicSigningKey: this.base64ToBytes(distribution.publicSigningKey),
      iteration: distribution.iteration,
      messageKeys: new Map(),
    };
  }

  /**
   * Ratchet forward and get the message key for sending
   */
  async ratchetForward(state: SenderKeyState): Promise<{
    messageKey: Uint8Array;
    iteration: number;
  }> {
    // Derive message key from current chain key
    const messageKey = await this.deriveMessageKey(state.chainKey, state.iteration);

    // Store the current iteration
    const iteration = state.iteration;

    // Ratchet the chain key forward
    state.chainKey = await this.deriveNextChainKey(state.chainKey);
    state.iteration++;

    return { messageKey, iteration };
  }

  /**
   * Get message key for a specific iteration (for receiving)
   * May need to ratchet forward if iteration is ahead of current state
   */
  async getMessageKey(state: SenderKeyState, iteration: number): Promise<Uint8Array> {
    // Check if we already have this message key cached
    const cachedKey = state.messageKeys.get(iteration);
    if (cachedKey) {
      // Remove from cache (each key should only be used once)
      state.messageKeys.delete(iteration);
      return cachedKey;
    }

    // If iteration is in the past, we can't derive it
    if (iteration < state.iteration) {
      throw new DeyondCryptError(
        `Message key for iteration ${iteration} has already been used`,
        DeyondCryptErrorCode.DECRYPTION_FAILED
      );
    }

    // Check if we need to ratchet too far forward
    const ratchetsNeeded = iteration - state.iteration;
    if (ratchetsNeeded > MAX_FORWARD_RATCHETS) {
      throw new DeyondCryptError(
        `Too many forward ratchets needed: ${ratchetsNeeded}`,
        DeyondCryptErrorCode.DECRYPTION_FAILED
      );
    }

    // Ratchet forward, caching intermediate keys
    while (state.iteration < iteration) {
      const messageKey = await this.deriveMessageKey(state.chainKey, state.iteration);
      state.messageKeys.set(state.iteration, messageKey);
      state.chainKey = await this.deriveNextChainKey(state.chainKey);
      state.iteration++;
    }

    // Now derive the requested message key
    const messageKey = await this.deriveMessageKey(state.chainKey, state.iteration);

    // Ratchet forward once more (consuming this iteration)
    state.chainKey = await this.deriveNextChainKey(state.chainKey);
    state.iteration++;

    return messageKey;
  }

  /**
   * Encrypt a message using sender key
   */
  async encrypt(
    plaintext: Uint8Array,
    state: SenderKeyState
  ): Promise<{
    ciphertext: Uint8Array;
    nonce: Uint8Array;
    iteration: number;
  }> {
    // Get message key by ratcheting forward
    const { messageKey, iteration } = await this.ratchetForward(state);

    // Encrypt with AES-256-GCM
    const { ciphertext, nonce } = await this.symmetricCrypto.encrypt(plaintext, messageKey);

    return { ciphertext, nonce, iteration };
  }

  /**
   * Decrypt a message using sender key
   */
  async decrypt(
    ciphertext: Uint8Array,
    nonce: Uint8Array,
    iteration: number,
    state: SenderKeyState
  ): Promise<Uint8Array> {
    // Get the message key for this iteration
    const messageKey = await this.getMessageKey(state, iteration);

    // Decrypt with AES-256-GCM
    return this.symmetricCrypto.decrypt(ciphertext, messageKey, nonce);
  }

  // ---------------------------------------------------------------------------
  // Key Derivation
  // ---------------------------------------------------------------------------

  private async deriveMessageKey(chainKey: Uint8Array, iteration: number): Promise<Uint8Array> {
    // MessageKey = HMAC-SHA256(chainKey, "message" || iteration)
    const iterationBytes = new Uint8Array(4);
    new DataView(iterationBytes.buffer).setUint32(0, iteration, false);

    const input = new Uint8Array(SENDER_KEY_MESSAGE_KEY_INFO.length + 4);
    input.set(SENDER_KEY_MESSAGE_KEY_INFO);
    input.set(iterationBytes, SENDER_KEY_MESSAGE_KEY_INFO.length);

    return hmac(sha256, chainKey, input);
  }

  private async deriveNextChainKey(chainKey: Uint8Array): Promise<Uint8Array> {
    // NextChainKey = HMAC-SHA256(chainKey, "chain")
    return hmac(sha256, chainKey, SENDER_KEY_CHAIN_KEY_INFO);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private generateKeyId(): number {
    const bytes = randomBytes(4);
    return new DataView(bytes.buffer).getUint32(0, false);
  }

  private base64ToBytes(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}

// =============================================================================
// Sender Key Distribution Message Builder
// =============================================================================

/**
 * Creates distribution messages to share sender keys with group members
 */
export class SenderKeyDistributionBuilder {
  /**
   * Create a distribution message for our sender key
   */
  async createDistribution(
    groupId: string,
    senderKeyState: SenderKeyState
  ): Promise<SenderKeyDistributionMessage> {
    if (!senderKeyState.privateSigningKey) {
      throw new Error('Cannot create distribution without private signing key');
    }

    const crypto = CryptoPrimitiveRegistry.get(senderKeyState.senderChainType);
    const timestamp = Date.now();

    // Create signature data
    const signatureData = this.createSignatureData(groupId, senderKeyState, timestamp);

    // Sign with our signing key
    const signature = await crypto.sign(signatureData, senderKeyState.privateSigningKey);

    return {
      groupId,
      senderAddress: senderKeyState.senderAddress,
      senderChainType: senderKeyState.senderChainType,
      keyId: senderKeyState.keyId,
      chainKey: this.bytesToBase64(senderKeyState.chainKey),
      publicSigningKey: this.bytesToBase64(senderKeyState.publicSigningKey),
      iteration: senderKeyState.iteration,
      signature: this.bytesToBase64(signature),
      timestamp,
    };
  }

  /**
   * Verify a distribution message
   */
  async verifyDistribution(distribution: SenderKeyDistributionMessage): Promise<boolean> {
    const crypto = CryptoPrimitiveRegistry.get(distribution.senderChainType);

    // Recreate signature data
    const signatureData = this.createSignatureDataFromDistribution(distribution);

    // Verify signature
    return crypto.verify(
      signatureData,
      this.base64ToBytes(distribution.signature),
      this.base64ToBytes(distribution.publicSigningKey)
    );
  }

  private createSignatureData(
    groupId: string,
    state: SenderKeyState,
    timestamp: number
  ): Uint8Array {
    const data = JSON.stringify({
      groupId,
      senderAddress: state.senderAddress,
      senderChainType: state.senderChainType,
      keyId: state.keyId,
      chainKey: this.bytesToBase64(state.chainKey),
      publicSigningKey: this.bytesToBase64(state.publicSigningKey),
      iteration: state.iteration,
      timestamp,
    });
    return new TextEncoder().encode(data);
  }

  private createSignatureDataFromDistribution(
    distribution: SenderKeyDistributionMessage
  ): Uint8Array {
    const data = JSON.stringify({
      groupId: distribution.groupId,
      senderAddress: distribution.senderAddress,
      senderChainType: distribution.senderChainType,
      keyId: distribution.keyId,
      chainKey: distribution.chainKey,
      publicSigningKey: distribution.publicSigningKey,
      iteration: distribution.iteration,
      timestamp: distribution.timestamp,
    });
    return new TextEncoder().encode(data);
  }

  private bytesToBase64(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...bytes));
  }

  private base64ToBytes(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}

// =============================================================================
// Group Message Builder
// =============================================================================

/**
 * Builds encrypted group messages
 */
export class GroupMessageBuilder {
  private ratchet = new SenderKeyRatchet();

  /**
   * Encrypt and build a group message
   */
  async buildMessage(
    groupId: string,
    plaintext: Uint8Array,
    senderKeyState: SenderKeyState
  ): Promise<GroupMessage> {
    if (!senderKeyState.privateSigningKey) {
      throw new Error('Cannot build message without private signing key');
    }

    const crypto = CryptoPrimitiveRegistry.get(senderKeyState.senderChainType);

    // Encrypt the message
    const { ciphertext, nonce, iteration } = await this.ratchet.encrypt(plaintext, senderKeyState);

    const timestamp = Date.now();
    const messageId = this.generateMessageId();

    // Create signature data
    const signatureData = this.createSignatureData(
      groupId,
      senderKeyState,
      ciphertext,
      nonce,
      iteration,
      timestamp,
      messageId
    );

    // Sign the message
    const signature = await crypto.sign(signatureData, senderKeyState.privateSigningKey);

    return {
      groupId,
      senderAddress: senderKeyState.senderAddress,
      senderChainType: senderKeyState.senderChainType,
      keyId: senderKeyState.keyId,
      iteration,
      ciphertext: this.bytesToBase64(ciphertext),
      nonce: this.bytesToBase64(nonce),
      signature: this.bytesToBase64(signature),
      timestamp,
      messageId,
    };
  }

  /**
   * Verify and decrypt a group message
   */
  async decryptMessage(message: GroupMessage, senderKeyState: SenderKeyState): Promise<Uint8Array> {
    const crypto = CryptoPrimitiveRegistry.get(message.senderChainType);

    // Verify sender key ID matches
    if (message.keyId !== senderKeyState.keyId) {
      throw new DeyondCryptError(
        `Key ID mismatch: expected ${senderKeyState.keyId}, got ${message.keyId}`,
        DeyondCryptErrorCode.SENDER_KEY_NOT_FOUND
      );
    }

    // Verify signature
    const signatureData = this.createSignatureDataFromMessage(message);
    const isValid = await crypto.verify(
      signatureData,
      this.base64ToBytes(message.signature),
      senderKeyState.publicSigningKey
    );

    if (!isValid) {
      throw new DeyondCryptError(
        'Invalid message signature',
        DeyondCryptErrorCode.INVALID_SIGNATURE
      );
    }

    // Decrypt the message
    return this.ratchet.decrypt(
      this.base64ToBytes(message.ciphertext),
      this.base64ToBytes(message.nonce),
      message.iteration,
      senderKeyState
    );
  }

  private createSignatureData(
    groupId: string,
    state: SenderKeyState,
    ciphertext: Uint8Array,
    nonce: Uint8Array,
    iteration: number,
    timestamp: number,
    messageId: string
  ): Uint8Array {
    const data = JSON.stringify({
      groupId,
      senderAddress: state.senderAddress,
      senderChainType: state.senderChainType,
      keyId: state.keyId,
      iteration,
      ciphertext: this.bytesToBase64(ciphertext),
      nonce: this.bytesToBase64(nonce),
      timestamp,
      messageId,
    });
    return new TextEncoder().encode(data);
  }

  private createSignatureDataFromMessage(message: GroupMessage): Uint8Array {
    const data = JSON.stringify({
      groupId: message.groupId,
      senderAddress: message.senderAddress,
      senderChainType: message.senderChainType,
      keyId: message.keyId,
      iteration: message.iteration,
      ciphertext: message.ciphertext,
      nonce: message.nonce,
      timestamp: message.timestamp,
      messageId: message.messageId,
    });
    return new TextEncoder().encode(data);
  }

  private generateMessageId(): string {
    const bytes = randomBytes(16);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private bytesToBase64(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...bytes));
  }

  private base64ToBytes(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}

// =============================================================================
// Exports
// =============================================================================

export const senderKeyRatchet = new SenderKeyRatchet();
export const senderKeyDistributionBuilder = new SenderKeyDistributionBuilder();
export const groupMessageBuilder = new GroupMessageBuilder();
