/**
 * TransactionService
 * Service for building, signing, and broadcasting transactions
 */

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

  /**
   * Build a transaction with all required fields
   */
  async buildTransaction(params: TransactionParams): Promise<Transaction> {
    // Validate address
    if (!this.isValidAddress(params.to)) {
      throw new TransactionError('Invalid recipient address', 'INVALID_ADDRESS');
    }

    // Get current nonce (in real app, fetch from RPC)
    const nonce = await this.getNonce();

    // Get chain ID (in real app, from network config)
    const chainId = 1; // Mainnet

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
    // In real app, this would use ethers.js or web3.js to sign
    // For now, return mock signed transaction
    const rawTransaction = '0xf86c' + Math.random().toString(16).slice(2);
    const transactionHash = '0x' + this.generateMockHash();

    return {
      rawTransaction,
      transactionHash,
    };
  }

  /**
   * Broadcast signed transaction to network
   */
  async broadcastTransaction(signedTx: SignedTransaction): Promise<BroadcastResult> {
    // In real app, this would call eth_sendRawTransaction
    // For now, return mock result
    return {
      hash: signedTx.transactionHash,
      status: 'pending',
    };
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string): Promise<TransactionReceipt | null> {
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

  /**
   * Wait for transaction to be confirmed
   */
  async waitForTransaction(
    txHash: string,
    confirmations: number = 1,
    timeout: number = 60000
  ): Promise<TransactionReceipt> {
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
  private async getNonce(): Promise<number> {
    // In real app, fetch from RPC
    return this.currentNonce++;
  }

  /**
   * Validate Ethereum address
   */
  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
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
}

export default TransactionService;
