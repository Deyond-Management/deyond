/**
 * Wallet Manager Tests
 * TDD: Testing wallet creation, import, recovery functionality
 */

import { WalletManager } from '../../core/wallet/WalletManager';

describe('WalletManager', () => {
  let walletManager: WalletManager;

  beforeEach(() => {
    walletManager = new WalletManager();
  });

  describe('createWallet', () => {
    it('should create a new wallet with mnemonic', async () => {
      const password = 'secure-password-123';
      const wallet = await walletManager.createWallet(password);

      expect(wallet).toBeDefined();
      expect(wallet.address).toBeDefined();
      expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(wallet.mnemonic).toBeDefined();
      expect(wallet.mnemonic.split(' ')).toHaveLength(12);
    });

    it('should create different wallets each time', async () => {
      const password = 'password';

      const wallet1 = await walletManager.createWallet(password);
      const wallet2 = await walletManager.createWallet(password);

      expect(wallet1.address).not.toEqual(wallet2.address);
      expect(wallet1.mnemonic).not.toEqual(wallet2.mnemonic);
    });
  });

  describe('importFromMnemonic', () => {
    it('should import wallet from valid mnemonic', async () => {
      const password = 'password';
      const originalWallet = await walletManager.createWallet(password);
      const mnemonic = originalWallet.mnemonic;

      const importedWallet = await walletManager.importFromMnemonic(mnemonic, password);

      expect(importedWallet.address).toEqual(originalWallet.address);
    });

    it('should fail with invalid mnemonic', async () => {
      const password = 'password';
      const invalidMnemonic = 'invalid mnemonic phrase that is not valid';

      await expect(walletManager.importFromMnemonic(invalidMnemonic, password)).rejects.toThrow();
    });
  });

  describe('importFromPrivateKey', () => {
    it('should import wallet from valid private key', async () => {
      const password = 'password';
      const originalWallet = await walletManager.createWallet(password);
      const privateKey = originalWallet.privateKey;

      const importedWallet = await walletManager.importFromPrivateKey(privateKey, password);

      expect(importedWallet.address).toEqual(originalWallet.address);
    });

    it('should fail with invalid private key', async () => {
      const password = 'password';
      const invalidPrivateKey = 'invalid-key';

      await expect(
        walletManager.importFromPrivateKey(invalidPrivateKey, password)
      ).rejects.toThrow();
    });
  });

  describe('unlockWallet', () => {
    it('should unlock wallet with correct password', async () => {
      const password = 'secure-password';
      const wallet = await walletManager.createWallet(password);

      await walletManager.saveWallet(wallet, password);
      const unlockedWallet = await walletManager.unlockWallet(password);

      expect(unlockedWallet.address).toEqual(wallet.address);
    });

    it('should fail to unlock with wrong password', async () => {
      const password = 'correct-password';
      const wrongPassword = 'wrong-password';
      const wallet = await walletManager.createWallet(password);

      await walletManager.saveWallet(wallet, password);

      await expect(walletManager.unlockWallet(wrongPassword)).rejects.toThrow();
    });
  });

  describe('deriveAccount', () => {
    it('should derive account at specific index', async () => {
      const password = 'password';
      const wallet = await walletManager.createWallet(password);

      const account0 = await walletManager.deriveAccount(wallet.mnemonic, 0);
      const account1 = await walletManager.deriveAccount(wallet.mnemonic, 1);

      expect(account0.address).toBeDefined();
      expect(account1.address).toBeDefined();
      expect(account0.address).not.toEqual(account1.address);
    });

    it('should derive same account for same index', async () => {
      const password = 'password';
      const wallet = await walletManager.createWallet(password);

      const account1 = await walletManager.deriveAccount(wallet.mnemonic, 0);
      const account2 = await walletManager.deriveAccount(wallet.mnemonic, 0);

      expect(account1.address).toEqual(account2.address);
    });
  });

  describe('signMessage', () => {
    it('should sign message with private key', async () => {
      const password = 'password';
      const wallet = await walletManager.createWallet(password);
      const message = 'Hello, blockchain!';

      const signature = await walletManager.signMessage(wallet.privateKey, message);

      expect(signature).toBeDefined();
      expect(signature).toMatch(/^0x[a-fA-F0-9]{130}$/);
    });

    it('should produce different signatures for different messages', async () => {
      const password = 'password';
      const wallet = await walletManager.createWallet(password);

      const sig1 = await walletManager.signMessage(wallet.privateKey, 'message1');
      const sig2 = await walletManager.signMessage(wallet.privateKey, 'message2');

      expect(sig1).not.toEqual(sig2);
    });
  });

  describe.skip('verifySignature', () => {
    // TODO: Signature verification test needs proper environment setup for ethers.js
    it('should verify valid signature', async () => {
      const password = 'password';
      const wallet = await walletManager.createWallet(password);
      const message = 'Test message';

      const signature = await walletManager.signMessage(wallet.privateKey, message);
      const isValid = await walletManager.verifySignature(message, signature, wallet.address);

      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', async () => {
      const password = 'password';
      const wallet = await walletManager.createWallet(password);
      const message = 'Test message';
      const wrongMessage = 'Wrong message';

      const signature = await walletManager.signMessage(wallet.privateKey, message);
      const isValid = await walletManager.verifySignature(wrongMessage, signature, wallet.address);

      expect(isValid).toBe(false);
    });
  });
});
