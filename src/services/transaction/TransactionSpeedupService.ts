/**
 * TransactionSpeedupService
 * Service for speeding up and canceling pending transactions
 */

import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PendingTransaction,
  SpeedupOptions,
  CancelOptions,
  TransactionReplaceResult,
  MonitoredTransaction,
  TransactionStatusUpdate,
  GasEstimation,
  ReplacementRequirements,
  TxStatus,
  TxErrorType,
  TxManagementError,
  DEFAULT_GAS_PRICE_MULTIPLIER,
  MIN_GAS_PRICE_BUMP,
  RECOMMENDED_GAS_PRICE_BUMP,
  MAX_PENDING_AGE_MS,
  TX_MONITOR_INTERVAL,
} from './types';
import EventEmitter from 'events';

/**
 * Storage keys
 */
const STORAGE_KEYS = {
  PENDING_TXS: '@pendingTransactions',
  MONITORED_TXS: '@monitoredTransactions',
};

/**
 * Signing callback type
 */
type SigningCallback = (tx: ethers.TransactionRequest) => Promise<string>;

/**
 * Transaction Speedup Service
 */
class TransactionSpeedupService extends EventEmitter {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private signingCallback: SigningCallback | null = null;
  private monitoredTxs: Map<string, MonitoredTransaction> = new Map();
  private monitorInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize with provider and signer
   */
  initialize(
    provider: ethers.Provider,
    signer?: ethers.Signer,
    signingCallback?: SigningCallback
  ): void {
    this.provider = provider;
    this.signer = signer || null;
    this.signingCallback = signingCallback || null;
  }

