/**
 * WalletConnect Redux Slice
 * State management for WalletConnect sessions and requests
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WalletConnectSession, WalletConnectMetadata } from '../../types/walletconnect';

// Types
export interface SessionInfo {
  topic: string;
  peerName: string;
  peerDescription: string;
  peerUrl: string;
  peerIcon?: string;
  chains: string[];
  accounts: string[];
  methods: string[];
  connectedAt: number;
  expiry: number;
  isActive: boolean;
}

export interface PendingRequest {
  id: number;
  topic: string;
  method: string;
  params: any;
  chainId: string;
  peerName: string;
  peerIcon?: string;
  timestamp: number;
}

export interface WalletConnectState {
  sessions: SessionInfo[];
  pendingRequests: PendingRequest[];
  isInitialized: boolean;
  isPairing: boolean;
  pairingError: string | null;
  lastConnectedDApp: string | null;
}

// Initial state
const initialState: WalletConnectState = {
  sessions: [],
  pendingRequests: [],
  isInitialized: false,
  isPairing: false,
  pairingError: null,
  lastConnectedDApp: null,
};

// Helper: Convert WalletConnectSession to SessionInfo
const sessionToInfo = (session: WalletConnectSession): SessionInfo => {
  const eip155 = session.namespaces.eip155;
  return {
    topic: session.topic,
    peerName: session.peer.metadata.name,
    peerDescription: session.peer.metadata.description,
    peerUrl: session.peer.metadata.url,
    peerIcon: session.peer.metadata.icons?.[0],
    chains: eip155?.chains || [],
    accounts: eip155?.accounts || [],
    methods: eip155?.methods || [],
    connectedAt: Date.now(),
    expiry: session.expiry,
    isActive: true,
  };
};

// Slice
const walletConnectSlice = createSlice({
  name: 'walletConnect',
  initialState,
  reducers: {
    // Set initialization status
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },

    // Set pairing status
    setPairing: (state, action: PayloadAction<boolean>) => {
      state.isPairing = action.payload;
      if (action.payload) {
        state.pairingError = null;
      }
    },

    // Set pairing error
    setPairingError: (state, action: PayloadAction<string | null>) => {
      state.pairingError = action.payload;
      state.isPairing = false;
    },

    // Add session
    addSession: (state, action: PayloadAction<WalletConnectSession>) => {
      const sessionInfo = sessionToInfo(action.payload);

      // Remove existing session with same topic if any
      state.sessions = state.sessions.filter(s => s.topic !== sessionInfo.topic);

      // Add new session
      state.sessions.push(sessionInfo);
      state.lastConnectedDApp = sessionInfo.peerName;
      state.isPairing = false;
      state.pairingError = null;
    },

    // Update session
    updateSession: (
      state,
      action: PayloadAction<{ topic: string; accounts?: string[]; chains?: string[] }>
    ) => {
      const { topic, accounts, chains } = action.payload;
      const session = state.sessions.find(s => s.topic === topic);

      if (session) {
        if (accounts) session.accounts = accounts;
        if (chains) session.chains = chains;
      }
    },

    // Remove session
    removeSession: (state, action: PayloadAction<string>) => {
      state.sessions = state.sessions.filter(s => s.topic !== action.payload);
    },

    // Remove all sessions
    clearAllSessions: state => {
      state.sessions = [];
      state.pendingRequests = [];
    },

    // Set session active status
    setSessionActive: (state, action: PayloadAction<{ topic: string; isActive: boolean }>) => {
      const session = state.sessions.find(s => s.topic === action.payload.topic);
      if (session) {
        session.isActive = action.payload.isActive;
      }
    },

    // Add pending request
    addPendingRequest: (state, action: PayloadAction<PendingRequest>) => {
      // Avoid duplicates
      const exists = state.pendingRequests.some(r => r.id === action.payload.id);
      if (!exists) {
        state.pendingRequests.push(action.payload);
      }
    },

    // Remove pending request
    removePendingRequest: (state, action: PayloadAction<number>) => {
      state.pendingRequests = state.pendingRequests.filter(r => r.id !== action.payload);
    },

    // Clear all pending requests
    clearPendingRequests: state => {
      state.pendingRequests = [];
    },

    // Load sessions from storage (rehydrate)
    loadSessions: (state, action: PayloadAction<SessionInfo[]>) => {
      state.sessions = action.payload;
    },
  },
});

// Export actions
export const {
  setInitialized,
  setPairing,
  setPairingError,
  addSession,
  updateSession,
  removeSession,
  clearAllSessions,
  setSessionActive,
  addPendingRequest,
  removePendingRequest,
  clearPendingRequests,
  loadSessions,
} = walletConnectSlice.actions;

// Selectors
export const selectWalletConnectSessions = (state: { walletConnect: WalletConnectState }) =>
  state.walletConnect.sessions;

export const selectActiveSessions = (state: { walletConnect: WalletConnectState }) =>
  state.walletConnect.sessions.filter(s => s.isActive);

export const selectPendingRequests = (state: { walletConnect: WalletConnectState }) =>
  state.walletConnect.pendingRequests;

export const selectPendingRequestCount = (state: { walletConnect: WalletConnectState }) =>
  state.walletConnect.pendingRequests.length;

export const selectIsWalletConnectInitialized = (state: { walletConnect: WalletConnectState }) =>
  state.walletConnect.isInitialized;

export const selectIsPairing = (state: { walletConnect: WalletConnectState }) =>
  state.walletConnect.isPairing;

export const selectPairingError = (state: { walletConnect: WalletConnectState }) =>
  state.walletConnect.pairingError;

export const selectSessionByTopic =
  (topic: string) => (state: { walletConnect: WalletConnectState }) =>
    state.walletConnect.sessions.find(s => s.topic === topic);

export const selectSessionCount = (state: { walletConnect: WalletConnectState }) =>
  state.walletConnect.sessions.length;

export default walletConnectSlice.reducer;
