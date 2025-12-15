/**
 * TransactionService
 * Service for building, signing, and broadcasting transactions
 */

import { ethers } from 'ethers';
import { AppConfig } from '../../config/app.config';
import { DEFAULT_SERVICES_CONFIG, BlockchainConfig } from '../../config/services.config';
import { getProviderManager } from './ProviderManager';
import { EthereumProvider } from './EthereumProvider';

export class TransactionError extends Error {
  type: string;

  constructor(message: string, type: string = 'UNKNOWN') {
    super(message);
    this.name = 'TransactionError';
    this.type = type;
  }
}

export interface TransactionParams {
  to: string;
  value: string;
  gasLimit: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  data?: string;
  from?: string;
}

export interface Transaction extends TransactionParams {
  nonce: number;
  chainId: number;
}

export interface SignedTransaction {
  rawTransaction: string;
  transactionHash: string;
}

export interface BroadcastResult {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface TransactionReceipt {
  transactionHash: string;
  status: 'success' | 'failed';
  blockNumber: number;
  gasUsed: string;
}

export interface TransactionHistory {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasUsed: string;
  timestamp: number;
  blockNumber: number;
  status: 'pending' | 'confirmed' | 'failed';
  nonce: number;
  input: string;
}

export interface TransactionHistoryParams {
  address: string;
  page?: number;
  pageSize?: number;
  startBlock?: number;
  endBlock?: number;
}

export interface RpcError {
  code: number;
  message: string;
}

export interface ParsedError {
  type: string;
  message: string;
}

export class TransactionService {
  private currentNonce: number = 0;
  private defaultChainId: number;
  private provider: EthereumProvider | null = null;
  private transactionCache: Map<string, TransactionHistory[]> = new Map();
  private cacheTimestamp: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  constructor(config?: Partial<BlockchainConfig>) {
    const blockchainConfig = { ...DEFAULT_SERVICES_CONFIG.blockchain, ...config };
    this.defaultChainId = blockchainConfig.defaultChainId;

    // Initialize provider if not in demo mode
    if (!AppConfig.demoMode) {
      try {
        this.provider = getProviderManager().getCurrentProvider();
      } catch (error) {
        console.warn('Failed to initialize provider:', error);
      }
    }
  }

  /**
   * Build a transaction with all required fields
   */
  async buildTransaction(params: TransactionParams): Promise<Transaction> {
    // Validate address
    if (!this.isValidAddress(params.to)) {
      throw new TransactionError('Invalid recipient address', 'INVALID_ADDRESS');
    }

    // Validate value
    if (!params.value || typeof params.value !== 'string') {
      throw new TransactionError('Value must be a valid string', 'INVALID_VALUE');
    }

    const valueBN = BigInt(params.value);
    if (valueBN < 0n) {
      throw new TransactionError('Value cannot be negative', 'INVALID_VALUE');
    }

    // Validate gas limit
    if (!params.gasLimit || typeof params.gasLimit !== 'string') {
      throw new TransactionError('Gas limit must be a valid string', 'INVALID_GAS_LIMIT');
    }

    this.validateGasLimit(params.gasLimit);

    // Validate gas prices
    if (!params.maxFeePerGas || typeof params.maxFeePerGas !== 'string') {
      throw new TransactionError('Max fee per gas must be a valid string', 'INVALID_GAS_PRICE');
    }

    if (!params.maxPriorityFeePerGas || typeof params.maxPriorityFeePerGas !== 'string') {
      throw new TransactionError(
        'Max priority fee per gas must be a valid string',
        'INVALID_GAS_PRICE'
      );
    }

    // Validate data if provided
    if (params.data !== undefined) {
      if (typeof params.data !== 'string') {
        throw new TransactionError('Transaction data must be a string', 'INVALID_DATA');
      }

      if (params.data && !params.data.startsWith('0x')) {
        throw new TransactionError('Transaction data must start with 0x', 'INVALID_DATA');
      }

      if (params.data && params.data.length > 2 && !/^0x[0-9a-fA-F]*$/.test(params.data)) {
        throw new TransactionError('Transaction data must be valid hex', 'INVALID_DATA');
      }
    }

    // Get current nonce
    const nonce = await this.getNonce(params.from);

    // Get chain ID from provider or use default
    const chainId = this.provider ? this.provider.getChainId() : this.defaultChainId;

    return {
      ...params,
      nonce,
      chainId,
    };
  }

