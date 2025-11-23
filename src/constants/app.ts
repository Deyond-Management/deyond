/**
 * App Constants
 * Global constants used throughout the application
 */

// App Info
export const APP_NAME = 'Deyond Wallet';
export const APP_VERSION = '1.0.0';
export const APP_BUILD = '1';

// Wallet
export const DEFAULT_DERIVATION_PATH = "m/44'/60'/0'/0/0";
export const MNEMONIC_WORD_COUNT = 12;
export const PIN_LENGTH = 6;
export const MAX_PIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION = 300000; // 5 minutes

// Network
export const DEFAULT_NETWORK_ID = 'ethereum-mainnet';
export const SUPPORTED_NETWORKS = [
  'ethereum-mainnet',
  'ethereum-goerli',
  'polygon-mainnet',
  'polygon-mumbai',
  'arbitrum-mainnet',
  'optimism-mainnet',
];

// Gas
export const DEFAULT_GAS_LIMIT = '21000';
export const ERC20_GAS_LIMIT = '65000';
export const CONTRACT_GAS_LIMIT = '100000';
export const GAS_PRICE_REFRESH_INTERVAL = 15000; // 15 seconds

// Transactions
export const TRANSACTION_CONFIRMATIONS = 1;
export const TRANSACTION_TIMEOUT = 300000; // 5 minutes
export const MAX_RECENT_TRANSACTIONS = 50;

// BLE
export const BLE_SERVICE_UUID = '12345678-1234-5678-1234-56789abcdef0';
export const BLE_CHARACTERISTIC_UUID = '12345678-1234-5678-1234-56789abcdef1';
export const BLE_SCAN_TIMEOUT = 30000; // 30 seconds
export const BLE_CONNECTION_TIMEOUT = 10000; // 10 seconds

// Security
export const AUTO_LOCK_OPTIONS = [
  { label: 'Immediately', value: 0 },
  { label: '1 minute', value: 60000 },
  { label: '5 minutes', value: 300000 },
  { label: '15 minutes', value: 900000 },
  { label: '1 hour', value: 3600000 },
  { label: 'Never', value: -1 },
];

// UI
export const ANIMATION_DURATION = 300;
export const TOAST_DURATION = 3000;
export const SKELETON_ANIMATION_DURATION = 1000;

// Storage Keys
export const STORAGE_KEYS = {
  WALLET: '@wallet',
  SETTINGS: '@settings',
  THEME: '@theme',
  NETWORK: '@network',
  PIN_HASH: '@pin_hash',
  BIOMETRICS_ENABLED: '@biometrics_enabled',
  AUTO_LOCK_TIMEOUT: '@auto_lock_timeout',
  RECENT_ADDRESSES: '@recent_addresses',
  CHAT_SESSIONS: '@chat_sessions',
};

// API Endpoints
export const API_ENDPOINTS = {
  GAS_PRICE: '/api/gas-price',
  TOKEN_PRICES: '/api/token-prices',
  TRANSACTION_HISTORY: '/api/transactions',
};

// Regex Patterns
export const PATTERNS = {
  ETH_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
  TX_HASH: /^0x[a-fA-F0-9]{64}$/,
  PRIVATE_KEY: /^0x[a-fA-F0-9]{64}$/,
  NUMERIC: /^\d+$/,
  DECIMAL: /^\d*\.?\d*$/,
};

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_ADDRESS: 'Invalid Ethereum address',
  INVALID_AMOUNT: 'Invalid amount',
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  NETWORK_ERROR: 'Network error. Please try again.',
  TRANSACTION_FAILED: 'Transaction failed',
  INVALID_PIN: 'Invalid PIN',
  BIOMETRICS_FAILED: 'Biometric authentication failed',
  BLE_NOT_AVAILABLE: 'Bluetooth is not available',
  BLE_CONNECTION_FAILED: 'Failed to connect to device',
};
