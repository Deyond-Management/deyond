/**
 * DApp Browser Types
 * Type definitions for DApp browser functionality
 */

export interface DAppBookmark {
  id: string;
  name: string;
  url: string;
  icon?: string;
  description?: string;
  category?: string;
  addedAt: number;
}

export interface BrowserHistory {
  id: string;
  url: string;
  title: string;
  visitedAt: number;
  favicon?: string;
}

export interface BrowserTab {
  id: string;
  url: string;
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
}

/**
 * Web3 Provider Request Types
 */
export type Web3Method =
  | 'eth_requestAccounts'
  | 'eth_accounts'
  | 'eth_chainId'
  | 'eth_sendTransaction'
  | 'eth_signTransaction'
  | 'eth_sign'
  | 'personal_sign'
  | 'eth_signTypedData'
  | 'eth_signTypedData_v4'
  | 'wallet_switchEthereumChain'
  | 'wallet_addEthereumChain';

export interface Web3Request {
  id: number | string;
  method: Web3Method;
  params?: any[];
}

export interface Web3Response {
  id: number | string;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

export interface TransactionRequest {
  from?: string;
  to?: string;
  value?: string;
  gas?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  data?: string;
  nonce?: string;
}

export interface SignRequest {
  address: string;
  message: string;
  isTypedData?: boolean;
  typedData?: any;
}

/**
 * Popular DApps
 */
export const POPULAR_DAPPS: DAppBookmark[] = [
  {
    id: 'uniswap',
    name: 'Uniswap',
    url: 'https://app.uniswap.org',
    description: 'Decentralized exchange',
    category: 'DeFi',
    addedAt: Date.now(),
  },
  {
    id: 'aave',
    name: 'Aave',
    url: 'https://app.aave.com',
    description: 'Lending & borrowing protocol',
    category: 'DeFi',
    addedAt: Date.now(),
  },
  {
    id: 'opensea',
    name: 'OpenSea',
    url: 'https://opensea.io',
    description: 'NFT marketplace',
    category: 'NFT',
    addedAt: Date.now(),
  },
  {
    id: 'compound',
    name: 'Compound',
    url: 'https://app.compound.finance',
    description: 'Decentralized lending',
    category: 'DeFi',
    addedAt: Date.now(),
  },
  {
    id: 'pancakeswap',
    name: 'PancakeSwap',
    url: 'https://pancakeswap.finance',
    description: 'DEX on BSC',
    category: 'DeFi',
    addedAt: Date.now(),
  },
];
