/**
 * DeyondCrypt - Message Envelope
 *
 * Handles serialization and deserialization of encrypted messages
 * for transmission over P2P networks or other transports.
 */

import {
  ChainType,
  DeyondCryptEnvelope,
  MessageHeader,
  PlainMessage,
  DeyondCryptError,
  DeyondCryptErrorCode,
} from '../types';
import { ICryptoPrimitive, CryptoPrimitiveRegistry } from '../primitives';

// Protocol version (defined locally to avoid circular imports)
const DEYOND_CRYPT_VERSION = 1;

// =============================================================================
// Message Envelope Builder
// =============================================================================

/**
 * Builder for creating DeyondCrypt message envelopes
 */
export class MessageEnvelopeBuilder {
  private version: number = DEYOND_CRYPT_VERSION;
  private senderAddress: string = '';
  private senderChainType: ChainType = 'evm';
  private senderIdentityKey: Uint8Array = new Uint8Array(0);
  private recipientAddress: string = '';
  private recipientChainType: ChainType = 'evm';
  private header: MessageHeader | null = null;
  private ciphertext: Uint8Array = new Uint8Array(0);
  private privateKey: Uint8Array = new Uint8Array(0);

  /**
   * Set the sender information
   */
  setSender(
    address: string,
    chainType: ChainType,
    identityKey: Uint8Array
  ): MessageEnvelopeBuilder {
    this.senderAddress = address;
    this.senderChainType = chainType;
    this.senderIdentityKey = identityKey;
    return this;
  }

  /**
   * Set the recipient information
   */
  setRecipient(address: string, chainType: ChainType): MessageEnvelopeBuilder {
    this.recipientAddress = address;
    this.recipientChainType = chainType;
    return this;
  }

  /**
   * Set the encrypted message data
   */
  setEncryptedData(header: MessageHeader, ciphertext: Uint8Array): MessageEnvelopeBuilder {
    this.header = header;
    this.ciphertext = ciphertext;
    return this;
  }

  /**
   * Set the private key for signing
   */
  setPrivateKey(privateKey: Uint8Array): MessageEnvelopeBuilder {
    this.privateKey = privateKey;
    return this;
  }

  /**
   * Build the envelope
   */
  async build(): Promise<DeyondCryptEnvelope> {
    if (!this.header) {
      throw new Error('Message header is required');
    }

    const timestamp = Date.now();
    const messageId = this.generateMessageId();

    // Create signature data
    const signatureData = this.createSignatureData(timestamp, messageId);

    // Sign the envelope
    const crypto = CryptoPrimitiveRegistry.get(this.senderChainType);
    const signature = await crypto.sign(signatureData, this.privateKey);

    return {
      version: this.version,
      sender: {
        address: this.senderAddress,
        chainType: this.senderChainType,
        identityKey: bytesToBase64(this.senderIdentityKey),
      },
      recipient: {
        address: this.recipientAddress,
        chainType: this.recipientChainType,
      },
      header: {
        ephemeralKey: bytesToBase64(this.header.ephemeralKey),
        previousChainLength: this.header.previousChainLength,
        messageNumber: this.header.messageNumber,
      },
      ciphertext: bytesToBase64(this.ciphertext),
      signature: bytesToBase64(signature),
      timestamp,
      messageId,
    };
  }

  /**
   * Create data to be signed
   */
  private createSignatureData(timestamp: number, messageId: string): Uint8Array {
    // Sign: version || sender || recipient || header || ciphertext || timestamp || messageId
    const data = JSON.stringify({
      version: this.version,
      sender: this.senderAddress,
      senderChain: this.senderChainType,
      recipient: this.recipientAddress,
      recipientChain: this.recipientChainType,
      headerEphemeral: bytesToBase64(this.header!.ephemeralKey),
      headerPrevChain: this.header!.previousChainLength,
      headerMsgNum: this.header!.messageNumber,
      ciphertext: bytesToBase64(this.ciphertext),
      timestamp,
      messageId,
    });

    return new TextEncoder().encode(data);
  }

  /**
   * Generate a unique message ID
   */
  private generateMessageId(): string {
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytesToHex(bytes);
  }
}

// =============================================================================
// Message Envelope Parser
// =============================================================================

/**
 * Parser for DeyondCrypt message envelopes
 */
export class MessageEnvelopeParser {
  /**
   * Parse a JSON string into an envelope
   */
  static parse(json: string): DeyondCryptEnvelope {
    const envelope = JSON.parse(json) as DeyondCryptEnvelope;
    this.validate(envelope);
    return envelope;
  }

