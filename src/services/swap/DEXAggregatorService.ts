/**
 * DEX Aggregator Service
 * Integrates with 0x and 1inch APIs for token swaps
 */

import { ethers } from 'ethers';
import {
  DEXAggregator,
  SwapQuoteRequest,
  SwapQuote,
  SwapTransactionRequest,
  SwapTransactionResult,
  ApprovalStatus,
  SwapToken,
  DEX_CONFIG,
  DEFAULT_SLIPPAGE,
  SwapError,
  SwapErrorType,
} from './types';

// ERC20 ABI for approval checks
const ERC20_ABI = [
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
];

/**
 * API configuration
 */
interface APIConfig {
  zeroxApiKey?: string;
  oneInchApiKey?: string;
}

/**
 * DEX Aggregator Service
 */
class DEXAggregatorService {
  private config: APIConfig = {};
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;

  /**
   * Initialize the service
   */
  initialize(config: APIConfig): void {
    this.config = config;
  }

  /**
   * Set the provider and signer
   */
  setProvider(provider: ethers.Provider, signer?: ethers.Signer): void {
    this.provider = provider;
    this.signer = signer || null;
  }

  /**
   * Get quote from 0x API
   */
  async getZeroXQuote(request: SwapQuoteRequest): Promise<SwapQuote> {
    const chainConfig = DEX_CONFIG[request.chainId];
    if (!chainConfig) {
      throw new SwapError(SwapErrorType.NETWORK_ERROR, `Chain ${request.chainId} is not supported`);
    }

    const params = new URLSearchParams({
      sellToken: request.sellToken,
      buyToken: request.buyToken,
      sellAmount: request.sellAmount,
      slippagePercentage: String(request.slippagePercentage || DEFAULT_SLIPPAGE / 100),
    });

    if (request.takerAddress) {
      params.append('takerAddress', request.takerAddress);
    }

    if (request.skipValidation) {
      params.append('skipValidation', 'true');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.zeroxApiKey) {
      headers['0x-api-key'] = this.config.zeroxApiKey;
    }

    try {
      const response = await fetch(
        `${chainConfig.zeroxApiUrl}/swap/v1/quote?${params.toString()}`,
        { headers }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw this.handleZeroXError(response.status, errorData);
      }

      const data = await response.json();

      return {
        aggregator: '0x',
        sellToken: data.sellTokenAddress,
        buyToken: data.buyTokenAddress,
        sellAmount: data.sellAmount,
        buyAmount: data.buyAmount,
        price: data.price,
        guaranteedPrice: data.guaranteedPrice,
        estimatedPriceImpact: data.estimatedPriceImpact,
        sources:
          data.sources?.map((s: any) => ({
            name: s.name,
            proportion: s.proportion,
          })) || [],
        gas: data.gas,
        gasPrice: data.gasPrice,
        estimatedGas: data.estimatedGas,
        protocolFee: data.protocolFee,
        minimumProtocolFee: data.minimumProtocolFee,
        allowanceTarget: data.allowanceTarget,
        to: data.to,
        data: data.data,
        value: data.value,
        sellTokenToEthRate: data.sellTokenToEthRate,
        buyTokenToEthRate: data.buyTokenToEthRate,
      };
    } catch (error: any) {
      if (error instanceof SwapError) {
        throw error;
      }
      throw new SwapError(SwapErrorType.NETWORK_ERROR, `0x API error: ${error.message}`, error);
    }
  }

