/**
 * AnalyticsService
 * Service for tracking user events and analytics
 *
 * In production, integrate with:
 * - Google Analytics (https://analytics.google.com)
 * - Mixpanel (https://mixpanel.com)
 * - Amplitude (https://amplitude.com)
 * - Firebase Analytics
 */

import AppConfig from '../../config/app.config';

export enum AnalyticsEvent {
  // Wallet Events
  WALLET_CREATED = 'wallet_created',
  WALLET_IMPORTED = 'wallet_imported',
  WALLET_BACKUP = 'wallet_backup',

  // Transaction Events
  TRANSACTION_SENT = 'transaction_sent',
  TRANSACTION_RECEIVED = 'transaction_received',
  TRANSACTION_FAILED = 'transaction_failed',

  // DApp Events
  DAPP_CONNECTED = 'dapp_connected',
  DAPP_DISCONNECTED = 'dapp_disconnected',
  DAPP_TRANSACTION_APPROVED = 'dapp_transaction_approved',
  DAPP_TRANSACTION_REJECTED = 'dapp_transaction_rejected',

  // NFT Events
  NFT_VIEWED = 'nft_viewed',
  NFT_SENT = 'nft_sent',

  // Network Events
  NETWORK_SWITCHED = 'network_switched',

  // Screen Events
  SCREEN_VIEW = 'screen_view',

  // Error Events
  ERROR_OCCURRED = 'error_occurred',
}

export interface AnalyticsEventData {
  [key: string]: string | number | boolean | undefined;
}

class AnalyticsService {
  private isInitialized = false;

  /**
   * Initialize analytics service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // TODO: In production, initialize analytics SDK
    // if (!AppConfig.demoMode && !__DEV__) {
    //   await Analytics.initialize({
    //     trackingId: 'YOUR_TRACKING_ID',
    //   });
    // }

    this.isInitialized = true;

    if (__DEV__) {
      console.log('📊 AnalyticsService initialized');
    }
  }

  /**
   * Track event
   */
  trackEvent(eventName: AnalyticsEvent, data?: AnalyticsEventData): void {
    if (!this.isInitialized) {
      console.warn('AnalyticsService not initialized');
      return;
    }

    // Log to console in development
    if (AppConfig.demoMode || __DEV__) {
      console.log(`📊 [Analytics] ${eventName}`, data || {});
    }

    // TODO: In production, send to analytics service
    // if (!AppConfig.demoMode && !__DEV__) {
    //   Analytics.logEvent(eventName, data);
    // }
  }

  /**
   * Track screen view
   */
  trackScreenView(screenName: string, data?: AnalyticsEventData): void {
    this.trackEvent(AnalyticsEvent.SCREEN_VIEW, {
      screen_name: screenName,
      ...data,
    });
  }

  /**
   * Set user ID
   */
  setUserId(userId: string): void {
    if (!this.isInitialized) return;

    // TODO: In production, set user ID
    // if (!AppConfig.demoMode && !__DEV__) {
    //   Analytics.setUserId(userId);
    // }

    if (__DEV__) {
      console.log(`📊 [Analytics] User ID set: ${userId}`);
    }
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: Record<string, any>): void {
    if (!this.isInitialized) return;

    // TODO: In production, set user properties
    // if (!AppConfig.demoMode && !__DEV__) {
    //   Analytics.setUserProperties(properties);
    // }

    if (__DEV__) {
      console.log('📊 [Analytics] User properties set:', properties);
    }
  }

  /**
   * Track transaction
   */
  trackTransaction(
    type: 'sent' | 'received' | 'failed',
    data: {
      amount: string;
      token: string;
      chainId: number;
      status?: string;
    }
  ): void {
    const eventMap = {
      sent: AnalyticsEvent.TRANSACTION_SENT,
      received: AnalyticsEvent.TRANSACTION_RECEIVED,
      failed: AnalyticsEvent.TRANSACTION_FAILED,
    };

    this.trackEvent(eventMap[type], data);
  }
}

// Singleton instance
let instance: AnalyticsService | null = null;

export const getAnalyticsService = (): AnalyticsService => {
  if (!instance) {
    instance = new AnalyticsService();
  }
  return instance;
};

export default AnalyticsService;
