/**
 * TransactionManager Tests
 */

import { TransactionManager } from '../../core/transaction/TransactionManager';
import { Network } from '../../types/wallet';

// Mock ethers
jest.mock('ethers', () => {
  const actual = jest.requireActual('ethers');
  return {
    ...actual,
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      getBalance: jest.fn().mockResolvedValue(BigInt('1000000000000000000')), // 1 ETH
      getFeeData: jest.fn().mockResolvedValue({
        gasPrice: BigInt('20000000000'), // 20 gwei
        maxFeePerGas: BigInt('30000000000'),
        maxPriorityFeePerGas: BigInt('2000000000'),
      }),
      estimateGas: jest.fn().mockResolvedValue(BigInt('21000')),
      getTransactionCount: jest.fn().mockResolvedValue(0),
      getTransaction: jest.fn().mockResolvedValue({
        hash: '0x123',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x9876543210987654321098765432109876543210',
        value: BigInt('1000000000000000000'),
        nonce: 0,
        gasLimit: BigInt('21000'),
        gasPrice: BigInt('20000000000'),
      }),
      getTransactionReceipt: jest.fn().mockResolvedValue({
        hash: '0x123',
        status: 1,
        blockNumber: 123456,
        gasUsed: BigInt('21000'),
      }),
      getBlock: jest.fn().mockResolvedValue({
        timestamp: Math.floor(Date.now() / 1000),
      }),
      sendTransaction: jest.fn().mockResolvedValue({
        hash: '0x123',
        wait: jest.fn().mockResolvedValue({
          status: 1,
          blockNumber: 123456,
          gasUsed: BigInt('21000'),
        }),
      }),
    })),
  };
});

describe('TransactionManager', () => {
  const mockNetwork: Network = {
    id: 'ethereum-mainnet',
    name: 'Ethereum',
    chainId: 1,
    rpcUrl: 'https://eth.llamarpc.com',
    currencySymbol: 'ETH',
    blockExplorerUrl: 'https://etherscan.io',
    isTestnet: false,
  };

  let transactionManager: TransactionManager;

  beforeEach(() => {
    jest.clearAllMocks();
    transactionManager = new TransactionManager(mockNetwork);
  });

  describe('constructor', () => {
    it('should create TransactionManager instance', () => {
      expect(transactionManager).toBeInstanceOf(TransactionManager);
    });
  });

  describe('updateNetwork', () => {
    it('should update network provider', () => {
      const newNetwork: Network = {
        ...mockNetwork,
        id: 'polygon-mainnet',
        name: 'Polygon',
        chainId: 137,
      };

      expect(() => transactionManager.updateNetwork(newNetwork)).not.toThrow();
    });
  });

  describe('getBalance', () => {
    it('should get account balance', async () => {
      const address = '0x1234567890123456789012345678901234567890';
      const balance = await transactionManager.getBalance(address);

      expect(balance).toBeDefined();
      expect(typeof balance).toBe('string');
    });

    it('should throw error on failure', async () => {
      const mockProvider = (transactionManager as any).provider;
      mockProvider.getBalance.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        transactionManager.getBalance('0x1234567890123456789012345678901234567890')
      ).rejects.toThrow('Failed to get balance');
    });
  });

  describe('getGasPrice', () => {
    it('should get current gas price', async () => {
      const gasPrice = await transactionManager.getGasPrice();

      expect(gasPrice).toBeDefined();
      expect(typeof gasPrice).toBe('bigint');
    });

    it('should return 0 if gasPrice is not available', async () => {
      const mockProvider = (transactionManager as any).provider;
      mockProvider.getFeeData.mockResolvedValueOnce({ gasPrice: null });

      const gasPrice = await transactionManager.getGasPrice();
      expect(gasPrice).toBe(BigInt(0));
    });

    it('should throw error on failure', async () => {
      const mockProvider = (transactionManager as any).provider;
      mockProvider.getFeeData.mockRejectedValueOnce(new Error('Network error'));

      await expect(transactionManager.getGasPrice()).rejects.toThrow('Failed to get gas price');
    });
  });

  describe('estimateGas', () => {
    it('should estimate gas for transaction', async () => {
      const transaction = {
        from: '0x1234567890123456789012345678901234567890',
        to: '0x9876543210987654321098765432109876543210',
        value: BigInt('1000000000000000000'),
      };

      const gasEstimate = await transactionManager.estimateGas(transaction);

      expect(gasEstimate).toBeDefined();
      expect(typeof gasEstimate).toBe('bigint');
    });

    it('should throw error on failure', async () => {
      const mockProvider = (transactionManager as any).provider;
      mockProvider.estimateGas.mockRejectedValueOnce(new Error('Estimation failed'));

      await expect(transactionManager.estimateGas({})).rejects.toThrow('Failed to estimate gas');
    });
  });

  describe('getTransactionCount', () => {
    it('should get transaction count (nonce)', async () => {
      const address = '0x1234567890123456789012345678901234567890';
      const nonce = await transactionManager.getTransactionCount(address);

      expect(nonce).toBeDefined();
      expect(typeof nonce).toBe('number');
    });

    it('should throw error on failure', async () => {
      const mockProvider = (transactionManager as any).provider;
      mockProvider.getTransactionCount.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        transactionManager.getTransactionCount('0x1234567890123456789012345678901234567890')
      ).rejects.toThrow('Failed to get transaction count');
    });
  });

  describe('createTransaction', () => {
    it('should create transaction object', async () => {
      const from = '0x1234567890123456789012345678901234567890';
      const to = '0x9876543210987654321098765432109876543210';
      const value = '1.0';

      const transaction = await transactionManager.createTransaction(from, to, value);

      expect(transaction).toBeDefined();
      expect(transaction.from).toBe(from);
      expect(transaction.to).toBe(to);
      expect(transaction.nonce).toBeDefined();
    });

    it('should create transaction with gas limit', async () => {
      const from = '0x1234567890123456789012345678901234567890';
      const to = '0x9876543210987654321098765432109876543210';
      const value = '1.0';
      const gasLimit = '50000';

      const transaction = await transactionManager.createTransaction(
        from,
        to,
        value,
        undefined,
        gasLimit
      );

      expect(transaction).toBeDefined();
      expect(transaction.gasLimit).toBeDefined();
    });

    it('should create transaction with data', async () => {
      const from = '0x1234567890123456789012345678901234567890';
      const to = '0x9876543210987654321098765432109876543210';
      const value = '0';
      const data = '0xa9059cbb';

      const transaction = await transactionManager.createTransaction(from, to, value, data);

      expect(transaction).toBeDefined();
      expect(transaction.data).toBe(data);
    });
  });
});
