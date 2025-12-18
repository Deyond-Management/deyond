/**
 * WebRTC Transport Types
 *
 * Type definitions for WebRTC-based P2P transport
 */

import { TransportConfig } from '../types';

/**
 * WebRTC Transport Configuration
 */
export interface WebRTCTransportConfig extends TransportConfig {
  /** ICE servers for NAT traversal */
  iceServers?: RTCIceServer[];
  /** Signaling server URL */
  signalingServer?: string;
  /** Enable TURN relay fallback */
  enableTurn?: boolean;
  /** Data channel options */
  dataChannelOptions?: RTCDataChannelInit;
  /** Connection timeout for ICE gathering */
  iceGatheringTimeout?: number;
  /** Enable media (audio/video) support */
  enableMedia?: boolean;
}

/**
 * ICE Server configuration
 */
export interface RTCIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

/**
 * Data Channel initialization options
 */
export interface RTCDataChannelInit {
  ordered?: boolean;
  maxPacketLifeTime?: number;
  maxRetransmits?: number;
  protocol?: string;
  negotiated?: boolean;
  id?: number;
}

/**
 * WebRTC Connection State
 */
export type WebRTCConnectionState =
  | 'new'
  | 'checking'
  | 'connected'
  | 'completed'
  | 'failed'
  | 'disconnected'
  | 'closed';

/**
 * Signaling Message Types
 */
export type SignalingMessageType = 'offer' | 'answer' | 'ice-candidate' | 'hangup';

/**
 * Signaling Message
 */
export interface SignalingMessage {
  type: SignalingMessageType;
  from: string;
  to: string;
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit | null;
  timestamp: number;
}

/**
 * SDP Offer/Answer
 */
export interface RTCSessionDescriptionInit {
  type: 'offer' | 'answer';
  sdp: string;
}

/**
 * ICE Candidate
 */
export interface RTCIceCandidateInit {
  candidate: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
}

/**
 * WebRTC Peer State
 */
export interface WebRTCPeerState {
  peerId: string;
  connectionState: WebRTCConnectionState;
  iceConnectionState: string;
  iceGatheringState: string;
  signalingState: string;
  dataChannelState?: string;
  localDescription?: RTCSessionDescriptionInit;
  remoteDescription?: RTCSessionDescriptionInit;
  pendingCandidates: RTCIceCandidateInit[];
}

/**
 * Media Stream Configuration
 */
export interface MediaStreamConfig {
  audio?: boolean | MediaTrackConstraints;
  video?: boolean | MediaTrackConstraints;
}

/**
 * Media Track Constraints
 */
export interface MediaTrackConstraints {
  deviceId?: string;
  width?: number | { min?: number; ideal?: number; max?: number };
  height?: number | { min?: number; ideal?: number; max?: number };
  frameRate?: number | { min?: number; ideal?: number; max?: number };
  facingMode?: 'user' | 'environment';
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
}

/**
 * WebRTC Events
 */
export interface WebRTCTransportEvents {
  'signaling:connected': () => void;
  'signaling:disconnected': () => void;
  'signaling:message': (message: SignalingMessage) => void;
  'peer:icecandidate': (peerId: string, candidate: RTCIceCandidateInit) => void;
  'peer:negotiation': (peerId: string) => void;
  'peer:datachannel': (peerId: string, label: string) => void;
  'media:track': (peerId: string, track: MediaStreamTrack, streams: MediaStream[]) => void;
  [key: string]: (...args: any[]) => void;
}

/**
 * Default WebRTC configuration
 */
export const DEFAULT_WEBRTC_CONFIG: WebRTCTransportConfig = {
  enabled: true,
  maxConnections: 10,
  connectionTimeout: 30000,
  idleTimeout: 60000,
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
  enableTurn: true,
  iceGatheringTimeout: 10000,
  enableMedia: false,
  dataChannelOptions: {
    ordered: true,
    maxRetransmits: 3,
  },
};

/**
 * Data Channel Labels
 */
export const DATA_CHANNEL_LABELS = {
  MESSAGES: 'deyond-messages',
  CONTROL: 'deyond-control',
  FILE_TRANSFER: 'deyond-file',
} as const;

/**
 * Media Stream interface (React Native compatible)
 */
export interface MediaStream {
  id: string;
  active: boolean;
  getTracks(): MediaStreamTrack[];
  getAudioTracks(): MediaStreamTrack[];
  getVideoTracks(): MediaStreamTrack[];
  addTrack(track: MediaStreamTrack): void;
  removeTrack(track: MediaStreamTrack): void;
}

/**
 * Media Stream Track interface (React Native compatible)
 */
export interface MediaStreamTrack {
  id: string;
  kind: 'audio' | 'video';
  label: string;
  enabled: boolean;
  muted: boolean;
  readyState: 'live' | 'ended';
  stop(): void;
}
