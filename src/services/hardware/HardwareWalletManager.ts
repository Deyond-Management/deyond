/**
 * HardwareWalletManager
 * Unified manager for all hardware wallet operations
 * Uses adapter pattern to support multiple wallet types
 */

import { BaseHardwareWalletAdapter } from './BaseHardwareWalletAdapter';
import { LedgerAdapter } from './LedgerAdapter';
import { TrezorAdapter } from './TrezorAdapter';
import {
  HardwareWalletType,
  HardwareWalletDevice,
  HardwareWalletAccount,
  SignTransactionParams,
  SignedTransaction,
  SignMessageParams,
  SignTypedDataParams,
  ConnectionType,
  HardwareWalletErrorCode,
  BIP44_PATH,
  DEFAULT_ACCOUNT_COUNT,
} from './types';

class HardwareWalletManager {
  private adapters: Map<HardwareWalletType, BaseHardwareWalletAdapter>;
  private activeAdapter: BaseHardwareWalletAdapter | null = null;
  private activeWalletType: HardwareWalletType | null = null;

  constructor() {
    this.adapters = new Map([
      ['ledger', new LedgerAdapter()],
      ['trezor', new TrezorAdapter()],
    ]);
  }

  /**
   * Get the list of supported wallet types
   */
  getSupportedWalletTypes(): HardwareWalletType[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Scan for available devices of a specific type
   */
  async scanDevices(
    walletType: HardwareWalletType,
    connectionType: ConnectionType
  ): Promise<HardwareWalletDevice[]> {
    const adapter = this.adapters.get(walletType);
    if (!adapter) {
      throw this.createError(
        HardwareWalletErrorCode.UNKNOWN,
        `Unsupported wallet type: ${walletType}`
      );
    }

    return adapter.scanDevices(connectionType);
  }

  /**
   * Scan for all available devices (both Ledger and Trezor)
   */
  async scanAllDevices(connectionType: ConnectionType): Promise<HardwareWalletDevice[]> {
    const allDevices: HardwareWalletDevice[] = [];

    for (const [type, adapter] of this.adapters) {
      try {
        const devices = await adapter.scanDevices(connectionType);
        allDevices.push(...devices);
      } catch (error) {
        // Log error but continue scanning other wallet types
        console.warn(`Failed to scan ${type} devices:`, error);
      }
    }

    return allDevices;
  }

  /**
   * Connect to a specific device
   */
  async connect(device: HardwareWalletDevice): Promise<void> {
    const adapter = this.adapters.get(device.type);
    if (!adapter) {
      throw this.createError(
        HardwareWalletErrorCode.UNKNOWN,
        `Unsupported wallet type: ${device.type}`
      );
    }

    // Disconnect any existing connection
    if (this.activeAdapter) {
      await this.disconnect();
    }

    await adapter.connect(device);
    this.activeAdapter = adapter;
    this.activeWalletType = device.type;
  }

  /**
   * Disconnect from the current device
   */
  async disconnect(): Promise<void> {
    if (this.activeAdapter) {
      await this.activeAdapter.disconnect();
      this.activeAdapter = null;
      this.activeWalletType = null;
    }
  }

  /**
   * Check if connected to any device
   */
  isConnected(): boolean {
    return this.activeAdapter?.getConnectionStatus() ?? false;
  }

  /**
   * Get the currently connected device
   */
  getConnectedDevice(): HardwareWalletDevice | null {
    return this.activeAdapter?.getDevice() ?? null;
  }

  /**
   * Get the connected wallet type
   */
  getConnectedWalletType(): HardwareWalletType | null {
    return this.activeWalletType;
  }

  /**
   * Get accounts from the connected device
   */
  async getAccounts(
    basePath: string = BIP44_PATH.ETHEREUM,
    startIndex: number = 0,
    count: number = DEFAULT_ACCOUNT_COUNT
  ): Promise<HardwareWalletAccount[]> {
    this.ensureConnected();
    return this.activeAdapter!.getAccounts(basePath, startIndex, count);
  }

  /**
   * Sign a transaction
   */
  async signTransaction(params: SignTransactionParams, path: string): Promise<SignedTransaction> {
    this.ensureConnected();
    return this.activeAdapter!.signTransaction(params, path);
  }

  /**
   * Sign a personal message
   */
  async signMessage(params: SignMessageParams): Promise<string> {
    this.ensureConnected();
    return this.activeAdapter!.signMessage(params);
  }

  /**
   * Sign EIP-712 typed data
   */
  async signTypedData(params: SignTypedDataParams): Promise<string> {
    this.ensureConnected();
    return this.activeAdapter!.signTypedData(params);
  }

  /**
   * Verify address on device display
   */
  async verifyAddress(address: string, path: string): Promise<boolean> {
    this.ensureConnected();
    return this.activeAdapter!.verifyAddress(address, path);
  }

  /**
   * Get default derivation path for the connected wallet type
   */
  getDefaultPath(): string {
    if (this.activeWalletType === 'ledger') {
      return BIP44_PATH.LEDGER_LIVE;
    }
    return BIP44_PATH.ETHEREUM;
  }

  /**
   * Get available derivation path options
   */
  getPathOptions(): Array<{ label: string; value: string }> {
    return [
      { label: 'Standard (BIP44)', value: BIP44_PATH.ETHEREUM },
      { label: 'Ledger Live', value: BIP44_PATH.LEDGER_LIVE },
      { label: 'Legacy', value: BIP44_PATH.LEGACY },
    ];
  }

  // Private helper methods

  private ensureConnected(): void {
    if (!this.activeAdapter || !this.activeAdapter.getConnectionStatus()) {
      throw this.createError(
        HardwareWalletErrorCode.CONNECTION_LOST,
        'No hardware wallet connected'
      );
    }
  }

  private createError(code: HardwareWalletErrorCode, message: string) {
    return {
      code,
      message,
    };
  }
}

// Export singleton instance
export const hardwareWalletManager = new HardwareWalletManager();
export default HardwareWalletManager;
