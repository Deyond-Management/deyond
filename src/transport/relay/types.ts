/**
 * Relay Transport Types
 *
 * Type definitions for relay-based message transport
 * Enables communication through intermediate relay servers
 */

import { TransportConfig, TransportMessage } from '../types';

/**
 * Relay Transport Configuration
 */
export interface RelayTransportConfig extends TransportConfig {
  /** Relay server URLs */
  relayServers: RelayServerConfig[];
  /** Enable automatic failover */
  enableFailover?: boolean;
  /** Heartbeat interval in ms */
  heartbeatInterval?: number;
  /** Message TTL in seconds */
  messageTtl?: number;
  /** Enable message persistence (store-and-forward) */
  enablePersistence?: boolean;
  /** Maximum queued messages per peer */
  maxQueuedMessages?: number;
  /** Reconnect settings */
  reconnect?: {
    enabled: boolean;
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
  };
  /** Enable encryption for relay messages */
  enableEncryption?: boolean;
}

/**
 * Relay Server Configuration
 */
export interface RelayServerConfig {
  /** Server URL (wss:// or https://) */
  url: string;
  /** Server region (for latency optimization) */
  region?: string;
  /** Server priority (lower = preferred) */
  priority?: number;
  /** Authentication token */
  authToken?: string;
  /** Server capabilities */
  capabilities?: RelayCapability[];
}

/**
 * Relay Server Capabilities
 */
export type RelayCapability =
  | 'messaging' // Basic message relay
  | 'presence' // Online/offline status
  | 'push' // Push notifications
  | 'persistence' // Store-and-forward
  | 'groups' // Group messaging
  | 'media' // Media relay
  | 'signaling'; // WebRTC signaling

/**
 * Relay Connection State
 */
export type RelayConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'authenticating'
  | 'connected'
  | 'reconnecting'
  | 'error';

/**
 * Relay Message Types
 */
export enum RelayMessageType {
  // Connection
  HELLO = 'hello',
  WELCOME = 'welcome',
  HEARTBEAT = 'heartbeat',
  HEARTBEAT_ACK = 'heartbeat_ack',
  BYE = 'bye',

  // Authentication
  AUTH = 'auth',
  AUTH_ACK = 'auth_ack',
  AUTH_FAIL = 'auth_fail',

  // Messaging
  MESSAGE = 'message',
  MESSAGE_ACK = 'message_ack',
  MESSAGE_FAIL = 'message_fail',

  // Presence
  PRESENCE = 'presence',
  PRESENCE_QUERY = 'presence_query',
  PRESENCE_RESPONSE = 'presence_response',
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',

  // Store-and-forward
  FETCH_MESSAGES = 'fetch_messages',
  PENDING_MESSAGES = 'pending_messages',
  CLEAR_MESSAGES = 'clear_messages',

  // Groups
  GROUP_JOIN = 'group_join',
  GROUP_LEAVE = 'group_leave',
  GROUP_MESSAGE = 'group_message',

  // Signaling (for WebRTC)
  SIGNAL = 'signal',

  // Errors
  ERROR = 'error',
}

/**
 * Base Relay Protocol Message
 */
export interface RelayProtocolMessage {
  type: RelayMessageType;
  id: string;
  timestamp: number;
}

/**
 * Hello Message (connection initiation)
 */
export interface HelloMessage extends RelayProtocolMessage {
  type: RelayMessageType.HELLO;
  peerId: string;
  version: string;
  capabilities: RelayCapability[];
}

/**
 * Welcome Message (connection accepted)
 */
export interface WelcomeMessage extends RelayProtocolMessage {
  type: RelayMessageType.WELCOME;
  serverId: string;
  serverCapabilities: RelayCapability[];
  sessionId: string;
  pendingMessageCount?: number;
}

/**
 * Auth Message
 */
export interface AuthMessage extends RelayProtocolMessage {
  type: RelayMessageType.AUTH;
  peerId: string;
  signature: string;
  timestamp: number;
  publicKey?: string;
}

/**
 * Relay Data Message
 */
