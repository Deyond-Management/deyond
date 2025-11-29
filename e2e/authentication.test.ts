/**
 * E2E Tests: Authentication Flow
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

  // Skip mnemonic screens
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

describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      delete: true,
    });
    await completeOnboarding();
  });

  beforeEach(async () => {
    // Lock the app by sending it to background and bringing back
    await device.sendToHome();
    await device.launchApp({ newInstance: false });

    // Wait for PIN screen
    await waitFor(element(by.id('pin-pad')))
      .toBeVisible()
      .withTimeout(5000);
  });

  describe('PIN Authentication', () => {
    it('should require PIN on app launch', async () => {
      // After wallet setup, app should require authentication
      await expect(element(by.id('pin-pad'))).toBeVisible();
    });

    it('should show error on wrong PIN', async () => {
      // Enter wrong PIN
      await element(by.id('pin-1')).tap();
      await element(by.id('pin-2')).tap();
      await element(by.id('pin-3')).tap();
      await element(by.id('pin-4')).tap();
      await element(by.id('pin-5')).tap();
      await element(by.id('pin-6')).tap();

      await expect(element(by.text('Incorrect PIN'))).toBeVisible();
    });

    it('should unlock with correct PIN', async () => {
      // Enter correct PIN (assuming 123456 for test)
      await element(by.id('pin-1')).tap();
      await element(by.id('pin-2')).tap();
      await element(by.id('pin-3')).tap();
      await element(by.id('pin-4')).tap();
      await element(by.id('pin-5')).tap();
      await element(by.id('pin-6')).tap();

      // Should show home screen after successful auth
      await expect(element(by.id('home-screen'))).toBeVisible();
    });

    it('should lock out after multiple failed attempts', async () => {
      // Enter wrong PIN 5 times
      for (let i = 0; i < 5; i++) {
        await element(by.id('pin-0')).tap();
        await element(by.id('pin-0')).tap();
        await element(by.id('pin-0')).tap();
        await element(by.id('pin-0')).tap();
        await element(by.id('pin-0')).tap();
        await element(by.id('pin-0')).tap();
      }

      await expect(element(by.text('Too many attempts'))).toBeVisible();
    });
  });

  describe('Biometric Authentication', () => {
    it('should show biometric prompt when enabled', async () => {
      // This test requires biometric to be set up
      await expect(element(by.id('biometric-prompt'))).toBeVisible();
    });

    it('should fallback to PIN on biometric failure', async () => {
      await element(by.id('use-pin-button')).tap();
      await expect(element(by.id('pin-pad'))).toBeVisible();
    });
  });

  describe('Session Management', () => {
    it('should auto-lock after timeout', async () => {
      // Navigate to home
      await element(by.id('pin-1')).tap();
      await element(by.id('pin-2')).tap();
      await element(by.id('pin-3')).tap();
      await element(by.id('pin-4')).tap();
      await element(by.id('pin-5')).tap();
      await element(by.id('pin-6')).tap();

      // Wait for auto-lock timeout (in test, this would be shorter)
      await device.sendToHome();
      await new Promise(resolve => setTimeout(resolve, 5000));
      await device.launchApp({ newInstance: false });

      // Should require authentication again
      await expect(element(by.id('pin-pad'))).toBeVisible();
    });

    it('should maintain session when switching apps briefly', async () => {
      // Unlock
      await element(by.id('pin-1')).tap();
      await element(by.id('pin-2')).tap();
      await element(by.id('pin-3')).tap();
      await element(by.id('pin-4')).tap();
      await element(by.id('pin-5')).tap();
      await element(by.id('pin-6')).tap();

      // Brief switch
      await device.sendToHome();
      await device.launchApp({ newInstance: false });

      // Should still be on home screen
      await expect(element(by.id('home-screen'))).toBeVisible();
    });
  });
});
