/**
 * SolanaAdapter
 * Blockchain adapter for Solana network
 */

import { BaseBlockchainAdapter } from './IBlockchainAdapter';
import {
  ChainMetadata,
  Balance,
  BalanceResponse,
  TransactionParams,
  SignedTransaction,
  BroadcastResult,
  TransactionReceipt,
  TransactionHistoryItem,
  GasEstimate,
  TokenMetadata,
  NFTMetadata,
  AdapterCapabilities,
  DerivationPath,
  TokenBalance,
  GasPrice,
  TransactionLog,
} from './types';
import { CHAIN_METADATA } from './ChainConfig';
import { UnitConverter } from '../../utils/converters/UnitConverter';

/**
 * Solana-specific transaction params
 */
export interface SolanaTransactionParams extends TransactionParams {
  /** Recent blockhash */
  recentBlockhash?: string;
  /** Fee payer (defaults to from) */
  feePayer?: string;
  /** Priority fee in micro-lamports */
  priorityFee?: string;
}

/**
 * Solana adapter configuration
 */
export interface SolanaAdapterConfig {
  /** RPC endpoint URL */
  rpcUrl?: string;
  /** WebSocket endpoint URL */
  wsUrl?: string;
  /** Commitment level */
  commitment?: 'processed' | 'confirmed' | 'finalized';
  /** Enable demo mode */
  demoMode?: boolean;
}

/**
 * SolanaAdapter class
 * Implements IBlockchainAdapter for Solana network
 */
export class SolanaAdapter extends BaseBlockchainAdapter {
  private rpcUrl: string;
  private wsUrl?: string;
  private commitment: string;
  private demoMode: boolean;

  constructor(config: SolanaAdapterConfig = {}) {
    const metadata = CHAIN_METADATA.solana;
    super(metadata);

    this.rpcUrl = config.rpcUrl || metadata.rpcUrls[0];
    this.wsUrl = config.wsUrl || metadata.wsUrls?.[0];
    this.commitment = config.commitment || 'confirmed';
    this.demoMode = config.demoMode || false;
  }

  // ==================== Metadata ====================

  getCapabilities(): AdapterCapabilities {
    return {
      supportsEIP1559: false,
      supportsTokens: true,
      supportsNFTs: true,
      supportsSmartContracts: true,
      supportsSimulation: true,
      supportsMessageSigning: true,
      supportsTypedData: false,
    };
  }

