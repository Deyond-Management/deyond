/**
 * EthereumProvider Tests
 * RPC provider for blockchain interactions
 */

import { EthereumProvider } from '../../services/EthereumProvider';

// Mock fetch
global.fetch = jest.fn();

describe('EthereumProvider', () => {
  let provider: EthereumProvider;

  beforeEach(() => {
    provider = new EthereumProvider({
      chainId: 1,
      rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/test-key',
    });
    jest.clearAllMocks();
  });

  describe('RPC calls', () => {
    it('should get current block number', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: '0x10d4f1e', // block number in hex
        }),
      });

      const blockNumber = await provider.getBlockNumber();

      expect(blockNumber).toBe(17649438);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('eth_blockNumber'),
        })
      );
    });

    it('should get balance', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: '0xde0b6b3a7640000', // 1 ETH in wei
        }),
      });

      const balance = await provider.getBalance('0x1234567890123456789012345678901234567890');

      expect(balance).toBe('1000000000000000000');
    });

    it('should get transaction count', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: '0x5',
        }),
      });

      const nonce = await provider.getTransactionCount('0x1234567890123456789012345678901234567890');

      expect(nonce).toBe(5);
    });

    it('should estimate gas', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: '0x5208', // 21000 in hex
        }),
      });

      const gas = await provider.estimateGas({
        to: '0x1234567890123456789012345678901234567890',
        value: '0x0',
      });

      expect(gas).toBe('21000');
    });

    it('should get gas price', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: '0x3b9aca00', // 1 gwei in wei
        }),
      });

      const gasPrice = await provider.getGasPrice();

      expect(gasPrice).toBe('1000000000');
    });

    it('should get fee data (EIP-1559)', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            jsonrpc: '2.0',
            id: 1,
            result: {
              baseFeePerGas: '0x3b9aca00',
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            jsonrpc: '2.0',
            id: 1,
            result: '0x77359400', // 2 gwei
          }),
        });

      const feeData = await provider.getFeeData();

      expect(feeData.baseFeePerGas).toBeDefined();
      expect(feeData.maxPriorityFeePerGas).toBeDefined();
    });
  });

  describe('Transaction', () => {
    it('should send raw transaction', async () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: txHash,
        }),
      });

      const hash = await provider.sendRawTransaction('0xsignedtx');

      expect(hash).toBe(txHash);
    });

    it('should get transaction receipt', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: {
            transactionHash: '0xabc',
            blockNumber: '0x100',
            status: '0x1',
          },
        }),
      });

      const receipt = await provider.getTransactionReceipt('0xabc');

      expect(receipt).toBeDefined();
      expect(receipt?.status).toBe(1);
    });

    it('should return null for pending transaction', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: null,
        }),
      });

      const receipt = await provider.getTransactionReceipt('0xpending');

      expect(receipt).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should throw on RPC error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          error: {
            code: -32000,
            message: 'Insufficient funds',
          },
        }),
      });

      await expect(provider.getBalance('0x123')).rejects.toThrow('Insufficient funds');
    });

    it('should throw on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(provider.getBlockNumber()).rejects.toThrow('Network error');
    });
  });

  describe('Chain ID', () => {
    it('should return chain ID', () => {
      expect(provider.getChainId()).toBe(1);
    });
  });

  describe('Contract calls', () => {
    it('should call contract method', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
        }),
      });

      const result = await provider.call({
        to: '0xTokenAddress',
        data: '0x70a08231000000000000000000000000UserAddress',
      });

      expect(result).toBeDefined();
    });
  });
});