  /**
   * Validate an envelope structure
   */
  static validate(envelope: DeyondCryptEnvelope): void {
    if (!envelope.version || envelope.version > DEYOND_CRYPT_VERSION) {
      throw new DeyondCryptError(
        `Unsupported version: ${envelope.version}`,
        DeyondCryptErrorCode.UNSUPPORTED_VERSION
      );
    }

    if (!envelope.sender?.address || !envelope.sender?.chainType) {
      throw new Error('Invalid sender information');
    }

    if (!envelope.recipient?.address || !envelope.recipient?.chainType) {
      throw new Error('Invalid recipient information');
    }

    if (!envelope.header?.ephemeralKey) {
      throw new Error('Invalid message header');
    }

    if (!envelope.ciphertext) {
      throw new Error('Missing ciphertext');
    }

    if (!envelope.signature) {
      throw new Error('Missing signature');
    }
  }

  /**
   * Verify the envelope signature
   */
  static async verifySignature(envelope: DeyondCryptEnvelope): Promise<boolean> {
    const crypto = CryptoPrimitiveRegistry.get(envelope.sender.chainType);

    // Reconstruct signature data
    const signatureData = this.createSignatureData(envelope);

    // Verify signature
    return crypto.verify(
      signatureData,
      base64ToBytes(envelope.signature),
      base64ToBytes(envelope.sender.identityKey)
    );
  }

  /**
   * Extract the message header
   */
  static extractHeader(envelope: DeyondCryptEnvelope): MessageHeader {
    return {
      ephemeralKey: base64ToBytes(envelope.header.ephemeralKey),
      previousChainLength: envelope.header.previousChainLength,
      messageNumber: envelope.header.messageNumber,
    };
  }

  /**
   * Extract the ciphertext
   */
  static extractCiphertext(envelope: DeyondCryptEnvelope): Uint8Array {
    return base64ToBytes(envelope.ciphertext);
  }

  /**
   * Check if message is too old
   */
  static isExpired(envelope: DeyondCryptEnvelope, maxAgeMs: number): boolean {
    const age = Date.now() - envelope.timestamp;
    return age > maxAgeMs;
  }

  /**
   * Create signature data for verification
   */
  private static createSignatureData(envelope: DeyondCryptEnvelope): Uint8Array {
    const data = JSON.stringify({
      version: envelope.version,
      sender: envelope.sender.address,
      senderChain: envelope.sender.chainType,
      recipient: envelope.recipient.address,
      recipientChain: envelope.recipient.chainType,
      headerEphemeral: envelope.header.ephemeralKey,
      headerPrevChain: envelope.header.previousChainLength,
      headerMsgNum: envelope.header.messageNumber,
      ciphertext: envelope.ciphertext,
      timestamp: envelope.timestamp,
      messageId: envelope.messageId,
    });

    return new TextEncoder().encode(data);
  }
}

// =============================================================================
// Plain Message Helpers
// =============================================================================

/**
 * Encode a plain message for encryption
 */
export function encodePlainMessage(message: PlainMessage): Uint8Array {
  const json = JSON.stringify(message);
  return new TextEncoder().encode(json);
}

/**
 * Decode a plain message after decryption
 */
export function decodePlainMessage(data: Uint8Array): PlainMessage {
  const json = new TextDecoder().decode(data);
  return JSON.parse(json) as PlainMessage;
}

/**
 * Create a text message
 */
export function createTextMessage(content: string): PlainMessage {
  return {
    content,
    contentType: 'text',
  };
}

/**
 * Create an image message
 */
export function createImageMessage(base64Image: string, mimeType: string): PlainMessage {
  return {
    content: base64Image,
    contentType: 'image',
    metadata: { mimeType },
  };
}

/**
 * Create a file message
 */
export function createFileMessage(
  base64Content: string,
  fileName: string,
  mimeType: string
): PlainMessage {
  return {
    content: base64Content,
    contentType: 'file',
    metadata: { fileName, mimeType },
  };
}

/**
 * Create a transaction message
 */
export function createTransactionMessage(
  txHash: string,
  chainType: ChainType,
  amount: string,
  token: string
): PlainMessage {
  return {
    content: txHash,
    contentType: 'transaction',
    metadata: { chainType, amount, token },
  };
}

// =============================================================================
// Serialization Helpers
// =============================================================================

/**
 * Serialize an envelope to JSON string
 */
export function serializeEnvelope(envelope: DeyondCryptEnvelope): string {
  return JSON.stringify(envelope);
}

/**
 * Deserialize an envelope from JSON string
 */
export function deserializeEnvelope(json: string): DeyondCryptEnvelope {
  return MessageEnvelopeParser.parse(json);
}

/**
 * Serialize an envelope to bytes (for binary transport)
 */
export function serializeEnvelopeToBytes(envelope: DeyondCryptEnvelope): Uint8Array {
  const json = JSON.stringify(envelope);
  return new TextEncoder().encode(json);
}

/**
 * Deserialize an envelope from bytes
 */
export function deserializeEnvelopeFromBytes(bytes: Uint8Array): DeyondCryptEnvelope {
  const json = new TextDecoder().decode(bytes);
  return MessageEnvelopeParser.parse(json);
}

// =============================================================================
// Utility Functions
// =============================================================================

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
