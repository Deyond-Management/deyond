/**
 * E2E Tests: Wallet Operations
 * Tests for wallet functionality including balance, tokens, and networks
 */

import { by, device, element, expect, waitFor } from 'detox';
import { completeOnboarding, navigateToSettings, scrollDown } from './helpers/testHelpers';

describe('Wallet Operations', () => {
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
  });

  describe('Balance Display', () => {
    it('should display wallet balance', async () => {
      await expect(element(by.id('wallet-balance'))).toBeVisible();
    });

    it('should show balance in selected currency', async () => {
      await expect(element(by.id('balance-currency'))).toBeVisible();
    });

    it('should toggle balance visibility', async () => {
      await element(by.id('toggle-balance-visibility')).tap();
      await expect(element(by.text('••••••'))).toBeVisible();

      // Toggle back
      await element(by.id('toggle-balance-visibility')).tap();
      await expect(element(by.id('wallet-balance'))).toBeVisible();
    });

    it('should refresh balance on pull-to-refresh', async () => {
      // Pull to refresh
      await element(by.id('home-scroll-view')).scroll(100, 'down', NaN, NaN);

      // Should show loading indicator
      await expect(element(by.id('refresh-indicator'))).toBeVisible();

      // Wait for refresh to complete
      await waitFor(element(by.id('refresh-indicator')))
        .not.toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Token List', () => {
    it('should display token list', async () => {
      await expect(element(by.id('token-list'))).toBeVisible();
    });

    it('should show ETH as default token', async () => {
      await expect(element(by.id('token-item-ETH'))).toBeVisible();
    });

    it('should navigate to token details', async () => {
      await element(by.id('token-item-ETH')).tap();
      await expect(element(by.id('token-details-screen'))).toBeVisible();
      await expect(element(by.text('ETH'))).toBeVisible();
    });

    it('should show token balance and price', async () => {
      await expect(element(by.id('token-balance-ETH'))).toBeVisible();
      await expect(element(by.id('token-price-ETH'))).toBeVisible();
    });

    it('should navigate to full token list', async () => {
      await element(by.id('view-all-tokens-button')).tap();
      await expect(element(by.id('token-list-screen'))).toBeVisible();
    });

    it('should search tokens by name', async () => {
      await element(by.id('view-all-tokens-button')).tap();
      await element(by.id('token-search-input')).typeText('ETH');

      await expect(element(by.id('token-item-ETH'))).toBeVisible();
    });
  });

  describe('Network Selection', () => {
    it('should display current network', async () => {
      await expect(element(by.id('current-network'))).toBeVisible();
    });

    it('should open network selector', async () => {
      await element(by.id('network-selector-button')).tap();
      await expect(element(by.id('network-selector-modal'))).toBeVisible();
    });

    it('should show available networks', async () => {
      await element(by.id('network-selector-button')).tap();

      await expect(element(by.id('network-ethereum'))).toBeVisible();
      await expect(element(by.id('network-polygon'))).toBeVisible();
      await expect(element(by.id('network-arbitrum'))).toBeVisible();
    });

    it('should switch network', async () => {
      await element(by.id('network-selector-button')).tap();
      await element(by.id('network-polygon')).tap();

      // Verify network changed
      await expect(element(by.text('Polygon'))).toBeVisible();
    });

    it('should update balance after network switch', async () => {
      await element(by.id('network-selector-button')).tap();
      await element(by.id('network-ethereum')).tap();

      // Wait for balance to update
      await waitFor(element(by.id('wallet-balance')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Wallet Address', () => {
    it('should display abbreviated wallet address', async () => {
      await expect(element(by.id('wallet-address-short'))).toBeVisible();
    });

    it('should copy address to clipboard', async () => {
      await element(by.id('copy-address-button')).tap();
      await expect(element(by.text('Address copied'))).toBeVisible();
    });

    it('should show full address in receive screen', async () => {
      await element(by.id('receive-button')).tap();
      await expect(element(by.id('wallet-address-full'))).toBeVisible();
    });
  });

  describe('Token Details', () => {
    beforeEach(async () => {
      await element(by.id('token-item-ETH')).tap();
      await waitFor(element(by.id('token-details-screen')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should display token information', async () => {
      await expect(element(by.id('token-symbol'))).toBeVisible();
      await expect(element(by.id('token-balance'))).toBeVisible();
      await expect(element(by.id('token-value'))).toBeVisible();
    });

    it('should show price chart', async () => {
      await expect(element(by.id('price-chart'))).toBeVisible();
    });

    it('should change chart timeframe', async () => {
      await element(by.id('chart-1d')).tap();
      await element(by.id('chart-1w')).tap();
      await element(by.id('chart-1m')).tap();
      await element(by.id('chart-1y')).tap();
    });

    it('should navigate to send from token details', async () => {
      await element(by.id('send-token-button')).tap();
      await expect(element(by.id('send-screen'))).toBeVisible();
    });

    it('should navigate to receive from token details', async () => {
      await element(by.id('receive-token-button')).tap();
      await expect(element(by.id('receive-screen'))).toBeVisible();
    });

    it('should show recent transactions for token', async () => {
      await scrollDown('token-details-scroll');
      await expect(element(by.id('token-transactions'))).toBeVisible();
    });
  });

  describe('Export Wallet', () => {
    beforeEach(async () => {
      await navigateToSettings();
    });

    it('should navigate to export wallet', async () => {
      await element(by.id('export-wallet-button')).tap();

      // Should require authentication
      await expect(element(by.id('pin-pad'))).toBeVisible();
    });

    it('should show mnemonic after authentication', async () => {
      await element(by.id('export-wallet-button')).tap();

      // Enter PIN
      await element(by.id('pin-1')).tap();
      await element(by.id('pin-2')).tap();
      await element(by.id('pin-3')).tap();
      await element(by.id('pin-4')).tap();
      await element(by.id('pin-5')).tap();
      await element(by.id('pin-6')).tap();

      // Should show mnemonic
      await expect(element(by.id('mnemonic-display'))).toBeVisible();
    });

    it('should copy mnemonic', async () => {
      await element(by.id('export-wallet-button')).tap();

      // Enter PIN
      await element(by.id('pin-1')).tap();
      await element(by.id('pin-2')).tap();
      await element(by.id('pin-3')).tap();
      await element(by.id('pin-4')).tap();
      await element(by.id('pin-5')).tap();
      await element(by.id('pin-6')).tap();

      await element(by.id('copy-mnemonic-button')).tap();
      await expect(element(by.text('Recovery phrase copied'))).toBeVisible();
    });
  });
});
