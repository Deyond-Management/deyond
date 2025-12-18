/**
 * BlockchainAdapterFactory
 * Factory for creating blockchain adapters based on chain type
 */

import { IBlockchainAdapter } from './IBlockchainAdapter';
import { ChainMetadata, SupportedChain, ChainType } from './types';
import { CHAIN_METADATA, getChainByName, getChainById, isEVMChain } from './ChainConfig';
import { SolanaAdapter, SolanaAdapterConfig } from './SolanaAdapter';
import { BitcoinAdapter, BitcoinAdapterConfig } from './BitcoinAdapter';

/**
 * EVM adapter configuration
 */
export interface EVMAdapterConfig {
  /** RPC endpoint URL */
  rpcUrl?: string;
  /** Chain ID */
  chainId?: number;
  /** Enable demo mode */
  demoMode?: boolean;
}

/**
 * Adapter configuration union type
 */
export type AdapterConfig = EVMAdapterConfig | SolanaAdapterConfig | BitcoinAdapterConfig;

/**
 * Adapter creation options
 */
export interface CreateAdapterOptions {
  /** Chain name */
  chain: SupportedChain | string;
  /** Chain-specific configuration */
  config?: AdapterConfig;
  /** Enable demo mode */
  demoMode?: boolean;
}

/**
 * BlockchainAdapterFactory
 * Creates and manages blockchain adapters
 */
export class BlockchainAdapterFactory {
  private static instance: BlockchainAdapterFactory;
  private adapters: Map<string, IBlockchainAdapter> = new Map();
  private demoMode: boolean = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): BlockchainAdapterFactory {
    if (!BlockchainAdapterFactory.instance) {
      BlockchainAdapterFactory.instance = new BlockchainAdapterFactory();
    }
    return BlockchainAdapterFactory.instance;
  }

  /**
   * Set global demo mode
   */
  setDemoMode(enabled: boolean): void {
    this.demoMode = enabled;
  }

  /**
   * Create adapter for specified chain
   */
  create(options: CreateAdapterOptions): IBlockchainAdapter {
    const { chain, config, demoMode } = options;
    const isDemoMode = demoMode ?? this.demoMode;

    // Check if adapter already exists
    const cacheKey = this.getCacheKey(chain, config);
    const existingAdapter = this.adapters.get(cacheKey);
    if (existingAdapter) {
      return existingAdapter;
    }

    // Get chain metadata
    const chainMetadata = this.getChainMetadata(chain);
    if (!chainMetadata) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    // Create adapter based on chain type
    const adapter = this.createAdapterByType(chainMetadata, config, isDemoMode);

    // Cache adapter
    this.adapters.set(cacheKey, adapter);

    return adapter;
  }

  /**
   * Create adapter by chain type
   */
  private createAdapterByType(
    chainMetadata: ChainMetadata,
    config?: AdapterConfig,
    demoMode: boolean = false
  ): IBlockchainAdapter {
    switch (chainMetadata.type) {
      case 'evm':
        return this.createEVMAdapter(chainMetadata, config as EVMAdapterConfig, demoMode);

      case 'solana':
        return new SolanaAdapter({
          ...(config as SolanaAdapterConfig),
          demoMode,
        });

      case 'bitcoin':
        return new BitcoinAdapter({
          ...(config as BitcoinAdapterConfig),
          demoMode,
        });

      default:
        throw new Error(`Unsupported chain type: ${chainMetadata.type}`);
    }
  }

  /**
   * Create EVM adapter
   * For now, returns a placeholder - in production use ethers.js adapter
   */
  private createEVMAdapter(
    chainMetadata: ChainMetadata,
    config?: EVMAdapterConfig,
    demoMode: boolean = false
  ): IBlockchainAdapter {
    // In production, this would create an EVMChainAdapter
    // For now, we return a mock implementation
    return new EVMChainAdapter(chainMetadata, config, demoMode);
  }

  /**
   * Get adapter for chain (creates if doesn't exist)
   */
  getAdapter(chain: SupportedChain | string): IBlockchainAdapter {
    return this.create({ chain });
  }

  /**
   * Check if adapter exists for chain
   */
  hasAdapter(chain: string): boolean {
    return this.adapters.has(chain);
  }

  /**
   * Remove adapter from cache
   */
  removeAdapter(chain: string): void {
    const adapter = this.adapters.get(chain);
    if (adapter) {
      adapter.disconnect();
      this.adapters.delete(chain);
    }
  }

  /**
   * Clear all cached adapters
   */
  async clearAll(): Promise<void> {
    for (const adapter of this.adapters.values()) {
      await adapter.disconnect();
    }
    this.adapters.clear();
  }

  /**
   * Get all supported chains
   */
  getSupportedChains(): ChainMetadata[] {
    return Object.values(CHAIN_METADATA);
  }

  /**
   * Get chains by type
   */
  getChainsByType(type: ChainType): ChainMetadata[] {
    return Object.values(CHAIN_METADATA).filter(chain => chain.type === type);
  }

  /**
   * Check if chain is supported
   */
  isSupported(chain: string): boolean {
    return chain in CHAIN_METADATA || !!getChainById(chain);
  }

  /**
   * Get chain metadata
   */
  private getChainMetadata(chain: string): ChainMetadata | undefined {
    // Try by name first
    if (chain in CHAIN_METADATA) {
      return getChainByName(chain as SupportedChain);
    }

    // Try by chain ID
    return getChainById(chain);
  }

  /**
   * Generate cache key for adapter
   */
  private getCacheKey(chain: string, config?: AdapterConfig): string {
    const configHash = config ? JSON.stringify(config) : '';
    return `${chain}:${configHash}`;
  }
}

