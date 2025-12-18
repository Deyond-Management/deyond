/**
 * TCP Transport Implementation
 *
 * Direct TCP connections for LAN P2P messaging
 *
 * Features:
 * - Direct socket connections
 * - Stream multiplexing over single connection
 * - Optional TLS encryption
 * - mDNS service discovery
 * - Keep-alive management
 *
 * Note: React Native doesn't have native TCP support.
 * This implementation uses react-native-tcp-socket or similar library.
 * For platforms without TCP support, use BLE or WebRTC instead.
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
  TCPTransportConfig,
  TCPTransportEvents,
  TCPConnectionState,
  TCPSocketInfo,
  TCPMessageFrame,
  TCPMessageType,
  TCPFrameFlags,
  TCPHandshake,
  MDNSService,
  DEFAULT_TCP_CONFIG,
  FRAME_HEADER_SIZE,
  MAX_FRAME_PAYLOAD_SIZE,
  PROTOCOL_VERSION,
  PROTOCOL_MAGIC,
} from './types';

const tcpLogger = logger.child({ module: 'TCPTransport' });

// =============================================================================
// Frame Encoding/Decoding
// =============================================================================

/**
 * Encode a TCP message frame
 */
function encodeFrame(frame: TCPMessageFrame): Uint8Array {
  const buffer = new Uint8Array(FRAME_HEADER_SIZE + frame.payload.length);
  const view = new DataView(buffer.buffer);

  let offset = 0;
  view.setUint8(offset++, frame.version);
  view.setUint8(offset++, frame.type);
  view.setUint32(offset, frame.streamId);
  offset += 4;
  view.setUint32(offset, frame.sequence);
  offset += 4;
  view.setUint8(offset++, frame.flags);
  view.setUint32(offset, frame.payload.length);
  offset += 4;

  buffer.set(frame.payload, offset);

  return buffer;
}

/**
 * Decode a TCP message frame header
 */
function decodeFrameHeader(buffer: Uint8Array): Omit<TCPMessageFrame, 'payload'> | null {
  if (buffer.length < FRAME_HEADER_SIZE) {
    return null;
  }

  const view = new DataView(buffer.buffer, buffer.byteOffset);

  let offset = 0;
  const version = view.getUint8(offset++);
  const type = view.getUint8(offset++);
  const streamId = view.getUint32(offset);
  offset += 4;
  const sequence = view.getUint32(offset);
  offset += 4;
  const flags = view.getUint8(offset++);
  const length = view.getUint32(offset);

  return { version, type, streamId, sequence, flags, length };
}

// =============================================================================
// TCP Stream Implementation
// =============================================================================

/**
 * TCP multiplexed stream
 */
export class TCPStream implements Stream {
  readonly id: string;
  readonly protocol: string;
  readonly connection: Connection;

  private _state: StreamState = 'open';
  private streamId: number;
  private sequence: number = 0;
  private sendFn: (frame: TCPMessageFrame) => Promise<void>;

  private dataHandlers: ((data: Uint8Array) => void)[] = [];
  private closeHandlers: (() => void)[] = [];
  private errorHandlers: ((error: Error) => void)[] = [];

  constructor(
    id: string,
    protocol: string,
    connection: Connection,
    streamId: number,
    sendFn: (frame: TCPMessageFrame) => Promise<void>
  ) {
    this.id = id;
    this.protocol = protocol;
    this.connection = connection;
    this.streamId = streamId;
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

    // Fragment large messages
    const chunks = this.fragmentData(data);

    for (let i = 0; i < chunks.length; i++) {
      const isLast = i === chunks.length - 1;
      await this.sendFn({
        version: PROTOCOL_VERSION,
        type: TCPMessageType.DATA,
        streamId: this.streamId,
        sequence: this.sequence++,
        flags: isLast ? TCPFrameFlags.END_STREAM : 0,
        length: chunks[i].length,
        payload: chunks[i],
      });
    }
  }

  private fragmentData(data: Uint8Array): Uint8Array[] {
    if (data.length <= MAX_FRAME_PAYLOAD_SIZE) {
      return [data];
    }

    const chunks: Uint8Array[] = [];
    let offset = 0;

    while (offset < data.length) {
      const end = Math.min(offset + MAX_FRAME_PAYLOAD_SIZE, data.length);
      chunks.push(data.slice(offset, end));
      offset = end;
    }

    return chunks;
  }

