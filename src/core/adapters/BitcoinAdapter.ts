/**
 * BitcoinAdapter
 * Blockchain adapter for Bitcoin network (read-only for now)
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
  GasPrice,
} from './types';
import { CHAIN_METADATA } from './ChainConfig';
import { UnitConverter } from '../../utils/converters/UnitConverter';

/**
 * Bitcoin address types
 */
export type BitcoinAddressType = 'legacy' | 'segwit' | 'native-segwit' | 'taproot';

/**
 * Bitcoin adapter configuration
 */
export interface BitcoinAdapterConfig {
  /** API endpoint URL */
  apiUrl?: string;
  /** Network type */
  network?: 'mainnet' | 'testnet';
  /** Default address type for derivation */
  addressType?: BitcoinAddressType;
  /** Enable demo mode */
  demoMode?: boolean;
}

/**
 * UTXO (Unspent Transaction Output)
 */
export interface UTXO {
  txid: string;
  vout: number;
  value: number; // in satoshis
  scriptPubKey: string;
  status: {
    confirmed: boolean;
    blockHeight?: number;
    blockTime?: number;
  };
}

/**
 * BitcoinAdapter class
 * Implements IBlockchainAdapter for Bitcoin network
 * Note: Currently read-only, transaction signing requires additional libraries
 */
export class BitcoinAdapter extends BaseBlockchainAdapter {
  private apiUrl: string;
  private network: string;
  private addressType: BitcoinAddressType;
  private demoMode: boolean;

  constructor(config: BitcoinAdapterConfig = {}) {
    const metadata =
      config.network === 'testnet'
        ? { ...CHAIN_METADATA.bitcoin, chainId: 'testnet', testnet: true }
        : CHAIN_METADATA.bitcoin;
    super(metadata);

    this.network = config.network || 'mainnet';
    this.apiUrl =
      config.apiUrl ||
      (this.network === 'testnet'
        ? 'https://blockstream.info/testnet/api'
        : 'https://blockstream.info/api');
    this.addressType = config.addressType || 'native-segwit';
    this.demoMode = config.demoMode || false;
  }

  // ==================== Metadata ====================

  getCapabilities(): AdapterCapabilities {
    return {
      supportsEIP1559: false,
      supportsTokens: false, // Bitcoin doesn't have native tokens
      supportsNFTs: false, // Ordinals not supported yet
      supportsSmartContracts: false,
      supportsSimulation: false,
      supportsMessageSigning: true,
      supportsTypedData: false,
    };
  }