  /**
   * Get quote from 1inch API
   */
  async getOneInchQuote(request: SwapQuoteRequest): Promise<SwapQuote> {
    const chainConfig = DEX_CONFIG[request.chainId];
    if (!chainConfig) {
      throw new SwapError(SwapErrorType.NETWORK_ERROR, `Chain ${request.chainId} is not supported`);
    }

    const params = new URLSearchParams({
      src: request.sellToken,
      dst: request.buyToken,
      amount: request.sellAmount,
      slippage: String(request.slippagePercentage || DEFAULT_SLIPPAGE),
    });

    if (request.takerAddress) {
      params.append('from', request.takerAddress);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.oneInchApiKey) {
      headers['Authorization'] = `Bearer ${this.config.oneInchApiKey}`;
    }

    try {
      const response = await fetch(`${chainConfig.oneInchApiUrl}/swap?${params.toString()}`, {
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw this.handleOneInchError(response.status, errorData);
      }

      const data = await response.json();

      return {
        aggregator: '1inch',
        sellToken: data.srcToken?.address || request.sellToken,
        buyToken: data.dstToken?.address || request.buyToken,
        sellAmount: data.srcAmount || request.sellAmount,
        buyAmount: data.dstAmount,
        price: this.calculatePrice(data.srcAmount, data.dstAmount),
        sources:
          data.protocols?.flat(2)?.map((p: any) => ({
            name: p.name,
            proportion: String(p.part / 100),
          })) || [],
        gas: String(data.tx?.gas || 0),
        gasPrice: String(data.tx?.gasPrice || 0),
        estimatedGas: String(data.tx?.gas || 0),
        allowanceTarget: data.tx?.to,
        to: data.tx?.to || '',
        data: data.tx?.data || '',
        value: data.tx?.value || '0',
      };
    } catch (error: any) {
      if (error instanceof SwapError) {
        throw error;
      }
      throw new SwapError(SwapErrorType.NETWORK_ERROR, `1inch API error: ${error.message}`, error);
    }
  }

  /**
   * Get best quote from all aggregators
   */
  async getBestQuote(request: SwapQuoteRequest): Promise<SwapQuote> {
    const quotes: SwapQuote[] = [];
    const errors: Error[] = [];

    // Fetch quotes in parallel
    const quotePromises = [
      this.getZeroXQuote(request).catch(e => {
        errors.push(e);
        return null;
      }),
      this.getOneInchQuote(request).catch(e => {
        errors.push(e);
        return null;
      }),
    ];

    const results = await Promise.all(quotePromises);

    for (const result of results) {
      if (result) {
        quotes.push(result);
      }
    }

    if (quotes.length === 0) {
      // If all requests failed, throw the first error
      if (errors.length > 0) {
        throw errors[0];
      }
      throw new SwapError(
        SwapErrorType.INSUFFICIENT_LIQUIDITY,
        'No quotes available for this swap'
      );
    }

    // Find best quote by buyAmount
    return quotes.reduce((best, current) => {
      const bestBuyAmount = BigInt(best.buyAmount);
      const currentBuyAmount = BigInt(current.buyAmount);
      return currentBuyAmount > bestBuyAmount ? current : best;
    });
  }

  /**
   * Get all quotes for comparison
   */
  async getAllQuotes(request: SwapQuoteRequest): Promise<SwapQuote[]> {
    const quotes: SwapQuote[] = [];

    const quotePromises = [
      this.getZeroXQuote(request).catch(() => null),
      this.getOneInchQuote(request).catch(() => null),
    ];

    const results = await Promise.all(quotePromises);

    for (const result of results) {
      if (result) {
        quotes.push(result);
      }
    }

    // Sort by buyAmount descending
    return quotes.sort((a, b) => {
      const aBuyAmount = BigInt(a.buyAmount);
      const bBuyAmount = BigInt(b.buyAmount);
      if (bBuyAmount > aBuyAmount) return 1;
      if (bBuyAmount < aBuyAmount) return -1;
      return 0;
    });
  }

  /**
   * Check token approval status
   */
  async checkApproval(
    tokenAddress: string,
    ownerAddress: string,
    spenderAddress: string,
    requiredAmount: string
  ): Promise<ApprovalStatus> {
    if (!this.provider) {
      throw new SwapError(SwapErrorType.NETWORK_ERROR, 'Provider not initialized');
    }

    // Native token doesn't need approval
    if (this.isNativeToken(tokenAddress)) {
      return {
        isApproved: true,
        allowance: ethers.MaxUint256.toString(),
        spender: spenderAddress,
        tokenAddress,
      };
    }

    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);

    const allowance = await tokenContract.allowance(ownerAddress, spenderAddress);
    const isApproved = allowance >= BigInt(requiredAmount);

    return {
      isApproved,
      allowance: allowance.toString(),
      spender: spenderAddress,
      tokenAddress,
    };
  }

  /**
   * Approve token for spending
   */
  async approveToken(
    tokenAddress: string,
    spenderAddress: string,
    amount?: string
  ): Promise<string> {
    if (!this.signer) {
      throw new SwapError(SwapErrorType.NETWORK_ERROR, 'Signer not initialized');
    }

    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);

