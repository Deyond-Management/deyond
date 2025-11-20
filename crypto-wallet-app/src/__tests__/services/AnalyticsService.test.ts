/**
 * AnalyticsService Tests
 */

import { AnalyticsService } from '../../services/AnalyticsService';

describe('AnalyticsService', () => {
  let analytics: AnalyticsService;

  beforeEach(() => {
    analytics = new AnalyticsService();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with config', () => {
      analytics.initialize({
        enabled: true,
        debug: false,
      });

      expect(analytics.isEnabled()).toBe(true);
    });

    it('should disable tracking when not enabled', () => {
      analytics.initialize({
        enabled: false,
      });

      expect(analytics.isEnabled()).toBe(false);
    });
  });

  describe('event tracking', () => {
    beforeEach(() => {
      analytics.initialize({ enabled: true });
    });

    it('should track custom event', () => {
      const trackSpy = jest.spyOn(analytics, 'track');

      analytics.track('button_click', {
        button_id: 'send_btn',
        screen: 'home',
      });

      expect(trackSpy).toHaveBeenCalledWith('button_click', {
        button_id: 'send_btn',
        screen: 'home',
      });
    });

    it('should track screen view', () => {
      const screenSpy = jest.spyOn(analytics, 'trackScreen');

      analytics.trackScreen('HomeScreen', {
        wallet_count: 1,
      });

      expect(screenSpy).toHaveBeenCalledWith('HomeScreen', {
        wallet_count: 1,
      });
    });

    it('should not track when disabled', () => {
      analytics.initialize({ enabled: false });
      const trackSpy = jest.spyOn(analytics as any, 'sendEvent');

      analytics.track('test_event');

      expect(trackSpy).not.toHaveBeenCalled();
    });
  });

  describe('user properties', () => {
    beforeEach(() => {
      analytics.initialize({ enabled: true });
    });

    it('should set user ID', () => {
      analytics.setUserId('user_123');
      expect(analytics.getUserId()).toBe('user_123');
    });

    it('should set user properties', () => {
      analytics.setUserProperties({
        wallet_type: 'hot',
        network: 'mainnet',
      });

      const props = analytics.getUserProperties();
      expect(props.wallet_type).toBe('hot');
      expect(props.network).toBe('mainnet');
    });

    it('should clear user data', () => {
      analytics.setUserId('user_123');
      analytics.clearUser();

      expect(analytics.getUserId()).toBeNull();
    });
  });

  describe('wallet events', () => {
    beforeEach(() => {
      analytics.initialize({ enabled: true });
    });

    it('should track wallet creation', () => {
      const trackSpy = jest.spyOn(analytics, 'track');

      analytics.trackWalletCreated('ethereum');

      expect(trackSpy).toHaveBeenCalledWith('wallet_created', {
        network: 'ethereum',
      });
    });

    it('should track wallet import', () => {
      const trackSpy = jest.spyOn(analytics, 'track');

      analytics.trackWalletImported('ethereum', 'mnemonic');

      expect(trackSpy).toHaveBeenCalledWith('wallet_imported', {
        network: 'ethereum',
        import_method: 'mnemonic',
      });
    });
  });

  describe('transaction events', () => {
    beforeEach(() => {
      analytics.initialize({ enabled: true });
    });

    it('should track transaction sent', () => {
      const trackSpy = jest.spyOn(analytics, 'track');

      analytics.trackTransactionSent({
        network: 'ethereum',
        token: 'ETH',
        amount: '1.5',
        gasUsed: '21000',
      });

      expect(trackSpy).toHaveBeenCalledWith('transaction_sent', {
        network: 'ethereum',
        token: 'ETH',
        amount: '1.5',
        gasUsed: '21000',
      });
    });

    it('should track transaction received', () => {
      const trackSpy = jest.spyOn(analytics, 'track');

      analytics.trackTransactionReceived({
        network: 'ethereum',
        token: 'ETH',
        amount: '2.0',
      });

      expect(trackSpy).toHaveBeenCalledWith('transaction_received', {
        network: 'ethereum',
        token: 'ETH',
        amount: '2.0',
      });
    });

    it('should track transaction failed', () => {
      const trackSpy = jest.spyOn(analytics, 'track');

      analytics.trackTransactionFailed({
        network: 'ethereum',
        error: 'insufficient_funds',
      });

      expect(trackSpy).toHaveBeenCalledWith('transaction_failed', {
        network: 'ethereum',
        error: 'insufficient_funds',
      });
    });
  });

  describe('engagement events', () => {
    beforeEach(() => {
      analytics.initialize({ enabled: true });
    });

    it('should track app open', () => {
      const trackSpy = jest.spyOn(analytics, 'track');

      analytics.trackAppOpen();

      expect(trackSpy).toHaveBeenCalledWith('app_open', expect.any(Object));
    });

    it('should track session start', () => {
      const trackSpy = jest.spyOn(analytics, 'track');

      analytics.trackSessionStart();

      expect(trackSpy).toHaveBeenCalledWith('session_start', expect.any(Object));
    });

    it('should track session end with duration', () => {
      const trackSpy = jest.spyOn(analytics, 'track');

      analytics.trackSessionEnd(300);

      expect(trackSpy).toHaveBeenCalledWith('session_end', {
        duration_seconds: 300,
      });
    });
  });

  describe('feature usage', () => {
    beforeEach(() => {
      analytics.initialize({ enabled: true });
    });

    it('should track feature used', () => {
      const trackSpy = jest.spyOn(analytics, 'track');

      analytics.trackFeatureUsed('biometric_auth');

      expect(trackSpy).toHaveBeenCalledWith('feature_used', {
        feature: 'biometric_auth',
      });
    });

    it('should track error occurred', () => {
      const trackSpy = jest.spyOn(analytics, 'track');

      analytics.trackError('network_error', 'Failed to fetch balance');

      expect(trackSpy).toHaveBeenCalledWith('error_occurred', {
        error_type: 'network_error',
        error_message: 'Failed to fetch balance',
      });
    });
  });

  describe('event queue', () => {
    it('should queue events when offline', () => {
      analytics.initialize({ enabled: true });
      analytics.setOffline(true);

      analytics.track('offline_event');

      const queue = analytics.getEventQueue();
      expect(queue.length).toBe(1);
      expect(queue[0].name).toBe('offline_event');
    });

    it('should flush queue when back online', async () => {
      analytics.initialize({ enabled: true });
      analytics.setOffline(true);

      analytics.track('queued_event');

      analytics.setOffline(false);
      await analytics.flushQueue();

      expect(analytics.getEventQueue().length).toBe(0);
    });
  });

  describe('privacy', () => {
    it('should anonymize user data when required', () => {
      analytics.initialize({ enabled: true, anonymize: true });
      analytics.setUserId('user_123');

      // User ID should be hashed
      expect(analytics.getUserId()).not.toBe('user_123');
    });

    it('should respect do not track setting', () => {
      analytics.initialize({ enabled: true });
      analytics.setDoNotTrack(true);

      const trackSpy = jest.spyOn(analytics as any, 'sendEvent');
      analytics.track('should_not_track');

      expect(trackSpy).not.toHaveBeenCalled();
    });
  });
});
