/**
 * DeyondCrypt Transport Bridge
 *
 * Bridges the P2P Transport layer with the DeyondCrypt encryption layer
 * Handles encrypted message sending/receiving over various transports
 */

import {
  TransportManager,
  BLETransport,
  PeerId,
  Multiaddr,
  Connection,
  TransportMessage,
  DiscoveredPeer,
} from '../../transport';
/**
 * Interface for the DeyondCrypt encryption service
 * This allows the TransportBridge to work with any compatible implementation
 */
export interface IDeyondCryptService {
  getMyAddress(): string | null;
  getMyChainType(): 'evm' | 'cosmos';
  getMyPreKeyBundle(): Promise<any>;
  encryptMessage(
    address: string,
    chainType: 'evm' | 'cosmos',
    content: string
  ): Promise<Uint8Array>;
  decryptMessage(address: string, chainType: 'evm' | 'cosmos', data: Uint8Array): Promise<string>;
  processPreKeyBundle(bundle: any): Promise<void>;
}
import { EventEmitter } from '../../utils/EventEmitter';
import { logger } from '../../utils';

const bridgeLogger = logger.child({ module: 'TransportBridge' });

/**
 * Protocol identifier for DeyondCrypt messages
 */
const DEYONDCRYPT_PROTOCOL = '/deyondcrypt/1.0.0';

/**
 * Message types for the protocol
 */
export enum DeyondCryptMessageType {
  /** Encrypted chat message */
  CHAT = 0x01,
  /** Pre-key bundle exchange */
  PREKEY_BUNDLE = 0x02,
  /** Session establishment */
  SESSION_INIT = 0x03,
  /** Acknowledgment */
  ACK = 0x04,
  /** Typing indicator */
  TYPING = 0x05,
  /** Read receipt */
  READ = 0x06,
}

/**
 * Protocol message envelope
 */
export interface ProtocolMessage {
  type: DeyondCryptMessageType;
  id: string;
  timestamp: number;
  payload: Uint8Array;
}

/**
 * Bridge events
 */
export interface TransportBridgeEvents {
  message: (from: string, content: string, metadata: any) => void;
  'prekey-bundle': (from: string, bundle: any) => void;
  'peer-discovered': (peer: DiscoveredPeer) => void;
  'peer-connected': (peerId: string) => void;
  'peer-disconnected': (peerId: string) => void;
  error: (error: Error) => void;
}

/**
 * Transport Bridge configuration
 */
export interface TransportBridgeConfig {
  /** Enable BLE transport */
  enableBLE: boolean;
  /** Enable WebRTC transport (future) */
  enableWebRTC: boolean;
  /** Auto-connect to discovered peers */
  autoConnect: boolean;
  /** Message queue settings */
  queue: {
    maxSize: number;
    retryAttempts: number;
    retryDelay: number;
  };
}

const DEFAULT_CONFIG: TransportBridgeConfig = {
  enableBLE: true,
  enableWebRTC: false,
  autoConnect: false,
  queue: {
    maxSize: 100,
    retryAttempts: 3,
    retryDelay: 1000,
  },
};

/**
 * DeyondCrypt Transport Bridge
 *
 * Provides a high-level API for sending/receiving encrypted messages
 * over the P2P transport layer.
 */
export class TransportBridge {
  private cryptService: IDeyondCryptService;
  private transportManager: TransportManager | null = null;
  private config: TransportBridgeConfig;
  private eventEmitter = new EventEmitter();
  private messageQueue: Map<string, ProtocolMessage[]> = new Map();
  private _isInitialized = false;