    const approveAmount = amount ? BigInt(amount) : ethers.MaxUint256;
    const tx = await tokenContract.approve(spenderAddress, approveAmount);
    const receipt = await tx.wait();

    return receipt.hash;
  }

  /**
   * Execute swap transaction
   */
  async executeSwap(request: SwapTransactionRequest): Promise<SwapTransactionResult> {
    if (!this.signer) {
      throw new SwapError(SwapErrorType.NETWORK_ERROR, 'Signer not initialized');
    }

    const { quote, takerAddress, deadline } = request;

    // Check approval if not native token
    if (!this.isNativeToken(quote.sellToken) && quote.allowanceTarget) {
      const approval = await this.checkApproval(
        quote.sellToken,
        takerAddress,
        quote.allowanceTarget,
        quote.sellAmount
      );

      if (!approval.isApproved) {
        throw new SwapError(
          SwapErrorType.INSUFFICIENT_ALLOWANCE,
          'Token approval required before swap'
        );
      }
    }

    // Build transaction
    const tx: ethers.TransactionRequest = {
      to: quote.to,
      data: quote.data,
      value: BigInt(quote.value || '0'),
      gasLimit: BigInt(quote.estimatedGas),
    };

    try {
      const txResponse = await this.signer.sendTransaction(tx);

      return {
        transactionHash: txResponse.hash,
        status: 'pending',
        sellAmount: quote.sellAmount,
        buyAmount: quote.buyAmount,
      };
    } catch (error: any) {
      throw new SwapError(
        SwapErrorType.TRANSACTION_FAILED,
        `Swap transaction failed: ${error.message}`,
        error
      );
    }
  }

  /**
   * Wait for swap transaction confirmation
   */
  async waitForSwap(txHash: string, confirmations: number = 1): Promise<SwapTransactionResult> {
    if (!this.provider) {
      throw new SwapError(SwapErrorType.NETWORK_ERROR, 'Provider not initialized');
    }

    try {
      const receipt = await this.provider.waitForTransaction(txHash, confirmations);

      if (!receipt) {
        throw new SwapError(SwapErrorType.TRANSACTION_FAILED, 'Transaction not found');
      }

      return {
        transactionHash: txHash,
        status: receipt.status === 1 ? 'confirmed' : 'failed',
        sellAmount: '',
        buyAmount: '',
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.gasPrice?.toString(),
      };
    } catch (error: any) {
      if (error instanceof SwapError) {
        throw error;
      }
      throw new SwapError(
        SwapErrorType.TRANSACTION_FAILED,
        `Failed to confirm transaction: ${error.message}`,
        error
      );
    }
  }

  /**
   * Get token info
   */
  async getTokenInfo(tokenAddress: string, chainId: number): Promise<SwapToken> {
    if (!this.provider) {
      throw new SwapError(SwapErrorType.NETWORK_ERROR, 'Provider not initialized');
    }

    // Check if native token
    if (this.isNativeToken(tokenAddress)) {
      const chainConfig = DEX_CONFIG[chainId];
      if (chainConfig) {
        return {
          address: tokenAddress,
          symbol: chainConfig.nativeToken.symbol,
          name: chainConfig.nativeToken.symbol,
          decimals: chainConfig.nativeToken.decimals,
          chainId,
        };
      }
    }

    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);

    try {
      const [symbol, name, decimals] = await Promise.all([
        tokenContract.symbol(),
        tokenContract.name(),
        tokenContract.decimals(),
      ]);

      return {
        address: tokenAddress,
        symbol,
        name,
        decimals: Number(decimals),
        chainId,
      };
    } catch (error: any) {
      throw new SwapError(
        SwapErrorType.INVALID_TOKEN,
        `Failed to get token info: ${error.message}`,
        error
      );
    }
  }

  /**
   * Get token balance
   */
  async getTokenBalance(
    tokenAddress: string,
    ownerAddress: string,
    chainId: number
  ): Promise<string> {
    if (!this.provider) {
      throw new SwapError(SwapErrorType.NETWORK_ERROR, 'Provider not initialized');
    }

    // Native token balance
    if (this.isNativeToken(tokenAddress)) {
      const balance = await this.provider.getBalance(ownerAddress);
      return balance.toString();
    }

    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);

    const balance = await tokenContract.balanceOf(ownerAddress);
    return balance.toString();
  }

  /**
   * Check if token is native token
   */
  private isNativeToken(address: string): boolean {
    return (
      address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' ||
      address.toLowerCase() === '0x0000000000000000000000000000000000000000' ||
      address.toLowerCase() === 'eth'
    );
  }

  /**
   * Calculate price from amounts
   */
  private calculatePrice(sellAmount: string, buyAmount: string): string {
    if (!sellAmount || !buyAmount || sellAmount === '0') {
      return '0';
    }
    const sell = BigInt(sellAmount);
    const buy = BigInt(buyAmount);
    // Price = buyAmount / sellAmount (scaled by 1e18 for precision)
    return ((buy * BigInt(1e18)) / sell).toString();
  }

  /**
   * Handle 0x API errors
   */
  private handleZeroXError(status: number, data: any): SwapError {
    const reason = data?.reason || data?.validationErrors?.[0]?.reason || '';

    if (status === 400) {
      if (reason.includes('INSUFFICIENT_ASSET_LIQUIDITY')) {
        return new SwapError(
          SwapErrorType.INSUFFICIENT_LIQUIDITY,
          'Insufficient liquidity for this swap',
          data
        );
      }
      return new SwapError(SwapErrorType.INVALID_TOKEN, `Invalid request: ${reason}`, data);
    }

    if (status === 429) {
      return new SwapError(SwapErrorType.RATE_LIMIT, 'Rate limit exceeded', data);
    }

    return new SwapError(
      SwapErrorType.NETWORK_ERROR,
      `0x API error (${status}): ${reason || 'Unknown error'}`,
      data
    );
  }

  /**
   * Handle 1inch API errors
   */
  private handleOneInchError(status: number, data: any): SwapError {
    const description = data?.description || data?.error || '';

    if (status === 400) {
      if (description.includes('insufficient liquidity')) {
        return new SwapError(
          SwapErrorType.INSUFFICIENT_LIQUIDITY,
          'Insufficient liquidity for this swap',
          data
        );
      }
      return new SwapError(SwapErrorType.INVALID_TOKEN, `Invalid request: ${description}`, data);
    }

    if (status === 429) {
      return new SwapError(SwapErrorType.RATE_LIMIT, 'Rate limit exceeded', data);
    }

    return new SwapError(
      SwapErrorType.NETWORK_ERROR,
      `1inch API error (${status}): ${description || 'Unknown error'}`,
      data
    );
  }

  /**
   * Estimate gas for swap
   */
  async estimateGas(quote: SwapQuote, takerAddress: string): Promise<string> {
    if (!this.provider) {
      throw new SwapError(SwapErrorType.NETWORK_ERROR, 'Provider not initialized');
    }

    try {
      const gasEstimate = await this.provider.estimateGas({
        from: takerAddress,
        to: quote.to,
        data: quote.data,
        value: BigInt(quote.value || '0'),
      });

      // Add 20% buffer for safety
      return ((gasEstimate * BigInt(120)) / BigInt(100)).toString();
    } catch (error: any) {
      // Fall back to quote's estimated gas
      return quote.estimatedGas;
    }
  }

  /**
   * Get price impact percentage
   */
  calculatePriceImpact(sellAmount: string, buyAmount: string, marketPrice: string): string {
    if (!marketPrice || marketPrice === '0') {
      return '0';
    }

    const expectedBuyAmount = (BigInt(sellAmount) * BigInt(marketPrice)) / BigInt(1e18);
    const actualBuyAmount = BigInt(buyAmount);

    if (expectedBuyAmount === BigInt(0)) {
      return '0';
    }

    const impact = ((expectedBuyAmount - actualBuyAmount) * BigInt(10000)) / expectedBuyAmount;
    return (Number(impact) / 100).toFixed(2);
  }
}

// Singleton instance
let dexServiceInstance: DEXAggregatorService | null = null;

export const getDEXAggregatorService = (): DEXAggregatorService => {
  if (!dexServiceInstance) {
    dexServiceInstance = new DEXAggregatorService();
  }
  return dexServiceInstance;
};

export default DEXAggregatorService;