/**
 * EVMChainAdapter
 * Generic adapter for EVM-compatible chains
 * Note: This is a placeholder - in production, integrate with existing EthereumProvider
 */
import { BaseBlockchainAdapter } from './IBlockchainAdapter';
import {
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
  GasPrice,
  TokenBalance,
} from './types';
import { UnitConverter } from '../../utils/converters/UnitConverter';

export class EVMChainAdapter extends BaseBlockchainAdapter {
  private rpcUrl: string;
  private demoMode: boolean;

  constructor(chainMetadata: ChainMetadata, config?: EVMAdapterConfig, demoMode: boolean = false) {
    super(chainMetadata);
    this.rpcUrl = config?.rpcUrl || chainMetadata.rpcUrls[0];
    this.demoMode = demoMode;
  }

  getCapabilities(): AdapterCapabilities {
    return {
      supportsEIP1559: true,
      supportsTokens: true,
      supportsNFTs: true,
      supportsSmartContracts: true,
      supportsSimulation: true,
      supportsMessageSigning: true,
      supportsTypedData: true,
    };
  }

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  getDefaultDerivationPath(accountIndex: number = 0): DerivationPath {
    return {
      path: `m/44'/60'/${accountIndex}'/0/0`,
      purpose: 44,
      coinType: 60,
      account: accountIndex,
      change: 0,
      addressIndex: 0,
    };
  }

  deriveAddress(publicKey: string): string {
    // In production, use ethers.js
    return publicKey;
  }

  toChecksumAddress(address: string): string {
    // In production, use ethers.js getAddress
    return address;
  }

  async getBalance(address: string): Promise<Balance> {
    if (this.demoMode) {
      const wei = (Math.random() * 10 * 1e18).toFixed(0);
      return {
        value: wei,
        formatted: UnitConverter.weiToEther(wei),
        symbol: this.chainMetadata.symbol,
        decimals: 18,
      };
    }

    // In production, use ethers.js provider
    throw new Error('EVM adapter requires ethers.js integration');
  }

  async getTokenBalance(address: string, tokenAddress: string): Promise<Balance> {
    throw new Error('EVM adapter requires ethers.js integration');
  }

