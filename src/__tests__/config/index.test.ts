/**
 * App Configuration Tests
 */

import { NETWORKS, DEFAULT_TOKENS, config } from '../../config/index';

describe('App Configuration', () => {
  describe('NETWORKS', () => {
    it('should export network configurations', () => {
      expect(NETWORKS).toBeDefined();
      expect(Object.keys(NETWORKS).length).toBeGreaterThan(0);
    });

    it('should have ethereum-mainnet configuration', () => {
      expect(NETWORKS['ethereum-mainnet']).toBeDefined();
      expect(NETWORKS['ethereum-mainnet'].id).toBe('ethereum-mainnet');
      expect(NETWORKS['ethereum-mainnet'].chainId).toBe(1);
      expect(NETWORKS['ethereum-mainnet'].symbol).toBe('ETH');
      expect(NETWORKS['ethereum-mainnet'].isTestnet).toBe(false);
    });

    it('should have ethereum-goerli configuration', () => {
      expect(NETWORKS['ethereum-goerli']).toBeDefined();
      expect(NETWORKS['ethereum-goerli'].chainId).toBe(5);
      expect(NETWORKS['ethereum-goerli'].isTestnet).toBe(true);
    });

    it('should have polygon-mainnet configuration', () => {
      expect(NETWORKS['polygon-mainnet']).toBeDefined();
      expect(NETWORKS['polygon-mainnet'].chainId).toBe(137);
      expect(NETWORKS['polygon-mainnet'].symbol).toBe('MATIC');
    });

    it('should have polygon-mumbai configuration', () => {
      expect(NETWORKS['polygon-mumbai']).toBeDefined();
      expect(NETWORKS['polygon-mumbai'].chainId).toBe(80001);
      expect(NETWORKS['polygon-mumbai'].isTestnet).toBe(true);
    });

    it('should have arbitrum-mainnet configuration', () => {
      expect(NETWORKS['arbitrum-mainnet']).toBeDefined();
      expect(NETWORKS['arbitrum-mainnet'].chainId).toBe(42161);
    });

    it('should have optimism-mainnet configuration', () => {
      expect(NETWORKS['optimism-mainnet']).toBeDefined();
      expect(NETWORKS['optimism-mainnet'].chainId).toBe(10);
    });

    it('should have required fields for each network', () => {
      Object.values(NETWORKS).forEach(network => {
        expect(network).toHaveProperty('id');
        expect(network).toHaveProperty('name');
        expect(network).toHaveProperty('chainId');
        expect(network).toHaveProperty('rpcUrl');
        expect(network).toHaveProperty('symbol');
        expect(network).toHaveProperty('explorerUrl');
        expect(network).toHaveProperty('isTestnet');
      });
    });
  });

  describe('DEFAULT_TOKENS', () => {
    it('should export default tokens', () => {
      expect(DEFAULT_TOKENS).toBeDefined();
      expect(Object.keys(DEFAULT_TOKENS).length).toBeGreaterThan(0);
    });

    it('should have ETH token', () => {
      expect(DEFAULT_TOKENS.ETH).toBeDefined();
      expect(DEFAULT_TOKENS.ETH.symbol).toBe('ETH');
      expect(DEFAULT_TOKENS.ETH.decimals).toBe(18);
      expect(DEFAULT_TOKENS.ETH.address).toBe('0x0000000000000000000000000000000000000000');
    });

    it('should have USDT token', () => {
      expect(DEFAULT_TOKENS.USDT).toBeDefined();
      expect(DEFAULT_TOKENS.USDT.symbol).toBe('USDT');
      expect(DEFAULT_TOKENS.USDT.decimals).toBe(6);
    });

    it('should have USDC token', () => {
      expect(DEFAULT_TOKENS.USDC).toBeDefined();
      expect(DEFAULT_TOKENS.USDC.symbol).toBe('USDC');
      expect(DEFAULT_TOKENS.USDC.decimals).toBe(6);
    });

    it('should have required fields for each token', () => {
      Object.values(DEFAULT_TOKENS).forEach(token => {
        expect(token).toHaveProperty('address');
        expect(token).toHaveProperty('symbol');
        expect(token).toHaveProperty('name');
        expect(token).toHaveProperty('decimals');
        expect(token).toHaveProperty('iconUrl');
      });
    });
  });

  describe('config', () => {
    it('should export config object', () => {
      expect(config).toBeDefined();
    });

    it('should have environment settings', () => {
      expect(config).toHaveProperty('env');
      expect(config).toHaveProperty('isDevelopment');
      expect(config).toHaveProperty('isProduction');
      expect(config).toHaveProperty('isTest');
    });

    it('should have API configuration', () => {
      expect(config.api).toBeDefined();
      expect(config.api).toHaveProperty('baseUrl');
      expect(config.api).toHaveProperty('timeout');
      expect(config.api.timeout).toBeGreaterThan(0);
    });

    it('should have feature flags', () => {
      expect(config.features).toBeDefined();
      expect(config.features).toHaveProperty('biometrics');
      expect(config.features).toHaveProperty('bleChat');
      expect(config.features).toHaveProperty('testnetNetworks');
      expect(config.features).toHaveProperty('analytics');
    });

    it('should have defaults', () => {
      expect(config.defaults).toBeDefined();
      expect(config.defaults).toHaveProperty('network');
      expect(config.defaults).toHaveProperty('currency');
      expect(config.defaults).toHaveProperty('language');
      expect(config.defaults).toHaveProperty('theme');
    });

    it('should have consistent default network', () => {
      expect(config.defaults.network).toBe('ethereum-mainnet');
      expect(NETWORKS[config.defaults.network]).toBeDefined();
    });
  });
});
