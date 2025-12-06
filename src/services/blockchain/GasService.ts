/**
 * GasService
 * Service for gas estimation and fee calculation
 */

import { AppConfig } from '../../config/app.config';
import { MOCK_GAS_PRICES } from '../../mocks/mockData';

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
  private cacheTimeout = 15000; // 15 seconds

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
      // Real implementation - fetch from RPC or gas station API
      const baseFee = '25'; // gwei

      gasPrices = {
        slow: {
          maxFeePerGas: '30',
          maxPriorityFeePerGas: '1',
          estimatedTime: 120, // 2 minutes
        },
        standard: {
          maxFeePerGas: '40',
          maxPriorityFeePerGas: '2',
          estimatedTime: 45, // 45 seconds
        },
        fast: {
          maxFeePerGas: '60',
          maxPriorityFeePerGas: '5',
          estimatedTime: 15, // 15 seconds
        },
        baseFee,
      };
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
    const gasLimit = parseFloat(params.gasLimit);
    const maxFeePerGas = parseFloat(params.maxFeePerGas);

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
    const gweiNum = parseFloat(gwei);
    const eth = gweiNum / 1_000_000_000;
    return eth.toString();
  }

  /**
   * Convert wei to gwei
   */
  weiToGwei(wei: string): string {
    const weiNum = parseFloat(wei);
    const gwei = weiNum / 1_000_000_000;
    return gwei.toString();
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
}

export default GasService;