  async connect(): Promise<void> {
    try {
      // Test API connection
      const blockHeight = await this.getBlockNumber();
      this.connected = blockHeight > 0;
    } catch (error) {
      this.connected = false;
      throw new Error(`Failed to connect to Bitcoin: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  // ==================== Account Operations ====================

  isValidAddress(address: string): boolean {
    if (!address || address.length < 26 || address.length > 62) {
      return false;
    }

    // Legacy addresses (P2PKH) start with 1
    if (/^1[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) {
      return true;
    }

    // Legacy addresses (P2SH) start with 3
    if (/^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) {
      return true;
    }

    // Bech32 addresses (Native SegWit) start with bc1q
    if (/^bc1q[a-z0-9]{38,58}$/.test(address)) {
      return true;
    }

    // Bech32m addresses (Taproot) start with bc1p
    if (/^bc1p[a-z0-9]{58}$/.test(address)) {
      return true;
    }

    // Testnet addresses
    if (this.network === 'testnet') {
      // Testnet P2PKH starts with m or n
      if (/^[mn][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) {
        return true;
      }
      // Testnet P2SH starts with 2
      if (/^2[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) {
        return true;
      }
      // Testnet Bech32 starts with tb1
      if (/^tb1[a-z0-9]{38,62}$/.test(address)) {
        return true;
      }
    }

    return false;
  }

  getDefaultDerivationPath(accountIndex: number = 0): DerivationPath {
    // BIP44 paths by address type
    // Legacy: m/44'/0'/account'/change/address_index
    // SegWit: m/49'/0'/account'/change/address_index
    // Native SegWit: m/84'/0'/account'/change/address_index
    // Taproot: m/86'/0'/account'/change/address_index

    let purpose: number;
    switch (this.addressType) {
      case 'legacy':
        purpose = 44;
        break;
      case 'segwit':
        purpose = 49;
        break;
      case 'taproot':
        purpose = 86;
        break;
      case 'native-segwit':
      default:
        purpose = 84;
    }

    const coinType = this.network === 'testnet' ? 1 : 0;

    return {
      path: `m/${purpose}'/${coinType}'/${accountIndex}'/0/0`,
      purpose,
      coinType,
      account: accountIndex,
      change: 0,
      addressIndex: 0,
    };
  }

  deriveAddress(publicKey: string): string {
    // In production, use proper address derivation based on address type
    // This requires bitcoin-specific libraries
    throw new Error('Bitcoin address derivation requires bitcoinjs-lib');
  }

  toChecksumAddress(address: string): string {
    // Bitcoin doesn't use checksums in the same way as Ethereum
    return address;
  }

  // ==================== Balance Operations ====================

  async getBalance(address: string): Promise<Balance> {
    if (!this.isValidAddress(address)) {
      throw new Error('Invalid Bitcoin address');
    }

    if (this.demoMode) {
      return this.getMockBalance();
    }

    try {
      const response = await this.apiRequest(`/address/${address}`);

      const confirmedBalance =
        response.chain_stats?.funded_txo_sum - response.chain_stats?.spent_txo_sum || 0;
      const unconfirmedBalance =
        response.mempool_stats?.funded_txo_sum - response.mempool_stats?.spent_txo_sum || 0;
      const totalSatoshis = confirmedBalance + unconfirmedBalance;

      return {
        value: totalSatoshis.toString(),
        formatted: UnitConverter.satoshisToBtc(totalSatoshis.toString()),
        symbol: 'BTC',
        decimals: 8,
      };
    } catch (error) {
      throw new Error(`Failed to get balance: ${error}`);
    }
  }

  async getTokenBalance(address: string, tokenAddress: string): Promise<Balance> {
    // Bitcoin doesn't have native tokens
    throw new Error('Bitcoin does not support tokens');
  }

  async getAllBalances(address: string): Promise<BalanceResponse> {
    const native = await this.getBalance(address);

    return {
      native,
      tokens: [], // Bitcoin doesn't have tokens
    };
  }

  /**
   * Get UTXOs for an address
   */
  async getUTXOs(address: string): Promise<UTXO[]> {
    if (this.demoMode) {
      return this.getMockUTXOs(address);
    }

    try {
      const response = await this.apiRequest(`/address/${address}/utxo`);
      return response;
    } catch (error) {
      throw new Error(`Failed to get UTXOs: ${error}`);
    }
  }

  // ==================== Transaction Operations ====================

  async buildTransaction(params: TransactionParams): Promise<TransactionParams> {
    // Building Bitcoin transactions requires selecting UTXOs and calculating fees
    // This is a read-only implementation
    throw new Error('Bitcoin transaction building requires bitcoinjs-lib');
  }

  async estimateGas(params: TransactionParams): Promise<GasEstimate> {
    // Get current fee rates (sat/vB)
    const feeRates = await this.getFeeRates();

    // Estimate transaction size (typical P2WPKH: ~140 vBytes for 1 input, 2 outputs)
    const estimatedSize = 140;

    const slow: GasPrice = {
      gasPrice: feeRates.hourFee.toString(),
      estimatedTime: 3600,
      estimatedCost: UnitConverter.satoshisToBtc((feeRates.hourFee * estimatedSize).toString()),
    };

    const standard: GasPrice = {
      gasPrice: feeRates.halfHourFee.toString(),
      estimatedTime: 1800,
      estimatedCost: UnitConverter.satoshisToBtc((feeRates.halfHourFee * estimatedSize).toString()),
    };

    const fast: GasPrice = {
      gasPrice: feeRates.fastestFee.toString(),
      estimatedTime: 600,
      estimatedCost: UnitConverter.satoshisToBtc((feeRates.fastestFee * estimatedSize).toString()),
    };

    return {
      gasLimit: estimatedSize.toString(),
      slow,
      standard,
      fast,
    };
  }

  private async getFeeRates(): Promise<{
    fastestFee: number;
    halfHourFee: number;
    hourFee: number;
    economyFee: number;
    minimumFee: number;
  }> {
    if (this.demoMode) {
      return {
        fastestFee: 50,
        halfHourFee: 30,
        hourFee: 15,
        economyFee: 5,
        minimumFee: 1,
      };
    }

    try {
      // Use mempool.space API for fee estimates
      const response = await fetch('https://mempool.space/api/v1/fees/recommended');
      return await response.json();
    } catch (error) {
      // Fallback defaults
      return {
        fastestFee: 50,
        halfHourFee: 30,
        hourFee: 15,
        economyFee: 5,
        minimumFee: 1,
      };
    }
  }

  async signTransaction(tx: TransactionParams, privateKey: string): Promise<SignedTransaction> {
    // Bitcoin transaction signing requires bitcoinjs-lib
    throw new Error('Bitcoin transaction signing requires bitcoinjs-lib');
  }

  async broadcastTransaction(signedTx: SignedTransaction): Promise<BroadcastResult> {
    if (this.demoMode) {
      return {
        hash: this.generateMockTxHash(),
        status: 'pending',
      };
    }

    try {
      const txHash = await this.apiRequest('/tx', {
        method: 'POST',
        body: signedTx.rawTransaction,
      });

      return {
        hash: txHash,
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
      const tx = await this.apiRequest(`/tx/${txHash}`);

      if (!tx) {
        return null;
      }

      return {
        hash: txHash,
        status: tx.status?.confirmed ? 'success' : 'pending',
        blockNumber: tx.status?.block_height || 0,
        blockHash: tx.status?.block_hash || '',
        gasUsed: tx.fee?.toString() || '0',
        effectiveGasPrice: '0',
        transactionIndex: 0,
        logs: [],
        confirmations: tx.status?.block_height
          ? (await this.getBlockNumber()) - tx.status.block_height + 1
          : 0,
        timestamp: tx.status?.block_time ? tx.status.block_time * 1000 : undefined,
      };
    } catch (error) {
      return null;
    }
  }

  async waitForTransaction(
    txHash: string,
    confirmations: number = 1,
    timeout: number = 600000 // 10 minutes default for Bitcoin
  ): Promise<TransactionReceipt> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const receipt = await this.getTransactionReceipt(txHash);

      if (receipt && receipt.confirmations >= confirmations) {
        return receipt;
      }

      // Poll every 30 seconds for Bitcoin
      await this.sleep(30000);
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
      const response = await this.apiRequest(`/address/${address}/txs`);

      return response.slice(0, options?.pageSize || 20).map((tx: any) => {
        // Determine if this is incoming or outgoing
        const isIncoming = tx.vout.some((out: any) => out.scriptpubkey_address === address);

        // Calculate value
        let value = 0;
        if (isIncoming) {
          tx.vout.forEach((out: any) => {
            if (out.scriptpubkey_address === address) {
              value += out.value;
            }
          });
        } else {
          tx.vin.forEach((input: any) => {
            if (input.prevout?.scriptpubkey_address === address) {
              value += input.prevout.value;
            }
          });
        }

        return {
          hash: tx.txid,
          from: tx.vin[0]?.prevout?.scriptpubkey_address || '',
          to: tx.vout[0]?.scriptpubkey_address || '',
          value: value.toString(),
          fee: tx.fee?.toString() || '0',
          status: tx.status?.confirmed ? 'confirmed' : 'pending',
          blockNumber: tx.status?.block_height,
          timestamp: tx.status?.block_time ? tx.status.block_time * 1000 : Date.now(),
          type: isIncoming ? 'receive' : 'send',
        };
      });
    } catch (error) {
      console.warn('Failed to get transaction history:', error);
      return [];
    }
  }

