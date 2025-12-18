/**
 * BLE Transport - Type Definitions
 */

import { TransportConfig } from '../types';

/**
 * BLE-specific configuration
 */
export interface BLETransportConfig extends TransportConfig {
  /** BLE service UUID */
  serviceUUID: string;
  /** Characteristic UUIDs */
  characteristics: {
    /** TX characteristic (write) */
    tx: string;
    /** RX characteristic (notify) */
    rx: string;
    /** Control characteristic (for handshake) */
    control: string;
  };
  /** Scan settings */
  scan: {
    /** Scan duration in ms (0 for continuous) */
    duration: number;
    /** Allow duplicates */
    allowDuplicates: boolean;
    /** Scan interval in ms */
    interval?: number;
  };
  /** MTU size (default 512) */
  mtu: number;
  /** Enable peripheral mode (advertise) */
  advertise: boolean;
  /** Advertisement name */
  advertiseName?: string;
}

/**
 * BLE device information
 */
export interface BLEDevice {
  /** Device identifier */
  id: string;
  /** Device name (if available) */
  name: string | null;
  /** RSSI signal strength */
  rssi: number | null;
  /** Is connectable */
  isConnectable: boolean | null;
  /** Service UUIDs */
  serviceUUIDs: string[] | null;
  /** Manufacturer data */
  manufacturerData?: Record<string, Uint8Array>;
  /** Local name from advertisement */
  localName?: string | null;
}

/**
 * BLE connection state
 */
export type BLEConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'discovering'
  | 'connected'
  | 'disconnecting';

/**
 * BLE message types for control protocol
 */
export enum BLEMessageType {
  /** Handshake initiation */
  HANDSHAKE_INIT = 0x01,
  /** Handshake response */
  HANDSHAKE_RESPONSE = 0x02,
  /** Handshake complete */
  HANDSHAKE_COMPLETE = 0x03,
  /** Data message */
  DATA = 0x10,
  /** Data acknowledgment */
  DATA_ACK = 0x11,
  /** Stream open request */
  STREAM_OPEN = 0x20,
  /** Stream open response */
  STREAM_OPEN_ACK = 0x21,
  /** Stream close */
  STREAM_CLOSE = 0x22,
  /** Ping */
  PING = 0x30,
  /** Pong */
  PONG = 0x31,
  /** Error */
  ERROR = 0xff,
}

/**
 * BLE message header (first 8 bytes of every message)
 */
export interface BLEMessageHeader {
  /** Message type */
  type: BLEMessageType;
  /** Stream ID (0 for control) */
  streamId: number;
  /** Sequence number */
  sequence: number;
  /** Payload length */
  length: number;
  /** Flags (reserved) */
  flags: number;
}

/**
 * BLE chunk for splitting large messages
 */
export interface BLEChunk {
  /** Message ID this chunk belongs to */
  messageId: number;
  /** Chunk index */
  index: number;
  /** Total chunks */
  total: number;
  /** Chunk data */
  data: Uint8Array;
}

/**
 * BLE handshake data
 */
export interface BLEHandshake {
  /** Protocol version */
  version: number;
  /** Peer ID */
  peerId: string;
  /** Public key for session encryption */
  publicKey: Uint8Array;
  /** Supported protocols */
  protocols: string[];
  /** Nonce for key exchange */
  nonce: Uint8Array;
}

/**
 * Default BLE configuration
 */
export const DEFAULT_BLE_CONFIG: BLETransportConfig = {
  enabled: true,
  maxConnections: 5,
  connectionTimeout: 30000,
  idleTimeout: 300000,
  serviceUUID: 'D3Y0ND00-0000-1000-8000-00805F9B34FB',
  characteristics: {
    tx: 'D3Y0ND01-0000-1000-8000-00805F9B34FB',
    rx: 'D3Y0ND02-0000-1000-8000-00805F9B34FB',
    control: 'D3Y0ND03-0000-1000-8000-00805F9B34FB',
  },
  scan: {
    duration: 10000,
    allowDuplicates: false,
    interval: 1000,
  },
  mtu: 512,
  advertise: true,
  advertiseName: 'Deyond',
};
