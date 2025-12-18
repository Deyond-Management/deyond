/**
 * UnitConverter
 * Centralized unit conversion utilities for cryptocurrency values
 */

import { CRYPTO_CONSTANTS } from '../../config/constants/CryptoConstants';

/**
 * Supported cryptocurrency units
 */
export type EthereumUnit = 'wei' | 'gwei' | 'ether';
export type SolanaUnit = 'lamport' | 'sol';
export type BitcoinUnit = 'satoshi' | 'btc';

/**
 * Unit multipliers for Ethereum
 */
const ETH_MULTIPLIERS: Record<EthereumUnit, bigint> = {
  wei: 1n,
  gwei: 1_000_000_000n,
  ether: 1_000_000_000_000_000_000n,
};

/**
 * Unit multipliers for Solana
 */
const SOL_MULTIPLIERS: Record<SolanaUnit, bigint> = {
  lamport: 1n,
  sol: 1_000_000_000n,
};

/**
 * Unit multipliers for Bitcoin
 */
const BTC_MULTIPLIERS: Record<BitcoinUnit, bigint> = {
  satoshi: 1n,
  btc: 100_000_000n,
};

/**
 * Decimals for common token standards
 */
export const TOKEN_DECIMALS = {
  ETH: 18,
  GWEI: 9,
  USDT: 6,
  USDC: 6,
  BTC: 8,
  SOL: 9,
} as const;

/**
 * UnitConverter class
 */
export class UnitConverter {
  // ==================== Ethereum Conversions ====================

  /**
   * Convert wei to gwei
   */
  static weiToGwei(wei: string | bigint): string {
    const weiBigInt = typeof wei === 'string' ? BigInt(wei) : wei;
    const gwei = weiBigInt / ETH_MULTIPLIERS.gwei;
    const remainder = weiBigInt % ETH_MULTIPLIERS.gwei;

    if (remainder === 0n) {
      return gwei.toString();
    }

    // Include decimal places
    const decimalPart = remainder.toString().padStart(9, '0');
    return `${gwei}.${decimalPart}`.replace(/\.?0+$/, '');
  }

  /**
   * Convert wei to ether
   */
  static weiToEther(wei: string | bigint): string {
    const weiBigInt = typeof wei === 'string' ? BigInt(wei) : wei;
    const ether = weiBigInt / ETH_MULTIPLIERS.ether;
    const remainder = weiBigInt % ETH_MULTIPLIERS.ether;

    if (remainder === 0n) {
      return ether.toString();
    }

    // Include decimal places
    const decimalPart = remainder.toString().padStart(18, '0');
    return `${ether}.${decimalPart}`.replace(/\.?0+$/, '');
  }

  /**
   * Convert gwei to wei
   */
  static gweiToWei(gwei: string | number): string {
    const gweiStr = typeof gwei === 'number' ? gwei.toString() : gwei;
    return this.parseDecimalToBigInt(gweiStr, 9).toString();
  }

  /**
   * Convert ether to wei
   */
  static etherToWei(ether: string | number): string {
    const etherStr = typeof ether === 'number' ? ether.toString() : ether;
    return this.parseDecimalToBigInt(etherStr, 18).toString();
  }

  /**
   * Convert gwei to ether
   */
  static gweiToEther(gwei: string | number): string {
    const gweiStr = typeof gwei === 'number' ? gwei.toString() : gwei;
    const wei = this.gweiToWei(gweiStr);
    return this.weiToEther(BigInt(wei));
  }

  /**
   * Convert ether to gwei
   */
  static etherToGwei(ether: string | number): string {
    const etherStr = typeof ether === 'number' ? ether.toString() : ether;
    const wei = this.etherToWei(etherStr);
    return this.weiToGwei(BigInt(wei));
  }

  // ==================== Solana Conversions ====================

  /**
   * Convert lamports to SOL
   */
  static lamportsToSol(lamports: string | bigint): string {
    const lamportsBigInt = typeof lamports === 'string' ? BigInt(lamports) : lamports;
    const sol = lamportsBigInt / SOL_MULTIPLIERS.sol;
    const remainder = lamportsBigInt % SOL_MULTIPLIERS.sol;

    if (remainder === 0n) {
      return sol.toString();
    }

    const decimalPart = remainder.toString().padStart(9, '0');
    return `${sol}.${decimalPart}`.replace(/\.?0+$/, '');
  }

