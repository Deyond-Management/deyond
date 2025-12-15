/**
 * Production Configuration
 * Configuration for production environment
 */

export const ProductionConfig = {
  /**
   * API Configuration
   */
  api: {
    // TODO: Add production API endpoints
    alchemyApiKey: process.env.EXPO_PUBLIC_ALCHEMY_API_KEY || '',
    moralisApiKey: process.env.EXPO_PUBLIC_MORALIS_API_KEY || '',
    infuraApiKey: process.env.EXPO_PUBLIC_INFURA_API_KEY || '',
  },

  /**
   * Analytics Configuration
   */
  analytics: {
    // TODO: Add production analytics IDs
    googleAnalyticsId: process.env.EXPO_PUBLIC_GA_ID || '',
    mixpanelToken: process.env.EXPO_PUBLIC_MIXPANEL_TOKEN || '',
    amplitudeApiKey: process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY || '',
  },

  /**
   * Error Reporting Configuration
   */
  errorReporting: {
    // TODO: Add production error reporting DSNs
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
    bugsnagApiKey: process.env.EXPO_PUBLIC_BUGSNAG_API_KEY || '',
  },

  /**
   * Feature Flags
   */
  features: {
    // Core features
    enableBiometrics: true,
    enablePinLock: true,
    enableAutoLock: true,

    // Nice-to-have features
    enableMultiChain: true,
    enableDAppBrowser: true,
    enableWalletConnect: true,
    enableNFTGallery: true,

    // Experimental features
    enableP2PMessaging: false,
    enableTokenSwap: false,
    enableStaking: false,
  },

  /**
   * Security Configuration
   */
  security: {
    // Auto-lock timeout (milliseconds)
    autoLockTimeout: 5 * 60 * 1000, // 5 minutes

    // Max login attempts before lockout
    maxLoginAttempts: 5,

    // Lockout duration (milliseconds)
    lockoutDuration: 15 * 60 * 1000, // 15 minutes

    // Enable transaction confirmation for amounts above threshold
    requireConfirmationAbove: '1000000000000000000', // 1 ETH

    // Enable security warnings
    enableSecurityWarnings: true,
  },

  /**
   * Performance Configuration
   */
  performance: {
    // Slow render threshold (milliseconds)
    slowRenderThreshold: 500,

    // Enable performance monitoring
    enablePerformanceMonitoring: true,

    // Cache duration (milliseconds)
    cacheDuration: 60000, // 1 minute
  },

  /**
   * Network Configuration
   */
  network: {
    // Request timeout (milliseconds)
    requestTimeout: 30000, // 30 seconds

    // Max retry attempts
    maxRetries: 3,

    // Retry delay (milliseconds)
    retryDelay: 1000,
  },

  /**
   * Logging Configuration
   */
  logging: {
    // Enable console logging
    enableConsoleLogging: false,

    // Log level: 'debug' | 'info' | 'warn' | 'error'
    logLevel: 'error' as 'debug' | 'info' | 'warn' | 'error',

    // Enable remote logging
    enableRemoteLogging: true,
  },
};

export default ProductionConfig;
