/**
 * LedgerAdapter
 * Hardware wallet adapter for Ledger devices
 * Supports Nano S, Nano X, Nano S Plus via Bluetooth and USB
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

// Ledger-specific types
interface LedgerDevice {
  deviceId: string;
  name: string;
  productId: number;
}

// Simulated Ledger transport for demo mode
class MockLedgerTransport {
  private deviceId: string;
  private isOpen: boolean = false;

  constructor(deviceId: string) {
    this.deviceId = deviceId;
  }

  static async isSupported(): Promise<boolean> {
    return true;
  }

  static async list(): Promise<LedgerDevice[]> {
    // In real implementation, this would scan for Ledger devices
    // For demo, return mock devices
    return [
      { deviceId: 'ledger-nano-x-001', name: 'Ledger Nano X', productId: 0x4015 },
      { deviceId: 'ledger-nano-s-plus-001', name: 'Ledger Nano S Plus', productId: 0x5015 },
    ];
  }

  static async open(device: LedgerDevice): Promise<MockLedgerTransport> {
    const transport = new MockLedgerTransport(device.deviceId);
    transport.isOpen = true;
    return transport;
  }

  async close(): Promise<void> {
    this.isOpen = false;
  }

  async send(cla: number, ins: number, p1: number, p2: number, data?: Buffer): Promise<Buffer> {
    // Simulate Ledger APDU responses
    // In real implementation, this would communicate with the device
    return Buffer.from([0x90, 0x00]); // Success status
  }

  get deviceModel(): { productName: string } {
    return { productName: 'Nano X' };
  }
}

export class LedgerAdapter extends BaseHardwareWalletAdapter {
  private transport: MockLedgerTransport | null = null;
  private connectionType: ConnectionType = 'bluetooth';

  /**
   * Scan for available Ledger devices
   */
  async scanDevices(connectionType: ConnectionType): Promise<HardwareWalletDevice[]> {
    this.connectionType = connectionType;

    try {
      const isSupported = await MockLedgerTransport.isSupported();
      if (!isSupported) {
        throw this.createError(
          HardwareWalletErrorCode.USB_NOT_SUPPORTED,
          'Ledger transport not supported on this device'
        );
      }

      const devices = await MockLedgerTransport.list();

      return devices.map(device => ({
        id: device.deviceId,
        type: 'ledger' as const,
        name: device.name,
        model: this.getModelName(device.productId),
        connectionType,
      }));
    } catch (error) {
      if ((error as { code?: string }).code === HardwareWalletErrorCode.USB_NOT_SUPPORTED) {
        throw error;
      }
      throw this.createError(
        HardwareWalletErrorCode.DEVICE_NOT_FOUND,
        'Failed to scan for Ledger devices',
        error
      );
    }
  }

  /**
   * Connect to a Ledger device
   */
  async connect(device: HardwareWalletDevice): Promise<void> {
    try {
      const devices = await MockLedgerTransport.list();
      const targetDevice = devices.find(d => d.deviceId === device.id);

      if (!targetDevice) {
        throw this.createError(HardwareWalletErrorCode.DEVICE_NOT_FOUND, 'Ledger device not found');
      }

      this.transport = await MockLedgerTransport.open(targetDevice);
      this.device = {
        ...device,
        firmwareVersion: '2.1.0', // Would be fetched from device
      };
      this.isConnected = true;
    } catch (error) {
      this.isConnected = false;
      throw this.createError(
        HardwareWalletErrorCode.CONNECTION_FAILED,
        'Failed to connect to Ledger device',
        error
      );
    }
  }

  /**
   * Disconnect from the Ledger device
   */
  async disconnect(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }
    this.device = null;
    this.isConnected = false;
  }

  /**
   * Get accounts from the Ledger device
   */
  async getAccounts(
    basePath: string = BIP44_PATH.ETHEREUM,
    startIndex: number = 0,
    count: number = DEFAULT_ACCOUNT_COUNT
  ): Promise<HardwareWalletAccount[]> {
    if (!this.isConnected || !this.transport) {
      throw this.createError(
        HardwareWalletErrorCode.CONNECTION_LOST,
        'Not connected to Ledger device'
      );
    }

    const accounts: HardwareWalletAccount[] = [];

    for (let i = startIndex; i < startIndex + count; i++) {
      const path = this.derivePath(basePath, i);

      try {
        // In real implementation, this would call the Ledger Ethereum app
        // to derive the address from the path
        const address = await this.deriveAddress(path);

        accounts.push({
          address,
          path,
          index: i,
        });
      } catch (error) {
        throw this.createError(
          HardwareWalletErrorCode.APP_NOT_OPEN,
          'Please open the Ethereum app on your Ledger',
          error
        );
      }
    }

    return accounts;
  }

  /**
   * Sign a transaction on the Ledger
   */
  async signTransaction(params: SignTransactionParams, path: string): Promise<SignedTransaction> {
    if (!this.isConnected || !this.transport) {
      throw this.createError(
        HardwareWalletErrorCode.CONNECTION_LOST,
        'Not connected to Ledger device'
      );
    }

    try {
      // Build unsigned transaction
      const unsignedTx: ethers.TransactionLike = {
        to: params.to,
        value: ethers.parseEther(params.value),
        data: params.data || '0x',
        nonce: params.nonce,
        gasLimit: BigInt(params.gasLimit),
        chainId: params.chainId,
      };

      // Add gas pricing (EIP-1559 or legacy)
      if (params.maxFeePerGas && params.maxPriorityFeePerGas) {
        unsignedTx.maxFeePerGas = BigInt(params.maxFeePerGas);
        unsignedTx.maxPriorityFeePerGas = BigInt(params.maxPriorityFeePerGas);
        unsignedTx.type = 2;
      } else if (params.gasPrice) {
        unsignedTx.gasPrice = BigInt(params.gasPrice);
        unsignedTx.type = 0;
      }

      // In real implementation, the transaction would be serialized
      // and sent to the Ledger for signing
      // The user would confirm on the device
      const signature = await this.signOnDevice(unsignedTx, path);

      // Combine transaction with signature
      const signedTx = ethers.Transaction.from({
        ...unsignedTx,
        signature: {
          v: signature.v,
          r: signature.r,
          s: signature.s,
        },
      });

      return {
        rawTransaction: signedTx.serialized,
        hash: signedTx.hash || '',
        v: signature.v,
        r: signature.r,
        s: signature.s,
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
        'Failed to sign transaction on Ledger',
        error
      );
    }
  }

  /**
   * Sign a personal message
   */
  async signMessage(params: SignMessageParams): Promise<string> {
    if (!this.isConnected || !this.transport) {
      throw this.createError(
        HardwareWalletErrorCode.CONNECTION_LOST,
        'Not connected to Ledger device'
      );
    }

    try {
      // In real implementation, the message would be sent to the Ledger
      // and the user would confirm on the device
      const messageHash = ethers.hashMessage(params.message);

      // Simulate signing (in real impl, this comes from the device)
      const mockSignature = await this.mockSign(messageHash, params.path);

      return mockSignature;
    } catch (error) {
      if (this.isUserRejection(error)) {
        throw this.createError(
          HardwareWalletErrorCode.USER_REJECTED,
          'Message signing rejected by user'
        );
      }
      throw this.createError(
        HardwareWalletErrorCode.SIGNING_FAILED,
        'Failed to sign message on Ledger',
        error
      );
    }
  }

  /**
   * Sign EIP-712 typed data
   */
  async signTypedData(params: SignTypedDataParams): Promise<string> {
    if (!this.isConnected || !this.transport) {
      throw this.createError(
        HardwareWalletErrorCode.CONNECTION_LOST,
        'Not connected to Ledger device'
      );
    }

    try {
      // In real implementation, the typed data would be sent to the Ledger
      // for EIP-712 signing
      const typedDataHash = ethers.TypedDataEncoder.hash(
        params.domain,
        params.types,
        params.message
      );

      // Simulate signing
      const mockSignature = await this.mockSign(typedDataHash, params.path);

      return mockSignature;
    } catch (error) {
      if (this.isUserRejection(error)) {
        throw this.createError(
          HardwareWalletErrorCode.USER_REJECTED,
          'Typed data signing rejected by user'
        );
      }
      throw this.createError(
        HardwareWalletErrorCode.SIGNING_FAILED,
        'Failed to sign typed data on Ledger',
        error
      );
    }
  }

  /**
   * Verify address on device display
   */
  async verifyAddress(address: string, path: string): Promise<boolean> {
    if (!this.isConnected || !this.transport) {
      throw this.createError(
        HardwareWalletErrorCode.CONNECTION_LOST,
        'Not connected to Ledger device'
      );
    }

    try {
      // In real implementation, this would display the address on the Ledger
      // and wait for user confirmation
      const derivedAddress = await this.deriveAddress(path);

      return derivedAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      throw this.createError(
        HardwareWalletErrorCode.INVALID_PATH,
        'Failed to verify address on Ledger',
        error
      );
    }
  }

  // Private helper methods

  private getModelName(productId: number): string {
    const models: Record<number, string> = {
      0x0001: 'Nano S',
      0x4015: 'Nano X',
      0x5015: 'Nano S Plus',
      0x6015: 'Stax',
    };
    return models[productId] || 'Unknown';
  }

  private async deriveAddress(path: string): Promise<string> {
    // In real implementation, this would communicate with the Ledger
    // to derive the public key and address from the path
    // For demo, generate deterministic addresses based on path
    const pathHash = ethers.keccak256(ethers.toUtf8Bytes(path));
    const address = '0x' + pathHash.slice(26);
    return ethers.getAddress(address);
  }

  private async signOnDevice(
    tx: ethers.TransactionLike,
    _path: string
  ): Promise<{ v: number; r: string; s: string }> {
    // In real implementation, this would send the transaction to the Ledger
    // and wait for user confirmation and signature
    // For demo, return mock signature
    const serializedTx = ethers.Transaction.from(tx).unsignedSerialized;
    const txHash = ethers.keccak256(serializedTx);

    return {
      v: 27,
      r: '0x' + txHash.slice(2, 66),
      s: '0x' + ethers.keccak256(txHash).slice(2, 66),
    };
  }

  private async mockSign(_hash: string, _path: string): Promise<string> {
    // Generate a mock signature for demo purposes
    // In real implementation, this would come from the hardware device
    const r = ethers.hexlify(ethers.randomBytes(32));
    const s = ethers.hexlify(ethers.randomBytes(32));
    const v = 27;

    return ethers.concat([r, s, ethers.toBeHex(v)]);
  }

  private isUserRejection(error: unknown): boolean {
    const errorMessage = (error as Error)?.message?.toLowerCase() || '';
    return (
      errorMessage.includes('rejected') ||
      errorMessage.includes('denied') ||
      errorMessage.includes('cancelled')
    );
  }
}
