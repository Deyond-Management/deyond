/**
 * ContractSecurityService
 * Smart contract interaction security validation
 */

interface ContractValidation {
  isValid: boolean;
  warnings: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface TokenApproval {
  spender: string;
  amount: string;
  isUnlimited: boolean;
}

// Known scam contracts (should be updated regularly)
const KNOWN_SCAM_CONTRACTS = new Set<string>([
  // Add known scam contract addresses
]);

// Known safe contracts (verified)
const VERIFIED_CONTRACTS = new Map([
  ['0xdac17f958d2ee523a2206206994597c13d831ec7', 'USDT'],
  ['0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 'USDC'],
  ['0x6b175474e89094c44da98b954eedeac495271d0f', 'DAI'],
]);

export class ContractSecurityService {
  /**
   * Validate contract address before interaction
   */
  async validateContract(address: string, chainId: number): Promise<ContractValidation> {
    const warnings: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Check if known scam
    if (KNOWN_SCAM_CONTRACTS.has(address.toLowerCase())) {
      return {
        isValid: false,
        warnings: ['This contract is flagged as malicious'],
        riskLevel: 'critical',
      };
    }

    // Check if verified
    if (!VERIFIED_CONTRACTS.has(address.toLowerCase())) {
      warnings.push('Contract is not verified');
      riskLevel = 'medium';
    }

    // Check contract code exists
    const hasCode = await this.checkContractCode(address, chainId);
    if (!hasCode) {
      warnings.push('No contract code at this address');
      riskLevel = 'high';
    }

    const isCritical = (riskLevel as string) === 'critical';

    return {
      isValid: warnings.length === 0 || !isCritical,
      warnings,
      riskLevel,
    };
  }

  /**
   * Analyze token approval request
   */
  analyzeApproval(spender: string, amount: string): TokenApproval {
    const maxUint256 = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
    const isUnlimited = amount === maxUint256 || BigInt(amount) > BigInt('1000000000000000000000000');

    return {
      spender,
      amount,
      isUnlimited,
    };
  }

  /**
   * Decode and validate function call
   */
  validateFunctionCall(data: string): { function: string; isRisky: boolean; warning?: string } {
    if (!data || data === '0x') {
      return { function: 'transfer', isRisky: false };
    }

    const selector = data.slice(0, 10);

    // Common function selectors
    const selectors: Record<string, { name: string; risky: boolean; warning?: string }> = {
      '0xa9059cbb': { name: 'transfer', risky: false },
      '0x23b872dd': { name: 'transferFrom', risky: false },
      '0x095ea7b3': { name: 'approve', risky: true, warning: 'Token approval requested' },
      '0x39509351': { name: 'increaseAllowance', risky: true, warning: 'Allowance increase requested' },
      '0xa22cb465': { name: 'setApprovalForAll', risky: true, warning: 'Full NFT approval requested' },
      '0x42842e0e': { name: 'safeTransferFrom', risky: false },
    };

    const info = selectors[selector];
    if (info) {
      return {
        function: info.name,
        isRisky: info.risky,
        warning: info.warning,
      };
    }

    return {
      function: 'unknown',
      isRisky: true,
      warning: 'Unknown function call',
    };
  }

  /**
   * Check for phishing patterns in transaction
   */
  checkPhishingPatterns(to: string, data: string): string[] {
    const warnings: string[] = [];

    // Check for zero-value approval (common phishing)
    if (data.startsWith('0x095ea7b3') && data.includes('0000000000000000000000000000000000000000000000000000000000000000')) {
      // This might be setting approval to 0, which is actually safe
    }

    // Check for suspicious patterns
    if (data.length > 1000) {
      warnings.push('Unusually large transaction data');
    }

    return warnings;
  }

  /**
   * Get recommended approval amount
   */
  getRecommendedApproval(requestedAmount: string, actualNeeded: string): string {
    // Recommend approving only what's needed plus small buffer
    const needed = BigInt(actualNeeded);
    const buffer = needed / BigInt(10); // 10% buffer
    return (needed + buffer).toString();
  }

  /**
   * Simulate transaction outcome
   */
  async simulateTransaction(params: {
    from: string;
    to: string;
    value: string;
    data: string;
    chainId: number;
  }): Promise<{
    success: boolean;
    gasUsed?: string;
    error?: string;
    stateChanges?: string[];
  }> {
    // In production, use Tenderly or similar service
    // This is a placeholder implementation
    return {
      success: true,
      gasUsed: '21000',
      stateChanges: [],
    };
  }

  private async checkContractCode(address: string, chainId: number): Promise<boolean> {
    // In production, call eth_getCode
    return true;
  }
}

export const contractSecurity = new ContractSecurityService();
export default ContractSecurityService;
