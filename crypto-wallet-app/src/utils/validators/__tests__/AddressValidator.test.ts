import {
  isValidEthAddress,
  isValidEnsName,
  isZeroAddress,
  isValidNonZeroAddress,
  shortenAddress,
  isAddressOrEns,
  getAddressType,
  validateAddresses,
  areAddressesEqual,
  padAddress,
  unpadAddress,
  validateAddress,
  ZERO_ADDRESS,
} from '../AddressValidator';

describe('AddressValidator', () => {
  const validAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
  const invalidAddress = '0xinvalid';

  describe('isValidEthAddress', () => {
    it('should return true for valid address', () => {
      expect(isValidEthAddress(validAddress)).toBe(true);
    });

    it('should return true for lowercase address', () => {
      expect(isValidEthAddress(validAddress.toLowerCase())).toBe(true);
    });

    it('should return false for invalid address', () => {
      expect(isValidEthAddress(invalidAddress)).toBe(false);
    });

    it('should return false for short address', () => {
      expect(isValidEthAddress('0x742d35Cc6634C0532925a3b844Bc454e')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidEthAddress('')).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isValidEthAddress(null as unknown as string)).toBe(false);
      expect(isValidEthAddress(undefined as unknown as string)).toBe(false);
    });

    it('should return false for address without 0x prefix', () => {
      expect(isValidEthAddress('742d35Cc6634C0532925a3b844Bc454e4438f44e')).toBe(false);
    });
  });

  describe('isValidEnsName', () => {
    it('should return true for valid ENS name', () => {
      expect(isValidEnsName('vitalik.eth')).toBe(true);
    });

    it('should return true for ENS with numbers', () => {
      expect(isValidEnsName('user123.eth')).toBe(true);
    });

    it('should return true for ENS with hyphens', () => {
      expect(isValidEnsName('my-wallet.eth')).toBe(true);
    });

    it('should return false for invalid ENS', () => {
      expect(isValidEnsName('invalid')).toBe(false);
      expect(isValidEnsName('invalid.com')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidEnsName('')).toBe(false);
    });
  });

  describe('isZeroAddress', () => {
    it('should return true for zero address', () => {
      expect(isZeroAddress(ZERO_ADDRESS)).toBe(true);
    });

    it('should return true for zero address in different case', () => {
      expect(isZeroAddress('0x0000000000000000000000000000000000000000')).toBe(true);
    });

    it('should return false for non-zero address', () => {
      expect(isZeroAddress(validAddress)).toBe(false);
    });
  });

  describe('isValidNonZeroAddress', () => {
    it('should return true for valid non-zero address', () => {
      expect(isValidNonZeroAddress(validAddress)).toBe(true);
    });

    it('should return false for zero address', () => {
      expect(isValidNonZeroAddress(ZERO_ADDRESS)).toBe(false);
    });

    it('should return false for invalid address', () => {
      expect(isValidNonZeroAddress(invalidAddress)).toBe(false);
    });
  });

  describe('shortenAddress', () => {
    it('should shorten address with default params', () => {
      const shortened = shortenAddress(validAddress);
      expect(shortened).toBe('0x742d...f44e');
    });

    it('should shorten address with custom params', () => {
      const shortened = shortenAddress(validAddress, 10, 8);
      expect(shortened).toBe('0x742d35Cc...4438f44e');
    });

    it('should return empty string for empty input', () => {
      expect(shortenAddress('')).toBe('');
    });

    it('should return full address if shorter than chars', () => {
      expect(shortenAddress('0x123', 3, 3)).toBe('0x123');
    });
  });

  describe('isAddressOrEns', () => {
    it('should return true for valid address', () => {
      expect(isAddressOrEns(validAddress)).toBe(true);
    });

    it('should return true for valid ENS', () => {
      expect(isAddressOrEns('vitalik.eth')).toBe(true);
    });

    it('should return false for invalid input', () => {
      expect(isAddressOrEns('invalid')).toBe(false);
    });
  });

  describe('getAddressType', () => {
    it('should return address for valid address', () => {
      expect(getAddressType(validAddress)).toBe('address');
    });

    it('should return ens for valid ENS', () => {
      expect(getAddressType('vitalik.eth')).toBe('ens');
    });

    it('should return invalid for invalid input', () => {
      expect(getAddressType('invalid')).toBe('invalid');
    });
  });

  describe('validateAddresses', () => {
    it('should separate valid and invalid addresses', () => {
      const addresses = [
        validAddress,
        invalidAddress,
        '0x1234567890123456789012345678901234567890',
        'not-an-address',
      ];

      const { valid, invalid } = validateAddresses(addresses);

      expect(valid).toHaveLength(2);
      expect(invalid).toHaveLength(2);
      expect(valid).toContain(validAddress);
      expect(invalid).toContain(invalidAddress);
    });
  });

  describe('areAddressesEqual', () => {
    it('should return true for same addresses', () => {
      expect(areAddressesEqual(validAddress, validAddress)).toBe(true);
    });

    it('should return true for same addresses different case', () => {
      expect(areAddressesEqual(
        validAddress.toLowerCase(),
        validAddress.toUpperCase().replace('X', 'x')
      )).toBe(true);
    });

    it('should return false for different addresses', () => {
      expect(areAddressesEqual(
        validAddress,
        '0x1234567890123456789012345678901234567890'
      )).toBe(false);
    });

    it('should return false for invalid addresses', () => {
      expect(areAddressesEqual(validAddress, invalidAddress)).toBe(false);
    });
  });

  describe('padAddress', () => {
    it('should pad address to 32 bytes', () => {
      const padded = padAddress(validAddress);
      expect(padded).toHaveLength(66);
      expect(padded.startsWith('0x')).toBe(true);
      expect(padded.endsWith(validAddress.slice(2).toLowerCase())).toBe(true);
    });

    it('should throw for invalid address', () => {
      expect(() => padAddress(invalidAddress)).toThrow();
    });
  });

  describe('unpadAddress', () => {
    it('should extract address from padded format', () => {
      const padded = padAddress(validAddress);
      const unpaded = unpadAddress(padded);
      expect(unpaded.toLowerCase()).toBe(validAddress.toLowerCase());
    });

    it('should throw for invalid padded format', () => {
      expect(() => unpadAddress('0x123')).toThrow();
    });
  });

  describe('validateAddress', () => {
    it('should return valid for correct address', () => {
      const result = validateAddress(validAddress);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return error for empty address', () => {
      const result = validateAddress('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Address is required');
    });

    it('should return error for missing 0x prefix', () => {
      const result = validateAddress('742d35Cc6634C0532925a3b844Bc454e4438f44e');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Address must start with 0x');
    });

    it('should return error for wrong length', () => {
      const result = validateAddress('0x123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Address must be 42 characters long');
    });

    it('should return error for invalid characters', () => {
      const result = validateAddress('0x742d35Cc6634C0532925a3b844Bc454e4438fGGG');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Address contains invalid characters');
    });

    it('should return error for zero address', () => {
      const result = validateAddress(ZERO_ADDRESS);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Cannot use zero address');
    });
  });
});
