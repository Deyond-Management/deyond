/**
 * DEX Swap Types
 * Type definitions for DEX aggregator integration
 */

/**
 * Supported DEX aggregators
 */
export type DEXAggregator = '0x' | '1inch' | 'paraswap';

/**
 * Swap quote request
 */
export interface SwapQuoteRequest {
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  slippagePercentage?: number;
  takerAddress?: string;
  chainId: number;
  skipValidation?: boolean;
}

/**
 * Swap quote response
 */
export interface SwapQuote {
  aggregator: DEXAggregator;
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  buyAmount: string;
  price: string;
  guaranteedPrice?: string;
  estimatedPriceImpact?: string;
  sources: SwapSource[];
  gas: string;
  gasPrice: string;
  estimatedGas: string;
  protocolFee?: string;
  minimumProtocolFee?: string;
  allowanceTarget?: string;
  to: string;
  data: string;
  value: string;
  sellTokenToEthRate?: string;
  buyTokenToEthRate?: string;
}

/**
 * Liquidity source
 */
export interface SwapSource {
  name: string;
  proportion: string;
}

/**
 * Swap transaction request
 */
export interface SwapTransactionRequest {
  quote: SwapQuote;
  takerAddress: string;
  slippagePercentage: number;
  deadline?: number;
  permitSignature?: string;
}

/**
 * Swap transaction result
 */
export interface SwapTransactionResult {
  transactionHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  sellAmount: string;
  buyAmount: string;
  actualBuyAmount?: string;
  gasUsed?: string;
  effectiveGasPrice?: string;
}

/**
 * Token approval status
 */
export interface ApprovalStatus {
  isApproved: boolean;
  allowance: string;
  spender: string;
  tokenAddress: string;
}

/**
 * Token info for swaps
 */
export interface SwapToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  chainId: number;
}

/**
 * Supported chains for DEX
 */
export interface DEXChainConfig {
  chainId: number;
  name: string;
  zeroxApiUrl: string;
  oneInchApiUrl: string;
  nativeToken: {
    symbol: string;
    address: string;
    decimals: number;
  };
}

/**
 * DEX API configuration
 */
export const DEX_CONFIG: Record<number, DEXChainConfig> = {
  1: {
    chainId: 1,
    name: 'Ethereum',
    zeroxApiUrl: 'https://api.0x.org',
    oneInchApiUrl: 'https://api.1inch.dev/swap/v6.0/1',
    nativeToken: {
      symbol: 'ETH',
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      decimals: 18,
    },
  },
  137: {
    chainId: 137,
    name: 'Polygon',
    zeroxApiUrl: 'https://polygon.api.0x.org',
    oneInchApiUrl: 'https://api.1inch.dev/swap/v6.0/137',
    nativeToken: {
      symbol: 'MATIC',
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      decimals: 18,
    },
  },
  42161: {
    chainId: 42161,
    name: 'Arbitrum',
    zeroxApiUrl: 'https://arbitrum.api.0x.org',
    oneInchApiUrl: 'https://api.1inch.dev/swap/v6.0/42161',
    nativeToken: {
      symbol: 'ETH',
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      decimals: 18,
    },
  },
  10: {
    chainId: 10,
    name: 'Optimism',
    zeroxApiUrl: 'https://optimism.api.0x.org',
    oneInchApiUrl: 'https://api.1inch.dev/swap/v6.0/10',
    nativeToken: {
      symbol: 'ETH',
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      decimals: 18,
    },
  },
  8453: {
    chainId: 8453,
    name: 'Base',
    zeroxApiUrl: 'https://base.api.0x.org',
    oneInchApiUrl: 'https://api.1inch.dev/swap/v6.0/8453',
    nativeToken: {
      symbol: 'ETH',
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      decimals: 18,
    },
  },
  56: {
    chainId: 56,
    name: 'BNB Chain',
    zeroxApiUrl: 'https://bsc.api.0x.org',
    oneInchApiUrl: 'https://api.1inch.dev/swap/v6.0/56',
    nativeToken: {
      symbol: 'BNB',
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      decimals: 18,
    },
  },
  43114: {
    chainId: 43114,
    name: 'Avalanche',
    zeroxApiUrl: 'https://avalanche.api.0x.org',
    oneInchApiUrl: 'https://api.1inch.dev/swap/v6.0/43114',
    nativeToken: {
      symbol: 'AVAX',
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      decimals: 18,
    },
  },
};

/**
 * Default slippage percentage
 */
export const DEFAULT_SLIPPAGE = 0.5; // 0.5%

/**
 * Maximum slippage percentage
 */
export const MAX_SLIPPAGE = 50; // 50%

/**
 * Swap error types
 */
export enum SwapErrorType {
  INSUFFICIENT_LIQUIDITY = 'INSUFFICIENT_LIQUIDITY',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INSUFFICIENT_ALLOWANCE = 'INSUFFICIENT_ALLOWANCE',
  PRICE_IMPACT_TOO_HIGH = 'PRICE_IMPACT_TOO_HIGH',
  SLIPPAGE_TOO_LOW = 'SLIPPAGE_TOO_LOW',
  RATE_LIMIT = 'RATE_LIMIT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_TOKEN = 'INVALID_TOKEN',
  QUOTE_EXPIRED = 'QUOTE_EXPIRED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Swap error class
 */
export class SwapError extends Error {
  type: SwapErrorType;
  details?: any;

  constructor(type: SwapErrorType, message: string, details?: any) {
    super(message);
    this.name = 'SwapError';
    this.type = type;
    this.details = details;
  }
}
