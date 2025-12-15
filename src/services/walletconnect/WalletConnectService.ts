/**
 * WalletConnectService
 * Service for managing WalletConnect v2 sessions and requests
 *
 * NOTE: This is a simplified implementation. For production, you should use:
 * - @walletconnect/web3wallet
 * - @walletconnect/react-native-compat
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  WalletConnectSession,
  WalletConnectProposal,
  WalletConnectRequest,
  WalletConnectConfig,
  WalletConnectMetadata,
  StoredSession,
  WALLET_CONNECT_METHODS,
  WALLET_CONNECT_EVENTS,
} from '../../types/walletconnect';
import { getChainManager } from '../blockchain/ChainManager';

const STORAGE_KEY_SESSIONS = 'wc_sessions';
const STORAGE_KEY_REQUESTS = 'wc_requests';

export class WalletConnectServiceError extends Error {
  code: number;

  constructor(message: string, code: number = 5000) {
    super(message);
    this.name = 'WalletConnectServiceError';
    this.code = code;
  }
}

export interface WalletConnectCallbacks {
  onSessionProposal: (proposal: WalletConnectProposal) => Promise<boolean>;
  onSessionRequest: (request: WalletConnectRequest) => Promise<any>;
  onSessionDelete: (topic: string) => void;
}

export class WalletConnectService {
  private config: WalletConnectConfig;
  private callbacks: WalletConnectCallbacks;
  private sessions: Map<string, WalletConnectSession> = new Map();
  private chainManager = getChainManager();
  private initialized = false;

  constructor(callbacks: WalletConnectCallbacks) {
    this.callbacks = callbacks;

    // Default configuration
    this.config = {
      projectId: 'demo-project-id', // TODO: Replace with actual WalletConnect project ID
      metadata: {
        name: 'Deyond Wallet',
        description: 'Secure cryptocurrency wallet',
        url: 'https://deyond.app',
        icons: ['https://deyond.app/icon.png'],
      },
    };
  }

  /**
   * Initialize WalletConnect service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load saved sessions from storage
      await this.loadSessions();

      // TODO: Initialize WalletConnect Core
      // In production, use: const core = new Core({ projectId: this.config.projectId });

      this.initialized = true;
      console.log('WalletConnect service initialized');
    } catch (error) {
      console.error('Failed to initialize WalletConnect:', error);
      throw new WalletConnectServiceError('Initialization failed');
    }
  }

  /**
   * Pair with DApp using URI (from QR code)
   */
  async pair(uri: string): Promise<void> {
    if (!this.initialized) {
      throw new WalletConnectServiceError('Service not initialized');
    }

    try {
      // TODO: In production, use WalletConnect SDK to pair
      // await web3wallet.pair({ uri });

      console.log('Pairing with URI:', uri);

      // For now, we simulate the pairing process
      // In production, this would trigger the onSessionProposal callback
    } catch (error: any) {
      console.error('Failed to pair:', error);
      throw new WalletConnectServiceError(error.message || 'Pairing failed');
    }
  }

  /**
   * Approve session proposal
   */
  async approveSession(
    proposalId: number,
    accounts: string[],
    chains: string[]
  ): Promise<WalletConnectSession> {
    try {
      // TODO: In production, approve using WalletConnect SDK
      // const session = await web3wallet.approveSession({
      //   id: proposalId,
      //   namespaces: {
      //     eip155: {
      //       accounts,
      //       methods: Object.values(WALLET_CONNECT_METHODS),
      //       events: Object.values(WALLET_CONNECT_EVENTS),
      //     },
      //   },
      // });

      // For now, create a mock session
      const session: WalletConnectSession = {
        topic: `topic-${proposalId}`,
        relay: { protocol: 'irn' },
        expiry: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        acknowledged: true,
        controller: 'wallet',
        namespaces: {
          eip155: {
            accounts,
            methods: Object.values(WALLET_CONNECT_METHODS),
            events: Object.values(WALLET_CONNECT_EVENTS),
            chains,
          },
        },
        peer: {
          publicKey: 'peer-public-key',
          metadata: {
            name: 'Demo DApp',
            description: 'Demo DApp for testing',
            url: 'https://demo.app',
            icons: [],
          },
        },
      };

      this.sessions.set(session.topic, session);
      await this.saveSessions();

      return session;
    } catch (error: any) {
      console.error('Failed to approve session:', error);
      throw new WalletConnectServiceError(error.message || 'Session approval failed');
    }
  }

  /**
   * Reject session proposal
   */
  async rejectSession(proposalId: number, reason: string): Promise<void> {
    try {
      // TODO: In production, reject using WalletConnect SDK
      // await web3wallet.rejectSession({ id: proposalId, reason: { code: 5000, message: reason } });

      console.log(`Rejected session ${proposalId}: ${reason}`);
    } catch (error: any) {
      console.error('Failed to reject session:', error);
      throw new WalletConnectServiceError(error.message || 'Session rejection failed');
    }
  }

  /**
   * Disconnect session
   */
  async disconnectSession(topic: string): Promise<void> {
    try {
      // TODO: In production, disconnect using WalletConnect SDK
      // await web3wallet.disconnectSession({ topic, reason: { code: 6000, message: 'User disconnected' } });

      this.sessions.delete(topic);
      await this.saveSessions();
      this.callbacks.onSessionDelete(topic);

      console.log(`Disconnected session: ${topic}`);
    } catch (error: any) {
      console.error('Failed to disconnect session:', error);
      throw new WalletConnectServiceError(error.message || 'Disconnect failed');
    }
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): WalletConnectSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get session by topic
   */
  getSession(topic: string): WalletConnectSession | undefined {
    return this.sessions.get(topic);
  }

  /**
   * Respond to session request
   */
  async respondToRequest(topic: string, requestId: number, result: any): Promise<void> {
    try {
      // TODO: In production, respond using WalletConnect SDK
      // await web3wallet.respondSessionRequest({ topic, response: { id: requestId, jsonrpc: '2.0', result } });

      console.log(`Responded to request ${requestId} on topic ${topic}`);
    } catch (error: any) {
      console.error('Failed to respond to request:', error);
      throw new WalletConnectServiceError(error.message || 'Response failed');
    }
  }

  /**
   * Reject session request
   */
  async rejectRequest(
    topic: string,
    requestId: number,
    error: { code: number; message: string }
  ): Promise<void> {
    try {
      // TODO: In production, reject using WalletConnect SDK
      // await web3wallet.respondSessionRequest({ topic, response: { id: requestId, jsonrpc: '2.0', error } });

      console.log(`Rejected request ${requestId} on topic ${topic}: ${error.message}`);
    } catch (err: any) {
      console.error('Failed to reject request:', err);
      throw new WalletConnectServiceError(err.message || 'Rejection failed');
    }
  }

  /**
   * Emit event to connected DApp
   */
  async emitSessionEvent(
    topic: string,
    event: { name: string; data: any },
    chainId: string
  ): Promise<void> {
    try {
      // TODO: In production, emit using WalletConnect SDK
      // await web3wallet.emitSessionEvent({ topic, event, chainId });

      console.log(`Emitted event ${event.name} on topic ${topic}`);
    } catch (error: any) {
      console.error('Failed to emit event:', error);
      throw new WalletConnectServiceError(error.message || 'Event emission failed');
    }
  }

  /**
   * Update session accounts
   */
  async updateSession(topic: string, accounts: string[]): Promise<void> {
    const session = this.sessions.get(topic);
    if (!session) {
      throw new WalletConnectServiceError('Session not found');
    }

    try {
      // Update namespaces
      session.namespaces.eip155.accounts = accounts;

      // TODO: In production, update using WalletConnect SDK
      // await web3wallet.updateSession({ topic, namespaces: session.namespaces });

      this.sessions.set(topic, session);
      await this.saveSessions();

      // Emit accounts changed event
      await this.emitSessionEvent(
        topic,
        { name: WALLET_CONNECT_EVENTS.ACCOUNTS_CHANGED, data: accounts },
        'eip155:1'
      );
    } catch (error: any) {
      console.error('Failed to update session:', error);
      throw new WalletConnectServiceError(error.message || 'Session update failed');
    }
  }

  /**
   * Load sessions from storage
   */
  private async loadSessions(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_SESSIONS);
      if (stored) {
        const sessions: WalletConnectSession[] = JSON.parse(stored);
        sessions.forEach(session => {
          this.sessions.set(session.topic, session);
        });
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  }

  /**
   * Save sessions to storage
   */
  private async saveSessions(): Promise<void> {
    try {
      const sessions = Array.from(this.sessions.values());
      await AsyncStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save sessions:', error);
    }
  }

  /**
   * Parse WalletConnect URI
   */
  static parseUri(uri: string): { topic: string; version: number; relay: string } | null {
    try {
      // WalletConnect URI format: wc:{topic}@{version}?relay-protocol={protocol}&symKey={key}
      const match = uri.match(/wc:([^@]+)@(\d+)\?(.+)/);
      if (!match) return null;

      const [, topic, version, params] = match;
      const urlParams = new URLSearchParams(params);
      const relay = urlParams.get('relay-protocol') || 'irn';

      return {
        topic,
        version: parseInt(version, 10),
        relay,
      };
    } catch (error) {
      console.error('Failed to parse URI:', error);
      return null;
    }
  }
}

// Singleton instance
let instance: WalletConnectService | null = null;

export const getWalletConnectService = (
  callbacks?: WalletConnectCallbacks
): WalletConnectService => {
  if (!instance && callbacks) {
    instance = new WalletConnectService(callbacks);
  }
  if (!instance) {
    throw new Error('WalletConnectService not initialized');
  }
  return instance;
};

export default WalletConnectService;
