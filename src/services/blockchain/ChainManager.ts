/**
 * ChainManager
 * Manages multi-chain network switching and configuration
 */

import { ChainConfig, SUPPORTED_CHAINS, DEFAULT_CHAIN, getChainById } from '../../types/chain';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  constructor() {
    this.currentChain = DEFAULT_CHAIN;
  }

  /**
   * Initialize chain manager (load from storage)
   */
  async initialize(): Promise<void> {
    try {
      const savedChainId = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedChainId) {
        const chainId = parseInt(savedChainId, 10);
        const chain = getChainById(chainId);
        if (chain) {
          this.currentChain = chain;
        }
      }
    } catch (error) {
      console.warn('Failed to load saved chain:', error);
    }
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
  getChainId(): number {
    return this.currentChain.chainId;
  }

  /**
   * Switch to a different chain
   */
  async switchChain(chainId: number): Promise<void> {
    const newChain = getChainById(chainId);

    if (!newChain) {
      throw new ChainManagerError(`Unsupported chain ID: ${chainId}`, 'UNSUPPORTED_CHAIN');
    }

    // Save to storage
    try {
      await AsyncStorage.setItem(STORAGE_KEY, chainId.toString());
    } catch (error) {
      console.warn('Failed to save chain preference:', error);
    }

    const oldChain = this.currentChain;
    this.currentChain = newChain;

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
   * Get chain configuration by ID
   */
  getChainConfig(chainId: number): ChainConfig | undefined {
    return getChainById(chainId);
  }

  /**
   * Check if chain is supported
   */
  isChainSupported(chainId: number): boolean {
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
