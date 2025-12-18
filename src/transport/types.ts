/**
 * Deyond P2P Transport Layer - Type Definitions
 *
 * Modular transport abstraction inspired by libp2p
 * Designed to be extracted as an independent library
 *
 * @packageDocumentation
 */

/**
 * Unique identifier for a peer in the network
 */
export interface PeerId {
  /** Unique identifier string (e.g., public key hash) */
  id: string;
  /** Human-readable name (optional) */
  name?: string;
  /** Public key for verification */
  publicKey?: Uint8Array;
}

/**
 * Multiaddress-like addressing for different transports
 * Format: /<protocol>/<address>
 * Examples:
 *   /ble/<device-uuid>
 *   /webrtc/<sdp-offer>
 *   /tcp/192.168.1.1/9000
 */
export interface Multiaddr {
  /** Full address string */
  toString(): string;
  /** Protocol identifier (ble, webrtc, tcp, etc.) */
  protocol: TransportProtocol;
  /** Protocol-specific address data */
  address: string;
  /** Additional options */
  options?: Record<string, unknown>;
}

/**
 * Supported transport protocols
 */
export type TransportProtocol = 'ble' | 'webrtc' | 'tcp' | 'websocket' | 'custom';

/**
 * Connection state
 */
export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'disconnecting'
  | 'error';

/**
 * Stream state
 */
export type StreamState = 'open' | 'closing' | 'closed' | 'error';

/**
 * Quality of Service levels
 */
export type QoS = 'best-effort' | 'reliable' | 'ordered';

/**
 * Message priority
 */
export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Represents a data stream within a connection
 * Allows multiplexing multiple logical streams over one connection
 */
export interface Stream {
  /** Unique stream identifier */
  id: string;
  /** Protocol identifier for this stream */
  protocol: string;
  /** Current stream state */
  state: StreamState;
  /** Associated connection */
  connection: Connection;

  /** Send data through the stream */
  send(data: Uint8Array): Promise<void>;
  /** Close the stream */
  close(): Promise<void>;
  /** Abort the stream with error */
  abort(error?: Error): void;

  /** Data received event */
  onData(handler: (data: Uint8Array) => void): void;
  /** Stream closed event */
  onClose(handler: () => void): void;
  /** Error event */
  onError(handler: (error: Error) => void): void;
}

/**
 * Represents a connection to a remote peer
 */
export interface Connection {
  /** Unique connection identifier */
  id: string;
  /** Remote peer information */
  remotePeer: PeerId;
  /** Remote address */
  remoteAddr: Multiaddr;
  /** Local address */
  localAddr?: Multiaddr;
  /** Current connection state */
  state: ConnectionState;
  /** Transport protocol used */
  protocol: TransportProtocol;
  /** Connection statistics */
  stats: ConnectionStats;
  /** Connection metadata */
  metadata: Record<string, unknown>;

  /** Open a new stream for a protocol */
  newStream(protocol: string): Promise<Stream>;
  /** Get existing streams */
  getStreams(): Stream[];
  /** Close the connection */
  close(): Promise<void>;

  /** Connection state change event */
  onStateChange(handler: (state: ConnectionState) => void): void;
  /** New incoming stream event */
  onStream(handler: (stream: Stream) => void): void;
}

/**
 * Connection statistics
 */
export interface ConnectionStats {
  /** Connection established timestamp */
  connectedAt: number;
  /** Total bytes sent */
  bytesSent: number;
  /** Total bytes received */
  bytesReceived: number;
  /** Number of messages sent */
  messagesSent: number;
  /** Number of messages received */
  messagesReceived: number;
  /** Round-trip time in ms (if available) */
  rtt?: number;
  /** Signal strength (for wireless connections) */
  signalStrength?: number;
}

/**
 * Discovered peer information
 */
export interface DiscoveredPeer {
  /** Peer identifier */
  peer: PeerId;
  /** Available addresses */
  addrs: Multiaddr[];
  /** Discovery timestamp */
  discoveredAt: number;
  /** Last seen timestamp */
  lastSeen: number;
  /** Signal strength (for BLE) */
  rssi?: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Peer discovery interface
 */
export interface PeerDiscovery {
  /** Start discovering peers */
  start(): Promise<void>;
  /** Stop discovering peers */
  stop(): Promise<void>;
  /** Check if discovery is active */
  isActive(): boolean;

