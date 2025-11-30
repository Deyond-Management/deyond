/**
 * ENSService Tests
 */

import { ENSService } from '../../services/blockchain/ENSService';

describe('ENSService', () => {
  let ensService: ENSService;

  beforeEach(() => {
    ensService = new ENSService();
  });

  describe('resolveName', () => {
    it('should return null for unresolved names', async () => {
      const result = await ensService.resolveName('test.eth');
      expect(result).toBeNull();
    });

    it('should use cache for repeated lookups', async () => {
      // First call
      const result1 = await ensService.resolveName('test.eth');
      expect(result1).toBeNull();

      // Manually set cache
      (ensService as any).cache.set('test.eth', '0x1234567890123456789012345678901234567890');

      // Second call should use cache
      const result2 = await ensService.resolveName('test.eth');
      expect(result2).toBe('0x1234567890123456789012345678901234567890');
    });
  });

  describe('lookupAddress', () => {
    it('should return null for addresses without ENS', async () => {
      const result = await ensService.lookupAddress('0x1234567890123456789012345678901234567890');
      expect(result).toBeNull();
    });

    it('should use cache for repeated lookups', async () => {
      const address = '0x1234567890123456789012345678901234567890';

      // First call
      const result1 = await ensService.lookupAddress(address);
      expect(result1).toBeNull();

      // Manually set cache
      (ensService as any).reverseCache.set(address, 'test.eth');

      // Second call should use cache
      const result2 = await ensService.lookupAddress(address);
      expect(result2).toBe('test.eth');
    });
  });

  describe('getProfile', () => {
    it('should return null when profile is not available', async () => {
      const result = await ensService.getProfile('test.eth');
      expect(result).toBeNull();
    });
  });

  describe('getAvatar', () => {
    it('should return null when avatar is not available', async () => {
      const result = await ensService.getAvatar('test.eth');
      expect(result).toBeNull();
    });
  });

  describe('isValidENSName', () => {
    it('should validate correct ENS names', () => {
      expect(ensService.isValidENSName('vitalik.eth')).toBe(true);
      expect(ensService.isValidENSName('test.eth')).toBe(true);
      expect(ensService.isValidENSName('my-name.eth')).toBe(true);
      expect(ensService.isValidENSName('test123.eth')).toBe(true);
    });

    it('should reject invalid ENS names', () => {
      expect(ensService.isValidENSName('invalid')).toBe(false);
      expect(ensService.isValidENSName('test.com')).toBe(false);
      expect(ensService.isValidENSName('test_name.eth')).toBe(false); // underscore not allowed
      expect(ensService.isValidENSName('test.eth.com')).toBe(false);
      expect(ensService.isValidENSName('.eth')).toBe(false);
      expect(ensService.isValidENSName('test.')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(ensService.isValidENSName('VITALIK.ETH')).toBe(true);
      expect(ensService.isValidENSName('Test.ETH')).toBe(true);
    });
  });

  describe('clearCache', () => {
    it('should clear both caches', () => {
      // Set cache values
      (ensService as any).cache.set('test.eth', '0x1234567890123456789012345678901234567890');
      (ensService as any).reverseCache.set(
        '0x1234567890123456789012345678901234567890',
        'test.eth'
      );

      expect((ensService as any).cache.size).toBe(1);
      expect((ensService as any).reverseCache.size).toBe(1);

      // Clear cache
      ensService.clearCache();

      expect((ensService as any).cache.size).toBe(0);
      expect((ensService as any).reverseCache.size).toBe(0);
    });
  });
});
