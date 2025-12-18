/**
 * Deyond P2P Transport Layer
 *
 * Modular transport abstraction inspired by libp2p
 * Designed for future extraction as an independent library
 *
 * @example
 * ```typescript
 * import {
 *   TransportManager,
 *   BLETransport,
 *   PeerId,
 *   Multiaddr,
 * } from './transport';
 *
 * // Create peer ID from wallet address
 * const myPeerId = PeerId.fromAddress('0x1234...', 'evm', 'My Wallet');
 *
 * // Create transport manager
 * const manager = new TransportManager(myPeerId, {
 *   enableDiscovery: true,
 * });
 *
 * // Register BLE transport
 * const bleTransport = new BLETransport({
 *   advertise: true,
 *   advertiseName: 'Deyond',
 * });
 * manager.registerTransport(bleTransport);
 *
 * // Initialize and start
 * await manager.init();
 * await manager.start();
 *
 * // Listen for discovered peers
 * manager.on('peer:discovered', (peer) => {
 *   console.log('Found peer:', peer.peer.getDisplayName());
 * });
 *
 * // Connect to a peer
 * const connection = await manager.connect(peerId);
 *
 * // Send encrypted message
 * await manager.send(peerId, 'deyond-crypt/1.0.0', encryptedData);
 * ```
 *
 * @packageDocumentation
 */

// Types - export all types
export type {
  Transport,
  Connection,
  Stream,
  PeerDiscovery,
  DiscoveredPeer,
  TransportConfig,
  TransportManagerConfig,
  TransportManagerEvents,
  TransportMessage,
  TransportProtocol,
  ConnectionState,
  StreamState,
  QoS,
  MessagePriority,
  ITransportManager,
  IPeerId,
  IMultiaddr,
} from './types';

// Core classes
export { Multiaddr, MultiaddrUtils } from './multiaddr';
export { PeerId, PeerStore } from './peer-id';
export { BaseTransport, BaseConnection, BaseStream } from './base-transport';
export { TransportManager } from './TransportManager';

// BLE Transport
export { BLETransport } from './ble/BLETransport';
export type { BLETransportConfig, BLEDevice, BLEMessageType } from './ble/types';
export { DEFAULT_BLE_CONFIG } from './ble/types';

// WebRTC Transport
export { WebRTCTransport, WebRTCConnection, WebRTCStream } from './webrtc/WebRTCTransport';
export type {
  WebRTCTransportConfig,
  WebRTCTransportEvents,
  WebRTCConnectionState,
  SignalingMessage,
  RTCSessionDescriptionInit,
  RTCIceCandidateInit,
} from './webrtc/types';
export { DEFAULT_WEBRTC_CONFIG, DATA_CHANNEL_LABELS } from './webrtc/types';

// TCP Transport
export { TCPTransport, TCPConnection, TCPStream, TCPMDNSDiscovery } from './tcp/TCPTransport';
export type {
  TCPTransportConfig,
  TCPTransportEvents,
  TCPSocketInfo,
  TCPSocket,
  TCPServer,
  TCPSocketFactory,
} from './tcp';
export { TCPMessageType, DEFAULT_TCP_CONFIG } from './tcp/types';

// Relay Transport
export { RelayTransport, RelayConnection, RelayStream } from './relay/RelayTransport';
export type {
  RelayTransportConfig,
  RelayTransportEvents,
  RelayServerConfig,
  RelayConnectionState,
  PresenceInfo,
} from './relay/types';
export { RelayMessageType, DEFAULT_RELAY_CONFIG } from './relay/types';
