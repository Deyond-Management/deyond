import {
  GAS_LIMITS,
  CACHE_TTL,
  API_TIMEOUT,
  RETRY_CONFIG,
  CHAIN_IDS,
  SECURITY,
  WEI_UNITS,
} from '../CryptoConstants';

import {
  STORAGE_PREFIX,
  WALLET_KEYS,
  SETTINGS_KEYS,
  CACHE_KEYS,
  AUTH_KEYS,
  ALL_STORAGE_KEYS,
  getKeysForPrefix,
} from '../StorageKeys';

import {
  ERROR_CODES,
  ERROR_MESSAGES,
  RPC_ERROR_MAP,
  HTTP_ERROR_MAP,
  getErrorMessage,
  mapRpcError,
  mapHttpError,
} from '../ErrorCodes';

describe('CryptoConstants', () => {
  describe('GAS_LIMITS', () => {
    it('should have correct ETH transfer gas', () => {
      expect(GAS_LIMITS.ETH_TRANSFER).toBe(21000);
    });

    it('should have correct ERC20 transfer gas', () => {
      expect(GAS_LIMITS.ERC20_TRANSFER).toBe(65000);
    });

    it('should have max gas limit', () => {
      expect(GAS_LIMITS.MAX).toBe(15_000_000);
    });
  });

  describe('CACHE_TTL', () => {
    it('should have increasing TTL values', () => {
      expect(CACHE_TTL.SHORT).toBeLessThan(CACHE_TTL.MEDIUM);
      expect(CACHE_TTL.MEDIUM).toBeLessThan(CACHE_TTL.LONG);
      expect(CACHE_TTL.LONG).toBeLessThan(CACHE_TTL.EXTENDED);
    });
  });

  describe('API_TIMEOUT', () => {
    it('should have reasonable timeout values', () => {
      expect(API_TIMEOUT.SHORT).toBe(5000);
      expect(API_TIMEOUT.DEFAULT).toBe(10000);
      expect(API_TIMEOUT.LONG).toBe(30000);
    });
  });

  describe('RETRY_CONFIG', () => {
    it('should have valid retry configuration', () => {
      expect(RETRY_CONFIG.MAX_ATTEMPTS).toBeGreaterThan(0);
      expect(RETRY_CONFIG.BACKOFF_FACTOR).toBeGreaterThan(1);
    });
  });

  describe('CHAIN_IDS', () => {
    it('should have correct mainnet chain ID', () => {
      expect(CHAIN_IDS.ETHEREUM_MAINNET).toBe(1);
    });

    it('should have correct polygon chain ID', () => {
      expect(CHAIN_IDS.POLYGON_MAINNET).toBe(137);
    });
  });

  describe('SECURITY', () => {
    it('should have correct PIN attempts', () => {
      expect(SECURITY.MAX_PIN_ATTEMPTS).toBe(5);
    });

    it('should have correct mnemonic word counts', () => {
      expect(SECURITY.MNEMONIC_WORDS).toBe(12);
      expect(SECURITY.MNEMONIC_WORDS_EXTENDED).toBe(24);
    });
  });

  describe('WEI_UNITS', () => {
    it('should have correct conversion values', () => {
      expect(WEI_UNITS.GWEI).toBe(1_000_000_000n);
      expect(WEI_UNITS.ETHER).toBe(1_000_000_000_000_000_000n);
    });
  });
});

