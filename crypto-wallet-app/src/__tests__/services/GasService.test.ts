/**
 * GasService Tests
 * TDD: Write tests first, then implement
 */

import {
  GasService,
  GasError,
  GasPreset,
  GasEstimate,
} from '../../services/GasService';

describe('GasService', () => {
  let gasService: GasService;

  beforeEach(() => {
    gasService = new GasService();
  });

  describe('Gas Price Fetching', () => {
    it('should fetch current gas prices', async () => {
      const gasData = await gasService.getGasPrices();

      expect(gasData).toBeDefined();
      expect(gasData.slow).toBeDefined();
      expect(gasData.standard).toBeDefined();
      expect(gasData.fast).toBeDefined();
    });

    it('should return gas prices in gwei', async () => {
      const gasData = await gasService.getGasPrices();

      expect(typeof gasData.slow.maxFeePerGas).toBe('string');
      expect(typeof gasData.standard.maxFeePerGas).toBe('string');
      expect(typeof gasData.fast.maxFeePerGas).toBe('string');
    });

    it('should include priority fee (EIP-1559)', async () => {
      const gasData = await gasService.getGasPrices();

      expect(gasData.slow.maxPriorityFeePerGas).toBeDefined();
      expect(gasData.standard.maxPriorityFeePerGas).toBeDefined();
      expect(gasData.fast.maxPriorityFeePerGas).toBeDefined();
    });

    it('should include estimated time', async () => {
      const gasData = await gasService.getGasPrices();

      expect(gasData.slow.estimatedTime).toBeDefined();
      expect(gasData.standard.estimatedTime).toBeDefined();
      expect(gasData.fast.estimatedTime).toBeDefined();
    });
  });

  describe('Gas Estimation', () => {
    it('should estimate gas for ETH transfer', async () => {
      const estimate = await gasService.estimateGas({
        to: '0x1234567890123456789012345678901234567890',
        value: '1000000000000000000', // 1 ETH in wei
      });

      expect(estimate).toBeDefined();
      expect(typeof estimate.gasLimit).toBe('string');
    });

    it('should return 21000 gas for simple ETH transfer', async () => {
      const estimate = await gasService.estimateGas({
        to: '0x1234567890123456789012345678901234567890',
        value: '1000000000000000000',
      });

      expect(estimate.gasLimit).toBe('21000');
    });

    it('should estimate higher gas for contract calls', async () => {
      const estimate = await gasService.estimateGas({
        to: '0x1234567890123456789012345678901234567890',
        data: '0xa9059cbb', // ERC-20 transfer signature
        value: '0',
      });

      expect(parseInt(estimate.gasLimit)).toBeGreaterThan(21000);
    });

    it('should throw error for invalid address', async () => {
      await expect(
        gasService.estimateGas({
          to: 'invalid',
          value: '1000000000000000000',
        })
      ).rejects.toThrow(GasError);
    });
  });

  describe('Fee Calculation', () => {
    it('should calculate total fee in ETH', () => {
      const fee = gasService.calculateFee({
        gasLimit: '21000',
        maxFeePerGas: '50', // gwei
      });

      // 21000 * 50 gwei = 1,050,000 gwei = 0.00105 ETH
      expect(fee.totalFeeETH).toBe('0.00105');
    });

    it('should calculate fee in USD', () => {
      const fee = gasService.calculateFee({
        gasLimit: '21000',
        maxFeePerGas: '50',
        ethPriceUSD: 2000,
      });

      // 0.00105 ETH * 2000 = 2.1 USD
      expect(fee.totalFeeUSD).toBe('2.10');
    });

    it('should handle decimal precision', () => {
      const fee = gasService.calculateFee({
        gasLimit: '21000',
        maxFeePerGas: '30.5',
      });

      expect(fee.totalFeeETH).toBeDefined();
      expect(parseFloat(fee.totalFeeETH)).toBeGreaterThan(0);
    });
  });

  describe('Presets', () => {
    it('should return slow preset with lowest fee', async () => {
      const gasData = await gasService.getGasPrices();

      const slowFee = parseFloat(gasData.slow.maxFeePerGas);
      const standardFee = parseFloat(gasData.standard.maxFeePerGas);
      const fastFee = parseFloat(gasData.fast.maxFeePerGas);

      expect(slowFee).toBeLessThanOrEqual(standardFee);
      expect(standardFee).toBeLessThanOrEqual(fastFee);
    });

    it('should return fast preset with highest fee', async () => {
      const gasData = await gasService.getGasPrices();

      const fastTime = gasData.fast.estimatedTime;
      const standardTime = gasData.standard.estimatedTime;
      const slowTime = gasData.slow.estimatedTime;

      expect(fastTime).toBeLessThanOrEqual(standardTime);
      expect(standardTime).toBeLessThanOrEqual(slowTime);
    });
  });

  describe('Custom Gas', () => {
    it('should validate custom gas limit', () => {
      expect(() => gasService.validateGasLimit('20999')).toThrow();
      expect(() => gasService.validateGasLimit('21000')).not.toThrow();
    });

    it('should validate custom gas price', () => {
      expect(() => gasService.validateGasPrice('0')).toThrow();
      expect(() => gasService.validateGasPrice('-1')).toThrow();
      expect(() => gasService.validateGasPrice('10')).not.toThrow();
    });

    it('should validate max fee per gas', () => {
      expect(() => gasService.validateMaxFee('1000001')).toThrow(); // Too high
      expect(() => gasService.validateMaxFee('50')).not.toThrow();
    });
  });

  describe('Formatting', () => {
    it('should format gwei to ETH', () => {
      const eth = gasService.gweiToEth('1000000000'); // 1 billion gwei = 1 ETH
      expect(eth).toBe('1');
    });

    it('should format wei to gwei', () => {
      const gwei = gasService.weiToGwei('1000000000'); // 1 billion wei = 1 gwei
      expect(gwei).toBe('1');
    });

    it('should format gas price for display', () => {
      const formatted = gasService.formatGasPrice('50000000000'); // 50 gwei in wei
      expect(formatted).toBe('50 Gwei');
    });
  });

  describe('Caching', () => {
    it('should cache gas prices', async () => {
      const first = await gasService.getGasPrices();
      const second = await gasService.getGasPrices();

      // Should return cached data
      expect(first).toEqual(second);
    });

    it('should refresh cache after timeout', async () => {
      const first = await gasService.getGasPrices();

      // Force cache expiry
      gasService.clearCache();

      const second = await gasService.getGasPrices();

      // Data should still be valid (mocked)
      expect(second).toBeDefined();
    });
  });
});
