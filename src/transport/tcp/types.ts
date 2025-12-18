/**
 * TCP Transport Types
 *
 * Type definitions for TCP-based P2P transport
 * Primarily for LAN connectivity
 */

import { TransportConfig } from '../types';

/**
 * TCP Transport Configuration
 */
export interface TCPTransportConfig extends TransportConfig {
  /** Local port to listen on */
  listenPort?: number;
  /** Interface to bind to (default: all interfaces) */
  bindAddress?: string;
  /** Enable TLS encryption */
  enableTls?: boolean;
  /** TLS certificate (PEM format) */
  tlsCert?: string;
  /** TLS private key (PEM format) */
  tlsKey?: string;
  /** Keep-alive interval in ms */
  keepAliveInterval?: number;
  /** Socket buffer size */
  bufferSize?: number;
  /** Enable mDNS discovery */
  enableMdns?: boolean;
  /** mDNS service name */
  mdnsServiceName?: string;
}

/**
 * TCP Connection State
 */
export type TCPConnectionState = 'connecting' | 'connected' | 'closing' | 'closed' | 'error';

/**
 * TCP Socket Info
 */
export interface TCPSocketInfo {
  localAddress: string;
  localPort: number;
  remoteAddress: string;
  remotePort: number;
  encrypted: boolean;
}

/**
 * TCP Message Frame
 * Wire format for TCP messages
 */
export interface TCPMessageFrame {
  /** Protocol version */
  version: number;
  /** Message type */
  type: TCPMessageType;
  /** Stream ID (for multiplexing) */
  streamId: number;
  /** Sequence number */
  sequence: number;
  /** Flags */
  flags: number;
  /** Payload length */
  length: number;
  /** Payload data */
  payload: Uint8Array;
}

/**
 * TCP Message Types
 */
export enum TCPMessageType {
  /** Data message */
  DATA = 0x01,
  /** Ping (keep-alive) */
  PING = 0x02,
  /** Pong (keep-alive response) */
  PONG = 0x03,
  /** Stream open request */
  STREAM_OPEN = 0x10,
  /** Stream open acknowledgment */
  STREAM_ACK = 0x11,
  /** Stream close */
  STREAM_CLOSE = 0x12,
  /** Stream reset */
  STREAM_RESET = 0x13,
  /** Window update (flow control) */
  WINDOW_UPDATE = 0x20,
  /** Settings */
  SETTINGS = 0x30,
  /** Go away (graceful shutdown) */
  GOAWAY = 0x40,
}

/**
 * TCP Frame Flags
 */
export const TCPFrameFlags = {
  /** End of stream */
  END_STREAM: 0x01,
  /** Acknowledgment */
  ACK: 0x02,
  /** Padded data */
  PADDED: 0x04,
  /** Priority */
  PRIORITY: 0x08,
} as const;

/**
 * TCP Handshake Message
 */
export interface TCPHandshake {
  /** Protocol version */
  version: number;
  /** Peer ID */
  peerId: string;
  /** Supported features */
  features: string[];
  /** Public key for verification */
  publicKey?: Uint8Array;
  /** Nonce for session */
  nonce: Uint8Array;
}

/**
 * mDNS Discovered Service
 */
export interface MDNSService {
  name: string;
  type: string;
  domain: string;
  host: string;
  port: number;
  addresses: string[];
  txt: Record<string, string>;
}

/**
 * TCP Transport Events
 */
export interface TCPTransportEvents {
  'server:listening': (address: string, port: number) => void;
  'server:closed': () => void;
  'socket:connected': (socketInfo: TCPSocketInfo) => void;
  'socket:disconnected': (socketInfo: TCPSocketInfo) => void;
  'socket:error': (socketInfo: TCPSocketInfo, error: Error) => void;
  'mdns:discovered': (service: MDNSService) => void;
  'mdns:lost': (serviceName: string) => void;
  [key: string]: (...args: any[]) => void;
}

/**
 * Default TCP configuration
 */
export const DEFAULT_TCP_CONFIG: TCPTransportConfig = {
  enabled: true,
  maxConnections: 50,
  connectionTimeout: 10000,
  idleTimeout: 300000, // 5 minutes
  listenPort: 0, // Random port
  bindAddress: '0.0.0.0',
  enableTls: false,
  keepAliveInterval: 30000,
  bufferSize: 65536,
  enableMdns: true,
  mdnsServiceName: '_deyond._tcp.local',
};

/**
 * Frame header size (fixed)
 * version (1) + type (1) + streamId (4) + sequence (4) + flags (1) + length (4)
 */
export const FRAME_HEADER_SIZE = 15;

/**
 * Maximum frame payload size
 */
export const MAX_FRAME_PAYLOAD_SIZE = 1048576; // 1MB

/**
 * Protocol version
 */
export const PROTOCOL_VERSION = 1;

/**
 * Magic bytes for protocol identification
 */
export const PROTOCOL_MAGIC = new Uint8Array([0x44, 0x45, 0x59, 0x4e]); // "DEYN"
