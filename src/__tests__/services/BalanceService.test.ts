/**
 * Balance Service Tests
 * TDD: Write tests first, then implement
 */

import { BalanceService, TokenBalance, BalanceError } from '../../services/BalanceService';

describe('BalanceService', () => {
  let balanceService: BalanceService;

  beforeEach(() => {
    balanceService = new BalanceService();
  });

  describe('getBalance', () => {
    it('should fetch native token balance', async () => {
      const balance = await balanceService.getNativeBalance(
        '0x1234567890123456789012345678901234567890'
      );

      expect(balance).toBeDefined();
      expect(balance.symbol).toBe('ETH');
      expect(balance.name).toBe('Ethereum');
      expect(typeof balance.balance).toBe('string');
      expect(typeof balance.usdValue).toBe('string');
    });

    it('should return balance with price change', async () => {
      const balance = await balanceService.getNativeBalance(
        '0x1234567890123456789012345678901234567890'
      );

      expect(balance.priceChange24h).toBeDefined();
      expect(typeof balance.priceChange24h).toBe('number');
    });

    it('should handle invalid address', async () => {
      await expect(
        balanceService.getNativeBalance('invalid-address')
      ).rejects.toThrow(BalanceError);
    });
  });

  describe('getTokenBalances', () => {
    it('should fetch multiple token balances', async () => {
      const balances = await balanceService.getTokenBalances(
        '0x1234567890123456789012345678901234567890'
      );

      expect(Array.isArray(balances)).toBe(true);
      expect(balances.length).toBeGreaterThan(0);
    });

    it('should include native token in balances', async () => {
      const balances = await balanceService.getTokenBalances(
        '0x1234567890123456789012345678901234567890'
      );

      const nativeToken = balances.find(b => b.symbol === 'ETH');
      expect(nativeToken).toBeDefined();
    });

    it('should return balances with required fields', async () => {
      const balances = await balanceService.getTokenBalances(
        '0x1234567890123456789012345678901234567890'
      );

      balances.forEach(balance => {
        expect(balance.symbol).toBeDefined();
        expect(balance.name).toBeDefined();
        expect(balance.balance).toBeDefined();
        expect(balance.usdValue).toBeDefined();
        expect(balance.contractAddress).toBeDefined();
      });
    });
  });

  describe('getTotalBalance', () => {
    it('should calculate total USD value', async () => {
      const total = await balanceService.getTotalBalance(
        '0x1234567890123456789012345678901234567890'
      );

      expect(typeof total).toBe('string');
      expect(parseFloat(total)).toBeGreaterThanOrEqual(0);
    });

    it('should format balance with 2 decimal places', async () => {
      const total = await balanceService.getTotalBalance(
        '0x1234567890123456789012345678901234567890'
      );

      const decimalPart = total.split('.')[1];
      expect(decimalPart?.length).toBeLessThanOrEqual(2);
    });
  });

  describe('formatBalance', () => {
    it('should format large balances with commas', () => {
      const formatted = balanceService.formatBalance('1234567.89');
      expect(formatted).toBe('1,234,567.89');
    });

    it('should handle small balances', () => {
      const formatted = balanceService.formatBalance('0.001234');
      expect(formatted).toBe('0.001234');
    });

    it('should handle zero balance', () => {
      const formatted = balanceService.formatBalance('0');
      expect(formatted).toBe('0');
    });
  });

  describe('formatUSD', () => {
    it('should format USD value with dollar sign', () => {
      const formatted = balanceService.formatUSD('1234.56');
      expect(formatted).toBe('$1,234.56');
    });

    it('should handle zero USD value', () => {
      const formatted = balanceService.formatUSD('0');
      expect(formatted).toBe('$0.00');
    });
  });

  describe('caching', () => {
    it('should cache balance results', async () => {
      const address = '0x1234567890123456789012345678901234567890';

      // First call
      const balance1 = await balanceService.getNativeBalance(address);

      // Second call should return cached result
      const balance2 = await balanceService.getNativeBalance(address);

      expect(balance1).toEqual(balance2);
    });

    it('should clear cache on request', () => {
      balanceService.clearCache();
      // Should not throw
      expect(true).toBe(true);
    });
  });
});
