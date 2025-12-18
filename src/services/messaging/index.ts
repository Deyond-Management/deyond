/**
 * Messaging Services
 * End-to-end encrypted messaging using DeyondCrypt protocol
 */

export {
  DeyondCryptService,
  getDeyondCryptService,
  type Contact,
  type DecryptedMessage,
  type EncryptedMessageResult,
  type GroupInfo,
} from './DeyondCryptService';

export {
  DeyondCryptPreKeyStore,
  DeyondCryptSessionStore,
  DeyondCryptGroupSessionStore,
} from './DeyondCryptKeyStore';

export {
  MessageStore,
  getMessageStore,
  type StoredMessage,
  type StoredSession,
} from './MessageStore';
