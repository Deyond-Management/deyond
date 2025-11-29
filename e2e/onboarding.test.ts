/**
 * E2E Tests: Onboarding Flow
 */

import { by, device, element, expect, waitFor } from 'detox';

describe('Onboarding Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' },
    });
  });

  beforeEach(async () => {
    await device.launchApp({
      newInstance: true,
      delete: true, // Delete app data to start fresh
    });
    // Wait for app to initialize
    await waitFor(element(by.id('welcome-container')))
      .toBeVisible()
      .withTimeout(5000);
  });

  describe('Welcome Screen', () => {
    it('should show welcome screen on first launch', async () => {
      await expect(element(by.text('Welcome to Deyond Wallet'))).toBeVisible();
      await expect(element(by.id('create-wallet-button'))).toBeVisible();
      await expect(element(by.id('import-wallet-button'))).toBeVisible();
    });

    it('should navigate to create wallet flow', async () => {
      await element(by.id('create-wallet-button')).tap();
      await expect(element(by.text('Create Password'))).toBeVisible();
    });
  });

  describe('Create Wallet Flow', () => {
    beforeEach(async () => {
      await element(by.id('create-wallet-button')).tap();
    });

    it('should validate password requirements', async () => {
      const passwordInput = element(by.id('password-input'));
      await passwordInput.typeText('weak');
      await expect(element(by.text('Password must be at least 8 characters'))).toBeVisible();
    });

    it('should create wallet with valid password', async () => {
      const passwordInput = element(by.id('password-input'));
      const confirmInput = element(by.id('confirm-password-input'));

      await passwordInput.typeText('StrongP@ss123');
      await confirmInput.typeText('StrongP@ss123');
      await element(by.id('create-password-button')).tap();

      // Should show mnemonic display
      await expect(element(by.text('Recovery Phrase'))).toBeVisible();
    });

    it('should display 12-word mnemonic', async () => {
      const passwordInput = element(by.id('password-input'));
      const confirmInput = element(by.id('confirm-password-input'));

      await passwordInput.typeText('StrongP@ss123');
      await confirmInput.typeText('StrongP@ss123');
      await element(by.id('create-password-button')).tap();

      // Verify mnemonic words are displayed
      await expect(element(by.id('mnemonic-word-1'))).toBeVisible();
      await expect(element(by.id('mnemonic-word-12'))).toBeVisible();
    });
  });

  describe('Import Wallet Flow', () => {
    beforeEach(async () => {
      await element(by.id('import-wallet-button')).tap();
    });

    it('should show import wallet screen', async () => {
      await expect(element(by.text('Import Wallet'))).toBeVisible();
      await expect(element(by.id('mnemonic-input'))).toBeVisible();
    });

    it('should validate mnemonic phrase', async () => {
      const mnemonicInput = element(by.id('mnemonic-input'));
      await mnemonicInput.typeText('invalid mnemonic phrase');
      await element(by.id('import-button')).tap();

      await expect(element(by.text('Invalid recovery phrase'))).toBeVisible();
    });
  });
});
