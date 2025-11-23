/**
 * Wallet Manager
 * Core wallet functionality: create, import, derive accounts, sign messages
 */

import { Wallet, HDNodeWallet } from 'ethers';
import * as bip39 from 'bip39';
import { CryptoUtils } from '../crypto/CryptoUtils';
import { SecureVault, Account } from '../../types/wallet';

export interface WalletData {
  address: string;
  privateKey: string;
  publicKey: string;
  mnemonic: string;
}

export class WalletManager {
  private static readonly DERIVATION_PATH = "m/44'/60'/0'/0";
  private static readonly VAULT_VERSION = '1.0.0';
  private static instance: WalletManager | null = null;
  private vault: SecureVault | null = null;

  /**
   * Get singleton instance of WalletManager
   */
  static getInstance(): WalletManager {
    if (!WalletManager.instance) {
      WalletManager.instance = new WalletManager();
    }
    return WalletManager.instance;
  }

  /**
   * Validate mnemonic phrase
   */
  validateMnemonic(mnemonic: string): boolean {
    return bip39.validateMnemonic(mnemonic);
  }

  /**
   * Create a new wallet with random mnemonic
   */
  async createWallet(password: string): Promise<WalletData> {
    try {
      // Generate random mnemonic (12 words)
      const mnemonic = bip39.generateMnemonic(128);

      // Create HD wallet from mnemonic
      const hdWallet = Wallet.fromPhrase(mnemonic);

      return {
        address: hdWallet.address,
        privateKey: hdWallet.privateKey,
        publicKey: hdWallet.publicKey,
        mnemonic,
      };
    } catch (error) {
      throw new Error(
        `Failed to create wallet: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Import wallet from mnemonic phrase
   */
  async importFromMnemonic(mnemonic: string, password: string): Promise<WalletData> {
    try {
      // Validate mnemonic
      if (!bip39.validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }

      // Create HD wallet from mnemonic
      const hdWallet = Wallet.fromPhrase(mnemonic);

      return {
        address: hdWallet.address,
        privateKey: hdWallet.privateKey,
        publicKey: hdWallet.publicKey,
        mnemonic,
      };
    } catch (error) {
      throw new Error(
        `Failed to import from mnemonic: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Import wallet from private key
   */
  async importFromPrivateKey(privateKey: string, password: string): Promise<WalletData> {
    try {
      // Create wallet from private key
      const wallet = new Wallet(privateKey);

      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        publicKey: wallet.publicKey,
        mnemonic: '', // No mnemonic for private key import
      };
    } catch (error) {
      throw new Error(
        `Failed to import from private key: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Save wallet to encrypted vault
   */
  async saveWallet(walletData: WalletData, password: string): Promise<void> {
    try {
      // Encrypt private key
      const encryptedPrivateKey = await CryptoUtils.encrypt(walletData.privateKey, password);

      // Encrypt seed phrase if available
      let encryptedSeedPhrase;
      if (walletData.mnemonic) {
        encryptedSeedPhrase = await CryptoUtils.encrypt(walletData.mnemonic, password);
      }

      // Create vault
      this.vault = {
        encryptedPrivateKey,
        encryptedSeedPhrase,
        version: WalletManager.VAULT_VERSION,
      };
    } catch (error) {
      throw new Error(
        `Failed to save wallet: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Unlock wallet with password
   */
  async unlockWallet(password: string): Promise<WalletData> {
    try {
      if (!this.vault) {
        throw new Error('No wallet found');
      }

      // Decrypt private key
      const privateKey = await CryptoUtils.decrypt(this.vault.encryptedPrivateKey, password);

      // Decrypt seed phrase if available
      let mnemonic = '';
      if (this.vault.encryptedSeedPhrase) {
        mnemonic = await CryptoUtils.decrypt(this.vault.encryptedSeedPhrase, password);
      }

      // Recreate wallet
      const wallet = new Wallet(privateKey);

      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        publicKey: wallet.publicKey,
        mnemonic,
      };
    } catch (error) {
      throw new Error(
        `Failed to unlock wallet: ${error instanceof Error ? error.message : 'Incorrect password'}`
      );
    }
  }

  /**
   * Derive account at specific index from mnemonic
   */
  async deriveAccount(mnemonic: string, index: number): Promise<Account> {
    try {
      if (!bip39.validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }

      // Derive HD wallet at index
      const path = `${WalletManager.DERIVATION_PATH}/${index}`;
      const hdWallet = HDNodeWallet.fromPhrase(mnemonic, undefined, path);

      return {
        address: hdWallet.address,
        publicKey: hdWallet.publicKey,
        index,
        name: `Account ${index + 1}`,
        balance: '0',
      };
    } catch (error) {
      throw new Error(
        `Failed to derive account: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Sign message with private key
   */
  async signMessage(privateKey: string, message: string): Promise<string> {
    try {
      const wallet = new Wallet(privateKey);
      const signature = await wallet.signMessage(message);
      return signature;
    } catch (error) {
      throw new Error(
        `Failed to sign message: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Verify message signature
   */
  async verifySignature(message: string, signature: string, address: string): Promise<boolean> {
    try {
      const recoveredAddress = Wallet.recoverAddress(
        Wallet.hashMessage(message),
        signature
      );
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      return false;
    }
  }
}