  async connect(): Promise<void> {
    try {
      // Test RPC connection
      const blockHeight = await this.getBlockNumber();
      this.connected = blockHeight > 0;
    } catch (error) {
      this.connected = false;
      throw new Error(`Failed to connect to Solana: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  // ==================== Account Operations ====================

  isValidAddress(address: string): boolean {
    // Solana addresses are base58 encoded 32-byte public keys
    // Valid length is 32-44 characters
    if (!address || address.length < 32 || address.length > 44) {
      return false;
    }

    // Check for valid base58 characters
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    return base58Regex.test(address);
  }

  getDefaultDerivationPath(accountIndex: number = 0): DerivationPath {
    // Solana uses BIP44 with coin type 501
    // Standard path: m/44'/501'/account'/change'
    return {
      path: `m/44'/501'/${accountIndex}'/0'`,
      purpose: 44,
      coinType: 501,
      account: accountIndex,
      change: 0,
      addressIndex: 0,
    };
  }

  deriveAddress(publicKey: string): string {
    // In Solana, the public key IS the address (base58 encoded)
    return publicKey;
  }

  toChecksumAddress(address: string): string {
    // Solana doesn't use checksums, return as-is
    return address;
  }

  // ==================== Balance Operations ====================

  async getBalance(address: string): Promise<Balance> {
    if (!this.isValidAddress(address)) {
      throw new Error('Invalid Solana address');
    }

    if (this.demoMode) {
      return this.getMockBalance();
    }

    try {
      const response = await this.rpcRequest('getBalance', [
        address,
        { commitment: this.commitment },
      ]);

      const lamports = response.value.toString();
      const formatted = UnitConverter.lamportsToSol(lamports);

      return {
        value: lamports,
        formatted,
        symbol: 'SOL',
        decimals: 9,
      };
    } catch (error) {
      throw new Error(`Failed to get balance: ${error}`);
    }
  }

  async getTokenBalance(address: string, tokenAddress: string): Promise<Balance> {
    if (!this.isValidAddress(address) || !this.isValidAddress(tokenAddress)) {
      throw new Error('Invalid address');
    }

    if (this.demoMode) {
      return this.getMockTokenBalance(tokenAddress);
    }

    try {
      // Get token accounts by owner
      const response = await this.rpcRequest('getTokenAccountsByOwner', [
        address,
        { mint: tokenAddress },
        { encoding: 'jsonParsed', commitment: this.commitment },
      ]);

      if (!response.value || response.value.length === 0) {
        return {
          value: '0',
          formatted: '0',
          symbol: 'SPL',
          decimals: 9,
        };
      }

      const tokenAccount = response.value[0].account.data.parsed.info;
      const amount = tokenAccount.tokenAmount.amount;
      const decimals = tokenAccount.tokenAmount.decimals;

      return {
        value: amount,
        formatted: UnitConverter.fromSmallestUnit(amount, decimals),
        symbol: 'SPL',
        decimals,
      };
    } catch (error) {
      throw new Error(`Failed to get token balance: ${error}`);
    }
  }

  async getAllBalances(address: string): Promise<BalanceResponse> {
    const native = await this.getBalance(address);
    const tokens = await this.getOwnedTokenBalances(address);

    return {
      native,
      tokens,
    };
  }

  private async getOwnedTokenBalances(address: string): Promise<TokenBalance[]> {
    if (this.demoMode) {
      return this.getMockTokenBalances();
    }

    try {
      const response = await this.rpcRequest('getTokenAccountsByOwner', [
        address,
        { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
        { encoding: 'jsonParsed', commitment: this.commitment },
      ]);

      const tokens: TokenBalance[] = [];

      for (const account of response.value || []) {
        const info = account.account.data.parsed.info;
        const tokenAmount = info.tokenAmount;

        if (tokenAmount.uiAmount > 0) {
          tokens.push({
            contractAddress: info.mint,
            name: 'SPL Token',
            value: tokenAmount.amount,
            formatted: tokenAmount.uiAmountString,
            symbol: 'SPL',
            decimals: tokenAmount.decimals,
          });
        }
      }

      return tokens;
    } catch (error) {
      console.warn('Failed to get token balances:', error);
      return [];
    }
  }

  // ==================== Transaction Operations ====================

  async buildTransaction(params: TransactionParams): Promise<TransactionParams> {
    // Get recent blockhash for transaction
    const recentBlockhash = await this.getRecentBlockhash();

    return {
      ...params,
      data: recentBlockhash,
    };
  }

  async estimateGas(params: TransactionParams): Promise<GasEstimate> {
    // Solana uses a fixed base fee plus optional priority fees
    const baseFee = '5000'; // 5000 lamports base fee
    const estimatedCost = UnitConverter.lamportsToSol(baseFee);

    const baseGasPrice: GasPrice = {
      gasPrice: baseFee,
      estimatedTime: 1,
      estimatedCost,
    };

    return {
      gasLimit: '200000', // Compute units
      slow: {
        ...baseGasPrice,
        gasPrice: baseFee,
        estimatedTime: 60,
      },
      standard: {
        ...baseGasPrice,
        gasPrice: '10000',
        estimatedTime: 10,
        estimatedCost: UnitConverter.lamportsToSol('10000'),
      },
      fast: {
        ...baseGasPrice,
        gasPrice: '50000',
        estimatedTime: 1,
        estimatedCost: UnitConverter.lamportsToSol('50000'),
      },
    };
  }

  async signTransaction(tx: TransactionParams, privateKey: string): Promise<SignedTransaction> {
    if (this.demoMode) {
      return {
        rawTransaction: '0x' + this.generateMockSignature(),
        hash: this.generateMockTxHash(),
      };
    }

    // In production, this would use @solana/web3.js
    throw new Error('Solana transaction signing requires @solana/web3.js integration');
  }

  async broadcastTransaction(signedTx: SignedTransaction): Promise<BroadcastResult> {
    if (this.demoMode) {
      return {
        hash: signedTx.hash,
        status: 'pending',
      };
    }

    try {
      const signature = await this.rpcRequest('sendTransaction', [
        signedTx.rawTransaction,
        { encoding: 'base64', preflightCommitment: this.commitment },
      ]);

      return {
        hash: signature,
        status: 'pending',
      };
    } catch (error) {
      throw new Error(`Failed to broadcast transaction: ${error}`);
    }
  }

  async getTransactionReceipt(txHash: string): Promise<TransactionReceipt | null> {
    if (this.demoMode) {
      return this.getMockReceipt(txHash);
    }

    try {
      const response = await this.rpcRequest('getTransaction', [
        txHash,
        { encoding: 'jsonParsed', commitment: 'confirmed' },
      ]);

      if (!response) {
        return null;
      }

      return {
        hash: txHash,
        status: response.meta?.err ? 'failed' : 'success',
        blockNumber: response.slot,
        blockHash: response.transaction?.message?.recentBlockhash || '',
        gasUsed: response.meta?.computeUnitsConsumed?.toString() || '0',
        effectiveGasPrice: response.meta?.fee?.toString() || '0',
        transactionIndex: 0,
        logs: [],
        confirmations: 1,
        timestamp: response.blockTime,
      };
    } catch (error) {
      return null;
    }
  }

  async waitForTransaction(
    txHash: string,
    confirmations: number = 1,
    timeout: number = 60000
  ): Promise<TransactionReceipt> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const receipt = await this.getTransactionReceipt(txHash);

      if (receipt && receipt.status !== 'pending') {
        return receipt;
      }

      await this.sleep(1000);
    }

    throw new Error('Transaction confirmation timeout');
  }

  async getTransactionHistory(
    address: string,
    options?: {
      page?: number;
      pageSize?: number;
      startBlock?: number;
      endBlock?: number;
    }
  ): Promise<TransactionHistoryItem[]> {
    if (this.demoMode) {
      return this.getMockTransactionHistory(address);
    }

    try {
      const limit = options?.pageSize || 20;
      const response = await this.rpcRequest('getSignaturesForAddress', [
        address,
        { limit, commitment: this.commitment },
      ]);

      return response.map((sig: any) => ({
        hash: sig.signature,
        from: address,
        to: '',
        value: '0',
        fee: '5000',
        status: sig.err ? 'failed' : 'confirmed',
        blockNumber: sig.slot,
        timestamp: sig.blockTime ? sig.blockTime * 1000 : Date.now(),
        type: 'unknown' as const,
      }));
    } catch (error) {
      console.warn('Failed to get transaction history:', error);
      return [];
    }
  }

  // ==================== Token Operations ====================

  async getTokenMetadata(tokenAddress: string): Promise<TokenMetadata> {
    if (!this.isValidAddress(tokenAddress)) {
      throw new Error('Invalid token address');
    }

    if (this.demoMode) {
      return {
        address: tokenAddress,
        name: 'Mock Token',
        symbol: 'MOCK',
        decimals: 9,
        type: 'SPL',
      };
    }

    // In production, use Metaplex SDK or token registry
    return {
      address: tokenAddress,
      name: 'SPL Token',
      symbol: 'SPL',
      decimals: 9,
      type: 'SPL',
    };
  }

  async getOwnedTokens(address: string): Promise<TokenMetadata[]> {
    const balances = await this.getOwnedTokenBalances(address);

    return balances.map(balance => ({
      address: balance.contractAddress,
      name: balance.name,
      symbol: balance.symbol,
      decimals: balance.decimals,
      type: 'SPL' as const,
    }));
  }

  async buildTokenTransfer(
    tokenAddress: string,
    from: string,
    to: string,
    amount: string
  ): Promise<TransactionParams> {
    const recentBlockhash = await this.getRecentBlockhash();

    return {
      from,
      to,
      value: amount,
      data: JSON.stringify({
        type: 'spl-transfer',
        mint: tokenAddress,
        recentBlockhash,
      }),
    };
  }

  // ==================== NFT Operations ====================

  async getNFTMetadata(contractAddress: string, tokenId: string): Promise<NFTMetadata> {
    if (this.demoMode) {
      return this.getMockNFTMetadata(contractAddress, tokenId);
    }

    // In production, use Metaplex SDK
    return {
      contractAddress,
      tokenId,
      name: 'Solana NFT',
      standard: 'SPL',
    };
  }

  async getOwnedNFTs(address: string): Promise<NFTMetadata[]> {
    if (this.demoMode) {
      return [];
    }

    // In production, use Metaplex SDK or Helius API
    return [];
  }

  async buildNFTTransfer(
    contractAddress: string,
    tokenId: string,
    from: string,
    to: string
  ): Promise<TransactionParams> {
    return this.buildTokenTransfer(contractAddress, from, to, '1');
  }

  // ==================== Message Signing ====================

  async signMessage(message: string, privateKey: string): Promise<string> {
    if (this.demoMode) {
      return '0x' + this.generateMockSignature();
    }

    throw new Error('Message signing requires @solana/web3.js integration');
  }

  async verifyMessage(message: string, signature: string, address: string): Promise<boolean> {
    if (this.demoMode) {
      return true;
    }

    throw new Error('Message verification requires @solana/web3.js integration');
  }

  // ==================== Network Operations ====================

  async getBlockNumber(): Promise<number> {
    if (this.demoMode) {
      return 200000000 + Math.floor(Math.random() * 1000);
    }

    try {
      const response = await this.rpcRequest('getSlot', [{ commitment: this.commitment }]);
      return response;
    } catch (error) {
      throw new Error(`Failed to get block number: ${error}`);
    }
  }

  async getGasPrice(): Promise<GasEstimate> {
    return this.estimateGas({
      from: '',
      to: '',
      value: '0',
    });
  }

  async getNetworkStatus(): Promise<{
    isHealthy: boolean;
    latency: number;
    blockHeight: number;
    peerCount?: number;
  }> {
    const startTime = Date.now();

    try {
      const blockHeight = await this.getBlockNumber();
      const latency = Date.now() - startTime;

      return {
        isHealthy: true,
        latency,
        blockHeight,
      };
    } catch (error) {
      return {
        isHealthy: false,
        latency: 0,
        blockHeight: 0,
      };
    }
  }

  // ==================== Helper Methods ====================

  private async rpcRequest(method: string, params: unknown[]): Promise<any> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params,
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'RPC error');
    }

    return data.result;
  }

  private async getRecentBlockhash(): Promise<string> {
    if (this.demoMode) {
      return 'mock-blockhash-' + Date.now().toString(36);
    }

    const response = await this.rpcRequest('getLatestBlockhash', [{ commitment: this.commitment }]);
    return response.value.blockhash;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== Mock Data ====================

  private getMockBalance(): Balance {
    const lamports = (Math.random() * 100 * 1e9).toFixed(0);
    return {
      value: lamports,
      formatted: UnitConverter.lamportsToSol(lamports),
      symbol: 'SOL',
      decimals: 9,
    };
  }

  private getMockTokenBalance(tokenAddress: string): Balance {
    return {
      value: '1000000000',
      formatted: '1.0',
      symbol: 'SPL',
      decimals: 9,
    };
  }

  private getMockTokenBalances(): TokenBalance[] {
    return [
      {
        contractAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        name: 'USD Coin',
        value: '100000000',
        formatted: '100.0',
        symbol: 'USDC',
        decimals: 6,
      },
    ];
  }

  private getMockReceipt(txHash: string): TransactionReceipt {
    return {
      hash: txHash,
      status: 'success',
      blockNumber: 200000000,
      blockHash: 'mock-block-hash',
      gasUsed: '5000',
      effectiveGasPrice: '5000',
      transactionIndex: 0,
      logs: [],
      confirmations: 10,
      timestamp: Date.now(),
    };
  }

  private getMockTransactionHistory(address: string): TransactionHistoryItem[] {
    return Array.from({ length: 5 }, (_, i) => ({
      hash: this.generateMockTxHash(),
      from: i % 2 === 0 ? address : this.generateMockAddress(),
      to: i % 2 === 0 ? this.generateMockAddress() : address,
      value: (Math.random() * 10 * 1e9).toFixed(0),
      fee: '5000',
      status: 'confirmed' as const,
      blockNumber: 200000000 - i * 100,
      timestamp: Date.now() - i * 3600000,
      type: i % 2 === 0 ? ('send' as const) : ('receive' as const),
    }));
  }

  private getMockNFTMetadata(contractAddress: string, tokenId: string): NFTMetadata {
    return {
      contractAddress,
      tokenId,
      name: 'Mock Solana NFT',
      description: 'A mock NFT for testing',
      image: 'https://via.placeholder.com/300',
      standard: 'SPL',
    };
  }

  private generateMockTxHash(): string {
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let hash = '';
    for (let i = 0; i < 88; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  }

  private generateMockSignature(): string {
    const chars = 'abcdef0123456789';
    let sig = '';
    for (let i = 0; i < 128; i++) {
      sig += chars[Math.floor(Math.random() * chars.length)];
    }
    return sig;
  }

  private generateMockAddress(): string {
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let address = '';
    for (let i = 0; i < 44; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address;
  }
}

export default SolanaAdapter;
