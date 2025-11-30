/**
 * ErrorService
 * Centralized error handling with user-friendly messages
 */

import i18n from '../../i18n';
import { logger } from '../../utils';

/**
 * Error types in the application
 */
export enum ErrorType {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONNECTION_LOST = 'CONNECTION_LOST',

  // Wallet errors
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  INVALID_MNEMONIC = 'INVALID_MNEMONIC',
  WALLET_LOCKED = 'WALLET_LOCKED',

  // Authentication errors
  INCORRECT_PIN = 'INCORRECT_PIN',
  INCORRECT_PASSWORD = 'INCORRECT_PASSWORD',
  BIOMETRIC_FAILED = 'BIOMETRIC_FAILED',

  // Validation errors
  REQUIRED_FIELD = 'REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  OPERATION_CANCELLED = 'OPERATION_CANCELLED',
}

/**
 * Custom application error class
 */
export class AppError extends Error {
  type: ErrorType;
  originalError?: Error;
  details?: any;
  retryable: boolean;

  constructor(
    type: ErrorType,
    message?: string,
    originalError?: Error,
    details?: any,
    retryable: boolean = false
  ) {
    super(message || ErrorService.getErrorMessage(type));
    this.name = 'AppError';
    this.type = type;
    this.originalError = originalError;
    this.details = details;
    this.retryable = retryable;
  }
}

/**
 * Error service for handling and formatting errors
 */
export class ErrorService {
  /**
   * Get user-friendly error message based on error type
   */
  static getErrorMessage(type: ErrorType, details?: any): string {
    switch (type) {
      // Network errors
      case ErrorType.NETWORK_ERROR:
        return i18n.t('errors.network');
      case ErrorType.TIMEOUT_ERROR:
        return i18n.t('errors.timeout');
      case ErrorType.CONNECTION_LOST:
        return i18n.t('errors.network');

      // Wallet errors
      case ErrorType.INVALID_ADDRESS:
        return i18n.t('send.errors.invalidAddress');
      case ErrorType.INSUFFICIENT_BALANCE:
        return i18n.t('send.errors.insufficientBalance');
      case ErrorType.INVALID_AMOUNT:
        return i18n.t('send.errors.invalidAmount');
      case ErrorType.TRANSACTION_FAILED:
        return details?.message || i18n.t('errors.generic');
      case ErrorType.INVALID_MNEMONIC:
        return i18n.t('import.errors.invalidMnemonic');
      case ErrorType.WALLET_LOCKED:
        return i18n.t('auth.locked');

      // Authentication errors
      case ErrorType.INCORRECT_PIN:
        return i18n.t('auth.incorrectPin');
      case ErrorType.INCORRECT_PASSWORD:
        return i18n.t('createWallet.errors.passwordsNotMatch');
      case ErrorType.BIOMETRIC_FAILED:
        return i18n.t('errors.generic');

      // Validation errors
      case ErrorType.REQUIRED_FIELD:
        return i18n.t('errors.generic');
      case ErrorType.INVALID_FORMAT:
        return i18n.t('errors.generic');

      // Generic errors
      case ErrorType.OPERATION_CANCELLED:
        return 'Operation cancelled';
      case ErrorType.UNKNOWN_ERROR:
      default:
        return i18n.t('errors.generic');
    }
  }

  /**
   * Parse error from various sources into AppError
   */
  static parseError(error: any): AppError {
    // Already an AppError
    if (error instanceof AppError) {
      return error;
    }

    // Network errors
    if (error.message?.includes('Network') || error.code === 'NETWORK_ERROR') {
      return new AppError(ErrorType.NETWORK_ERROR, undefined, error, undefined, true);
    }

    if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
      return new AppError(ErrorType.TIMEOUT_ERROR, undefined, error, undefined, true);
    }

    // Wallet errors
    if (error.message?.includes('insufficient')) {
      return new AppError(ErrorType.INSUFFICIENT_BALANCE, undefined, error);
    }

    if (error.message?.includes('invalid address')) {
      return new AppError(ErrorType.INVALID_ADDRESS, undefined, error);
    }

    // Default unknown error
    return new AppError(
      ErrorType.UNKNOWN_ERROR,
      error.message || 'An unknown error occurred',
      error instanceof Error ? error : undefined
    );
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: AppError): boolean {
    return (
      error.retryable ||
      [ErrorType.NETWORK_ERROR, ErrorType.TIMEOUT_ERROR, ErrorType.CONNECTION_LOST].includes(
        error.type
      )
    );
  }

  /**
   * Log error (in production, send to error tracking service)
   */
  static logError(error: AppError, context?: string): void {
    logger.error(`ErrorService: ${error.message}`, error.originalError, {
      service: 'ErrorService',
      context,
      errorType: error.type,
      details: error.details,
    });
  }

  /**
   * Handle error with toast notification
   */
  static handleError(
    error: any,
    showToast?: (message: string, type: 'error' | 'success' | 'info') => void,
    context?: string
  ): AppError {
    const appError = this.parseError(error);
    this.logError(appError, context);

    if (showToast) {
      showToast(appError.message, 'error');
    }

    return appError;
  }

  /**
   * Retry operation with exponential backoff
   */
  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const appError = this.parseError(error);

        if (!this.isRetryable(appError) || i === maxRetries - 1) {
          throw appError;
        }

        // Exponential backoff
        const delay = initialDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw this.parseError(lastError);
  }
}

export default ErrorService;
