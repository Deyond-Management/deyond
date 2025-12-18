/**
 * E2E Tests: Settings
 * Tests for app settings including theme, language, and security
 */

import { by, device, element, expect, waitFor } from 'detox';
import { completeOnboarding, navigateToSettings, scrollDown, goBack } from './helpers/testHelpers';

describe('Settings', () => {
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
    await navigateToSettings();
  });

  describe('Settings Screen', () => {
    it('should display settings screen', async () => {
      await expect(element(by.id('settings-screen'))).toBeVisible();
    });

    it('should show all settings sections', async () => {
      await expect(element(by.id('general-settings-section'))).toBeVisible();
      await expect(element(by.id('security-settings-section'))).toBeVisible();
      await expect(element(by.id('notification-settings-section'))).toBeVisible();
    });

    it('should navigate back to home', async () => {
      await goBack();
      await expect(element(by.id('home-screen'))).toBeVisible();
    });
  });

  describe('Theme Settings', () => {
    it('should show theme options', async () => {
      await element(by.id('theme-setting')).tap();
      await expect(element(by.id('theme-modal'))).toBeVisible();
    });

    it('should toggle dark mode', async () => {
      await element(by.id('theme-setting')).tap();
      await element(by.id('theme-dark')).tap();

      // Verify dark theme is applied (check background color indicator)
      await expect(element(by.id('dark-theme-active'))).toBeVisible();
    });

    it('should toggle light mode', async () => {
      await element(by.id('theme-setting')).tap();
      await element(by.id('theme-light')).tap();

      // Verify light theme is applied
      await expect(element(by.id('light-theme-active'))).toBeVisible();
    });

    it('should use system theme', async () => {
      await element(by.id('theme-setting')).tap();
      await element(by.id('theme-system')).tap();

      await expect(element(by.id('system-theme-active'))).toBeVisible();
    });
  });

  describe('Language Settings', () => {
    it('should show language options', async () => {
      await element(by.id('language-setting')).tap();
      await expect(element(by.id('language-modal'))).toBeVisible();
    });

    it('should display available languages', async () => {
      await element(by.id('language-setting')).tap();

      await expect(element(by.id('language-en'))).toBeVisible();
      await expect(element(by.id('language-ko'))).toBeVisible();
    });

    it('should change to Korean', async () => {
      await element(by.id('language-setting')).tap();
      await element(by.id('language-ko')).tap();

      // Verify Korean text is displayed
      await expect(element(by.text('설정'))).toBeVisible();
    });

    it('should change to English', async () => {
      await element(by.id('language-setting')).tap();
      await element(by.id('language-en')).tap();

      // Verify English text is displayed
      await expect(element(by.text('Settings'))).toBeVisible();
    });
  });

  describe('Security Settings', () => {
    it('should navigate to security settings', async () => {
      await element(by.id('security-settings-button')).tap();
      await expect(element(by.id('security-settings-screen'))).toBeVisible();
    });

    it('should show PIN settings', async () => {
      await element(by.id('security-settings-button')).tap();
      await expect(element(by.id('change-pin-button'))).toBeVisible();
    });

    it('should show biometric toggle', async () => {
      await element(by.id('security-settings-button')).tap();
      await expect(element(by.id('biometric-toggle'))).toBeVisible();
    });

    it('should show auto-lock settings', async () => {
      await element(by.id('security-settings-button')).tap();
      await expect(element(by.id('auto-lock-setting'))).toBeVisible();
    });

    it('should change auto-lock timeout', async () => {
      await element(by.id('security-settings-button')).tap();
      await element(by.id('auto-lock-setting')).tap();

      await expect(element(by.id('auto-lock-modal'))).toBeVisible();
      await element(by.id('auto-lock-5min')).tap();

      await expect(element(by.text('5 minutes'))).toBeVisible();
    });

    it('should require PIN to change security settings', async () => {
      await element(by.id('security-settings-button')).tap();
      await element(by.id('change-pin-button')).tap();

      // Should require current PIN
      await expect(element(by.id('pin-pad'))).toBeVisible();
      await expect(element(by.text('Enter current PIN'))).toBeVisible();
    });
  });

  describe('Notification Settings', () => {
    it('should navigate to notification settings', async () => {
      await element(by.id('notification-settings-button')).tap();
      await expect(element(by.id('notification-settings-screen'))).toBeVisible();
    });

    it('should show notification toggle', async () => {
      await element(by.id('notification-settings-button')).tap();
      await expect(element(by.id('notifications-enabled-toggle'))).toBeVisible();
    });

    it('should show notification categories', async () => {
      await element(by.id('notification-settings-button')).tap();

      await expect(element(by.id('notification-transaction'))).toBeVisible();
      await expect(element(by.id('notification-price-alert'))).toBeVisible();
      await expect(element(by.id('notification-security'))).toBeVisible();
    });

    it('should toggle transaction notifications', async () => {
      await element(by.id('notification-settings-button')).tap();
      await element(by.id('notification-transaction-toggle')).tap();

      // Verify toggle state changed
      await expect(element(by.id('notification-transaction-disabled'))).toBeVisible();
    });

    it('should show quiet hours settings', async () => {
      await element(by.id('notification-settings-button')).tap();
      await scrollDown('notification-settings-scroll');

      await expect(element(by.id('quiet-hours-setting'))).toBeVisible();
    });

    it('should toggle sound and vibration', async () => {
      await element(by.id('notification-settings-button')).tap();

      await element(by.id('sound-toggle')).tap();
      await element(by.id('vibration-toggle')).tap();
    });
  });

  describe('Currency Settings', () => {
    it('should show currency options', async () => {
      await scrollDown('settings-scroll');
      await element(by.id('currency-setting')).tap();

      await expect(element(by.id('currency-modal'))).toBeVisible();
    });

    it('should display available currencies', async () => {
      await scrollDown('settings-scroll');
      await element(by.id('currency-setting')).tap();

      await expect(element(by.id('currency-usd'))).toBeVisible();
      await expect(element(by.id('currency-eur'))).toBeVisible();
      await expect(element(by.id('currency-krw'))).toBeVisible();
    });

    it('should change display currency', async () => {
      await scrollDown('settings-scroll');
      await element(by.id('currency-setting')).tap();
      await element(by.id('currency-krw')).tap();

      // Verify currency changed (should see KRW symbol)
      await goBack();
      await expect(element(by.id('balance-currency-krw'))).toBeVisible();
    });
  });

  describe('About & Legal', () => {
    it('should show app version', async () => {
      await scrollDown('settings-scroll');
      await expect(element(by.id('app-version'))).toBeVisible();
    });

    it('should navigate to terms of service', async () => {
      await scrollDown('settings-scroll');
      await element(by.id('terms-of-service-button')).tap();

      await expect(element(by.id('terms-screen'))).toBeVisible();
    });

    it('should navigate to privacy policy', async () => {
      await scrollDown('settings-scroll');
      await element(by.id('privacy-policy-button')).tap();

      await expect(element(by.id('privacy-screen'))).toBeVisible();
    });
  });

  describe('Account Actions', () => {
    it('should show reset wallet option', async () => {
      await scrollDown('settings-scroll');
      await expect(element(by.id('reset-wallet-button'))).toBeVisible();
    });

    it('should show confirmation before reset', async () => {
      await scrollDown('settings-scroll');
      await element(by.id('reset-wallet-button')).tap();

      await expect(element(by.id('reset-confirmation-modal'))).toBeVisible();
      await expect(element(by.text('This action cannot be undone'))).toBeVisible();
    });

    it('should cancel reset wallet', async () => {
      await scrollDown('settings-scroll');
      await element(by.id('reset-wallet-button')).tap();
      await element(by.id('cancel-reset-button')).tap();

      // Should still be on settings screen
      await expect(element(by.id('settings-screen'))).toBeVisible();
    });
  });
});
