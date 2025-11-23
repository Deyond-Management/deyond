/**
 * Service Configuration
 * Centralized configuration for all external services
 */

// Load from environment
const env = {
  ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY || '',
  INFURA_PROJECT_ID: process.env.INFURA_PROJECT_ID || '',
  COINGECKO_API_KEY: process.env.COINGECKO_API_KEY || '',
  SENTRY_DSN: process.env.SENTRY_DSN || '',
  MIXPANEL_TOKEN: process.env.MIXPANEL_TOKEN || '',
  AMPLITUDE_API_KEY: process.env.AMPLITUDE_API_KEY || '',
  WALLETCONNECT_PROJECT_ID: process.env.WALLETCONNECT_PROJECT_ID || '',
  API_BASE_URL: process.env.API_BASE_URL || 'https://api.deyond.io',
};

// RPC Provider Configuration
export const rpcConfig = {
  ethereum: {
    mainnet: {
      chainId: 1,
      name: 'Ethereum Mainnet',
      rpcUrl: `https://eth-mainnet.g.alchemy.com/v2/${env.ALCHEMY_API_KEY}`,
      blockExplorer: 'https://etherscan.io',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    },
    goerli: {
      chainId: 5,
      name: 'Goerli Testnet',
      rpcUrl: `https://eth-goerli.g.alchemy.com/v2/${env.ALCHEMY_API_KEY}`,
      blockExplorer: 'https://goerli.etherscan.io',
      nativeCurrency: { name: 'Goerli Ether', symbol: 'ETH', decimals: 18 },
    },
    sepolia: {
      chainId: 11155111,
      name: 'Sepolia Testnet',
      rpcUrl: `https://eth-sepolia.g.alchemy.com/v2/${env.ALCHEMY_API_KEY}`,
      blockExplorer: 'https://sepolia.etherscan.io',
      nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    },
  },
  polygon: {
    mainnet: {
      chainId: 137,
      name: 'Polygon Mainnet',
      rpcUrl: `https://polygon-mainnet.g.alchemy.com/v2/${env.ALCHEMY_API_KEY}`,
      blockExplorer: 'https://polygonscan.com',
      nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    },
  },
  arbitrum: {
    mainnet: {
      chainId: 42161,
      name: 'Arbitrum One',
      rpcUrl: `https://arb-mainnet.g.alchemy.com/v2/${env.ALCHEMY_API_KEY}`,
      blockExplorer: 'https://arbiscan.io',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    },
  },
  optimism: {
    mainnet: {
      chainId: 10,
      name: 'Optimism',
      rpcUrl: `https://opt-mainnet.g.alchemy.com/v2/${env.ALCHEMY_API_KEY}`,
      blockExplorer: 'https://optimistic.etherscan.io',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    },
  },
};

// Price Service Configuration
export const priceConfig = {
  coingecko: {
    baseUrl: env.COINGECKO_API_KEY
      ? 'https://pro-api.coingecko.com/api/v3'
      : 'https://api.coingecko.com/api/v3',
    apiKey: env.COINGECKO_API_KEY,
    cacheTTL: 60000, // 1 minute
    rateLimitPerMinute: env.COINGECKO_API_KEY ? 500 : 50,
  },
};

// Error Monitoring Configuration
export const sentryConfig = {
  dsn: env.SENTRY_DSN,
  environment: process.env.APP_ENV || 'development',
  tracesSampleRate: 0.2,
  enableAutoSessionTracking: true,
  attachStacktrace: true,
};

// Analytics Configuration
export const analyticsConfig = {
  mixpanel: {
    token: env.MIXPANEL_TOKEN,
    trackAutomaticEvents: true,
  },
  amplitude: {
    apiKey: env.AMPLITUDE_API_KEY,
    trackingOptions: {
      ipAddress: false,
      language: true,
      platform: true,
    },
  },
};

// WalletConnect Configuration
export const walletConnectConfig = {
  projectId: env.WALLETCONNECT_PROJECT_ID,
  metadata: {
    name: 'Deyond Wallet',
    description: 'Secure crypto wallet',
    url: 'https://deyond.io',
    icons: ['https://deyond.io/icon.png'],
  },
};

// API Configuration
export const apiConfig = {
  baseUrl: env.API_BASE_URL,
  timeout: 30000,
  retries: 3,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Version': '1.0.0',
  },
};

// Export all configs
export default {
  rpc: rpcConfig,
  price: priceConfig,
  sentry: sentryConfig,
  analytics: analyticsConfig,
  walletConnect: walletConnectConfig,
  api: apiConfig,
};
