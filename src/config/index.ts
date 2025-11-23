/**
 * App Configuration
 * Environment-specific settings
 */

// Environment
const ENV = process.env.NODE_ENV || 'development';

// Network Configurations
export const NETWORKS = {
  'ethereum-mainnet': {
    id: 'ethereum-mainnet',
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/',
    symbol: 'ETH',
    explorerUrl: 'https://etherscan.io',
    isTestnet: false,
  },
  'ethereum-goerli': {
    id: 'ethereum-goerli',
    name: 'Goerli Testnet',
    chainId: 5,
    rpcUrl: 'https://eth-goerli.g.alchemy.com/v2/',
    symbol: 'ETH',
    explorerUrl: 'https://goerli.etherscan.io',
    isTestnet: true,
  },
  'polygon-mainnet': {
    id: 'polygon-mainnet',
    name: 'Polygon Mainnet',
    chainId: 137,
    rpcUrl: 'https://polygon-mainnet.g.alchemy.com/v2/',
    symbol: 'MATIC',
    explorerUrl: 'https://polygonscan.com',
    isTestnet: false,
  },
  'polygon-mumbai': {
    id: 'polygon-mumbai',
    name: 'Mumbai Testnet',
    chainId: 80001,
    rpcUrl: 'https://polygon-mumbai.g.alchemy.com/v2/',
    symbol: 'MATIC',
    explorerUrl: 'https://mumbai.polygonscan.com',
    isTestnet: true,
  },
  'arbitrum-mainnet': {
    id: 'arbitrum-mainnet',
    name: 'Arbitrum One',
    chainId: 42161,
    rpcUrl: 'https://arb-mainnet.g.alchemy.com/v2/',
    symbol: 'ETH',
    explorerUrl: 'https://arbiscan.io',
    isTestnet: false,
  },
  'optimism-mainnet': {
    id: 'optimism-mainnet',
    name: 'Optimism',
    chainId: 10,
    rpcUrl: 'https://opt-mainnet.g.alchemy.com/v2/',
    symbol: 'ETH',
    explorerUrl: 'https://optimistic.etherscan.io',
    isTestnet: false,
  },
};

// Default Tokens
export const DEFAULT_TOKENS = {
  ETH: {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    iconUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  },
  USDT: {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    iconUrl: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  },
  USDC: {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    iconUrl: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
  },
};

// App Configuration
export const config = {
  env: ENV,
  isDevelopment: ENV === 'development',
  isProduction: ENV === 'production',
  isTest: ENV === 'test',

  // API
  api: {
    baseUrl: ENV === 'production'
      ? 'https://api.deyond.io'
      : 'https://api-dev.deyond.io',
    timeout: 30000,
  },

  // Features
  features: {
    biometrics: true,
    bleChat: true,
    testnetNetworks: ENV !== 'production',
    analytics: ENV === 'production',
  },

  // Defaults
  defaults: {
    network: 'ethereum-mainnet',
    currency: 'USD',
    language: 'en',
    theme: 'system',
  },
};

export default config;
