/**
 * TrezorAdapter
 * Hardware wallet adapter for Trezor devices
 * Supports Trezor One, Model T, Model R, Safe 3/5
 */

import { ethers } from 'ethers';
import { BaseHardwareWalletAdapter } from './BaseHardwareWalletAdapter';
import {
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

// Trezor-specific types
interface TrezorDevice {
  path: string;
  session: string | null;
  features: {
    device_id: string;
    model: string;
    label: string;
    major_version: number;
    minor_version: number;
    patch_version: number;
  } | null;
}

// Simulated Trezor Connect for demo mode
class MockTrezorConnect {
  private static initialized = false;

  static async init(): Promise<void> {
    this.initialized = true;
  }

  static async getDevices(): Promise<TrezorDevice[]> {
    // In real implementation, this would scan for Trezor devices
    // For demo, return mock devices
    return [
      {
        path: 'trezor-model-t-001',
        session: null,
        features: {
          device_id: 'trezor-001',
          model: 'T',
          label: 'My Trezor',
          major_version: 2,
          minor_version: 6,
          patch_version: 0,
        },
      },
      {
        path: 'trezor-safe-3-001',
        session: null,
        features: {
          device_id: 'trezor-002',
          model: 'Safe 3',
          label: 'Trezor Safe',
          major_version: 3,
          minor_version: 0,
          patch_version: 0,
        },
      },
    ];
  }

  static async getPublicKey(params: {
    path: string;
    coin: string;
  }): Promise<{ success: boolean; payload: { publicKey: string; chainCode: string } }> {
    // Mock public key derivation
    const hash = ethers.keccak256(ethers.toUtf8Bytes(params.path));
    return {
      success: true,
      payload: {
        publicKey: '04' + hash.slice(2) + hash.slice(2),
        chainCode: hash,
      },
    };
  }

  static async ethereumGetAddress(params: {
    path: string;
    showOnTrezor: boolean;
  }): Promise<{ success: boolean; payload: { address: string } }> {
    // Mock address derivation
    const pathHash = ethers.keccak256(ethers.toUtf8Bytes(params.path));
    const address = '0x' + pathHash.slice(26);
    return {
      success: true,
      payload: {
        address: ethers.getAddress(address),
      },
    };
  }

  static async ethereumSignTransaction(params: {
    path: string;
    transaction: {
      to: string;
      value: string;
      data: string;
      chainId: number;
      nonce: string;
      gasLimit: string;
      maxFeePerGas?: string;
      maxPriorityFeePerGas?: string;
      gasPrice?: string;
    };
  }): Promise<{ success: boolean; payload: { v: string; r: string; s: string } }> {
    // Mock transaction signing
    const txHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(params.transaction)));
    return {
      success: true,
      payload: {
        v: '0x1b',
        r: '0x' + txHash.slice(2, 66),
        s: '0x' + ethers.keccak256(txHash).slice(2, 66),
      },
    };
  }

  static async ethereumSignMessage(params: {
    path: string;
    message: string;
  }): Promise<{ success: boolean; payload: { signature: string } }> {
    // Mock message signing
    const msgHash = ethers.hashMessage(params.message);
    return {
      success: true,
      payload: {
        signature: msgHash + '1b',
      },
    };
  }

  static async ethereumSignTypedData(params: {
    path: string;
    data: unknown;
    metamask_v4_compat: boolean;
  }): Promise<{ success: boolean; payload: { signature: string } }> {
    // Mock typed data signing
    const dataHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(params.data)));
    return {
      success: true,
      payload: {
        signature: dataHash + '1b',
      },
    };
  }

  static dispose(): void {
    this.initialized = false;
  }
}

export class TrezorAdapter extends BaseHardwareWalletAdapter {
  private trezorDevice: TrezorDevice | null = null;

  /**
   * Scan for available Trezor devices
   */
  async scanDevices(connectionType: ConnectionType): Promise<HardwareWalletDevice[]> {
    // Trezor primarily uses USB, but newer models support Bluetooth
    if (connectionType === 'bluetooth') {
      // Only newer Trezor models support Bluetooth
      console.warn('Bluetooth support limited to newer Trezor models');
    }

    try {
      await MockTrezorConnect.init();
      const devices = await MockTrezorConnect.getDevices();

      return devices
        .filter(device => device.features !== null)
        .map(device => ({
          id: device.path,
          type: 'trezor' as const,
          name: device.features!.label || 'Trezor',
          model: this.getModelName(device.features!.model),
          firmwareVersion: `${device.features!.major_version}.${device.features!.minor_version}.${device.features!.patch_version}`,
          connectionType,
        }));
    } catch (error) {
      throw this.createError(
        HardwareWalletErrorCode.DEVICE_NOT_FOUND,
        'Failed to scan for Trezor devices',
        error
      );
    }
  }

