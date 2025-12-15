/**
 * Balance Service
 * Handles fetching and formatting token balances
 */

import { AppConfig } from '../../config/app.config';
import { MOCK_TOKEN_BALANCES } from '../../mocks/mockData';
import { DEFAULT_SERVICES_CONFIG, CacheConfig } from '../../config/services.config';
import { getProviderManager } from './ProviderManager';
import { EthereumProvider } from './EthereumProvider';

export interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  usdValue: string;
  priceChange24h: number;
  contractAddress: string;
  decimals: number;
  logoUrl?: string;
}

export class BalanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BalanceError';
  }
}

export class BalanceService {
  private cache: Map<string, { data: TokenBalance[]; timestamp: number }> = new Map();
  private cacheTimeout: number;
  private provider: EthereumProvider | null = null;

  constructor(config?: Partial<CacheConfig>) {
    const cacheConfig = { ...DEFAULT_SERVICES_CONFIG.cache, ...config };
    this.cacheTimeout = cacheConfig.balanceTimeout;

    // Initialize provider if not in demo mode
    if (!AppConfig.demoMode) {
      try {
        this.provider = getProviderManager().getCurrentProvider();
      } catch (error) {
        console.warn('Failed to initialize provider:', error);
      }
    }
  }

  /**
   * Validate Ethereum address format
   */
  private validateAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Get native token (ETH) balance
   */
  async getNativeBalance(address: string): Promise<TokenBalance> {
    if (!this.validateAddress(address)) {
      throw new BalanceError('Invalid Ethereum address');
    }

    // Check cache
    const cached = this.cache.get(address);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      const nativeToken = cached.data.find(t => t.symbol === 'ETH');
      if (nativeToken) return nativeToken;
    }

    let balance: TokenBalance;

    // Use mock data in demo mode
    if (AppConfig.demoMode) {
      const mockETH = MOCK_TOKEN_BALANCES.find(t => t.symbol === 'ETH');
      if (mockETH) {
        balance = this.convertMockBalance(mockETH);
      } else {
        throw new BalanceError('ETH not found in mock data');
      }
    } else {
      // Real implementation - fetch from blockchain via RPC
      if (!this.provider) {
        throw new BalanceError('Provider not initialized');
      }

      try {
        // Get balance in wei
        const balanceWei = await this.provider.getBalance(address);

        // Convert wei to ETH (1 ETH = 10^18 wei)
        const balanceETH = this.weiToEther(balanceWei);

        // TODO: Fetch USD price from PriceService
        const usdValue = '0.00';
        const priceChange24h = 0;

        balance = {
          symbol: 'ETH',
          name: 'Ethereum',
          balance: balanceETH,
          usdValue,
          priceChange24h,
          contractAddress: '0x0000000000000000000000000000000000000000',
          decimals: 18,
        };
      } catch (error) {
        throw new BalanceError(
          `Failed to fetch balance: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return balance;
  }

  /**
   * Convert mock data TokenBalance to service TokenBalance format
   */
  private convertMockBalance(mockBalance: (typeof MOCK_TOKEN_BALANCES)[0]): TokenBalance {
    return {
      symbol: mockBalance.symbol,
      name: mockBalance.name,
      balance: mockBalance.balance,
      usdValue: mockBalance.balanceUSD.toString(),
      priceChange24h: mockBalance.priceChange24h,
      contractAddress:
        mockBalance.symbol === 'ETH'
          ? '0x0000000000000000000000000000000000000000'
          : `0x${mockBalance.id.padStart(40, '0')}`,
      decimals: mockBalance.symbol === 'ETH' || mockBalance.symbol === 'MATIC' ? 18 : 6,
      logoUrl: mockBalance.logo,
    };
  }

  /**
   * Get all token balances for an address
   */
  async getTokenBalances(address: string): Promise<TokenBalance[]> {
    if (!this.validateAddress(address)) {
      throw new BalanceError('Invalid Ethereum address');
    }

    // Check cache
    const cached = this.cache.get(address);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    let balances: TokenBalance[];

    // Use mock data in demo mode
    if (AppConfig.demoMode) {
      balances = MOCK_TOKEN_BALANCES.map(mock => this.convertMockBalance(mock));
    } else {
      // Real implementation - fetch from blockchain/API
      balances = [
        {
          symbol: 'ETH',
          name: 'Ethereum',
          balance: '1.5234',
          usdValue: '2850.45',
          priceChange24h: 2.35,
          contractAddress: '0x0000000000000000000000000000000000000000',
          decimals: 18,
        },
        {
          symbol: 'USDT',
          name: 'Tether USD',
          balance: '500.00',
          usdValue: '500.00',
          priceChange24h: 0.01,
          contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          decimals: 6,
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          balance: '250.50',
          usdValue: '250.50',
          priceChange24h: -0.02,
          contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          decimals: 6,
        },
        {
          symbol: 'LINK',
          name: 'Chainlink',
          balance: '15.75',
          usdValue: '187.43',
          priceChange24h: 5.67,
          contractAddress: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
          decimals: 18,
        },
      ];
    }

    // Cache the result
    this.cache.set(address, {
      data: balances,
      timestamp: Date.now(),
    });

    return balances;
  }

  /**
   * Get total USD value of all tokens
   */
  async getTotalBalance(address: string): Promise<string> {
    const balances = await this.getTokenBalances(address);

    const total = balances.reduce((sum, token) => {
      return sum + parseFloat(token.usdValue);
    }, 0);

    return total.toFixed(2);
  }

  /**
   * Format balance with proper decimal places
   */
  formatBalance(balance: string): string {
    // Validate input
    if (!balance || typeof balance !== 'string') {
      throw new BalanceError('Balance must be a valid string');
    }

    const num = parseFloat(balance);

    if (isNaN(num)) {
      throw new BalanceError('Balance must be a valid number');
    }

    if (num < 0) {
      throw new BalanceError('Balance cannot be negative');
    }

    if (num === 0) return '0';

    if (num >= 1000) {
      return num.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
    }

    // For small numbers, preserve significant digits
    if (num < 0.01) {
      return balance;
    }

    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
    });
  }

  /**
   * Format USD value with dollar sign
   */
  formatUSD(value: string): string {
    // Validate input
    if (!value || typeof value !== 'string') {
      throw new BalanceError('USD value must be a valid string');
    }

    const num = parseFloat(value);

    if (isNaN(num)) {
      throw new BalanceError('USD value must be a valid number');
    }

    if (num < 0) {
      throw new BalanceError('USD value cannot be negative');
    }

    return num.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  /**
   * Clear cached balances
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Convert wei to ether
   */
  private weiToEther(wei: string): string {
    const weiValue = BigInt(wei);
    const divisor = BigInt('1000000000000000000'); // 10^18

    // Get whole and fractional parts
    const wholePart = weiValue / divisor;
    const fractionalPart = weiValue % divisor;

    // Convert fractional part to string with leading zeros
    const fractionalStr = fractionalPart.toString().padStart(18, '0');

    // Trim trailing zeros
    const trimmed = fractionalStr.replace(/0+$/, '');

    if (trimmed === '') {
      return wholePart.toString();
    }

    return `${wholePart}.${trimmed}`;
  }

  /**
   * Refresh balance for an address (bypasses cache)
   */
  async refreshBalance(address: string): Promise<TokenBalance[]> {
    this.cache.delete(address);
    return this.getTokenBalances(address);
  }
}

// Singleton instance
export const balanceService = new BalanceService();
