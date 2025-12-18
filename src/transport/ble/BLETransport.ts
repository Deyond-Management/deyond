/**
 * BLE Transport Implementation
 *
 * Bluetooth Low Energy transport for P2P messaging
 * Uses react-native-ble-plx for BLE communication
 */

import {
  Transport,
  Connection,
  PeerDiscovery,
  DiscoveredPeer,
  Multiaddr as IMultiaddr,
  PeerId as IPeerId,
} from '../types';
import { BaseTransport, BaseConnection, BaseStream } from '../base-transport';
import { Multiaddr } from '../multiaddr';
import { PeerId } from '../peer-id';
import { EventEmitter } from '../../utils/EventEmitter';
import {
  BLETransportConfig,
  BLEDevice,
  BLEMessageType,
  BLEMessageHeader,
  BLEHandshake,
  DEFAULT_BLE_CONFIG,
} from './types';
import { logger } from '../../utils';

const bleLogger = logger.child({ module: 'BLETransport' });

/**
 * BLE Stream implementation
 */
class BLEStream extends BaseStream {
  private bleConnection: BLEConnection;

  constructor(id: string, protocol: string, connection: BLEConnection) {
    super(id, protocol, connection);
    this.bleConnection = connection;
  }

  async send(data: Uint8Array): Promise<void> {
    if (this.state !== 'open') {
      throw new Error('Stream is not open');
    }
    await this.bleConnection.sendData(this.id, data);
  }

  protected async doClose(): Promise<void> {
    // Send stream close message
    await this.bleConnection.closeStream(this.id);
  }

  /**
   * Handle incoming data for this stream
   */
  handleData(data: Uint8Array): void {
    this.emitData(data);
  }
}

/**
 * BLE Connection implementation
 */
class BLEConnection extends BaseConnection {
  private transport: BLETransport;
  private deviceId: string;
  private sendQueue: Array<{
    streamId: string;
    data: Uint8Array;
    resolve: () => void;
    reject: (e: Error) => void;
  }> = [];
  private isSending = false;
  private sequenceNumber = 0;

  constructor(
    id: string,
    remotePeer: IPeerId,
    remoteAddr: IMultiaddr,
    deviceId: string,
    transport: BLETransport
  ) {
    super(id, remotePeer, remoteAddr, 'ble');
    this.deviceId = deviceId;
    this.transport = transport;
  }

  /**
   * Connect to the BLE device
   */
  async connect(): Promise<void> {
    this.setState('connecting');

    try {
      // In production, use BleManager from react-native-ble-plx
      // await this.transport.getBleManager().connectToDevice(this.deviceId);

      // Simulate connection for now
      await this.simulateConnect();

      this.updateStats({ connectedAt: Date.now() });
      this.setState('connected');
      bleLogger.info('Connected to device', { deviceId: this.deviceId });
    } catch (error) {
      this.setState('error');
      throw error;
    }
  }

