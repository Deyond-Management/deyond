/**
 * Relay Transport Implementation
 *
 * Message relay through intermediate servers for:
 * - NAT traversal
 * - Offline message delivery (store-and-forward)
 * - Presence/status
 * - Push notifications
 * - WebRTC signaling
 *
 * Features:
 * - Multiple relay server support with failover
 * - Message persistence
 * - Presence tracking
 * - Automatic reconnection
 * - End-to-end encryption passthrough
 */

import {
  Transport,
  TransportProtocol,
  Connection,
  ConnectionState,
  ConnectionStats,
  Stream,
  StreamState,
  PeerId,
  Multiaddr,
  PeerDiscovery,
  DiscoveredPeer,
} from '../types';
import { Multiaddr as MultiaddrImpl } from '../multiaddr';
import { PeerId as PeerIdImpl } from '../peer-id';
import { TypedEventEmitter } from '../../utils/EventEmitter';
import { logger } from '../../utils';
import {
  RelayTransportConfig,
  RelayTransportEvents,
  RelayServerConfig,
  RelayConnectionState,
  RelayServerStatus,
  RelayMessageType,
  RelayProtocolMessage,
  HelloMessage,
  WelcomeMessage,
  AuthMessage,
  RelayDataMessage,
  MessageAckMessage,
  PresenceInfo,
  PresenceMessage,
  PendingMessagesMessage,
  SignalMessage,
  ErrorMessage,
  RelayErrorCode,
  DEFAULT_RELAY_CONFIG,
  RELAY_PROTOCOL_VERSION,
  MAX_RELAY_MESSAGE_SIZE,
} from './types';

const relayLogger = logger.child({ module: 'RelayTransport' });

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Encode data to base64
 */
function encodeBase64(data: Uint8Array): string {
  return Buffer.from(data).toString('base64');
}

/**
 * Decode base64 to data
 */
