/**
 * E2E Test Helpers
 * Common utilities for Detox E2E tests
 */

import { by, device, element, waitFor } from 'detox';

/**
 * Complete the onboarding flow to get to home screen
 */
export async function completeOnboarding(): Promise<void> {
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

/**
 * Enter PIN to unlock app
 * Default PIN is 123456
 */
export async function enterPin(pin: string = '123456'): Promise<void> {
  for (const digit of pin) {
    await element(by.id(`pin-${digit}`)).tap();
  }
}

/**
 * Navigate to a specific tab on home screen
 */
export async function navigateToTab(tabId: string): Promise<void> {
  await element(by.id(tabId)).tap();
}

/**
 * Navigate to settings screen
 */
export async function navigateToSettings(): Promise<void> {
  await element(by.id('settings-button')).tap();
  await waitFor(element(by.id('settings-screen')))
    .toBeVisible()
    .withTimeout(2000);
}

/**
 * Go back to previous screen
 */
export async function goBack(): Promise<void> {
  await element(by.id('back-button')).tap();
}

/**
 * Wait for element to disappear
 */
export async function waitForElementToDisappear(
  testId: string,
  timeout: number = 5000
): Promise<void> {
  await waitFor(element(by.id(testId)))
    .not.toBeVisible()
    .withTimeout(timeout);
}

/**
 * Scroll down in a scrollable container
 */
export async function scrollDown(scrollViewId: string): Promise<void> {
  await element(by.id(scrollViewId)).scroll(200, 'down');
}

/**
 * Scroll up in a scrollable container
 */
export async function scrollUp(scrollViewId: string): Promise<void> {
  await element(by.id(scrollViewId)).scroll(200, 'up');
}

/**
 * Type text and dismiss keyboard
 */
export async function typeTextAndDismiss(testId: string, text: string): Promise<void> {
  await element(by.id(testId)).typeText(text);
  await element(by.id(testId)).tapReturnKey();
}

/**
 * Clear text input
 */
export async function clearTextInput(testId: string): Promise<void> {
  await element(by.id(testId)).clearText();
}

/**
 * Take screenshot for debugging
 */
export async function takeScreenshot(name: string): Promise<void> {
  await device.takeScreenshot(name);
}

/**
 * Launch app fresh (delete data)
 */
export async function launchAppFresh(): Promise<void> {
  await device.launchApp({
    newInstance: true,
    delete: true,
  });
}

/**
 * Relaunch app without deleting data
 */
export async function relaunchApp(): Promise<void> {
  await device.launchApp({
    newInstance: false,
  });
}

/**
 * Send app to background and bring back
 */
export async function sendToBackgroundAndReturn(duration: number = 1000): Promise<void> {
  await device.sendToHome();
  await new Promise(resolve => setTimeout(resolve, duration));
  await device.launchApp({ newInstance: false });
}
