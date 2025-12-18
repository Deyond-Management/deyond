/**
 * E2E Tests: Swap Functionality
 * Tests for token swap feature
 */

import { by, device, element, expect, waitFor } from 'detox';
import { completeOnboarding, scrollDown } from './helpers/testHelpers';

describe('Swap Functionality', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      delete: true,
    });
    await completeOnboarding();
  });

  beforeEach(async () => {
    await device.launchApp({
      newInstance: false,
    });
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(5000);
    // Navigate to swap
    await element(by.id('swap-button')).tap();
    await waitFor(element(by.id('swap-screen')))
      .toBeVisible()
      .withTimeout(2000);
  });

  describe('Swap Screen', () => {
    it('should display swap screen', async () => {
      await expect(element(by.id('swap-screen'))).toBeVisible();
    });

    it('should show from and to token selectors', async () => {
      await expect(element(by.id('from-token-selector'))).toBeVisible();
      await expect(element(by.id('to-token-selector'))).toBeVisible();
    });

    it('should show amount input', async () => {
      await expect(element(by.id('swap-amount-input'))).toBeVisible();
    });

    it('should show swap button', async () => {
      await expect(element(by.id('swap-execute-button'))).toBeVisible();
    });
  });

  describe('Token Selection', () => {
    it('should open from token selector', async () => {
      await element(by.id('from-token-selector')).tap();
      await expect(element(by.id('token-selector-modal'))).toBeVisible();
    });

    it('should show token list in selector', async () => {
      await element(by.id('from-token-selector')).tap();

      await expect(element(by.id('token-option-ETH'))).toBeVisible();
    });

    it('should search tokens in selector', async () => {
      await element(by.id('from-token-selector')).tap();
      await element(by.id('token-search-input')).typeText('USDC');

      await expect(element(by.id('token-option-USDC'))).toBeVisible();
    });

    it('should select from token', async () => {
      await element(by.id('from-token-selector')).tap();
      await element(by.id('token-option-ETH')).tap();

      await expect(element(by.text('ETH'))).toBeVisible();
    });

    it('should select to token', async () => {
      await element(by.id('to-token-selector')).tap();
      await element(by.id('token-option-USDC')).tap();

      await expect(element(by.text('USDC'))).toBeVisible();
    });

    it('should swap token positions', async () => {
      // Select tokens first
      await element(by.id('from-token-selector')).tap();
      await element(by.id('token-option-ETH')).tap();

      await element(by.id('to-token-selector')).tap();
      await element(by.id('token-option-USDC')).tap();

      // Swap positions
      await element(by.id('swap-tokens-button')).tap();

      // Verify positions swapped
      await expect(element(by.id('from-token-USDC'))).toBeVisible();
      await expect(element(by.id('to-token-ETH'))).toBeVisible();
    });
  });

  describe('Swap Quote', () => {
    beforeEach(async () => {
      // Select tokens
      await element(by.id('from-token-selector')).tap();
      await element(by.id('token-option-ETH')).tap();

      await element(by.id('to-token-selector')).tap();
      await element(by.id('token-option-USDC')).tap();
    });

    it('should show quote when amount entered', async () => {
      await element(by.id('swap-amount-input')).typeText('0.1');

      // Wait for quote to load
      await waitFor(element(by.id('swap-quote')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should show exchange rate', async () => {
      await element(by.id('swap-amount-input')).typeText('0.1');

      await waitFor(element(by.id('exchange-rate')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should show estimated output amount', async () => {
      await element(by.id('swap-amount-input')).typeText('0.1');

      await waitFor(element(by.id('output-amount')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should show price impact', async () => {
      await element(by.id('swap-amount-input')).typeText('0.1');

      await waitFor(element(by.id('price-impact')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should show gas fee estimate', async () => {
      await element(by.id('swap-amount-input')).typeText('0.1');

      await waitFor(element(by.id('gas-estimate')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should update quote on amount change', async () => {
      await element(by.id('swap-amount-input')).typeText('0.1');
      await waitFor(element(by.id('swap-quote')))
        .toBeVisible()
        .withTimeout(5000);

      // Clear and enter new amount
      await element(by.id('swap-amount-input')).clearText();
      await element(by.id('swap-amount-input')).typeText('1');

      // Quote should update
      await expect(element(by.id('quote-loading'))).toBeVisible();
    });
  });

  describe('Swap Validation', () => {
    beforeEach(async () => {
      await element(by.id('from-token-selector')).tap();
      await element(by.id('token-option-ETH')).tap();

      await element(by.id('to-token-selector')).tap();
      await element(by.id('token-option-USDC')).tap();
    });

    it('should show insufficient balance error', async () => {
      await element(by.id('swap-amount-input')).typeText('999999');

      await expect(element(by.text('Insufficient balance'))).toBeVisible();
    });

    it('should disable swap button without amount', async () => {
      await expect(element(by.id('swap-execute-button'))).toHaveLabel('disabled');
    });

    it('should show minimum amount warning', async () => {
      await element(by.id('swap-amount-input')).typeText('0.0000001');

      await expect(element(by.text('Amount too small'))).toBeVisible();
    });

    it('should show high price impact warning', async () => {
      // Enter large amount to trigger high price impact
      await element(by.id('swap-amount-input')).typeText('100');

      await waitFor(element(by.id('high-price-impact-warning')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Swap Execution', () => {
    beforeEach(async () => {
      await element(by.id('from-token-selector')).tap();
      await element(by.id('token-option-ETH')).tap();

      await element(by.id('to-token-selector')).tap();
      await element(by.id('token-option-USDC')).tap();

      await element(by.id('swap-amount-input')).typeText('0.01');

      await waitFor(element(by.id('swap-quote')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should show confirmation modal on swap', async () => {
      await element(by.id('swap-execute-button')).tap();
      await expect(element(by.id('swap-confirmation-modal'))).toBeVisible();
    });

    it('should show swap details in confirmation', async () => {
      await element(by.id('swap-execute-button')).tap();

      await expect(element(by.id('confirm-from-amount'))).toBeVisible();
      await expect(element(by.id('confirm-to-amount'))).toBeVisible();
      await expect(element(by.id('confirm-rate'))).toBeVisible();
      await expect(element(by.id('confirm-gas'))).toBeVisible();
    });

    it('should cancel swap from confirmation', async () => {
      await element(by.id('swap-execute-button')).tap();
      await element(by.id('cancel-swap-button')).tap();

      await expect(element(by.id('swap-confirmation-modal'))).not.toBeVisible();
    });
  });

  describe('Swap Settings', () => {
    it('should open swap settings', async () => {
      await element(by.id('swap-settings-button')).tap();
      await expect(element(by.id('swap-settings-modal'))).toBeVisible();
    });

    it('should show slippage tolerance setting', async () => {
      await element(by.id('swap-settings-button')).tap();
      await expect(element(by.id('slippage-setting'))).toBeVisible();
    });

    it('should change slippage tolerance', async () => {
      await element(by.id('swap-settings-button')).tap();
      await element(by.id('slippage-1-percent')).tap();

      await expect(element(by.id('slippage-1-percent-selected'))).toBeVisible();
    });

    it('should set custom slippage', async () => {
      await element(by.id('swap-settings-button')).tap();
      await element(by.id('custom-slippage-input')).typeText('2.5');

      await expect(element(by.text('2.5%'))).toBeVisible();
    });

    it('should show transaction deadline setting', async () => {
      await element(by.id('swap-settings-button')).tap();
      await expect(element(by.id('deadline-setting'))).toBeVisible();
    });
  });

  describe('Swap History', () => {
    it('should navigate to swap history', async () => {
      await element(by.id('swap-history-button')).tap();
      await expect(element(by.id('swap-history-screen'))).toBeVisible();
    });

    it('should show swap history list', async () => {
      await element(by.id('swap-history-button')).tap();
      await expect(element(by.id('swap-history-list'))).toBeVisible();
    });

    it('should show swap details on tap', async () => {
      await element(by.id('swap-history-button')).tap();
      await element(by.id('swap-history-item-0')).tap();

      await expect(element(by.id('swap-details-modal'))).toBeVisible();
    });
  });
});
