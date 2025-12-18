/**
 * UnitConverter Tests
 */

import { UnitConverter } from '../UnitConverter';

describe('UnitConverter', () => {
  describe('Ethereum conversions', () => {
    describe('weiToGwei', () => {
      it('should convert wei to gwei', () => {
        expect(UnitConverter.weiToGwei('1000000000')).toBe('1');
        expect(UnitConverter.weiToGwei('0')).toBe('0');
        expect(UnitConverter.weiToGwei('500000000')).toBe('0.5');
      });

      it('should handle large values', () => {
        expect(UnitConverter.weiToGwei('1000000000000000000')).toBe('1000000000');
      });
    });

    describe('weiToEther', () => {
      it('should convert wei to ether', () => {
        expect(UnitConverter.weiToEther('1000000000000000000')).toBe('1');
        expect(UnitConverter.weiToEther('0')).toBe('0');
        expect(UnitConverter.weiToEther('500000000000000000')).toBe('0.5');
      });

      it('should handle small values', () => {
        const result = UnitConverter.weiToEther('1000000000000');
        expect(result).toBe('0.000001');
      });
    });

    describe('gweiToWei', () => {
      it('should convert gwei to wei', () => {
        expect(UnitConverter.gweiToWei('1')).toBe('1000000000');
        expect(UnitConverter.gweiToWei('0')).toBe('0');
        expect(UnitConverter.gweiToWei('50')).toBe('50000000000');
      });
    });

    describe('etherToWei', () => {
      it('should convert ether to wei', () => {
        expect(UnitConverter.etherToWei('1')).toBe('1000000000000000000');
        expect(UnitConverter.etherToWei('0')).toBe('0');
        expect(UnitConverter.etherToWei('0.5')).toBe('500000000000000000');
      });

      it('should handle decimal values', () => {
        expect(UnitConverter.etherToWei('0.000001')).toBe('1000000000000');
      });
    });
  });

  describe('Solana conversions', () => {
    describe('lamportsToSol', () => {
      it('should convert lamports to SOL', () => {
        expect(UnitConverter.lamportsToSol('1000000000')).toBe('1');
        expect(UnitConverter.lamportsToSol('0')).toBe('0');
        expect(UnitConverter.lamportsToSol('500000000')).toBe('0.5');
      });
    });

    describe('solToLamports', () => {
      it('should convert SOL to lamports', () => {
        expect(UnitConverter.solToLamports('1')).toBe('1000000000');
        expect(UnitConverter.solToLamports('0')).toBe('0');
        expect(UnitConverter.solToLamports('0.5')).toBe('500000000');
      });
    });
  });

  describe('Bitcoin conversions', () => {
    describe('satoshisToBtc', () => {
      it('should convert satoshis to BTC', () => {
        expect(UnitConverter.satoshisToBtc('100000000')).toBe('1');
        expect(UnitConverter.satoshisToBtc('0')).toBe('0');
        expect(UnitConverter.satoshisToBtc('50000000')).toBe('0.5');
      });
    });

    describe('btcToSatoshis', () => {
      it('should convert BTC to satoshis', () => {
        expect(UnitConverter.btcToSatoshis('1')).toBe('100000000');
        expect(UnitConverter.btcToSatoshis('0')).toBe('0');
        expect(UnitConverter.btcToSatoshis('0.5')).toBe('50000000');
      });
    });
  });

  describe('Generic conversions', () => {
    describe('fromSmallestUnit', () => {
      it('should convert from smallest unit with specified decimals', () => {
        expect(UnitConverter.fromSmallestUnit('1000000', 6)).toBe('1');
        expect(UnitConverter.fromSmallestUnit('500000', 6)).toBe('0.5');
      });
    });

    describe('toSmallestUnit', () => {
      it('should convert to smallest unit with specified decimals', () => {
        expect(UnitConverter.toSmallestUnit('1', 6)).toBe('1000000');
        expect(UnitConverter.toSmallestUnit('0.5', 6)).toBe('500000');
      });
    });
  });

  describe('Formatting', () => {
    describe('formatCryptoValue', () => {
      it('should format crypto values with symbol', () => {
        expect(UnitConverter.formatCryptoValue('1.23456789', 'ETH')).toBe('1.234568 ETH');
      });

      it('should format crypto values with custom decimals', () => {
        expect(UnitConverter.formatCryptoValue('1.23456789', 'ETH', 2)).toBe('1.23 ETH');
      });

      it('should handle very small values', () => {
        const result = UnitConverter.formatCryptoValue('0.000001234', 'ETH');
        expect(result).toBe('0.000001 ETH');
      });
    });

    describe('formatFiatValue', () => {
      it('should format fiat values with default currency', () => {
        expect(UnitConverter.formatFiatValue(1234.56)).toBe('$1,234.56');
      });

      it('should format fiat values with custom currency', () => {
        expect(UnitConverter.formatFiatValue(1234.56, 'EUR')).toBe('€1,234.56');
      });
    });

    describe('formatCompact', () => {
      it('should format large numbers compactly', () => {
        expect(UnitConverter.formatCompact(1000000)).toMatch(/^1(\.00)?M$/);
        expect(UnitConverter.formatCompact(1500000)).toMatch(/^1\.5(0)?M$/);
        expect(UnitConverter.formatCompact(1000)).toMatch(/^1(\.00)?K$/);
        expect(UnitConverter.formatCompact(999)).toBe('999');
      });

      it('should handle billions', () => {
        expect(UnitConverter.formatCompact(1000000000)).toMatch(/^1(\.00)?B$/);
      });
    });
  });
});
