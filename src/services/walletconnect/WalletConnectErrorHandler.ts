/**
 * WalletConnectErrorHandler
 * Centralized error handling for WalletConnect operations
 */

import i18n from '../../i18n';

// Error codes based on EIP-1193 and WalletConnect standards
export enum WalletConnectErrorCode {
  // Standard JSON-RPC errors
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,
  PARSE_ERROR = -32700,

  // User rejection errors (EIP-1193)
  USER_REJECTED = 4001,
  UNAUTHORIZED = 4100,
  UNSUPPORTED_METHOD = 4200,
  DISCONNECTED = 4900,
  CHAIN_DISCONNECTED = 4901,
  CHAIN_NOT_SUPPORTED = 4902,

  // WalletConnect specific errors
  PAIRING_EXPIRED = 5000,
  SESSION_NOT_FOUND = 5001,
  PAIRING_FAILED = 5002,
  SESSION_SETTLED = 5003,
  SESSION_REQUEST_REJECTED = 5004,
  CONNECTION_TIMEOUT = 5100,
  NETWORK_ERROR = 5101,
  INVALID_URI = 5200,
  RATE_LIMITED = 5300,
}

export interface WalletConnectError {
  code: WalletConnectErrorCode;
  message: string;
  recoverable: boolean;
  retryable: boolean;
  action?: ErrorAction;
}

export type ErrorAction = 'retry' | 'dismiss' | 'settings' | 'reconnect';

/**
 * Parse and categorize WalletConnect errors
 */
export function parseWalletConnectError(error: any): WalletConnectError {
  // Handle string errors
  if (typeof error === 'string') {
    return parseErrorMessage(error);
  }

  // Handle error objects with code
  if (error?.code) {
    return parseErrorCode(error.code, error.message);
  }

  // Handle network errors
  if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
    return {
      code: WalletConnectErrorCode.NETWORK_ERROR,
      message: i18n.t('walletConnectErrors.networkError'),
      recoverable: true,
      retryable: true,
      action: 'retry',
    };
  }

  // Handle timeout errors
  if (error?.message?.includes('timeout') || error?.message?.includes('Timeout')) {
    return {
      code: WalletConnectErrorCode.CONNECTION_TIMEOUT,
      message: i18n.t('walletConnectErrors.connectionTimeout'),
      recoverable: true,
      retryable: true,
      action: 'retry',
    };
  }

  // Default error
  return {
    code: WalletConnectErrorCode.INTERNAL_ERROR,
    message: error?.message || i18n.t('walletConnectErrors.unknownError'),
    recoverable: false,
    retryable: false,
    action: 'dismiss',
  };
}

/**
 * Parse error by code
 */