export interface RelayDataMessage extends RelayProtocolMessage {
  type: RelayMessageType.MESSAGE;
  from: string;
  to: string;
  payload: string; // Base64 encoded
  protocol: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  ttl?: number;
  encrypted?: boolean;
  requireAck?: boolean;
}

/**
 * Message Acknowledgment
 */
export interface MessageAckMessage extends RelayProtocolMessage {
  type: RelayMessageType.MESSAGE_ACK;
  messageId: string;
  status: 'delivered' | 'stored' | 'read';
  deliveredAt?: number;
}

/**
 * Presence Information
 */
export interface PresenceInfo {
  peerId: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen?: number;
  capabilities?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Presence Message
 */
export interface PresenceMessage extends RelayProtocolMessage {
  type: RelayMessageType.PRESENCE;
  presence: PresenceInfo;
}

/**
 * Pending Messages Response
 */
export interface PendingMessagesMessage extends RelayProtocolMessage {
  type: RelayMessageType.PENDING_MESSAGES;
  messages: RelayDataMessage[];
  hasMore: boolean;
  cursor?: string;
}

/**
 * Signal Message (for WebRTC)
 */
export interface SignalMessage extends RelayProtocolMessage {
  type: RelayMessageType.SIGNAL;
  from: string;
  to: string;
  signalType: 'offer' | 'answer' | 'ice-candidate';
  payload: string; // JSON-encoded SDP or ICE candidate
}

/**
 * Error Message
 */
export interface ErrorMessage extends RelayProtocolMessage {
  type: RelayMessageType.ERROR;
  code: RelayErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Relay Error Codes
 */
export enum RelayErrorCode {
  UNKNOWN = 'unknown',
  AUTH_FAILED = 'auth_failed',
  RATE_LIMITED = 'rate_limited',
  PEER_NOT_FOUND = 'peer_not_found',
  PEER_OFFLINE = 'peer_offline',
  MESSAGE_TOO_LARGE = 'message_too_large',
  QUOTA_EXCEEDED = 'quota_exceeded',
  SERVER_ERROR = 'server_error',
  INVALID_MESSAGE = 'invalid_message',
  SESSION_EXPIRED = 'session_expired',
}

/**
 * Relay Transport Events
 */
export interface RelayTransportEvents {
  'relay:connected': (serverUrl: string, sessionId: string) => void;
  'relay:disconnected': (serverUrl: string, reason?: string) => void;
  'relay:reconnecting': (serverUrl: string, attempt: number) => void;
  'relay:error': (error: Error, serverUrl?: string) => void;
  'presence:updated': (presence: PresenceInfo) => void;
  'presence:subscribed': (peerId: string) => void;
  'message:stored': (messageId: string, peerId: string) => void;
  'message:delivered': (messageId: string, peerId: string) => void;
  'pending:received': (count: number) => void;
  'signal:received': (signal: SignalMessage) => void;
  [key: string]: (...args: any[]) => void;
}

/**
 * Relay Server Status
 */
export interface RelayServerStatus {
  url: string;
  state: RelayConnectionState;
  latency?: number;
  lastConnected?: number;
  reconnectAttempts: number;
  sessionId?: string;
}

/**
 * Default Relay Configuration
 */
export const DEFAULT_RELAY_CONFIG: RelayTransportConfig = {
  enabled: true,
  maxConnections: 5,
  connectionTimeout: 15000,
  idleTimeout: 0, // No idle timeout for relay
  relayServers: [],
  enableFailover: true,
  heartbeatInterval: 30000,
  messageTtl: 86400, // 24 hours
  enablePersistence: true,
  maxQueuedMessages: 1000,
  reconnect: {
    enabled: true,
    maxAttempts: 10,
    baseDelay: 1000,
    maxDelay: 60000,
  },
  enableEncryption: true,
};

/**
 * Protocol Version
 */
export const RELAY_PROTOCOL_VERSION = '1.0.0';

/**
 * Maximum message size (bytes)
 */
export const MAX_RELAY_MESSAGE_SIZE = 1048576; // 1MB
