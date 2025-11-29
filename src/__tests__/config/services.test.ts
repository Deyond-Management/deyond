/**
 * Service Configuration Tests
 */

import {
  rpcConfig,
  priceConfig,
  sentryConfig,
  analyticsConfig,
  walletConnectConfig,
  apiConfig,
} from '../../config/services';

describe('Service Configuration', () => {
  describe('rpcConfig', () => {
    it('should export RPC configuration', () => {
      expect(rpcConfig).toBeDefined();
    });

    it('should have ethereum configurations', () => {
      expect(rpcConfig.ethereum).toBeDefined();
      expect(rpcConfig.ethereum.mainnet).toBeDefined();
      expect(rpcConfig.ethereum.goerli).toBeDefined();
      expect(rpcConfig.ethereum.sepolia).toBeDefined();
    });

    it('should have correct chainIds', () => {
      expect(rpcConfig.ethereum.mainnet.chainId).toBe(1);
      expect(rpcConfig.ethereum.goerli.chainId).toBe(5);
      expect(rpcConfig.ethereum.sepolia.chainId).toBe(11155111);
    });

    it('should have polygon configurations', () => {
      expect(rpcConfig.polygon).toBeDefined();
      expect(rpcConfig.polygon.mainnet.chainId).toBe(137);
    });

    it('should have arbitrum configurations', () => {
      expect(rpcConfig.arbitrum).toBeDefined();
      expect(rpcConfig.arbitrum.mainnet.chainId).toBe(42161);
    });

    it('should have optimism configurations', () => {
      expect(rpcConfig.optimism).toBeDefined();
      expect(rpcConfig.optimism.mainnet.chainId).toBe(10);
    });
  });

  describe('priceConfig', () => {
    it('should export price configuration', () => {
      expect(priceConfig).toBeDefined();
      expect(priceConfig.coingecko).toBeDefined();
    });

    it('should have coingecko settings', () => {
      expect(priceConfig.coingecko.baseUrl).toBeDefined();
      expect(priceConfig.coingecko.cacheTTL).toBeGreaterThan(0);
      expect(priceConfig.coingecko.rateLimitPerMinute).toBeGreaterThan(0);
    });
  });

  describe('sentryConfig', () => {
    it('should export sentry configuration', () => {
      expect(sentryConfig).toBeDefined();
    });

    it('should have sentry settings', () => {
      expect(sentryConfig).toHaveProperty('dsn');
      expect(sentryConfig).toHaveProperty('environment');
      expect(sentryConfig).toHaveProperty('tracesSampleRate');
      expect(sentryConfig).toHaveProperty('enableAutoSessionTracking');
      expect(sentryConfig).toHaveProperty('attachStacktrace');
    });

    it('should have valid trace sample rate', () => {
      expect(sentryConfig.tracesSampleRate).toBeGreaterThanOrEqual(0);
      expect(sentryConfig.tracesSampleRate).toBeLessThanOrEqual(1);
    });
  });

  describe('analyticsConfig', () => {
    it('should export analytics configuration', () => {
      expect(analyticsConfig).toBeDefined();
    });

    it('should have mixpanel configuration', () => {
      expect(analyticsConfig.mixpanel).toBeDefined();
      expect(analyticsConfig.mixpanel).toHaveProperty('token');
      expect(analyticsConfig.mixpanel).toHaveProperty('trackAutomaticEvents');
    });

    it('should have amplitude configuration', () => {
      expect(analyticsConfig.amplitude).toBeDefined();
      expect(analyticsConfig.amplitude).toHaveProperty('apiKey');
      expect(analyticsConfig.amplitude).toHaveProperty('trackingOptions');
    });

    it('should have tracking options', () => {
      const { trackingOptions } = analyticsConfig.amplitude;
      expect(trackingOptions).toBeDefined();
      expect(trackingOptions).toHaveProperty('ipAddress');
      expect(trackingOptions).toHaveProperty('language');
      expect(trackingOptions).toHaveProperty('platform');
    });
  });

  describe('walletConnectConfig', () => {
    it('should export walletConnect configuration', () => {
      expect(walletConnectConfig).toBeDefined();
    });

    it('should have projectId', () => {
      expect(walletConnectConfig).toHaveProperty('projectId');
    });

    it('should have metadata', () => {
      expect(walletConnectConfig.metadata).toBeDefined();
      expect(walletConnectConfig.metadata.name).toBe('Deyond Wallet');
      expect(walletConnectConfig.metadata.description).toBeDefined();
      expect(walletConnectConfig.metadata.url).toBeDefined();
      expect(Array.isArray(walletConnectConfig.metadata.icons)).toBe(true);
    });
  });

  describe('apiConfig', () => {
    it('should export API configuration', () => {
      expect(apiConfig).toBeDefined();
    });

    it('should have baseUrl and timeout', () => {
      expect(apiConfig.baseUrl).toBeDefined();
      expect(apiConfig.timeout).toBeGreaterThan(0);
      expect(apiConfig.retries).toBeGreaterThan(0);
    });

    it('should have headers', () => {
      expect(apiConfig.headers).toBeDefined();
      expect(apiConfig.headers['Content-Type']).toBe('application/json');
      expect(apiConfig.headers['X-Client-Version']).toBeDefined();
    });
  });
});
