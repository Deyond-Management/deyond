/**
 * Services Configuration
 * Centralized configuration for all services
 */

export interface SecurityConfig {
  maxFailedAttempts: number;
  lockDuration: number; // milliseconds
  defaultAutoLockTimeout: number; // milliseconds
}

export interface CacheConfig {
  balanceTimeout: number; // milliseconds
  gasTimeout: number; // milliseconds
  priceTimeout: number; // milliseconds
}

export interface BlockchainConfig {
  defaultChainId: number;
  rpcTimeout: number; // milliseconds
  confirmationBlocks: number;
}

export interface CryptoConfig {
  pbkdf2Iterations: number;
  keyLength: number;
  saltLength: number;
}

export interface PrivacyConfig {
  dataRetentionDays: number;
}

export interface ServicesConfig {
  security: SecurityConfig;
  cache: CacheConfig;
  blockchain: BlockchainConfig;
  crypto: CryptoConfig;
  privacy: PrivacyConfig;
}

/**
 * Default services configuration
 */
export const DEFAULT_SERVICES_CONFIG: ServicesConfig = {
  security: {
    maxFailedAttempts: 5,
    lockDuration: 300000, // 5 minutes
    defaultAutoLockTimeout: 300000, // 5 minutes
  },
  cache: {
    balanceTimeout: 30000, // 30 seconds
    gasTimeout: 15000, // 15 seconds
    priceTimeout: 60000, // 60 seconds
  },
  blockchain: {
    defaultChainId: 1, // Ethereum Mainnet
    rpcTimeout: 30000, // 30 seconds
    confirmationBlocks: 12,
  },
  crypto: {
    pbkdf2Iterations: 100000,
    keyLength: 32, // 256 bits
    saltLength: 32,
  },
  privacy: {
    dataRetentionDays: 365,
  },
};

/**
 * Get services configuration with optional overrides
 */
export function getServicesConfig(overrides?: Partial<ServicesConfig>): ServicesConfig {
  return {
    security: { ...DEFAULT_SERVICES_CONFIG.security, ...overrides?.security },
    cache: { ...DEFAULT_SERVICES_CONFIG.cache, ...overrides?.cache },
    blockchain: { ...DEFAULT_SERVICES_CONFIG.blockchain, ...overrides?.blockchain },
    crypto: { ...DEFAULT_SERVICES_CONFIG.crypto, ...overrides?.crypto },
    privacy: { ...DEFAULT_SERVICES_CONFIG.privacy, ...overrides?.privacy },
  };
}
