/**
 * E2E Tests: Transaction Flow
 */

import { by, device, element, expect } from 'detox';

describe('Transaction Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      launchArgs: {
        detoxEnableSynchronization: 0,
      },
    });
    // Assume wallet is already set up
  });

  beforeEach(async () => {
    await device.reloadReactNative();
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
