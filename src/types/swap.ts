/**
 * Token Swap Types
 * Type definitions for token swap functionality
 */

export interface SwapToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  chainId: number;
}

export interface SwapQuote {
  fromToken: SwapToken;
  toToken: SwapToken;
  fromAmount: string;
  toAmount: string;
  estimatedGas: string;
  priceImpact: string; // percentage (e.g., "0.5" for 0.5%)
  protocols?: SwapProtocol[][];
  tx?: SwapTransaction;
}

export interface SwapProtocol {
  name: string;
  part: number;
  fromTokenAddress: string;
  toTokenAddress: string;
}

export interface SwapTransaction {
  from: string;
  to: string;
  data: string;
  value: string;
  gas: string;
  gasPrice?: string;
}

export interface SwapParams {
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  fromAddress: string;
  slippage: number; // percentage (e.g., 1 for 1%)
  chainId: number;
}

export interface SwapHistory {
  id: string;
  fromToken: SwapToken;
  toToken: SwapToken;
  fromAmount: string;
  toAmount: string;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  chainId: number;
}

export interface TokenList {
  tokens: SwapToken[];
  timestamp: number;
}

export interface SwapSettings {
  slippage: number;
  deadline: number; // minutes
  expertMode: boolean;
}

export const DEFAULT_SWAP_SETTINGS: SwapSettings = {
  slippage: 0.5, // 0.5%
  deadline: 20, // 20 minutes
  expertMode: false,
};

export enum SwapError {
  INSUFFICIENT_BALANCE = 'insufficient_balance',
  INSUFFICIENT_LIQUIDITY = 'insufficient_liquidity',
  EXCESSIVE_SLIPPAGE = 'excessive_slippage',
  NETWORK_ERROR = 'network_error',
  TRANSACTION_FAILED = 'transaction_failed',
  APPROVAL_REQUIRED = 'approval_required',
  UNKNOWN_ERROR = 'unknown_error',
}
