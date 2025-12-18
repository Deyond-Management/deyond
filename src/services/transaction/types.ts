/**
 * Transaction Speedup/Cancel Types
 * Type definitions for transaction management
 */

/**
 * Pending transaction info
 */
export interface PendingTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  nonce: number;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  gasLimit: string;
  data?: string;
  chainId: number;
  timestamp: number;
  type: 0 | 2; // 0 = legacy, 2 = EIP-1559
}

/**
 * Speedup options
 */
export interface SpeedupOptions {
  /** Gas price multiplier (default: 1.1 = 10% increase) */
  gasPriceMultiplier?: number;
  /** Fixed gas price to use (overrides multiplier) */
  fixedMaxFeePerGas?: string;
  /** Fixed priority fee to use */
  fixedMaxPriorityFeePerGas?: string;
  /** Skip gas estimation */
  skipEstimation?: boolean;
}

/**
 * Cancel options
 */
export interface CancelOptions {
  /** Gas price multiplier for cancel tx (default: 1.1) */
  gasPriceMultiplier?: number;
  /** Fixed gas price for cancel tx */
  fixedMaxFeePerGas?: string;
  /** Fixed priority fee for cancel tx */
  fixedMaxPriorityFeePerGas?: string;
}

/**
 * Speedup/Cancel result
 */
export interface TransactionReplaceResult {
  success: boolean;
  originalHash: string;
  newHash?: string;
  newGasPrice?: string;
  error?: string;
}

/**
 * Transaction status
 */
export enum TxStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  DROPPED = 'dropped',
  REPLACED = 'replaced',
}

/**
 * Monitored transaction
 */
export interface MonitoredTransaction {
  hash: string;
  nonce: number;
  from: string;
  chainId: number;
  status: TxStatus;
  createdAt: number;
  updatedAt: number;
  confirmations: number;
  replacedBy?: string;
  error?: string;
}

/**
 * Transaction status update
 */
export interface TransactionStatusUpdate {
  hash: string;
  status: TxStatus;
  confirmations?: number;
  blockNumber?: number;
  replacedBy?: string;
  error?: string;
}

/**
 * Gas estimation result
 */
export interface GasEstimation {
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  gasLimit: string;
  estimatedCost: string;
  baseFee?: string;
}

/**
 * Replacement transaction requirements
 */
export interface ReplacementRequirements {
  minMaxFeePerGas: string;
  minMaxPriorityFeePerGas: string;
  recommendedMaxFeePerGas: string;
  recommendedMaxPriorityFeePerGas: string;
  percentageIncrease: number;
}

/**
 * Transaction error types
 */
export enum TxErrorType {
  NONCE_TOO_LOW = 'NONCE_TOO_LOW',
  REPLACEMENT_UNDERPRICED = 'REPLACEMENT_UNDERPRICED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  TRANSACTION_NOT_FOUND = 'TRANSACTION_NOT_FOUND',
  ALREADY_CONFIRMED = 'ALREADY_CONFIRMED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_PARAMS = 'INVALID_PARAMS',
  SIGNING_FAILED = 'SIGNING_FAILED',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Transaction error class
 */
export class TxManagementError extends Error {
  type: TxErrorType;
  details?: any;

  constructor(type: TxErrorType, message: string, details?: any) {
    super(message);
    this.name = 'TxManagementError';
    this.type = type;
    this.details = details;
  }
}

/**
 * Default gas price increase percentage for replacement transactions
 * EIP-2718 requires at least 10% increase for replacement
 */
export const MIN_GAS_PRICE_BUMP = 10;
export const RECOMMENDED_GAS_PRICE_BUMP = 15;
export const DEFAULT_GAS_PRICE_MULTIPLIER = 1.1;

/**
 * Max pending transaction age before considered stale (24 hours)
 */
export const MAX_PENDING_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Transaction monitoring interval (10 seconds)
 */
export const TX_MONITOR_INTERVAL = 10000;
