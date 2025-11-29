/**
 * App Constants Tests
 */

import * as AppConstants from '../../constants/app';

describe('App Constants', () => {
  describe('App Info', () => {
    it('should export APP_NAME', () => {
      expect(AppConstants.APP_NAME).toBe('Deyond Wallet');
    });

    it('should export APP_VERSION', () => {
      expect(AppConstants.APP_VERSION).toBeDefined();
    });

    it('should export APP_BUILD', () => {
      expect(AppConstants.APP_BUILD).toBeDefined();
    });
  });

  describe('Wallet Constants', () => {
    it('should export DEFAULT_DERIVATION_PATH', () => {
      expect(AppConstants.DEFAULT_DERIVATION_PATH).toBe("m/44'/60'/0'/0/0");
    });

    it('should export MNEMONIC_WORD_COUNT', () => {
      expect(AppConstants.MNEMONIC_WORD_COUNT).toBe(12);
    });

    it('should export PIN_LENGTH', () => {
      expect(AppConstants.PIN_LENGTH).toBe(6);
    });

    it('should export MAX_PIN_ATTEMPTS', () => {
      expect(AppConstants.MAX_PIN_ATTEMPTS).toBeGreaterThan(0);
    });

    it('should export LOCKOUT_DURATION', () => {
      expect(AppConstants.LOCKOUT_DURATION).toBeGreaterThan(0);
    });
  });

  describe('Network Constants', () => {
    it('should export DEFAULT_NETWORK_ID', () => {
      expect(AppConstants.DEFAULT_NETWORK_ID).toBe('ethereum-mainnet');
    });

    it('should export SUPPORTED_NETWORKS as array', () => {
      expect(Array.isArray(AppConstants.SUPPORTED_NETWORKS)).toBe(true);
      expect(AppConstants.SUPPORTED_NETWORKS.length).toBeGreaterThan(0);
    });
  });

  describe('Gas Constants', () => {
    it('should export gas limits', () => {
      expect(AppConstants.DEFAULT_GAS_LIMIT).toBeDefined();
      expect(AppConstants.ERC20_GAS_LIMIT).toBeDefined();
      expect(AppConstants.CONTRACT_GAS_LIMIT).toBeDefined();
    });

    it('should export GAS_PRICE_REFRESH_INTERVAL', () => {
      expect(AppConstants.GAS_PRICE_REFRESH_INTERVAL).toBeGreaterThan(0);
    });
  });

  describe('Transaction Constants', () => {
    it('should export transaction settings', () => {
      expect(AppConstants.TRANSACTION_CONFIRMATIONS).toBeGreaterThan(0);
      expect(AppConstants.TRANSACTION_TIMEOUT).toBeGreaterThan(0);
      expect(AppConstants.MAX_RECENT_TRANSACTIONS).toBeGreaterThan(0);
    });
  });

  describe('BLE Constants', () => {
    it('should export BLE UUIDs', () => {
      expect(AppConstants.BLE_SERVICE_UUID).toBeDefined();
      expect(AppConstants.BLE_CHARACTERISTIC_UUID).toBeDefined();
    });

    it('should export BLE timeouts', () => {
      expect(AppConstants.BLE_SCAN_TIMEOUT).toBeGreaterThan(0);
      expect(AppConstants.BLE_CONNECTION_TIMEOUT).toBeGreaterThan(0);
    });
  });

  describe('Security Constants', () => {
    it('should export AUTO_LOCK_OPTIONS', () => {
      expect(Array.isArray(AppConstants.AUTO_LOCK_OPTIONS)).toBe(true);
      expect(AppConstants.AUTO_LOCK_OPTIONS.length).toBeGreaterThan(0);
      expect(AppConstants.AUTO_LOCK_OPTIONS[0]).toHaveProperty('label');
      expect(AppConstants.AUTO_LOCK_OPTIONS[0]).toHaveProperty('value');
    });
  });

  describe('UI Constants', () => {
    it('should export animation durations', () => {
      expect(AppConstants.ANIMATION_DURATION).toBeGreaterThan(0);
      expect(AppConstants.TOAST_DURATION).toBeGreaterThan(0);
      expect(AppConstants.SKELETON_ANIMATION_DURATION).toBeGreaterThan(0);
    });
  });

  describe('Storage Keys', () => {
    it('should export STORAGE_KEYS object', () => {
      expect(AppConstants.STORAGE_KEYS).toBeDefined();
      expect(AppConstants.STORAGE_KEYS.WALLET).toBeDefined();
      expect(AppConstants.STORAGE_KEYS.SETTINGS).toBeDefined();
      expect(AppConstants.STORAGE_KEYS.THEME).toBeDefined();
    });
  });

  describe('API Endpoints', () => {
    it('should export API_ENDPOINTS object', () => {
      expect(AppConstants.API_ENDPOINTS).toBeDefined();
      expect(AppConstants.API_ENDPOINTS.GAS_PRICE).toBeDefined();
      expect(AppConstants.API_ENDPOINTS.TOKEN_PRICES).toBeDefined();
    });
  });

  describe('Regex Patterns', () => {
    it('should export PATTERNS object', () => {
      expect(AppConstants.PATTERNS).toBeDefined();
      expect(AppConstants.PATTERNS.ETH_ADDRESS).toBeInstanceOf(RegExp);
      expect(AppConstants.PATTERNS.TX_HASH).toBeInstanceOf(RegExp);
    });

    it('should validate Ethereum addresses', () => {
      expect(
        AppConstants.PATTERNS.ETH_ADDRESS.test('0x1234567890123456789012345678901234567890')
      ).toBe(true);
      expect(AppConstants.PATTERNS.ETH_ADDRESS.test('invalid')).toBe(false);
    });

    it('should validate transaction hashes', () => {
      const validHash = '0x' + '1'.repeat(64);
      expect(AppConstants.PATTERNS.TX_HASH.test(validHash)).toBe(true);
      expect(AppConstants.PATTERNS.TX_HASH.test('invalid')).toBe(false);
    });

    it('should validate numeric patterns', () => {
      expect(AppConstants.PATTERNS.NUMERIC.test('123')).toBe(true);
      expect(AppConstants.PATTERNS.NUMERIC.test('abc')).toBe(false);
    });

    it('should validate decimal patterns', () => {
      expect(AppConstants.PATTERNS.DECIMAL.test('123.45')).toBe(true);
      expect(AppConstants.PATTERNS.DECIMAL.test('123')).toBe(true);
      expect(AppConstants.PATTERNS.DECIMAL.test('abc')).toBe(false);
    });
  });

  describe('Error Messages', () => {
    it('should export ERROR_MESSAGES object', () => {
      expect(AppConstants.ERROR_MESSAGES).toBeDefined();
      expect(AppConstants.ERROR_MESSAGES.INVALID_ADDRESS).toBeDefined();
      expect(AppConstants.ERROR_MESSAGES.NETWORK_ERROR).toBeDefined();
    });
  });
});
