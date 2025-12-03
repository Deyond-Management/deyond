/**
 * Application Configuration
 * Centralized configuration for the app
 */

// Check if we're in demo/mock mode
const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === 'true' || __DEV__;

export const AppConfig = {
  // Demo/Mock Mode
  demoMode: DEMO_MODE,

  // API Configuration
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.deyond.io',
    timeout: 30000,
    retryAttempts: 3,
  },

  // RPC Providers
  rpc: {
    ethereum: process.env.EXPO_PUBLIC_ETHEREUM_RPC_URL || '',
    polygon: process.env.EXPO_PUBLIC_POLYGON_RPC_URL || '',
    arbitrum: process.env.EXPO_PUBLIC_ARBITRUM_RPC_URL || '',
    optimism: process.env.EXPO_PUBLIC_OPTIMISM_RPC_URL || '',
  },

  // Feature Flags
  features: {
    enableBiometrics: true,
    enableNotifications: true,
    enableAnalytics: !DEMO_MODE,
    enableErrorMonitoring: !DEMO_MODE,
    enableDeepLinking: true,
  },

  // App Settings
  app: {
    version: '1.0.0',
    buildNumber: '1',
    environment: process.env.EXPO_PUBLIC_APP_ENV || 'development',
    logLevel: process.env.EXPO_PUBLIC_LOG_LEVEL || 'debug',
  },

  // Wallet Settings
  wallet: {
    defaultNetwork: 'ethereum',
    supportedNetworks: ['ethereum', 'polygon', 'arbitrum', 'optimism'],
    gasLimitBuffer: 1.2, // 20% buffer
  },
};

export default AppConfig;
