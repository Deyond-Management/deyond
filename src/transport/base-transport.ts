/**
 * Deyond P2P Transport Layer - Base Transport
 *
 * Abstract base class for transport implementations
 */

import {
  Transport,
  TransportConfig,
  TransportProtocol,
  Connection,
  ConnectionState,
  ConnectionStats,
  Stream,
  StreamState,
  Multiaddr,
  PeerId,
  PeerDiscovery,
} from './types';
import { EventEmitter } from '../utils/EventEmitter';

/**
 * Base connection implementation
 */
export abstract class BaseConnection implements Connection {
  public readonly id: string;
  public readonly remotePeer: PeerId;
  public readonly remoteAddr: Multiaddr;
  public readonly localAddr?: Multiaddr;
  public readonly protocol: TransportProtocol;
  public readonly metadata: Record<string, unknown> = {};

  protected _state: ConnectionState = 'disconnected';
  protected _stats: ConnectionStats;
  protected streams: Map<string, Stream> = new Map();
  protected eventEmitter = new EventEmitter();

  constructor(
    id: string,
    remotePeer: PeerId,
    remoteAddr: Multiaddr,
    protocol: TransportProtocol,
    localAddr?: Multiaddr
  ) {
    this.id = id;
    this.remotePeer = remotePeer;
    this.remoteAddr = remoteAddr;
    this.protocol = protocol;
    this.localAddr = localAddr;

    this._stats = {
      connectedAt: 0,
      bytesSent: 0,
      bytesReceived: 0,
      messagesSent: 0,
      messagesReceived: 0,
    };
  }

  get state(): ConnectionState {
    return this._state;
  }

  get stats(): ConnectionStats {
    return { ...this._stats };
  }

  protected setState(newState: ConnectionState): void {
    if (this._state !== newState) {
      this._state = newState;
      this.eventEmitter.emit('stateChange', newState);
    }
  }

  protected updateStats(update: Partial<ConnectionStats>): void {
    Object.assign(this._stats, update);
  }

  abstract newStream(protocol: string): Promise<Stream>;
  abstract close(): Promise<void>;

  getStreams(): Stream[] {
    return Array.from(this.streams.values());
  }

  onStateChange(handler: (state: ConnectionState) => void): void {
    this.eventEmitter.on('stateChange', handler);
  }

  onStream(handler: (stream: Stream) => void): void {
    this.eventEmitter.on('stream', handler);
  }

  protected emitStream(stream: Stream): void {
    this.eventEmitter.emit('stream', stream);
  }
}

/**
 * Base stream implementation
 */
export abstract class BaseStream implements Stream {
  public readonly id: string;
  public readonly protocol: string;
  public readonly connection: Connection;

  protected _state: StreamState = 'open';
  protected eventEmitter = new EventEmitter();

  constructor(id: string, protocol: string, connection: Connection) {
    this.id = id;
    this.protocol = protocol;
    this.connection = connection;
  }

  get state(): StreamState {
    return this._state;
  }

  protected setState(newState: StreamState): void {
    this._state = newState;
  }

  abstract send(data: Uint8Array): Promise<void>;

  async close(): Promise<void> {
    this.setState('closing');
    await this.doClose();
    this.setState('closed');
    this.eventEmitter.emit('close');
  }

  protected abstract doClose(): Promise<void>;

  abort(error?: Error): void {
    this.setState('error');
    if (error) {
      this.eventEmitter.emit('error', error);
    }
  }

  onData(handler: (data: Uint8Array) => void): void {
    this.eventEmitter.on('data', handler);
  }

  onClose(handler: () => void): void {
    this.eventEmitter.on('close', handler);
  }

  onError(handler: (error: Error) => void): void {
    this.eventEmitter.on('error', handler);
  }

  protected emitData(data: Uint8Array): void {
    this.eventEmitter.emit('data', data);
  }

  protected emitError(error: Error): void {
    this.eventEmitter.emit('error', error);
  }
}

/**
 * Abstract base transport class
 */
export abstract class BaseTransport implements Transport {
  public readonly protocol: TransportProtocol;
  public readonly config: TransportConfig;

  protected _isRunning = false;
  protected connections: Map<string, Connection> = new Map();
  protected eventEmitter = new EventEmitter();

  constructor(protocol: TransportProtocol, config: TransportConfig) {
    this.protocol = protocol;
    this.config = config;
  }

  abstract init(): Promise<void>;
  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
  abstract dial(addr: Multiaddr): Promise<Connection>;
  abstract getDiscovery(): PeerDiscovery | null;

  isRunning(): boolean {
    return this._isRunning;
  }

  protected setRunning(running: boolean): void {
    this._isRunning = running;
  }

  getConnections(): Connection[] {
    return Array.from(this.connections.values());
  }

  getConnection(peerId: string): Connection | undefined {
    return this.connections.get(peerId);
  }

  protected addConnection(connection: Connection): void {
    this.connections.set(connection.remotePeer.id, connection);
    this.eventEmitter.emit('connection', connection);
  }

  protected removeConnection(peerId: string): void {
    const connection = this.connections.get(peerId);
    if (connection) {
      this.connections.delete(peerId);
      this.eventEmitter.emit('disconnection', connection);
    }
  }

  onConnection(handler: (connection: Connection) => void): void {
    this.eventEmitter.on('connection', handler);
  }

  onDisconnection(handler: (connection: Connection) => void): void {
    this.eventEmitter.on('disconnection', handler);
  }

  onError(handler: (error: Error) => void): void {
    this.eventEmitter.on('error', handler);
  }

  protected emitError(error: Error): void {
    this.eventEmitter.emit('error', error);
  }

  /**
   * Check if max connections reached
   */
  protected isAtMaxConnections(): boolean {
    if (!this.config.maxConnections) return false;
    return this.connections.size >= this.config.maxConnections;
  }

  /**
   * Generate unique connection ID
   */
  protected generateConnectionId(): string {
    return `${this.protocol}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Generate unique stream ID
   */
  protected generateStreamId(): string {
    return `stream-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

export default BaseTransport;