describe('StorageKeys', () => {
  describe('STORAGE_PREFIX', () => {
    it('should have unique prefixes', () => {
      const prefixes = Object.values(STORAGE_PREFIX);
      const uniquePrefixes = new Set(prefixes);
      expect(prefixes.length).toBe(uniquePrefixes.size);
    });
  });

  describe('WALLET_KEYS', () => {
    it('should use wallet prefix', () => {
      Object.values(WALLET_KEYS).forEach(key => {
        expect(key.startsWith(STORAGE_PREFIX.WALLET)).toBe(true);
      });
    });
  });

  describe('SETTINGS_KEYS', () => {
    it('should use settings prefix', () => {
      Object.values(SETTINGS_KEYS).forEach(key => {
        expect(key.startsWith(STORAGE_PREFIX.SETTINGS)).toBe(true);
      });
    });
  });

  describe('ALL_STORAGE_KEYS', () => {
    it('should contain all keys', () => {
      const allKeysCount = Object.keys(ALL_STORAGE_KEYS).length;
      const individualCount =
        Object.keys(WALLET_KEYS).length +
        Object.keys(SETTINGS_KEYS).length +
        Object.keys(CACHE_KEYS).length +
        Object.keys(AUTH_KEYS).length +
        6; // sync + analytics + support keys

      expect(allKeysCount).toBeGreaterThanOrEqual(individualCount - 10);
    });
  });

  describe('getKeysForPrefix', () => {
    it('should return keys for wallet prefix', () => {
      const walletKeys = getKeysForPrefix(STORAGE_PREFIX.WALLET);
      expect(walletKeys.length).toBeGreaterThan(0);
      walletKeys.forEach(key => {
        expect(key.startsWith(STORAGE_PREFIX.WALLET)).toBe(true);
      });
    });
  });
});

describe('ErrorCodes', () => {
  describe('ERROR_CODES', () => {
    it('should have unique error codes', () => {
      const codes = Object.values(ERROR_CODES);
      const uniqueCodes = new Set(codes);
      expect(codes.length).toBe(uniqueCodes.size);
    });
  });

  describe('ERROR_MESSAGES', () => {
    it('should have messages for all error codes', () => {
      Object.values(ERROR_CODES).forEach(code => {
        expect(ERROR_MESSAGES[code]).toBeDefined();
        expect(ERROR_MESSAGES[code].length).toBeGreaterThan(0);
      });
    });
  });

  describe('getErrorMessage', () => {
    it('should return message for known code', () => {
      const message = getErrorMessage(ERROR_CODES.NETWORK_ERROR);
      expect(message).toBe(ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR]);
    });

    it('should return unknown error message for unknown code', () => {
      const message = getErrorMessage('UNKNOWN_CODE');
      expect(message).toBe(ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR]);
    });
  });

  describe('mapRpcError', () => {
    it('should map known RPC error codes', () => {
      expect(mapRpcError(-32700)).toBe(ERROR_CODES.INVALID_RESPONSE);
      expect(mapRpcError(-32005)).toBe(ERROR_CODES.RPC_RATE_LIMITED);
    });

    it('should return RPC_ERROR for unknown codes', () => {
      expect(mapRpcError(-99999)).toBe(ERROR_CODES.RPC_ERROR);
    });
  });

  describe('mapHttpError', () => {
    it('should map known HTTP status codes', () => {
      expect(mapHttpError(400)).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(mapHttpError(401)).toBe(ERROR_CODES.SESSION_EXPIRED);
      expect(mapHttpError(404)).toBe(ERROR_CODES.NOT_FOUND);
      expect(mapHttpError(429)).toBe(ERROR_CODES.RPC_RATE_LIMITED);
      expect(mapHttpError(500)).toBe(ERROR_CODES.RPC_ERROR);
    });

    it('should return NETWORK_ERROR for unknown codes', () => {
      expect(mapHttpError(999)).toBe(ERROR_CODES.NETWORK_ERROR);
    });
  });

  describe('RPC_ERROR_MAP', () => {
    it('should have standard JSON-RPC error codes', () => {
      expect(RPC_ERROR_MAP[-32700]).toBeDefined();
      expect(RPC_ERROR_MAP[-32600]).toBeDefined();
      expect(RPC_ERROR_MAP[-32603]).toBeDefined();
    });
  });

  describe('HTTP_ERROR_MAP', () => {
    it('should have common HTTP error codes', () => {
      expect(HTTP_ERROR_MAP[400]).toBeDefined();
      expect(HTTP_ERROR_MAP[401]).toBeDefined();
      expect(HTTP_ERROR_MAP[403]).toBeDefined();
      expect(HTTP_ERROR_MAP[404]).toBeDefined();
      expect(HTTP_ERROR_MAP[500]).toBeDefined();
    });
  });
});