  /**
   * Connect to a Trezor device
   */
  async connect(device: HardwareWalletDevice): Promise<void> {
    try {
      await MockTrezorConnect.init();
      const devices = await MockTrezorConnect.getDevices();
      const targetDevice = devices.find(d => d.path === device.id);

      if (!targetDevice) {
        throw this.createError(HardwareWalletErrorCode.DEVICE_NOT_FOUND, 'Trezor device not found');
      }

      this.trezorDevice = targetDevice;
      this.device = device;
      this.isConnected = true;
    } catch (error) {
      this.isConnected = false;
      throw this.createError(
        HardwareWalletErrorCode.CONNECTION_FAILED,
        'Failed to connect to Trezor device',
        error
      );
    }
  }

  /**
   * Disconnect from the Trezor device
   */
  async disconnect(): Promise<void> {
    MockTrezorConnect.dispose();
    this.trezorDevice = null;
    this.device = null;
    this.isConnected = false;
  }

  /**
   * Get accounts from the Trezor device
   */
  async getAccounts(
    basePath: string = BIP44_PATH.ETHEREUM,
    startIndex: number = 0,
    count: number = DEFAULT_ACCOUNT_COUNT
  ): Promise<HardwareWalletAccount[]> {
    if (!this.isConnected || !this.trezorDevice) {
      throw this.createError(
        HardwareWalletErrorCode.CONNECTION_LOST,
        'Not connected to Trezor device'
      );
    }

    const accounts: HardwareWalletAccount[] = [];

    for (let i = startIndex; i < startIndex + count; i++) {
      const path = this.derivePath(basePath, i);

      try {
        const result = await MockTrezorConnect.ethereumGetAddress({
          path,
          showOnTrezor: false,
        });

        if (!result.success) {
          throw new Error('Failed to get address from Trezor');
        }

        accounts.push({
          address: result.payload.address,
          path,
          index: i,
        });
      } catch (error) {
        throw this.createError(
          HardwareWalletErrorCode.INVALID_PATH,
          'Failed to derive address from Trezor',
          error
        );
      }
    }

    return accounts;
  }

  /**
   * Sign a transaction on the Trezor
   */
  async signTransaction(params: SignTransactionParams, path: string): Promise<SignedTransaction> {
    if (!this.isConnected || !this.trezorDevice) {
      throw this.createError(
        HardwareWalletErrorCode.CONNECTION_LOST,
        'Not connected to Trezor device'
      );
    }

    try {
      const transaction: {
        to: string;
        value: string;
        data: string;
        chainId: number;
        nonce: string;
        gasLimit: string;
        maxFeePerGas?: string;
        maxPriorityFeePerGas?: string;
        gasPrice?: string;
      } = {
        to: params.to,
        value: ethers.toBeHex(ethers.parseEther(params.value)),
        data: params.data || '0x',
        chainId: params.chainId,
        nonce: ethers.toBeHex(params.nonce),
        gasLimit: ethers.toBeHex(params.gasLimit),
      };

      // Add gas pricing
      if (params.maxFeePerGas && params.maxPriorityFeePerGas) {
        transaction.maxFeePerGas = ethers.toBeHex(params.maxFeePerGas);
        transaction.maxPriorityFeePerGas = ethers.toBeHex(params.maxPriorityFeePerGas);
      } else if (params.gasPrice) {
        transaction.gasPrice = ethers.toBeHex(params.gasPrice);
      }

      const result = await MockTrezorConnect.ethereumSignTransaction({
        path,
        transaction,
      });

      if (!result.success) {
        throw new Error('Transaction signing failed');
      }

      const { v, r, s } = result.payload;

      // Build signed transaction
      const signedTx = ethers.Transaction.from({
        to: params.to,
        value: ethers.parseEther(params.value),
        data: params.data || '0x',
        nonce: params.nonce,
        gasLimit: BigInt(params.gasLimit),
        chainId: params.chainId,
        ...(params.maxFeePerGas
          ? {
              maxFeePerGas: BigInt(params.maxFeePerGas),
              maxPriorityFeePerGas: BigInt(params.maxPriorityFeePerGas!),
              type: 2,
            }
          : { gasPrice: BigInt(params.gasPrice!), type: 0 }),
        signature: {
          v: parseInt(v, 16),
          r,
          s,
        },
      });

      return {
        rawTransaction: signedTx.serialized,
        hash: signedTx.hash || '',
        v: parseInt(v, 16),
        r,
        s,
      };
    } catch (error) {
      if (this.isUserRejection(error)) {
        throw this.createError(
          HardwareWalletErrorCode.USER_REJECTED,
          'Transaction rejected by user'
        );
      }
      throw this.createError(
        HardwareWalletErrorCode.SIGNING_FAILED,
        'Failed to sign transaction on Trezor',
        error
      );
    }
  }

