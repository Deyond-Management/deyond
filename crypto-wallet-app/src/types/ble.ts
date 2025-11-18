/**
 * BLE (Bluetooth Low Energy) Types
 * Type definitions for P2P chat functionality
 */

export interface BLEDevice {
  id: string;
  name: string;
  address: string;
  rssi?: number;
}

export interface BLESession {
  id: string;
  deviceId: string;
  deviceAddress: string;
  deviceName: string;
  status: SessionStatus;
  sharedSecret?: string;
  createdAt: number;
  expiresAt: number;
}

export enum SessionStatus {
  INITIATING = 'initiating',
  HANDSHAKING = 'handshaking',
  ESTABLISHED = 'established',
  CLOSED = 'closed',
  ERROR = 'error',
}

export interface SessionHandshake {
  sessionId: string;
  publicKey: string;
  address: string;
  timestamp: number;
  signature: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  from: string;
  to: string;
  content: string;
  timestamp: number;
  encrypted: boolean;
  status: MessageStatus;
}

export enum MessageStatus {
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

export interface SessionProtocol {
  version: string;
  initiatorPublicKey: string;
  responderPublicKey: string;
  sharedSecret: string;
  sessionId: string;
}

export enum BLEMessageType {
  HANDSHAKE_REQUEST = 'handshake_request',
  HANDSHAKE_RESPONSE = 'handshake_response',
  SESSION_ESTABLISHED = 'session_established',
  CHAT_MESSAGE = 'chat_message',
  SESSION_CLOSE = 'session_close',
  ACK = 'ack',
}

export interface BLEMessage {
  type: BLEMessageType;
  sessionId?: string;
  payload: unknown;
  timestamp: number;
  signature?: string;
}
