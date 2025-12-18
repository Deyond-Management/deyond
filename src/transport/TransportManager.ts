/**
 * Deyond P2P Transport Layer - Transport Manager
 *
 * Orchestrates multiple transports and provides unified messaging API
 */

import {
  Transport,
  TransportManager as ITransportManager,
  TransportManagerConfig,
  TransportManagerEvents,
  TransportProtocol,
  Connection,
  Multiaddr as IMultiaddr,
  PeerId as IPeerId,
  DiscoveredPeer,
  TransportMessage,
} from './types';
import { PeerId, PeerStore } from './peer-id';
import { MultiaddrUtils } from './multiaddr';
import { TypedEventEmitter } from '../utils/EventEmitter';
import { logger } from '../utils';

const tmLogger = logger.child({ module: 'TransportManager' });

/**
 * Default Transport Manager configuration
 */
const DEFAULT_CONFIG: Omit<TransportManagerConfig, 'peerId'> = {
  transports: [],
  enableDiscovery: true,
  reconnection: {
    enabled: true,
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 30000,
  },
};

/**
 * Transport Manager implementation
 *
 * Manages multiple transports and provides a unified API for:
 * - Peer discovery across all transports
 * - Connection management
 * - Message routing
 */
export class TransportManager implements ITransportManager {
  public readonly config: TransportManagerConfig;
  public readonly peerId: IPeerId;

  private transports: Map<TransportProtocol, Transport> = new Map();
  private peerStore: PeerStore = new PeerStore();
  private eventEmitter = new TypedEventEmitter<TransportManagerEvents>();
  private reconnectAttempts: Map<string, number> = new Map();
  private _isRunning = false;

