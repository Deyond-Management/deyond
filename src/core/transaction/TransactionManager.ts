/**
 * Transaction Manager
 * Handles blockchain transactions: create, sign, send, track
 */

import { ethers, Wallet, JsonRpcProvider, TransactionRequest, TransactionResponse } from 'ethers';
import { Transaction, TransactionStatus, Network } from '../../types/wallet';

export class TransactionManager {
  private provider: JsonRpcProvider;

  constructor(network: Network) {
    this.provider = new JsonRpcProvider(network.rpcUrl);
  }

  /**
   * Update network provider
   */
  updateNetwork(network: Network): void {
    this.provider = new JsonRpcProvider(network.rpcUrl);
  }

  /**
   * Get account balance
   */
  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      throw new Error(
        `Failed to get balance: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<bigint> {
    try {
      const feeData = await this.provider.getFeeData();
      return feeData.gasPrice || BigInt(0);
    } catch (error) {
      throw new Error(
        `Failed to get gas price: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(transaction: TransactionRequest): Promise<bigint> {
    try {
      return await this.provider.estimateGas(transaction);
    } catch (error) {
      throw new Error(
        `Failed to estimate gas: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get transaction count (nonce)
   */
  async getTransactionCount(address: string): Promise<number> {
    try {
      return await this.provider.getTransactionCount(address);
    } catch (error) {
      throw new Error(
        `Failed to get transaction count: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create transaction object
   */
  async createTransaction(
    from: string,
    to: string,
    value: string,
    data?: string,
    gasLimit?: string
  ): Promise<TransactionRequest> {
    try {
      const nonce = await this.getTransactionCount(from);
      const feeData = await this.provider.getFeeData();

      const transaction: TransactionRequest = {
        from,
        to,
        value: ethers.parseEther(value),
        nonce,
        data: data || '0x',
      };

      // Add gas limit if provided, otherwise estimate
      if (gasLimit) {
        transaction.gasLimit = BigInt(gasLimit);
      } else {
        transaction.gasLimit = await this.estimateGas(transaction);
      }

      // Use EIP-1559 if available
      if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        transaction.maxFeePerGas = feeData.maxFeePerGas;
        transaction.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
      } else {
        transaction.gasPrice = feeData.gasPrice || undefined;
      }

      return transaction;
    } catch (error) {
      throw new Error(
        `Failed to create transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Sign and send transaction
   */
  async sendTransaction(
    privateKey: string,
    transaction: TransactionRequest
  ): Promise<TransactionResponse> {
    try {
      const wallet = new Wallet(privateKey, this.provider);
      return await wallet.sendTransaction(transaction);
    } catch (error) {
      throw new Error(
        `Failed to send transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(txHash: string, confirmations: number = 1): Promise<Transaction> {
    try {
      const receipt = await this.provider.waitForTransaction(txHash, confirmations);

      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }

      // Get transaction details for properties not in receipt
      const tx = await this.provider.getTransaction(txHash);

      if (!tx) {
        throw new Error('Transaction not found');
      }

      return {
        id: txHash,
        hash: txHash,
        from: receipt.from,
        to: receipt.to || '',
        value: tx.value ? ethers.formatEther(tx.value) : '0',
        gasLimit: tx.gasLimit.toString(),
        gasPrice: tx.gasPrice ? tx.gasPrice.toString() : undefined,
        nonce: tx.nonce,
        chainId: Number(tx.chainId),
        status: receipt.status === 1 ? TransactionStatus.CONFIRMED : TransactionStatus.FAILED,
        timestamp: Date.now(),
        confirmations: await receipt.confirmations(),
      };
    } catch (error) {
      throw new Error(
        `Failed to wait for transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(txHash: string): Promise<Transaction | null> {
    try {
      const tx = await this.provider.getTransaction(txHash);
      if (!tx) {
        return null;
      }

      const receipt = await this.provider.getTransactionReceipt(txHash);

      return {
        id: txHash,
        hash: txHash,
        from: tx.from,
        to: tx.to || '',
        value: ethers.formatEther(tx.value),
        data: tx.data,
        gasLimit: tx.gasLimit.toString(),
        gasPrice: tx.gasPrice ? tx.gasPrice.toString() : undefined,
        maxFeePerGas: tx.maxFeePerGas ? tx.maxFeePerGas.toString() : undefined,
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas
          ? tx.maxPriorityFeePerGas.toString()
          : undefined,
        nonce: tx.nonce,
        chainId: Number(tx.chainId),
        status: receipt
          ? receipt.status === 1
            ? TransactionStatus.CONFIRMED
            : TransactionStatus.FAILED
          : TransactionStatus.PENDING,
        timestamp: Date.now(),
        confirmations: receipt ? await receipt.confirmations() : 0,
      };
    } catch (error) {
      throw new Error(
        `Failed to get transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get transaction history for address
   */
  async getTransactionHistory(
    address: string,
    startBlock: number = 0,
    endBlock: number = 99999999
  ): Promise<Transaction[]> {
    try {
      // Note: This is a basic implementation
      // In production, you would use an indexer service like Etherscan API or The Graph
      const currentBlock = await this.provider.getBlockNumber();
      const transactions: Transaction[] = [];

      // This is just a placeholder - actual implementation would query an indexer
      // For now, return empty array
      return transactions;
    } catch (error) {
      throw new Error(
        `Failed to get transaction history: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Cancel pending transaction by replacing with higher gas price
   */
  async cancelTransaction(
    privateKey: string,
    nonce: number,
    gasPrice: bigint
  ): Promise<TransactionResponse> {
    try {
      const wallet = new Wallet(privateKey, this.provider);
      const address = wallet.address;

      // Create transaction to self with same nonce but higher gas price
      const cancelTx: TransactionRequest = {
        from: address,
        to: address,
        value: 0,
        nonce,
        gasPrice: (gasPrice * BigInt(120)) / BigInt(100), // 20% higher
        gasLimit: 21000, // Standard transfer gas limit
      };

      return await wallet.sendTransaction(cancelTx);
    } catch (error) {
      throw new Error(
        `Failed to cancel transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Speed up pending transaction by replacing with higher gas price
   */
  async speedUpTransaction(
    privateKey: string,
    transaction: TransactionRequest,
    gasPrice: bigint
  ): Promise<TransactionResponse> {
    try {
      const wallet = new Wallet(privateKey, this.provider);

      // Create new transaction with same nonce but higher gas price
      const speedUpTx: TransactionRequest = {
        ...transaction,
        gasPrice: (gasPrice * BigInt(120)) / BigInt(100), // 20% higher
      };

      return await wallet.sendTransaction(speedUpTx);
    } catch (error) {
      throw new Error(
        `Failed to speed up transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
