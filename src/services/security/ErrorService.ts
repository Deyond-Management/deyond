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

// Error message configurations
// Using functions to ensure i18n is evaluated at runtime (for language changes)
const ERROR_MESSAGES: Record<ErrorType, (details?: any) => string> = {
  // Network errors
  [ErrorType.NETWORK_ERROR]: () => i18n.t('errors.network'),
  [ErrorType.TIMEOUT_ERROR]: () => i18n.t('errors.timeout'),
  [ErrorType.CONNECTION_LOST]: () => i18n.t('errors.network'),

  // Wallet errors
  [ErrorType.INVALID_ADDRESS]: () => i18n.t('send.errors.invalidAddress'),
  [ErrorType.INSUFFICIENT_BALANCE]: () => i18n.t('send.errors.insufficientBalance'),
  [ErrorType.INVALID_AMOUNT]: () => i18n.t('send.errors.invalidAmount'),
  [ErrorType.TRANSACTION_FAILED]: (details?: any) => details?.message || i18n.t('errors.generic'),
  [ErrorType.INVALID_MNEMONIC]: () => i18n.t('import.errors.invalidMnemonic'),
  [ErrorType.WALLET_LOCKED]: () => i18n.t('auth.locked'),

  // Authentication errors
  [ErrorType.INCORRECT_PIN]: () => i18n.t('auth.incorrectPin'),
  [ErrorType.INCORRECT_PASSWORD]: () => i18n.t('createWallet.errors.passwordsNotMatch'),
  [ErrorType.BIOMETRIC_FAILED]: () => i18n.t('errors.generic'),

  // Validation errors
  [ErrorType.REQUIRED_FIELD]: () => i18n.t('errors.generic'),
  [ErrorType.INVALID_FORMAT]: () => i18n.t('errors.generic'),

  // Generic errors
  [ErrorType.OPERATION_CANCELLED]: () => 'Operation cancelled',
  [ErrorType.UNKNOWN_ERROR]: () => i18n.t('errors.generic'),
};

/**
 * Error service for handling and formatting errors
 */
export class ErrorService {
  /**
   * Get user-friendly error message based on error type
   */
  static getErrorMessage(type: ErrorType, details?: any): string {
    const messageGetter = ERROR_MESSAGES[type] || ERROR_MESSAGES[ErrorType.UNKNOWN_ERROR];
    return messageGetter(details);
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
