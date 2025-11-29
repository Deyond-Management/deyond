/**
 * E2E Tests: Transaction Flow
 */

import { by, device, element, expect, waitFor } from 'detox';

// Helper function to complete onboarding
async function completeOnboarding() {
  // Wait for welcome screen
  await waitFor(element(by.id('welcome-container')))
    .toBeVisible()
    .withTimeout(5000);

  // Create wallet
  await element(by.id('create-wallet-button')).tap();

  // Create password
  await waitFor(element(by.id('password-input')))
    .toBeVisible()
    .withTimeout(2000);
  await element(by.id('password-input')).typeText('StrongP@ss123');
  await element(by.id('confirm-password-input')).typeText('StrongP@ss123');
  await element(by.id('create-password-button')).tap();

  // Skip mnemonic screens (tap continue/skip buttons)
  await waitFor(element(by.id('continue-button')))
    .toBeVisible()
    .withTimeout(2000);
  await element(by.id('continue-button')).tap();

  // Skip biometric setup
  await waitFor(element(by.id('skip-button')))
    .toBeVisible()
    .withTimeout(2000);
  await element(by.id('skip-button')).tap();

  // Wait for home screen
  await waitFor(element(by.id('home-screen')))
    .toBeVisible()
    .withTimeout(5000);
}

describe('Transaction Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      delete: true,
    });
    await completeOnboarding();
  });

  beforeEach(async () => {
    // Just reload, don't delete data
    await device.launchApp({
      newInstance: false,
    });
    // Wait for home screen
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });

  describe('Send Transaction', () => {
    it('should navigate to send screen', async () => {
      await element(by.id('send-button')).tap();
      await expect(element(by.text('Send'))).toBeVisible();
    });

    it('should validate recipient address', async () => {
      await element(by.id('send-button')).tap();

      const addressInput = element(by.id('recipient-address-input'));
      await addressInput.typeText('invalid-address');

      await expect(element(by.text('Invalid address'))).toBeVisible();
    });

    it('should show insufficient balance error', async () => {
      await element(by.id('send-button')).tap();

      const addressInput = element(by.id('recipient-address-input'));
      const amountInput = element(by.id('amount-input'));

      await addressInput.typeText('0x742d35Cc6634C0532925a3b844Bc9e7595f5eAb2');
      await amountInput.typeText('999999');

      await expect(element(by.text('Insufficient balance'))).toBeVisible();
    });

    it('should show transaction preview', async () => {
      await element(by.id('send-button')).tap();

      const addressInput = element(by.id('recipient-address-input'));
      const amountInput = element(by.id('amount-input'));

      await addressInput.typeText('0x742d35Cc6634C0532925a3b844Bc9e7595f5eAb2');
      await amountInput.typeText('0.01');
      await element(by.id('continue-button')).tap();

      await expect(element(by.text('Transaction Preview'))).toBeVisible();
      await expect(element(by.id('gas-fee'))).toBeVisible();
    });
  });

  describe('Receive Transaction', () => {
    it('should display QR code and address', async () => {
      await element(by.id('receive-button')).tap();

      await expect(element(by.id('qr-code'))).toBeVisible();
      await expect(element(by.id('wallet-address'))).toBeVisible();
    });

    it('should copy address to clipboard', async () => {
      await element(by.id('receive-button')).tap();
      await element(by.id('copy-address-button')).tap();

      await expect(element(by.text('Address copied'))).toBeVisible();
    });
  });

  describe('Transaction History', () => {
    it('should display transaction list', async () => {
      await element(by.id('history-tab')).tap();

      await expect(element(by.id('transaction-list'))).toBeVisible();
    });

    it('should show transaction details on tap', async () => {
      await element(by.id('history-tab')).tap();
      await element(by.id('transaction-item-0')).tap();

      await expect(element(by.text('Transaction Details'))).toBeVisible();
      await expect(element(by.id('tx-hash'))).toBeVisible();
    });

    it('should filter transactions by type', async () => {
      await element(by.id('history-tab')).tap();
      await element(by.id('filter-sent')).tap();

      // All visible transactions should be sent type
      await expect(element(by.id('sent-indicator'))).toBeVisible();
    });
  });
});
