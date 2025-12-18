/**
 * WalletConnectCore
 * Production-ready WalletConnect v2 implementation
 *
 * This module provides full integration with @walletconnect/web3wallet SDK
 * for proper DApp connectivity.
 */

import { Core } from '@walletconnect/core';
import { Web3Wallet, IWeb3Wallet } from '@walletconnect/web3wallet';
import { buildApprovedNamespaces, getSdkError } from '@walletconnect/utils';
import { SessionTypes, SignClientTypes, ProposalTypes } from '@walletconnect/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EventEmitter } from 'events';
import {
  WalletConnectSession,
  WalletConnectProposal,
  WalletConnectRequest,
  WalletConnectConfig,
  WALLET_CONNECT_METHODS,
  WALLET_CONNECT_EVENTS,
} from '../../types/walletconnect';

// Storage keys
const STORAGE_PREFIX = '@walletconnect/';

/**
 * WalletConnect event types
 */
export enum WCEvent {
  SESSION_PROPOSAL = 'session_proposal',
  SESSION_REQUEST = 'session_request',
  SESSION_DELETE = 'session_delete',
  SESSION_UPDATE = 'session_update',
  SESSION_EVENT = 'session_event',
  SESSION_PING = 'session_ping',
  SESSION_EXPIRE = 'session_expire',
  AUTH_REQUEST = 'auth_request',
  PROPOSAL_EXPIRE = 'proposal_expire',
}

/**
 * Error codes
 */
export const WC_ERROR_CODES = {
  USER_REJECTED: 4001,
  UNAUTHORIZED: 4100,
  UNSUPPORTED_METHOD: 4200,
  DISCONNECTED: 4900,
  CHAIN_NOT_SUPPORTED: 4901,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
};

/**
 * Default supported chains
 */
export const DEFAULT_CHAINS = [
  'eip155:1', // Ethereum Mainnet
  'eip155:137', // Polygon
  'eip155:42161', // Arbitrum
  'eip155:10', // Optimism
  'eip155:8453', // Base
  'eip155:43114', // Avalanche
  'eip155:56', // BSC
];

/**
 * Default supported methods
 */
export const DEFAULT_METHODS = [
  'eth_sendTransaction',
  'eth_signTransaction',
  'eth_sign',
  'personal_sign',
  'eth_signTypedData',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
  'wallet_switchEthereumChain',
  'wallet_addEthereumChain',
];

/**
 * Default supported events
 */
export const DEFAULT_EVENTS = ['chainChanged', 'accountsChanged'];

/**
 * WalletConnect Core Service
 */
class WalletConnectCore extends EventEmitter {
  private core: InstanceType<typeof Core> | null = null;
  private web3wallet: IWeb3Wallet | null = null;
  private config: WalletConnectConfig;
  private initialized = false;
  private currentAddress: string = '';
  private currentChainId: number = 1;

  constructor() {
    super();
    this.config = {
      projectId: process.env.WALLETCONNECT_PROJECT_ID || 'demo-project-id',
      metadata: {
        name: 'Deyond Wallet',
        description: 'Secure multi-chain cryptocurrency wallet',
        url: 'https://deyond.app',
        icons: ['https://deyond.app/icon.png'],
      },
    };
  }

