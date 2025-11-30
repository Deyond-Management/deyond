/**
 * FeatureFlagService Tests
 */

import { FeatureFlagService } from '../../services/monitoring/FeatureFlagService';

describe('FeatureFlagService', () => {
  let featureFlags: FeatureFlagService;

  beforeEach(() => {
    featureFlags = new FeatureFlagService();
  });

  describe('flag management', () => {
    it('should set and get flag', () => {
      featureFlags.setFlag('newFeature', true);
      expect(featureFlags.isEnabled('newFeature')).toBe(true);
    });

    it('should return false for unknown flag', () => {
      expect(featureFlags.isEnabled('unknownFlag')).toBe(false);
    });

    it('should use default value for unknown flag', () => {
      expect(featureFlags.isEnabled('unknownFlag', true)).toBe(true);
    });

    it('should override default with stored value', () => {
      featureFlags.setFlag('feature', false);
      expect(featureFlags.isEnabled('feature', true)).toBe(false);
    });
  });

  describe('bulk operations', () => {
    it('should set multiple flags', () => {
      featureFlags.setFlags({
        feature1: true,
        feature2: false,
        feature3: true,
      });

      expect(featureFlags.isEnabled('feature1')).toBe(true);
      expect(featureFlags.isEnabled('feature2')).toBe(false);
      expect(featureFlags.isEnabled('feature3')).toBe(true);
    });

    it('should get all flags', () => {
      featureFlags.setFlags({
        a: true,
        b: false,
      });

      const all = featureFlags.getAllFlags();
      expect(all).toEqual({ a: true, b: false });
    });
  });

  describe('remote config', () => {
    it('should load from remote config', async () => {
      const mockConfig = {
        darkMode: true,
        walletConnect: true,
        nftSupport: false,
      };

      await featureFlags.loadRemoteConfig(async () => mockConfig);

      expect(featureFlags.isEnabled('darkMode')).toBe(true);
      expect(featureFlags.isEnabled('walletConnect')).toBe(true);
      expect(featureFlags.isEnabled('nftSupport')).toBe(false);
    });

    it('should handle remote config error', async () => {
      const errorFetcher = async () => {
        throw new Error('Network error');
      };

      await expect(featureFlags.loadRemoteConfig(errorFetcher)).rejects.toThrow();
    });
  });

  describe('user targeting', () => {
    it('should enable flag for specific user', () => {
      featureFlags.setUserFlag('userId123', 'betaFeature', true);
      expect(featureFlags.isEnabledForUser('userId123', 'betaFeature')).toBe(true);
    });

    it('should return false for non-targeted user', () => {
      featureFlags.setUserFlag('userId123', 'betaFeature', true);
      expect(featureFlags.isEnabledForUser('otherUser', 'betaFeature')).toBe(false);
    });
  });

  describe('percentage rollout', () => {
    it('should enable for percentage of users', () => {
      featureFlags.setPercentageRollout('gradualFeature', 50);

      // Test with deterministic user IDs
      let enabled = 0;
      for (let i = 0; i < 100; i++) {
        if (featureFlags.isEnabledForUser(`user${i}`, 'gradualFeature')) {
          enabled++;
        }
      }

      // Should be roughly 50% (allow some variance)
      expect(enabled).toBeGreaterThan(30);
      expect(enabled).toBeLessThan(70);
    });
  });

  describe('event tracking', () => {
    it('should track flag evaluation', () => {
      const tracker = jest.fn();
      featureFlags.setTracker(tracker);

      featureFlags.setFlag('trackedFeature', true);
      featureFlags.isEnabled('trackedFeature');

      expect(tracker).toHaveBeenCalledWith('trackedFeature', true);
    });
  });

  describe('reset', () => {
    it('should reset all flags', () => {
      featureFlags.setFlags({ a: true, b: true });
      featureFlags.reset();

      expect(featureFlags.isEnabled('a')).toBe(false);
      expect(featureFlags.isEnabled('b')).toBe(false);
    });
  });
});
