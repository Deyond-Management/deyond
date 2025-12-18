/**
 * Chain Types
 * Type definitions for multi-chain support
 */

export type ChainType = 'mainnet' | 'testnet';

/**
 * Blockchain network type
 */
export type NetworkType = 'evm' | 'solana' | 'bitcoin' | 'cosmos';

export interface ChainConfig {
  chainId: number | string; // String for non-EVM chains like Solana
  name: string;
  symbol: string;
  rpcUrl: string;
  blockExplorerUrl: string;
  type: ChainType;
  networkType: NetworkType;
  logo?: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  /** BIP44 coin type for HD derivation */
  coinType?: number;
}

export interface NetworkInfo {
  chainId: number;
  name: string;
  isConnected: boolean;
  blockNumber?: number;
}

export const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  // Ethereum Mainnet
  ethereum: {
    chainId: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: 'https://eth.llamarpc.com',
    blockExplorerUrl: 'https://etherscan.io',
    type: 'mainnet',
    networkType: 'evm',
    coinType: 60,
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },

  // Polygon Mainnet
  polygon: {
    chainId: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorerUrl: 'https://polygonscan.com',
    type: 'mainnet',
    networkType: 'evm',
    coinType: 60,
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
  },

  // BSC Mainnet
  bsc: {
    chainId: 56,
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    blockExplorerUrl: 'https://bscscan.com',
    type: 'mainnet',
    networkType: 'evm',
    coinType: 60,
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
  },

  // Arbitrum One
  arbitrum: {
    chainId: 42161,
    name: 'Arbitrum One',
    symbol: 'ETH',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorerUrl: 'https://arbiscan.io',
    type: 'mainnet',
    networkType: 'evm',
    coinType: 60,
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },

  // Optimism
  optimism: {
    chainId: 10,
    name: 'Optimism',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorerUrl: 'https://optimistic.etherscan.io',
    type: 'mainnet',
    networkType: 'evm',
    coinType: 60,
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },

  // Base
  base: {
    chainId: 8453,
    name: 'Base',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorerUrl: 'https://basescan.org',
    type: 'mainnet',
    networkType: 'evm',
    coinType: 60,
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },

  // Solana Mainnet
  solana: {
    chainId: 'mainnet-beta',
    name: 'Solana',
    symbol: 'SOL',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    blockExplorerUrl: 'https://solscan.io',
    type: 'mainnet',
    networkType: 'solana',
    coinType: 501,
    nativeCurrency: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9,
    },
  },

  // Bitcoin Mainnet
  bitcoin: {
    chainId: 'mainnet',
    name: 'Bitcoin',
    symbol: 'BTC',
    rpcUrl: 'https://blockstream.info/api',
    blockExplorerUrl: 'https://blockstream.info',
    type: 'mainnet',
    networkType: 'bitcoin',
    coinType: 0,
    nativeCurrency: {
      name: 'Bitcoin',
      symbol: 'BTC',
      decimals: 8,
    },
  },

  // Sepolia Testnet
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia',
    symbol: 'ETH',
    rpcUrl: 'https://rpc.sepolia.org',
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    type: 'testnet',
    networkType: 'evm',
    coinType: 60,
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },

  // Solana Devnet
  solanaDevnet: {
    chainId: 'devnet',
    name: 'Solana Devnet',
    symbol: 'SOL',
    rpcUrl: 'https://api.devnet.solana.com',
    blockExplorerUrl: 'https://solscan.io/?cluster=devnet',
    type: 'testnet',
    networkType: 'solana',
    coinType: 501,
    nativeCurrency: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9,
    },
  },

  // Bitcoin Testnet
  bitcoinTestnet: {
    chainId: 'testnet',
    name: 'Bitcoin Testnet',
    symbol: 'tBTC',
    rpcUrl: 'https://blockstream.info/testnet/api',
    blockExplorerUrl: 'https://blockstream.info/testnet',
    type: 'testnet',
    networkType: 'bitcoin',
    coinType: 1,
    nativeCurrency: {
      name: 'Testnet Bitcoin',
      symbol: 'tBTC',
      decimals: 8,
    },
  },
};

// Helper to get chain by ID (supports both number and string IDs)
export const getChainById = (chainId: number | string): ChainConfig | undefined => {
  return Object.values(SUPPORTED_CHAINS).find(chain => chain.chainId === chainId);
};

// Helper to get chain by name
export const getChainByName = (name: string): ChainConfig | undefined => {
  return SUPPORTED_CHAINS[name];
};

// Helper to get mainnet chains only
export const getMainnetChains = (): ChainConfig[] => {
  return Object.values(SUPPORTED_CHAINS).filter(chain => chain.type === 'mainnet');
};

// Helper to get testnet chains only
export const getTestnetChains = (): ChainConfig[] => {
  return Object.values(SUPPORTED_CHAINS).filter(chain => chain.type === 'testnet');
};

// Helper to get chains by network type
export const getChainsByNetworkType = (networkType: NetworkType): ChainConfig[] => {
  return Object.values(SUPPORTED_CHAINS).filter(chain => chain.networkType === networkType);
};

// Helper to get EVM chains
export const getEVMChains = (): ChainConfig[] => {
  return getChainsByNetworkType('evm');
};

// Helper to check if chain is EVM compatible
export const isEVMChain = (chain: ChainConfig): boolean => {
  return chain.networkType === 'evm';
};

// Default chain (Ethereum Mainnet)
export const DEFAULT_CHAIN = SUPPORTED_CHAINS.ethereum;
