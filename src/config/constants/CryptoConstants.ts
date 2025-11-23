/**
 * Centralized Crypto Constants
 * Single source of truth for all magic numbers
 */

// Gas limits
export const GAS_LIMITS = {
  ETH_TRANSFER: 21000,
  ERC20_TRANSFER: 65000,
  ERC20_APPROVE: 50000,
  CONTRACT_DEPLOY: 100000,
  SWAP: 200000,
  NFT_TRANSFER: 100000,
  DEFAULT: 21000,
  MAX: 15_000_000,
} as const;

// Wei conversions
export const WEI_UNITS = {
  WEI: 1n,
  GWEI: 1_000_000_000n,
  ETHER: 1_000_000_000_000_000_000n,
} as const;

export const WEI_DECIMALS = {
  WEI: 0,
  GWEI: 9,
  ETHER: 18,
} as const;

// Cache TTLs (in milliseconds)
export const CACHE_TTL = {
  SHORT: 15_000, // 15 seconds
  MEDIUM: 60_000, // 1 minute
  LONG: 300_000, // 5 minutes
  EXTENDED: 900_000, // 15 minutes
  PRICE: 30_000, // 30 seconds
  BALANCE: 60_000, // 1 minute
  GAS: 15_000, // 15 seconds
  ENS: 86_400_000, // 24 hours
} as const;

// API timeouts (in milliseconds)
export const API_TIMEOUT = {
  SHORT: 5_000,
  DEFAULT: 10_000,
  LONG: 30_000,
  TRANSACTION: 60_000,
} as const;

// Retry configuration
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY: 1_000,
  MAX_DELAY: 10_000,
  BACKOFF_FACTOR: 2,
} as const;

// Transaction constants
export const TRANSACTION = {
  CONFIRMATION_BLOCKS: 1,
  MAX_PENDING_TIME: 3_600_000, // 1 hour
  SPEED_UP_PERCENTAGE: 10,
  MIN_GAS_PRICE_GWEI: 1,
} as const;

// Security constants
export const SECURITY = {
  MAX_PIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 300_000, // 5 minutes
  SESSION_TIMEOUT: 900_000, // 15 minutes
  AUTO_LOCK_DEFAULT: 300_000, // 5 minutes
  MNEMONIC_WORDS: 12,
  MNEMONIC_WORDS_EXTENDED: 24,
  MIN_PASSWORD_LENGTH: 8,
} as const;

// Network chain IDs
export const CHAIN_IDS = {
  ETHEREUM_MAINNET: 1,
  GOERLI: 5,
  SEPOLIA: 11155111,
  POLYGON_MAINNET: 137,
  POLYGON_MUMBAI: 80001,
  ARBITRUM_ONE: 42161,
  OPTIMISM: 10,
  BSC_MAINNET: 56,
} as const;

// Token decimals
export const TOKEN_DECIMALS = {
  ETH: 18,
  USDT: 6,
  USDC: 6,
  DAI: 18,
  WBTC: 8,
  DEFAULT: 18,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  TRANSACTION_HISTORY: 50,
} as const;

// Performance thresholds
export const PERFORMANCE = {
  APP_LAUNCH_TIME: 3_000,
  SCREEN_TRANSITION: 300,
  API_RESPONSE: 2_000,
  ANIMATION_DURATION: 200,
} as const;

// Type exports
export type GasLimitKey = keyof typeof GAS_LIMITS;
export type CacheTTLKey = keyof typeof CACHE_TTL;
export type ChainId = (typeof CHAIN_IDS)[keyof typeof CHAIN_IDS];
