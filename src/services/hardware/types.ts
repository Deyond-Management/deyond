/**
 * Hardware Wallet Types
 * Type definitions for hardware wallet integration
 */

export type HardwareWalletType = 'ledger' | 'trezor';
export type ConnectionType = 'bluetooth' | 'usb';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface HardwareWalletDevice {
  id: string;
  type: HardwareWalletType;
  name: string;
  model?: string;
  firmwareVersion?: string;
  connectionType: ConnectionType;
}

export interface HardwareWalletAccount {
  address: string;
  path: string;
  index: number;
  balance?: string;
  name?: string;
}

export interface HardwareWalletState {
  device: HardwareWalletDevice | null;
  status: ConnectionStatus;
  accounts: HardwareWalletAccount[];
  selectedAccount: HardwareWalletAccount | null;
  error: string | null;
  isScanning: boolean;
  availableDevices: HardwareWalletDevice[];
}

export interface SignTransactionParams {
  to: string;
  value: string;
  data?: string;
  nonce: number;
  gasLimit: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  gasPrice?: string;
  chainId: number;
}

export interface SignedTransaction {
  rawTransaction: string;
  hash: string;
  v: number;
  r: string;
  s: string;
}

export interface SignMessageParams {
  message: string;
  path: string;
}

export interface SignTypedDataParams {
  domain: {
    name?: string;
    version?: string;
    chainId?: number;
    verifyingContract?: string;
    salt?: string;
  };
  types: Record<string, Array<{ name: string; type: string }>>;
  primaryType: string;
  message: Record<string, unknown>;
  path: string;
}

export interface HardwareWalletError {
  code: HardwareWalletErrorCode;
  message: string;
  originalError?: unknown;
}

export enum HardwareWalletErrorCode {
  // Connection errors
  DEVICE_NOT_FOUND = 'DEVICE_NOT_FOUND',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  CONNECTION_LOST = 'CONNECTION_LOST',
  BLUETOOTH_DISABLED = 'BLUETOOTH_DISABLED',
  USB_NOT_SUPPORTED = 'USB_NOT_SUPPORTED',

  // Device errors
  DEVICE_LOCKED = 'DEVICE_LOCKED',
  WRONG_APP = 'WRONG_APP',
  APP_NOT_OPEN = 'APP_NOT_OPEN',
  OUTDATED_FIRMWARE = 'OUTDATED_FIRMWARE',

  // User errors
  USER_REJECTED = 'USER_REJECTED',
  TIMEOUT = 'TIMEOUT',

  // Transaction errors
  INVALID_PATH = 'INVALID_PATH',
  INVALID_TRANSACTION = 'INVALID_TRANSACTION',
  SIGNING_FAILED = 'SIGNING_FAILED',

  // Unknown
  UNKNOWN = 'UNKNOWN',
}

// BIP44 derivation path constants
export const BIP44_PATH = {
  ETHEREUM: "m/44'/60'/0'/0",
  LEDGER_LIVE: "m/44'/60'",
  LEGACY: "m/44'/60'/0'",
};

export const DEFAULT_ACCOUNT_COUNT = 5;
