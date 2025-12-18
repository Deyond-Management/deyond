/**
 * RpcErrorParser
 * Centralized RPC error parsing with pattern matching and localization support
 */

import { ERROR_CODES, ErrorCode } from '../../config/constants/ErrorCodes';

/**
 * Raw RPC error from blockchain node
 */
export interface RawRpcError {
  code?: number;
  message: string;
  data?: unknown;
}

/**
 * Parsed error with user-friendly information
 */
export interface ParsedRpcError {
  code: ErrorCode;
  type: RpcErrorType;
  message: string;
  userMessage: string;
  recoverable: boolean;
  suggestedAction?: string;
}

/**
 * RPC error types
 */
export type RpcErrorType =
  | 'NONCE_TOO_LOW'
  | 'NONCE_TOO_HIGH'
  | 'INSUFFICIENT_FUNDS'
  | 'INSUFFICIENT_GAS'
  | 'GAS_LIMIT_EXCEEDED'
  | 'GAS_PRICE_TOO_LOW'
  | 'REPLACEMENT_UNDERPRICED'
  | 'EXECUTION_REVERTED'
  | 'CONTRACT_ERROR'
  | 'INVALID_PARAMS'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

/**
 * Error pattern definition
 */
interface ErrorPattern {
  pattern: RegExp;
  type: RpcErrorType;
  code: ErrorCode;
  userMessage: string;
  recoverable: boolean;
  suggestedAction?: string;
}

/**
 * Error patterns for matching RPC errors
 */
const ERROR_PATTERNS: ErrorPattern[] = [
  {
    pattern: /nonce too low/i,
    type: 'NONCE_TOO_LOW',
    code: ERROR_CODES.NONCE_TOO_LOW,
    userMessage: 'Transaction nonce is outdated. Please try again.',
    recoverable: true,
    suggestedAction: 'Refresh and retry the transaction',
  },
  {
    pattern: /nonce too high/i,
    type: 'NONCE_TOO_HIGH',
    code: ERROR_CODES.TX_FAILED,
    userMessage: 'Transaction nonce is too high. Pending transactions may exist.',
    recoverable: true,
    suggestedAction: 'Wait for pending transactions or reset nonce',
  },
  {
    pattern: /insufficient funds|insufficient balance/i,
    type: 'INSUFFICIENT_FUNDS',
    code: ERROR_CODES.INSUFFICIENT_FUNDS,
    userMessage: 'Insufficient funds for this transaction.',
    recoverable: false,
    suggestedAction: 'Add more funds to your wallet',
  },
  {
    pattern: /intrinsic gas too low|out of gas/i,
    type: 'INSUFFICIENT_GAS',
    code: ERROR_CODES.INSUFFICIENT_GAS,
    userMessage: 'Gas limit is too low for this transaction.',
    recoverable: true,
    suggestedAction: 'Increase the gas limit',
  },
  {
    pattern: /exceeds block gas limit|gas limit reached/i,
    type: 'GAS_LIMIT_EXCEEDED',
    code: ERROR_CODES.TX_FAILED,
    userMessage: 'Transaction exceeds maximum gas limit.',
    recoverable: true,
    suggestedAction: 'Reduce transaction complexity or split into multiple transactions',
  },
  {
    pattern: /gas price.*too low|underpriced/i,
    type: 'GAS_PRICE_TOO_LOW',
    code: ERROR_CODES.GAS_PRICE_TOO_LOW,
    userMessage: 'Gas price is too low for current network conditions.',
    recoverable: true,
    suggestedAction: 'Increase gas price',
  },
  {
    pattern: /replacement transaction underpriced/i,
    type: 'REPLACEMENT_UNDERPRICED',
    code: ERROR_CODES.REPLACEMENT_UNDERPRICED,
    userMessage: 'Gas price too low to replace pending transaction.',
    recoverable: true,
    suggestedAction: 'Increase gas price by at least 10%',
  },
  {
    pattern: /execution reverted|revert|reverted/i,
    type: 'EXECUTION_REVERTED',
    code: ERROR_CODES.TX_REVERTED,
    userMessage: 'Transaction would fail. Contract rejected the operation.',
    recoverable: false,
    suggestedAction: 'Check transaction parameters and contract conditions',
  },
  {
    pattern: /invalid opcode|bad instruction/i,
    type: 'CONTRACT_ERROR',
    code: ERROR_CODES.CONTRACT_ERROR,
    userMessage: 'Contract error occurred.',
    recoverable: false,
    suggestedAction: 'Contact the contract developer',
  },
  {
    pattern: /invalid params|invalid argument/i,
    type: 'INVALID_PARAMS',
    code: ERROR_CODES.VALIDATION_ERROR,
    userMessage: 'Invalid transaction parameters.',
    recoverable: true,
    suggestedAction: 'Check and correct transaction parameters',
  },
  {
    pattern: /rate limit|too many requests|429/i,
    type: 'RATE_LIMITED',
    code: ERROR_CODES.RATE_LIMITED,
    userMessage: 'Too many requests. Please wait and try again.',
    recoverable: true,
    suggestedAction: 'Wait a few moments before retrying',
  },
  {
    pattern: /timeout|timed out|ETIMEDOUT/i,
    type: 'TIMEOUT',
    code: ERROR_CODES.TIMEOUT,
    userMessage: 'Request timed out. Network may be congested.',
    recoverable: true,
    suggestedAction: 'Check your connection and try again',
  },
  {
    pattern: /network|connection|ECONNREFUSED|ENOTFOUND/i,
    type: 'NETWORK_ERROR',
    code: ERROR_CODES.NETWORK_ERROR,
    userMessage: 'Network error occurred. Please check your connection.',
    recoverable: true,
    suggestedAction: 'Check internet connection and try again',
  },
];