  async close(): Promise<void> {
    if (this._state === 'closed') return;

    this._state = 'closing';

    await this.sendFn({
      version: PROTOCOL_VERSION,
      type: TCPMessageType.STREAM_CLOSE,
      streamId: this.streamId,
      sequence: this.sequence++,
      flags: 0,
      length: 0,
      payload: new Uint8Array(0),
    });

    this._state = 'closed';
    this.closeHandlers.forEach(handler => handler());
  }

  abort(error?: Error): void {
    this._state = 'error';

    // Send reset (fire and forget)
    this.sendFn({
      version: PROTOCOL_VERSION,
      type: TCPMessageType.STREAM_RESET,
      streamId: this.streamId,
      sequence: this.sequence++,
      flags: 0,
      length: 0,
      payload: new Uint8Array(0),
    }).catch(() => {
      /* ignore */
    });

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
// TCP Connection Implementation
// =============================================================================

/**
 * TCP Connection wrapper
 */
export class TCPConnection implements Connection {
  readonly id: string;
  readonly remotePeer: PeerId;
  readonly remoteAddr: Multiaddr;
  readonly localAddr?: Multiaddr;
  readonly protocol: TransportProtocol = 'tcp';

  private _state: ConnectionState = 'disconnected';
  private _stats: ConnectionStats;
  private _metadata: Record<string, unknown> = {};
  private streams: Map<string, TCPStream> = new Map();
  private streamIdCounter: number = 0;

  // Socket abstraction (platform-specific)
  private socket: TCPSocket | null = null;
  private receiveBuffer: Uint8Array = new Uint8Array(0);

  private stateChangeHandlers: ((state: ConnectionState) => void)[] = [];
  private streamHandlers: ((stream: Stream) => void)[] = [];

  constructor(
    id: string,
    remotePeer: PeerId,
    remoteAddr: Multiaddr,
    socket: TCPSocket,
    localAddr?: Multiaddr
  ) {
    this.id = id;
    this.remotePeer = remotePeer;
    this.remoteAddr = remoteAddr;
    this.localAddr = localAddr;
    this.socket = socket;

    this._stats = {
      connectedAt: Date.now(),
      bytesSent: 0,
      bytesReceived: 0,
      messagesSent: 0,
      messagesReceived: 0,
    };

    this.setupSocketEvents();
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

  private updateState(state: ConnectionState): void {
    if (this._state !== state) {
      this._state = state;
      this.stateChangeHandlers.forEach(handler => handler(state));
    }
  }

  private setupSocketEvents(): void {
    if (!this.socket) return;

    this.socket.onData(data => {
      this.handleIncomingData(data);
    });

    this.socket.onClose(() => {
      this.updateState('disconnected');
    });

    this.socket.onError(error => {
      tcpLogger.error('Socket error', error);
      this.updateState('error');
    });

    this.updateState('connected');
  }

  /**
   * Handle incoming socket data
   */
  private handleIncomingData(data: Uint8Array): void {
    this._stats.bytesReceived += data.length;

    // Append to receive buffer
    const newBuffer = new Uint8Array(this.receiveBuffer.length + data.length);
    newBuffer.set(this.receiveBuffer);
    newBuffer.set(data, this.receiveBuffer.length);
    this.receiveBuffer = newBuffer;

    // Process complete frames
    while (this.processNextFrame()) {
      // Continue processing
    }
  }

  /**
   * Process the next complete frame from buffer
   */
  private processNextFrame(): boolean {
    if (this.receiveBuffer.length < FRAME_HEADER_SIZE) {
      return false;
    }

    const header = decodeFrameHeader(this.receiveBuffer);
    if (!header) {
      return false;
    }

    const totalLength = FRAME_HEADER_SIZE + header.length;
    if (this.receiveBuffer.length < totalLength) {
      return false;
    }

    // Extract frame
    const payload = this.receiveBuffer.slice(FRAME_HEADER_SIZE, totalLength);
    this.receiveBuffer = this.receiveBuffer.slice(totalLength);

    const frame: TCPMessageFrame = {
      ...header,
      payload,
    };

    this.handleFrame(frame);
    this._stats.messagesReceived++;

    return true;
  }

  /**
   * Handle a decoded frame
   */
  private handleFrame(frame: TCPMessageFrame): void {
    switch (frame.type) {
      case TCPMessageType.DATA:
        this.handleDataFrame(frame);
        break;
      case TCPMessageType.STREAM_OPEN:
        this.handleStreamOpen(frame);
        break;
      case TCPMessageType.STREAM_ACK:
        this.handleStreamAck(frame);
        break;
      case TCPMessageType.STREAM_CLOSE:
        this.handleStreamClose(frame);
        break;
      case TCPMessageType.PING:
        this.handlePing(frame);
        break;
      case TCPMessageType.PONG:
        // Handle pong
        break;
      default:
        tcpLogger.warn('Unknown frame type', { type: frame.type });
    }
  }

  private handleDataFrame(frame: TCPMessageFrame): void {
    const stream = this.findStreamById(frame.streamId);
    if (stream) {
      stream.handleData(frame.payload);
    }
  }

  private handleStreamOpen(frame: TCPMessageFrame): void {
    // Decode protocol from payload
    const protocol = new TextDecoder().decode(frame.payload);

    const stream = new TCPStream(
      `tcp-stream-${frame.streamId}`,
      protocol,
      this,
      frame.streamId,
      f => this.sendFrame(f)
    );

    this.streams.set(stream.id, stream);

    // Send ACK
    this.sendFrame({
      version: PROTOCOL_VERSION,
      type: TCPMessageType.STREAM_ACK,
      streamId: frame.streamId,
      sequence: 0,
      flags: TCPFrameFlags.ACK,
      length: 0,
      payload: new Uint8Array(0),
    });

    this.streamHandlers.forEach(handler => handler(stream));
  }

  private handleStreamAck(frame: TCPMessageFrame): void {
    // Stream acknowledged - could trigger pending callbacks
  }

  private handleStreamClose(frame: TCPMessageFrame): void {
    const stream = this.findStreamById(frame.streamId);
    if (stream) {
      stream.handleClose();
      this.streams.delete(stream.id);
    }
  }

  private handlePing(frame: TCPMessageFrame): void {
    // Respond with pong
    this.sendFrame({
      version: PROTOCOL_VERSION,
      type: TCPMessageType.PONG,
      streamId: 0,
      sequence: frame.sequence,
      flags: 0,
      length: 0,
      payload: new Uint8Array(0),
    });
  }

  private findStreamById(streamId: number): TCPStream | undefined {
    for (const stream of this.streams.values()) {
      if ((stream as any).streamId === streamId) {
        return stream;
      }
    }
    return undefined;
  }

  /**
   * Send a frame over the socket
   */
  private async sendFrame(frame: TCPMessageFrame): Promise<void> {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    const data = encodeFrame(frame);
    await this.socket.write(data);

    this._stats.bytesSent += data.length;
    this._stats.messagesSent++;
  }

  async newStream(protocol: string): Promise<Stream> {
    if (this._state !== 'connected') {
      throw new Error('Connection not established');
    }

    const streamId = ++this.streamIdCounter;

    const stream = new TCPStream(`tcp-stream-${streamId}`, protocol, this, streamId, f =>
      this.sendFrame(f)
    );

    // Send stream open request
    const protocolBytes = new TextEncoder().encode(protocol);
    await this.sendFrame({
      version: PROTOCOL_VERSION,
      type: TCPMessageType.STREAM_OPEN,
      streamId,
      sequence: 0,
      flags: 0,
      length: protocolBytes.length,
      payload: protocolBytes,
    });

    this.streams.set(stream.id, stream);
    return stream;
  }

  getStreams(): Stream[] {
    return Array.from(this.streams.values());
  }

  async close(): Promise<void> {
    if (this._state === 'disconnected') return;

    this.updateState('disconnecting');

    // Close all streams
    for (const stream of this.streams.values()) {
      await stream.close();
    }
    this.streams.clear();

    // Send GOAWAY and close socket
    if (this.socket) {
      try {
        await this.sendFrame({
          version: PROTOCOL_VERSION,
          type: TCPMessageType.GOAWAY,
          streamId: 0,
          sequence: 0,
          flags: 0,
          length: 0,
          payload: new Uint8Array(0),
        });
      } catch {
        // Ignore send errors during close
      }

      this.socket.close();
      this.socket = null;
    }

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
// Socket Abstraction
// =============================================================================

/**
 * TCP Socket interface (platform abstraction)
 */
export interface TCPSocket {
  connect(host: string, port: number): Promise<void>;
  write(data: Uint8Array): Promise<void>;
  close(): void;
  onData(handler: (data: Uint8Array) => void): void;
  onClose(handler: () => void): void;
  onError(handler: (error: Error) => void): void;
}

/**
 * TCP Server interface (platform abstraction)
 */
export interface TCPServer {
  listen(port: number, host?: string): Promise<{ address: string; port: number }>;
  close(): void;
  onConnection(handler: (socket: TCPSocket, info: TCPSocketInfo) => void): void;
  onError(handler: (error: Error) => void): void;
}

/**
 * Socket factory for platform-specific implementation
 */
export interface TCPSocketFactory {
  createSocket(): TCPSocket;
  createServer(): TCPServer;
}

// =============================================================================
// mDNS Discovery
// =============================================================================

/**
 * mDNS Peer Discovery for LAN
 */
export class TCPMDNSDiscovery implements PeerDiscovery {
  private _isActive = false;
  private services: Map<string, MDNSService> = new Map();
  private discoveryHandlers: ((peer: DiscoveredPeer) => void)[] = [];
  private lostHandlers: ((peerId: PeerId) => void)[] = [];

  // mDNS implementation would be platform-specific
  private mdns: any = null;

  constructor(private serviceName: string) {}

  async start(): Promise<void> {
    if (this._isActive) return;

    tcpLogger.info('Starting mDNS discovery', { serviceName: this.serviceName });

    // Platform-specific mDNS initialization would go here
    // For React Native, could use react-native-zeroconf

    this._isActive = true;
  }

  async stop(): Promise<void> {
    if (!this._isActive) return;

    tcpLogger.info('Stopping mDNS discovery');

    // Stop mDNS browser
    if (this.mdns) {
      // this.mdns.stop();
      this.mdns = null;
    }

    this.services.clear();
    this._isActive = false;
  }

  isActive(): boolean {
    return this._isActive;
  }

  /**
   * Handle discovered service
   */
  handleServiceFound(service: MDNSService): void {
    if (this.services.has(service.name)) {
      return;
    }

    this.services.set(service.name, service);

    // Extract peer info from TXT records
    const peerId = service.txt['peer-id'] || service.name;
    const publicKeyHex = service.txt['public-key'];
    const publicKey = publicKeyHex
      ? new Uint8Array(publicKeyHex.match(/.{1,2}/g)?.map(b => parseInt(b, 16)) || [])
      : undefined;

    const peer: DiscoveredPeer = {
      peer: {
        id: peerId,
        name: service.txt['name'] || service.name,
        publicKey,
      },
      addrs: service.addresses.map(addr => MultiaddrImpl.tcp(addr, service.port)),
      discoveredAt: Date.now(),
      lastSeen: Date.now(),
      metadata: {
        mdnsService: service.name,
        ...service.txt,
      },
    };

    this.discoveryHandlers.forEach(handler => handler(peer));
  }

  /**
   * Handle lost service
   */
  handleServiceLost(serviceName: string): void {
    const service = this.services.get(serviceName);
    if (!service) return;

    this.services.delete(serviceName);

    const peerId: PeerId = {
      id: service.txt['peer-id'] || serviceName,
      name: service.txt['name'],
    };

    this.lostHandlers.forEach(handler => handler(peerId));
  }

  onPeerDiscovered(handler: (peer: DiscoveredPeer) => void): void {
    this.discoveryHandlers.push(handler);
  }

  onPeerLost(handler: (peerId: PeerId) => void): void {
    this.lostHandlers.push(handler);
  }
}

// =============================================================================
// TCP Transport Implementation
// =============================================================================

/**
 * TCP Transport
 *
 * Direct TCP connections for LAN P2P messaging
 */
export class TCPTransport implements Transport {
  readonly protocol: TransportProtocol = 'tcp';
  readonly config: TCPTransportConfig;

  private _isRunning = false;
  private connections: Map<string, TCPConnection> = new Map();
  private server: TCPServer | null = null;
  private discovery: TCPMDNSDiscovery | null = null;
  private socketFactory: TCPSocketFactory | null = null;
  private localPeerId: string = '';

  private eventEmitter = new TypedEventEmitter<TCPTransportEvents>();
  private connectionHandlers: ((connection: Connection) => void)[] = [];
  private disconnectionHandlers: ((connection: Connection) => void)[] = [];
  private errorHandlers: ((error: Error) => void)[] = [];

  constructor(config: Partial<TCPTransportConfig> = {}, socketFactory?: TCPSocketFactory) {
    this.config = {
      ...DEFAULT_TCP_CONFIG,
      ...config,
    };
    this.socketFactory = socketFactory || null;
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
   * Set socket factory (for platform-specific implementation)
   */
  setSocketFactory(factory: TCPSocketFactory): void {
    this.socketFactory = factory;
  }

  async init(): Promise<void> {
    tcpLogger.info('Initializing TCP Transport');

    if (!this.socketFactory) {
      tcpLogger.warn('No socket factory provided - TCP transport will be limited');
    }

    // Initialize mDNS discovery if enabled
    if (this.config.enableMdns && this.config.mdnsServiceName) {
      this.discovery = new TCPMDNSDiscovery(this.config.mdnsServiceName);
    }
  }

  async start(): Promise<void> {
    if (this._isRunning) return;

    tcpLogger.info('Starting TCP Transport');

    // Start server if socket factory is available
    if (this.socketFactory && this.config.listenPort !== undefined) {
      this.server = this.socketFactory.createServer();

      this.server.onConnection((socket, info) => {
        this.handleIncomingConnection(socket, info);
      });

      this.server.onError(error => {
        tcpLogger.error('Server error', error);
        this.errorHandlers.forEach(handler => handler(error));
      });

      const { address, port } = await this.server.listen(
        this.config.listenPort,
        this.config.bindAddress
      );

      tcpLogger.info('TCP server listening', { address, port });
      this.eventEmitter.emit('server:listening', address, port);
    }

    // Start mDNS discovery
    if (this.discovery) {
      await this.discovery.start();
    }

    this._isRunning = true;
    tcpLogger.info('TCP Transport started');
  }

  async stop(): Promise<void> {
    if (!this._isRunning) return;

    tcpLogger.info('Stopping TCP Transport');

    // Stop discovery
    if (this.discovery) {
      await this.discovery.stop();
    }

    // Close all connections
    for (const connection of this.connections.values()) {
      await connection.close();
    }
    this.connections.clear();

    // Stop server
    if (this.server) {
      this.server.close();
      this.server = null;
      this.eventEmitter.emit('server:closed');
    }

    this._isRunning = false;
    tcpLogger.info('TCP Transport stopped');
  }

  /**
   * Handle incoming connection
   */
  private handleIncomingConnection(socket: TCPSocket, info: TCPSocketInfo): void {
    tcpLogger.info('Incoming connection', { from: info.remoteAddress });

    const remotePeer = PeerIdImpl.fromAddress(`${info.remoteAddress}:${info.remotePort}`);
    const remoteAddr = MultiaddrImpl.tcp(info.remoteAddress, info.remotePort);
    const localAddr = MultiaddrImpl.tcp(info.localAddress, info.localPort);

    const connection = new TCPConnection(
      `tcp-${Date.now()}`,
      remotePeer,
      remoteAddr,
      socket,
      localAddr
    );

    this.connections.set(remotePeer.id, connection);

    connection.onStateChange(state => {
      if (state === 'disconnected' || state === 'error') {
        this.disconnectionHandlers.forEach(handler => handler(connection));
        this.connections.delete(remotePeer.id);
      }
    });

    this.connectionHandlers.forEach(handler => handler(connection));
    this.eventEmitter.emit('socket:connected', info);
  }

  async dial(addr: Multiaddr): Promise<Connection> {
    if (!this.socketFactory) {
      throw new Error('Socket factory not available');
    }

    const [host, portStr] = addr.address.split(':');
    const port = parseInt(portStr, 10);

    tcpLogger.info('Dialing', { host, port });

    const socket = this.socketFactory.createSocket();

    // Connect with timeout
    const connectPromise = socket.connect(host, port);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), this.config.connectionTimeout);
    });

    await Promise.race([connectPromise, timeoutPromise]);

    const remotePeer = PeerIdImpl.fromAddress(addr.address);
    const connection = new TCPConnection(`tcp-${Date.now()}`, remotePeer, addr, socket);

    this.connections.set(remotePeer.id, connection);

    connection.onStateChange(state => {
      if (state === 'disconnected' || state === 'error') {
        this.disconnectionHandlers.forEach(handler => handler(connection));
        this.connections.delete(remotePeer.id);
      }
    });

    this.connectionHandlers.forEach(handler => handler(connection));

    return connection;
  }

  getDiscovery(): PeerDiscovery | null {
    return this.discovery;
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
   * Subscribe to TCP-specific events
   */
  on<E extends keyof TCPTransportEvents>(event: E, handler: TCPTransportEvents[E]): void {
    this.eventEmitter.on(event, handler);
  }

  /**
   * Unsubscribe from events
   */
  off<E extends keyof TCPTransportEvents>(event: E, handler: TCPTransportEvents[E]): void {
    this.eventEmitter.off(event, handler);
  }
}

export default TCPTransport;