  // ==================== Token Operations (Not Supported) ====================

  async getTokenMetadata(tokenAddress: string): Promise<TokenMetadata> {
    throw new Error('Bitcoin does not support tokens');
  }

  async getOwnedTokens(address: string): Promise<TokenMetadata[]> {
    return [];
  }

  async buildTokenTransfer(
    tokenAddress: string,
    from: string,
    to: string,
    amount: string
  ): Promise<TransactionParams> {
    throw new Error('Bitcoin does not support token transfers');
  }

  // ==================== NFT Operations (Not Supported) ====================

  async getNFTMetadata(contractAddress: string, tokenId: string): Promise<NFTMetadata> {
    throw new Error('Bitcoin NFTs (Ordinals) not yet supported');
  }

  async getOwnedNFTs(address: string): Promise<NFTMetadata[]> {
    return [];
  }

  async buildNFTTransfer(
    contractAddress: string,
    tokenId: string,
    from: string,
    to: string
  ): Promise<TransactionParams> {
    throw new Error('Bitcoin NFT transfers not yet supported');
  }

  // ==================== Message Signing ====================

  async signMessage(message: string, privateKey: string): Promise<string> {
    // Bitcoin message signing requires bitcoinjs-lib
    throw new Error('Bitcoin message signing requires bitcoinjs-lib');
  }