  constructor(cryptService: IDeyondCryptService, config: Partial<TransportBridgeConfig> = {}) {
    this.cryptService = cryptService;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize the transport bridge
   */
  async initialize(): Promise<void> {
    if (this._isInitialized) return;

    bridgeLogger.info('Initializing Transport Bridge');

    // Get my peer ID from DeyondCrypt address
    const myAddress = this.cryptService.getMyAddress();
    const myChainType = this.cryptService.getMyChainType();

    if (!myAddress) {
      throw new Error('DeyondCrypt service not initialized - no address');
    }

    const myPeerId = PeerId.fromAddress(myAddress, myChainType);
    bridgeLogger.info('Created peer ID', { peerId: myPeerId.toString() });

    // Create transport manager
    this.transportManager = new TransportManager(myPeerId, {
      enableDiscovery: true,
      reconnection: {
        enabled: true,
        maxAttempts: 5,
        baseDelay: 1000,
        maxDelay: 30000,
      },
    });

    // Register transports
    if (this.config.enableBLE) {
      const bleTransport = new BLETransport({
        enabled: true,
        advertise: true,
        advertiseName: `Deyond-${myAddress.slice(-6)}`,
      });
      this.transportManager.registerTransport(bleTransport);
    }

    // Setup event handlers
    this.setupEventHandlers();

    // Initialize and start transport manager
    await this.transportManager.init();
    await this.transportManager.start();

    this._isInitialized = true;
    bridgeLogger.info('Transport Bridge initialized');
  }

  /**
   * Shutdown the transport bridge
   */
  async shutdown(): Promise<void> {
    if (!this._isInitialized) return;

    bridgeLogger.info('Shutting down Transport Bridge');

    await this.transportManager?.stop();
    this.messageQueue.clear();

    this._isInitialized = false;
  }

  /**
   * Send encrypted message to a peer
   */
  async sendMessage(
    recipientAddress: string,
    content: string,
    chainType: 'evm' | 'cosmos' = 'evm'
  ): Promise<{ messageId: string }> {
    if (!this._isInitialized) {
      throw new Error('Transport Bridge not initialized');
    }

    const peerId = `${chainType}:${recipientAddress.toLowerCase()}`;
    bridgeLogger.info('Sending message', { to: peerId });

    // Encrypt message using DeyondCrypt
    const encryptedData = await this.cryptService.encryptMessage(
      recipientAddress,
      chainType,
      content
    );

    // Create protocol message
    const messageId = this.generateMessageId();
    const protocolMessage: ProtocolMessage = {
      type: DeyondCryptMessageType.CHAT,
      id: messageId,
      timestamp: Date.now(),
      payload: encryptedData,
    };

    // Serialize and send
    const serialized = this.serializeMessage(protocolMessage);

    try {
      await this.transportManager!.send(peerId, DEYONDCRYPT_PROTOCOL, serialized);
      bridgeLogger.info('Message sent', { messageId, to: peerId });
    } catch (error) {
      // Queue for retry
      this.queueMessage(peerId, protocolMessage);
      bridgeLogger.warn('Message queued for retry', { messageId, to: peerId });
    }

    return { messageId };
  }

  /**
   * Share pre-key bundle with a peer
   */
  async sharePreKeyBundle(
    recipientAddress: string,
    chainType: 'evm' | 'cosmos' = 'evm'
  ): Promise<void> {
    if (!this._isInitialized) {
      throw new Error('Transport Bridge not initialized');
    }

    const peerId = `${chainType}:${recipientAddress.toLowerCase()}`;
    bridgeLogger.info('Sharing pre-key bundle', { to: peerId });

    // Get my pre-key bundle
    const bundle = await this.cryptService.getMyPreKeyBundle();
    if (!bundle) {
      throw new Error('No pre-key bundle available');
    }

    // Create protocol message
    const protocolMessage: ProtocolMessage = {
      type: DeyondCryptMessageType.PREKEY_BUNDLE,
      id: this.generateMessageId(),
      timestamp: Date.now(),
      payload: new TextEncoder().encode(JSON.stringify(bundle)),
    };

    const serialized = this.serializeMessage(protocolMessage);
    await this.transportManager!.send(peerId, DEYONDCRYPT_PROTOCOL, serialized);
  }

  /**
   * Connect to a peer
   */
  async connectToPeer(address: string, chainType: 'evm' | 'cosmos' = 'evm'): Promise<Connection> {
    if (!this._isInitialized) {
      throw new Error('Transport Bridge not initialized');
    }

    const peerId = `${chainType}:${address.toLowerCase()}`;
    return this.transportManager!.connect(peerId);
  }

  /**
   * Disconnect from a peer
   */
  async disconnectFromPeer(address: string, chainType: 'evm' | 'cosmos' = 'evm'): Promise<void> {
    if (!this._isInitialized) return;

    const peerId = `${chainType}:${address.toLowerCase()}`;
    await this.transportManager?.disconnect(peerId);
  }

  /**
   * Get discovered peers
   */
  getDiscoveredPeers(): DiscoveredPeer[] {
    return this.transportManager?.getDiscoveredPeers() || [];
  }

  /**
   * Get connected peers
   */
  getConnectedPeers(): string[] {
    if (!this.transportManager) return [];
    return this.transportManager.getConnections().map(c => c.remotePeer.id);
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Subscribe to events
   */
  on<E extends keyof TransportBridgeEvents>(event: E, handler: TransportBridgeEvents[E]): void {
    this.eventEmitter.on(event, handler);
  }

  /**
   * Unsubscribe from events
   */
  off<E extends keyof TransportBridgeEvents>(event: E, handler: TransportBridgeEvents[E]): void {
    this.eventEmitter.off(event, handler);
  }

  /**
   * Setup event handlers for transport manager
   */
  private setupEventHandlers(): void {
    if (!this.transportManager) return;

    // Peer discovered
    this.transportManager.on('peer:discovered', peer => {
      bridgeLogger.info('Peer discovered', { peerId: peer.peer.id });
      this.eventEmitter.emit('peer-discovered', peer);

      // Auto-connect if enabled
      if (this.config.autoConnect) {
        this.transportManager?.connect(peer.peer.id).catch(err => {
          bridgeLogger.debug('Auto-connect failed', { error: err.message });
        });
      }
    });

    // Peer connected
    this.transportManager.on('peer:connected', (peerId, connection) => {
      bridgeLogger.info('Peer connected', { peerId: peerId.id });
      this.eventEmitter.emit('peer-connected', peerId.id);

      // Send queued messages
      this.flushQueuedMessages(peerId.id);
    });

    // Peer disconnected
    this.transportManager.on('peer:disconnected', peerId => {
      bridgeLogger.info('Peer disconnected', { peerId: peerId.id });
      this.eventEmitter.emit('peer-disconnected', peerId.id);
    });

    // Message received
    this.transportManager.on('message:received', async (message, connection) => {
      if (message.protocol === DEYONDCRYPT_PROTOCOL) {
        await this.handleIncomingMessage(message, connection);
      }
    });

    // Error
    this.transportManager.on('error', error => {
      bridgeLogger.error('Transport error', error);
      this.eventEmitter.emit('error', error);
    });
  }

  /**
   * Handle incoming protocol message
   */
  private async handleIncomingMessage(
    message: TransportMessage,
    connection: Connection
  ): Promise<void> {
    try {
      const protocolMessage = this.deserializeMessage(message.payload);
      const senderPeerId = message.from;

      bridgeLogger.debug('Received message', {
        type: protocolMessage.type,
        from: senderPeerId,
      });

      switch (protocolMessage.type) {
        case DeyondCryptMessageType.CHAT:
          await this.handleChatMessage(senderPeerId, protocolMessage);
          break;

        case DeyondCryptMessageType.PREKEY_BUNDLE:
          await this.handlePreKeyBundle(senderPeerId, protocolMessage);
          break;

        case DeyondCryptMessageType.ACK:
          this.handleAck(protocolMessage);
          break;

        default:
          bridgeLogger.warn('Unknown message type', { type: protocolMessage.type });
      }
    } catch (error) {
      bridgeLogger.error('Failed to handle incoming message', error as Error);
    }
  }

  /**
   * Handle incoming chat message
   */
  private async handleChatMessage(senderPeerId: string, message: ProtocolMessage): Promise<void> {
    // Extract address and chain type from peer ID
    const [chainType, address] = senderPeerId.split(':') as ['evm' | 'cosmos', string];

    // Decrypt message
    const decryptedContent = await this.cryptService.decryptMessage(
      address,
      chainType,
      message.payload
    );

    bridgeLogger.info('Received chat message', { from: address });

    this.eventEmitter.emit('message', address, decryptedContent, {
      messageId: message.id,
      timestamp: message.timestamp,
      chainType,
    });

    // Send ACK
    await this.sendAck(senderPeerId, message.id);
  }

  /**
   * Handle incoming pre-key bundle
   */
  private async handlePreKeyBundle(senderPeerId: string, message: ProtocolMessage): Promise<void> {
    const bundleJson = new TextDecoder().decode(message.payload);
    const bundle = JSON.parse(bundleJson);

    bridgeLogger.info('Received pre-key bundle', { from: senderPeerId });

    // Process the bundle through DeyondCrypt
    await this.cryptService.processPreKeyBundle(bundle);

    this.eventEmitter.emit('prekey-bundle', senderPeerId, bundle);
  }

  /**
   * Handle ACK message
   */
  private handleAck(message: ProtocolMessage): void {
    const ackedMessageId = new TextDecoder().decode(message.payload);
    bridgeLogger.debug('Received ACK', { messageId: ackedMessageId });
    // Could update message status here
  }

  /**
   * Send ACK for a message
   */
  private async sendAck(peerId: string, messageId: string): Promise<void> {
    const ackMessage: ProtocolMessage = {
      type: DeyondCryptMessageType.ACK,
      id: this.generateMessageId(),
      timestamp: Date.now(),
      payload: new TextEncoder().encode(messageId),
    };

    const serialized = this.serializeMessage(ackMessage);
    await this.transportManager?.send(peerId, DEYONDCRYPT_PROTOCOL, serialized);
  }

  /**
   * Queue message for retry
   */
  private queueMessage(peerId: string, message: ProtocolMessage): void {
    if (!this.messageQueue.has(peerId)) {
      this.messageQueue.set(peerId, []);
    }

    const queue = this.messageQueue.get(peerId)!;
    if (queue.length < this.config.queue.maxSize) {
      queue.push(message);
    } else {
      bridgeLogger.warn('Message queue full, dropping message', { peerId });
    }
  }

  /**
   * Flush queued messages for a peer
   */
  private async flushQueuedMessages(peerId: string): Promise<void> {
    const queue = this.messageQueue.get(peerId);
    if (!queue || queue.length === 0) return;

    bridgeLogger.info('Flushing queued messages', { peerId, count: queue.length });

    const messages = [...queue];
    this.messageQueue.delete(peerId);

    for (const message of messages) {
      try {
        const serialized = this.serializeMessage(message);
        await this.transportManager?.send(peerId, DEYONDCRYPT_PROTOCOL, serialized);
      } catch (error) {
        this.queueMessage(peerId, message);
      }
    }
  }

  /**
   * Serialize protocol message
   */
  private serializeMessage(message: ProtocolMessage): Uint8Array {
    // Header: type (1) + id length (1) + timestamp (8) + payload length (4)
    const idBytes = new TextEncoder().encode(message.id);
    const totalLength = 1 + 1 + idBytes.length + 8 + 4 + message.payload.length;

    const buffer = new ArrayBuffer(totalLength);
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);

    let offset = 0;

    // Type
    view.setUint8(offset, message.type);
    offset += 1;

    // ID length + ID
    view.setUint8(offset, idBytes.length);
    offset += 1;
    bytes.set(idBytes, offset);
    offset += idBytes.length;

    // Timestamp
    view.setBigUint64(offset, BigInt(message.timestamp), true);
    offset += 8;

    // Payload length + payload
    view.setUint32(offset, message.payload.length, true);
    offset += 4;
    bytes.set(message.payload, offset);

    return bytes;
  }

  /**
   * Deserialize protocol message
   */
  private deserializeMessage(data: Uint8Array): ProtocolMessage {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    let offset = 0;

    // Type
    const type = view.getUint8(offset) as DeyondCryptMessageType;
    offset += 1;

    // ID
    const idLength = view.getUint8(offset);
    offset += 1;
    const id = new TextDecoder().decode(data.slice(offset, offset + idLength));
    offset += idLength;

    // Timestamp
    const timestamp = Number(view.getBigUint64(offset, true));
    offset += 8;

    // Payload
    const payloadLength = view.getUint32(offset, true);
    offset += 4;
    const payload = data.slice(offset, offset + payloadLength);

    return { type, id, timestamp, payload };
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export default TransportBridge;
