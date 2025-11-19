/**
 * AppError
 * Base error class hierarchy for consistent error handling
 */

import { ERROR_CODES, getErrorMessage, ErrorCode } from '../../config/constants/ErrorCodes';

/**
 * Base application error
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly timestamp: number;
  public readonly context?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message?: string,
    context?: Record<string, unknown>
  ) {
    super(message || getErrorMessage(code));
    this.name = 'AppError';
    this.code = code;
    this.timestamp = Date.now();
    this.context = context;

    // Maintains proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Network related errors
 */
export class NetworkError extends AppError {
  public readonly statusCode?: number;

  constructor(
    code: ErrorCode = ERROR_CODES.NETWORK_ERROR,
    message?: string,
    statusCode?: number,
    context?: Record<string, unknown>
  ) {
    super(code, message, context);
    this.name = 'NetworkError';
    this.statusCode = statusCode;
  }
}

/**
 * RPC/Blockchain related errors
 */
export class RpcError extends AppError {
  public readonly rpcCode?: number;
  public readonly data?: unknown;

  constructor(
    code: ErrorCode = ERROR_CODES.RPC_ERROR,
    message?: string,
    rpcCode?: number,
    data?: unknown,
    context?: Record<string, unknown>
  ) {
    super(code, message, context);
    this.name = 'RpcError';
    this.rpcCode = rpcCode;
    this.data = data;
  }
}

/**
 * Transaction related errors
 */
export class TransactionError extends AppError {
  public readonly txHash?: string;
  public readonly receipt?: unknown;

  constructor(
    code: ErrorCode = ERROR_CODES.TX_FAILED,
    message?: string,
    txHash?: string,
    receipt?: unknown,
    context?: Record<string, unknown>
  ) {
    super(code, message, context);
    this.name = 'TransactionError';
    this.txHash = txHash;
    this.receipt = receipt;
  }
}

/**
 * Wallet related errors
 */
export class WalletError extends AppError {
  constructor(
    code: ErrorCode = ERROR_CODES.WALLET_NOT_FOUND,
    message?: string,
    context?: Record<string, unknown>
  ) {
    super(code, message, context);
    this.name = 'WalletError';
  }
}

/**
 * Authentication related errors
 */
export class AuthError extends AppError {
  public readonly attemptsRemaining?: number;
  public readonly lockoutUntil?: number;

  constructor(
    code: ErrorCode = ERROR_CODES.INVALID_PIN,
    message?: string,
    attemptsRemaining?: number,
    lockoutUntil?: number,
    context?: Record<string, unknown>
  ) {
    super(code, message, context);
    this.name = 'AuthError';
    this.attemptsRemaining = attemptsRemaining;
    this.lockoutUntil = lockoutUntil;
  }
}

/**
 * Validation errors
 */
export class ValidationError extends AppError {
  public readonly field?: string;
  public readonly value?: unknown;

  constructor(
    message?: string,
    field?: string,
    value?: unknown,
    context?: Record<string, unknown>
  ) {
    super(ERROR_CODES.VALIDATION_ERROR, message, context);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

/**
 * Contract interaction errors
 */
export class ContractError extends AppError {
  public readonly contractAddress?: string;
  public readonly methodName?: string;

  constructor(
    code: ErrorCode = ERROR_CODES.CONTRACT_ERROR,
    message?: string,
    contractAddress?: string,
    methodName?: string,
    context?: Record<string, unknown>
  ) {
    super(code, message, context);
    this.name = 'ContractError';
    this.contractAddress = contractAddress;
    this.methodName = methodName;
  }
}

/**
 * Error factory for creating errors from unknown sources
 */
export const createAppError = (
  error: unknown,
  defaultCode: ErrorCode = ERROR_CODES.UNKNOWN_ERROR
): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(defaultCode, error.message);
  }

  if (typeof error === 'string') {
    return new AppError(defaultCode, error);
  }

  return new AppError(defaultCode);
};

/**
 * Type guard for AppError
 */
export const isAppError = (error: unknown): error is AppError => {
  return error instanceof AppError;
};

/**
 * Extract error code from any error
 */
export const getErrorCode = (error: unknown): ErrorCode => {
  if (error instanceof AppError) {
    return error.code;
  }
  return ERROR_CODES.UNKNOWN_ERROR;
};

/**
 * Extract user-friendly message from any error
 */
export const getUserMessage = (error: unknown): string => {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return getErrorMessage(ERROR_CODES.UNKNOWN_ERROR);
};
