/**
 * Network Configuration
 * RPC endpoints and network settings
 */

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorerUrl: string;
  isTestnet: boolean;
}

/**
 * Supported networks
 */
export const NETWORKS: Record<string, NetworkConfig> = {
  ethereum: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: process.env.EXPO_PUBLIC_ETHEREUM_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrl: 'https://etherscan.io',
    isTestnet: false,
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: process.env.EXPO_PUBLIC_SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'SEP',
      decimals: 18,
    },
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    isTestnet: true,
  },
  polygon: {
    chainId: 137,
    name: 'Polygon Mainnet',
    rpcUrl: process.env.EXPO_PUBLIC_POLYGON_RPC_URL || 'https://polygon-rpc.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    blockExplorerUrl: 'https://polygonscan.com',
    isTestnet: false,
  },
  mumbai: {
    chainId: 80001,
    name: 'Polygon Mumbai Testnet',
    rpcUrl:
      process.env.EXPO_PUBLIC_MUMBAI_RPC_URL || 'https://polygon-mumbai.g.alchemy.com/v2/demo',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    blockExplorerUrl: 'https://mumbai.polygonscan.com',
    isTestnet: true,
  },
};

/**
 * Get network config by chain ID
 */
export function getNetworkByChainId(chainId: number): NetworkConfig | undefined {
  return Object.values(NETWORKS).find(network => network.chainId === chainId);
}

/**
 * Get network config by name
 */
export function getNetworkByName(name: string): NetworkConfig | undefined {
  return NETWORKS[name.toLowerCase()];
}

/**
 * Get default network (from environment or Ethereum mainnet)
 */
export function getDefaultNetwork(): NetworkConfig {
  const defaultNetworkName = process.env.EXPO_PUBLIC_DEFAULT_NETWORK || 'ethereum';
  return getNetworkByName(defaultNetworkName) || NETWORKS.ethereum;
}

/**
 * Check if network is testnet
 */
export function isTestnet(chainId: number): boolean {
  const network = getNetworkByChainId(chainId);
  return network?.isTestnet ?? false;
}

/**
 * Get all mainnet networks
 */
export function getMainnetNetworks(): NetworkConfig[] {
  return Object.values(NETWORKS).filter(network => !network.isTestnet);
}

/**
 * Get all testnet networks
 */
export function getTestnetNetworks(): NetworkConfig[] {
  return Object.values(NETWORKS).filter(network => network.isTestnet);
}
