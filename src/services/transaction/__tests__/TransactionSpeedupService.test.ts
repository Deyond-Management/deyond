/**
 * TransactionSpeedupService Tests
 */

import TransactionSpeedupService, {
  getTransactionSpeedupService,
} from '../TransactionSpeedupService';
import {
  TxManagementError,
  TxErrorType,
  TxStatus,
  MIN_GAS_PRICE_BUMP,
  RECOMMENDED_GAS_PRICE_BUMP,
} from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('TransactionSpeedupService', () => {
  let service: TransactionSpeedupService;
  const mockGetItem = AsyncStorage.getItem as jest.Mock;
  const mockSetItem = AsyncStorage.setItem as jest.Mock;
  const mockRemoveItem = AsyncStorage.removeItem as jest.Mock;

  const mockPendingTx = {
    hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    from: '0x1111111111111111111111111111111111111111',
    to: '0x2222222222222222222222222222222222222222',
    value: BigInt('1000000000000000000'),
    nonce: 5,
    gasPrice: null,
    maxFeePerGas: BigInt('50000000000'), // 50 gwei
    maxPriorityFeePerGas: BigInt('2000000000'), // 2 gwei
    gasLimit: BigInt('21000'),
    data: '0x',
    chainId: BigInt(1),
    type: 2,
    blockNumber: null, // Still pending
  };

  const mockProvider = {
    getTransaction: jest.fn(),
    getTransactionReceipt: jest.fn(),
    getFeeData: jest.fn().mockResolvedValue({
      maxFeePerGas: BigInt('40000000000'),
      maxPriorityFeePerGas: BigInt('1500000000'),
      gasPrice: BigInt('35000000000'),
    }),
  };

  const mockSigner = {
    sendTransaction: jest.fn().mockResolvedValue({
      hash: '0xnewtxhash12345678901234567890123456789012345678901234567890abcd',
    }),
  };

  beforeEach(() => {
    service = new TransactionSpeedupService();
    service.initialize(mockProvider as any, mockSigner as any);
    mockGetItem.mockClear();
    mockSetItem.mockClear();
    mockRemoveItem.mockClear();
    mockProvider.getTransaction.mockClear();
    mockProvider.getTransactionReceipt.mockClear();
    mockSigner.sendTransaction.mockClear();
  });

  afterEach(() => {
    service.stopMonitoring();
  });

  describe('Singleton', () => {
    it('should return singleton instance', () => {
      const instance1 = getTransactionSpeedupService();
      const instance2 = getTransactionSpeedupService();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getPendingTransaction', () => {
    it('should return pending transaction', async () => {
      mockProvider.getTransaction.mockResolvedValueOnce(mockPendingTx);

      const tx = await service.getPendingTransaction(mockPendingTx.hash);

      expect(tx).not.toBeNull();
      expect(tx?.hash).toBe(mockPendingTx.hash);
      expect(tx?.nonce).toBe(mockPendingTx.nonce);
      expect(tx?.type).toBe(2);
    });

    it('should return null for non-existent transaction', async () => {
      mockProvider.getTransaction.mockResolvedValueOnce(null);

      const tx = await service.getPendingTransaction('0xnotfound');
      expect(tx).toBeNull();
    });

    it('should throw error for confirmed transaction', async () => {
      mockProvider.getTransaction.mockResolvedValueOnce({
        ...mockPendingTx,
        blockNumber: 12345678, // Already confirmed
      });

      await expect(service.getPendingTransaction(mockPendingTx.hash)).rejects.toMatchObject({
        type: TxErrorType.ALREADY_CONFIRMED,
      });
    });

    it('should throw error without provider', async () => {
      const newService = new TransactionSpeedupService();

      await expect(newService.getPendingTransaction('0x1234')).rejects.toMatchObject({
        type: TxErrorType.NETWORK_ERROR,
      });
    });
  });

  describe('getReplacementRequirements', () => {
    it('should calculate correct replacement requirements for EIP-1559 tx', async () => {
      const pendingTx = {
        hash: '0x1234',
        from: '0xfrom',
        to: '0xto',
        value: '0',
        nonce: 1,
        maxFeePerGas: '50000000000', // 50 gwei
        maxPriorityFeePerGas: '2000000000', // 2 gwei
        gasLimit: '21000',
        chainId: 1,
        timestamp: Date.now(),
        type: 2 as const,
      };

      const requirements = await service.getReplacementRequirements(pendingTx);

      // Min is 10% bump
      const expectedMinMaxFee = (BigInt(50000000000) * BigInt(110)) / BigInt(100);
      const expectedMinPriorityFee = (BigInt(2000000000) * BigInt(110)) / BigInt(100);

      // Recommended is 15% bump
      const expectedRecMaxFee = (BigInt(50000000000) * BigInt(115)) / BigInt(100);
      const expectedRecPriorityFee = (BigInt(2000000000) * BigInt(115)) / BigInt(100);

      expect(requirements.minMaxFeePerGas).toBe(expectedMinMaxFee.toString());
      expect(requirements.minMaxPriorityFeePerGas).toBe(expectedMinPriorityFee.toString());
      expect(requirements.recommendedMaxFeePerGas).toBe(expectedRecMaxFee.toString());
      expect(requirements.recommendedMaxPriorityFeePerGas).toBe(expectedRecPriorityFee.toString());
      expect(requirements.percentageIncrease).toBe(RECOMMENDED_GAS_PRICE_BUMP);
    });

    it('should handle legacy transaction', async () => {
      const legacyTx = {
        hash: '0x1234',
        from: '0xfrom',
        to: '0xto',
        value: '0',
        nonce: 1,
        gasPrice: '40000000000', // 40 gwei
        gasLimit: '21000',
        chainId: 1,
        timestamp: Date.now(),
        type: 0 as const,
      };

      const requirements = await service.getReplacementRequirements(legacyTx);

      const expectedMinGas = (BigInt(40000000000) * BigInt(110)) / BigInt(100);
      expect(requirements.minMaxFeePerGas).toBe(expectedMinGas.toString());
    });
  });

  describe('speedupTransaction', () => {
    beforeEach(() => {
      mockProvider.getTransaction.mockResolvedValue(mockPendingTx);
      mockSetItem.mockResolvedValue(undefined);
    });

    it('should speed up pending transaction', async () => {
      const result = await service.speedupTransaction(mockPendingTx.hash);

      expect(result.success).toBe(true);
      expect(result.originalHash).toBe(mockPendingTx.hash);
      expect(result.newHash).toBeDefined();
      expect(mockSigner.sendTransaction).toHaveBeenCalled();

      // Verify gas price was bumped
      const sentTx = mockSigner.sendTransaction.mock.calls[0][0];
      expect(sentTx.maxFeePerGas).toBeGreaterThan(mockPendingTx.maxFeePerGas);
    });

    it('should use custom gas price multiplier', async () => {
      await service.speedupTransaction(mockPendingTx.hash, {
        gasPriceMultiplier: 1.5, // 50% increase
      });

      const sentTx = mockSigner.sendTransaction.mock.calls[0][0];
      const expectedMinFee = (mockPendingTx.maxFeePerGas * BigInt(150)) / BigInt(100);

      // Should be at least 50% more
      expect(sentTx.maxFeePerGas >= expectedMinFee).toBe(true);
    });

    it('should use fixed gas prices when provided', async () => {
      const fixedMaxFee = '100000000000'; // 100 gwei
      const fixedPriorityFee = '5000000000'; // 5 gwei

      await service.speedupTransaction(mockPendingTx.hash, {
        fixedMaxFeePerGas: fixedMaxFee,
        fixedMaxPriorityFeePerGas: fixedPriorityFee,
      });

      const sentTx = mockSigner.sendTransaction.mock.calls[0][0];
      expect(sentTx.maxFeePerGas).toBe(BigInt(fixedMaxFee));
      expect(sentTx.maxPriorityFeePerGas).toBe(BigInt(fixedPriorityFee));
    });

    it('should return error for not found transaction', async () => {
      mockProvider.getTransaction.mockResolvedValueOnce(null);

      await expect(service.speedupTransaction('0xnotfound')).rejects.toMatchObject({
        type: TxErrorType.TRANSACTION_NOT_FOUND,
      });
    });

    it('should handle underpriced error', async () => {
      mockSigner.sendTransaction.mockRejectedValueOnce(
        new Error('replacement transaction underpriced')
      );

      const result = await service.speedupTransaction(mockPendingTx.hash);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Gas price too low');
    });
  });

  describe('cancelTransaction', () => {
    beforeEach(() => {
      mockProvider.getTransaction.mockResolvedValue(mockPendingTx);
      mockSetItem.mockResolvedValue(undefined);
    });

    it('should cancel pending transaction', async () => {
      const result = await service.cancelTransaction(mockPendingTx.hash);

      expect(result.success).toBe(true);
      expect(result.originalHash).toBe(mockPendingTx.hash);
      expect(result.newHash).toBeDefined();

      // Verify cancel tx params
      const sentTx = mockSigner.sendTransaction.mock.calls[0][0];
      expect(sentTx.to).toBe(mockPendingTx.from); // Sent to self
      expect(sentTx.value).toBe(BigInt(0)); // Zero value
      expect(sentTx.nonce).toBe(mockPendingTx.nonce); // Same nonce
      expect(sentTx.gasLimit).toBe(BigInt(21000)); // Minimum gas
    });

    it('should handle insufficient funds error', async () => {
      mockSigner.sendTransaction.mockRejectedValueOnce(new Error('insufficient funds'));

      const result = await service.cancelTransaction(mockPendingTx.hash);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient funds');
    });
  });

  describe('estimateReplacementGas', () => {
    it('should estimate gas for speedup', async () => {
      mockProvider.getTransaction.mockResolvedValueOnce(mockPendingTx);

      const estimate = await service.estimateReplacementGas(mockPendingTx.hash, false);

      expect(estimate.maxFeePerGas).toBeDefined();
      expect(estimate.maxPriorityFeePerGas).toBeDefined();
      expect(estimate.gasLimit).toBe(mockPendingTx.gasLimit.toString());
      expect(BigInt(estimate.estimatedCost)).toBeGreaterThan(BigInt(0));
    });

    it('should estimate gas for cancel with minimum gas', async () => {
      mockProvider.getTransaction.mockResolvedValueOnce(mockPendingTx);

      const estimate = await service.estimateReplacementGas(
        mockPendingTx.hash,
        true // isCancel
      );

      expect(estimate.gasLimit).toBe('21000');
    });
  });

  describe('Transaction Monitoring', () => {
    it('should add transaction to monitoring', () => {
      mockSetItem.mockResolvedValue(undefined);

      service.addMonitoredTx('0xhash', 5, '0xfrom', 1);

      const monitored = service.getMonitoredTxs();
      expect(monitored).toHaveLength(1);
      expect(monitored[0].hash).toBe('0xhash');
      expect(monitored[0].status).toBe(TxStatus.PENDING);
    });

    it('should get pending transactions only', () => {
      mockSetItem.mockResolvedValue(undefined);

      service.addMonitoredTx('0xpending', 1, '0xfrom', 1);

      const pending = service.getPendingTxs();
      expect(pending).toHaveLength(1);
    });

    it('should emit events on transaction updates', done => {
      mockSetItem.mockResolvedValue(undefined);

      service.on('txAdded', tx => {
        expect(tx.hash).toBe('0xnew');
        done();
      });

      service.addMonitoredTx('0xnew', 1, '0xfrom', 1);
    });

    it('should clear monitored transactions', async () => {
      mockSetItem.mockResolvedValue(undefined);
      mockRemoveItem.mockResolvedValue(undefined);

      service.addMonitoredTx('0xhash', 1, '0xfrom', 1);
      expect(service.getMonitoredTxs()).toHaveLength(1);

      await service.clearMonitoredTxs();
      expect(service.getMonitoredTxs()).toHaveLength(0);
      expect(mockRemoveItem).toHaveBeenCalled();
    });

    it('should load transactions from storage', async () => {
      const storedTxs = [
        {
          hash: '0xstored',
          nonce: 1,
          from: '0xfrom',
          chainId: 1,
          status: TxStatus.PENDING,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          confirmations: 0,
        },
      ];

      mockGetItem.mockResolvedValue(JSON.stringify(storedTxs));

      await service.loadMonitoredTxs();

      const loaded = service.getMonitoredTxs();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].hash).toBe('0xstored');
    });
  });

  describe('Constants', () => {
    it('should have correct gas price bump values', () => {
      expect(MIN_GAS_PRICE_BUMP).toBe(10);
      expect(RECOMMENDED_GAS_PRICE_BUMP).toBe(15);
    });
  });

  describe('No Signer Error', () => {
    it('should return error when no signer available', async () => {
      const serviceWithoutSigner = new TransactionSpeedupService();
      serviceWithoutSigner.initialize(mockProvider as any);
      mockProvider.getTransaction.mockResolvedValueOnce(mockPendingTx);

      const result = await serviceWithoutSigner.speedupTransaction(mockPendingTx.hash);

      expect(result.success).toBe(false);
      expect(result.error).toContain('signer');
    });
  });
});
