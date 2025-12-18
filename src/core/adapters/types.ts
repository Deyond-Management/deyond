/**
 * Blockchain Adapter Types
 * Core type definitions for multi-chain support
 */

/**
 * Supported blockchain networks
 */
export type ChainType = 'evm' | 'solana' | 'bitcoin' | 'cosmos';

/**
 * Supported chain IDs
 */
export type SupportedChain =
  | 'ethereum'
  | 'polygon'
  | 'bsc'
  | 'arbitrum'
  | 'optimism'
  | 'avalanche'
  | 'solana'
  | 'bitcoin'
  | 'base';

/**
 * Chain metadata
 */
export interface ChainMetadata {
  /** Unique chain identifier */
  chainId: string;
  /** Chain name for display */
  name: string;
  /** Native token symbol */
  symbol: string;
  /** Native token decimals */
  decimals: number;
  /** Chain type */
  type: ChainType;
  /** Logo URL */
  logo: string;
  /** RPC endpoint URLs */
  rpcUrls: string[];
  /** WebSocket endpoint URLs */
  wsUrls?: string[];
  /** Block explorer URLs */
  explorerUrls: string[];
  /** Block explorer API URLs */
  explorerApiUrls?: string[];
  /** Is testnet */
  testnet: boolean;
  /** Average block time in seconds */
  blockTime: number;
  /** BIP44 coin type for HD derivation */
  coinType: number;
  /** Native currency info */
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

/**
 * Account balance
 */
export interface Balance {
  /** Balance in smallest unit */
  value: string;
  /** Formatted balance with decimals */
  formatted: string;
  /** Symbol */
  symbol: string;
  /** Decimals */
  decimals: number;
}

/**
 * Token balance
 */
export interface TokenBalance extends Balance {
  /** Token contract address */
  contractAddress: string;
  /** Token name */
  name: string;
  /** Token logo URL */
  logo?: string;
  /** USD value */
  usdValue?: string;
}

/**
 * Full balance response
 */
export interface BalanceResponse {
  /** Native token balance */
  native: Balance;
  /** Token balances */
  tokens: TokenBalance[];
  /** Total USD value */
  totalUsdValue?: string;
}

/**
 * Transaction parameters
 */
export interface TransactionParams {
  /** Sender address */
  from: string;
  /** Recipient address */
  to: string;
  /** Amount in smallest unit */
  value: string;
  /** Transaction data (for contract calls) */
  data?: string;
  /** Gas limit */
  gasLimit?: string;
  /** Gas price in smallest unit */
  gasPrice?: string;
  /** Max fee per gas (EIP-1559) */
  maxFeePerGas?: string;
  /** Max priority fee per gas (EIP-1559) */
  maxPriorityFeePerGas?: string;
  /** Nonce */
  nonce?: number;
  /** Memo/Tag (for some chains) */
  memo?: string;
}

/**
 * Signed transaction
 */
export interface SignedTransaction {
  /** Raw signed transaction bytes */
  rawTransaction: string;
  /** Transaction hash */
  hash: string;
  /** Signature(s) */
  signature?: string;
}

/**
 * Broadcast result
 */
export interface BroadcastResult {
  /** Transaction hash */
  hash: string;
  /** Transaction status */
  status: 'pending' | 'confirmed' | 'failed';
  /** Block number (if confirmed) */
  blockNumber?: number;
  /** Timestamp */
  timestamp?: number;
}

/**
 * Transaction receipt
 */
export interface TransactionReceipt {
  /** Transaction hash */
  hash: string;
  /** Status */
  status: 'success' | 'failed' | 'pending';
  /** Block number */
  blockNumber: number;
  /** Block hash */
  blockHash: string;
  /** Gas used */
  gasUsed: string;
  /** Effective gas price */
  effectiveGasPrice: string;
  /** Transaction index in block */
  transactionIndex: number;
  /** Contract address (if deployment) */
  contractAddress?: string;
  /** Event logs */
  logs: TransactionLog[];
  /** Confirmations */
  confirmations: number;
  /** Timestamp */
  timestamp?: number;
}

/**
 * Transaction log/event
 */
export interface TransactionLog {
  /** Log index */
  logIndex: number;
  /** Contract address */
  address: string;
  /** Event topics */
  topics: string[];
  /** Event data */
  data: string;
  /** Block number */
  blockNumber: number;
  /** Transaction hash */
  transactionHash: string;
}

/**
 * Transaction history item
 */
export interface TransactionHistoryItem {
  /** Transaction hash */
  hash: string;
  /** Sender address */
  from: string;
  /** Recipient address */
  to: string;
  /** Value transferred */
  value: string;
  /** Transaction fee */
  fee: string;
  /** Status */
  status: 'pending' | 'confirmed' | 'failed';
  /** Block number */
  blockNumber?: number;
  /** Timestamp */
  timestamp: number;
  /** Transaction type */
  type: 'send' | 'receive' | 'contract' | 'swap' | 'approve' | 'unknown';
  /** Nonce */
  nonce?: number;
  /** Token info (for token transfers) */
  tokenInfo?: {
    symbol: string;
    decimals: number;
    contractAddress: string;
  };
}

/**
 * Gas estimate
 */
export interface GasEstimate {
  /** Estimated gas limit */
  gasLimit: string;
  /** Slow gas price */
  slow: GasPrice;
  /** Standard gas price */
  standard: GasPrice;
  /** Fast gas price */
  fast: GasPrice;
  /** Base fee (EIP-1559) */
  baseFee?: string;
}

/**
 * Gas price tier
 */
export interface GasPrice {
  /** Gas price in smallest unit */
  gasPrice?: string;
  /** Max fee per gas (EIP-1559) */
  maxFeePerGas?: string;
  /** Max priority fee per gas (EIP-1559) */
  maxPriorityFeePerGas?: string;
  /** Estimated time in seconds */
  estimatedTime: number;
  /** Estimated cost in native currency */
  estimatedCost: string;
}

/**
 * Token metadata
 */
export interface TokenMetadata {
  /** Contract address */
  address: string;
  /** Token name */
  name: string;
  /** Token symbol */
  symbol: string;
  /** Decimals */
  decimals: number;
  /** Logo URL */
  logo?: string;
  /** Total supply */
  totalSupply?: string;
  /** Token type */
  type: 'ERC20' | 'ERC721' | 'ERC1155' | 'SPL' | 'BEP20' | 'unknown';
}

/**
 * NFT metadata
 */
export interface NFTMetadata {
  /** Contract address */
  contractAddress: string;
  /** Token ID */
  tokenId: string;
  /** NFT name */
  name: string;
  /** Description */
  description?: string;
  /** Image URL */
  image?: string;
  /** Animation URL */
  animationUrl?: string;
  /** External URL */
  externalUrl?: string;
  /** Attributes */
  attributes?: Array<{
    traitType: string;
    value: string | number;
  }>;
  /** Collection name */
  collectionName?: string;
  /** Token standard */
  standard: 'ERC721' | 'ERC1155' | 'SPL' | 'unknown';
}

/**
 * Account derivation path info
 */
export interface DerivationPath {
  /** BIP44 path string */
  path: string;
  /** Purpose (44' for BIP44) */
  purpose: number;
  /** Coin type */
  coinType: number;
  /** Account index */
  account: number;
  /** Change (0 = external, 1 = internal) */
  change: number;
  /** Address index */
  addressIndex: number;
}

/**
 * Adapter capabilities
 */
export interface AdapterCapabilities {
  /** Supports EIP-1559 transactions */
  supportsEIP1559: boolean;
  /** Supports token transfers */
  supportsTokens: boolean;
  /** Supports NFTs */
  supportsNFTs: boolean;
  /** Supports smart contracts */
  supportsSmartContracts: boolean;
  /** Supports transaction simulation */
  supportsSimulation: boolean;
  /** Supports message signing */
  supportsMessageSigning: boolean;
  /** Supports typed data signing (EIP-712) */
  supportsTypedData: boolean;
}