  async verifyMessage(message: string, signature: string, address: string): Promise<boolean> {
    // Bitcoin message verification requires bitcoinjs-lib
    throw new Error('Bitcoin message verification requires bitcoinjs-lib');
  }

  // ==================== Network Operations ====================

  async getBlockNumber(): Promise<number> {
    if (this.demoMode) {
      return 800000 + Math.floor(Math.random() * 1000);
    }

    try {
      const response = await this.apiRequest('/blocks/tip/height');
      return parseInt(response);
    } catch (error) {
      throw new Error(`Failed to get block height: ${error}`);
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

  private async apiRequest(endpoint: string, options?: RequestInit): Promise<any> {
    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    }

    return response.text();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== Mock Data ====================

  private getMockBalance(): Balance {
    const satoshis = Math.floor(Math.random() * 100000000);
    return {
      value: satoshis.toString(),
      formatted: UnitConverter.satoshisToBtc(satoshis.toString()),
      symbol: 'BTC',
      decimals: 8,
    };
  }

  private getMockUTXOs(address: string): UTXO[] {
    return [
      {
        txid: this.generateMockTxHash(),
        vout: 0,
        value: 50000000,
        scriptPubKey: '',
        status: {
          confirmed: true,
          blockHeight: 800000,
          blockTime: Date.now() / 1000,
        },
      },
    ];
  }

  private getMockReceipt(txHash: string): TransactionReceipt {
    return {
      hash: txHash,
      status: 'success',
      blockNumber: 800000,
      blockHash: this.generateMockTxHash(),
      gasUsed: '5000',
      effectiveGasPrice: '50',
      transactionIndex: 0,
      logs: [],
      confirmations: 6,
      timestamp: Date.now(),
    };
  }

  private getMockTransactionHistory(address: string): TransactionHistoryItem[] {
    return Array.from({ length: 5 }, (_, i) => ({
      hash: this.generateMockTxHash(),
      from: i % 2 === 0 ? address : this.generateMockAddress(),
      to: i % 2 === 0 ? this.generateMockAddress() : address,
      value: Math.floor(Math.random() * 10000000).toString(),
      fee: '5000',
      status: 'confirmed' as const,
      blockNumber: 800000 - i * 10,
      timestamp: Date.now() - i * 86400000,
      type: i % 2 === 0 ? ('send' as const) : ('receive' as const),
    }));
  }

  private generateMockTxHash(): string {
    const chars = 'abcdef0123456789';
    let hash = '';
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  }

  private generateMockAddress(): string {
    // Generate a mock native segwit address
    const chars = '023456789acdefghjklmnpqrstuvwxyz';
    let address = 'bc1q';
    for (let i = 0; i < 38; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address;
  }
}

export default BitcoinAdapter;
