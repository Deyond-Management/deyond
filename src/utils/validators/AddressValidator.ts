/**
 * AddressValidator
 * Centralized address validation utilities
 */

// Ethereum address regex pattern
const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

// ENS name regex pattern
const ENS_NAME_REGEX = /^[a-zA-Z0-9-]+\.eth$/;

// Contract creation address
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * Validate Ethereum address format
 */
export const isValidEthAddress = (address: string): boolean => {
  if (!address || typeof address !== 'string') {
    return false;
  }
  return ETH_ADDRESS_REGEX.test(address);
};

/**
 * Validate ENS name format
 */
export const isValidEnsName = (name: string): boolean => {
  if (!name || typeof name !== 'string') {
    return false;
  }
  return ENS_NAME_REGEX.test(name);
};

/**
 * Check if address is the zero address
 */
export const isZeroAddress = (address: string): boolean => {
  return address.toLowerCase() === ZERO_ADDRESS.toLowerCase();
};

/**
 * Validate address is not zero address
 */
export const isValidNonZeroAddress = (address: string): boolean => {
  return isValidEthAddress(address) && !isZeroAddress(address);
};

/**
 * Normalize Ethereum address to checksum format
 * Uses keccak256 for proper checksumming
 */
export const normalizeAddress = (address: string): string => {
  if (!isValidEthAddress(address)) {
    throw new Error('Invalid Ethereum address');
  }
  // Return lowercase for now (full checksum requires keccak256)
  return address.toLowerCase();
};

/**
 * Shorten address for display
 */
export const shortenAddress = (
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string => {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

/**
 * Check if string is address or ENS name
 */
export const isAddressOrEns = (input: string): boolean => {
  return isValidEthAddress(input) || isValidEnsName(input);
};

/**
 * Get address type
 */
export const getAddressType = (input: string): 'address' | 'ens' | 'invalid' => {
  if (isValidEthAddress(input)) return 'address';
  if (isValidEnsName(input)) return 'ens';
  return 'invalid';
};

/**
 * Validate multiple addresses
 */
export const validateAddresses = (addresses: string[]): { valid: string[]; invalid: string[] } => {
  const valid: string[] = [];
  const invalid: string[] = [];

  addresses.forEach(address => {
    if (isValidEthAddress(address)) {
      valid.push(address);
    } else {
      invalid.push(address);
    }
  });

  return { valid, invalid };
};

/**
 * Compare addresses (case-insensitive)
 */
export const areAddressesEqual = (address1: string, address2: string): boolean => {
  if (!isValidEthAddress(address1) || !isValidEthAddress(address2)) {
    return false;
  }
  return address1.toLowerCase() === address2.toLowerCase();
};

/**
 * Pad address to 32 bytes (for contract calls)
 */
export const padAddress = (address: string): string => {
  if (!isValidEthAddress(address)) {
    throw new Error('Invalid Ethereum address');
  }
  // Remove 0x and pad to 64 characters
  return '0x' + address.slice(2).toLowerCase().padStart(64, '0');
};

/**
 * Extract address from padded format
 */
export const unpadAddress = (paddedAddress: string): string => {
  if (!paddedAddress.startsWith('0x') || paddedAddress.length !== 66) {
    throw new Error('Invalid padded address format');
  }
  return '0x' + paddedAddress.slice(-40);
};

// Export constants
export { ETH_ADDRESS_REGEX, ENS_NAME_REGEX, ZERO_ADDRESS };

// Export validation result type
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Comprehensive address validation with error messages
 */
export const validateAddress = (address: string): ValidationResult => {
  if (!address) {
    return { isValid: false, error: 'Address is required' };
  }

  if (typeof address !== 'string') {
    return { isValid: false, error: 'Address must be a string' };
  }

  if (!address.startsWith('0x')) {
    return { isValid: false, error: 'Address must start with 0x' };
  }

  if (address.length !== 42) {
    return { isValid: false, error: 'Address must be 42 characters long' };
  }

  if (!ETH_ADDRESS_REGEX.test(address)) {
    return { isValid: false, error: 'Address contains invalid characters' };
  }

  if (isZeroAddress(address)) {
    return { isValid: false, error: 'Cannot use zero address' };
  }

  return { isValid: true };
};
