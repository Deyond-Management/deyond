/**
 * EthereumProvider
 * RPC provider for blockchain interactions via Alchemy/Infura
 */

interface ProviderConfig {
  chainId: number;
  rpcUrl: string;
  timeout?: number;
}

interface TransactionRequest {
  to?: string;
  from?: string;
  value?: string;
  data?: string;
  gas?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

interface TransactionReceipt {
  transactionHash: string;
  blockNumber: number;
  blockHash: string;
  status: number;
  gasUsed: string;
  from: string;
  to: string;
  logs: unknown[];
}

interface FeeData {
  baseFeePerGas: string | null;
  maxPriorityFeePerGas: string;
  maxFeePerGas: string;
  gasPrice: string;
}

interface JsonRpcResponse<T = unknown> {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
  };
}

export class EthereumProvider {
  private chainId: number;
  private rpcUrl: string;
  private timeout: number;
  private requestId: number = 0;

  constructor(config: ProviderConfig) {
    this.chainId = config.chainId;
    this.rpcUrl = config.rpcUrl;
    this.timeout = config.timeout || 30000;
  }

  /**
   * Get current chain ID
   */
  getChainId(): number {
    return this.chainId;
  }

  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<number> {
    const result = await this.call<string>('eth_blockNumber', []);
    return parseInt(result, 16);
  }

  /**
   * Get balance of address
   */
  async getBalance(address: string, block: string = 'latest'): Promise<string> {
    const result = await this.call<string>('eth_getBalance', [address, block]);
    return BigInt(result).toString();
  }

  /**
   * Get transaction count (nonce)
   */
  async getTransactionCount(address: string, block: string = 'latest'): Promise<number> {
    const result = await this.call<string>('eth_getTransactionCount', [address, block]);
    return parseInt(result, 16);
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(tx: TransactionRequest): Promise<string> {
    const result = await this.call<string>('eth_estimateGas', [tx]);
    return parseInt(result, 16).toString();
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<string> {
    const result = await this.call<string>('eth_gasPrice', []);
    return BigInt(result).toString();
  }

  /**
   * Get fee data for EIP-1559 transactions
   */
  async getFeeData(): Promise<FeeData> {
    // Get latest block for baseFeePerGas
    const block = await this.call<{ baseFeePerGas?: string }>('eth_getBlockByNumber', ['latest', false]);

    // Get max priority fee
    const maxPriorityFeePerGas = await this.call<string>('eth_maxPriorityFeePerGas', []);

    const baseFeePerGas = block.baseFeePerGas
      ? BigInt(block.baseFeePerGas).toString()
      : null;

    const priorityFee = BigInt(maxPriorityFeePerGas);
    const baseFee = baseFeePerGas ? BigInt(baseFeePerGas) : BigInt(0);

    // maxFeePerGas = baseFeePerGas * 2 + maxPriorityFeePerGas
    const maxFeePerGas = (baseFee * BigInt(2) + priorityFee).toString();

    // Get legacy gas price as fallback
    const gasPrice = await this.getGasPrice();

    return {
      baseFeePerGas,
      maxPriorityFeePerGas: priorityFee.toString(),
      maxFeePerGas,
      gasPrice,
    };
  }

  /**
   * Send raw signed transaction
   */
  async sendRawTransaction(signedTx: string): Promise<string> {
    return this.call<string>('eth_sendRawTransaction', [signedTx]);
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string): Promise<TransactionReceipt | null> {
    const result = await this.call<TransactionReceipt | null>('eth_getTransactionReceipt', [txHash]);

    if (!result) {
      return null;
    }

    return {
      transactionHash: result.transactionHash,
      blockNumber: typeof result.blockNumber === 'string'
        ? parseInt(result.blockNumber, 16)
        : result.blockNumber,
      blockHash: result.blockHash,
      status: typeof result.status === 'string'
        ? parseInt(result.status, 16)
        : result.status,
      gasUsed: result.gasUsed,
      from: result.from,
      to: result.to,
      logs: result.logs || [],
    };
  }

  /**
   * Call contract method (read-only)
   */
  async ethCall(tx: TransactionRequest, block: string = 'latest'): Promise<string> {
    return this.call<string>('eth_call', [tx, block]);
  }

  /**
   * Alias for ethCall
   */
  async call(tx: TransactionRequest): Promise<string>;
  async call<T>(method: string, params: unknown[]): Promise<T>;
  async call<T>(methodOrTx: string | TransactionRequest, params?: unknown[]): Promise<T | string> {
    if (typeof methodOrTx === 'object') {
      return this.ethCall(methodOrTx);
    }
    return this.rpcCall<T>(methodOrTx, params || []);
  }

  /**
   * Make JSON-RPC call
   */
  private async rpcCall<T>(method: string, params: unknown[]): Promise<T> {
    const id = ++this.requestId;

    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id,
        method,
        params,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data: JsonRpcResponse<T> = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.result as T;
  }
}

export default EthereumProvider;
