/**
 * WalletConnect Types
 * Type definitions for WalletConnect v2 integration
 */

export interface WalletConnectSession {
  topic: string;
  pairingTopic?: string;
  relay: {
    protocol: string;
  };
  expiry: number;
  acknowledged: boolean;
  controller: string;
  namespaces: Record<string, WalletConnectNamespace>;
  requiredNamespaces?: Record<string, WalletConnectRequiredNamespace>;
  optionalNamespaces?: Record<string, WalletConnectRequiredNamespace>;
  peer: {
    publicKey: string;
    metadata: WalletConnectMetadata;
  };
}

export interface WalletConnectNamespace {
  accounts: string[];
  methods: string[];
  events: string[];
  chains?: string[];
}

export interface WalletConnectRequiredNamespace {
  chains?: string[];
  methods: string[];
  events: string[];
}

export interface WalletConnectMetadata {
  name: string;
  description: string;
  url: string;
  icons: string[];
}

export interface WalletConnectProposal {
  id: number;
  params: {
    id: number;
    pairingTopic: string;
    expiry: number;
    requiredNamespaces: Record<string, WalletConnectRequiredNamespace>;
    optionalNamespaces?: Record<string, WalletConnectRequiredNamespace>;
    relays: Array<{ protocol: string; data?: string }>;
    proposer: {
      publicKey: string;
      metadata: WalletConnectMetadata;
    };
  };
}

export interface WalletConnectRequest {
  id: number;
  topic: string;
  params: {
    request: {
      method: string;
      params: any;
    };
    chainId: string;
  };
}

export interface WalletConnectSignRequest {
  id: number;
  topic: string;
  method: string;
  params: any;
  chainId: string;
}

/**
 * Supported WalletConnect methods
 */
export const WALLET_CONNECT_METHODS = {
  ETH_SEND_TRANSACTION: 'eth_sendTransaction',
  ETH_SIGN_TRANSACTION: 'eth_signTransaction',
  ETH_SIGN: 'eth_sign',
  PERSONAL_SIGN: 'personal_sign',
  ETH_SIGN_TYPED_DATA: 'eth_signTypedData',
  ETH_SIGN_TYPED_DATA_V4: 'eth_signTypedData_v4',
} as const;

/**
 * Supported WalletConnect events
 */
export const WALLET_CONNECT_EVENTS = {
  CHAIN_CHANGED: 'chainChanged',
  ACCOUNTS_CHANGED: 'accountsChanged',
} as const;

/**
 * Session storage item
 */
export interface StoredSession {
  topic: string;
  peerName: string;
  peerUrl: string;
  peerIcon?: string;
  connectedAt: number;
  chains: string[];
  accounts: string[];
}

/**
 * WalletConnect configuration
 */
export interface WalletConnectConfig {
  projectId: string;
  metadata: WalletConnectMetadata;
  relayUrl?: string;
}
