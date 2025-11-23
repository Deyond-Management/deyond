import AsyncStorage from '@react-native-async-storage/async-storage';
import CacheManager from '../CacheManager';

describe('CacheManager', () => {
  let cache: CacheManager<string>;

  beforeEach(() => {
    cache = new CacheManager({
      prefix: '@test_cache_',
      defaultTtl: 1000,
      useStorage: true,
    });
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  describe('set and get', () => {
    it('should set and get value from memory', async () => {
      await cache.set('key1', 'value1');
      const value = await cache.get('key1');
      expect(value).toBe('value1');
    });

    it('should return null for non-existent key', async () => {
      const value = await cache.get('nonexistent');
      expect(value).toBeNull();
    });

    it('should respect TTL', async () => {
      const shortCache = new CacheManager<string>({
        prefix: '@short_',
        defaultTtl: 10,
        useStorage: false,
      });

      await shortCache.set('key', 'value');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 20));

      const value = await shortCache.get('key');
      expect(value).toBeNull();
    });

    it('should use custom TTL when provided', async () => {
      await cache.set('key', 'value', 5000);
      const value = await cache.get('key');
      expect(value).toBe('value');
    });
  });

  describe('storage persistence', () => {
    it('should save to AsyncStorage when enabled', async () => {
      await cache.set('key', 'value');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@test_cache_key',
        expect.stringContaining('"data":"value"')
      );
    });

    it('should retrieve from AsyncStorage on cache miss', async () => {
      const storedEntry = {
        data: 'stored_value',
        timestamp: Date.now(),
        ttl: 60000,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(storedEntry)
      );

      const newCache = new CacheManager<string>({
        prefix: '@test_cache_',
        useStorage: true,
      });

      const value = await newCache.get('key');
      expect(value).toBe('stored_value');
    });

    it('should remove expired entries from storage', async () => {
      const expiredEntry = {
        data: 'expired',
        timestamp: Date.now() - 100000,
        ttl: 1000,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(expiredEntry)
      );

      const value = await cache.get('key');
      expect(value).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@test_cache_key');
    });
  });

  describe('delete', () => {
    it('should delete from memory and storage', async () => {
      await cache.set('key', 'value');
      await cache.delete('key');

      const value = await cache.get('key');
      expect(value).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@test_cache_key');
    });
  });

  describe('has', () => {
    it('should return true for existing key', async () => {
      await cache.set('key', 'value');
      const exists = await cache.has('key');
      expect(exists).toBe(true);
    });

    it('should return false for non-existent key', async () => {
      const exists = await cache.has('nonexistent');
      expect(exists).toBe(false);
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      await cache.set('key', 'cached');

      const factory = jest.fn().mockResolvedValue('new');
      const value = await cache.getOrSet('key', factory);

      expect(value).toBe('cached');
      expect(factory).not.toHaveBeenCalled();
    });

    it('should call factory and cache result if not exists', async () => {
      const factory = jest.fn().mockResolvedValue('new');
      const value = await cache.getOrSet('key', factory);

      expect(value).toBe('new');
      expect(factory).toHaveBeenCalled();

      // Verify it was cached
      const cached = await cache.get('key');
      expect(cached).toBe('new');
    });
  });

  describe('clear', () => {
    it('should clear all cached values', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');

      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([
        '@test_cache_key1',
        '@test_cache_key2',
        '@other_key',
      ]);

      await cache.clear();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        '@test_cache_key1',
        '@test_cache_key2',
      ]);
    });
  });

  describe('keys', () => {
    it('should return all cached keys', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');

      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([
        '@test_cache_key1',
        '@test_cache_key2',
      ]);

      const keys = await cache.keys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');

      const stats = cache.getStats();
      expect(stats.memoryEntries).toBe(2);
      expect(stats.totalSize).toBeGreaterThan(0);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', async () => {
      const expiredCache = new CacheManager<string>({
        prefix: '@expired_',
        defaultTtl: 1,
        useStorage: false,
      });

      await expiredCache.set('key', 'value');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 10));

      const removed = await expiredCache.cleanup();
      expect(removed).toBe(1);
    });
  });
});
