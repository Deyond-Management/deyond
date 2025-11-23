/**
 * Centralized Storage Keys
 * Single source of truth for all AsyncStorage keys
 */

// Key prefixes
export const STORAGE_PREFIX = {
  WALLET: '@wallet_',
  SETTINGS: '@settings_',
  CACHE: '@cache_',
  AUTH: '@auth_',
  SYNC: '@sync_',
  ANALYTICS: '@analytics_',
  SUPPORT: '@support_',
} as const;

// Wallet storage keys
export const WALLET_KEYS = {
  ENCRYPTED_SEED: `${STORAGE_PREFIX.WALLET}encrypted_seed`,
  ADDRESSES: `${STORAGE_PREFIX.WALLET}addresses`,
  SELECTED_WALLET: `${STORAGE_PREFIX.WALLET}selected`,
  CUSTOM_TOKENS: `${STORAGE_PREFIX.WALLET}custom_tokens`,
  HIDDEN_TOKENS: `${STORAGE_PREFIX.WALLET}hidden_tokens`,
  TRANSACTION_HISTORY: `${STORAGE_PREFIX.WALLET}tx_history`,
} as const;

// Settings storage keys
export const SETTINGS_KEYS = {
  USER_SETTINGS: `${STORAGE_PREFIX.SETTINGS}user`,
  THEME: `${STORAGE_PREFIX.SETTINGS}theme`,
  LANGUAGE: `${STORAGE_PREFIX.SETTINGS}language`,
  CURRENCY: `${STORAGE_PREFIX.SETTINGS}currency`,
  NOTIFICATIONS: `${STORAGE_PREFIX.SETTINGS}notifications`,
  NETWORK: `${STORAGE_PREFIX.SETTINGS}network`,
  GAS_PREFERENCE: `${STORAGE_PREFIX.SETTINGS}gas_preference`,
} as const;

// Cache storage keys
export const CACHE_KEYS = {
  BALANCES: `${STORAGE_PREFIX.CACHE}balances`,
  PRICES: `${STORAGE_PREFIX.CACHE}prices`,
  GAS_PRICES: `${STORAGE_PREFIX.CACHE}gas_prices`,
  ENS_CACHE: `${STORAGE_PREFIX.CACHE}ens`,
  TOKEN_METADATA: `${STORAGE_PREFIX.CACHE}token_metadata`,
  NFT_METADATA: `${STORAGE_PREFIX.CACHE}nft_metadata`,
} as const;

// Auth storage keys
export const AUTH_KEYS = {
  PIN_HASH: `${STORAGE_PREFIX.AUTH}pin_hash`,
  BIOMETRICS_ENABLED: `${STORAGE_PREFIX.AUTH}biometrics`,
  LAST_ACTIVE: `${STORAGE_PREFIX.AUTH}last_active`,
  FAILED_ATTEMPTS: `${STORAGE_PREFIX.AUTH}failed_attempts`,
  LOCKOUT_UNTIL: `${STORAGE_PREFIX.AUTH}lockout_until`,
} as const;

// Sync storage keys
export const SYNC_KEYS = {
  STATE: `${STORAGE_PREFIX.SYNC}state`,
  PENDING: `${STORAGE_PREFIX.SYNC}pending`,
  LAST_SYNC: `${STORAGE_PREFIX.SYNC}last`,
} as const;

// Analytics storage keys
export const ANALYTICS_KEYS = {
  USER_ID: `${STORAGE_PREFIX.ANALYTICS}user_id`,
  SESSION_ID: `${STORAGE_PREFIX.ANALYTICS}session_id`,
  CONSENT: `${STORAGE_PREFIX.ANALYTICS}consent`,
  EVENT_QUEUE: `${STORAGE_PREFIX.ANALYTICS}event_queue`,
} as const;

// Support storage keys
export const SUPPORT_KEYS = {
  TICKETS: `${STORAGE_PREFIX.SUPPORT}tickets`,
  FAQ_CACHE: `${STORAGE_PREFIX.SUPPORT}faq_cache`,
} as const;

// All keys combined for easy clearing
export const ALL_STORAGE_KEYS = {
  ...WALLET_KEYS,
  ...SETTINGS_KEYS,
  ...CACHE_KEYS,
  ...AUTH_KEYS,
  ...SYNC_KEYS,
  ...ANALYTICS_KEYS,
  ...SUPPORT_KEYS,
} as const;

// Helper to get all keys for a prefix
export const getKeysForPrefix = (prefix: string): string[] => {
  return Object.values(ALL_STORAGE_KEYS).filter(key => key.startsWith(prefix));
};

// Type exports
export type WalletKey = typeof WALLET_KEYS[keyof typeof WALLET_KEYS];
export type SettingsKey = typeof SETTINGS_KEYS[keyof typeof SETTINGS_KEYS];
export type CacheKey = typeof CACHE_KEYS[keyof typeof CACHE_KEYS];
export type AuthKey = typeof AUTH_KEYS[keyof typeof AUTH_KEYS];
export type StorageKey = typeof ALL_STORAGE_KEYS[keyof typeof ALL_STORAGE_KEYS];