  /**
   * Get pending transaction details from mempool
   */
  async getPendingTransaction(txHash: string): Promise<PendingTransaction | null> {
    if (!this.provider) {
      throw new TxManagementError(TxErrorType.NETWORK_ERROR, 'Provider not initialized');
    }

    try {
      const tx = await this.provider.getTransaction(txHash);

      if (!tx) {
        return null;
      }

      // Check if already confirmed
      if (tx.blockNumber !== null) {
        throw new TxManagementError(
          TxErrorType.ALREADY_CONFIRMED,
          'Transaction is already confirmed'
        );
      }

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to || '',
        value: tx.value.toString(),
        nonce: tx.nonce,
        gasPrice: tx.gasPrice?.toString(),
        maxFeePerGas: tx.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas?.toString(),
        gasLimit: tx.gasLimit.toString(),
        data: tx.data,
        chainId: Number(tx.chainId),
        timestamp: Date.now(),
        type: tx.type === 2 ? 2 : 0,
      };
    } catch (error: any) {
      if (error instanceof TxManagementError) {
        throw error;
      }
      throw new TxManagementError(
        TxErrorType.NETWORK_ERROR,
        `Failed to fetch transaction: ${error.message}`,
        error
      );
    }
  }

  /**
   * Calculate replacement transaction requirements
   */
  async getReplacementRequirements(
    originalTx: PendingTransaction
  ): Promise<ReplacementRequirements> {
    // Get original gas prices
    let originalMaxFee: bigint;
    let originalPriorityFee: bigint;

    if (originalTx.type === 2) {
      originalMaxFee = BigInt(originalTx.maxFeePerGas || '0');
      originalPriorityFee = BigInt(originalTx.maxPriorityFeePerGas || '0');
    } else {
      // Legacy transaction
      originalMaxFee = BigInt(originalTx.gasPrice || '0');
      originalPriorityFee = originalMaxFee;
    }

    // Calculate minimum (10% bump required by protocol)
    const minBumpMultiplier = BigInt(100 + MIN_GAS_PRICE_BUMP);
    const minMaxFee = (originalMaxFee * minBumpMultiplier) / BigInt(100);
    const minPriorityFee = (originalPriorityFee * minBumpMultiplier) / BigInt(100);

    // Calculate recommended (15% bump for faster confirmation)
    const recBumpMultiplier = BigInt(100 + RECOMMENDED_GAS_PRICE_BUMP);
    const recMaxFee = (originalMaxFee * recBumpMultiplier) / BigInt(100);
    const recPriorityFee = (originalPriorityFee * recBumpMultiplier) / BigInt(100);

    return {
      minMaxFeePerGas: minMaxFee.toString(),
      minMaxPriorityFeePerGas: minPriorityFee.toString(),
      recommendedMaxFeePerGas: recMaxFee.toString(),
      recommendedMaxPriorityFeePerGas: recPriorityFee.toString(),
      percentageIncrease: RECOMMENDED_GAS_PRICE_BUMP,
    };
  }

  /**
   * Speed up a pending transaction
   */
  async speedupTransaction(
    txHash: string,
    options: SpeedupOptions = {}
  ): Promise<TransactionReplaceResult> {
    // Get original transaction
    const originalTx = await this.getPendingTransaction(txHash);

    if (!originalTx) {
      throw new TxManagementError(
        TxErrorType.TRANSACTION_NOT_FOUND,
        'Transaction not found in mempool'
      );
    }

    // Calculate new gas prices
    const { newMaxFee, newPriorityFee } = await this.calculateNewGasPrices(originalTx, options);

    // Build replacement transaction with same params but higher gas
    const replacementTx: ethers.TransactionRequest = {
      to: originalTx.to,
      value: BigInt(originalTx.value),
      nonce: originalTx.nonce,
      gasLimit: BigInt(originalTx.gasLimit),
      maxFeePerGas: newMaxFee,
      maxPriorityFeePerGas: newPriorityFee,
      data: originalTx.data,
      chainId: originalTx.chainId,
      type: 2,
    };

    try {
      const newHash = await this.sendReplacementTransaction(replacementTx);

      // Update monitoring
      this.updateMonitoredTx(txHash, TxStatus.REPLACED, newHash);
      this.addMonitoredTx(newHash, originalTx.nonce, originalTx.from, originalTx.chainId);

      return {
        success: true,
        originalHash: txHash,
        newHash,
        newGasPrice: newMaxFee.toString(),
      };
    } catch (error: any) {
      return this.handleReplacementError(error, txHash);
    }
  }

  /**
   * Cancel a pending transaction
   */
  async cancelTransaction(
    txHash: string,
    options: CancelOptions = {}
  ): Promise<TransactionReplaceResult> {
    // Get original transaction
    const originalTx = await this.getPendingTransaction(txHash);

    if (!originalTx) {
      throw new TxManagementError(
        TxErrorType.TRANSACTION_NOT_FOUND,
        'Transaction not found in mempool'
      );
    }

    // Calculate new gas prices (same logic as speedup)
    const { newMaxFee, newPriorityFee } = await this.calculateNewGasPrices(originalTx, options);

    // Build cancel transaction: 0-value tx to self with same nonce
    const cancelTx: ethers.TransactionRequest = {
      to: originalTx.from, // Send to self
      value: BigInt(0), // Zero value
      nonce: originalTx.nonce, // Same nonce
      gasLimit: BigInt(21000), // Minimum gas for simple transfer
      maxFeePerGas: newMaxFee,
      maxPriorityFeePerGas: newPriorityFee,
      data: '0x',
      chainId: originalTx.chainId,
      type: 2,
    };

    try {
      const newHash = await this.sendReplacementTransaction(cancelTx);

      // Update monitoring
      this.updateMonitoredTx(txHash, TxStatus.REPLACED, newHash);
      this.addMonitoredTx(newHash, originalTx.nonce, originalTx.from, originalTx.chainId);

      return {
        success: true,
        originalHash: txHash,
        newHash,
        newGasPrice: newMaxFee.toString(),
      };
    } catch (error: any) {
      return this.handleReplacementError(error, txHash);
    }
  }

  /**
   * Estimate gas for speedup/cancel
   */
  async estimateReplacementGas(txHash: string, isCancel: boolean = false): Promise<GasEstimation> {
    if (!this.provider) {
      throw new TxManagementError(TxErrorType.NETWORK_ERROR, 'Provider not initialized');
    }

    const originalTx = await this.getPendingTransaction(txHash);

    if (!originalTx) {
      throw new TxManagementError(TxErrorType.TRANSACTION_NOT_FOUND, 'Transaction not found');
    }

    const requirements = await this.getReplacementRequirements(originalTx);
    const feeData = await this.provider.getFeeData();

    // Use max of recommended and current network fee
    const recommendedMaxFee = BigInt(requirements.recommendedMaxFeePerGas);
    const networkMaxFee = feeData.maxFeePerGas || BigInt(0);
    const maxFee = recommendedMaxFee > networkMaxFee ? recommendedMaxFee : networkMaxFee;

    const recommendedPriorityFee = BigInt(requirements.recommendedMaxPriorityFeePerGas);
    const networkPriorityFee = feeData.maxPriorityFeePerGas || BigInt(0);
    const priorityFee =
      recommendedPriorityFee > networkPriorityFee ? recommendedPriorityFee : networkPriorityFee;

    const gasLimit = isCancel ? BigInt(21000) : BigInt(originalTx.gasLimit);
    const estimatedCost = maxFee * gasLimit;

    return {
      maxFeePerGas: maxFee.toString(),
      maxPriorityFeePerGas: priorityFee.toString(),
      gasLimit: gasLimit.toString(),
      estimatedCost: estimatedCost.toString(),
      baseFee: feeData.gasPrice?.toString(),
    };
  }

  /**
   * Start monitoring a transaction
   */
  addMonitoredTx(hash: string, nonce: number, from: string, chainId: number): void {
    const monitoredTx: MonitoredTransaction = {
      hash,
      nonce,
      from,
      chainId,
      status: TxStatus.PENDING,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      confirmations: 0,
    };

    this.monitoredTxs.set(hash, monitoredTx);
    this.emit('txAdded', monitoredTx);

    // Start monitoring if not already
    this.startMonitoring();

    // Persist to storage
    this.saveMonitoredTxs();
  }

  /**
   * Get all monitored transactions
   */
  getMonitoredTxs(): MonitoredTransaction[] {
    return Array.from(this.monitoredTxs.values());
  }

  /**
   * Get pending transactions only
   */
  getPendingTxs(): MonitoredTransaction[] {
    return this.getMonitoredTxs().filter(tx => tx.status === TxStatus.PENDING);
  }

  /**
   * Start transaction monitoring
   */
  startMonitoring(): void {
    if (this.monitorInterval) {
      return;
    }

    this.monitorInterval = setInterval(() => {
      this.checkPendingTransactions();
    }, TX_MONITOR_INTERVAL);
  }

  /**
   * Stop transaction monitoring
   */
  stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }

  /**
   * Load monitored transactions from storage
   */
  async loadMonitoredTxs(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.MONITORED_TXS);
      if (data) {
        const txs: MonitoredTransaction[] = JSON.parse(data);
        txs.forEach(tx => {
          // Only load pending transactions that aren't too old
          if (tx.status === TxStatus.PENDING && Date.now() - tx.createdAt < MAX_PENDING_AGE_MS) {
            this.monitoredTxs.set(tx.hash, tx);
          }
        });

        if (this.monitoredTxs.size > 0) {
          this.startMonitoring();
        }
      }
    } catch (error) {
      console.error('Failed to load monitored transactions:', error);
    }
  }

  /**
   * Clear all monitored transactions
   */
  async clearMonitoredTxs(): Promise<void> {
    this.monitoredTxs.clear();
    await AsyncStorage.removeItem(STORAGE_KEYS.MONITORED_TXS);
    this.stopMonitoring();
  }

  /**
   * Calculate new gas prices for replacement
   */
  private async calculateNewGasPrices(
    originalTx: PendingTransaction,
    options: SpeedupOptions | CancelOptions
  ): Promise<{ newMaxFee: bigint; newPriorityFee: bigint }> {
    // If fixed prices provided, use them
    if ('fixedMaxFeePerGas' in options && options.fixedMaxFeePerGas) {
      return {
        newMaxFee: BigInt(options.fixedMaxFeePerGas),
        newPriorityFee: BigInt(options.fixedMaxPriorityFeePerGas || options.fixedMaxFeePerGas),
      };
    }

    const multiplier = options.gasPriceMultiplier || DEFAULT_GAS_PRICE_MULTIPLIER;
    const multiplierBN = BigInt(Math.floor(multiplier * 100));

    let originalMaxFee: bigint;
    let originalPriorityFee: bigint;

    if (originalTx.type === 2) {
      originalMaxFee = BigInt(originalTx.maxFeePerGas || '0');
      originalPriorityFee = BigInt(originalTx.maxPriorityFeePerGas || '0');
    } else {
      originalMaxFee = BigInt(originalTx.gasPrice || '0');
      originalPriorityFee = originalMaxFee;
    }

    // Apply multiplier
    const newMaxFee = (originalMaxFee * multiplierBN) / BigInt(100);
    const newPriorityFee = (originalPriorityFee * multiplierBN) / BigInt(100);

    // Get current network fees
    if (this.provider) {
      const feeData = await this.provider.getFeeData();
      const currentMaxFee = feeData.maxFeePerGas || BigInt(0);
      const currentPriorityFee = feeData.maxPriorityFeePerGas || BigInt(0);

      // Use higher of bumped price and current network price
      return {
        newMaxFee: newMaxFee > currentMaxFee ? newMaxFee : currentMaxFee,
        newPriorityFee: newPriorityFee > currentPriorityFee ? newPriorityFee : currentPriorityFee,
      };
    }

    return { newMaxFee, newPriorityFee };
  }

  /**
   * Send replacement transaction
   */
  private async sendReplacementTransaction(tx: ethers.TransactionRequest): Promise<string> {
    // Use signing callback if available
    if (this.signingCallback) {
      return await this.signingCallback(tx);
    }

    // Use signer if available
    if (this.signer) {
      const response = await this.signer.sendTransaction(tx);
      return response.hash;
    }

    throw new TxManagementError(
      TxErrorType.SIGNING_FAILED,
      'No signer or signing callback available'
    );
  }

  /**
   * Handle replacement transaction errors
   */
  private handleReplacementError(error: any, originalHash: string): TransactionReplaceResult {
    const message = error.message?.toLowerCase() || '';

    if (message.includes('replacement transaction underpriced')) {
      return {
        success: false,
        originalHash,
        error: 'Gas price too low. Please increase gas price.',
      };
    }

    if (message.includes('nonce too low')) {
      return {
        success: false,
        originalHash,
        error: 'Transaction already confirmed or replaced.',
      };
    }

    if (message.includes('insufficient funds')) {
      return {
        success: false,
        originalHash,
        error: 'Insufficient funds for replacement transaction.',
      };
    }

    return {
      success: false,
      originalHash,
      error: error.message || 'Failed to replace transaction',
    };
  }

  /**
   * Update monitored transaction status
   */
  private updateMonitoredTx(hash: string, status: TxStatus, replacedBy?: string): void {
    const tx = this.monitoredTxs.get(hash);
    if (tx) {
      tx.status = status;
      tx.updatedAt = Date.now();
      if (replacedBy) {
        tx.replacedBy = replacedBy;
      }
      this.monitoredTxs.set(hash, tx);
      this.emit('txUpdated', tx);
      this.saveMonitoredTxs();
    }
  }

  /**
   * Check status of pending transactions
   */
  private async checkPendingTransactions(): Promise<void> {
    if (!this.provider) {
      return;
    }

    const pendingTxs = this.getPendingTxs();

    for (const tx of pendingTxs) {
      try {
        const receipt = await this.provider.getTransactionReceipt(tx.hash);

        if (receipt) {
          const status = receipt.status === 1 ? TxStatus.CONFIRMED : TxStatus.FAILED;
          this.updateMonitoredTx(tx.hash, status);

          const update: TransactionStatusUpdate = {
            hash: tx.hash,
            status,
            blockNumber: receipt.blockNumber,
            confirmations: 1,
          };

          this.emit('txConfirmed', update);
        } else if (Date.now() - tx.createdAt > MAX_PENDING_AGE_MS) {
          // Mark as dropped if pending too long
          this.updateMonitoredTx(tx.hash, TxStatus.DROPPED);
          this.emit('txDropped', { hash: tx.hash });
        }
      } catch (error) {
        console.error(`Error checking transaction ${tx.hash}:`, error);
      }
    }

    // Stop monitoring if no more pending transactions
    if (this.getPendingTxs().length === 0) {
      this.stopMonitoring();
    }
  }

  /**
   * Save monitored transactions to storage
   */
  private async saveMonitoredTxs(): Promise<void> {
    try {
      const txs = Array.from(this.monitoredTxs.values());
      await AsyncStorage.setItem(STORAGE_KEYS.MONITORED_TXS, JSON.stringify(txs));
    } catch (error) {
      console.error('Failed to save monitored transactions:', error);
    }
  }
}

// Singleton instance
let speedupServiceInstance: TransactionSpeedupService | null = null;

export const getTransactionSpeedupService = (): TransactionSpeedupService => {
  if (!speedupServiceInstance) {
    speedupServiceInstance = new TransactionSpeedupService();
  }
  return speedupServiceInstance;
};

export default TransactionSpeedupService;
