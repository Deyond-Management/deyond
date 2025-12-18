/**
 * Wallet Types
 * Core type definitions for wallet functionality
 */

export interface Wallet {
  id: string;
  name: string;
  address: string;
  publicKey: string;
  createdAt: number;
  updatedAt: number;
}

export interface Account {
  address: string;
  publicKey: string;
  index: number;
  name: string;
  balance: string;
}

export type NetworkType = 'evm' | 'solana' | 'bitcoin' | 'cosmos';

export interface Network {
  id: string;
  name: string;
  chainId: number | string;
  rpcUrl: string;
  currencySymbol: string;
  blockExplorerUrl?: string;
  isTestnet: boolean;
  networkType: NetworkType;
  decimals: number;
  coinType?: number; // BIP44 coin type
}

export interface Transaction {
  id: string;
  hash?: string;
  from: string;
  to: string;
  value: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce: number;
  chainId: number;
  status: TransactionStatus;
  timestamp: number;
  confirmations?: number;
}

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
}

export interface Token {
  address: string;
  symbol: string;
  decimals: number;
  name: string;
  balance: string;
  chainId: number;
  logoUrl?: string;
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
  tag?: string;
}

export interface SecureVault {
  encryptedPrivateKey: EncryptedData;
  encryptedSeedPhrase?: EncryptedData;
  version: string;
}
