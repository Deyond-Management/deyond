/**
 * Custom Token Types
 * Type definitions for custom token management
 */

/**
 * Token standard type
 */
export type TokenStandard = 'ERC20' | 'ERC721' | 'ERC1155';

/**
 * Custom token definition
 */
export interface CustomToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId: number;
  logoUrl?: string;
  isCustom: boolean;
  addedAt: number;
  verified?: boolean;
  coingeckoId?: string;
}

/**
 * Token validation result
 */
export interface TokenValidationResult {
  valid: boolean;
  token?: CustomToken;
  error?: string;
}

/**
 * Token balance with extended info
 */
export interface TokenWithBalance extends CustomToken {
  balance: string;
  balanceUsd?: string;
  price?: number;
  priceChange24h?: number;
}

/**
 * Token list storage structure
 */
export interface TokenListStorage {
  version: string;
  tokens: CustomToken[];
  lastUpdated: number;
}

/**
 * Token import options
 */
export interface TokenImportOptions {
  contractAddress: string;
  chainId: number;
  skipValidation?: boolean;
  customName?: string;
  customSymbol?: string;
  customDecimals?: number;
  customLogoUrl?: string;
}

/**
 * Predefined token list info
 */
export interface TokenListInfo {
  name: string;
  url: string;
  version: string;
  logoURI?: string;
  timestamp?: string;
}

/**
 * Token list item from external list
 */
export interface TokenListItem {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
}

/**
 * External token list response
 */
export interface ExternalTokenList {
  name: string;
  timestamp?: string;
  version: {
    major: number;
    minor: number;
    patch: number;
  };
  tokens: TokenListItem[];
  logoURI?: string;
}

/**
 * Token search result
 */
export interface TokenSearchResult {
  tokens: CustomToken[];
  source: 'local' | 'api' | 'tokenList';
}

/**
 * Token error types
 */
export enum TokenErrorType {
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  NOT_ERC20 = 'NOT_ERC20',
  NETWORK_ERROR = 'NETWORK_ERROR',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  NOT_FOUND = 'NOT_FOUND',
  STORAGE_ERROR = 'STORAGE_ERROR',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Token error class
 */
export class TokenError extends Error {
  type: TokenErrorType;
  details?: any;

  constructor(type: TokenErrorType, message: string, details?: any) {
    super(message);
    this.name = 'TokenError';
    this.type = type;
    this.details = details;
  }
}

/**
 * Popular token lists URLs
 */
export const POPULAR_TOKEN_LISTS: TokenListInfo[] = [
  {
    name: 'Uniswap Default',
    url: 'https://gateway.ipfs.io/ipns/tokens.uniswap.org',
    version: '1.0.0',
  },
  {
    name: 'CoinGecko',
    url: 'https://tokens.coingecko.com/uniswap/all.json',
    version: '1.0.0',
  },
  {
    name: '1inch',
    url: 'https://tokens.1inch.io/v1.2/1',
    version: '1.0.0',
  },
  {
    name: 'Compound',
    url: 'https://raw.githubusercontent.com/compound-finance/token-list/master/compound.tokenlist.json',
    version: '1.0.0',
  },
];

/**
 * Common ERC20 ABI for token validation
 */
export const ERC20_VALIDATION_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
];

/**
 * Default tokens by chain (commonly used tokens)
 */
export const DEFAULT_TOKENS: Record<number, CustomToken[]> = {
  // Ethereum Mainnet
  1: [
    {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chainId: 1,
      isCustom: false,
      addedAt: 0,
      verified: true,
      coingeckoId: 'tether',
    },
    {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 1,
      isCustom: false,
      addedAt: 0,
      verified: true,
      coingeckoId: 'usd-coin',
    },
    {
      address: '0x6B175474E89094C44Da98b954EesdfDC5ceBd5c6',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      chainId: 1,
      isCustom: false,
      addedAt: 0,
      verified: true,
      coingeckoId: 'dai',
    },
    {
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      symbol: 'WBTC',
      name: 'Wrapped BTC',
      decimals: 8,
      chainId: 1,
      isCustom: false,
      addedAt: 0,
      verified: true,
      coingeckoId: 'wrapped-bitcoin',
    },
  ],
  // Polygon
  137: [
    {
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chainId: 137,
      isCustom: false,
      addedAt: 0,
      verified: true,
      coingeckoId: 'tether',
    },
    {
      address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 137,
      isCustom: false,
      addedAt: 0,
      verified: true,
      coingeckoId: 'usd-coin',
    },
  ],
  // BNB Chain
  56: [
    {
      address: '0x55d398326f99059fF775485246999027B3197955',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 18,
      chainId: 56,
      isCustom: false,
      addedAt: 0,
      verified: true,
      coingeckoId: 'tether',
    },
    {
      address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 18,
      chainId: 56,
      isCustom: false,
      addedAt: 0,
      verified: true,
      coingeckoId: 'usd-coin',
    },
  ],
};