  /**
   * Initialize WalletConnect
   */
  async initialize(projectId?: string): Promise<void> {
    if (this.initialized) {
      console.log('[WalletConnect] Already initialized');
      return;
    }

    try {
      const wcProjectId = projectId || this.config.projectId;

      // Initialize Core
      this.core = new Core({
        projectId: wcProjectId,
        // Use AsyncStorage for React Native
        storage: {
          getItem: async (key: string) => {
            const value = await AsyncStorage.getItem(`${STORAGE_PREFIX}${key}`);
            return value ? JSON.parse(value) : null;
          },
          setItem: async (key: string, value: any) => {
            await AsyncStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
          },
          removeItem: async (key: string) => {
            await AsyncStorage.removeItem(`${STORAGE_PREFIX}${key}`);
          },
        },
      });

      // Initialize Web3Wallet
      this.web3wallet = await Web3Wallet.init({
        core: this.core,
        metadata: this.config.metadata,
      });

      // Set up event listeners
      this.setupEventListeners();

      this.initialized = true;
      console.log('[WalletConnect] Initialized successfully');
    } catch (error) {
      console.error('[WalletConnect] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Set up SDK event listeners
   */
  private setupEventListeners(): void {
    if (!this.web3wallet) return;

    // Session Proposal
    this.web3wallet.on('session_proposal', async proposal => {
      console.log('[WalletConnect] Session proposal received:', proposal.id);
      this.emit(WCEvent.SESSION_PROPOSAL, this.formatProposal(proposal));
    });

    // Session Request
    this.web3wallet.on('session_request', async event => {
      console.log('[WalletConnect] Session request received:', event.id);
      this.emit(WCEvent.SESSION_REQUEST, this.formatRequest(event));
    });

    // Session Delete
    this.web3wallet.on('session_delete', event => {
      console.log('[WalletConnect] Session deleted:', event.topic);
      this.emit(WCEvent.SESSION_DELETE, event.topic);
    });

    // Session Update
    this.web3wallet.on('session_update', event => {
      console.log('[WalletConnect] Session updated:', event.topic);
      this.emit(WCEvent.SESSION_UPDATE, event);
    });

    // Session Event
    this.web3wallet.on('session_event', event => {
      console.log('[WalletConnect] Session event:', event);
      this.emit(WCEvent.SESSION_EVENT, event);
    });

    // Session Ping
    this.web3wallet.on('session_ping', event => {
      console.log('[WalletConnect] Session ping:', event.topic);
      this.emit(WCEvent.SESSION_PING, event);
    });

    // Session Expire
    this.web3wallet.on('session_expire', event => {
      console.log('[WalletConnect] Session expired:', event.topic);
      this.emit(WCEvent.SESSION_EXPIRE, event.topic);
    });

    // Auth Request (for Sign-In with Ethereum)
    this.web3wallet.on('auth_request', event => {
      console.log('[WalletConnect] Auth request:', event.id);
      this.emit(WCEvent.AUTH_REQUEST, event);
    });

    // Proposal Expire
    this.web3wallet.on('proposal_expire', event => {
      console.log('[WalletConnect] Proposal expired:', event.id);
      this.emit(WCEvent.PROPOSAL_EXPIRE, event);
    });
  }

  /**
   * Pair with DApp using WalletConnect URI
   */
  async pair(uri: string): Promise<void> {
    this.ensureInitialized();

    try {
      // Validate URI format
      if (!uri.startsWith('wc:')) {
        throw new Error('Invalid WalletConnect URI');
      }

      await this.web3wallet!.pair({ uri });
      console.log('[WalletConnect] Pairing initiated');
    } catch (error: any) {
      console.error('[WalletConnect] Pairing failed:', error);
      throw new Error(error.message || 'Failed to pair with DApp');
    }
  }

  /**
   * Approve session proposal
   */
  async approveSession(
    proposal: ProposalTypes.Struct,
    accounts: string[],
    chains?: string[]
  ): Promise<SessionTypes.Struct> {
    this.ensureInitialized();

    try {
      const supportedChains = chains || DEFAULT_CHAINS;
      const supportedMethods = DEFAULT_METHODS;
      const supportedEvents = DEFAULT_EVENTS;

      // Build approved namespaces
      const approvedNamespaces = buildApprovedNamespaces({
        proposal: proposal,
        supportedNamespaces: {
          eip155: {
            chains: supportedChains,
            methods: supportedMethods,
            events: supportedEvents,
            accounts: accounts.flatMap(account =>
              supportedChains.map(chain => `${chain}:${account}`)
            ),
          },
        },
      });

      const session = await this.web3wallet!.approveSession({
        id: proposal.id,
        namespaces: approvedNamespaces,
      });

      console.log('[WalletConnect] Session approved:', session.topic);
      return session;
    } catch (error: any) {
      console.error('[WalletConnect] Session approval failed:', error);
      throw new Error(error.message || 'Failed to approve session');
    }
  }

  /**
   * Reject session proposal
   */
  async rejectSession(proposalId: number, reason?: string): Promise<void> {
    this.ensureInitialized();

    try {
      await this.web3wallet!.rejectSession({
        id: proposalId,
        reason: getSdkError('USER_REJECTED'),
      });

      console.log('[WalletConnect] Session rejected:', proposalId);
    } catch (error: any) {
      console.error('[WalletConnect] Session rejection failed:', error);
      throw new Error(error.message || 'Failed to reject session');
    }
  }

  /**
   * Respond to session request with success result
   */
  async respondSuccess(topic: string, requestId: number, result: any): Promise<void> {
    this.ensureInitialized();

    try {
      await this.web3wallet!.respondSessionRequest({
        topic,
        response: {
          id: requestId,
          jsonrpc: '2.0',
          result,
        },
      });

      console.log('[WalletConnect] Request succeeded:', requestId);
    } catch (error: any) {
      console.error('[WalletConnect] Response failed:', error);
      throw new Error(error.message || 'Failed to respond to request');
    }
  }

  /**
   * Respond to session request with error
   */
  async respondError(
    topic: string,
    requestId: number,
    errorCode: number,
    errorMessage: string
  ): Promise<void> {
    this.ensureInitialized();

    try {
      await this.web3wallet!.respondSessionRequest({
        topic,
        response: {
          id: requestId,
          jsonrpc: '2.0',
          error: {
            code: errorCode,
            message: errorMessage,
          },
        },
      });

      console.log('[WalletConnect] Request rejected:', requestId);
    } catch (error: any) {
      console.error('[WalletConnect] Error response failed:', error);
      throw new Error(error.message || 'Failed to reject request');
    }
  }

  /**
   * Reject session request (convenience method)
   */
  async rejectRequest(topic: string, requestId: number, reason?: string): Promise<void> {
    return this.respondError(
      topic,
      requestId,
      WC_ERROR_CODES.USER_REJECTED,
      reason || 'User rejected the request'
    );
  }

  /**
   * Disconnect session
   */
  async disconnectSession(topic: string): Promise<void> {
    this.ensureInitialized();

    try {
      await this.web3wallet!.disconnectSession({
        topic,
        reason: getSdkError('USER_DISCONNECTED'),
      });

      console.log('[WalletConnect] Session disconnected:', topic);
    } catch (error: any) {
      console.error('[WalletConnect] Disconnect failed:', error);
      throw new Error(error.message || 'Failed to disconnect session');
    }
  }

  /**
   * Update session with new accounts
   */
  async updateSession(topic: string, accounts: string[], chains?: string[]): Promise<void> {
    this.ensureInitialized();

    try {
      const supportedChains = chains || DEFAULT_CHAINS;
      const namespaces = {
        eip155: {
          accounts: accounts.flatMap(account =>
            supportedChains.map(chain => `${chain}:${account}`)
          ),
          methods: DEFAULT_METHODS,
          events: DEFAULT_EVENTS,
        },
      };

      await this.web3wallet!.updateSession({
        topic,
        namespaces,
      });

      console.log('[WalletConnect] Session updated:', topic);
    } catch (error: any) {
      console.error('[WalletConnect] Session update failed:', error);
      throw new Error(error.message || 'Failed to update session');
    }
  }

  /**
   * Emit event to connected DApp
   */
  async emitEvent(topic: string, event: string, data: any, chainId: string): Promise<void> {
    this.ensureInitialized();

    try {
      await this.web3wallet!.emitSessionEvent({
        topic,
        event: { name: event, data },
        chainId,
      });

      console.log('[WalletConnect] Event emitted:', event);
    } catch (error: any) {
      console.error('[WalletConnect] Event emission failed:', error);
      throw new Error(error.message || 'Failed to emit event');
    }
  }

  /**
   * Notify all sessions of chain change
   */
  async notifyChainChanged(chainId: number): Promise<void> {
    const sessions = this.getActiveSessions();
    const chainIdHex = `0x${chainId.toString(16)}`;

    for (const session of sessions) {
      try {
        await this.emitEvent(session.topic, 'chainChanged', chainIdHex, `eip155:${chainId}`);
      } catch (error) {
        console.warn(`Failed to notify chain change for session ${session.topic}`);
      }
    }

    this.currentChainId = chainId;
  }

  /**
   * Notify all sessions of accounts change
   */
  async notifyAccountsChanged(accounts: string[]): Promise<void> {
    const sessions = this.getActiveSessions();

    for (const session of sessions) {
      try {
        await this.emitEvent(
          session.topic,
          'accountsChanged',
          accounts,
          `eip155:${this.currentChainId}`
        );
      } catch (error) {
        console.warn(`Failed to notify accounts change for session ${session.topic}`);
      }
    }

    this.currentAddress = accounts[0] || '';
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): SessionTypes.Struct[] {
    if (!this.web3wallet) return [];
    return Object.values(this.web3wallet.getActiveSessions());
  }

  /**
   * Get session by topic
   */
  getSession(topic: string): SessionTypes.Struct | undefined {
    if (!this.web3wallet) return undefined;
    const sessions = this.web3wallet.getActiveSessions();
    return sessions[topic];
  }

  /**
   * Get pending proposals
   */
  getPendingProposals(): ProposalTypes.Struct[] {
    if (!this.web3wallet) return [];
    return Object.values(this.web3wallet.getPendingSessionProposals());
  }

  /**
   * Get pending requests
   */
  getPendingRequests(): SignClientTypes.PendingRequest[] {
    if (!this.web3wallet) return [];
    return this.web3wallet.getPendingSessionRequests();
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Set current wallet info
   */
  setWalletInfo(address: string, chainId: number): void {
    this.currentAddress = address;
    this.currentChainId = chainId;
  }

  /**
   * Format proposal for app consumption
   */
  private formatProposal(
    proposal: SignClientTypes.EventArguments['session_proposal']
  ): WalletConnectProposal {
    const { id, params } = proposal;
    const { proposer, requiredNamespaces, optionalNamespaces } = params;

    // Extract chains from namespaces
    const requiredChains = requiredNamespaces?.eip155?.chains || [];
    const optionalChains = optionalNamespaces?.eip155?.chains || [];
    const allChains = [...new Set([...requiredChains, ...optionalChains])];

    // Extract methods
    const requiredMethods = requiredNamespaces?.eip155?.methods || [];
    const optionalMethods = optionalNamespaces?.eip155?.methods || [];
    const allMethods = [...new Set([...requiredMethods, ...optionalMethods])];

    return {
      id,
      proposer: {
        publicKey: proposer.publicKey,
        metadata: proposer.metadata,
      },
      requiredNamespaces: {
        eip155: {
          chains: allChains,
          methods: allMethods,
          events: requiredNamespaces?.eip155?.events || DEFAULT_EVENTS,
        },
      },
      relays: params.relays,
    };
  }

  /**
   * Format request for app consumption
   */
  private formatRequest(
    event: SignClientTypes.EventArguments['session_request']
  ): WalletConnectRequest {
    const { id, topic, params } = event;
    const { request, chainId } = params;

    return {
      id,
      topic,
      method: request.method,
      params: request.params,
      chainId,
    };
  }

  /**
   * Ensure service is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized || !this.web3wallet) {
      throw new Error('WalletConnect not initialized. Call initialize() first.');
    }
  }

  /**
   * Cleanup and destroy
   */
  async destroy(): Promise<void> {
    if (this.web3wallet) {
      // Disconnect all sessions
      const sessions = this.getActiveSessions();
      for (const session of sessions) {
        try {
          await this.disconnectSession(session.topic);
        } catch (error) {
          console.warn(`Failed to disconnect session ${session.topic}`);
        }
      }
    }

    this.core = null;
    this.web3wallet = null;
    this.initialized = false;
    this.removeAllListeners();

    console.log('[WalletConnect] Destroyed');
  }
}

// Singleton instance
let walletConnectCoreInstance: WalletConnectCore | null = null;

export const getWalletConnectCore = (): WalletConnectCore => {
  if (!walletConnectCoreInstance) {
    walletConnectCoreInstance = new WalletConnectCore();
  }
  return walletConnectCoreInstance;
};

export default WalletConnectCore;