  async getAllBalances(address: string): Promise<BalanceResponse> {
    const native = await this.getBalance(address);
    return { native, tokens: [] };
  }

  async buildTransaction(params: TransactionParams): Promise<TransactionParams> {
    return params;
  }

  async estimateGas(params: TransactionParams): Promise<GasEstimate> {
    const baseGasPrice: GasPrice = {
      maxFeePerGas: '50000000000',
      maxPriorityFeePerGas: '2000000000',
      estimatedTime: 15,
      estimatedCost: UnitConverter.weiToEther('1050000000000000'),
    };

    return {
      gasLimit: '21000',
      slow: { ...baseGasPrice, estimatedTime: 60 },
      standard: baseGasPrice,
      fast: { ...baseGasPrice, maxFeePerGas: '100000000000', estimatedTime: 5 },
    };
  }

  async signTransaction(tx: TransactionParams, privateKey: string): Promise<SignedTransaction> {
    throw new Error('EVM adapter requires ethers.js integration');
  }

  async broadcastTransaction(signedTx: SignedTransaction): Promise<BroadcastResult> {
    throw new Error('EVM adapter requires ethers.js integration');
  }

  async getTransactionReceipt(txHash: string): Promise<TransactionReceipt | null> {
    throw new Error('EVM adapter requires ethers.js integration');
  }

  async waitForTransaction(
    txHash: string,
    confirmations?: number,
    timeout?: number
  ): Promise<TransactionReceipt> {
    throw new Error('EVM adapter requires ethers.js integration');
  }

  async getTransactionHistory(
    address: string,
    options?: { page?: number; pageSize?: number }
  ): Promise<TransactionHistoryItem[]> {
    return [];
  }

  async getTokenMetadata(tokenAddress: string): Promise<TokenMetadata> {
    throw new Error('EVM adapter requires ethers.js integration');
  }

  async getOwnedTokens(address: string): Promise<TokenMetadata[]> {
    return [];
  }

  async buildTokenTransfer(
    tokenAddress: string,
    from: string,
    to: string,
    amount: string
  ): Promise<TransactionParams> {
    throw new Error('EVM adapter requires ethers.js integration');
  }

  async getNFTMetadata(contractAddress: string, tokenId: string): Promise<NFTMetadata> {
    throw new Error('EVM adapter requires ethers.js integration');
  }

  async getOwnedNFTs(address: string): Promise<NFTMetadata[]> {
    return [];
  }

  async buildNFTTransfer(
    contractAddress: string,
    tokenId: string,
    from: string,
    to: string
  ): Promise<TransactionParams> {
    throw new Error('EVM adapter requires ethers.js integration');
  }

  async signMessage(message: string, privateKey: string): Promise<string> {
    throw new Error('EVM adapter requires ethers.js integration');
  }

  async verifyMessage(message: string, signature: string, address: string): Promise<boolean> {
    throw new Error('EVM adapter requires ethers.js integration');
  }

  async getBlockNumber(): Promise<number> {
    if (this.demoMode) {
      return 18000000 + Math.floor(Math.random() * 1000);
    }
    throw new Error('EVM adapter requires ethers.js integration');
  }

  async getGasPrice(): Promise<GasEstimate> {
    return this.estimateGas({ from: '', to: '', value: '0' });
  }

  async getNetworkStatus(): Promise<{
    isHealthy: boolean;
    latency: number;
    blockHeight: number;
    peerCount?: number;
  }> {
    return {
      isHealthy: true,
      latency: 100,
      blockHeight: 18000000,
    };
  }
}

/**
 * Get singleton factory instance
 */
export const getBlockchainAdapterFactory = (): BlockchainAdapterFactory => {
  return BlockchainAdapterFactory.getInstance();
};

/**
 * Convenience function to create adapter
 */
export const createAdapter = (options: CreateAdapterOptions): IBlockchainAdapter => {
  return BlockchainAdapterFactory.getInstance().create(options);
};

export default BlockchainAdapterFactory;
