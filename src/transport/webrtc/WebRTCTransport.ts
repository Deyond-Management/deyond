/**
 * WebRTC Transport Implementation
 *
 * P2P transport using WebRTC for:
 * - Remote peer-to-peer messaging
 * - Video/audio calls
 * - File transfers
 *
 * Supports:
 * - ICE/STUN/TURN for NAT traversal
 * - Signaling via WebSocket or custom server
 * - Data channels for reliable messaging
 * - Media streams for A/V
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
import { BaseTransport, BaseConnection, BaseStream } from '../base-transport';
import { Multiaddr as MultiaddrImpl } from '../multiaddr';
import { PeerId as PeerIdImpl } from '../peer-id';
import { TypedEventEmitter } from '../../utils/EventEmitter';
import { logger } from '../../utils';
import {
  WebRTCTransportConfig,
  WebRTCTransportEvents,
  SignalingMessage,
  WebRTCPeerState,
  RTCSessionDescriptionInit,
  RTCIceCandidateInit,
  DEFAULT_WEBRTC_CONFIG,
  DATA_CHANNEL_LABELS,
} from './types';

const webrtcLogger = logger.child({ module: 'WebRTCTransport' });

// =============================================================================
// WebRTC Stream Implementation
// =============================================================================

/**
 * Stream over WebRTC Data Channel
 */
export class WebRTCStream implements Stream {
  readonly id: string;
  readonly protocol: string;
  readonly connection: Connection;

  private _state: StreamState = 'open';
  private dataChannel: RTCDataChannel | null = null;
  private dataHandlers: ((data: Uint8Array) => void)[] = [];
  private closeHandlers: (() => void)[] = [];
  private errorHandlers: ((error: Error) => void)[] = [];

  constructor(id: string, protocol: string, connection: Connection, dataChannel: RTCDataChannel) {
    this.id = id;
    this.protocol = protocol;
    this.connection = connection;
    this.dataChannel = dataChannel;

    this.setupChannelEvents();
  }

  get state(): StreamState {
    return this._state;
  }

  private setupChannelEvents(): void {
    if (!this.dataChannel) return;

    this.dataChannel.onmessage = event => {
      const data = new Uint8Array(event.data);
      this.dataHandlers.forEach(handler => handler(data));
    };

    this.dataChannel.onclose = () => {
      this._state = 'closed';
      this.closeHandlers.forEach(handler => handler());
    };

    this.dataChannel.onerror = event => {
      this._state = 'error';
      const error = new Error('Data channel error');
      this.errorHandlers.forEach(handler => handler(error));
    };
  }

  async send(data: Uint8Array): Promise<void> {
    if (this._state !== 'open' || !this.dataChannel) {
      throw new Error('Stream is not open');
    }

    if (this.dataChannel.readyState !== 'open') {
      throw new Error('Data channel is not ready');
    }

    // Send as ArrayBuffer for compatibility
    const buffer = data.buffer.slice(
      data.byteOffset,
      data.byteOffset + data.byteLength
    ) as ArrayBuffer;
    this.dataChannel.send(buffer);
  }

  async close(): Promise<void> {
    if (this._state === 'closed') return;

    this._state = 'closing';

    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    this._state = 'closed';
    this.closeHandlers.forEach(handler => handler());
  }