  private async simulateConnect(): Promise<void> {
    // Placeholder for actual BLE connection
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async newStream(protocol: string): Promise<BLEStream> {
    const streamId = `${this.id}-${Date.now()}`;
    const stream = new BLEStream(streamId, protocol, this);

    this.streams.set(streamId, stream);
    this.emitStream(stream);

    return stream;
  }

  async close(): Promise<void> {
    this.setState('disconnecting');

    // Close all streams
    for (const stream of this.streams.values()) {
      await stream.close();
    }
    this.streams.clear();

    // Disconnect from device
    // await this.transport.getBleManager().cancelDeviceConnection(this.deviceId);

    this.setState('disconnected');
    bleLogger.info('Disconnected from device', { deviceId: this.deviceId });
  }

  /**
   * Send data through the connection
   */
  async sendData(streamId: string, data: Uint8Array): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sendQueue.push({ streamId, data, resolve, reject });
      this.processSendQueue();
    });
  }

  /**
   * Close a stream
   */
  async closeStream(streamId: string): Promise<void> {
    this.streams.delete(streamId);
    // Send stream close message
    // await this.sendControl(BLEMessageType.STREAM_CLOSE, { streamId });
  }

  /**
   * Process the send queue
   */
  private async processSendQueue(): Promise<void> {
    if (this.isSending || this.sendQueue.length === 0) return;

    this.isSending = true;

    while (this.sendQueue.length > 0) {
      const item = this.sendQueue.shift()!;

      try {
        await this.doSend(item.streamId, item.data);
        this.updateStats({
          bytesSent: this.stats.bytesSent + item.data.length,
          messagesSent: this.stats.messagesSent + 1,
        });
        item.resolve();
      } catch (error) {
        item.reject(error as Error);
      }
    }

    this.isSending = false;
  }

  /**
   * Actually send data via BLE
   */
  private async doSend(streamId: string, data: Uint8Array): Promise<void> {
    // Build message with header
    const header = this.buildHeader(BLEMessageType.DATA, streamId, data.length);
    const message = new Uint8Array(header.length + data.length);
    message.set(header, 0);
    message.set(data, header.length);

    // In production, write to BLE characteristic
    // const characteristic = await this.transport.getTxCharacteristic(this.deviceId);
    // await characteristic.writeWithResponse(Buffer.from(message).toString('base64'));

    bleLogger.debug('Sent data', { streamId, size: data.length });
  }

  /**
   * Build message header
   */
  private buildHeader(type: BLEMessageType, streamId: string, length: number): Uint8Array {
    const header = new Uint8Array(8);
    const view = new DataView(header.buffer);

    view.setUint8(0, type);
    view.setUint8(1, parseInt(streamId.split('-').pop() || '0', 10) & 0xff);
    view.setUint16(2, this.sequenceNumber++, true);
    view.setUint16(4, length, true);
    view.setUint16(6, 0); // flags

    return header;
  }

  /**
   * Handle incoming data from BLE
   */
  handleIncomingData(data: Uint8Array): void {
    if (data.length < 8) {
      bleLogger.warn('Received invalid message (too short)');
      return;
    }

    const view = new DataView(data.buffer);
    const type = view.getUint8(0) as BLEMessageType;
    const streamIdByte = view.getUint8(1);
    const sequence = view.getUint16(2, true);
    const length = view.getUint16(4, true);

    const payload = data.slice(8, 8 + length);

    this.updateStats({
      bytesReceived: this.stats.bytesReceived + data.length,
      messagesReceived: this.stats.messagesReceived + 1,
    });

    switch (type) {
      case BLEMessageType.DATA:
        this.handleDataMessage(streamIdByte, payload);
        break;
      case BLEMessageType.PING:
        this.handlePing(sequence);
        break;
      case BLEMessageType.PONG:
        this.handlePong(sequence);
        break;
      default:
        bleLogger.debug('Received message', { type, length });
    }
  }

  private handleDataMessage(streamIdByte: number, payload: Uint8Array): void {
    // Find stream by ID byte (simplified)
    for (const [id, stream] of this.streams) {
      if (id.endsWith(streamIdByte.toString())) {
        (stream as BLEStream).handleData(payload);
        return;
      }
    }
    bleLogger.warn('Data received for unknown stream', { streamIdByte });
  }

  private handlePing(sequence: number): void {
    // Respond with pong
    bleLogger.debug('Received ping', { sequence });
  }

  private handlePong(sequence: number): void {
    // Calculate RTT
    bleLogger.debug('Received pong', { sequence });
  }
}

/**
 * BLE Peer Discovery implementation
 */
class BLEPeerDiscovery implements PeerDiscovery {
  private transport: BLETransport;
  private config: BLETransportConfig;
  private _isActive = false;
  private eventEmitter = new EventEmitter();
  private discoveredPeers: Map<string, DiscoveredPeer> = new Map();
  private scanTimeout: NodeJS.Timeout | null = null;

  constructor(transport: BLETransport, config: BLETransportConfig) {
    this.transport = transport;
    this.config = config;
  }

  async start(): Promise<void> {
    if (this._isActive) return;

    this._isActive = true;
    bleLogger.info('Starting BLE peer discovery');

    // In production, use BleManager.startDeviceScan
    // this.transport.getBleManager().startDeviceScan(
    //   [this.config.serviceUUID],
    //   { allowDuplicates: this.config.scan.allowDuplicates },
    //   this.handleDiscoveredDevice.bind(this)
    // );

    // Set scan timeout
    if (this.config.scan.duration > 0) {
      this.scanTimeout = setTimeout(() => {
        this.stop();
      }, this.config.scan.duration);
    }
  }

  async stop(): Promise<void> {
    if (!this._isActive) return;

    this._isActive = false;

    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }

    // In production, stop scanning
    // this.transport.getBleManager().stopDeviceScan();

    bleLogger.info('Stopped BLE peer discovery');
  }

  isActive(): boolean {
    return this._isActive;
  }

  /**
   * Handle discovered BLE device
   */
  handleDiscoveredDevice(device: BLEDevice): void {
    // Check if device advertises our service
    if (!device.serviceUUIDs?.includes(this.config.serviceUUID)) {
      return;
    }

    const peerId = PeerId.fromString(`ble:${device.id}`, device.name || undefined);
    const addr = Multiaddr.ble(device.id, {
      name: device.name || undefined,
      rssi: device.rssi || undefined,
    });

    const discoveredPeer: DiscoveredPeer = {
      peer: peerId,
      addrs: [addr],
      discoveredAt: this.discoveredPeers.get(device.id)?.discoveredAt || Date.now(),
      lastSeen: Date.now(),
      rssi: device.rssi || undefined,
      metadata: {
        localName: device.localName,
        isConnectable: device.isConnectable,
      },
    };

    const isNew = !this.discoveredPeers.has(device.id);
    this.discoveredPeers.set(device.id, discoveredPeer);

    if (isNew) {
      bleLogger.info('Discovered new peer', { id: device.id, name: device.name });
      this.eventEmitter.emit('peerDiscovered', discoveredPeer);
    }
  }

  /**
   * Check for lost peers (not seen recently)
   */
  checkLostPeers(timeout: number = 30000): void {
    const now = Date.now();

    for (const [id, peer] of this.discoveredPeers) {
      if (now - peer.lastSeen > timeout) {
        this.discoveredPeers.delete(id);
        this.eventEmitter.emit('peerLost', peer.peer);
        bleLogger.info('Peer lost', { id });
      }
    }
  }

  /**
   * Get all discovered peers
   */
  getDiscoveredPeers(): DiscoveredPeer[] {
    return Array.from(this.discoveredPeers.values());
  }

  onPeerDiscovered(handler: (peer: DiscoveredPeer) => void): void {
    this.eventEmitter.on('peerDiscovered', handler);
  }

  onPeerLost(handler: (peerId: IPeerId) => void): void {
    this.eventEmitter.on('peerLost', handler);
  }
}

