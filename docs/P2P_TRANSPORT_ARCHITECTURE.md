# P2P Transport Architecture

## Document Information

- **Version**: 1.0.0
- **Last Updated**: 2025-12-19
- **Status**: Implemented (Client-side)
- **Project**: Deyond - Modular P2P Transport Layer

---

## Table of Contents

1. [Overview](#overview)
2. [Design Philosophy](#design-philosophy)
3. [Architecture](#architecture)
4. [Transport Implementations](#transport-implementations)
5. [Core Interfaces](#core-interfaces)
6. [Usage Examples](#usage-examples)
7. [Security Considerations](#security-considerations)
8. [Future Roadmap](#future-roadmap)

---

## 1. Overview

The Deyond P2P Transport Layer is a modular, libp2p-inspired transport abstraction designed for peer-to-peer communication. It provides a unified interface for multiple transport protocols, enabling seamless communication across different connectivity scenarios.

### Key Features

- **Modular Design**: Pluggable transport implementations (BLE, WebRTC, TCP, Relay)
- **Unified Interface**: Consistent API across all transport types
- **Independent Extraction**: Designed to be extracted as an independent library
- **Multi-Protocol Support**: Use multiple transports simultaneously
- **Automatic Fallback**: Relay transport for NAT traversal and offline scenarios

### Supported Transports

| Transport | Range   | Use Case                             | Status      |
| --------- | ------- | ------------------------------------ | ----------- |
| BLE       | 10-100m | Proximity messaging, offline P2P     | Implemented |
| WebRTC    | Global  | Real-time communication, video calls | Implemented |
| TCP       | LAN     | Local network direct connections     | Implemented |
| Relay     | Global  | NAT traversal, store-and-forward     | Implemented |

---

## 2. Design Philosophy

### Inspired by libp2p

The architecture follows libp2p's modular approach:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Application Layer                             │
│  (DeyondCrypt Protocol, Chat, Messaging)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                  Transport Manager                               │
│  - Peer Discovery                                                │
│  - Connection Management                                         │
│  - Protocol Multiplexing                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
    ┌────▼────┐          ┌────▼────┐         ┌────▼────┐
    │   BLE   │          │ WebRTC  │         │   TCP   │
    │Transport│          │Transport│         │Transport│
    └─────────┘          └─────────┘         └─────────┘
```

### Core Principles

1. **Transport Agnostic**: Upper layers don't care about underlying transport
2. **Extensible**: New transports can be added without changing core interfaces
3. **Resilient**: Automatic reconnection and transport fallback
4. **Secure**: Built-in encryption support at transport level

---

## 3. Architecture

### Module Structure

```
src/transport/
├── index.ts                    # Main exports
├── types.ts                    # Core type definitions
├── multiaddr.ts               # Multiaddress implementation
├── TransportManager.ts        # Transport orchestration
│
├── ble/                       # Bluetooth Low Energy Transport
│   ├── index.ts
│   ├── types.ts
│   └── BLETransport.ts
│
├── webrtc/                    # WebRTC Transport
│   ├── index.ts
│   ├── types.ts
│   └── WebRTCTransport.ts
│
├── tcp/                       # TCP Transport
│   ├── index.ts
│   ├── types.ts
│   └── TCPTransport.ts
│
└── relay/                     # Relay Transport
    ├── index.ts
    ├── types.ts
    └── RelayTransport.ts
```

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    TransportManager                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Configuration                                               ││
│  │  - Local PeerId                                              ││
│  │  - Registered Transports                                     ││
│  │  - Discovery Settings                                        ││
│  │  - Reconnection Policy                                       ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Connection Manager                                          ││
│  │  - Active Connections Map                                    ││
│  │  - Connection State Machine                                  ││
│  │  - Stream Multiplexing                                       ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Event Emitter                                               ││
│  │  - peer:discovered                                           ││
│  │  - peer:connected                                            ││
│  │  - peer:disconnected                                         ││
│  │  - message:received                                          ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
┌────────▼────────┐  ┌────────▼────────┐  ┌───────▼─────────┐
│  BLETransport   │  │ WebRTCTransport │  │  TCPTransport   │
│                 │  │                 │  │                 │
│ ┌─────────────┐ │  │ ┌─────────────┐ │  │ ┌─────────────┐ │
│ │  Discovery  │ │  │ │  Signaling  │ │  │ │    mDNS     │ │
│ │  (BLE Scan) │ │  │ │   Channel   │ │  │ │  Discovery  │ │
│ └─────────────┘ │  │ └─────────────┘ │  │ └─────────────┘ │
│                 │  │                 │  │                 │
│ ┌─────────────┐ │  │ ┌─────────────┐ │  │ ┌─────────────┐ │
│ │ Connection  │ │  │ │ RTCPeer     │ │  │ │   Socket    │ │
│ │ (GATT)      │ │  │ │ Connection  │ │  │ │ Connection  │ │
│ └─────────────┘ │  │ └─────────────┘ │  │ └─────────────┘ │
│                 │  │                 │  │                 │
│ ┌─────────────┐ │  │ ┌─────────────┐ │  │ ┌─────────────┐ │
│ │   Stream    │ │  │ │DataChannel  │ │  │ │   Stream    │ │
│ │ (Char/Svc)  │ │  │ │   Stream    │ │  │ │ (Multiplex) │ │
│ └─────────────┘ │  │ └─────────────┘ │  │ └─────────────┘ │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## 4. Transport Implementations

### 4.1 BLE Transport

**Purpose**: Proximity-based P2P communication without internet

**Features**:

- Bluetooth Low Energy scanning and advertising
- GATT service-based connection
- Characteristic-based data transfer
- RSSI-based distance estimation

**Configuration**:

```typescript
interface BLETransportConfig extends TransportConfig {
  serviceUUID: string; // GATT service UUID
  characteristicUUID: string; // Data characteristic UUID
  scanDuration: number; // Scan duration in ms
  advertiseMode: 'low_power' | 'balanced' | 'low_latency';
  txPowerLevel: 'ultra_low' | 'low' | 'medium' | 'high';
}
```

**Use Cases**:

- Offline P2P messaging
- Contact exchange at events
- Proximity-based payments

### 4.2 WebRTC Transport

**Purpose**: Real-time peer-to-peer communication over internet

**Features**:

- NAT traversal via ICE (STUN/TURN)
- DataChannel for reliable messaging
- MediaStream support for audio/video
- Signaling abstraction

**Configuration**:

```typescript
interface WebRTCTransportConfig extends TransportConfig {
  iceServers: RTCIceServer[]; // STUN/TURN servers
  dataChannelOptions: {
    ordered: boolean; // Ordered delivery
    maxRetransmits?: number; // Max retransmission attempts
    maxPacketLifeTime?: number; // Max packet lifetime in ms
  };
  signalingServerUrl?: string; // Optional signaling server
}
```

**Default ICE Servers**:

```typescript
const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];
```

**Use Cases**:

- Video/voice calls
- Real-time gaming
- Large file transfers

### 4.3 TCP Transport

**Purpose**: Direct LAN connections with mDNS discovery

**Features**:

- TCP socket connections
- Stream multiplexing (multiple streams per connection)
- mDNS service discovery
- Optional TLS encryption
- Keep-alive and flow control

**Configuration**:

```typescript
interface TCPTransportConfig extends TransportConfig {
  listenPort?: number; // Local port (0 = random)
  bindAddress?: string; // Interface to bind (default: 0.0.0.0)
  enableTls?: boolean; // Enable TLS encryption
  tlsCert?: string; // TLS certificate (PEM)
  tlsKey?: string; // TLS private key (PEM)
  keepAliveInterval?: number; // Keep-alive interval in ms
  bufferSize?: number; // Socket buffer size
  enableMdns?: boolean; // Enable mDNS discovery
  mdnsServiceName?: string; // mDNS service name
}
```

**Frame Protocol**:

```
┌─────────┬──────┬──────────┬──────────┬───────┬────────┬─────────┐
│ Version │ Type │ StreamID │ Sequence │ Flags │ Length │ Payload │
│ (1B)    │ (1B) │ (4B)     │ (4B)     │ (1B)  │ (4B)   │ (var)   │
└─────────┴──────┴──────────┴──────────┴───────┴────────┴─────────┘
```

**Message Types**:

- `DATA (0x01)`: Data payload
- `PING (0x02)`: Keep-alive request
- `PONG (0x03)`: Keep-alive response
- `STREAM_OPEN (0x10)`: Open new stream
- `STREAM_CLOSE (0x12)`: Close stream
- `WINDOW_UPDATE (0x20)`: Flow control
- `GOAWAY (0x40)`: Graceful shutdown

**Use Cases**:

- Local network file sharing
- LAN multiplayer games
- IoT device communication

### 4.4 Relay Transport

**Purpose**: Store-and-forward messaging and NAT traversal

**Features**:

- WebSocket-based relay connection
- Store-and-forward for offline peers
- Presence tracking
- WebRTC signaling relay
- Circuit relay (peer-to-peer through relay)

**Configuration**:

```typescript
interface RelayTransportConfig extends TransportConfig {
  relayServerUrl: string; // Relay server URL
  reconnectInterval?: number; // Reconnect delay in ms
  maxStoredMessages?: number; // Max stored messages per peer
  messageRetentionTime?: number; // Message retention time in ms
  heartbeatInterval?: number; // Heartbeat interval in ms
}
```

**Relay Protocol Messages**:

```typescript
enum RelayMessageType {
  REGISTER = 'register', // Register with relay
  UNREGISTER = 'unregister', // Unregister from relay
  SEND = 'send', // Send message to peer
  DELIVER = 'deliver', // Deliver message from relay
  ACK = 'ack', // Acknowledge message
  PRESENCE_QUERY = 'presence_query',
  PRESENCE_UPDATE = 'presence_update',
  WEBRTC_SIGNAL = 'webrtc_signal', // WebRTC signaling
  ERROR = 'error',
}
```

**Use Cases**:

- Messaging when peers are offline
- WebRTC signaling
- NAT traversal fallback

---

## 5. Core Interfaces

### PeerId

Unique identifier for peers in the network:

```typescript
interface PeerId {
  id: string; // Unique identifier (e.g., public key hash)
  name?: string; // Human-readable name
  publicKey?: Uint8Array; // Public key for verification
}
```

### Multiaddr

Multiaddress-like addressing for different transports:

```typescript
interface Multiaddr {
  toString(): string;
  protocol: TransportProtocol;  // 'ble' | 'webrtc' | 'tcp' | 'websocket' | 'custom'
  address: string;
  options?: Record<string, unknown>;
}

// Factory methods
Multiaddr.ble(deviceUuid: string, options?: Record<string, unknown>): Multiaddr
Multiaddr.webrtc(sdpOffer: string, options?: Record<string, unknown>): Multiaddr
Multiaddr.tcp(host: string, port: number, options?: Record<string, unknown>): Multiaddr
Multiaddr.websocket(url: string, options?: Record<string, unknown>): Multiaddr
```

**Address Format Examples**:

- BLE: `/ble/<device-uuid>`
- WebRTC: `/webrtc/<sdp-offer-base64>`
- TCP: `/tcp/192.168.1.10/9000`
- WebSocket: `/websocket/wss://relay.example.com`

### Transport

Base interface for all transport implementations:

```typescript
interface Transport {
  readonly protocol: TransportProtocol;
  readonly config: TransportConfig;

  init(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;

  dial(addr: Multiaddr): Promise<Connection>;
  getDiscovery(): PeerDiscovery | null;
  getConnections(): Connection[];
  getConnection(peerId: string): Connection | undefined;

  onConnection(handler: (connection: Connection) => void): void;
  onDisconnection(handler: (connection: Connection) => void): void;
  onError(handler: (error: Error) => void): void;
}
```

### Connection

Represents a connection to a remote peer:

```typescript
interface Connection {
  id: string;
  remotePeer: PeerId;
  remoteAddr: Multiaddr;
  localAddr?: Multiaddr;
  state: ConnectionState; // 'disconnected' | 'connecting' | 'connected' | 'disconnecting' | 'error'
  protocol: TransportProtocol;
  stats: ConnectionStats;
  metadata: Record<string, unknown>;

  newStream(protocol: string): Promise<Stream>;
  getStreams(): Stream[];
  close(): Promise<void>;

  onStateChange(handler: (state: ConnectionState) => void): void;
  onStream(handler: (stream: Stream) => void): void;
}
```

### Stream

Multiplexed stream within a connection:

```typescript
interface Stream {
  id: string;
  protocol: string;
  state: StreamState; // 'open' | 'closing' | 'closed' | 'error'
  connection: Connection;

  send(data: Uint8Array): Promise<void>;
  close(): Promise<void>;
  abort(error?: Error): void;

  onData(handler: (data: Uint8Array) => void): void;
  onClose(handler: () => void): void;
  onError(handler: (error: Error) => void): void;
}
```

### TransportManager

Orchestrates multiple transports:

```typescript
interface TransportManager {
  readonly config: TransportManagerConfig;
  readonly peerId: PeerId;

  init(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;

  registerTransport(transport: Transport): void;
  getTransports(): Transport[];
  getTransport(protocol: TransportProtocol): Transport | undefined;

  connect(peerId: string, addrs?: Multiaddr[]): Promise<Connection>;
  disconnect(peerId: string): Promise<void>;
  getConnection(peerId: string): Connection | undefined;
  getConnections(): Connection[];

  send(peerId: string, protocol: string, data: Uint8Array): Promise<void>;
  broadcast(protocol: string, data: Uint8Array): Promise<void>;

  on<E extends keyof TransportManagerEvents>(event: E, handler: TransportManagerEvents[E]): void;
  off<E extends keyof TransportManagerEvents>(event: E, handler: TransportManagerEvents[E]): void;
}
```

---

## 6. Usage Examples

### Basic Setup

```typescript
import {
  TransportManager,
  BLETransport,
  WebRTCTransport,
  TCPTransport,
  RelayTransport,
  Multiaddr,
} from '@/transport';

// Create transport manager
const manager = new DefaultTransportManager({
  peerId: {
    id: walletAddress,
    publicKey: publicKeyBytes,
  },
  transports: [],
  enableDiscovery: true,
  reconnection: {
    enabled: true,
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 30000,
  },
});

// Register transports
manager.registerTransport(
  new BLETransport({
    enabled: true,
    serviceUUID: 'deyond-p2p-service',
    characteristicUUID: 'deyond-p2p-data',
  })
);

manager.registerTransport(
  new WebRTCTransport({
    enabled: true,
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  })
);

manager.registerTransport(
  new TCPTransport({
    enabled: true,
    enableMdns: true,
  })
);

manager.registerTransport(
  new RelayTransport({
    enabled: true,
    relayServerUrl: 'wss://relay.deyond.io',
  })
);

// Initialize and start
await manager.init();
await manager.start();
```

### Event Handling

```typescript
// Peer discovery
manager.on('peer:discovered', peer => {
  console.log(`Discovered peer: ${peer.peer.id}`);
  console.log(`Addresses: ${peer.addrs.map(a => a.toString()).join(', ')}`);
});

// Connection events
manager.on('peer:connected', (peerId, connection) => {
  console.log(`Connected to: ${peerId.id} via ${connection.protocol}`);
});

manager.on('peer:disconnected', peerId => {
  console.log(`Disconnected from: ${peerId.id}`);
});

// Message handling
manager.on('message:received', (message, connection) => {
  console.log(`Message from ${message.from}: ${message.payload}`);
});
```

### Connecting to Peers

```typescript
// Connect via BLE
const bleAddr = Multiaddr.ble('device-uuid-123');
const bleConnection = await manager.connect(peerId, [bleAddr]);

// Connect via TCP (LAN)
const tcpAddr = Multiaddr.tcp('192.168.1.100', 9000);
const tcpConnection = await manager.connect(peerId, [tcpAddr]);

// Connect via WebRTC
const webrtcAddr = Multiaddr.webrtc(sdpOffer);
const webrtcConnection = await manager.connect(peerId, [webrtcAddr]);

// Let manager choose best transport
const connection = await manager.connect(peerId);
```

### Sending Messages

```typescript
// Send to specific peer
await manager.send(peerId, 'deyondcrypt/v1', messageBytes);

// Broadcast to all connected peers
await manager.broadcast('deyondcrypt/v1', messageBytes);

// Use stream for multiple messages
const stream = await connection.newStream('deyondcrypt/v1');
await stream.send(message1);
await stream.send(message2);
await stream.close();
```

---

## 7. Security Considerations

### Transport-Level Security

| Transport | Encryption                    | Authentication           |
| --------- | ----------------------------- | ------------------------ |
| BLE       | BLE encryption + session keys | ECDH key exchange        |
| WebRTC    | DTLS-SRTP                     | Certificate fingerprints |
| TCP       | Optional TLS                  | Certificate-based        |
| Relay     | WSS (TLS)                     | Token-based              |

### Best Practices

1. **Always use DeyondCrypt Protocol** for end-to-end encryption on top of transport encryption
2. **Verify peer identity** using public key verification
3. **Rotate session keys** regularly
4. **Validate message signatures** before processing
5. **Use TLS** for TCP connections in production

---

## 8. Future Roadmap

### Phase 1: Backend Services (Planned)

- [ ] Signaling server for WebRTC
- [ ] Relay server implementation
- [ ] TURN server for NAT traversal

### Phase 2: Advanced Features (Planned)

- [ ] Mesh networking for BLE
- [ ] Circuit relay (peer-through-peer)
- [ ] DHT-based peer discovery
- [ ] QUIC transport

### Phase 3: Independent Library (Planned)

- [ ] Extract as `@deyond/transport` package
- [ ] NPM/GitHub packages release
- [ ] Documentation website
- [ ] Example applications

---

## Document History

| Version | Date       | Author | Changes                                      |
| ------- | ---------- | ------ | -------------------------------------------- |
| 1.0.0   | 2025-12-19 | Claude | Initial transport architecture documentation |

---

## Related Documents

- [DeyondCrypt Protocol](./DEYOND_CRYPT_PROTOCOL.md)
- [Architecture Design](./ARCHITECTURE.md)
- [Security Considerations](./SECURITY.md)
- [Feature List](./FEATURE_LIST.md)
