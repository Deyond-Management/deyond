/**
 * IBlockchainAdapter
 * Interface for blockchain adapters supporting multi-chain operations
 */

import {
  ChainMetadata,
  Balance,
  BalanceResponse,
  TransactionParams,
  SignedTransaction,
  BroadcastResult,
  TransactionReceipt,
  TransactionHistoryItem,
  GasEstimate,
  TokenMetadata,
  NFTMetadata,
  AdapterCapabilities,
  DerivationPath,
} from './types';

/**
 * Blockchain adapter interface
 * All chain-specific adapters must implement this interface
 */
export interface IBlockchainAdapter {
  // ==================== Metadata ====================

  /**
   * Get chain metadata
   */
  getChainMetadata(): ChainMetadata;

  /**
   * Get adapter capabilities
   */
  getCapabilities(): AdapterCapabilities;

  /**
   * Check if adapter is connected
   */
  isConnected(): boolean;

  /**
   * Connect to the network
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the network
   */
  disconnect(): Promise<void>;

  // ==================== Account Operations ====================

  /**
   * Validate address format
   */
  isValidAddress(address: string): boolean;

  /**
   * Get default derivation path for this chain
   */
  getDefaultDerivationPath(accountIndex?: number): DerivationPath;

  /**
   * Derive address from public key
   */
  deriveAddress(publicKey: string): string;

  /**
   * Get checksum address (if applicable)
   */
  toChecksumAddress(address: string): string;

  // ==================== Balance Operations ====================

  /**
   * Get native token balance
   */
  getBalance(address: string): Promise<Balance>;

  /**
   * Get token balance
   */
  getTokenBalance(address: string, tokenAddress: string): Promise<Balance>;

  /**
   * Get all balances (native + tokens)
   */
  getAllBalances(address: string): Promise<BalanceResponse>;

  // ==================== Transaction Operations ====================

  /**
   * Build transaction
   */
  buildTransaction(params: TransactionParams): Promise<TransactionParams>;

  /**
   * Estimate gas for transaction
   */
  estimateGas(params: TransactionParams): Promise<GasEstimate>;

  /**
   * Sign transaction with private key
   */
  signTransaction(tx: TransactionParams, privateKey: string): Promise<SignedTransaction>;

  /**
   * Broadcast signed transaction
   */
  broadcastTransaction(signedTx: SignedTransaction): Promise<BroadcastResult>;

  /**
   * Get transaction receipt
   */
  getTransactionReceipt(txHash: string): Promise<TransactionReceipt | null>;

  /**
   * Wait for transaction confirmation
   */
  waitForTransaction(
    txHash: string,
    confirmations?: number,
    timeout?: number
  ): Promise<TransactionReceipt>;

  /**
   * Get transaction history
   */
  getTransactionHistory(
    address: string,
    options?: {
      page?: number;
      pageSize?: number;
      startBlock?: number;
      endBlock?: number;
    }
  ): Promise<TransactionHistoryItem[]>;

  // ==================== Token Operations ====================

  /**
   * Get token metadata
   */
  getTokenMetadata(tokenAddress: string): Promise<TokenMetadata>;

  /**
   * Get tokens owned by address
   */
  getOwnedTokens(address: string): Promise<TokenMetadata[]>;

  /**
   * Build token transfer transaction
   */
  buildTokenTransfer(
    tokenAddress: string,
    from: string,
    to: string,
    amount: string
  ): Promise<TransactionParams>;

  // ==================== NFT Operations ====================

  /**
   * Get NFT metadata
   */
  getNFTMetadata(contractAddress: string, tokenId: string): Promise<NFTMetadata>;

  /**
   * Get NFTs owned by address
   */
  getOwnedNFTs(address: string): Promise<NFTMetadata[]>;

  /**
   * Build NFT transfer transaction
   */
  buildNFTTransfer(
    contractAddress: string,
    tokenId: string,
    from: string,
    to: string
  ): Promise<TransactionParams>;

  // ==================== Message Signing ====================

  /**
   * Sign message
   */
  signMessage(message: string, privateKey: string): Promise<string>;

  /**
   * Verify message signature
   */
  verifyMessage(message: string, signature: string, address: string): Promise<boolean>;