  abort(error?: Error): void {
    this._state = 'error';
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
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
// WebRTC Connection Implementation
// =============================================================================

/**
 * WebRTC Peer Connection wrapper
 */
export class WebRTCConnection implements Connection {
  readonly id: string;
  readonly remotePeer: PeerId;
  readonly remoteAddr: Multiaddr;
  readonly localAddr?: Multiaddr;
  readonly protocol: TransportProtocol = 'webrtc';

  private _state: ConnectionState = 'disconnected';
  private _stats: ConnectionStats;
  private _metadata: Record<string, unknown> = {};
  private streams: Map<string, WebRTCStream> = new Map();
  private peerConnection: RTCPeerConnection | null = null;
  private mainDataChannel: RTCDataChannel | null = null;

  private stateChangeHandlers: ((state: ConnectionState) => void)[] = [];
  private streamHandlers: ((stream: Stream) => void)[] = [];

  constructor(
    id: string,
    remotePeer: PeerId,
    remoteAddr: Multiaddr,
    peerConnection: RTCPeerConnection
  ) {
    this.id = id;
    this.remotePeer = remotePeer;
    this.remoteAddr = remoteAddr;
    this.peerConnection = peerConnection;

    this._stats = {
      connectedAt: 0,
      bytesSent: 0,
      bytesReceived: 0,
      messagesSent: 0,
      messagesReceived: 0,
    };

    this.setupConnectionEvents();
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

  private setupConnectionEvents(): void {
    if (!this.peerConnection) return;

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      switch (state) {
        case 'connected':
          this._stats.connectedAt = Date.now();
          this.updateState('connected');
          break;
        case 'disconnected':
        case 'closed':
          this.updateState('disconnected');
          break;
        case 'failed':
          this.updateState('error');
          break;
        case 'connecting':
          this.updateState('connecting');
          break;
      }
    };

    this.peerConnection.ondatachannel = event => {
      const channel = event.channel;
      webrtcLogger.debug('Received data channel', { label: channel.label });

      const stream = new WebRTCStream(`stream-${Date.now()}`, channel.label, this, channel);

      this.streams.set(stream.id, stream);
      this.streamHandlers.forEach(handler => handler(stream));
    };
  }

  /**
   * Set the main data channel (for initiator)
   */
  setMainDataChannel(channel: RTCDataChannel): void {
    this.mainDataChannel = channel;

    channel.onopen = () => {
      webrtcLogger.debug('Main data channel opened');
    };
  }

  /**
   * Get the underlying peer connection
   */
  getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection;
  }

  async newStream(protocol: string): Promise<Stream> {
    if (!this.peerConnection) {
      throw new Error('No peer connection');
    }

    const channel = this.peerConnection.createDataChannel(protocol, {
      ordered: true,
      maxRetransmits: 3,
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Data channel open timeout'));
      }, 10000);

      channel.onopen = () => {
        clearTimeout(timeout);

        const stream = new WebRTCStream(`stream-${Date.now()}`, protocol, this, channel);

        this.streams.set(stream.id, stream);
        resolve(stream);
      };

      channel.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to open data channel'));
      };
    });
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

    // Close data channel
    if (this.mainDataChannel) {
      this.mainDataChannel.close();
      this.mainDataChannel = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.updateState('disconnected');
  }

  onStateChange(handler: (state: ConnectionState) => void): void {
    this.stateChangeHandlers.push(handler);
  }

  onStream(handler: (stream: Stream) => void): void {
    this.streamHandlers.push(handler);
  }

  /**
   * Update statistics
   */
  updateStats(sent: number, received: number): void {
    this._stats.bytesSent += sent;
    this._stats.bytesReceived += received;
    if (sent > 0) this._stats.messagesSent++;
    if (received > 0) this._stats.messagesReceived++;
  }
}

// =============================================================================
// WebRTC Transport Implementation
// =============================================================================

/**
 * WebRTC Transport
 *
 * Provides P2P connectivity using WebRTC for:
 * - Direct peer connections
 * - NAT traversal via STUN/TURN
 * - Reliable data channels
 * - Optional media streaming
 */
export class WebRTCTransport implements Transport {
  readonly protocol: TransportProtocol = 'webrtc';
  readonly config: WebRTCTransportConfig;

  private _isRunning = false;
  private connections: Map<string, WebRTCConnection> = new Map();
  private peerStates: Map<string, WebRTCPeerState> = new Map();
  private eventEmitter = new TypedEventEmitter<WebRTCTransportEvents>();

  // Signaling
  private signalingSocket: WebSocket | null = null;
  private localPeerId: string = '';

  // Event handlers
  private connectionHandlers: ((connection: Connection) => void)[] = [];
  private disconnectionHandlers: ((connection: Connection) => void)[] = [];
  private errorHandlers: ((error: Error) => void)[] = [];

