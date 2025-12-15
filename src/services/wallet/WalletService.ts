/**
 * WalletService
 * Handles wallet creation, import, and export operations
 */

import { ethers } from 'ethers';
import * as bip39 from 'bip39';
import { SecureStorageService } from './SecureStorageService';
import CryptoService from './CryptoService';

export class WalletError extends Error {
  type: string;

  constructor(message: string, type: string = 'UNKNOWN') {
    super(message);
    this.name = 'WalletError';
    this.type = type;
  }
}

export interface WalletInfo {
  address: string;
}

export interface ImportedWallet extends WalletInfo {
  mnemonic?: string;
  privateKey: string;
}

export interface ExportedWallet {
  address: string;
  mnemonic?: string;
  privateKey: string;
}

export class WalletService {
  private secureStorage: SecureStorageService;
  private cryptoService: CryptoService;

  constructor() {
    this.secureStorage = new SecureStorageService();
    this.cryptoService = new CryptoService();
  }

  /**
   * Generate a new wallet with mnemonic
   */
  async generateWallet(): Promise<ImportedWallet> {
    try {
      // Generate 12-word mnemonic
      const mnemonic = bip39.generateMnemonic(128); // 128 bits = 12 words

      // Create wallet from mnemonic
      const hdNode = ethers.Wallet.fromPhrase(mnemonic);

      return {
        address: hdNode.address,
        privateKey: hdNode.privateKey,
        mnemonic,
      };
    } catch (error) {
      throw new WalletError(
        `Failed to generate wallet: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GENERATION_FAILED'
      );
    }
  }

  /**
   * Import wallet from mnemonic phrase
   */
  async importFromMnemonic(mnemonic: string): Promise<ImportedWallet> {
    // Validate mnemonic
    if (!this.validateMnemonic(mnemonic)) {
      throw new WalletError('Invalid mnemonic phrase', 'INVALID_MNEMONIC');
    }

    try {
      // Create wallet from mnemonic
      const hdNode = ethers.Wallet.fromPhrase(mnemonic);

      return {
        address: hdNode.address,
        privateKey: hdNode.privateKey,
        mnemonic,
      };
    } catch (error) {
      throw new WalletError(
        `Failed to import from mnemonic: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'IMPORT_FAILED'
      );
    }
  }

