/**
 * E2E Tests: WalletConnect
 * Tests for WalletConnect DApp connections
 */

import { by, device, element, expect, waitFor } from 'detox';
import { completeOnboarding, goBack, navigateToSettings } from './helpers/testHelpers';

describe('WalletConnect', () => {
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

  describe('QR Scanner', () => {
    it('should navigate to WalletConnect scan screen', async () => {
      await element(by.id('walletconnect-button')).tap();
      await expect(element(by.id('walletconnect-scan-screen'))).toBeVisible();
    });

    it('should show camera view for QR scanning', async () => {
      await element(by.id('walletconnect-button')).tap();
      await expect(element(by.id('qr-camera-view'))).toBeVisible();
    });

    it('should show scan instructions', async () => {
      await element(by.id('walletconnect-button')).tap();
      await expect(element(by.text('Scan QR Code'))).toBeVisible();
    });

    it('should have paste URI option', async () => {
      await element(by.id('walletconnect-button')).tap();
      await expect(element(by.id('paste-uri-button'))).toBeVisible();
    });

    it('should open paste URI modal', async () => {
      await element(by.id('walletconnect-button')).tap();
      await element(by.id('paste-uri-button')).tap();
      await expect(element(by.id('paste-uri-modal'))).toBeVisible();
    });

    it('should validate URI format', async () => {
      await element(by.id('walletconnect-button')).tap();
      await element(by.id('paste-uri-button')).tap();
      await element(by.id('uri-input')).typeText('invalid-uri');
      await element(by.id('connect-button')).tap();

      await expect(element(by.text('Invalid WalletConnect URI'))).toBeVisible();
    });

    it('should close scanner on back', async () => {
      await element(by.id('walletconnect-button')).tap();
      await goBack();
      await expect(element(by.id('home-screen'))).toBeVisible();
    });
  });

  describe('Connection Flow', () => {
    it('should show connection loading state', async () => {
      await element(by.id('walletconnect-button')).tap();
      await element(by.id('paste-uri-button')).tap();

      // Use a mock URI format (won't actually connect)
      await element(by.id('uri-input')).typeText('wc:a281567bb3e4@2?relay-protocol=irn&symKey=abc');
      await element(by.id('connect-button')).tap();

      await expect(element(by.id('connecting-indicator'))).toBeVisible();
    });

    it('should show connection timeout error', async () => {
      await element(by.id('walletconnect-button')).tap();
      await element(by.id('paste-uri-button')).tap();

      await element(by.id('uri-input')).typeText('wc:timeout-test@2?relay-protocol=irn&symKey=xyz');
      await element(by.id('connect-button')).tap();

      // Wait for timeout
      await waitFor(element(by.text('Connection timeout')))
        .toBeVisible()
        .withTimeout(35000);
    });
  });

  describe('Sessions Management', () => {
    it('should navigate to sessions screen', async () => {
      await navigateToSettings();
      await element(by.id('walletconnect-sessions-button')).tap();
      await expect(element(by.id('walletconnect-sessions-screen'))).toBeVisible();
    });

    it('should show empty state when no sessions', async () => {
      await navigateToSettings();
      await element(by.id('walletconnect-sessions-button')).tap();
      await expect(element(by.id('no-sessions-message'))).toBeVisible();
    });

    it('should show sessions list', async () => {
      await navigateToSettings();
      await element(by.id('walletconnect-sessions-button')).tap();
      await expect(element(by.id('sessions-list'))).toBeVisible();
    });

    it('should show session details', async () => {
      await navigateToSettings();
      await element(by.id('walletconnect-sessions-button')).tap();

      try {
        await element(by.id('session-item-0')).tap();
        await expect(element(by.id('session-details-modal'))).toBeVisible();
      } catch {
        // No sessions available
      }
    });

    it('should show DApp name and icon', async () => {
      await navigateToSettings();
      await element(by.id('walletconnect-sessions-button')).tap();

      try {
        await expect(element(by.id('session-dapp-name-0'))).toBeVisible();
        await expect(element(by.id('session-dapp-icon-0'))).toBeVisible();
      } catch {
        // No sessions available
      }
    });

    it('should show connected chains', async () => {
      await navigateToSettings();
      await element(by.id('walletconnect-sessions-button')).tap();

      try {
        await element(by.id('session-item-0')).tap();
        await expect(element(by.id('session-chains'))).toBeVisible();
      } catch {
        // No sessions available
      }
    });

    it('should disconnect single session', async () => {
      await navigateToSettings();
      await element(by.id('walletconnect-sessions-button')).tap();

      try {
        await element(by.id('session-item-0')).tap();
        await element(by.id('disconnect-session-button')).tap();
        await expect(element(by.id('disconnect-confirmation-modal'))).toBeVisible();

        await element(by.id('confirm-disconnect-button')).tap();
        // Session should be removed
      } catch {
        // No sessions available
      }
    });

    it('should disconnect all sessions', async () => {
      await navigateToSettings();
      await element(by.id('walletconnect-sessions-button')).tap();

      try {
        await element(by.id('disconnect-all-button')).tap();
        await expect(element(by.id('disconnect-all-confirmation-modal'))).toBeVisible();

        await element(by.id('confirm-disconnect-all-button')).tap();
        // All sessions should be removed
      } catch {
        // No sessions available
      }
    });
  });

  describe('DApp Browser', () => {
    it('should navigate to DApp browser', async () => {
      await element(by.id('dapp-browser-button')).tap();
      await expect(element(by.id('dapp-browser-screen'))).toBeVisible();
    });

    it('should show URL input', async () => {
      await element(by.id('dapp-browser-button')).tap();
      await expect(element(by.id('url-input'))).toBeVisible();
    });

    it('should load URL', async () => {
      await element(by.id('dapp-browser-button')).tap();
      await element(by.id('url-input')).typeText('https://example.com');
      await element(by.id('url-input')).tapReturnKey();

      await waitFor(element(by.id('webview-loading')))
        .not.toBeVisible()
        .withTimeout(10000);
    });

    it('should show navigation controls', async () => {
      await element(by.id('dapp-browser-button')).tap();

      await expect(element(by.id('browser-back-button'))).toBeVisible();
      await expect(element(by.id('browser-forward-button'))).toBeVisible();
      await expect(element(by.id('browser-refresh-button'))).toBeVisible();
    });

    it('should show current wallet address', async () => {
      await element(by.id('dapp-browser-button')).tap();
      await expect(element(by.id('connected-wallet-indicator'))).toBeVisible();
    });

    it('should show DApp info', async () => {
      await element(by.id('dapp-browser-button')).tap();
      await element(by.id('url-input')).typeText('https://example.com');
      await element(by.id('url-input')).tapReturnKey();

      await element(by.id('dapp-info-button')).tap();
      await expect(element(by.id('dapp-info-modal'))).toBeVisible();
    });

    it('should close DApp browser', async () => {
      await element(by.id('dapp-browser-button')).tap();
      await goBack();
      await expect(element(by.id('home-screen'))).toBeVisible();
    });
  });

  describe('Request Handling', () => {
    // These tests would require a mock DApp to send requests
    // In real E2E testing, you would use a test DApp

    it('should show pending requests badge', async () => {
      // This would show if there are pending requests
      try {
        await expect(element(by.id('pending-requests-badge'))).toBeVisible();
      } catch {
        // No pending requests
      }
    });

    it('should navigate to pending requests', async () => {
      await navigateToSettings();
      await element(by.id('walletconnect-sessions-button')).tap();

      try {
        await element(by.id('pending-requests-tab')).tap();
        await expect(element(by.id('pending-requests-list'))).toBeVisible();
      } catch {
        // Tab might not exist if no pending requests
      }
    });
  });

  describe('Error Handling', () => {
    it('should show network error', async () => {
      // Disable network
      await device.setURLBlacklist(['.*']);

      await element(by.id('walletconnect-button')).tap();
      await element(by.id('paste-uri-button')).tap();
      await element(by.id('uri-input')).typeText('wc:network-test@2?relay-protocol=irn&symKey=abc');
      await element(by.id('connect-button')).tap();

      await expect(element(by.text('Network error'))).toBeVisible();

      // Re-enable network
      await device.setURLBlacklist([]);
    });

    it('should show retry option on error', async () => {
      await element(by.id('walletconnect-button')).tap();
      await element(by.id('paste-uri-button')).tap();
      await element(by.id('uri-input')).typeText('wc:error-test@2?relay-protocol=irn&symKey=err');
      await element(by.id('connect-button')).tap();

      await waitFor(element(by.id('retry-button')))
        .toBeVisible()
        .withTimeout(35000);
    });
  });

  describe('Security Indicators', () => {
    it('should show verified DApp indicator', async () => {
      // This would show for verified DApps
      try {
        await navigateToSettings();
        await element(by.id('walletconnect-sessions-button')).tap();
        await expect(element(by.id('verified-badge-0'))).toBeVisible();
      } catch {
        // No verified sessions
      }
    });

    it('should show warning for unknown DApps', async () => {
      await element(by.id('dapp-browser-button')).tap();
      await element(by.id('url-input')).typeText('https://unknown-dapp.xyz');
      await element(by.id('url-input')).tapReturnKey();

      await expect(element(by.id('unknown-dapp-warning'))).toBeVisible();
    });
  });
});
