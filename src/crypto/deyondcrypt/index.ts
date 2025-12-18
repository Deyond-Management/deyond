/**
 * DeyondCrypt Protocol
 * Blockchain-native end-to-end encryption protocol
 *
 * Based on Signal Protocol concepts but adapted for blockchain:
 * - Wallet key derivation for messaging keys
 * - Multi-chain support (EVM, Solana, Bitcoin, Cosmos)
 * - P2P direct messaging for privacy
 * - Group messaging with Sender Keys
 *
 * @module DeyondCrypt
 */

// =============================================================================
// Type Definitions
// =============================================================================

export type {
  // Chain Types
  ChainType,
  CurveType,

  // Key Types
  KeyPair,
  IdentityKeyPair,
  SignedPreKey,
  OneTimePreKey,
  PreKeyBundle,

  // Session Types
  SessionState,
  SessionInfo,

  // Message Types
  MessageHeader,
  EncryptedMessage,
  DeyondCryptEnvelope,
  PlainMessage,

  // Group Types
  GroupInfo,
  GroupMember,
  SenderKey,
  GroupSession,
  SenderKeyState,
  SenderKeyDistributionMessage,
  GroupMessage,
  GroupSessionState,
  GroupSessionInfo,

  // Configuration
  DeyondCryptConfig,
} from './types';

// Export classes and values (non-type exports)
export { DeyondCryptError, DeyondCryptErrorCode, DEFAULT_CONFIG } from './types';

// =============================================================================
// Crypto Primitives
// =============================================================================

export type {
  // Interfaces
  ICryptoPrimitive,
  ISymmetricCrypto,
  IKeyDerivation,
} from './primitives';

// Export registry class
export { CryptoPrimitiveRegistry } from './primitives';

export { EVMCrypto, evmCrypto } from './primitives/EVMCrypto';
export { SolanaCrypto, solanaCrypto } from './primitives/SolanaCrypto';

// =============================================================================
// Core Protocol Components
// =============================================================================

export { DoubleRatchet } from './core';

// =============================================================================
// Key Management and Exchange
// =============================================================================

export { X3DH, InMemoryPreKeyStore } from './keys';

export type { IPreKeyStore, X3DHInitiatorKeys, X3DHResult, X3DHInitialMessage } from './keys';

// =============================================================================
// Session Management
// =============================================================================

export { SessionManager, InMemorySessionStore } from './sessions';

export type { Session, SerializedSession, ISessionStore } from './sessions';

// =============================================================================
// Message Handling
// =============================================================================

export {
  MessageEnvelopeBuilder,
  MessageEnvelopeParser,
  encodePlainMessage,
  decodePlainMessage,
  createTextMessage,
  createImageMessage,
  createFileMessage,
  createTransactionMessage,
  serializeEnvelope,
  deserializeEnvelope,
  serializeEnvelopeToBytes,
  deserializeEnvelopeFromBytes,
} from './messages';

export {
  SymmetricCrypto,
  KeyDerivation,
  symmetricCrypto,
  keyDerivation,
  AES_KEY_SIZE,
  GCM_NONCE_SIZE,
  GCM_TAG_SIZE,
} from './primitives/SymmetricCrypto';

// =============================================================================
// Group Messaging (Sender Keys)
// =============================================================================

export {
  SenderKeyRatchet,
  SenderKeyDistributionBuilder,
  GroupMessageBuilder,
  GroupSessionManager,
  InMemoryGroupSessionStore,
  senderKeyRatchet,
  senderKeyDistributionBuilder,
  groupMessageBuilder,
} from './groups';

export type { IGroupSessionStore } from './groups';

// =============================================================================
// Initialization
// =============================================================================

import { CryptoPrimitiveRegistry } from './primitives';
import { evmCrypto } from './primitives/EVMCrypto';
import { solanaCrypto } from './primitives/SolanaCrypto';

/**
 * Initialize DeyondCrypt with default crypto primitives
 * Call this at app startup
 */
export function initializeDeyondCrypt(): void {
  // Register EVM crypto primitive (Ethereum, Polygon, BSC, etc.)
  CryptoPrimitiveRegistry.register(evmCrypto);

  // Register Solana crypto primitive
  CryptoPrimitiveRegistry.register(solanaCrypto);

  // Future: Register other chain primitives
  // CryptoPrimitiveRegistry.register(bitcoinCrypto);
  // CryptoPrimitiveRegistry.register(cosmosCrypto);

  console.log(
    '[DeyondCrypt] Initialized with chains:',
    CryptoPrimitiveRegistry.getRegisteredChains()
  );
}

// =============================================================================
// Version
// =============================================================================

export const DEYOND_CRYPT_VERSION = 1;
export const PROTOCOL_NAME = 'DeyondCrypt';
