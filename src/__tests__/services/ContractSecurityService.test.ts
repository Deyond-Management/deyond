/**
 * ContractSecurityService Tests
 */

import { ContractSecurityService } from '../../services/blockchain/ContractSecurityService';

describe('ContractSecurityService', () => {
  let contractSecurity: ContractSecurityService;

  beforeEach(() => {
    contractSecurity = new ContractSecurityService();
  });

  describe('validateContract', () => {
    it('should validate verified contracts as low risk', async () => {
      const result = await contractSecurity.validateContract(
        '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
        1
      );

      expect(result.isValid).toBe(true);
      expect(result.riskLevel).toBe('low');
      expect(result.warnings).toHaveLength(0);
    });

    it('should flag unverified contracts as medium risk', async () => {
      const result = await contractSecurity.validateContract(
        '0x1234567890123456789012345678901234567890',
        1
      );

      expect(result.riskLevel).toBe('medium');
      expect(result.warnings).toContain('Contract is not verified');
    });

    it('should handle address case insensitively', async () => {
      const result1 = await contractSecurity.validateContract(
        '0xDAC17F958D2EE523A2206206994597C13D831EC7',
        1
      );
      const result2 = await contractSecurity.validateContract(
        '0xdac17f958d2ee523a2206206994597c13d831ec7',
        1
      );

      expect(result1.riskLevel).toBe(result2.riskLevel);
    });
  });

  describe('analyzeApproval', () => {
    it('should detect unlimited approval', () => {
      const maxUint256 =
        '115792089237316195423570985008687907853269984665640564039457584007913129639935';
      const result = contractSecurity.analyzeApproval(
        '0x1234567890123456789012345678901234567890',
        maxUint256
      );

      expect(result.isUnlimited).toBe(true);
      expect(result.spender).toBe('0x1234567890123456789012345678901234567890');
      expect(result.amount).toBe(maxUint256);
    });

    it('should detect very large approvals as unlimited', () => {
      const largeAmount = '10000000000000000000000000'; // 10M tokens
      const result = contractSecurity.analyzeApproval(
        '0x1234567890123456789012345678901234567890',
        largeAmount
      );

      expect(result.isUnlimited).toBe(true);
    });

    it('should not flag normal approvals as unlimited', () => {
      const normalAmount = '1000000000000000000'; // 1 token
      const result = contractSecurity.analyzeApproval(
        '0x1234567890123456789012345678901234567890',
        normalAmount
      );

      expect(result.isUnlimited).toBe(false);
    });
  });

  describe('validateFunctionCall', () => {
    it('should identify transfer function', () => {
      const result = contractSecurity.validateFunctionCall(
        '0xa9059cbb0000000000000000000000001234567890123456789012345678901234567890'
      );

      expect(result.function).toBe('transfer');
      expect(result.isRisky).toBe(false);
    });

    it('should identify approve function as risky', () => {
      const result = contractSecurity.validateFunctionCall(
        '0x095ea7b30000000000000000000000001234567890123456789012345678901234567890'
      );

      expect(result.function).toBe('approve');
      expect(result.isRisky).toBe(true);
      expect(result.warning).toBe('Token approval requested');
    });

    it('should handle empty data', () => {
      const result = contractSecurity.validateFunctionCall('0x');

      expect(result.function).toBe('transfer');
      expect(result.isRisky).toBe(false);
    });

    it('should flag unknown functions as risky', () => {
      const result = contractSecurity.validateFunctionCall('0x12345678');

      expect(result.function).toBe('unknown');
      expect(result.isRisky).toBe(true);
      expect(result.warning).toBe('Unknown function call');
    });

    it('should identify transferFrom function', () => {
      const result = contractSecurity.validateFunctionCall('0x23b872dd');

      expect(result.function).toBe('transferFrom');
      expect(result.isRisky).toBe(false);
    });

    it('should identify increaseAllowance as risky', () => {
      const result = contractSecurity.validateFunctionCall('0x39509351');

      expect(result.function).toBe('increaseAllowance');
      expect(result.isRisky).toBe(true);
    });

    it('should identify setApprovalForAll as risky', () => {
      const result = contractSecurity.validateFunctionCall('0xa22cb465');

      expect(result.function).toBe('setApprovalForAll');
      expect(result.isRisky).toBe(true);
      expect(result.warning).toBe('Full NFT approval requested');
    });

    it('should identify safeTransferFrom function', () => {
      const result = contractSecurity.validateFunctionCall('0x42842e0e');

      expect(result.function).toBe('safeTransferFrom');
      expect(result.isRisky).toBe(false);
    });
  });

  describe('checkPhishingPatterns', () => {
    it('should detect unusually large transaction data', () => {
      const largeData = '0x' + '0'.repeat(1001);
      const warnings = contractSecurity.checkPhishingPatterns(
        '0x1234567890123456789012345678901234567890',
        largeData
      );

      expect(warnings).toContain('Unusually large transaction data');
    });

    it('should not warn for normal transaction data', () => {
      const normalData =
        '0xa9059cbb0000000000000000000000001234567890123456789012345678901234567890';
      const warnings = contractSecurity.checkPhishingPatterns(
        '0x1234567890123456789012345678901234567890',
        normalData
      );

      expect(warnings).toHaveLength(0);
    });

    it('should handle approval with zero value', () => {
      const zeroApproval =
        '0x095ea7b30000000000000000000000001234567890123456789012345678901234567890' +
        '0000000000000000000000000000000000000000000000000000000000000000';
      const warnings = contractSecurity.checkPhishingPatterns(
        '0x1234567890123456789012345678901234567890',
        zeroApproval
      );

      // Should not throw error and return empty warnings
      expect(warnings).toBeDefined();
    });
  });

  describe('getRecommendedApproval', () => {
    it('should recommend amount with 10% buffer', () => {
      const needed = '1000000000000000000'; // 1 token
      const recommended = contractSecurity.getRecommendedApproval('999999999999999999999', needed);

      const expectedBuffer = BigInt(needed) + BigInt(needed) / BigInt(10);
      expect(recommended).toBe(expectedBuffer.toString());
    });

    it('should handle large amounts', () => {
      const needed = '100000000000000000000'; // 100 tokens
      const recommended = contractSecurity.getRecommendedApproval('999999999999999999999', needed);

      const expectedBuffer = BigInt(needed) + BigInt(needed) / BigInt(10);
      expect(recommended).toBe(expectedBuffer.toString());
    });
  });

  describe('simulateTransaction', () => {
    it('should simulate transaction successfully', async () => {
      const result = await contractSecurity.simulateTransaction({
        from: '0x1234567890123456789012345678901234567890',
        to: '0x9876543210987654321098765432109876543210',
        value: '1000000000000000000',
        data: '0x',
        chainId: 1,
      });

      expect(result.success).toBe(true);
      expect(result.gasUsed).toBeDefined();
      expect(result.stateChanges).toBeDefined();
    });

    it('should return gas estimate', async () => {
      const result = await contractSecurity.simulateTransaction({
        from: '0x1234567890123456789012345678901234567890',
        to: '0x9876543210987654321098765432109876543210',
        value: '0',
        data: '0xa9059cbb',
        chainId: 1,
      });

      expect(result.gasUsed).toBe('21000');
    });
  });
});
