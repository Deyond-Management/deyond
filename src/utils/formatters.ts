/**
 * Formatters Utility
 * Functions for formatting balances, currency, and other values
 */

/**
 * Format a crypto balance with specified decimal places
 */
export const formatCryptoBalance = (
  balance: string,
  decimals: number = 6,
  trimZeros: boolean = false
): string => {
  const num = parseFloat(balance);

  if (isNaN(num)) {
    return `0.${'0'.repeat(decimals)}`;
  }

  let formatted = num.toFixed(decimals);

  // Add commas for thousands
  const parts = formatted.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  formatted = parts.join('.');

  // Trim trailing zeros if specified
  if (trimZeros) {
    formatted = formatted.replace(/\.?0+$/, '');
    // Ensure at least one decimal if it's a decimal number
    if (!formatted.includes('.') && num !== Math.floor(num)) {
      formatted = num.toString();
    }
  }

  return formatted;
};

/**
 * Format a USD value with dollar sign
 */
export const formatUSDValue = (value: string): string => {
  const num = parseFloat(value);

  if (isNaN(num)) {
    return '$0.00';
  }

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const formatted = absNum.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (isNegative) {
    return `-$${formatted}`;
  }

  return `$${formatted}`;
};

/**
 * Format a percentage with sign
 */
export const formatPercentage = (value: number): string => {
  if (value === 0) {
    return '0.00%';
  }

  const formatted = Math.abs(value).toFixed(2);

  if (value > 0) {
    return `+${formatted}%`;
  }

  return `-${formatted}%`;
};

/**
 * Format a number in compact form (K, M, B)
 */
export const formatCompactNumber = (value: number): string => {
  if (value === 0) {
    return '0';
  }

  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`;
  }

  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  return value.toString();
};

/**
 * Format an address with truncation
 */
export const formatAddress = (
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string => {
  if (!address) {
    return '';
  }

  if (address.length <= startChars + endChars) {
    return address;
  }

  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

/**
 * Format a timestamp as relative time
 */
export const formatTimestamp = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return 'Just now';
  }

  if (minutes < 60) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  }

  if (hours < 24) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }

  return days === 1 ? '1 day ago' : `${days} days ago`;
};

export default {
  formatCryptoBalance,
  formatUSDValue,
  formatPercentage,
  formatCompactNumber,
  formatAddress,
  formatTimestamp,
};
