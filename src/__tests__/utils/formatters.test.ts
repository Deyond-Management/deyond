/**
 * Formatters Tests
 * Tests for balance and currency formatting utilities
 */

import {
  formatCryptoBalance,
  formatUSDValue,
  formatPercentage,
  formatCompactNumber,
  formatAddress,
  formatTimestamp,
} from '../../utils/formatters';

describe('Formatters', () => {
  describe('formatCryptoBalance', () => {
    it('should format balance with default decimals', () => {
      expect(formatCryptoBalance('1.234567890123')).toBe('1.234568');
    });

    it('should format balance with custom decimals', () => {
      expect(formatCryptoBalance('1.234567890123', 4)).toBe('1.2346');
    });

    it('should format zero balance', () => {
      expect(formatCryptoBalance('0')).toBe('0.000000');
    });

    it('should format small balance', () => {
      expect(formatCryptoBalance('0.000001234567')).toBe('0.000001');
    });

    it('should format large balance with commas', () => {
      expect(formatCryptoBalance('1234567.89012345')).toBe('1,234,567.890123');
    });

    it('should handle invalid input', () => {
      expect(formatCryptoBalance('invalid')).toBe('0.000000');
    });

    it('should handle empty string', () => {
      expect(formatCryptoBalance('')).toBe('0.000000');
    });

    it('should trim trailing zeros when specified', () => {
      expect(formatCryptoBalance('1.500000', 6, true)).toBe('1.5');
    });
  });

  describe('formatUSDValue', () => {
    it('should format USD value with dollar sign', () => {
      expect(formatUSDValue('1234.56')).toBe('$1,234.56');
    });

    it('should format zero value', () => {
      expect(formatUSDValue('0')).toBe('$0.00');
    });

    it('should format small value', () => {
      expect(formatUSDValue('0.01')).toBe('$0.01');
    });

    it('should format large value', () => {
      expect(formatUSDValue('1234567.89')).toBe('$1,234,567.89');
    });

    it('should handle invalid input', () => {
      expect(formatUSDValue('invalid')).toBe('$0.00');
    });

    it('should format negative value', () => {
      expect(formatUSDValue('-123.45')).toBe('-$123.45');
    });

    it('should handle very small values', () => {
      expect(formatUSDValue('0.001')).toBe('$0.00');
    });
  });

  describe('formatPercentage', () => {
    it('should format positive percentage', () => {
      expect(formatPercentage(5.5)).toBe('+5.50%');
    });

    it('should format negative percentage', () => {
      expect(formatPercentage(-3.25)).toBe('-3.25%');
    });

    it('should format zero percentage', () => {
      expect(formatPercentage(0)).toBe('0.00%');
    });

    it('should format large percentage', () => {
      expect(formatPercentage(100.5)).toBe('+100.50%');
    });

    it('should format small percentage', () => {
      expect(formatPercentage(0.01)).toBe('+0.01%');
    });
  });

  describe('formatCompactNumber', () => {
    it('should format thousands with K', () => {
      expect(formatCompactNumber(1500)).toBe('1.5K');
    });

    it('should format millions with M', () => {
      expect(formatCompactNumber(1500000)).toBe('1.5M');
    });

    it('should format billions with B', () => {
      expect(formatCompactNumber(1500000000)).toBe('1.5B');
    });

    it('should not format small numbers', () => {
      expect(formatCompactNumber(999)).toBe('999');
    });

    it('should handle zero', () => {
      expect(formatCompactNumber(0)).toBe('0');
    });
  });

  describe('formatAddress', () => {
    it('should truncate address with default length', () => {
      expect(formatAddress('0x1234567890123456789012345678901234567890')).toBe('0x1234...7890');
    });

    it('should truncate address with custom length', () => {
      expect(formatAddress('0x1234567890123456789012345678901234567890', 8, 6)).toBe(
        '0x123456...567890'
      );
    });

    it('should return original if address is short', () => {
      expect(formatAddress('0x1234')).toBe('0x1234');
    });

    it('should handle empty address', () => {
      expect(formatAddress('')).toBe('');
    });
  });

  describe('formatTimestamp', () => {
    const now = Date.now();

    it('should format seconds ago', () => {
      const timestamp = now - 30 * 1000;
      expect(formatTimestamp(timestamp)).toBe('Just now');
    });

    it('should format minutes ago', () => {
      const timestamp = now - 5 * 60 * 1000;
      expect(formatTimestamp(timestamp)).toBe('5 minutes ago');
    });

    it('should format hours ago', () => {
      const timestamp = now - 2 * 60 * 60 * 1000;
      expect(formatTimestamp(timestamp)).toBe('2 hours ago');
    });

    it('should format days ago', () => {
      const timestamp = now - 3 * 24 * 60 * 60 * 1000;
      expect(formatTimestamp(timestamp)).toBe('3 days ago');
    });

    it('should format singular minute', () => {
      const timestamp = now - 1 * 60 * 1000;
      expect(formatTimestamp(timestamp)).toBe('1 minute ago');
    });

    it('should format singular hour', () => {
      const timestamp = now - 1 * 60 * 60 * 1000;
      expect(formatTimestamp(timestamp)).toBe('1 hour ago');
    });

    it('should format singular day', () => {
      const timestamp = now - 1 * 24 * 60 * 60 * 1000;
      expect(formatTimestamp(timestamp)).toBe('1 day ago');
    });
  });
});