  /**
   * Import wallet from private key
   */
  async importFromPrivateKey(privateKey: string): Promise<ImportedWallet> {
    // Validate private key
    if (!this.validatePrivateKey(privateKey)) {
      throw new WalletError('Invalid private key', 'INVALID_PRIVATE_KEY');
    }

    try {
      // Ensure private key has 0x prefix
      const cleanKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;

      // Create wallet from private key
      const wallet = new ethers.Wallet(cleanKey);

      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
      };
    } catch (error) {
      throw new WalletError(
        `Failed to import from private key: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'IMPORT_FAILED'
      );
    }
  }

  /**
   * Save wallet to secure storage (encrypted)
   */
  async saveWallet(
    wallet: ImportedWallet,
    pin: string,
    walletName: string = 'default'
  ): Promise<void> {
    try {
      // Derive encryption key from PIN
      const encryptionKey = await this.cryptoService.pbkdf2(pin, wallet.address);

      // Encrypt and store private key
      const encryptedPrivateKey = await this.cryptoService.encrypt(
        wallet.privateKey,
        encryptionKey
      );
      await this.secureStorage.storePrivateKey(wallet.address, encryptedPrivateKey);

      // Encrypt and store mnemonic if available
      if (wallet.mnemonic) {
        const encryptedMnemonic = await this.cryptoService.encrypt(wallet.mnemonic, encryptionKey);
        await this.secureStorage.storeMnemonic(walletName, encryptedMnemonic);
      }

      // Store wallet address (not encrypted)
      await this.secureStorage.storeWalletAddress(wallet.address);

      // Store wallet metadata
      const metadata = {
        name: walletName,
        address: wallet.address,
        hasMnemonic: !!wallet.mnemonic,
        createdAt: new Date().toISOString(),
      };

      await this.secureStorage.set(`wallet:${walletName}:metadata`, JSON.stringify(metadata));
    } catch (error) {
      throw new WalletError(
        `Failed to save wallet: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SAVE_FAILED'
      );
    }
  }

  /**
   * Export wallet mnemonic (requires PIN verification)
   */
  async exportMnemonic(pin: string, walletName: string = 'default'): Promise<string> {
    try {
      // Get wallet address
      const address = await this.secureStorage.getWalletAddress();
      if (!address) {
        throw new WalletError('No wallet found', 'WALLET_NOT_FOUND');
      }

      // Get encrypted mnemonic
      const encryptedMnemonic = await this.secureStorage.getMnemonic(walletName);
      if (!encryptedMnemonic) {
        throw new WalletError('No mnemonic found for this wallet', 'MNEMONIC_NOT_FOUND');
      }

      // Derive decryption key from PIN
      const encryptionKey = await this.cryptoService.pbkdf2(pin, address);

      // Decrypt mnemonic
      const mnemonic = await this.cryptoService.decrypt(encryptedMnemonic, encryptionKey);

      return mnemonic;
    } catch (error) {
      if (error instanceof WalletError) {
        throw error;
      }
      throw new WalletError(
        `Failed to export mnemonic: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EXPORT_FAILED'
      );
    }
  }

  /**
   * Export wallet private key (requires PIN verification)
   */
  async exportPrivateKey(pin: string): Promise<string> {
    try {
      // Get wallet address
      const address = await this.secureStorage.getWalletAddress();
      if (!address) {
        throw new WalletError('No wallet found', 'WALLET_NOT_FOUND');
      }

      // Get encrypted private key
      const encryptedPrivateKey = await this.secureStorage.getPrivateKey(address);
      if (!encryptedPrivateKey) {
        throw new WalletError('No private key found', 'PRIVATE_KEY_NOT_FOUND');
      }

      // Derive decryption key from PIN
      const encryptionKey = await this.cryptoService.pbkdf2(pin, address);

      // Decrypt private key
      const privateKey = await this.cryptoService.decrypt(encryptedPrivateKey, encryptionKey);

      return privateKey;
    } catch (error) {
      if (error instanceof WalletError) {
        throw error;
      }
      throw new WalletError(
        `Failed to export private key: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EXPORT_FAILED'
      );
    }
  }

  /**
   * Get full wallet export (mnemonic + private key)
   */
  async exportWallet(pin: string): Promise<ExportedWallet> {
    try {
      const address = await this.secureStorage.getWalletAddress();

      if (!address) {
        throw new WalletError('No wallet found', 'WALLET_NOT_FOUND');
      }

      const privateKey = await this.exportPrivateKey(pin);
      let mnemonic: string | undefined;

      try {
        mnemonic = await this.exportMnemonic(pin);
      } catch (error) {
        // Mnemonic is optional - wallet might have been imported from private key
        console.log('No mnemonic available for export');
      }

      return {
        address,
        privateKey,
        mnemonic,
      };
    } catch (error) {
      if (error instanceof WalletError) {
        throw error;
      }
      throw new WalletError(
        `Failed to export wallet: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EXPORT_FAILED'
      );
    }
  }

  /**
   * Check if wallet exists
   */
  async hasWallet(): Promise<boolean> {
    const address = await this.secureStorage.getWalletAddress();
    return !!address;
  }

  /**
   * Get wallet address without requiring PIN
   */
  async getWalletAddress(): Promise<string | null> {
    return this.secureStorage.getWalletAddress();
  }

  /**
   * Delete wallet from storage
   */
  async deleteWallet(walletName: string = 'default'): Promise<void> {
    try {
      const address = await this.secureStorage.getWalletAddress();
      if (address) {
        await this.secureStorage.deletePrivateKey(address);
      }
      await this.secureStorage.deleteMnemonic(walletName);
      await this.secureStorage.deleteWalletAddress();
    } catch (error) {
      throw new WalletError(
        `Failed to delete wallet: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DELETE_FAILED'
      );
    }
  }

  /**
   * Validate mnemonic phrase
   */
  validateMnemonic(mnemonic: string): boolean {
    if (!mnemonic || typeof mnemonic !== 'string') {
      return false;
    }

    // Trim and normalize whitespace
    const normalized = mnemonic.trim().replace(/\s+/g, ' ').toLowerCase();

    // Check if it's valid BIP39 mnemonic
    return bip39.validateMnemonic(normalized);
  }

  /**
   * Validate private key
   */
  validatePrivateKey(privateKey: string): boolean {
    if (!privateKey || typeof privateKey !== 'string') {
      return false;
    }

    // Remove 0x prefix if present
    const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;

    // Private key should be 64 hex characters
    if (cleanKey.length !== 64) {
      return false;
    }

    // Check if it's valid hex
    if (!/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
      return false;
    }

    // Try to create wallet to verify it's valid
    try {
      new ethers.Wallet(`0x${cleanKey}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get mnemonic word count
   */
  getMnemonicWordCount(mnemonic: string): number {
    return mnemonic.trim().split(/\s+/).length;
  }

  /**
   * Check if mnemonic has valid word count (12, 15, 18, 21, or 24 words)
   */
  isValidMnemonicWordCount(wordCount: number): boolean {
    return [12, 15, 18, 21, 24].includes(wordCount);
  }

  /**
   * Derive multiple accounts from mnemonic (HD Wallet)
   */
  async deriveAccountsFromMnemonic(
    mnemonic: string,
    count: number = 5,
    startIndex: number = 0
  ): Promise<WalletInfo[]> {
    if (!this.validateMnemonic(mnemonic)) {
      throw new WalletError('Invalid mnemonic phrase', 'INVALID_MNEMONIC');
    }

    try {
      const accounts: WalletInfo[] = [];

      // Create HD Node from mnemonic
      const hdNode = ethers.Wallet.fromPhrase(mnemonic);

      // Derive accounts using BIP44 path: m/44'/60'/0'/0/i
      // 60' is for Ethereum (see https://github.com/satoshilabs/slips/blob/master/slip-0044.md)
      for (let i = startIndex; i < startIndex + count; i++) {
        const path = `m/44'/60'/0'/0/${i}`;
        const derivedNode = hdNode.derivePath(path);

        accounts.push({
          address: derivedNode.address,
        });
      }

      return accounts;
    } catch (error) {
      throw new WalletError(
        `Failed to derive accounts: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DERIVATION_FAILED'
      );
    }
  }
}

export default WalletService;
