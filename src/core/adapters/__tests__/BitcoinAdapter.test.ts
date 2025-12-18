/**
 * BitcoinAdapter Tests
 */

import { BitcoinAdapter } from '../BitcoinAdapter';

// Mock fetch for testing
global.fetch = jest.fn();

describe('BitcoinAdapter', () => {
  let adapter: BitcoinAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new BitcoinAdapter({ demoMode: true });
  });

  describe('constructor', () => {
    it('should create adapter with default config', () => {
      const newAdapter = new BitcoinAdapter();
      expect(newAdapter).toBeDefined();
    });

    it('should create adapter with testnet', () => {
      const newAdapter = new BitcoinAdapter({ network: 'testnet' });
      expect(newAdapter).toBeDefined();
    });

    it('should create adapter with demo mode', () => {
      const newAdapter = new BitcoinAdapter({ demoMode: true });
      expect(newAdapter).toBeDefined();
    });
  });

  describe('connection', () => {
    it('should connect successfully', async () => {
      await adapter.connect();
      expect(adapter['connected']).toBe(true);
    });

    it('should disconnect successfully', async () => {
      await adapter.connect();
      await adapter.disconnect();
      expect(adapter['connected']).toBe(false);
    });
  });

  describe('address validation', () => {
    it('should validate legacy P2PKH address (mainnet)', () => {
      const validAddress = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2';
      expect(adapter.isValidAddress(validAddress)).toBe(true);
    });

    it('should validate P2SH address (mainnet)', () => {
      const validAddress = '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy';
      expect(adapter.isValidAddress(validAddress)).toBe(true);
    });

    it('should validate bech32 address (mainnet)', () => {
      const validAddress = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
      expect(adapter.isValidAddress(validAddress)).toBe(true);
    });

    it('should reject invalid addresses', () => {
      expect(adapter.isValidAddress('')).toBe(false);
      expect(adapter.isValidAddress('0x123')).toBe(false);
      expect(adapter.isValidAddress('invalid-address')).toBe(false);
    });
  });

  describe('derivation path', () => {
    it('should return correct default derivation path', () => {
      const path = adapter.getDefaultDerivationPath();
      expect(path.coinType).toBe(0);
      expect(path.path).toContain("0'");
    });

    it('should support custom account index', () => {
      const path = adapter.getDefaultDerivationPath(1);
      expect(path.account).toBe(1);
    });
  });

  describe('capabilities', () => {
    it('should return correct capabilities', () => {
      const capabilities = adapter.getCapabilities();
      expect(capabilities.supportsTokens).toBe(false);
      expect(capabilities.supportsNFTs).toBe(false);
      expect(capabilities.supportsSmartContracts).toBe(false);
      expect(capabilities.supportsEIP1559).toBe(false);
      expect(capabilities.supportsMessageSigning).toBe(true);
    });
  });

  describe('getBalance (demo mode)', () => {
    it('should return demo balance', async () => {
      const balance = await adapter.getBalance('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2');
      expect(balance).toBeDefined();
      expect(balance.symbol).toBe('BTC');
      expect(balance.decimals).toBe(8);
      expect(parseFloat(balance.formatted)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getAllBalances (demo mode)', () => {
    it('should return native balance only', async () => {
      const balances = await adapter.getAllBalances('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2');
      expect(balances.native).toBeDefined();
      expect(balances.native.symbol).toBe('BTC');
      expect(balances.tokens).toEqual([]);
    });
  });

  describe('getBlockNumber (demo mode)', () => {
    it('should return demo block number', async () => {
      const blockNumber = await adapter.getBlockNumber();
      expect(typeof blockNumber).toBe('number');
      expect(blockNumber).toBeGreaterThan(0);
    });
  });

  describe('estimateGas (demo mode)', () => {
    it('should return fee estimate', async () => {
      const estimate = await adapter.estimateGas({
        from: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
        to: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
        value: '100000',
      });
      expect(estimate).toBeDefined();
      expect(estimate.gasLimit).toBeDefined(); // vSize estimate
      expect(estimate.slow).toBeDefined();
      expect(estimate.standard).toBeDefined();
      expect(estimate.fast).toBeDefined();
    });
  });

  describe('getNetworkStatus (demo mode)', () => {
    it('should return network status', async () => {
      const status = await adapter.getNetworkStatus();
      expect(status.isHealthy).toBe(true);
      expect(typeof status.latency).toBe('number');
      expect(typeof status.blockHeight).toBe('number');
    });
  });

  describe('deriveAddress', () => {
    it('should throw error (requires bitcoinjs-lib)', () => {
      const publicKey = 'TestPublicKey123';
      expect(() => adapter.deriveAddress(publicKey)).toThrow('requires bitcoinjs-lib');
    });
  });

  describe('toChecksumAddress', () => {
    it('should return address unchanged (no checksum conversion)', () => {
      const address = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
      expect(adapter.toChecksumAddress(address)).toBe(address);
    });
  });

  describe('token/NFT operations (unsupported)', () => {
    it('should reject token balance request', async () => {
      await expect(adapter.getTokenBalance('addr', 'token')).rejects.toThrow(
        'Bitcoin does not support tokens'
      );
    });

    it('should return empty owned tokens', async () => {
      const tokens = await adapter.getOwnedTokens('addr');
      expect(tokens).toEqual([]);
    });

    it('should return empty owned NFTs', async () => {
      const nfts = await adapter.getOwnedNFTs('addr');
      expect(nfts).toEqual([]);
    });

    it('should reject NFT metadata request', async () => {
      await expect(adapter.getNFTMetadata('contract', 'tokenId')).rejects.toThrow('Ordinals');
    });
  });
});

describe('BitcoinAdapter (live mode)', () => {
  let adapter: BitcoinAdapter;
  const validMainnetAddress = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2';

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new BitcoinAdapter({ demoMode: false });
  });

  describe('API calls', () => {
    it('should fetch balance from Blockstream API', async () => {
      const mockResponse = {
        ok: true,
        headers: {
          get: (name: string) => (name === 'content-type' ? 'application/json' : null),
        },
        json: () =>
          Promise.resolve({
            chain_stats: {
              funded_txo_sum: 200000000,
              spent_txo_sum: 100000000,
            },
            mempool_stats: {
              funded_txo_sum: 0,
              spent_txo_sum: 0,
            },
          }),
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const balance = await adapter.getBalance(validMainnetAddress);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/address/${validMainnetAddress}`),
        expect.any(Object)
      );
      expect(balance.value).toBe('100000000');
      expect(balance.formatted).toBe('1');
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'Not Found',
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      await expect(adapter.getBalance(validMainnetAddress)).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(adapter.getBalance(validMainnetAddress)).rejects.toThrow();
    });

    it('should reject invalid addresses', async () => {
      await expect(adapter.getBalance('invalid')).rejects.toThrow('Invalid Bitcoin address');
    });
  });

  describe('fee estimation', () => {
    it('should fetch fee rates from mempool.space', async () => {
      const mockResponse = {
        ok: true,
        headers: {
          get: (name: string) => (name === 'content-type' ? 'application/json' : null),
        },
        json: () =>
          Promise.resolve({
            fastestFee: 50,
            halfHourFee: 30,
            hourFee: 15,
            economyFee: 5,
          }),
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const estimate = await adapter.estimateGas({
        from: validMainnetAddress,
        to: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
        value: '10000',
      });

      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('mempool.space'));
      expect(estimate.fast).toBeDefined();
      expect(estimate.standard).toBeDefined();
      expect(estimate.slow).toBeDefined();
    });
  });
});

describe('BitcoinAdapter testnet', () => {
  let adapter: BitcoinAdapter;

  beforeEach(() => {
    adapter = new BitcoinAdapter({ network: 'testnet', demoMode: true });
  });

  describe('address validation on testnet', () => {
    it('should validate testnet P2PKH address', () => {
      const testnetAddress = 'mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn';
      expect(adapter.isValidAddress(testnetAddress)).toBe(true);
    });

    it('should validate testnet P2SH address', () => {
      const testnetAddress = '2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc';
      expect(adapter.isValidAddress(testnetAddress)).toBe(true);
    });

    it('should validate testnet bech32 address', () => {
      const testnetAddress = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';
      expect(adapter.isValidAddress(testnetAddress)).toBe(true);
    });
  });

  describe('derivation path on testnet', () => {
    it('should use coin type 1 for testnet', () => {
      const path = adapter.getDefaultDerivationPath();
      expect(path.coinType).toBe(1);
    });
  });
});
