/**
 * RpcErrorParser Tests
 */

import {
  RpcErrorParser,
  getRpcErrorParser,
  parseRpcError,
  parseAnyError,
  RawRpcError,
} from '../RpcErrorParser';

describe('RpcErrorParser', () => {
  let parser: RpcErrorParser;

  beforeEach(() => {
    parser = getRpcErrorParser();
  });

  describe('parse', () => {
    it('should parse insufficient funds error', () => {
      const error: RawRpcError = { message: 'insufficient funds for transfer' };
      const result = parser.parse(error);
      expect(result.type).toBe('INSUFFICIENT_FUNDS');
      expect(result.recoverable).toBe(false);
    });

    it('should parse nonce too low error', () => {
      const error: RawRpcError = { message: 'nonce too low' };
      const result = parser.parse(error);
      expect(result.type).toBe('NONCE_TOO_LOW');
      expect(result.recoverable).toBe(true);
    });

    it('should parse replacement underpriced error', () => {
      const error: RawRpcError = { message: 'replacement transaction underpriced' };
      const result = parser.parse(error);
      expect(result.type).toBe('GAS_PRICE_TOO_LOW'); // 'underpriced' matches gas price pattern
      expect(result.recoverable).toBe(true);
    });

    it('should parse gas limit exceeded error', () => {
      const error: RawRpcError = { message: 'gas required exceeds block gas limit' };
      const result = parser.parse(error);
      expect(result.type).toBe('GAS_LIMIT_EXCEEDED');
      expect(result.recoverable).toBe(true);
    });

    it('should parse execution reverted error', () => {
      const error: RawRpcError = {
        message: 'execution reverted: ERC20: transfer amount exceeds balance',
      };
      const result = parser.parse(error);
      expect(result.type).toBe('EXECUTION_REVERTED');
      expect(result.recoverable).toBe(false);
    });

    it('should parse network error', () => {
      const error: RawRpcError = { message: 'network error: connection refused' };
      const result = parser.parse(error);
      expect(result.type).toBe('NETWORK_ERROR');
      expect(result.recoverable).toBe(true);
    });

    it('should parse timeout error', () => {
      const error: RawRpcError = { message: 'request timed out' };
      const result = parser.parse(error);
      expect(result.type).toBe('TIMEOUT');
      expect(result.recoverable).toBe(true);
    });

    it('should parse rate limit error', () => {
      const error: RawRpcError = { message: 'rate limit exceeded' };
      const result = parser.parse(error);
      expect(result.type).toBe('RATE_LIMITED');
      expect(result.recoverable).toBe(true);
    });

    it('should parse invalid params error', () => {
      const error: RawRpcError = { message: 'invalid params: address is required' };
      const result = parser.parse(error);
      expect(result.type).toBe('INVALID_PARAMS');
      expect(result.recoverable).toBe(true);
    });

    it('should return unknown for unrecognized errors', () => {
      const error: RawRpcError = { message: 'some random error' };
      const result = parser.parse(error);
      expect(result.type).toBe('UNKNOWN');
    });
  });

  describe('parseAny', () => {
    it('should parse Error object', () => {
      const result = parser.parseAny(new Error('nonce too low'));
      expect(result.type).toBe('NONCE_TOO_LOW');
    });

    it('should parse string error', () => {
      const result = parser.parseAny('insufficient funds');
      expect(result.type).toBe('INSUFFICIENT_FUNDS');
    });

    it('should parse RPC error object', () => {
      const error = {
        code: -32603,
        message: 'network connection refused',
      };
      const result = parser.parseAny(error);
      expect(result.type).toBe('NETWORK_ERROR');
    });

    it('should handle unknown error types', () => {
      const result = parser.parseAny({ something: 'random' });
      expect(result.type).toBe('UNKNOWN');
    });

    it('should handle null/undefined', () => {
      const result = parser.parseAny(null);
      expect(result.type).toBe('UNKNOWN');
    });
  });

  describe('isRecoverable', () => {
    it('should return true for recoverable errors', () => {
      const error: RawRpcError = { message: 'rate limit exceeded' };
      expect(parser.isRecoverable(error)).toBe(true);
    });

    it('should return false for non-recoverable errors', () => {
      const error: RawRpcError = { message: 'insufficient funds' };
      expect(parser.isRecoverable(error)).toBe(false);
    });
  });

  describe('getErrorType', () => {
    it('should return correct error type', () => {
      const error: RawRpcError = { message: 'nonce too low' };
      expect(parser.getErrorType(error)).toBe('NONCE_TOO_LOW');
    });

    it('should return UNKNOWN for unrecognized errors', () => {
      const error: RawRpcError = { message: 'xyz error' };
      expect(parser.getErrorType(error)).toBe('UNKNOWN');
    });
  });

  describe('userMessage', () => {
    it('should return user-friendly message for insufficient funds', () => {
      const error: RawRpcError = { message: 'insufficient funds' };
      const result = parser.parse(error);
      expect(result.userMessage).toContain('Insufficient');
    });

    it('should return user-friendly message for nonce too low', () => {
      const error: RawRpcError = { message: 'nonce too low' };
      const result = parser.parse(error);
      expect(result.userMessage).toContain('nonce');
    });

    it('should return user-friendly message for rate limited', () => {
      const error: RawRpcError = { message: 'rate limit' };
      const result = parser.parse(error);
      expect(result.userMessage).toContain('requests');
    });

    it('should return user-friendly message for execution reverted', () => {
      const error: RawRpcError = { message: 'execution reverted' };
      const result = parser.parse(error);
      expect(result.userMessage).toContain('rejected');
    });
  });

  describe('suggestedAction', () => {
    it('should provide suggested action for recoverable errors', () => {
      const error: RawRpcError = { message: 'rate limit exceeded' };
      const result = parser.parse(error);
      expect(result.suggestedAction).toBeDefined();
    });
  });
});

describe('Module exports', () => {
  describe('getRpcErrorParser', () => {
    it('should return singleton instance', () => {
      const parser1 = getRpcErrorParser();
      const parser2 = getRpcErrorParser();
      expect(parser1).toBe(parser2);
    });
  });

  describe('parseRpcError', () => {
    it('should parse error using singleton', () => {
      const result = parseRpcError({ message: 'insufficient funds' });
      expect(result.type).toBe('INSUFFICIENT_FUNDS');
    });
  });

  describe('parseAnyError', () => {
    it('should parse Error object', () => {
      const result = parseAnyError(new Error('nonce too low'));
      expect(result.type).toBe('NONCE_TOO_LOW');
    });

    it('should parse string error', () => {
      const result = parseAnyError('network error');
      expect(result.type).toBe('NETWORK_ERROR');
    });

    it('should handle Ethereum error object with message', () => {
      const error = {
        code: -32603,
        message: 'timeout exceeded',
      };
      const result = parseAnyError(error);
      expect(result.type).toBe('TIMEOUT');
    });

    it('should handle unknown error types', () => {
      const result = parseAnyError({ something: 'random' });
      expect(result.type).toBe('UNKNOWN');
    });
  });
});
