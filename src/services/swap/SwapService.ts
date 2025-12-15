/**
 * SwapService
 * Token swap functionality using DEX aggregators
 */

import { ethers } from 'ethers';
import {
  SwapToken,
  SwapQuote,
  SwapParams,
  SwapHistory,
  TokenList,
  SwapError,
} from '../../types/swap';
import { logger } from '../../utils/Logger';
import { getErrorReporter } from '../error/ErrorReporter';
import { ErrorSeverity, ErrorCategory } from '../../types/error';

// ERC20 ABI for approve and allowance
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
];

// Common token addresses (Ethereum Mainnet)
const COMMON_TOKENS: SwapToken[] = [
  {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    chainId: 1,
  },
  {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    chainId: 1,
  },
  {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    chainId: 1,
  },
  {
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    chainId: 1,
  },
  {
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    decimals: 8,
    chainId: 1,
  },
];

interface SwapServiceConfig {
  apiKey?: string;
  rpcUrl: string;
}

export class SwapService {
  private provider: ethers.JsonRpcProvider;
  private errorReporter = getErrorReporter();
  private apiKey?: string;

  constructor(config: SwapServiceConfig) {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.apiKey = config.apiKey;
  }

  /**
   * Get list of available tokens for swapping
   */
  async getTokenList(chainId: number): Promise<TokenList> {
    try {
      // Filter tokens by chain ID
      const tokens = COMMON_TOKENS.filter(t => t.chainId === chainId);

      return {
        tokens,
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.error('Failed to get token list', error as Error, { chainId });
      this.errorReporter.captureException(error as Error, {
        method: 'getTokenList',
        chainId,
      });
      throw error;
    }
  }

  /**
   * Get swap quote
   */
  async getQuote(params: SwapParams): Promise<SwapQuote> {
    try {
      logger.info('Getting swap quote', { params });

      // Validate parameters
      this.validateSwapParams(params);

      // For demo purposes, calculate a simple quote
      // In production, this would call 1inch or Uniswap API
      const quote = await this.calculateQuote(params);

      logger.info('Got swap quote', { quote });
      return quote;
    } catch (error) {
      logger.error('Failed to get swap quote', error as Error, { params });
      this.errorReporter.report(error as Error, ErrorSeverity.MEDIUM, ErrorCategory.NETWORK, {
        method: 'getQuote',
        params,
      });
      throw error;
    }
  }

  /**
   * Check token allowance
   */
  async checkAllowance(
    tokenAddress: string,
    ownerAddress: string,
    spenderAddress: string
  ): Promise<string> {
    try {
      // Native ETH doesn't need approval
      if (this.isNativeToken(tokenAddress)) {
        return ethers.MaxUint256.toString();
      }

      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      const allowance = await contract.allowance(ownerAddress, spenderAddress);

      return allowance.toString();
    } catch (error) {
      logger.error('Failed to check allowance', error as Error, {
        tokenAddress,
        ownerAddress,
        spenderAddress,
      });
      throw error;
    }
  }

  /**
   * Create approve transaction
   */
  async createApproveTransaction(
    tokenAddress: string,
    spenderAddress: string,
    amount: string
  ): Promise<ethers.TransactionRequest> {
    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI);
      const data = contract.interface.encodeFunctionData('approve', [spenderAddress, amount]);

      return {
        to: tokenAddress,
        data,
        value: 0,
      };
    } catch (error) {
      logger.error('Failed to create approve transaction', error as Error, {
        tokenAddress,
        spenderAddress,
        amount,
      });
      throw error;
    }
  }

  /**
   * Execute swap
   */
  async executeSwap(
    params: SwapParams,
    signer: ethers.Signer
  ): Promise<{ txHash: string; swapHistory: SwapHistory }> {
    try {
      logger.info('Executing swap', { params });

      // Get quote first
      const quote = await this.getQuote(params);

      if (!quote.tx) {
        throw new Error('No transaction data in quote');
      }

      // Check allowance if not native token
      if (!this.isNativeToken(params.fromTokenAddress)) {
        const allowance = await this.checkAllowance(
          params.fromTokenAddress,
          params.fromAddress,
          quote.tx.to
        );

        const requiredAmount = BigInt(params.amount);
        if (BigInt(allowance) < requiredAmount) {
          throw new Error(SwapError.APPROVAL_REQUIRED);
        }
      }

      // Execute transaction
      const tx = await signer.sendTransaction(quote.tx);
      const receipt = await tx.wait();

      if (!receipt || receipt.status === 0) {
        throw new Error(SwapError.TRANSACTION_FAILED);
      }

      // Create swap history record
      const swapHistory: SwapHistory = {
        id: receipt.hash,
        fromToken: quote.fromToken,
        toToken: quote.toToken,
        fromAmount: quote.fromAmount,
        toAmount: quote.toAmount,
        txHash: receipt.hash,
        status: 'confirmed',
        timestamp: Date.now(),
        chainId: params.chainId,
      };

      logger.info('Swap executed successfully', { txHash: receipt.hash });

      return {
        txHash: receipt.hash,
        swapHistory,
      };
    } catch (error) {
      logger.error('Failed to execute swap', error as Error, { params });
      this.errorReporter.report(error as Error, ErrorSeverity.HIGH, ErrorCategory.BLOCKCHAIN, {
        method: 'executeSwap',
        params,
      });
      throw error;
    }
  }

  /**
   * Calculate swap quote (demo implementation)
   * In production, this should call actual DEX API
   */
  private async calculateQuote(params: SwapParams): Promise<SwapQuote> {
    const tokenList = await this.getTokenList(params.chainId);

    const fromToken = tokenList.tokens.find(
      t => t.address.toLowerCase() === params.fromTokenAddress.toLowerCase()
    );
    const toToken = tokenList.tokens.find(
      t => t.address.toLowerCase() === params.toTokenAddress.toLowerCase()
    );

    if (!fromToken || !toToken) {
      throw new Error('Token not found');
    }

    // Demo: Calculate simple 1:1 ratio for stablecoins, or use mock price
    // In production, use actual DEX pricing
    const priceRatio = this.getMockPriceRatio(fromToken.symbol, toToken.symbol);
    const fromAmountBN = BigInt(params.amount);
    const toAmountBN = (fromAmountBN * BigInt(Math.floor(priceRatio * 1e18))) / BigInt(1e18);

    // Apply slippage
    const slippageMultiplier = BigInt(Math.floor((100 - params.slippage) * 1e16));
    const toAmountWithSlippage = (toAmountBN * slippageMultiplier) / BigInt(1e18);

    // Calculate price impact (mock - in production, get from DEX)
    // For demo, use a random value between 0.1% and 2%
    const priceImpact = (Math.random() * 1.9 + 0.1).toFixed(2);

    return {
      fromToken,
      toToken,
      fromAmount: params.amount,
      toAmount: toAmountWithSlippage.toString(),
      estimatedGas: '200000',
      priceImpact,
      tx: {
        from: params.fromAddress,
        to: '0x1111111254EEB25477B68fb85Ed929f73A960582', // 1inch router
        data: '0x', // Would be actual swap calldata
        value: this.isNativeToken(params.fromTokenAddress) ? params.amount : '0',
        gas: '200000',
      },
    };
  }

  /**
   * Mock price ratio for demo
   */
  private getMockPriceRatio(fromSymbol: string, toSymbol: string): number {
    // Mock prices (1 token = X USD)
    const prices: Record<string, number> = {
      ETH: 2000,
      USDC: 1,
      USDT: 1,
      DAI: 1,
      WBTC: 40000,
    };

    const fromPrice = prices[fromSymbol] || 1;
    const toPrice = prices[toSymbol] || 1;

    return fromPrice / toPrice;
  }

  /**
   * Check if token is native (ETH, BNB, etc.)
   */
  private isNativeToken(address: string): boolean {
    return address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
  }

  /**
   * Validate swap parameters
   */
  private validateSwapParams(params: SwapParams): void {
    if (!params.fromTokenAddress || !params.toTokenAddress) {
      throw new Error('Invalid token addresses');
    }

    if (params.fromTokenAddress.toLowerCase() === params.toTokenAddress.toLowerCase()) {
      throw new Error('Cannot swap same token');
    }

    if (!params.amount || BigInt(params.amount) <= 0) {
      throw new Error('Invalid amount');
    }

    if (params.slippage < 0 || params.slippage > 50) {
      throw new Error('Invalid slippage');
    }
  }
}

// Singleton instance factory
let swapService: SwapService | null = null;

export const getSwapService = (config?: SwapServiceConfig): SwapService => {
  if (!swapService && config) {
    swapService = new SwapService(config);
  }
  if (!swapService) {
    throw new Error('SwapService not initialized');
  }
  return swapService;
};

export default SwapService;