  /**
   * Sign a personal message
   */
  async signMessage(params: SignMessageParams): Promise<string> {
    if (!this.isConnected || !this.trezorDevice) {
      throw this.createError(
        HardwareWalletErrorCode.CONNECTION_LOST,
        'Not connected to Trezor device'
      );
    }

    try {
      const result = await MockTrezorConnect.ethereumSignMessage({
        path: params.path,
        message: params.message,
      });

      if (!result.success) {
        throw new Error('Message signing failed');
      }

      return result.payload.signature;
    } catch (error) {
      if (this.isUserRejection(error)) {
        throw this.createError(
          HardwareWalletErrorCode.USER_REJECTED,
          'Message signing rejected by user'
        );
      }
      throw this.createError(
        HardwareWalletErrorCode.SIGNING_FAILED,
        'Failed to sign message on Trezor',
        error
      );
    }
  }

  /**
   * Sign EIP-712 typed data
   */
  async signTypedData(params: SignTypedDataParams): Promise<string> {
    if (!this.isConnected || !this.trezorDevice) {
      throw this.createError(
        HardwareWalletErrorCode.CONNECTION_LOST,
        'Not connected to Trezor device'
      );
    }

    try {
      const data = {
        types: params.types,
        primaryType: params.primaryType,
        domain: params.domain,
        message: params.message,
      };

      const result = await MockTrezorConnect.ethereumSignTypedData({
        path: params.path,
        data,
        metamask_v4_compat: true,
      });

      if (!result.success) {
        throw new Error('Typed data signing failed');
      }

      return result.payload.signature;
    } catch (error) {
      if (this.isUserRejection(error)) {
        throw this.createError(
          HardwareWalletErrorCode.USER_REJECTED,
          'Typed data signing rejected by user'
        );
      }
      throw this.createError(
        HardwareWalletErrorCode.SIGNING_FAILED,
        'Failed to sign typed data on Trezor',
        error
      );
    }
  }

  /**
   * Verify address on device display
   */
  async verifyAddress(address: string, path: string): Promise<boolean> {
    if (!this.isConnected || !this.trezorDevice) {
      throw this.createError(
        HardwareWalletErrorCode.CONNECTION_LOST,
        'Not connected to Trezor device'
      );
    }

    try {
      const result = await MockTrezorConnect.ethereumGetAddress({
        path,
        showOnTrezor: true, // This shows the address on the device
      });

      if (!result.success) {
        throw new Error('Address verification failed');
      }

      return result.payload.address.toLowerCase() === address.toLowerCase();
    } catch (error) {
      throw this.createError(
        HardwareWalletErrorCode.INVALID_PATH,
        'Failed to verify address on Trezor',
        error
      );
    }
  }

  // Private helper methods

  private getModelName(model: string): string {
    const models: Record<string, string> = {
      '1': 'Trezor One',
      T: 'Model T',
      R: 'Model R',
      'Safe 3': 'Safe 3',
      'Safe 5': 'Safe 5',
    };
    return models[model] || `Trezor ${model}`;
  }

  private isUserRejection(error: unknown): boolean {
    const errorMessage = (error as Error)?.message?.toLowerCase() || '';
    return (
      errorMessage.includes('rejected') ||
      errorMessage.includes('denied') ||
      errorMessage.includes('cancelled') ||
      errorMessage.includes('canceled')
    );
  }
}