  /**
   * Sign a transaction with private key
   */
  async signTransaction(tx: Transaction, privateKey: string): Promise<SignedTransaction> {
    // Validate private key
    if (!privateKey || typeof privateKey !== 'string') {
      throw new TransactionError('Private key must be a valid string', 'INVALID_PRIVATE_KEY');
    }

    // Private key should be 64 hex characters (without 0x) or 66 (with 0x)
    const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;

    if (cleanKey.length !== 64) {
      throw new TransactionError('Private key must be 64 hex characters', 'INVALID_PRIVATE_KEY');
    }

    if (!/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
      throw new TransactionError('Private key must be valid hex', 'INVALID_PRIVATE_KEY');
    }

    // Use mock data in demo mode
    if (AppConfig.demoMode) {
      const rawTransaction = '0xf86c' + Math.random().toString(16).slice(2);
      const transactionHash = '0x' + this.generateMockHash();

      return {
        rawTransaction,
        transactionHash,
      };
    }

    // Real implementation - use ethers.js to sign transaction
    try {
      // Create wallet from private key
      const wallet = new ethers.Wallet('0x' + cleanKey);

      // Convert gas values from gwei to wei
      const maxFeePerGasWei = ethers.parseUnits(tx.maxFeePerGas, 'gwei');
      const maxPriorityFeePerGasWei = ethers.parseUnits(tx.maxPriorityFeePerGas, 'gwei');

      // Build EIP-1559 transaction
      const ethersTransaction = {
        to: tx.to,
        value: BigInt(tx.value),
        gasLimit: BigInt(tx.gasLimit),
        maxFeePerGas: maxFeePerGasWei,
        maxPriorityFeePerGas: maxPriorityFeePerGasWei,
        nonce: tx.nonce,
        chainId: tx.chainId,
        type: 2, // EIP-1559 transaction
        data: tx.data || '0x',
      };

      // Sign the transaction
      const signedTx = await wallet.signTransaction(ethersTransaction);

      // Calculate transaction hash
      const transactionHash = ethers.keccak256(signedTx);

      return {
        rawTransaction: signedTx,
        transactionHash,
      };
    } catch (error) {
      throw new TransactionError(
        `Failed to sign transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SIGNING_FAILED'
      );
    }
  }

  /**
   * Broadcast signed transaction to network
   */
  async broadcastTransaction(signedTx: SignedTransaction): Promise<BroadcastResult> {
    // Use mock data in demo mode
    if (AppConfig.demoMode) {
      return {
        hash: signedTx.transactionHash,
        status: 'pending',
      };
    }

    // Real implementation - broadcast via RPC
    if (!this.provider) {
      throw new TransactionError('Provider not initialized', 'PROVIDER_NOT_INITIALIZED');
    }

    try {
      // Send raw transaction to network
      const txHash = await this.provider.sendRawTransaction(signedTx.rawTransaction);

      return {
        hash: txHash,
        status: 'pending',
      };
    } catch (error) {
      // Parse RPC error for user-friendly message
      if (error instanceof Error) {
        const rpcError = { code: -1, message: error.message };
        const parsed = this.parseRpcError(rpcError);
        throw new TransactionError(parsed.message, parsed.type);
      }

      throw new TransactionError('Failed to broadcast transaction', 'BROADCAST_FAILED');
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string): Promise<TransactionReceipt | null> {
    // Validate transaction hash
    if (!this.isValidTxHash(txHash)) {
      throw new TransactionError('Invalid transaction hash', 'INVALID_TX_HASH');
    }

    // Use mock data in demo mode
    if (AppConfig.demoMode) {
      // Mock: pending transaction returns null
      if (txHash.endsWith('0001')) {
        return null;
      }

      // Mock: return receipt for other transactions
      return {
        transactionHash: txHash,
        status: 'success',
        blockNumber: 12345678,
        gasUsed: '21000',
      };
    }

    // Real implementation - fetch from RPC
    if (!this.provider) {
      throw new TransactionError('Provider not initialized', 'PROVIDER_NOT_INITIALIZED');
    }

    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);

      if (!receipt) {
        return null;
      }

      return {
        transactionHash: receipt.transactionHash,
        status: receipt.status === 1 ? 'success' : 'failed',
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
      };
    } catch (error) {
      throw new TransactionError(
        `Failed to get transaction receipt: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'RECEIPT_FETCH_FAILED'
      );
    }
  }

