/**
 * Global Type Definitions
 * Common types used across the application
 */

// Wallet Types
export interface Wallet {
  address: string;
  name: string;
  balance: string;
  tokens: Token[];
}

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  price: number;
  change24h: number;
  iconUrl?: string;
}

// Transaction Types
export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasLimit: string;
  nonce: number;
  data?: string;
  timestamp: number;
  status: TransactionStatus;
  type: TransactionType;
  tokenSymbol?: string;
}

export type TransactionStatus = 'pending' | 'confirmed' | 'failed';
export type TransactionType = 'send' | 'receive' | 'swap' | 'approve' | 'contract';

// Network Types
export interface Network {
  id: string;
  name: string;
  chainId: number;
  rpcUrl: string;
  symbol: string;
  explorerUrl: string;
  isTestnet: boolean;
}

// Gas Types
export interface GasPrice {
  slow: string;
  standard: string;
  fast: string;
}

export interface GasEstimate {
  gasLimit: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  estimatedCost: string;
}

// Theme Types
export interface Theme {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  success: string;
  error: string;
  warning: string;
  divider: string;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export interface ThemeTypography {
  fontFamily: string;
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
}

// Navigation Types
export type RootStackParamList = {
  Welcome: undefined;
  Home: undefined;
  Send: { tokenAddress?: string };
  Receive: undefined;
  Settings: undefined;
  SecuritySettings: undefined;
  TransactionHistory: undefined;
  TransactionPreview: {
    to: string;
    amount: string;
    tokenAddress?: string;
  };
  TransactionStatus: {
    txHash: string;
    status: TransactionStatus;
  };
  ChatHome: undefined;
  DeviceDiscovery: undefined;
  DeviceConnection: {
    device: {
      id: string;
      name: string;
      rssi: number;
      address: string;
    };
  };
  ChatConversation: {
    sessionId: string;
    peerName: string;
    peerAddress: string;
  };
};

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
