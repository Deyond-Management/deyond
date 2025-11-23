/**
 * Centralized Error Codes and Messages
 * Single source of truth for error handling
 */

// Error codes by category
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  NO_CONNECTION: 'NO_CONNECTION',
  SSL_ERROR: 'SSL_ERROR',

  // RPC errors
  RPC_ERROR: 'RPC_ERROR',
  RPC_RATE_LIMITED: 'RPC_RATE_LIMITED',
  RPC_UNAVAILABLE: 'RPC_UNAVAILABLE',
  INVALID_RESPONSE: 'INVALID_RESPONSE',

  // Transaction errors
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  INSUFFICIENT_GAS: 'INSUFFICIENT_GAS',
  NONCE_TOO_LOW: 'NONCE_TOO_LOW',
  REPLACEMENT_UNDERPRICED: 'REPLACEMENT_UNDERPRICED',
  GAS_TOO_LOW: 'GAS_TOO_LOW',
  TX_REJECTED: 'TX_REJECTED',
  TX_FAILED: 'TX_FAILED',

  // Wallet errors
  INVALID_MNEMONIC: 'INVALID_MNEMONIC',
  INVALID_PRIVATE_KEY: 'INVALID_PRIVATE_KEY',
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',
  ENCRYPTION_ERROR: 'ENCRYPTION_ERROR',
  DECRYPTION_ERROR: 'DECRYPTION_ERROR',

  // Auth errors
  INVALID_PIN: 'INVALID_PIN',
  BIOMETRICS_FAILED: 'BIOMETRICS_FAILED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Contract errors
  CONTRACT_ERROR: 'CONTRACT_ERROR',
  APPROVAL_ERROR: 'APPROVAL_ERROR',
  EXECUTION_REVERTED: 'EXECUTION_REVERTED',

  // General errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
} as const;

// User-friendly error messages
export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.NETWORK_ERROR]: 'Network error. Please check your connection.',
  [ERROR_CODES.TIMEOUT]: 'Request timed out. Please try again.',
  [ERROR_CODES.NO_CONNECTION]: 'No internet connection.',
  [ERROR_CODES.SSL_ERROR]: 'Secure connection failed.',

  [ERROR_CODES.RPC_ERROR]: 'Blockchain connection error.',
  [ERROR_CODES.RPC_RATE_LIMITED]: 'Too many requests. Please wait.',
  [ERROR_CODES.RPC_UNAVAILABLE]: 'Blockchain service unavailable.',
  [ERROR_CODES.INVALID_RESPONSE]: 'Invalid response from server.',

  [ERROR_CODES.INSUFFICIENT_FUNDS]: 'Insufficient funds for transaction.',
  [ERROR_CODES.INSUFFICIENT_GAS]: 'Insufficient funds for gas.',
  [ERROR_CODES.NONCE_TOO_LOW]: 'Transaction already processed.',
  [ERROR_CODES.REPLACEMENT_UNDERPRICED]: 'Gas price too low to replace transaction.',
  [ERROR_CODES.GAS_TOO_LOW]: 'Gas limit too low.',
  [ERROR_CODES.TX_REJECTED]: 'Transaction rejected.',
  [ERROR_CODES.TX_FAILED]: 'Transaction failed.',

  [ERROR_CODES.INVALID_MNEMONIC]: 'Invalid recovery phrase.',
  [ERROR_CODES.INVALID_PRIVATE_KEY]: 'Invalid private key.',
  [ERROR_CODES.INVALID_ADDRESS]: 'Invalid wallet address.',
  [ERROR_CODES.WALLET_NOT_FOUND]: 'Wallet not found.',
  [ERROR_CODES.ENCRYPTION_ERROR]: 'Encryption failed.',
  [ERROR_CODES.DECRYPTION_ERROR]: 'Decryption failed.',

  [ERROR_CODES.INVALID_PIN]: 'Invalid PIN.',
  [ERROR_CODES.BIOMETRICS_FAILED]: 'Biometric authentication failed.',
  [ERROR_CODES.ACCOUNT_LOCKED]: 'Account locked. Please try again later.',
  [ERROR_CODES.SESSION_EXPIRED]: 'Session expired. Please login again.',

  [ERROR_CODES.CONTRACT_ERROR]: 'Smart contract error.',
  [ERROR_CODES.APPROVAL_ERROR]: 'Token approval failed.',
  [ERROR_CODES.EXECUTION_REVERTED]: 'Transaction reverted by contract.',

  [ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred.',
  [ERROR_CODES.VALIDATION_ERROR]: 'Invalid input.',
  [ERROR_CODES.NOT_FOUND]: 'Resource not found.',
  [ERROR_CODES.PERMISSION_DENIED]: 'Permission denied.',
};

// RPC error code mapping (Ethereum JSON-RPC)
export const RPC_ERROR_MAP: Record<number, string> = {
  [-32700]: ERROR_CODES.INVALID_RESPONSE,   // Parse error
  [-32600]: ERROR_CODES.VALIDATION_ERROR,   // Invalid Request
  [-32601]: ERROR_CODES.RPC_ERROR,          // Method not found
  [-32602]: ERROR_CODES.VALIDATION_ERROR,   // Invalid params
  [-32603]: ERROR_CODES.RPC_ERROR,          // Internal error
  [-32000]: ERROR_CODES.INSUFFICIENT_FUNDS, // Server error (often insufficient funds)
  [-32001]: ERROR_CODES.NOT_FOUND,          // Resource not found
  [-32002]: ERROR_CODES.RPC_UNAVAILABLE,    // Resource unavailable
  [-32003]: ERROR_CODES.TX_REJECTED,        // Transaction rejected
  [-32004]: ERROR_CODES.RPC_ERROR,          // Method not supported
  [-32005]: ERROR_CODES.RPC_RATE_LIMITED,   // Limit exceeded
};

// HTTP status code mapping
export const HTTP_ERROR_MAP: Record<number, string> = {
  400: ERROR_CODES.VALIDATION_ERROR,
  401: ERROR_CODES.SESSION_EXPIRED,
  403: ERROR_CODES.PERMISSION_DENIED,
  404: ERROR_CODES.NOT_FOUND,
  408: ERROR_CODES.TIMEOUT,
  429: ERROR_CODES.RPC_RATE_LIMITED,
  500: ERROR_CODES.RPC_ERROR,
  502: ERROR_CODES.RPC_UNAVAILABLE,
  503: ERROR_CODES.RPC_UNAVAILABLE,
  504: ERROR_CODES.TIMEOUT,
};

// Type exports
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// Helper functions
export const getErrorMessage = (code: string): string => {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR];
};

export const mapRpcError = (rpcCode: number): string => {
  return RPC_ERROR_MAP[rpcCode] || ERROR_CODES.RPC_ERROR;
};

export const mapHttpError = (statusCode: number): string => {
  return HTTP_ERROR_MAP[statusCode] || ERROR_CODES.NETWORK_ERROR;
};