  /** New peer discovered event */
  onPeerDiscovered(handler: (peer: DiscoveredPeer) => void): void;
  /** Peer lost (no longer visible) event */
  onPeerLost(handler: (peerId: PeerId) => void): void;
}

/**
 * Transport configuration
 */
export interface TransportConfig {
  /** Enable/disable the transport */
  enabled: boolean;
  /** Maximum concurrent connections */
  maxConnections?: number;
  /** Connection timeout in ms */
  connectionTimeout?: number;
  /** Idle timeout in ms */
  idleTimeout?: number;
  /** Protocol-specific options */
  options?: Record<string, unknown>;
}

/**
 * Transport interface - base for all transport implementations
 */
export interface Transport {
  /** Transport protocol identifier */
  readonly protocol: TransportProtocol;
  /** Transport configuration */
  readonly config: TransportConfig;

  /** Initialize the transport */
  init(): Promise<void>;
  /** Start the transport (begin accepting connections) */
  start(): Promise<void>;
  /** Stop the transport */
  stop(): Promise<void>;
  /** Check if transport is running */
  isRunning(): boolean;

  /** Dial a remote peer */
  dial(addr: Multiaddr): Promise<Connection>;
  /** Get peer discovery for this transport */
  getDiscovery(): PeerDiscovery | null;
  /** Get active connections */
  getConnections(): Connection[];
  /** Get connection by peer ID */
  getConnection(peerId: string): Connection | undefined;

  /** New connection event (incoming) */
  onConnection(handler: (connection: Connection) => void): void;
  /** Connection closed event */
  onDisconnection(handler: (connection: Connection) => void): void;
  /** Transport error event */
  onError(handler: (error: Error) => void): void;
}

/**
 * Message envelope for transport
 */
export interface TransportMessage {
  /** Message ID */
  id: string;
  /** Sender peer ID */
  from: string;
  /** Recipient peer ID (optional for broadcast) */
  to?: string;
  /** Protocol identifier */
  protocol: string;
  /** Message payload */
  payload: Uint8Array;
  /** Timestamp */
  timestamp: number;
  /** Priority */
  priority: MessagePriority;
  /** Quality of Service */
  qos: QoS;
  /** TTL in seconds (for store-and-forward) */
  ttl?: number;
}

/**
 * Transport manager configuration
 */
export interface TransportManagerConfig {
  /** Local peer ID */
  peerId: PeerId;
  /** Registered transports */
  transports: TransportConfig[];
  /** Enable automatic peer discovery */
  enableDiscovery: boolean;
  /** Reconnection settings */
  reconnection: {
    enabled: boolean;
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
  };
}

/**
 * Events emitted by transport manager
 */
export interface TransportManagerEvents {
  'peer:discovered': (peer: DiscoveredPeer) => void;
  'peer:connected': (peerId: PeerId, connection: Connection) => void;
  'peer:disconnected': (peerId: PeerId) => void;
  'message:received': (message: TransportMessage, connection: Connection) => void;
  error: (error: Error, context?: string) => void;
  // Index signature for TypedEventEmitter compatibility
  [key: string]: (...args: any[]) => void;
}

/**
 * Transport manager interface
 */
export interface TransportManager {
  /** Configuration */
  readonly config: TransportManagerConfig;
  /** Local peer ID */
  readonly peerId: PeerId;

  /** Initialize all transports */
  init(): Promise<void>;
  /** Start all transports */
  start(): Promise<void>;
  /** Stop all transports */
  stop(): Promise<void>;

  /** Register a transport */
  registerTransport(transport: Transport): void;
  /** Get registered transports */
  getTransports(): Transport[];
  /** Get transport by protocol */
  getTransport(protocol: TransportProtocol): Transport | undefined;

  /** Connect to a peer */
  connect(peerId: string, addrs?: Multiaddr[]): Promise<Connection>;
  /** Disconnect from a peer */
  disconnect(peerId: string): Promise<void>;
  /** Get connection to peer */
  getConnection(peerId: string): Connection | undefined;
  /** Get all connections */
  getConnections(): Connection[];

  /** Send message to peer */
  send(peerId: string, protocol: string, data: Uint8Array): Promise<void>;
  /** Broadcast message to all connected peers */
  broadcast(protocol: string, data: Uint8Array): Promise<void>;

  /** Subscribe to events */
  on<E extends keyof TransportManagerEvents>(event: E, handler: TransportManagerEvents[E]): void;
  /** Unsubscribe from events */
  off<E extends keyof TransportManagerEvents>(event: E, handler: TransportManagerEvents[E]): void;
}

// Type aliases for cleaner imports
export type ITransportManager = TransportManager;
export type IPeerId = PeerId;
export type IMultiaddr = Multiaddr;