/**
 * RpcErrorParser class
 * Parses RPC errors into user-friendly formats
 */
export class RpcErrorParser {
  private static instance: RpcErrorParser;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): RpcErrorParser {
    if (!RpcErrorParser.instance) {
      RpcErrorParser.instance = new RpcErrorParser();
    }
    return RpcErrorParser.instance;
  }

  /**
   * Parse RPC error into user-friendly format
   */
  parse(error: RawRpcError): ParsedRpcError {
    const message = error.message || '';

    // Try to match against known patterns
    for (const pattern of ERROR_PATTERNS) {
      if (pattern.pattern.test(message)) {
        return {
          code: pattern.code,
          type: pattern.type,
          message: message,
          userMessage: pattern.userMessage,
          recoverable: pattern.recoverable,
          suggestedAction: pattern.suggestedAction,
        };
      }
    }

    // Extract revert reason if present
    const revertReason = this.extractRevertReason(error);
    if (revertReason) {
      return {
        code: ERROR_CODES.TX_REVERTED,
        type: 'EXECUTION_REVERTED',
        message: message,
        userMessage: `Transaction reverted: ${revertReason}`,
        recoverable: false,
        suggestedAction: 'Check contract conditions',
      };
    }

    // Default unknown error
    return {
      code: ERROR_CODES.RPC_ERROR,
      type: 'UNKNOWN',
      message: message,
      userMessage: 'An unexpected error occurred.',
      recoverable: true,
      suggestedAction: 'Try again later',
    };
  }

  /**
   * Parse error from any source
   */
  parseAny(error: unknown): ParsedRpcError {
    if (error instanceof Error) {
      return this.parse({ message: error.message });
    }

    if (typeof error === 'string') {
      return this.parse({ message: error });
    }

    if (typeof error === 'object' && error !== null) {
      const errorObj = error as Record<string, unknown>;
      return this.parse({
        code: typeof errorObj.code === 'number' ? errorObj.code : undefined,
        message: typeof errorObj.message === 'string' ? errorObj.message : String(error),
        data: errorObj.data,
      });
    }

    return this.parse({ message: 'Unknown error' });
  }

  /**
   * Check if error is recoverable
   */
  isRecoverable(error: RawRpcError | unknown): boolean {
    const parsed =
      error instanceof Object && 'message' in error
        ? this.parse(error as RawRpcError)
        : this.parseAny(error);
    return parsed.recoverable;
  }

  /**
   * Get error type from error
   */
  getErrorType(error: RawRpcError | unknown): RpcErrorType {
    const parsed =
      error instanceof Object && 'message' in error
        ? this.parse(error as RawRpcError)
        : this.parseAny(error);
    return parsed.type;
  }

  /**
   * Extract revert reason from error data
   */
  private extractRevertReason(error: RawRpcError): string | null {
    if (!error.data) {
      return null;
    }

    // Try to decode revert reason from data
    const data = error.data;

    if (typeof data === 'string') {
      // Error(string) selector: 0x08c379a0
      if (data.startsWith('0x08c379a0')) {
        try {
          // Decode ABI-encoded string
          const hex = data.slice(10); // Remove selector
          const offset = parseInt(hex.slice(0, 64), 16);
          const length = parseInt(hex.slice(64, 128), 16);
          const messageHex = hex.slice(128, 128 + length * 2);

          // Convert hex to string
          let message = '';
          for (let i = 0; i < messageHex.length; i += 2) {
            message += String.fromCharCode(parseInt(messageHex.slice(i, i + 2), 16));
          }
          return message;
        } catch {
          return null;
        }
      }

      // Panic(uint256) selector: 0x4e487b71
      if (data.startsWith('0x4e487b71')) {
        const panicCode = parseInt(data.slice(10), 16);
        return this.getPanicReason(panicCode);
      }
    }

    return null;
  }

  /**
   * Get panic reason from panic code
   */
  private getPanicReason(code: number): string {
    const panicReasons: Record<number, string> = {
      0x00: 'Generic compiler inserted panic',
      0x01: 'Assertion failed',
      0x11: 'Arithmetic overflow/underflow',
      0x12: 'Division by zero',
      0x21: 'Invalid enum value',
      0x22: 'Storage byte array encoding error',
      0x31: 'Pop on empty array',
      0x32: 'Array index out of bounds',
      0x41: 'Too much memory allocated',
      0x51: 'Called invalid internal function',
    };

    return panicReasons[code] || `Unknown panic code: ${code}`;
  }
}

/**
 * Convenience function for parsing RPC errors
 */
export const parseRpcError = (error: RawRpcError): ParsedRpcError => {
  return RpcErrorParser.getInstance().parse(error);
};

/**
 * Convenience function for parsing any error
 */
export const parseAnyError = (error: unknown): ParsedRpcError => {
  return RpcErrorParser.getInstance().parseAny(error);
};

/**
 * Get singleton instance
 */
export const getRpcErrorParser = (): RpcErrorParser => {
  return RpcErrorParser.getInstance();
};

export default RpcErrorParser;
