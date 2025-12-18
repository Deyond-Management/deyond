/**
 * DeyondCrypt Protocol - Type Definitions
 * Blockchain-native end-to-end encryption protocol
 */

// =============================================================================
// Chain Types
// =============================================================================

export type ChainType = 'evm' | 'solana' | 'bitcoin' | 'cosmos';

export type CurveType = 'secp256k1' | 'ed25519' | 'curve25519';

// =============================================================================
// Key Types
// =============================================================================

export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export interface IdentityKeyPair extends KeyPair {
  chainType: ChainType;
  address: string;
}

export interface SignedPreKey {
  keyId: number;
  keyPair: KeyPair;
  signature: Uint8Array;
  timestamp: number;
}

export interface OneTimePreKey {
  keyId: number;
  keyPair: KeyPair;
}

export interface PreKeyBundle {
  identityKey: Uint8Array;
  signedPreKey: {
    keyId: number;
    publicKey: Uint8Array;
    signature: Uint8Array;
  };
  oneTimePreKey?: {
    keyId: number;
    publicKey: Uint8Array;
  };
  address: string;
  chainType: ChainType;
}

// =============================================================================
// Session Types
// =============================================================================

export interface SessionState {
  // Remote party info
  remoteAddress: string;
  remoteChainType: ChainType;
  remoteIdentityKey: Uint8Array;

  // DH Ratchet state
  dhRatchetKeyPair: KeyPair;
  remoteDhRatchetKey: Uint8Array | null;
  rootKey: Uint8Array;

  // Sending chain
  sendingChainKey: Uint8Array | null;
  sendingMessageNumber: number;
  previousSendingChainLength: number;

  // Receiving chain
  receivingChainKey: Uint8Array | null;
  receivingMessageNumber: number;

  // Skipped message keys (for out-of-order messages)
  skippedMessageKeys: Map<string, Uint8Array>;

  // Metadata
  sessionId: string;
  createdAt: number;
  lastActivityAt: number;
}

export interface SessionInfo {
  sessionId: string;
  remoteAddress: string;
  remoteChainType: ChainType;
  createdAt: number;
  lastActivityAt: number;
  messageCount: number;
}

// =============================================================================
// Message Types
// =============================================================================

export interface MessageHeader {
  // DH Ratchet public key
  ephemeralKey: Uint8Array;

  // Message counters
  previousChainLength: number;
  messageNumber: number;
}

export interface EncryptedMessage {
  header: MessageHeader;
  ciphertext: Uint8Array;
  nonce: Uint8Array;
}

export interface DeyondCryptEnvelope {
  version: number;

  // Sender info
  sender: {
    address: string;
    chainType: ChainType;
    identityKey: string; // Base64
  };

  // Recipient info
  recipient: {
    address: string;
    chainType: ChainType;
  };

  // Encrypted message
  header: {
    ephemeralKey: string; // Base64
    previousChainLength: number;
    messageNumber: number;
  };

  ciphertext: string; // Base64

  // Authentication
  signature: string; // Base64
  timestamp: number;
  messageId: string;
}

export interface PlainMessage {
  content: string;
  contentType: 'text' | 'image' | 'file' | 'transaction';
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Group Types
// =============================================================================

export interface GroupInfo {
  groupId: string;
  name: string;
  members: GroupMember[];
  createdBy: string;
  createdAt: number;
}

export interface GroupMember {
  address: string;
  chainType: ChainType;
  role: 'admin' | 'member';
  joinedAt: number;
}

export interface SenderKey {
  keyId: number;
  chainKey: Uint8Array;
  publicSigningKey: Uint8Array;
  iteration: number;
}

export interface SenderKeyState {
  // Sender identification
  senderAddress: string;
  senderChainType: ChainType;

  // Key information
  keyId: number;
  chainKey: Uint8Array;
  publicSigningKey: Uint8Array;
  privateSigningKey?: Uint8Array; // Only for our own sender key

  // Ratchet state
  iteration: number;