function parseErrorCode(code: number, message?: string): WalletConnectError {
  switch (code) {
    case WalletConnectErrorCode.USER_REJECTED:
      return {
        code,
        message: i18n.t('walletConnectErrors.userRejected'),
        recoverable: true,
        retryable: false,
        action: 'dismiss',
      };

    case WalletConnectErrorCode.UNAUTHORIZED:
      return {
        code,
        message: i18n.t('walletConnectErrors.unauthorized'),
        recoverable: true,
        retryable: false,
        action: 'reconnect',
      };

    case WalletConnectErrorCode.CHAIN_NOT_SUPPORTED:
      return {
        code,
        message: i18n.t('walletConnectErrors.chainNotSupported'),
        recoverable: true,
        retryable: false,
        action: 'settings',
      };

    case WalletConnectErrorCode.DISCONNECTED:
    case WalletConnectErrorCode.CHAIN_DISCONNECTED:
      return {
        code,
        message: i18n.t('walletConnectErrors.disconnected'),
        recoverable: true,
        retryable: true,
        action: 'reconnect',
      };

    case WalletConnectErrorCode.PAIRING_EXPIRED:
      return {
        code,
        message: i18n.t('walletConnectErrors.pairingExpired'),
        recoverable: true,
        retryable: true,
        action: 'retry',
      };

    case WalletConnectErrorCode.SESSION_NOT_FOUND:
      return {
        code,
        message: i18n.t('walletConnectErrors.sessionNotFound'),
        recoverable: true,
        retryable: true,
        action: 'reconnect',
      };

    case WalletConnectErrorCode.PAIRING_FAILED:
      return {
        code,
        message: i18n.t('walletConnectErrors.pairingFailed'),
        recoverable: true,
        retryable: true,
        action: 'retry',
      };

    case WalletConnectErrorCode.INVALID_URI:
      return {
        code,
        message: i18n.t('walletConnectErrors.invalidUri'),
        recoverable: true,
        retryable: false,
        action: 'dismiss',
      };

    case WalletConnectErrorCode.RATE_LIMITED:
      return {
        code,
        message: i18n.t('walletConnectErrors.rateLimited'),
        recoverable: true,
        retryable: true,
        action: 'retry',
      };

    case WalletConnectErrorCode.CONNECTION_TIMEOUT:
      return {
        code,
        message: i18n.t('walletConnectErrors.connectionTimeout'),
        recoverable: true,
        retryable: true,
        action: 'retry',
      };

    case WalletConnectErrorCode.NETWORK_ERROR:
      return {
        code,
        message: i18n.t('walletConnectErrors.networkError'),
        recoverable: true,
        retryable: true,
        action: 'retry',
      };

    default:
      return {
        code: code as WalletConnectErrorCode,
        message: message || i18n.t('walletConnectErrors.unknownError'),
        recoverable: false,
        retryable: false,
        action: 'dismiss',
      };
  }
}

/**
 * Parse error by message
 */
function parseErrorMessage(message: string): WalletConnectError {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('rejected') || lowerMessage.includes('user denied')) {
    return {
      code: WalletConnectErrorCode.USER_REJECTED,
      message: i18n.t('walletConnectErrors.userRejected'),
      recoverable: true,
      retryable: false,
      action: 'dismiss',
    };
  }

  if (lowerMessage.includes('expired')) {
    return {
      code: WalletConnectErrorCode.PAIRING_EXPIRED,
      message: i18n.t('walletConnectErrors.pairingExpired'),
      recoverable: true,
      retryable: true,
      action: 'retry',
    };
  }

  if (lowerMessage.includes('invalid') && lowerMessage.includes('uri')) {
    return {
      code: WalletConnectErrorCode.INVALID_URI,
      message: i18n.t('walletConnectErrors.invalidUri'),
      recoverable: true,
      retryable: false,
      action: 'dismiss',
    };
  }

  if (lowerMessage.includes('network') || lowerMessage.includes('offline')) {
    return {
      code: WalletConnectErrorCode.NETWORK_ERROR,
      message: i18n.t('walletConnectErrors.networkError'),
      recoverable: true,
      retryable: true,
      action: 'retry',
    };
  }

  if (lowerMessage.includes('timeout')) {
    return {
      code: WalletConnectErrorCode.CONNECTION_TIMEOUT,
      message: i18n.t('walletConnectErrors.connectionTimeout'),
      recoverable: true,
      retryable: true,
      action: 'retry',
    };
  }

  if (lowerMessage.includes('not supported')) {
    return {
      code: WalletConnectErrorCode.CHAIN_NOT_SUPPORTED,
      message: i18n.t('walletConnectErrors.chainNotSupported'),
      recoverable: true,
      retryable: false,
      action: 'settings',
    };
  }

  return {
    code: WalletConnectErrorCode.INTERNAL_ERROR,
    message,
    recoverable: false,
    retryable: false,
    action: 'dismiss',
  };
}

/**
 * Get action button text for error
 */
export function getErrorActionText(action: ErrorAction): string {
  switch (action) {
    case 'retry':
      return i18n.t('common.retry');
    case 'dismiss':
      return i18n.t('common.ok');
    case 'settings':
      return i18n.t('walletConnectErrors.openSettings');
    case 'reconnect':
      return i18n.t('walletConnectErrors.reconnect');
    default:
      return i18n.t('common.ok');
  }
}

export default {
  parseWalletConnectError,
  getErrorActionText,
  WalletConnectErrorCode,
};