  /**
   * Wait for transaction to be confirmed
   */
  async waitForTransaction(
    txHash: string,
    confirmations: number = 1,
    timeout: number = 60000
  ): Promise<TransactionReceipt> {
    // Validate transaction hash
    if (!this.isValidTxHash(txHash)) {
      throw new TransactionError('Invalid transaction hash', 'INVALID_TX_HASH');
    }

    // Validate confirmations
    if (typeof confirmations !== 'number' || confirmations < 1) {
      throw new TransactionError('Confirmations must be at least 1', 'INVALID_CONFIRMATIONS');
    }

    // Validate timeout
    if (typeof timeout !== 'number' || timeout < 1000) {
      throw new TransactionError('Timeout must be at least 1000ms', 'INVALID_TIMEOUT');
    }

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const receipt = await this.getTransactionReceipt(txHash);

      if (receipt) {
        return receipt;
      }

      // Wait before polling again
      await this.sleep(1000);
    }

    throw new TransactionError('Transaction confirmation timeout', 'TIMEOUT');
  }

  /**
   * Validate that balance is sufficient for transaction
   */
  validateBalance(balance: string, value: string, gasCost: string): boolean {
    const balanceBN = BigInt(balance);
    const valueBN = BigInt(value);
    const gasCostBN = BigInt(gasCost);

    return balanceBN >= valueBN + gasCostBN;
  }

  /**
   * Validate gas limit
   */
  validateGasLimit(gasLimit: string): void {
    const limit = parseInt(gasLimit);
    if (isNaN(limit) || limit < 21000) {
      throw new TransactionError('Gas limit must be at least 21000', 'INVALID_GAS_LIMIT');
    }
  }

  /**
   * Parse RPC error into user-friendly format
   */
  parseRpcError(error: RpcError): ParsedError {
    const message = error.message.toLowerCase();

    if (message.includes('nonce too low')) {
      return {
        type: 'NONCE_TOO_LOW',
        message: 'Transaction nonce is too low. Please try again.',
      };
    }

    if (message.includes('insufficient funds')) {
      return {
        type: 'INSUFFICIENT_FUNDS',
        message: 'Insufficient funds for transaction.',
      };
    }

    if (message.includes('replacement transaction underpriced')) {
      return {
        type: 'REPLACEMENT_UNDERPRICED',
        message: 'Gas price too low to replace pending transaction.',
      };
    }

    if (message.includes('gas limit')) {
      return {
        type: 'GAS_LIMIT_ERROR',
        message: 'Gas limit error. Transaction may fail.',
      };
    }

    return {
      type: 'UNKNOWN',
      message: error.message,
    };
  }