function decodeBase64(base64: string): Uint8Array {
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

// =============================================================================
// Relay Stream Implementation
// =============================================================================

/**
 * Virtual stream over relay connection
 */
export class RelayStream implements Stream {
  readonly id: string;
  readonly protocol: string;
  readonly connection: Connection;

  private _state: StreamState = 'open';
  private sendFn: (to: string, data: Uint8Array, protocol: string) => Promise<void>;
  private targetPeerId: string;

  private dataHandlers: ((data: Uint8Array) => void)[] = [];
  private closeHandlers: (() => void)[] = [];
  private errorHandlers: ((error: Error) => void)[] = [];

  constructor(
    id: string,
    protocol: string,
    connection: Connection,
    targetPeerId: string,
    sendFn: (to: string, data: Uint8Array, protocol: string) => Promise<void>
  ) {
    this.id = id;
    this.protocol = protocol;
    this.connection = connection;
    this.targetPeerId = targetPeerId;
    this.sendFn = sendFn;
  }

  get state(): StreamState {
    return this._state;
  }

  /**
   * Handle incoming data
   */
  handleData(data: Uint8Array): void {
    this.dataHandlers.forEach(handler => handler(data));
  }

  /**
   * Handle stream close
   */
  handleClose(): void {
    this._state = 'closed';
    this.closeHandlers.forEach(handler => handler());
  }

  /**
   * Handle error
   */
  handleError(error: Error): void {
    this._state = 'error';
    this.errorHandlers.forEach(handler => handler(error));
  }

  async send(data: Uint8Array): Promise<void> {
    if (this._state !== 'open') {
      throw new Error('Stream is not open');
    }

    await this.sendFn(this.targetPeerId, data, this.protocol);
  }

  async close(): Promise<void> {
    if (this._state === 'closed') return;

    this._state = 'closing';
    this._state = 'closed';
    this.closeHandlers.forEach(handler => handler());
  }

  abort(error?: Error): void {
    this._state = 'error';
    if (error) {
      this.errorHandlers.forEach(handler => handler(error));
    }
  }

  onData(handler: (data: Uint8Array) => void): void {
    this.dataHandlers.push(handler);
  }

  onClose(handler: () => void): void {
    this.closeHandlers.push(handler);
  }

  onError(handler: (error: Error) => void): void {
    this.errorHandlers.push(handler);
  }
}

// =============================================================================
// Relay Connection Implementation
// =============================================================================

/**
 * Virtual connection through relay
 */
export class RelayConnection implements Connection {
  readonly id: string;
  readonly remotePeer: PeerId;
  readonly remoteAddr: Multiaddr;
  readonly localAddr?: Multiaddr;
  readonly protocol: TransportProtocol = 'websocket'; // Underlying protocol

  private _state: ConnectionState = 'connected';
  private _stats: ConnectionStats;
  private _metadata: Record<string, unknown> = {};
  private streams: Map<string, RelayStream> = new Map();

  private sendFn: (to: string, data: Uint8Array, protocol: string) => Promise<void>;

  private stateChangeHandlers: ((state: ConnectionState) => void)[] = [];
  private streamHandlers: ((stream: Stream) => void)[] = [];

  constructor(
    id: string,
    remotePeer: PeerId,
    remoteAddr: Multiaddr,
    sendFn: (to: string, data: Uint8Array, protocol: string) => Promise<void>
  ) {
    this.id = id;
    this.remotePeer = remotePeer;
    this.remoteAddr = remoteAddr;
    this.sendFn = sendFn;

    this._stats = {
      connectedAt: Date.now(),
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

  get metadata(): Record<string, unknown> {
    return { ...this._metadata };
  }

  /**
   * Update connection state
   */
  updateState(state: ConnectionState): void {
    if (this._state !== state) {
      this._state = state;
      this.stateChangeHandlers.forEach(handler => handler(state));
    }
  }

  /**
   * Handle incoming message for this connection
   */
  handleMessage(protocol: string, data: Uint8Array): void {
    this._stats.bytesReceived += data.length;
    this._stats.messagesReceived++;

    // Find or create stream for protocol
    let stream = this.findStreamByProtocol(protocol);
    if (!stream) {
      stream = this.createStream(protocol);
      const newStream = stream;
      this.streamHandlers.forEach(handler => handler(newStream));
    }

    stream.handleData(data);
  }

  private findStreamByProtocol(protocol: string): RelayStream | undefined {
    for (const stream of this.streams.values()) {
      if (stream.protocol === protocol) {
        return stream;
      }
    }
    return undefined;
  }

  private createStream(protocol: string): RelayStream {
    const sendFn = this.sendFn;
    const stats = this._stats;

    const stream = new RelayStream(
      `relay-stream-${Date.now()}`,
      protocol,
      this,
      this.remotePeer.id,
      async (to, data, proto) => {
        stats.bytesSent += data.length;
        stats.messagesSent++;
        await sendFn(to, data, proto);
      }
    );

    this.streams.set(stream.id, stream);
    return stream;
  }

  async newStream(protocol: string): Promise<Stream> {
    const stream = this.createStream(protocol);
    return stream;
  }

  getStreams(): Stream[] {
    return Array.from(this.streams.values());
  }

  async close(): Promise<void> {
    if (this._state === 'disconnected') return;

    this.updateState('disconnecting');

    for (const stream of this.streams.values()) {
      await stream.close();
    }
    this.streams.clear();

    this.updateState('disconnected');
  }

  onStateChange(handler: (state: ConnectionState) => void): void {
    this.stateChangeHandlers.push(handler);
  }

  onStream(handler: (stream: Stream) => void): void {
    this.streamHandlers.push(handler);
  }
}

// =============================================================================
// Relay Server Connection
// =============================================================================

/**
 * Connection to a single relay server
 */
class RelayServerConnection {
  readonly config: RelayServerConfig;
  private socket: WebSocket | null = null;
  private _state: RelayConnectionState = 'disconnected';
  private sessionId: string | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectAttempts: number = 0;

  private messageHandlers: ((message: RelayProtocolMessage) => void)[] = [];
  private stateHandlers: ((state: RelayConnectionState) => void)[] = [];
  private pendingAcks: Map<string, { resolve: () => void; reject: (err: Error) => void }> =
    new Map();

  constructor(
    config: RelayServerConfig,
    private transportConfig: RelayTransportConfig,
    private localPeerId: string
  ) {
    this.config = config;
  }

  get state(): RelayConnectionState {
    return this._state;
  }

  get session(): string | null {
    return this.sessionId;
  }

  private updateState(state: RelayConnectionState): void {
    if (this._state !== state) {
      this._state = state;
      this.stateHandlers.forEach(handler => handler(state));
    }
  }

  /**
   * Connect to relay server
   */
  async connect(): Promise<void> {
    if (this._state === 'connected') return;

    this.updateState('connecting');

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, this.transportConfig.connectionTimeout || 15000);

      try {
        this.socket = new WebSocket(this.config.url);

        this.socket.onopen = () => {
          clearTimeout(timeout);
          this.updateState('authenticating');
          this.sendHello();
        };

        this.socket.onmessage = event => {
          try {
            const message = JSON.parse(event.data) as RelayProtocolMessage;
            this.handleMessage(message, resolve, reject);
          } catch (err) {
            relayLogger.error('Failed to parse message', err as Error);
          }
        };

        this.socket.onclose = () => {
          this.handleDisconnect();
        };

        this.socket.onerror = () => {
          clearTimeout(timeout);
          relayLogger.error('WebSocket error');
          reject(new Error('WebSocket connection failed'));
        };
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Send hello message
   */
  private sendHello(): void {
    const hello: HelloMessage = {
      type: RelayMessageType.HELLO,
      id: generateMessageId(),
      timestamp: Date.now(),
      peerId: this.localPeerId,
      version: RELAY_PROTOCOL_VERSION,
      capabilities: ['messaging', 'presence', 'persistence'],
    };

    this.send(hello);
  }

  /**
   * Handle incoming message
   */
  private handleMessage(
    message: RelayProtocolMessage,
    connectResolve?: () => void,
    connectReject?: (err: Error) => void
  ): void {
    switch (message.type) {
      case RelayMessageType.WELCOME:
        this.handleWelcome(message as WelcomeMessage, connectResolve);
        break;

      case RelayMessageType.AUTH_FAIL:
        this.updateState('error');
        if (connectReject) {
          connectReject(new Error('Authentication failed'));
        }
        break;

      case RelayMessageType.HEARTBEAT:
        this.sendHeartbeatAck(message.id);
        break;

      case RelayMessageType.MESSAGE_ACK:
        this.handleMessageAck(message as MessageAckMessage);
        break;

      case RelayMessageType.ERROR:
        this.handleError(message as ErrorMessage);
        break;

      default:
        // Forward to transport
        this.messageHandlers.forEach(handler => handler(message));
    }
  }

  /**
   * Handle welcome message
   */
  private handleWelcome(message: WelcomeMessage, resolve?: () => void): void {
    this.sessionId = message.sessionId;
    this.reconnectAttempts = 0;
    this.updateState('connected');
    this.startHeartbeat();

    relayLogger.info('Connected to relay server', {
      url: this.config.url,
      sessionId: message.sessionId,
      pendingMessages: message.pendingMessageCount,
    });

    if (resolve) {
      resolve();
    }

    // Fetch pending messages if any
    if (message.pendingMessageCount && message.pendingMessageCount > 0) {
      this.fetchPendingMessages();
    }
  }

  /**
   * Handle message acknowledgment
   */
  private handleMessageAck(message: MessageAckMessage): void {
    const pending = this.pendingAcks.get(message.messageId);
    if (pending) {
      pending.resolve();
      this.pendingAcks.delete(message.messageId);
    }
  }

  /**
   * Handle error message
   */
  private handleError(message: ErrorMessage): void {
    relayLogger.error(`Relay error: ${message.code} - ${message.message}`);

    // Reject pending acks if rate limited
    if (message.code === RelayErrorCode.RATE_LIMITED) {
      for (const [, pending] of this.pendingAcks) {
        pending.reject(new Error('Rate limited'));
      }
      this.pendingAcks.clear();
    }
  }

  /**
   * Handle disconnection
   */
  private handleDisconnect(): void {
    this.stopHeartbeat();
    this.sessionId = null;

    const wasConnected = this._state === 'connected';
    this.updateState('disconnected');

    // Attempt reconnection if enabled
    if (
      wasConnected &&
      this.transportConfig.reconnect?.enabled &&
      this.reconnectAttempts < (this.transportConfig.reconnect?.maxAttempts || 10)
    ) {
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    const { baseDelay = 1000, maxDelay = 60000 } = this.transportConfig.reconnect || {};

    const delay = Math.min(baseDelay * Math.pow(2, this.reconnectAttempts), maxDelay);

    this.reconnectAttempts++;
    this.updateState('reconnecting');

    relayLogger.info('Scheduling reconnect', {
      attempt: this.reconnectAttempts,
      delay,
    });

    setTimeout(() => {
      this.connect().catch(err => {
        relayLogger.error('Reconnect failed', err);
      });
    }, delay);
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    const interval = this.transportConfig.heartbeatInterval || 30000;

    this.heartbeatTimer = setInterval(() => {
      this.send({
        type: RelayMessageType.HEARTBEAT,
        id: generateMessageId(),
        timestamp: Date.now(),
      });
    }, interval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Send heartbeat acknowledgment
   */
  private sendHeartbeatAck(originalId: string): void {
    this.send({
      type: RelayMessageType.HEARTBEAT_ACK,
      id: originalId,
      timestamp: Date.now(),
    });
  }

  /**
   * Fetch pending messages
   */
  private fetchPendingMessages(): void {
    this.send({
      type: RelayMessageType.FETCH_MESSAGES,
      id: generateMessageId(),
      timestamp: Date.now(),
    } as RelayProtocolMessage);
  }

  /**
   * Send message
   */
  send(message: RelayProtocolMessage): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected');
    }

    this.socket.send(JSON.stringify(message));
  }

  /**
   * Send data message with optional acknowledgment
   */
  async sendData(
    to: string,
    data: Uint8Array,
    protocol: string,
    requireAck: boolean = false
  ): Promise<void> {
    const messageId = generateMessageId();

    const message: RelayDataMessage = {
      type: RelayMessageType.MESSAGE,
      id: messageId,
      timestamp: Date.now(),
      from: this.localPeerId,
      to,
      payload: encodeBase64(data),
      protocol,
      ttl: this.transportConfig.messageTtl,
      encrypted: this.transportConfig.enableEncryption,
      requireAck,
    };

    if (requireAck) {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.pendingAcks.delete(messageId);
          reject(new Error('Message acknowledgment timeout'));
        }, 10000);

        this.pendingAcks.set(messageId, {
          resolve: () => {
            clearTimeout(timeout);
            resolve();
          },
          reject: err => {
            clearTimeout(timeout);
            reject(err);
          },
        });

        this.send(message);
      });
    }

    this.send(message);
  }

  /**
   * Update presence
   */
  updatePresence(status: 'online' | 'offline' | 'away' | 'busy'): void {
    const message: PresenceMessage = {
      type: RelayMessageType.PRESENCE,
      id: generateMessageId(),
      timestamp: Date.now(),
      presence: {
        peerId: this.localPeerId,
        status,
        lastSeen: Date.now(),
      },
    };

    this.send(message);
  }

  /**
   * Subscribe to peer presence
   */
  subscribePresence(peerId: string): void {
    this.send({
      type: RelayMessageType.SUBSCRIBE,
      id: generateMessageId(),
      timestamp: Date.now(),
      peerId,
    } as RelayProtocolMessage & { peerId: string });
  }

  /**
   * Send WebRTC signal
   */
  sendSignal(to: string, signalType: 'offer' | 'answer' | 'ice-candidate', payload: string): void {
    const message: SignalMessage = {
      type: RelayMessageType.SIGNAL,
      id: generateMessageId(),
      timestamp: Date.now(),
      from: this.localPeerId,
      to,
      signalType,
      payload,
    };

    this.send(message);
  }

  /**
   * Disconnect
   */
  disconnect(): void {
    this.stopHeartbeat();

    if (this.socket) {
      // Send bye message
      try {
        this.send({
          type: RelayMessageType.BYE,
          id: generateMessageId(),
          timestamp: Date.now(),
        });
      } catch {
        // Ignore
      }

      this.socket.close();
      this.socket = null;
    }

    this.updateState('disconnected');
  }

  /**
   * Subscribe to messages
   */
  onMessage(handler: (message: RelayProtocolMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(handler: (state: RelayConnectionState) => void): void {
    this.stateHandlers.push(handler);
  }
}

// =============================================================================
// Relay Transport Implementation
// =============================================================================

/**
 * Relay Transport
 *
 * Message relay through intermediate servers
 */
export class RelayTransport implements Transport {
  readonly protocol: TransportProtocol = 'websocket';
  readonly config: RelayTransportConfig;

  private _isRunning = false;
  private localPeerId: string = '';
  private servers: Map<string, RelayServerConnection> = new Map();
  private connections: Map<string, RelayConnection> = new Map();
  private presence: Map<string, PresenceInfo> = new Map();

  private eventEmitter = new TypedEventEmitter<RelayTransportEvents>();
  private connectionHandlers: ((connection: Connection) => void)[] = [];
  private disconnectionHandlers: ((connection: Connection) => void)[] = [];
  private errorHandlers: ((error: Error) => void)[] = [];

  constructor(config: Partial<RelayTransportConfig> = {}) {
    this.config = {
      ...DEFAULT_RELAY_CONFIG,
      ...config,
    };
  }

  isRunning(): boolean {
    return this._isRunning;
  }

  /**
   * Set local peer ID
   */
  setLocalPeerId(peerId: string): void {
    this.localPeerId = peerId;
  }

  /**
   * Add relay server
   */
  addRelayServer(config: RelayServerConfig): void {
    this.config.relayServers.push(config);
  }

  async init(): Promise<void> {
    relayLogger.info('Initializing Relay Transport');

    if (this.config.relayServers.length === 0) {
      relayLogger.warn('No relay servers configured');
    }
  }

  async start(): Promise<void> {
    if (this._isRunning) return;

    relayLogger.info('Starting Relay Transport');

    // Connect to relay servers
    const sortedServers = [...this.config.relayServers].sort(
      (a, b) => (a.priority || 0) - (b.priority || 0)
    );

    const connectPromises = sortedServers.map(async serverConfig => {
      const server = new RelayServerConnection(serverConfig, this.config, this.localPeerId);

      server.onMessage(message => this.handleServerMessage(serverConfig.url, message));
      server.onStateChange(state => this.handleServerStateChange(serverConfig.url, state));

      try {
        await server.connect();
        this.servers.set(serverConfig.url, server);
        this.eventEmitter.emit('relay:connected', serverConfig.url, server.session || '');
      } catch (error) {
        relayLogger.error(`Failed to connect to relay server: ${serverConfig.url}`, error as Error);
        this.eventEmitter.emit('relay:error', error as Error, serverConfig.url);
      }
    });

    await Promise.allSettled(connectPromises);

    if (this.servers.size === 0) {
      throw new Error('Failed to connect to any relay server');
    }

    this._isRunning = true;
    relayLogger.info('Relay Transport started', { servers: this.servers.size });
  }

  async stop(): Promise<void> {
    if (!this._isRunning) return;

    relayLogger.info('Stopping Relay Transport');

    // Update presence to offline
    for (const server of this.servers.values()) {
      try {
        server.updatePresence('offline');
      } catch {
        // Ignore
      }
    }

    // Close all connections
    for (const connection of this.connections.values()) {
      await connection.close();
    }
    this.connections.clear();

    // Disconnect from servers
    for (const server of this.servers.values()) {
      server.disconnect();
    }
    this.servers.clear();

    this.presence.clear();
    this._isRunning = false;

    relayLogger.info('Relay Transport stopped');
  }

  /**
   * Handle message from relay server
   */
  private handleServerMessage(serverUrl: string, message: RelayProtocolMessage): void {
    switch (message.type) {
      case RelayMessageType.MESSAGE:
        this.handleDataMessage(message as RelayDataMessage);
        break;

      case RelayMessageType.PRESENCE:
        this.handlePresenceMessage(message as PresenceMessage);
        break;

      case RelayMessageType.PENDING_MESSAGES:
        this.handlePendingMessages(message as PendingMessagesMessage);
        break;

      case RelayMessageType.SIGNAL:
        this.handleSignalMessage(message as SignalMessage);
        break;

      case RelayMessageType.PRESENCE_RESPONSE:
        // Handle presence query response
        break;
    }
  }

  /**
   * Handle server state change
   */
  private handleServerStateChange(serverUrl: string, state: RelayConnectionState): void {
    if (state === 'disconnected') {
      this.eventEmitter.emit('relay:disconnected', serverUrl);
    } else if (state === 'reconnecting') {
      const server = this.servers.get(serverUrl);
      this.eventEmitter.emit(
        'relay:reconnecting',
        serverUrl,
        server ? (server as any).reconnectAttempts : 0
      );
    } else if (state === 'error') {
      this.eventEmitter.emit('relay:error', new Error('Server error'), serverUrl);
    }
  }

  /**
   * Handle incoming data message
   */
  private handleDataMessage(message: RelayDataMessage): void {
    const { from, payload, protocol } = message;

    // Get or create virtual connection
    let connection = this.connections.get(from);
    if (!connection) {
      const remotePeer = PeerIdImpl.fromAddress(from);
      const remoteAddr = MultiaddrImpl.websocket(`relay://${from}`);

      connection = new RelayConnection(
        `relay-${Date.now()}`,
        remotePeer,
        remoteAddr,
        (to, data, proto) => this.sendMessage(to, data, proto)
      );

      this.connections.set(from, connection);
      this.connectionHandlers.forEach(handler => handler(connection!));
    }

    // Decode and deliver
    const data = decodeBase64(payload);
    connection.handleMessage(protocol, data);
  }

  /**
   * Handle presence update
   */
  private handlePresenceMessage(message: PresenceMessage): void {
    this.presence.set(message.presence.peerId, message.presence);
    this.eventEmitter.emit('presence:updated', message.presence);
  }

  /**
   * Handle pending messages
   */
  private handlePendingMessages(message: PendingMessagesMessage): void {
    relayLogger.info('Received pending messages', { count: message.messages.length });

    this.eventEmitter.emit('pending:received', message.messages.length);

    for (const dataMessage of message.messages) {
      this.handleDataMessage(dataMessage);
    }
  }

  /**
   * Handle WebRTC signal
   */
  private handleSignalMessage(message: SignalMessage): void {
    this.eventEmitter.emit('signal:received', message);
  }

  /**
   * Get best available server
   */
  private getBestServer(): RelayServerConnection | null {
    for (const server of this.servers.values()) {
      if (server.state === 'connected') {
        return server;
      }
    }
    return null;
  }

  /**
   * Send message through relay
   */
  private async sendMessage(to: string, data: Uint8Array, protocol: string): Promise<void> {
    const server = this.getBestServer();
    if (!server) {
      throw new Error('No relay server available');
    }

    if (data.length > MAX_RELAY_MESSAGE_SIZE) {
      throw new Error('Message too large');
    }

    await server.sendData(to, data, protocol, false);
  }

  /**
   * Dial a peer through relay
   */
  async dial(addr: Multiaddr): Promise<Connection> {
    const peerId = addr.address;

    relayLogger.info('Dialing peer through relay', { peerId });

    // Check existing connection
    const existing = this.connections.get(peerId);
    if (existing && existing.state === 'connected') {
      return existing;
    }

    // Create virtual connection
    const remotePeer = PeerIdImpl.fromAddress(peerId);
    const connection = new RelayConnection(
      `relay-${Date.now()}`,
      remotePeer,
      addr,
      (to, data, protocol) => this.sendMessage(to, data, protocol)
    );

    this.connections.set(peerId, connection);
    this.connectionHandlers.forEach(handler => handler(connection));

    return connection;
  }

  /**
   * Get peer presence
   */
  getPresence(peerId: string): PresenceInfo | undefined {
    return this.presence.get(peerId);
  }

  /**
   * Subscribe to peer presence
   */
  subscribePresence(peerId: string): void {
    for (const server of this.servers.values()) {
      if (server.state === 'connected') {
        server.subscribePresence(peerId);
        this.eventEmitter.emit('presence:subscribed', peerId);
        return;
      }
    }
  }

  /**
   * Update own presence
   */
  updatePresence(status: 'online' | 'offline' | 'away' | 'busy'): void {
    for (const server of this.servers.values()) {
      if (server.state === 'connected') {
        server.updatePresence(status);
      }
    }
  }

  /**
   * Send WebRTC signal through relay
   */
  sendSignal(to: string, signalType: 'offer' | 'answer' | 'ice-candidate', payload: string): void {
    const server = this.getBestServer();
    if (!server) {
      throw new Error('No relay server available');
    }

    server.sendSignal(to, signalType, payload);
  }

  /**
   * Get relay server status
   */
  getServerStatus(): RelayServerStatus[] {
    return Array.from(this.servers.entries()).map(([url, server]) => ({
      url,
      state: server.state,
      sessionId: server.session || undefined,
      reconnectAttempts: (server as any).reconnectAttempts || 0,
    }));
  }

  getDiscovery(): PeerDiscovery | null {
    // Relay transport doesn't have traditional discovery
    // Presence mechanism serves similar purpose
    return null;
  }

  getConnections(): Connection[] {
    return Array.from(this.connections.values());
  }

  getConnection(peerId: string): Connection | undefined {
    return this.connections.get(peerId);
  }

  onConnection(handler: (connection: Connection) => void): void {
    this.connectionHandlers.push(handler);
  }

  onDisconnection(handler: (connection: Connection) => void): void {
    this.disconnectionHandlers.push(handler);
  }

  onError(handler: (error: Error) => void): void {
    this.errorHandlers.push(handler);
  }

  /**
   * Subscribe to relay-specific events
   */
  on<E extends keyof RelayTransportEvents>(event: E, handler: RelayTransportEvents[E]): void {
    this.eventEmitter.on(event, handler);
  }

  /**
   * Unsubscribe from events
   */
  off<E extends keyof RelayTransportEvents>(event: E, handler: RelayTransportEvents[E]): void {
    this.eventEmitter.off(event, handler);
  }
}

export default RelayTransport;
