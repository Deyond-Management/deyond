/**
 * PriceService
 * CoinGecko API integration for cryptocurrency price data
 */

import { AppConfig } from '../../config/app.config';
import { MOCK_PRICE_DATA } from '../../mocks/mockData';

interface PriceResult {
  usd: number;
  change24h?: number;
}

interface MultiCurrencyPrices {
  [currency: string]: number;
}

interface MultiplePrices {
  [tokenId: string]: {
    usd: number;
  };
}

interface PricePoint {
  timestamp: number;
  price: number;
}

interface MarketData {
  currentPrice: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  circulatingSupply: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class PriceService {
  private baseUrl: string = 'https://api.coingecko.com/api/v3';
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private cacheTTL: number = 60000; // 60 seconds

  /**
   * Get current price for a token
   */
  async getPrice(tokenId: string): Promise<PriceResult> {
    // Use mock data in demo mode
    if (AppConfig.demoMode) {
      const mockData = (MOCK_PRICE_DATA as Record<string, typeof MOCK_PRICE_DATA.ethereum>)[
        tokenId
      ];
      if (mockData) {
        return {
          usd: mockData.usd,
          change24h: mockData.usd_24h_change,
        };
      }
      // Return default price if not found in mock data
      return {
        usd: 1.0,
        change24h: 0,
      };
    }

    const cacheKey = `price:${tokenId}`;
    const cached = this.getFromCache<{ [key: string]: { usd: number; usd_24h_change?: number } }>(
      cacheKey
    );

    if (cached) {
      const tokenData = cached[tokenId];
      if (!tokenData) {
        throw new Error(`Token not found: ${tokenId}`);
      }
      return {
        usd: tokenData.usd,
        change24h: tokenData.usd_24h_change,
      };
    }

    const url = `${this.baseUrl}/simple/price?ids=${tokenId}&vs_currencies=usd&include_24hr_change=true`;
    const data = await this.fetch<{ [key: string]: { usd: number; usd_24h_change?: number } }>(url);

    this.setCache(cacheKey, data);

    const tokenData = data[tokenId];
    if (!tokenData) {
      throw new Error(`Token not found: ${tokenId}`);
    }

    return {
      usd: tokenData.usd,
      change24h: tokenData.usd_24h_change,
    };
  }

  /**
   * Get price in multiple currencies
   */
  async getPriceMultiCurrency(tokenId: string, currencies: string[]): Promise<MultiCurrencyPrices> {
    const currencyList = currencies.join(',');
    const url = `${this.baseUrl}/simple/price?ids=${tokenId}&vs_currencies=${currencyList}`;
    const data = await this.fetch<{ [key: string]: MultiCurrencyPrices }>(url);

    return data[tokenId];
  }

  /**
   * Get prices for multiple tokens
   */
  async getMultiplePrices(tokenIds: string[]): Promise<MultiplePrices> {
    const ids = tokenIds.join(',');
    const url = `${this.baseUrl}/simple/price?ids=${ids}&vs_currencies=usd`;
    return this.fetch<MultiplePrices>(url);
  }

  /**
   * Get ERC-20 token price by contract address
   */
  async getTokenPrice(platform: string, contractAddress: string): Promise<{ usd: number }> {
    const url = `${this.baseUrl}/simple/token_price/${platform}?contract_addresses=${contractAddress}&vs_currencies=usd`;
    const data = await this.fetch<{ [address: string]: { usd: number } }>(url);

    return data[contractAddress.toLowerCase()];
  }

  /**
   * Get price history for a token
   */
  async getPriceHistory(tokenId: string, days: number): Promise<PricePoint[]> {
    const url = `${this.baseUrl}/coins/${tokenId}/market_chart?vs_currency=usd&days=${days}`;
    const data = await this.fetch<{ prices: [number, number][] }>(url);

    return data.prices.map(([timestamp, price]) => ({
      timestamp,
      price,
    }));
  }

  /**
   * Get market data for a token
   */
  async getMarketData(tokenId: string): Promise<MarketData> {
    const url = `${this.baseUrl}/coins/${tokenId}`;
    const data = await this.fetch<{
      market_data: {
        current_price: { usd: number };
        market_cap: { usd: number };
        total_volume: { usd: number };
        price_change_percentage_24h: number;
        circulating_supply: number;
      };
    }>(url);

    return {
      currentPrice: data.market_data.current_price.usd,
      marketCap: data.market_data.market_cap.usd,
      volume24h: data.market_data.total_volume.usd,
      priceChange24h: data.market_data.price_change_percentage_24h,
      circulatingSupply: data.market_data.circulating_supply,
    };
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get data from cache if valid
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set data in cache
   */
  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Fetch with error handling
   */
  private async fetch<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return response.json();
  }
}

export default PriceService;
