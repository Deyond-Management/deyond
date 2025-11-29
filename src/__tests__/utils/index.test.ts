/**
 * Utils Tests
 */

import {
  truncateMiddle,
  isValidAddress,
  isValidTxHash,
  weiToEther,
  etherToWei,
  gweiToWei,
  delay,
  generateId,
  deepClone,
  isEmpty,
  capitalize,
  parseErrorMessage,
} from '../../utils/index';

describe('Utils', () => {
  describe('truncateMiddle', () => {
    it('should truncate long strings', () => {
      const result = truncateMiddle('0x1234567890abcdef1234567890abcdef12345678');
      expect(result).toBe('0x1234...5678');
    });

    it('should not truncate short strings', () => {
      const short = '0x1234';
      expect(truncateMiddle(short)).toBe(short);
    });

    it('should handle custom start and end chars', () => {
      const result = truncateMiddle('0x1234567890abcdef', 4, 4);
      expect(result).toBe('0x12...cdef');
    });
  });

  describe('isValidAddress', () => {
    it('should validate correct Ethereum addresses', () => {
      expect(isValidAddress('0x1234567890123456789012345678901234567890')).toBe(true);
      expect(isValidAddress('0xabcdefABCDEF1234567890123456789012345678')).toBe(true);
    });

    it('should reject invalid addresses', () => {
      expect(isValidAddress('invalid')).toBe(false);
      expect(isValidAddress('0x123')).toBe(false);
      expect(isValidAddress('1234567890123456789012345678901234567890')).toBe(false);
    });
  });

  describe('isValidTxHash', () => {
    it('should validate correct transaction hashes', () => {
      const validHash = '0x' + '1234567890abcdef'.repeat(4);
      expect(isValidTxHash(validHash)).toBe(true);
    });

    it('should reject invalid hashes', () => {
      expect(isValidTxHash('invalid')).toBe(false);
      expect(isValidTxHash('0x123')).toBe(false);
    });
  });

  describe('weiToEther', () => {
    it('should convert wei to ether', () => {
      expect(weiToEther('1000000000000000000')).toBe('1');
      expect(weiToEther('500000000000000000')).toBe('0.5');
    });

    it('should handle zero', () => {
      expect(weiToEther('0')).toBe('0');
    });
  });

  describe('etherToWei', () => {
    it('should convert ether to wei', () => {
      expect(etherToWei('1')).toBe('1000000000000000000');
      expect(etherToWei('0.5')).toBe('500000000000000000');
    });

    it('should handle zero', () => {
      expect(etherToWei('0')).toBe('0');
    });
  });

  describe('gweiToWei', () => {
    it('should convert gwei to wei', () => {
      expect(gweiToWei('1')).toBe('1000000000');
      expect(gweiToWei('20')).toBe('20000000000');
    });

    it('should handle decimals', () => {
      expect(gweiToWei('1.5')).toBe('1500000000');
    });
  });

  describe('delay', () => {
    it('should delay for specified time', async () => {
      const start = Date.now();
      await delay(100);
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(90);
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });

  describe('deepClone', () => {
    it('should deep clone objects', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
    });

    it('should clone arrays', () => {
      const original = [1, 2, { a: 3 }];
      const cloned = deepClone(original);
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty objects', () => {
      expect(isEmpty({})).toBe(true);
    });

    it('should return false for non-empty objects', () => {
      expect(isEmpty({ a: 1 })).toBe(false);
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('WORLD')).toBe('World');
    });

    it('should handle single character', () => {
      expect(capitalize('a')).toBe('A');
    });
  });

  describe('parseErrorMessage', () => {
    it('should parse Error objects', () => {
      const error = new Error('Test error');
      expect(parseErrorMessage(error)).toBe('Test error');
    });

    it('should handle string errors', () => {
      expect(parseErrorMessage('String error')).toBe('String error');
    });

    it('should handle unknown errors', () => {
      expect(parseErrorMessage(123)).toBe('An unexpected error occurred');
      expect(parseErrorMessage(null)).toBe('An unexpected error occurred');
    });
  });
});
