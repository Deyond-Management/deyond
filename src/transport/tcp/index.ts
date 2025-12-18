/**
 * TCP Transport Module
 */

export { TCPTransport, TCPConnection, TCPStream, TCPMDNSDiscovery } from './TCPTransport';
export type { TCPSocket, TCPServer, TCPSocketFactory } from './TCPTransport';
export type {
  TCPTransportConfig,
  TCPTransportEvents,
  TCPConnectionState,
  TCPSocketInfo,
  TCPMessageFrame,
  TCPHandshake,
  MDNSService,
} from './types';
export {
  TCPMessageType,
  TCPFrameFlags,
  DEFAULT_TCP_CONFIG,
  FRAME_HEADER_SIZE,
  MAX_FRAME_PAYLOAD_SIZE,
  PROTOCOL_VERSION,
  PROTOCOL_MAGIC,
} from './types';