  /**
   * Convert SOL to lamports
   */
  static solToLamports(sol: string | number): string {
    const solStr = typeof sol === 'number' ? sol.toString() : sol;
    return this.parseDecimalToBigInt(solStr, 9).toString();
  }

  // ==================== Bitcoin Conversions ====================

  /**
   * Convert satoshis to BTC
   */
  static satoshisToBtc(satoshis: string | bigint): string {
    const satsBigInt = typeof satoshis === 'string' ? BigInt(satoshis) : satoshis;
    const btc = satsBigInt / BTC_MULTIPLIERS.btc;
    const remainder = satsBigInt % BTC_MULTIPLIERS.btc;

    if (remainder === 0n) {
      return btc.toString();
    }

    const decimalPart = remainder.toString().padStart(8, '0');
    return `${btc}.${decimalPart}`.replace(/\.?0+$/, '');
  }

  /**
   * Convert BTC to satoshis
   */
  static btcToSatoshis(btc: string | number): string {
    const btcStr = typeof btc === 'number' ? btc.toString() : btc;
    return this.parseDecimalToBigInt(btcStr, 8).toString();
  }

  // ==================== Generic Token Conversions ====================

  /**
   * Convert from smallest unit to display unit
   */
  static fromSmallestUnit(value: string | bigint, decimals: number): string {
    const valueBigInt = typeof value === 'string' ? BigInt(value) : value;
    const divisor = 10n ** BigInt(decimals);
    const whole = valueBigInt / divisor;
    const remainder = valueBigInt % divisor;

    if (remainder === 0n) {
      return whole.toString();
    }

    const decimalPart = remainder.toString().padStart(decimals, '0');
    return `${whole}.${decimalPart}`.replace(/\.?0+$/, '');
  }

  /**
   * Convert from display unit to smallest unit
   */
  static toSmallestUnit(value: string | number, decimals: number): string {
    const valueStr = typeof value === 'number' ? value.toString() : value;
    return this.parseDecimalToBigInt(valueStr, decimals).toString();
  }

  // ==================== Formatting ====================

