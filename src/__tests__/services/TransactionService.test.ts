/**
 * TransactionService Tests
 * TDD: Write tests first, then implement
 */

import {
  TransactionService,
  TransactionError,
  TransactionParams,
  SignedTransaction,
  TransactionReceipt,
} from '../../services/TransactionService';

describe('TransactionService', () => {
  let transactionService: TransactionService;

  beforeEach(() => {
    transactionService = new TransactionService();
  });

  describe('Build Transaction', () => {
    it('should build transaction with required fields', async () => {
      const params: TransactionParams = {
        to: '0x1234567890123456789012345678901234567890',
        value: '1000000000000000000', // 1 ETH in wei
        gasLimit: '21000',
        maxFeePerGas: '50000000000', // 50 gwei in wei
        maxPriorityFeePerGas: '2000000000', // 2 gwei in wei
      };

      const tx = await transactionService.buildTransaction(params);

      expect(tx).toBeDefined();
      expect(tx.to).toBe(params.to);
      expect(tx.value).toBe(params.value);
    });

    it('should add nonce to transaction', async () => {
      const params: TransactionParams = {
        to: '0x1234567890123456789012345678901234567890',
        value: '1000000000000000000',
        gasLimit: '21000',
        maxFeePerGas: '50000000000',
        maxPriorityFeePerGas: '2000000000',
      };

      const tx = await transactionService.buildTransaction(params);

      expect(tx.nonce).toBeDefined();
      expect(typeof tx.nonce).toBe('number');
    });

    it('should add chainId to transaction', async () => {
      const params: TransactionParams = {
        to: '0x1234567890123456789012345678901234567890',
        value: '1000000000000000000',
        gasLimit: '21000',
        maxFeePerGas: '50000000000',
        maxPriorityFeePerGas: '2000000000',
      };

      const tx = await transactionService.buildTransaction(params);

      expect(tx.chainId).toBeDefined();
      expect(tx.chainId).toBe(1); // Mainnet
    });

    it('should throw error for invalid address', async () => {
      const params: TransactionParams = {
        to: 'invalid',
        value: '1000000000000000000',
        gasLimit: '21000',
        maxFeePerGas: '50000000000',
        maxPriorityFeePerGas: '2000000000',
      };

      await expect(transactionService.buildTransaction(params)).rejects.toThrow(TransactionError);
    });
  });

  describe('Sign Transaction', () => {
    it('should sign transaction and return signed data', async () => {
      const tx = {
        to: '0x1234567890123456789012345678901234567890',
        value: '1000000000000000000',
        gasLimit: '21000',
        maxFeePerGas: '50000000000',
        maxPriorityFeePerGas: '2000000000',
        nonce: 0,
        chainId: 1,
      };

      const signed = await transactionService.signTransaction(tx, 'mockPrivateKey');

      expect(signed).toBeDefined();
      expect(signed.rawTransaction).toBeDefined();
      expect(signed.transactionHash).toBeDefined();
    });

    it('should generate valid transaction hash', async () => {
      const tx = {
        to: '0x1234567890123456789012345678901234567890',
        value: '1000000000000000000',
        gasLimit: '21000',
        maxFeePerGas: '50000000000',
        maxPriorityFeePerGas: '2000000000',
        nonce: 0,
        chainId: 1,
      };

      const signed = await transactionService.signTransaction(tx, 'mockPrivateKey');

      expect(signed.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });
  });

  describe('Broadcast Transaction', () => {
    it('should broadcast signed transaction', async () => {
      const signedTx: SignedTransaction = {
        rawTransaction: '0xf86c...',
        transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
      };

      const result = await transactionService.broadcastTransaction(signedTx);

      expect(result).toBeDefined();
      expect(result.hash).toBe(signedTx.transactionHash);
    });

    it('should return pending status after broadcast', async () => {
      const signedTx: SignedTransaction = {
        rawTransaction: '0xf86c...',
        transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
      };

      const result = await transactionService.broadcastTransaction(signedTx);

      expect(result.status).toBe('pending');
    });
  });

  describe('Get Transaction Receipt', () => {
    it('should get transaction receipt', async () => {
      const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab';

      const receipt = await transactionService.getTransactionReceipt(txHash);

      expect(receipt).toBeDefined();
    });

    it('should return null for pending transaction', async () => {
      const txHash = '0x0000000000000000000000000000000000000000000000000000000000000001';

      const receipt = await transactionService.getTransactionReceipt(txHash);

      expect(receipt).toBeNull();
    });

    it('should include status in receipt', async () => {
      const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab';

      const receipt = await transactionService.getTransactionReceipt(txHash);

      if (receipt) {
        expect(receipt.status).toBeDefined();
        expect(['success', 'failed']).toContain(receipt.status);
      }
    });

    it('should include gas used in receipt', async () => {
      const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab';

      const receipt = await transactionService.getTransactionReceipt(txHash);

      if (receipt) {
        expect(receipt.gasUsed).toBeDefined();
      }
    });
  });

  describe('Wait for Transaction', () => {
    it('should wait for transaction confirmation', async () => {
      const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab';

      const receipt = await transactionService.waitForTransaction(txHash, 1);

      expect(receipt).toBeDefined();
      expect(receipt.status).toBe('success');
    });

    it('should timeout if transaction not confirmed', async () => {
      const txHash = '0x0000000000000000000000000000000000000000000000000000000000000001';

      await expect(transactionService.waitForTransaction(txHash, 1, 100)).rejects.toThrow(
        'Transaction confirmation timeout'
      );
    });
  });

  describe('Validation', () => {
    it('should validate sufficient balance', () => {
      const isValid = transactionService.validateBalance(
        '1000000000000000000', // 1 ETH
        '500000000000000000', // 0.5 ETH
        '1050000000000000' // 0.00105 ETH gas
      );

      expect(isValid).toBe(true);
    });

    it('should reject insufficient balance', () => {
      const isValid = transactionService.validateBalance(
        '500000000000000000', // 0.5 ETH
        '1000000000000000000', // 1 ETH
        '1050000000000000' // gas
      );

      expect(isValid).toBe(false);
    });

    it('should validate gas limit', () => {
      expect(() => transactionService.validateGasLimit('21000')).not.toThrow();
      expect(() => transactionService.validateGasLimit('20999')).toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle nonce too low error', async () => {
      // This would be thrown by the RPC when nonce is already used
      const error = transactionService.parseRpcError({
        code: -32000,
        message: 'nonce too low',
      });

      expect(error.type).toBe('NONCE_TOO_LOW');
    });

    it('should handle insufficient funds error', async () => {
      const error = transactionService.parseRpcError({
        code: -32000,
        message: 'insufficient funds for gas * price + value',
      });

      expect(error.type).toBe('INSUFFICIENT_FUNDS');
    });

    it('should handle replacement underpriced error', async () => {
      const error = transactionService.parseRpcError({
        code: -32000,
        message: 'replacement transaction underpriced',
      });

      expect(error.type).toBe('REPLACEMENT_UNDERPRICED');
    });
  });
});
