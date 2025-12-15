/**
 * Chain Types
 * Type definitions for multi-chain support
 */

export type ChainType = 'mainnet' | 'testnet';

export interface ChainConfig {
  chainId: number;
  name: string;
  symbol: string;
  rpcUrl: string;
  blockExplorerUrl: string;
  type: ChainType;
  logo?: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
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
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
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
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },

  // Mumbai Testnet (Polygon)
  mumbai: {
    chainId: 80001,
    name: 'Mumbai',
    symbol: 'MATIC',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    blockExplorerUrl: 'https://mumbai.polygonscan.com',
    type: 'testnet',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
  },

  // BSC Testnet
  bscTestnet: {
    chainId: 97,
    name: 'BSC Testnet',
    symbol: 'BNB',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    blockExplorerUrl: 'https://testnet.bscscan.com',
    type: 'testnet',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
  },
};

// Helper to get chain by ID
export const getChainById = (chainId: number): ChainConfig | undefined => {
  return Object.values(SUPPORTED_CHAINS).find(chain => chain.chainId === chainId);
};

// Helper to get mainnet chains only
export const getMainnetChains = (): ChainConfig[] => {
  return Object.values(SUPPORTED_CHAINS).filter(chain => chain.type === 'mainnet');
};

// Helper to get testnet chains only
export const getTestnetChains = (): ChainConfig[] => {
  return Object.values(SUPPORTED_CHAINS).filter(chain => chain.type === 'testnet');
};

// Default chain (Ethereum Mainnet)
export const DEFAULT_CHAIN = SUPPORTED_CHAINS.ethereum;