  constructor(config: Partial<WebRTCTransportConfig> = {}) {
    this.config = {
      ...DEFAULT_WEBRTC_CONFIG,
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

  async init(): Promise<void> {
    webrtcLogger.info('Initializing WebRTC Transport');
    // Nothing to initialize for WebRTC itself
    // Actual RTCPeerConnection is created per peer
  }

  async start(): Promise<void> {
    if (this._isRunning) return;

    webrtcLogger.info('Starting WebRTC Transport');

    // Connect to signaling server if configured
    if (this.config.signalingServer) {
      await this.connectSignaling();
    }

    this._isRunning = true;
    webrtcLogger.info('WebRTC Transport started');
  }

  async stop(): Promise<void> {
    if (!this._isRunning) return;

    webrtcLogger.info('Stopping WebRTC Transport');

    // Close all connections
    for (const connection of this.connections.values()) {
      await connection.close();
    }
    this.connections.clear();
    this.peerStates.clear();

    // Disconnect signaling
    if (this.signalingSocket) {
      this.signalingSocket.close();
      this.signalingSocket = null;
    }

    this._isRunning = false;
    webrtcLogger.info('WebRTC Transport stopped');
  }

  /**
   * Connect to signaling server
   */
  private async connectSignaling(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.config.signalingServer) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Signaling connection timeout'));
      }, this.config.connectionTimeout || 30000);

      try {
        this.signalingSocket = new WebSocket(this.config.signalingServer);

        this.signalingSocket.onopen = () => {
          clearTimeout(timeout);
          webrtcLogger.info('Connected to signaling server');
          this.eventEmitter.emit('signaling:connected');
          resolve();
        };

        this.signalingSocket.onclose = () => {
          webrtcLogger.info('Disconnected from signaling server');
          this.eventEmitter.emit('signaling:disconnected');
        };

        this.signalingSocket.onerror = () => {
          webrtcLogger.error('Signaling error');
        };

        this.signalingSocket.onmessage = event => {
          try {
            const message: SignalingMessage = JSON.parse(event.data);
            this.handleSignalingMessage(message);
          } catch (err) {
            webrtcLogger.error('Failed to parse signaling message', err as Error);
          }
        };
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Handle incoming signaling message
   */
  private async handleSignalingMessage(message: SignalingMessage): Promise<void> {
    webrtcLogger.debug('Received signaling message', { type: message.type, from: message.from });

    this.eventEmitter.emit('signaling:message', message);

    switch (message.type) {
      case 'offer':
        await this.handleOffer(message);
        break;
      case 'answer':
        await this.handleAnswer(message);
        break;
      case 'ice-candidate':
        await this.handleIceCandidate(message);
        break;
      case 'hangup':
        await this.handleHangup(message);
        break;
    }
  }

  /**
   * Handle incoming offer
   */
  private async handleOffer(message: SignalingMessage): Promise<void> {
    const peerId = message.from;
    const offer = message.payload as RTCSessionDescriptionInit;

    webrtcLogger.info('Received offer', { from: peerId });

    // Create peer connection if not exists
    let connection = this.connections.get(peerId);
    if (!connection) {
      const pc = this.createPeerConnection(peerId);
      const remotePeer = PeerIdImpl.fromAddress(peerId);
      const remoteAddr = MultiaddrImpl.webrtc(peerId);

      connection = new WebRTCConnection(`webrtc-${Date.now()}`, remotePeer, remoteAddr, pc);

      this.connections.set(peerId, connection);
      this.connectionHandlers.forEach(handler => handler(connection!));
    }

    const pc = connection.getPeerConnection();
    if (!pc) return;

    // Set remote description
    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    // Create and send answer
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    this.sendSignalingMessage({
      type: 'answer',
      from: this.localPeerId,
      to: peerId,
      payload: { type: 'answer', sdp: answer.sdp || '' },
      timestamp: Date.now(),
    });

    // Process pending ICE candidates
    const peerState = this.peerStates.get(peerId);
    if (peerState) {
      for (const candidate of peerState.pendingCandidates) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      peerState.pendingCandidates = [];
    }
  }

  /**
   * Handle incoming answer
   */
  private async handleAnswer(message: SignalingMessage): Promise<void> {
    const peerId = message.from;
    const answer = message.payload as RTCSessionDescriptionInit;

    webrtcLogger.info('Received answer', { from: peerId });

    const connection = this.connections.get(peerId);
    if (!connection) {
      webrtcLogger.warn('No connection for answer', { peerId });
      return;
    }

    const pc = connection.getPeerConnection();
    if (!pc) return;

    await pc.setRemoteDescription(new RTCSessionDescription(answer));

    // Process pending ICE candidates
    const peerState = this.peerStates.get(peerId);
    if (peerState) {
      for (const candidate of peerState.pendingCandidates) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      peerState.pendingCandidates = [];
    }
  }

  /**
   * Handle incoming ICE candidate
   */
  private async handleIceCandidate(message: SignalingMessage): Promise<void> {
    const peerId = message.from;
    const candidate = message.payload as RTCIceCandidateInit;

    const connection = this.connections.get(peerId);
    if (!connection) {
      // Queue candidate for later
      let peerState = this.peerStates.get(peerId);
      if (!peerState) {
        peerState = {
          peerId,
          connectionState: 'new',
          iceConnectionState: 'new',
          iceGatheringState: 'new',
          signalingState: 'stable',
          pendingCandidates: [],
        };
        this.peerStates.set(peerId, peerState);
      }
      peerState.pendingCandidates.push(candidate);
      return;
    }

    const pc = connection.getPeerConnection();
    if (!pc || !pc.remoteDescription) {
      // Queue candidate for later
      let peerState = this.peerStates.get(peerId);
      if (!peerState) {
        peerState = {
          peerId,
          connectionState: 'new',
          iceConnectionState: 'new',
          iceGatheringState: 'new',
          signalingState: 'stable',
          pendingCandidates: [],
        };
        this.peerStates.set(peerId, peerState);
      }
      peerState.pendingCandidates.push(candidate);
      return;
    }

    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }

  /**
   * Handle hangup
   */
  private async handleHangup(message: SignalingMessage): Promise<void> {
    const peerId = message.from;

    webrtcLogger.info('Received hangup', { from: peerId });

    const connection = this.connections.get(peerId);
    if (connection) {
      this.disconnectionHandlers.forEach(handler => handler(connection));
      await connection.close();
      this.connections.delete(peerId);
      this.peerStates.delete(peerId);
    }
  }

  /**
   * Send signaling message
   */
  private sendSignalingMessage(message: SignalingMessage): void {
    if (!this.signalingSocket || this.signalingSocket.readyState !== WebSocket.OPEN) {
      webrtcLogger.warn('Signaling socket not connected');
      return;
    }

    this.signalingSocket.send(JSON.stringify(message));
  }

  /**
   * Create a new RTCPeerConnection
   */
  private createPeerConnection(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({
      iceServers: this.config.iceServers,
    });

    // Initialize peer state
    this.peerStates.set(peerId, {
      peerId,
      connectionState: 'new',
      iceConnectionState: 'new',
      iceGatheringState: 'new',
      signalingState: 'stable',
      pendingCandidates: [],
    });

    // ICE candidate handling
    pc.onicecandidate = event => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: 'ice-candidate',
          from: this.localPeerId,
          to: peerId,
          payload: {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
          },
          timestamp: Date.now(),
        });

