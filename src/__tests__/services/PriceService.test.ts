/**
 * PriceService Tests
 * CoinGecko API integration for price data
 */

import { PriceService } from '../../services/external/PriceService';
import { AppConfig } from '../../config/app.config';

// Mock fetch
global.fetch = jest.fn();

describe('PriceService', () => {
  let priceService: PriceService;
  let originalDemoMode: boolean;

  beforeEach(() => {
    // Disable demo mode for tests
    originalDemoMode = AppConfig.demoMode;
    AppConfig.demoMode = false;

    priceService = new PriceService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore demo mode
    AppConfig.demoMode = originalDemoMode;
  });

  describe('getPrice', () => {
    it('should get current price for token', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            ethereum: {
              usd: 2000,
              usd_24h_change: 5.5,
            },
          }),
      });

      const price = await priceService.getPrice('ethereum');

      expect(price.usd).toBe(2000);
      expect(price.change24h).toBe(5.5);
    });

    it('should get price for multiple currencies', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            ethereum: {
              usd: 2000,
              eur: 1800,
              krw: 2600000,
            },
          }),
      });

      const prices = await priceService.getPriceMultiCurrency('ethereum', ['usd', 'eur', 'krw']);

      expect(prices.usd).toBe(2000);
      expect(prices.eur).toBe(1800);
      expect(prices.krw).toBe(2600000);
    });
  });

  describe('getMultiplePrices', () => {
    it('should get prices for multiple tokens', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            ethereum: { usd: 2000 },
            bitcoin: { usd: 40000 },
          }),
      });

      const prices = await priceService.getMultiplePrices(['ethereum', 'bitcoin']);

      expect(prices.ethereum.usd).toBe(2000);
      expect(prices.bitcoin.usd).toBe(40000);
    });
  });

  describe('getTokenPrice', () => {
    it('should get ERC-20 token price by contract address', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': {
              usd: 1.0,
            },
          }),
      });

      const price = await priceService.getTokenPrice(
        'ethereum',
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
      );

      expect(price.usd).toBe(1.0);
    });
  });

  describe('getPriceHistory', () => {
    it('should get price history for token', async () => {
      const mockPrices = [
        [1700000000000, 1900],
        [1700100000000, 1950],
        [1700200000000, 2000],
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            prices: mockPrices,
          }),
      });

      const history = await priceService.getPriceHistory('ethereum', 7);

      expect(history).toHaveLength(3);
      expect(history[0].timestamp).toBe(1700000000000);
      expect(history[0].price).toBe(1900);
    });

    it('should support different time ranges', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            prices: [[1700000000000, 2000]],
          }),
      });

      await priceService.getPriceHistory('ethereum', 30);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('days=30'),
        expect.any(Object)
      );
    });
  });

  describe('getMarketData', () => {
    it('should get market data for token', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            market_data: {
              current_price: { usd: 2000 },
              market_cap: { usd: 240000000000 },
              total_volume: { usd: 15000000000 },
              price_change_percentage_24h: 5.5,
              circulating_supply: 120000000,
            },
          }),
      });

      const marketData = await priceService.getMarketData('ethereum');

      expect(marketData.currentPrice).toBe(2000);
      expect(marketData.marketCap).toBe(240000000000);
      expect(marketData.volume24h).toBe(15000000000);
      expect(marketData.priceChange24h).toBe(5.5);
      expect(marketData.circulatingSupply).toBe(120000000);
    });
  });

  describe('caching', () => {
    it('should cache price results', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            ethereum: { usd: 2000 },
          }),
      });

      await priceService.getPrice('ethereum');
      await priceService.getPrice('ethereum');

      // Should only fetch once due to caching
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should invalidate cache after TTL', async () => {
      jest.useFakeTimers();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            ethereum: { usd: 2000 },
          }),
      });

      await priceService.getPrice('ethereum');

      // Advance time past cache TTL (60 seconds)
      jest.advanceTimersByTime(61000);

      await priceService.getPrice('ethereum');

      expect(global.fetch).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    it('should clear cache manually', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            ethereum: { usd: 2000 },
          }),
      });

      await priceService.getPrice('ethereum');
      priceService.clearCache();
      await priceService.getPrice('ethereum');

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('should throw on API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      await expect(priceService.getPrice('ethereum')).rejects.toThrow('Too Many Requests');
    });

    it('should throw on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(priceService.getPrice('ethereum')).rejects.toThrow('Network error');
    });

    it('should throw on invalid token', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await expect(priceService.getPrice('invalid-token')).rejects.toThrow();
    });
  });

  describe('rate limiting', () => {
    it('should use cache for rapid repeated requests', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            ethereum: { usd: 2000 },
          }),
      });

      // First request populates cache
      await priceService.getPrice('ethereum');

      // Subsequent requests use cache
      await priceService.getPrice('ethereum');
      await priceService.getPrice('ethereum');

      // Should only fetch once due to caching
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
