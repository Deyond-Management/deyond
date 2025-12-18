/**
 * Utils Index
 * Export all utility functions
 */

export {
  formatCryptoBalance,
  formatUSDValue,
  formatPercentage,
  formatCompactNumber,
  formatAddress,
  formatTimestamp,
} from './formatters';

// Export validators
export * from './validators';

// Export converters
export * from './converters';

// Export parsers
export * from './parsers';

// Export logger
export { logger, Logger, LogLevel } from './Logger';

// Additional utility functions

/**
 * Truncate string in the middle
 */
export const truncateMiddle = (
  str: string,
  startChars: number = 6,
  endChars: number = 4
): string => {
  if (str.length <= startChars + endChars) return str;
  return `${str.slice(0, startChars)}...${str.slice(-endChars)}`;
};

/**
 * Validate Ethereum address
 */
export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Validate transaction hash
 */
export const isValidTxHash = (hash: string): boolean => {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
};

/**
 * Convert wei to ether
 */
export const weiToEther = (wei: string): string => {
  const weiBigInt = BigInt(wei);
  const etherValue = Number(weiBigInt) / 1e18;
  return etherValue.toString();
};

/**
 * Convert ether to wei
 */
export const etherToWei = (ether: string): string => {
  const etherNum = parseFloat(ether);
  const weiValue = BigInt(Math.floor(etherNum * 1e18));
  return weiValue.toString();
};

/**
 * Convert gwei to wei
 */
export const gweiToWei = (gwei: string): string => {
  const gweiNum = parseFloat(gwei);
  const weiValue = BigInt(Math.floor(gweiNum * 1e9));
  return weiValue.toString();
};

/**
 * Delay for specified milliseconds
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Generate random ID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Deep clone object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if object is empty
 */
export const isEmpty = (obj: object): boolean => {
  return Object.keys(obj).length === 0;
};

/**
 * Capitalize first letter
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Parse error message from various error types
 */
export const parseErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
};
