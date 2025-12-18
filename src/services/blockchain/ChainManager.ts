/**
 * ChainManager
 * Manages multi-chain network switching and configuration
 * Supports EVM, Solana, and Bitcoin networks
 */

import {
  ChainConfig,
  NetworkType,
  SUPPORTED_CHAINS,
  DEFAULT_CHAIN,
  getChainById,
  getChainByName,
  getChainsByNetworkType,
  isEVMChain,
} from '../../types/chain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IBlockchainAdapter } from '../../core/adapters/IBlockchainAdapter';
import {
  BlockchainAdapterFactory,
  getBlockchainAdapterFactory,
} from '../../core/adapters/BlockchainAdapterFactory';

export class ChainManagerError extends Error {
  type: string;

  constructor(message: string, type: string = 'UNKNOWN') {
    super(message);
    this.name = 'ChainManagerError';
    this.type = type;
  }
}

const STORAGE_KEY = 'current_chain_id';

export class ChainManager {
  private currentChain: ChainConfig;
  private listeners: Set<(chain: ChainConfig) => void> = new Set();
  private adapterFactory: BlockchainAdapterFactory;
  private currentAdapter: IBlockchainAdapter | null = null;

  constructor() {
    this.currentChain = DEFAULT_CHAIN;
    this.adapterFactory = getBlockchainAdapterFactory();
  }

  /**
   * Initialize chain manager (load from storage)
   */
  async initialize(): Promise<void> {
    try {
      const savedChainId = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedChainId) {
        // Try parsing as number first, then as string for non-EVM chains
        const chainId = isNaN(Number(savedChainId)) ? savedChainId : parseInt(savedChainId, 10);
        const chain = getChainById(chainId);
        if (chain) {
          this.currentChain = chain;
        }
      }

      // Initialize adapter for current chain
      await this.initializeAdapter();
    } catch (error) {
      console.warn('Failed to load saved chain:', error);
    }
  }

  /**
   * Initialize adapter for current chain
   */
  private async initializeAdapter(): Promise<void> {
    try {
      const chainName = this.getChainName(this.currentChain);
      this.currentAdapter = this.adapterFactory.create({
        chain: chainName,
        config: { rpcUrl: this.currentChain.rpcUrl },
      });
      await this.currentAdapter.connect();
    } catch (error) {
      console.warn('Failed to initialize adapter:', error);
    }
  }

  /**
   * Get chain name from config
   */
  private getChainName(chain: ChainConfig): string {
    const entry = Object.entries(SUPPORTED_CHAINS).find(
      ([_, config]) => config.chainId === chain.chainId
    );
    return entry ? entry[0] : 'ethereum';
  }

  /**
   * Get current blockchain adapter
   */
  getAdapter(): IBlockchainAdapter | null {
    return this.currentAdapter;
  }

  /**
   * Get current chain configuration
   */
  getCurrentChain(): ChainConfig {
    return this.currentChain;
  }

  /**
   * Get current chain ID
   */
  getChainId(): number | string {
    return this.currentChain.chainId;
  }

  /**
   * Get current network type
   */
  getNetworkType(): NetworkType {
    return this.currentChain.networkType;
  }

  /**
   * Check if current chain is EVM compatible
   */
  isCurrentChainEVM(): boolean {
    return isEVMChain(this.currentChain);
  }

  /**
   * Switch to a different chain by ID
   */
  async switchChain(chainId: number | string): Promise<void> {
    const newChain = getChainById(chainId);

    if (!newChain) {
      throw new ChainManagerError(`Unsupported chain ID: ${chainId}`, 'UNSUPPORTED_CHAIN');
    }

    await this.switchToChain(newChain);
  }

  /**
   * Switch to a different chain by name
   */
  async switchChainByName(name: string): Promise<void> {
    const newChain = getChainByName(name);

    if (!newChain) {
      throw new ChainManagerError(`Unsupported chain: ${name}`, 'UNSUPPORTED_CHAIN');
    }

    await this.switchToChain(newChain);
  }

  /**
   * Internal method to switch chain
   */
  private async switchToChain(newChain: ChainConfig): Promise<void> {
    // Disconnect current adapter
    if (this.currentAdapter) {
      await this.currentAdapter.disconnect();
    }

    // Save to storage
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newChain.chainId.toString());
    } catch (error) {
      console.warn('Failed to save chain preference:', error);
    }

    const oldChain = this.currentChain;
    this.currentChain = newChain;

    // Initialize new adapter
    await this.initializeAdapter();

    // Notify listeners
    this.notifyListeners(newChain);

    console.log(`Switched from ${oldChain.name} to ${newChain.name}`);
  }

  /**
   * Get all supported chains
   */
  getSupportedChains(): ChainConfig[] {
    return Object.values(SUPPORTED_CHAINS);
  }

  /**
   * Get chains by network type
   */
  getChainsByNetworkType(networkType: NetworkType): ChainConfig[] {
    return getChainsByNetworkType(networkType);
  }

  /**
   * Get EVM chains only
   */
  getEVMChains(): ChainConfig[] {
    return getChainsByNetworkType('evm');
  }

  /**
   * Get chain configuration by ID
   */
  getChainConfig(chainId: number | string): ChainConfig | undefined {
    return getChainById(chainId);
  }

  /**
   * Check if chain is supported
   */
  isChainSupported(chainId: number | string): boolean {
    return getChainById(chainId) !== undefined;
  }

  /**
   * Subscribe to chain changes
   */
  subscribe(listener: (chain: ChainConfig) => void): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of chain change
   */
  private notifyListeners(chain: ChainConfig): void {
    this.listeners.forEach(listener => {
      try {
        listener(chain);
      } catch (error) {
        console.error('Error in chain change listener:', error);
      }
    });
  }

  /**
   * Get block explorer URL for address
   */
  getExplorerAddressUrl(address: string, chainId?: number): string {
    const chain = chainId ? getChainById(chainId) : this.currentChain;
    if (!chain) {
      throw new ChainManagerError('Chain not found', 'CHAIN_NOT_FOUND');
    }
    return `${chain.blockExplorerUrl}/address/${address}`;
  }

  /**
   * Get block explorer URL for transaction
   */
  getExplorerTxUrl(txHash: string, chainId?: number): string {
    const chain = chainId ? getChainById(chainId) : this.currentChain;
    if (!chain) {
      throw new ChainManagerError('Chain not found', 'CHAIN_NOT_FOUND');
    }
    return `${chain.blockExplorerUrl}/tx/${txHash}`;
  }

  /**
   * Get block explorer URL for NFT token
   */
  getTokenExplorerUrl(chainId: number, contractAddress: string, tokenId: string): string {
    const chain = getChainById(chainId);
    if (!chain) {
      throw new ChainManagerError('Chain not found', 'CHAIN_NOT_FOUND');
    }
    return `${chain.blockExplorerUrl}/token/${contractAddress}?a=${tokenId}`;
  }
}

// Singleton instance
let instance: ChainManager | null = null;

export const getChainManager = (): ChainManager => {
  if (!instance) {
    instance = new ChainManager();
  }
  return instance;
};

export default ChainManager;