  /**
   * Get current nonce for account
   */
  private async getNonce(address?: string): Promise<number> {
    // Use mock data in demo mode or if no address provided
    if (AppConfig.demoMode || !address) {
      return this.currentNonce++;
    }

    // Real implementation - fetch from RPC
    if (!this.provider) {
      throw new TransactionError('Provider not initialized', 'PROVIDER_NOT_INITIALIZED');
    }

    try {
      return await this.provider.getTransactionCount(address);
    } catch (error) {
      throw new TransactionError(
        `Failed to get nonce: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'NONCE_FETCH_FAILED'
      );
    }
  }

  /**
   * Validate Ethereum address
   */
  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Validate transaction hash
   */
  private isValidTxHash(txHash: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(txHash);
  }

  /**
   * Generate mock transaction hash
   */
  private generateMockHash(): string {
    const chars = 'abcdef0123456789';
    let hash = '';
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get transaction history for an address with pagination
   */
  async getTransactionHistory(params: TransactionHistoryParams): Promise<TransactionHistory[]> {
    const { address, page = 0, pageSize = 20 } = params;

    // Validate address
    if (!this.isValidAddress(address)) {
      throw new TransactionError('Invalid address', 'INVALID_ADDRESS');
    }

    // Check cache first
    const cacheKey = `${address}:${page}:${pageSize}`;
    const cached = this.getCachedTransactions(cacheKey);
    if (cached) {
      return cached;
    }

    // Use mock data in demo mode
    if (AppConfig.demoMode) {
      const mockData = this.generateMockTransactionHistory(address, page, pageSize);
      this.cacheTransactions(cacheKey, mockData);
      return mockData;
    }

    // Real implementation - fetch from blockchain explorer API or RPC
    if (!this.provider) {
      throw new TransactionError('Provider not initialized', 'PROVIDER_NOT_INITIALIZED');
    }

    try {
      // This would typically use an external API like Etherscan
      // For now, we'll return empty array for real provider
      const transactions: TransactionHistory[] = [];
      this.cacheTransactions(cacheKey, transactions);
      return transactions;
    } catch (error) {
      throw new TransactionError(
        `Failed to fetch transaction history: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'HISTORY_FETCH_FAILED'
      );
    }
  }

  /**
   * Clear transaction cache
   */
  clearTransactionCache(): void {
    this.transactionCache.clear();
    this.cacheTimestamp.clear();
  }

  /**
   * Get cached transactions if available and fresh
   */
  private getCachedTransactions(cacheKey: string): TransactionHistory[] | null {
    const timestamp = this.cacheTimestamp.get(cacheKey);
    if (!timestamp) {
      return null;
    }

    const age = Date.now() - timestamp;
    if (age > this.CACHE_DURATION) {
      this.transactionCache.delete(cacheKey);
      this.cacheTimestamp.delete(cacheKey);
      return null;
    }

    return this.transactionCache.get(cacheKey) || null;
  }

  /**
   * Cache transactions
   */
  private cacheTransactions(cacheKey: string, transactions: TransactionHistory[]): void {
    this.transactionCache.set(cacheKey, transactions);
    this.cacheTimestamp.set(cacheKey, Date.now());
  }

  /**
   * Generate mock transaction history for demo mode
   */
  private generateMockTransactionHistory(
    address: string,
    page: number,
    pageSize: number
  ): TransactionHistory[] {
    const transactions: TransactionHistory[] = [];
    const now = Date.now();
    const startIndex = page * pageSize;

    // Generate mock transactions
    for (let i = 0; i < pageSize; i++) {
      const index = startIndex + i;
      const isSent = index % 2 === 0;
      const timestamp = now - index * 3600000; // 1 hour apart

      transactions.push({
        hash: '0x' + this.generateMockHash(),
        from: isSent ? address : '0x' + this.generateMockHash().slice(0, 40),
        to: isSent ? '0x' + this.generateMockHash().slice(0, 40) : address,
        value: (Math.random() * 10).toFixed(18),
        gasPrice: (Math.random() * 100 + 20).toString(),
        gasUsed: '21000',
        timestamp,
        blockNumber: 18000000 - index * 10,
        status: index < 2 ? 'pending' : 'confirmed',
        nonce: index,
        input: '0x',
      });
    }

    return transactions;
  }
}

export default TransactionService;