  constructor(peerId: IPeerId, config: Partial<Omit<TransportManagerConfig, 'peerId'>> = {}) {
    this.peerId = peerId;
    this.config = {
      peerId,
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  /**
   * Initialize all transports
   */
  async init(): Promise<void> {
    tmLogger.info('Initializing Transport Manager', { peerId: this.peerId.id });

    for (const transport of this.transports.values()) {
      try {
        await transport.init();
        this.setupTransportListeners(transport);
      } catch (error) {
        tmLogger.error(`Failed to initialize ${transport.protocol} transport`, error as Error);
        throw error;
      }
    }

    tmLogger.info('Transport Manager initialized', {
      transports: Array.from(this.transports.keys()),
    });
  }

  /**
   * Start all transports
   */
  async start(): Promise<void> {
    if (this._isRunning) return;

    tmLogger.info('Starting Transport Manager');

    for (const transport of this.transports.values()) {
      if (transport.config.enabled) {
        try {
          await transport.start();

          // Start discovery if enabled
          if (this.config.enableDiscovery) {
            const discovery = transport.getDiscovery();
            if (discovery) {
              await discovery.start();
            }
          }
        } catch (error) {
          tmLogger.error(`Failed to start ${transport.protocol} transport`, error as Error);
        }
      }
    }

    this._isRunning = true;
    tmLogger.info('Transport Manager started');
  }

  /**
   * Stop all transports
   */
  async stop(): Promise<void> {
    if (!this._isRunning) return;

    tmLogger.info('Stopping Transport Manager');

    for (const transport of this.transports.values()) {
      try {
        await transport.stop();
      } catch (error) {
        tmLogger.error(`Failed to stop ${transport.protocol} transport`, error as Error);
      }
    }

    this._isRunning = false;
    tmLogger.info('Transport Manager stopped');
  }

  /**
   * Register a transport
   */
  registerTransport(transport: Transport): void {
    if (this.transports.has(transport.protocol)) {
      tmLogger.warn(`Transport ${transport.protocol} already registered, replacing`);
    }

    this.transports.set(transport.protocol, transport);
    tmLogger.info(`Registered ${transport.protocol} transport`);
  }

  /**
   * Get all registered transports
   */
  getTransports(): Transport[] {
    return Array.from(this.transports.values());
  }

  /**
   * Get transport by protocol
   */
  getTransport(protocol: TransportProtocol): Transport | undefined {
    return this.transports.get(protocol);
  }

  /**
   * Connect to a peer
   */
  async connect(peerId: string, addrs?: IMultiaddr[]): Promise<Connection> {
    tmLogger.info('Connecting to peer', { peerId });

    // Check for existing connection
    const existing = this.getConnection(peerId);
    if (existing) {
      tmLogger.debug('Using existing connection', { peerId });
      return existing;
    }

    // Get addresses to try
    const addresses = addrs || this.getKnownAddresses(peerId);
    if (addresses.length === 0) {
      throw new Error(`No known addresses for peer: ${peerId}`);
    }

    // Sort addresses by preference
    const sortedAddrs = MultiaddrUtils.sortByPreference(addresses);

    // Try each address
    let lastError: Error | null = null;

    for (const addr of sortedAddrs) {
      const transport = this.transports.get(addr.protocol);
      if (!transport || !transport.isRunning()) {
        continue;
      }

      try {
        tmLogger.debug('Trying address', { protocol: addr.protocol, address: addr.address });
        const connection = await transport.dial(addr);

        tmLogger.info('Connected to peer', { peerId, protocol: addr.protocol });
        this.eventEmitter.emit('peer:connected', { id: peerId } as IPeerId, connection);

        return connection;
      } catch (error) {
        lastError = error as Error;
        tmLogger.debug('Failed to connect via address', {
          protocol: addr.protocol,
          error: (error as Error).message,
        });
      }
    }

    throw lastError || new Error(`Failed to connect to peer: ${peerId}`);
  }

  /**
   * Disconnect from a peer
   */
  async disconnect(peerId: string): Promise<void> {
    tmLogger.info('Disconnecting from peer', { peerId });

    for (const transport of this.transports.values()) {
      const connection = transport.getConnection(peerId);
      if (connection) {
        await connection.close();
      }
    }

    this.eventEmitter.emit('peer:disconnected', { id: peerId } as IPeerId);
  }

  /**
   * Get connection to peer (from any transport)
   */
  getConnection(peerId: string): Connection | undefined {
    for (const transport of this.transports.values()) {
      const connection = transport.getConnection(peerId);
      if (connection && connection.state === 'connected') {
        return connection;
      }
    }
    return undefined;
  }

  /**
   * Get all connections
   */
  getConnections(): Connection[] {
    const connections: Connection[] = [];
    for (const transport of this.transports.values()) {
      connections.push(...transport.getConnections());
    }
    return connections;
  }

  /**
   * Send message to peer
   */
  async send(peerId: string, protocol: string, data: Uint8Array): Promise<void> {
    const connection = this.getConnection(peerId);
    if (!connection) {
      // Try to connect first
      await this.connect(peerId);
      return this.send(peerId, protocol, data);
    }

    // Get or create stream for protocol
    let stream = connection.getStreams().find(s => s.protocol === protocol);
    if (!stream || stream.state !== 'open') {
      stream = await connection.newStream(protocol);
    }

    await stream.send(data);
    tmLogger.debug('Sent message', { peerId, protocol, size: data.length });
  }

  /**
   * Broadcast message to all connected peers
   */
  async broadcast(protocol: string, data: Uint8Array): Promise<void> {
    const connections = this.getConnections();
    const results = await Promise.allSettled(
      connections.map(async conn => {
        let stream = conn.getStreams().find(s => s.protocol === protocol);
        if (!stream || stream.state !== 'open') {
          stream = await conn.newStream(protocol);
        }
        await stream.send(data);
      })
    );

    const failed = results.filter(r => r.status === 'rejected').length;
    if (failed > 0) {
      tmLogger.warn(`Broadcast failed for ${failed}/${connections.length} peers`);
    }
  }

  /**
   * Subscribe to events
   */
  on<E extends keyof TransportManagerEvents>(event: E, handler: TransportManagerEvents[E]): void {
    this.eventEmitter.on(event, handler);
  }

  /**
   * Unsubscribe from events
   */
  off<E extends keyof TransportManagerEvents>(event: E, handler: TransportManagerEvents[E]): void {
    this.eventEmitter.off(event, handler);
  }

  /**
   * Get peer store
   */
  getPeerStore(): PeerStore {
    return this.peerStore;
  }

  /**
   * Get discovered peers from all transports
   */
  getDiscoveredPeers(): DiscoveredPeer[] {
    const peers: Map<string, DiscoveredPeer> = new Map();

    for (const transport of this.transports.values()) {
      const discovery = transport.getDiscovery();
      if (discovery && 'getDiscoveredPeers' in discovery) {
        const discovered = (discovery as any).getDiscoveredPeers() as DiscoveredPeer[];
        for (const peer of discovered) {
          const existing = peers.get(peer.peer.id);
          if (existing) {
            // Merge addresses
            existing.addrs.push(...peer.addrs);
            existing.lastSeen = Math.max(existing.lastSeen, peer.lastSeen);
          } else {
            peers.set(peer.peer.id, { ...peer });
          }
        }
      }
    }

    return Array.from(peers.values());
  }

  /**
   * Setup event listeners for a transport
   */
  private setupTransportListeners(transport: Transport): void {
    // Connection events
    transport.onConnection(connection => {
      tmLogger.info('New connection', {
        peerId: connection.remotePeer.id,
        protocol: transport.protocol,
      });
      this.eventEmitter.emit('peer:connected', connection.remotePeer, connection);

      // Setup connection state listener
      connection.onStateChange(state => {
        if (state === 'disconnected' || state === 'error') {
          this.handleDisconnection(connection);
        }
      });

      // Setup stream listener for incoming messages
      connection.onStream(stream => {
        stream.onData(data => {
          const message: TransportMessage = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            from: connection.remotePeer.id,
            protocol: stream.protocol,
            payload: data,
            timestamp: Date.now(),
            priority: 'normal',
            qos: 'reliable',
          };
          this.eventEmitter.emit('message:received', message, connection);
        });
      });
    });

    transport.onDisconnection(connection => {
      this.handleDisconnection(connection);
    });

    transport.onError(error => {
      tmLogger.error(`${transport.protocol} transport error`, error);
      this.eventEmitter.emit('error', error, transport.protocol);
    });

    // Discovery events
    const discovery = transport.getDiscovery();
    if (discovery) {
      discovery.onPeerDiscovered(peer => {
        tmLogger.debug('Peer discovered', { peerId: peer.peer.id });
        this.peerStore.add(peer.peer as PeerId);
        this.eventEmitter.emit('peer:discovered', peer);
      });

      discovery.onPeerLost(peerId => {
        tmLogger.debug('Peer lost', { peerId: peerId.id });
      });
    }
  }

  /**
   * Handle peer disconnection
   */
  private handleDisconnection(connection: Connection): void {
    const peerId = connection.remotePeer.id;
    tmLogger.info('Peer disconnected', { peerId });
    this.eventEmitter.emit('peer:disconnected', connection.remotePeer);

    // Attempt reconnection if enabled
    if (this.config.reconnection.enabled) {
      this.scheduleReconnection(peerId, connection.remoteAddr);
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnection(peerId: string, addr: IMultiaddr): void {
    const attempts = this.reconnectAttempts.get(peerId) || 0;

    if (attempts >= this.config.reconnection.maxAttempts) {
      tmLogger.info('Max reconnection attempts reached', { peerId });
      this.reconnectAttempts.delete(peerId);
      return;
    }

    const delay = Math.min(
      this.config.reconnection.baseDelay * Math.pow(2, attempts),
      this.config.reconnection.maxDelay
    );

    tmLogger.debug('Scheduling reconnection', { peerId, attempt: attempts + 1, delay });

    setTimeout(async () => {
      try {
        await this.connect(peerId, [addr]);
        this.reconnectAttempts.delete(peerId);
      } catch (error) {
        this.reconnectAttempts.set(peerId, attempts + 1);
        this.scheduleReconnection(peerId, addr);
      }
    }, delay);

    this.reconnectAttempts.set(peerId, attempts + 1);
  }

  /**
   * Get known addresses for a peer
   */
  private getKnownAddresses(peerId: string): IMultiaddr[] {
    const discovered = this.getDiscoveredPeers();
    const peer = discovered.find(p => p.peer.id === peerId);
    return peer?.addrs || [];
  }
}

export default TransportManager;
