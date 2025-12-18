/**
 * SolanaAdapter Tests
 */

import { SolanaAdapter } from '../SolanaAdapter';
import { CHAIN_METADATA } from '../ChainConfig';

// Mock fetch for testing
global.fetch = jest.fn();

describe('SolanaAdapter', () => {
  let adapter: SolanaAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new SolanaAdapter({ demoMode: true });
  });

  describe('constructor', () => {
    it('should create adapter with default config', () => {
      const newAdapter = new SolanaAdapter();
      expect(newAdapter).toBeDefined();
    });

    it('should create adapter with custom RPC URL', () => {
      const newAdapter = new SolanaAdapter({
        rpcUrl: 'https://custom-rpc.solana.com',
      });
      expect(newAdapter).toBeDefined();
    });

    it('should create adapter with demo mode', () => {
      const newAdapter = new SolanaAdapter({ demoMode: true });
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
    it('should validate valid Solana address', () => {
      // Valid base58 address (44 characters)
      const validAddress = '11111111111111111111111111111111';
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
      expect(path.coinType).toBe(501);
      expect(path.path).toContain("501'");
    });

    it('should support custom account index', () => {
      const path = adapter.getDefaultDerivationPath(1);
      expect(path.account).toBe(1);
    });
  });

  describe('capabilities', () => {
    it('should return correct capabilities', () => {
      const capabilities = adapter.getCapabilities();
      expect(capabilities.supportsTokens).toBe(true);
      expect(capabilities.supportsNFTs).toBe(true);
      expect(capabilities.supportsSmartContracts).toBe(true);
      expect(capabilities.supportsEIP1559).toBe(false);
      expect(capabilities.supportsMessageSigning).toBe(true);
    });
  });

  describe('getBalance (demo mode)', () => {
    it('should return demo balance', async () => {
      const balance = await adapter.getBalance('DemoAddress111111111111111111111111111111');
      expect(balance).toBeDefined();
      expect(balance.symbol).toBe('SOL');
      expect(balance.decimals).toBe(9);
      expect(parseFloat(balance.formatted)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getAllBalances (demo mode)', () => {
    it('should return native and token balances', async () => {
      const balances = await adapter.getAllBalances('DemoAddress111111111111111111111111111111');
      expect(balances.native).toBeDefined();
      expect(balances.native.symbol).toBe('SOL');
      expect(Array.isArray(balances.tokens)).toBe(true);
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
    it('should return gas estimate', async () => {
      const estimate = await adapter.estimateGas({
        from: 'Sender111111111111111111111111111111111111',
        to: 'Recipient11111111111111111111111111111111',
        value: '1000000000',
      });
      expect(estimate).toBeDefined();
      expect(estimate.gasLimit).toBeDefined();
      expect(estimate.standard).toBeDefined();
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
    it('should return public key as address', () => {
      const publicKey = 'TestPublicKey123';
      const address = adapter.deriveAddress(publicKey);
      expect(address).toBe(publicKey);
    });
  });

  describe('toChecksumAddress', () => {
    it('should return address unchanged (no checksum for Solana)', () => {
      const address = 'SolanaAddress123';
      expect(adapter.toChecksumAddress(address)).toBe(address);
    });
  });
});

describe('SolanaAdapter (live mode)', () => {
  let adapter: SolanaAdapter;
  // Valid Solana address (32 bytes base58 encoded)
  const validSolanaAddress = '11111111111111111111111111111111';

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new SolanaAdapter({ demoMode: false });
  });

  describe('RPC calls', () => {
    it('should make RPC call for getBalance', async () => {
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            result: {
              value: 1000000000,
            },
          }),
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const balance = await adapter.getBalance(validSolanaAddress);
      expect(global.fetch).toHaveBeenCalled();
      expect(balance.value).toBe('1000000000');
      expect(balance.formatted).toBe('1');
    });

    it('should handle RPC errors', async () => {
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            error: { code: -32600, message: 'Invalid request' },
          }),
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      await expect(adapter.getBalance(validSolanaAddress)).rejects.toThrow('Invalid request');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(adapter.getBalance(validSolanaAddress)).rejects.toThrow();
    });

    it('should reject invalid addresses', async () => {
      await expect(adapter.getBalance('invalid')).rejects.toThrow('Invalid Solana address');
    });
  });
});