        this.eventEmitter.emit('peer:icecandidate', peerId, {
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
        });
      }
    };

    // Connection state changes
    pc.oniceconnectionstatechange = () => {
      const peerState = this.peerStates.get(peerId);
      if (peerState) {
        peerState.iceConnectionState = pc.iceConnectionState;
      }
      webrtcLogger.debug('ICE connection state changed', {
        peerId,
        state: pc.iceConnectionState,
      });
    };

    // Negotiation needed
    pc.onnegotiationneeded = () => {
      webrtcLogger.debug('Negotiation needed', { peerId });
      this.eventEmitter.emit('peer:negotiation', peerId);
    };

    return pc;
  }

  /**
   * Dial a remote peer
   */
  async dial(addr: Multiaddr): Promise<Connection> {
    const peerId = addr.address;

    webrtcLogger.info('Dialing peer', { peerId });

    // Check existing connection
    const existing = this.connections.get(peerId);
    if (existing && existing.state === 'connected') {
      return existing;
    }

    // Create peer connection
    const pc = this.createPeerConnection(peerId);

    // Create main data channel (must be created before offer)
    const dataChannel = pc.createDataChannel(DATA_CHANNEL_LABELS.MESSAGES, {
      ordered: true,
      maxRetransmits: 3,
    });

    // Create connection wrapper
    const remotePeer = PeerIdImpl.fromAddress(peerId);
    const connection = new WebRTCConnection(`webrtc-${Date.now()}`, remotePeer, addr, pc);

    connection.setMainDataChannel(dataChannel);
    this.connections.set(peerId, connection);

    // Create and send offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    this.sendSignalingMessage({
      type: 'offer',
      from: this.localPeerId,
      to: peerId,
      payload: { type: 'offer', sdp: offer.sdp || '' },
      timestamp: Date.now(),
    });

    // Wait for connection
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, this.config.connectionTimeout || 30000);

      const checkState = () => {
        if (connection.state === 'connected') {
          clearTimeout(timeout);
          this.connectionHandlers.forEach(handler => handler(connection));
          resolve(connection);
        } else if (connection.state === 'error') {
          clearTimeout(timeout);
          reject(new Error('Connection failed'));
        }
      };

      connection.onStateChange(state => {
        checkState();
      });

      // Check immediately
      checkState();
    });
  }

  /**
   * Dial using SDP directly (for manual signaling)
   */
  async dialWithSdp(
    peerId: string,
    remoteSdp: RTCSessionDescriptionInit
  ): Promise<{ connection: WebRTCConnection; answer: RTCSessionDescriptionInit }> {
    webrtcLogger.info('Dialing with SDP', { peerId });

    const pc = this.createPeerConnection(peerId);

    // Create data channel
    const dataChannel = pc.createDataChannel(DATA_CHANNEL_LABELS.MESSAGES);

    // Create connection wrapper
    const remotePeer = PeerIdImpl.fromAddress(peerId);
    const remoteAddr = MultiaddrImpl.webrtc(peerId);
    const connection = new WebRTCConnection(`webrtc-${Date.now()}`, remotePeer, remoteAddr, pc);

    connection.setMainDataChannel(dataChannel);
    this.connections.set(peerId, connection);

    // Set remote description and create answer
    await pc.setRemoteDescription(new RTCSessionDescription(remoteSdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    return {
      connection,
      answer: { type: 'answer', sdp: answer.sdp || '' },
    };
  }

  /**
   * Create offer for manual signaling
   */
  async createOffer(peerId: string): Promise<{
    connection: WebRTCConnection;
    offer: RTCSessionDescriptionInit;
  }> {
    webrtcLogger.info('Creating offer', { peerId });

    const pc = this.createPeerConnection(peerId);

    // Create data channel
    const dataChannel = pc.createDataChannel(DATA_CHANNEL_LABELS.MESSAGES);

    // Create connection wrapper
    const remotePeer = PeerIdImpl.fromAddress(peerId);
    const remoteAddr = MultiaddrImpl.webrtc(peerId);
    const connection = new WebRTCConnection(`webrtc-${Date.now()}`, remotePeer, remoteAddr, pc);

    connection.setMainDataChannel(dataChannel);
    this.connections.set(peerId, connection);

    // Create offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    return {
      connection,
      offer: { type: 'offer', sdp: offer.sdp || '' },
    };
  }

  /**
   * Set remote answer for manual signaling
   */
  async setRemoteAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const connection = this.connections.get(peerId);
    if (!connection) {
      throw new Error('No connection for peer');
    }

    const pc = connection.getPeerConnection();
    if (!pc) {
      throw new Error('No peer connection');
    }

    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  /**
   * Add ICE candidate for manual signaling
   */
  async addIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const connection = this.connections.get(peerId);
    if (!connection) {
      // Queue for later
      let peerState = this.peerStates.get(peerId);
      if (!peerState) {
        peerState = {
          peerId,
          connectionState: 'new',
          iceConnectionState: 'new',
          iceGatheringState: 'new',
          signalingState: 'stable',
          pendingCandidates: [],
        };
        this.peerStates.set(peerId, peerState);
      }
      peerState.pendingCandidates.push(candidate);
      return;
    }

    const pc = connection.getPeerConnection();
    if (!pc) return;

    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }

  getDiscovery(): PeerDiscovery | null {
    // WebRTC doesn't have built-in discovery
    // Discovery happens through signaling server
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
   * Subscribe to WebRTC-specific events
   */
  on<E extends keyof WebRTCTransportEvents>(event: E, handler: WebRTCTransportEvents[E]): void {
    this.eventEmitter.on(event, handler);
  }

  /**
   * Unsubscribe from events
   */
  off<E extends keyof WebRTCTransportEvents>(event: E, handler: WebRTCTransportEvents[E]): void {
    this.eventEmitter.off(event, handler);
  }
}

export default WebRTCTransport;