  /**
   * Sign typed data (EIP-712 or equivalent)
   */
  signTypedData?(
    domain: Record<string, unknown>,
    types: Record<string, unknown>,
    value: Record<string, unknown>,
    privateKey: string
  ): Promise<string>;

  // ==================== Network Operations ====================

  /**
   * Get current block number
   */
  getBlockNumber(): Promise<number>;

  /**
   * Get current gas prices
   */
  getGasPrice(): Promise<GasEstimate>;

  /**
   * Get network status
   */
  getNetworkStatus(): Promise<{
    isHealthy: boolean;
    latency: number;
    blockHeight: number;
    peerCount?: number;
  }>;

  // ==================== Contract Operations (optional) ====================

  /**
   * Call contract method (read-only)
   */
  callContract?(
    contractAddress: string,
    abi: unknown[],
    method: string,
    args: unknown[]
  ): Promise<unknown>;

  /**
   * Build contract interaction transaction
   */
  buildContractTransaction?(
    contractAddress: string,
    abi: unknown[],
    method: string,
    args: unknown[],
    value?: string
  ): Promise<TransactionParams>;

  // ==================== Simulation (optional) ====================

  /**
   * Simulate transaction execution
   */
  simulateTransaction?(tx: TransactionParams): Promise<{
    success: boolean;
    gasUsed: string;
    returnData?: string;
    error?: string;
    logs?: unknown[];
  }>;
}

/**
 * Abstract base class for blockchain adapters
 */
export abstract class BaseBlockchainAdapter implements IBlockchainAdapter {
  protected chainMetadata: ChainMetadata;
  protected connected: boolean = false;

  constructor(chainMetadata: ChainMetadata) {
    this.chainMetadata = chainMetadata;
  }

  getChainMetadata(): ChainMetadata {
    return this.chainMetadata;
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Abstract methods that must be implemented by subclasses
  abstract getCapabilities(): AdapterCapabilities;
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract isValidAddress(address: string): boolean;
  abstract getDefaultDerivationPath(accountIndex?: number): DerivationPath;
  abstract deriveAddress(publicKey: string): string;
  abstract toChecksumAddress(address: string): string;
  abstract getBalance(address: string): Promise<Balance>;
  abstract getTokenBalance(address: string, tokenAddress: string): Promise<Balance>;
  abstract getAllBalances(address: string): Promise<BalanceResponse>;
  abstract buildTransaction(params: TransactionParams): Promise<TransactionParams>;
  abstract estimateGas(params: TransactionParams): Promise<GasEstimate>;
  abstract signTransaction(tx: TransactionParams, privateKey: string): Promise<SignedTransaction>;
  abstract broadcastTransaction(signedTx: SignedTransaction): Promise<BroadcastResult>;
  abstract getTransactionReceipt(txHash: string): Promise<TransactionReceipt | null>;
  abstract waitForTransaction(
    txHash: string,
    confirmations?: number,
    timeout?: number
  ): Promise<TransactionReceipt>;
  abstract getTransactionHistory(
    address: string,
    options?: {
      page?: number;
      pageSize?: number;
      startBlock?: number;
      endBlock?: number;
    }
  ): Promise<TransactionHistoryItem[]>;
  abstract getTokenMetadata(tokenAddress: string): Promise<TokenMetadata>;
  abstract getOwnedTokens(address: string): Promise<TokenMetadata[]>;
  abstract buildTokenTransfer(
    tokenAddress: string,
    from: string,
    to: string,
    amount: string
  ): Promise<TransactionParams>;
  abstract getNFTMetadata(contractAddress: string, tokenId: string): Promise<NFTMetadata>;
  abstract getOwnedNFTs(address: string): Promise<NFTMetadata[]>;
  abstract buildNFTTransfer(
    contractAddress: string,
    tokenId: string,
    from: string,
    to: string
  ): Promise<TransactionParams>;
  abstract signMessage(message: string, privateKey: string): Promise<string>;
  abstract verifyMessage(message: string, signature: string, address: string): Promise<boolean>;
  abstract getBlockNumber(): Promise<number>;
  abstract getGasPrice(): Promise<GasEstimate>;
  abstract getNetworkStatus(): Promise<{
    isHealthy: boolean;
    latency: number;
    blockHeight: number;
    peerCount?: number;
  }>;
}

export default IBlockchainAdapter;
