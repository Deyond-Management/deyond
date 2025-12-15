/**
 * ProviderManager
 * Manages Ethereum providers for different networks
 * Integrated with ChainManager for multi-chain support
 */

import { EthereumProvider } from './EthereumProvider';
import { ChainManager, getChainManager } from './ChainManager';
import { ChainConfig } from '../../types/chain';

export class ProviderManager {
  private providers: Map<number, EthereumProvider> = new Map();
  private chainManager: ChainManager;
  private unsubscribe?: () => void;

  constructor(chainManager?: ChainManager) {
    this.chainManager = chainManager || getChainManager();

    // Subscribe to chain changes
    this.unsubscribe = this.chainManager.subscribe(chain => {
      console.log(`ProviderManager: Chain changed to ${chain.name}`);
    });
  }

  /**
   * Get provider for specific chain ID
   */
  getProvider(chainId?: number): EthereumProvider {
    const targetChainId = chainId || this.chainManager.getChainId();

    // Check if provider already exists
    if (this.providers.has(targetChainId)) {
      return this.providers.get(targetChainId)!;
    }

    // Get chain config from ChainManager
    const chain = this.chainManager.getChainConfig(targetChainId);
    if (!chain) {
      throw new Error(`Chain not supported: ${targetChainId}`);
    }

    const provider = this.createProvider(chain);
    this.providers.set(targetChainId, provider);

    return provider;
  }

  /**
   * Get current provider
   */
  getCurrentProvider(): EthereumProvider {
    return this.getProvider(this.chainManager.getChainId());
  }

  /**
   * Switch to different network
   */
  async switchNetwork(chainId: number): Promise<void> {
    // Delegate to ChainManager
    await this.chainManager.switchChain(chainId);

    // Ensure provider exists for new chain
    this.getProvider(chainId);
  }

  /**
   * Get current chain ID
   */
  getCurrentChainId(): number {
    return this.chainManager.getChainId();
  }

  /**
   * Get current chain config
   */
  getCurrentChain(): ChainConfig {
    return this.chainManager.getCurrentChain();
  }

  /**
   * Get all supported chains
   */
  getSupportedChains(): ChainConfig[] {
    return this.chainManager.getSupportedChains();
  }

  /**
   * Clear all providers (useful for cleanup)
   */
  clearProviders(): void {
    this.providers.clear();
  }

  /**
   * Cleanup resources and unsubscribe from ChainManager
   */
  dispose(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.clearProviders();
  }

  /**
   * Create provider instance for chain
   */
  private createProvider(chain: ChainConfig): EthereumProvider {
    return new EthereumProvider({
      chainId: chain.chainId,
      rpcUrl: chain.rpcUrl,
      timeout: 30000,
    });
  }
}

// Singleton instance
let providerManagerInstance: ProviderManager | null = null;

/**
 * Get singleton provider manager instance
 */
export function getProviderManager(): ProviderManager {
  if (!providerManagerInstance) {
    providerManagerInstance = new ProviderManager();
  }
  return providerManagerInstance;
}

/**
 * Reset provider manager (useful for testing)
 */
export function resetProviderManager(): void {
  if (providerManagerInstance) {
    providerManagerInstance.dispose();
  }
  providerManagerInstance = null;
}

export default ProviderManager;