  /**
   * Format value with specified decimal places
   */
  static formatValue(
    value: string | number,
    decimals: number = 4,
    trimTrailingZeros: boolean = true
  ): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      return '0';
    }

    const formatted = numValue.toFixed(decimals);

    if (trimTrailingZeros) {
      return formatted.replace(/\.?0+$/, '');
    }

    return formatted;
  }

  /**
   * Format value with commas for thousands
   */
  static formatWithCommas(value: string | number): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      return '0';
    }

    const parts = numValue.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  /**
   * Format cryptocurrency value for display
   */
  static formatCryptoValue(value: string | number, symbol: string, decimals: number = 6): string {
    const formatted = this.formatValue(value, decimals);
    return `${formatted} ${symbol}`;
  }

  /**
   * Format fiat value with currency symbol
   */
  static formatFiatValue(
    value: string | number,
    currency: string = 'USD',
    locale: string = 'en-US'
  ): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      return '$0.00';
    }

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numValue);
  }

  /**
   * Format large numbers with abbreviations (K, M, B, T)
   */
  static formatCompact(value: string | number): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      return '0';
    }

    const absValue = Math.abs(numValue);
    const sign = numValue < 0 ? '-' : '';

    if (absValue >= 1e12) {
      return `${sign}${(absValue / 1e12).toFixed(2)}T`;
    }
    if (absValue >= 1e9) {
      return `${sign}${(absValue / 1e9).toFixed(2)}B`;
    }
    if (absValue >= 1e6) {
      return `${sign}${(absValue / 1e6).toFixed(2)}M`;
    }
    if (absValue >= 1e3) {
      return `${sign}${(absValue / 1e3).toFixed(2)}K`;
    }

    return this.formatValue(numValue, 2);
  }

  // ==================== Gas Calculations ====================

  /**
   * Calculate gas cost in wei
   */
  static calculateGasCostWei(gasLimit: string | bigint, gasPrice: string | bigint): string {
    const limitBigInt = typeof gasLimit === 'string' ? BigInt(gasLimit) : gasLimit;
    const priceBigInt = typeof gasPrice === 'string' ? BigInt(gasPrice) : gasPrice;
    return (limitBigInt * priceBigInt).toString();
  }

  /**
   * Calculate gas cost in ether
   */
  static calculateGasCostEther(gasLimit: string | bigint, gasPriceGwei: string | number): string {
    const gasPriceWei = this.gweiToWei(gasPriceGwei);
    const gasCostWei = this.calculateGasCostWei(gasLimit, gasPriceWei);
    return this.weiToEther(gasCostWei);
  }

  // ==================== Utility Methods ====================

  /**
   * Parse decimal string to BigInt with specified decimals
   */
  private static parseDecimalToBigInt(value: string, decimals: number): bigint {
    // Handle scientific notation
    if (value.includes('e') || value.includes('E')) {
      const num = parseFloat(value);
      value = num.toFixed(decimals);
    }

    const [whole, fraction = ''] = value.split('.');

    // Pad or truncate fraction to match decimals
    const paddedFraction = fraction.slice(0, decimals).padEnd(decimals, '0');

    // Combine and convert to BigInt
    const combined = `${whole}${paddedFraction}`.replace(/^0+/, '') || '0';
    return BigInt(combined);
  }

  /**
   * Compare two values
   */
  static compare(a: string | bigint, b: string | bigint): number {
    const aBigInt = typeof a === 'string' ? BigInt(a) : a;
    const bBigInt = typeof b === 'string' ? BigInt(b) : b;

    if (aBigInt < bBigInt) return -1;
    if (aBigInt > bBigInt) return 1;
    return 0;
  }

  /**
   * Check if value is zero
   */
  static isZero(value: string | bigint): boolean {
    const valueBigInt = typeof value === 'string' ? BigInt(value) : value;
    return valueBigInt === 0n;
  }

  /**
   * Add two values
   */
  static add(a: string | bigint, b: string | bigint): string {
    const aBigInt = typeof a === 'string' ? BigInt(a) : a;
    const bBigInt = typeof b === 'string' ? BigInt(b) : b;
    return (aBigInt + bBigInt).toString();
  }

  /**
   * Subtract two values
   */
  static subtract(a: string | bigint, b: string | bigint): string {
    const aBigInt = typeof a === 'string' ? BigInt(a) : a;
    const bBigInt = typeof b === 'string' ? BigInt(b) : b;
    return (aBigInt - bBigInt).toString();
  }

  /**
   * Multiply value by percentage (e.g., 1.15 for 15% increase)
   */
  static multiplyByPercentage(value: string | bigint, multiplier: number): string {
    const valueBigInt = typeof value === 'string' ? BigInt(value) : value;
    const scaledMultiplier = BigInt(Math.round(multiplier * 10000));
    return ((valueBigInt * scaledMultiplier) / 10000n).toString();
  }
}

// Export convenience functions
export const weiToGwei = UnitConverter.weiToGwei;
export const weiToEther = UnitConverter.weiToEther;
export const gweiToWei = UnitConverter.gweiToWei;
export const etherToWei = UnitConverter.etherToWei;
export const lamportsToSol = UnitConverter.lamportsToSol;
export const solToLamports = UnitConverter.solToLamports;
export const satoshisToBtc = UnitConverter.satoshisToBtc;
export const btcToSatoshis = UnitConverter.btcToSatoshis;
export const fromSmallestUnit = UnitConverter.fromSmallestUnit;
export const toSmallestUnit = UnitConverter.toSmallestUnit;
export const formatCryptoValue = UnitConverter.formatCryptoValue;
export const formatFiatValue = UnitConverter.formatFiatValue;
export const formatCompact = UnitConverter.formatCompact;
export const calculateGasCostEther = UnitConverter.calculateGasCostEther;

export default UnitConverter;
