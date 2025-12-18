/**
 * BaseHardwareWalletAdapter
 * Abstract base class for hardware wallet adapters
 */

import {
  HardwareWalletDevice,
  HardwareWalletAccount,
  SignTransactionParams,
  SignedTransaction,
  SignMessageParams,
  SignTypedDataParams,
  ConnectionType,
  HardwareWalletError,
} from './types';

export abstract class BaseHardwareWalletAdapter {
  protected device: HardwareWalletDevice | null = null;
  protected isConnected: boolean = false;

  /**
   * Scan for available devices
   */
  abstract scanDevices(connectionType: ConnectionType): Promise<HardwareWalletDevice[]>;

  /**
   * Connect to a specific device
   */
  abstract connect(device: HardwareWalletDevice): Promise<void>;

  /**
   * Disconnect from the current device
   */
  abstract disconnect(): Promise<void>;

  /**
   * Get accounts from the device using derivation paths
   */
  abstract getAccounts(
    basePath: string,
    startIndex: number,
    count: number
  ): Promise<HardwareWalletAccount[]>;

  /**
   * Sign a transaction
   */
  abstract signTransaction(params: SignTransactionParams, path: string): Promise<SignedTransaction>;

  /**
   * Sign a personal message (eth_sign / personal_sign)
   */
  abstract signMessage(params: SignMessageParams): Promise<string>;

  /**
   * Sign EIP-712 typed data
   */
  abstract signTypedData(params: SignTypedDataParams): Promise<string>;

  /**
   * Verify address on device display
   */
  abstract verifyAddress(address: string, path: string): Promise<boolean>;

  /**
   * Get the connected device info
   */
  getDevice(): HardwareWalletDevice | null {
    return this.device;
  }

  /**
   * Check if connected
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Create a standardized error
   */
  protected createError(
    code: HardwareWalletError['code'],
    message: string,
    originalError?: unknown
  ): HardwareWalletError {
    return {
      code,
      message,
      originalError,
    };
  }

  /**
   * Derive full path from base path and index
   */
  protected derivePath(basePath: string, index: number): string {
    // Handle different path formats
    if (basePath.endsWith("'")) {
      // Ledger Live format: m/44'/60'/X'/0/0
      return `${basePath.slice(0, -1)}${index}'/0/0`;
    }
    // Standard BIP44: m/44'/60'/0'/0/X
    return `${basePath}/${index}`;
  }
}