/**
 * BLE Transport implementation
 */
export class BLETransport extends BaseTransport implements Transport {
  private bleConfig: BLETransportConfig;
  private discovery: BLEPeerDiscovery;
  // In production: private bleManager: BleManager;

  constructor(config: Partial<BLETransportConfig> = {}) {
    const fullConfig: BLETransportConfig = {
      ...DEFAULT_BLE_CONFIG,
      ...config,
    };

    super('ble', fullConfig);
    this.bleConfig = fullConfig;
    this.discovery = new BLEPeerDiscovery(this, this.bleConfig);
  }

  async init(): Promise<void> {
    bleLogger.info('Initializing BLE transport');

    // In production:
    // this.bleManager = new BleManager();
    // const state = await this.bleManager.state();
    // if (state !== State.PoweredOn) {
    //   throw new Error('Bluetooth is not powered on');
    // }

    bleLogger.info('BLE transport initialized');
  }

  async start(): Promise<void> {
    if (this._isRunning) return;

    bleLogger.info('Starting BLE transport');

    // Start advertising if enabled
    if (this.bleConfig.advertise) {
      await this.startAdvertising();
    }

    this.setRunning(true);
    bleLogger.info('BLE transport started');
  }

  async stop(): Promise<void> {
    if (!this._isRunning) return;

    bleLogger.info('Stopping BLE transport');

    // Stop discovery
    await this.discovery.stop();

    // Stop advertising
    await this.stopAdvertising();

    // Close all connections
    for (const connection of this.connections.values()) {
      await connection.close();
    }
    this.connections.clear();

    this.setRunning(false);
    bleLogger.info('BLE transport stopped');
  }

  async dial(addr: IMultiaddr): Promise<Connection> {
    if (!this._isRunning) {
      throw new Error('Transport is not running');
    }

    if (addr.protocol !== 'ble') {
      throw new Error(`Invalid protocol: ${addr.protocol}`);
    }

    if (this.isAtMaxConnections()) {
      throw new Error('Max connections reached');
    }

    const deviceId = addr.address;
    bleLogger.info('Dialing BLE device', { deviceId });

    // Check for existing connection
    const existingConn = this.getConnection(`ble:${deviceId}`);
    if (existingConn) {
      return existingConn;
    }

    // Create peer ID from device ID
    const remotePeer = PeerId.fromString(`ble:${deviceId}`);

    // Create connection
    const connId = this.generateConnectionId();
    const connection = new BLEConnection(connId, remotePeer, addr, deviceId, this);

    // Connect
    await connection.connect();

    // Store connection
    this.addConnection(connection);

    return connection;
  }

  getDiscovery(): PeerDiscovery {
    return this.discovery;
  }

  /**
   * Start BLE advertising
   */
  private async startAdvertising(): Promise<void> {
    bleLogger.info('Starting BLE advertising', { name: this.bleConfig.advertiseName });

    // In production, use peripheral mode to advertise
    // This requires platform-specific implementation
  }

  /**
   * Stop BLE advertising
   */
  private async stopAdvertising(): Promise<void> {
    bleLogger.info('Stopping BLE advertising');
  }

  /**
   * Handle incoming BLE connection
   */
  handleIncomingConnection(device: BLEDevice): void {
    if (this.isAtMaxConnections()) {
      bleLogger.warn('Rejecting incoming connection: max connections reached');
      return;
    }

    const remotePeer = PeerId.fromString(`ble:${device.id}`, device.name || undefined);
    const addr = Multiaddr.ble(device.id);
    const connId = this.generateConnectionId();

    const connection = new BLEConnection(connId, remotePeer, addr, device.id, this);

    this.addConnection(connection);
    bleLogger.info('Accepted incoming connection', { deviceId: device.id });
  }

  /**
   * Get BLE configuration
   */
  getConfig(): BLETransportConfig {
    return this.bleConfig;
  }
}

export default BLETransport;
