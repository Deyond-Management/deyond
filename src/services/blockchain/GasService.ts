/**
 * GasService
 * Service for gas estimation and fee calculation
 */

import { AppConfig } from '../../config/app.config';
import { MOCK_GAS_PRICES } from '../../mocks/mockData';
import { DEFAULT_SERVICES_CONFIG, CacheConfig } from '../../config/services.config';
import { getProviderManager } from './ProviderManager';
import { EthereumProvider } from './EthereumProvider';

export class GasError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GasError';
  }
}

export interface GasPreset {
  maxFeePerGas: string; // in gwei
  maxPriorityFeePerGas: string; // in gwei
  estimatedTime: number; // in seconds
}

export interface GasPrices {
  slow: GasPreset;
  standard: GasPreset;
  fast: GasPreset;
  baseFee: string; // Current base fee in gwei
}

export interface GasEstimate {
  gasLimit: string;
}

export interface TransactionParams {
  to: string;
  value: string;
  data?: string;
  from?: string;
}

export interface FeeCalculation {
  totalFeeETH: string;
  totalFeeUSD?: string;
}

export class GasService {
  private cache: { data: GasPrices; timestamp: number } | null = null;
  private cacheTimeout: number;
  private provider: EthereumProvider | null = null;

  constructor(config?: Partial<CacheConfig>) {
    const cacheConfig = { ...DEFAULT_SERVICES_CONFIG.cache, ...config };
    this.cacheTimeout = cacheConfig.gasTimeout;

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
   * Get current gas prices for all presets
   */
  async getGasPrices(): Promise<GasPrices> {
    // Check cache
    if (this.cache && Date.now() - this.cache.timestamp < this.cacheTimeout) {
      return this.cache.data;
    }

    let gasPrices: GasPrices;

    // Use mock data in demo mode
    if (AppConfig.demoMode) {
      gasPrices = {
        slow: {
          maxFeePerGas: MOCK_GAS_PRICES.slow.maxFeePerGas.toString(),
          maxPriorityFeePerGas: MOCK_GAS_PRICES.slow.maxPriorityFeePerGas.toString(),
          estimatedTime: MOCK_GAS_PRICES.slow.estimatedTime,
        },
        standard: {
          maxFeePerGas: MOCK_GAS_PRICES.standard.maxFeePerGas.toString(),
          maxPriorityFeePerGas: MOCK_GAS_PRICES.standard.maxPriorityFeePerGas.toString(),
          estimatedTime: MOCK_GAS_PRICES.standard.estimatedTime,
        },
        fast: {
          maxFeePerGas: MOCK_GAS_PRICES.fast.maxFeePerGas.toString(),
          maxPriorityFeePerGas: MOCK_GAS_PRICES.fast.maxPriorityFeePerGas.toString(),
          estimatedTime: MOCK_GAS_PRICES.fast.estimatedTime,
        },
        baseFee: MOCK_GAS_PRICES.baseFee.toString(),
      };
    } else {
      // Real implementation - fetch from RPC
      if (!this.provider) {
        throw new GasError('Provider not initialized');
      }

      try {
        // Get EIP-1559 fee data
        const feeData = await this.provider.getFeeData();

        // Convert wei to gwei for display
        const baseFeeGwei = feeData.baseFeePerGas ? this.weiToGwei(feeData.baseFeePerGas) : '0';
        const priorityFeeGwei = this.weiToGwei(feeData.maxPriorityFeePerGas);

        // Calculate presets based on current fees
        const baseFee = parseFloat(baseFeeGwei);
        const priorityFee = parseFloat(priorityFeeGwei);

        gasPrices = {
          slow: {
            maxFeePerGas: (baseFee * 1.1 + priorityFee * 0.8).toFixed(2),
            maxPriorityFeePerGas: (priorityFee * 0.8).toFixed(2),
            estimatedTime: 120, // 2 minutes
          },
          standard: {
            maxFeePerGas: (baseFee * 1.25 + priorityFee).toFixed(2),
            maxPriorityFeePerGas: priorityFee.toFixed(2),
            estimatedTime: 45, // 45 seconds
          },
          fast: {
            maxFeePerGas: (baseFee * 1.5 + priorityFee * 1.5).toFixed(2),
            maxPriorityFeePerGas: (priorityFee * 1.5).toFixed(2),
            estimatedTime: 15, // 15 seconds
          },
          baseFee: baseFeeGwei,
        };
      } catch (error) {
        throw new GasError(
          `Failed to fetch gas prices: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Cache the result
    this.cache = {
      data: gasPrices,
      timestamp: Date.now(),
    };

    return gasPrices;
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(params: TransactionParams): Promise<GasEstimate> {
    // Validate address
    if (!this.isValidAddress(params.to)) {
      throw new GasError('Invalid recipient address');
    }

    // Simple ETH transfer
    if (!params.data || params.data === '0x') {
      return { gasLimit: '21000' };
    }

    // ERC-20 or contract call - estimate higher gas
    // In real app, this would call eth_estimateGas
    if (params.data.startsWith('0xa9059cbb')) {
      // ERC-20 transfer
      return { gasLimit: '65000' };
    }

    // Default for unknown contract calls
    return { gasLimit: '100000' };
  }

  /**
   * Calculate total fee in ETH and USD
   */
  calculateFee(params: {
    gasLimit: string;
    maxFeePerGas: string;
    ethPriceUSD?: number;
  }): FeeCalculation {
    // Validate inputs
    if (!params.gasLimit || typeof params.gasLimit !== 'string') {
      throw new GasError('Gas limit must be a valid string');
    }

    if (!params.maxFeePerGas || typeof params.maxFeePerGas !== 'string') {
      throw new GasError('Max fee per gas must be a valid string');
    }

    const gasLimit = parseFloat(params.gasLimit);
    const maxFeePerGas = parseFloat(params.maxFeePerGas);

    if (isNaN(gasLimit) || gasLimit <= 0) {
      throw new GasError('Gas limit must be a positive number');
    }

    if (isNaN(maxFeePerGas) || maxFeePerGas <= 0) {
      throw new GasError('Max fee per gas must be a positive number');
    }

    if (params.ethPriceUSD !== undefined) {
      if (typeof params.ethPriceUSD !== 'number' || params.ethPriceUSD <= 0) {
        throw new GasError('ETH price must be a positive number');
      }
    }

    // Calculate fee in gwei
    const feeInGwei = gasLimit * maxFeePerGas;

    // Convert to ETH (1 ETH = 1,000,000,000 gwei)
    const feeInETH = feeInGwei / 1_000_000_000;

    const result: FeeCalculation = {
      totalFeeETH: feeInETH.toFixed(5),
    };

    // Calculate USD if price provided
    if (params.ethPriceUSD) {
      const feeInUSD = feeInETH * params.ethPriceUSD;
      result.totalFeeUSD = feeInUSD.toFixed(2);
    }

    return result;
  }

  /**
   * Validate custom gas limit
   */
  validateGasLimit(gasLimit: string): void {
    const limit = parseInt(gasLimit);
    if (isNaN(limit) || limit < 21000) {
      throw new GasError('Gas limit must be at least 21000');
    }
    if (limit > 15000000) {
      throw new GasError('Gas limit too high');
    }
  }

  /**
   * Validate custom gas price
   */
  validateGasPrice(gasPrice: string): void {
    const price = parseFloat(gasPrice);
    if (isNaN(price) || price <= 0) {
      throw new GasError('Gas price must be greater than 0');
    }
  }

  /**
   * Validate max fee per gas
   */
  validateMaxFee(maxFee: string): void {
    const fee = parseFloat(maxFee);
    if (isNaN(fee) || fee <= 0) {
      throw new GasError('Max fee must be greater than 0');
    }
    if (fee > 1000000) {
      throw new GasError('Max fee too high');
    }
  }

  /**
   * Convert gwei to ETH
   */
  gweiToEth(gwei: string): string {
    if (!gwei || typeof gwei !== 'string') {
      throw new GasError('Gwei value must be a valid string');
    }

    const gweiNum = parseFloat(gwei);

    if (isNaN(gweiNum) || gweiNum < 0) {
      throw new GasError('Gwei value must be a non-negative number');
    }

    const eth = gweiNum / 1_000_000_000;
    return eth.toString();
  }

  /**
   * Format gas price for display
   */
  formatGasPrice(weiValue: string): string {
    const gwei = this.weiToGwei(weiValue);
    return `${gwei} Gwei`;
  }

  /**
   * Clear cached gas prices
   */
  clearCache(): void {
    this.cache = null;
  }

  /**
   * Validate Ethereum address
   */
  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Convert wei to gwei
   */
  private weiToGwei(wei: string): string {
    const weiValue = BigInt(wei);
    const divisor = BigInt('1000000000'); // 10^9

    // Get whole and fractional parts
    const wholePart = weiValue / divisor;
    const fractionalPart = weiValue % divisor;

    // Convert fractional part to string with leading zeros
    const fractionalStr = fractionalPart.toString().padStart(9, '0');

    // Trim trailing zeros
    const trimmed = fractionalStr.replace(/0+$/, '');

    if (trimmed === '') {
      return wholePart.toString();
    }

    return `${wholePart}.${trimmed}`;
  }
}

export default GasService;