  // Message keys for out-of-order messages
  messageKeys: Map<number, Uint8Array>;
}

export interface SenderKeyDistributionMessage {
  // Identifies the group
  groupId: string;

  // Sender information
  senderAddress: string;
  senderChainType: ChainType;

  // Sender key data
  keyId: number;
  chainKey: string; // Base64 encoded
  publicSigningKey: string; // Base64 encoded
  iteration: number;

  // Signature for authenticity
  signature: string; // Base64 encoded
  timestamp: number;
}

export interface GroupMessage {
  // Group identification
  groupId: string;

  // Sender information
  senderAddress: string;
  senderChainType: ChainType;

  // Key reference
  keyId: number;
  iteration: number;

  // Encrypted content
  ciphertext: string; // Base64 encoded
  nonce: string; // Base64 encoded

  // Signature
  signature: string; // Base64 encoded
  timestamp: number;
  messageId: string;
}

export interface GroupSessionState {
  groupId: string;
  groupName: string;

  // Our sender key for this group
  mySenderKey: SenderKeyState;

  // Other members' sender keys
  memberSenderKeys: Map<string, SenderKeyState>; // address -> state

  // Group members
  members: GroupMember[];

  // Metadata
  createdAt: number;
  lastActivityAt: number;
}

export interface GroupSessionInfo {
  groupId: string;
  groupName: string;
  memberCount: number;
  createdAt: number;
  lastActivityAt: number;
}

export interface GroupSession {
  groupId: string;
  // Map of member address -> their sender key
  senderKeys: Map<string, SenderKey>;
  myCurrentSenderKey: SenderKey;
}

// =============================================================================
// Error Types
// =============================================================================

export class DeyondCryptError extends Error {
  constructor(
    message: string,
    public code: DeyondCryptErrorCode
  ) {
    super(message);
    this.name = 'DeyondCryptError';
  }
}

export enum DeyondCryptErrorCode {
  // Key errors
  INVALID_KEY = 'INVALID_KEY',
  KEY_NOT_FOUND = 'KEY_NOT_FOUND',
  KEY_DERIVATION_FAILED = 'KEY_DERIVATION_FAILED',

  // Session errors
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INVALID_SESSION_STATE = 'INVALID_SESSION_STATE',

  // Message errors
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  MESSAGE_TOO_OLD = 'MESSAGE_TOO_OLD',
  DUPLICATE_MESSAGE = 'DUPLICATE_MESSAGE',

  // Protocol errors
  UNSUPPORTED_VERSION = 'UNSUPPORTED_VERSION',
  UNSUPPORTED_CHAIN = 'UNSUPPORTED_CHAIN',
  INVALID_PREKEY_BUNDLE = 'INVALID_PREKEY_BUNDLE',

  // Group errors
  GROUP_NOT_FOUND = 'GROUP_NOT_FOUND',
  NOT_GROUP_MEMBER = 'NOT_GROUP_MEMBER',
  SENDER_KEY_NOT_FOUND = 'SENDER_KEY_NOT_FOUND',
}

// =============================================================================
// Configuration Types
// =============================================================================

export interface DeyondCryptConfig {
  // Maximum number of skipped message keys to store
  maxSkippedMessageKeys: number;

  // Maximum age of a message (in milliseconds)
  maxMessageAge: number;

  // Signed PreKey rotation interval (in milliseconds)
  signedPreKeyRotationInterval: number;

  // Number of One-time PreKeys to maintain
  oneTimePreKeyCount: number;

  // Session expiration time (in milliseconds)
  sessionExpirationTime: number;
}

export const DEFAULT_CONFIG: DeyondCryptConfig = {
  maxSkippedMessageKeys: 1000,
  maxMessageAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  signedPreKeyRotationInterval: 7 * 24 * 60 * 60 * 1000, // 7 days
  oneTimePreKeyCount: 100,
  sessionExpirationTime: 30 * 24 * 60 * 60 * 1000, // 30 days
};
