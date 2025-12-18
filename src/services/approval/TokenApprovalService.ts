/**
 * TokenApprovalService
 * Service for managing and monitoring token approvals
 */

import { ethers } from 'ethers';
import {
  TokenApproval,
  SpenderInfo,
  RevokeApprovalParams,
  ScanApprovalsResult,
  ApprovalStats,
  ApprovalRiskLevel,
  UNLIMITED_THRESHOLD,
  RISK_THRESHOLDS,
} from './types';

// ERC20 ABI for approval functions
const ERC20_ABI = [
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function decimals() view returns (uint8)',
];

// Known spender database (in production, this would be fetched from a service)
const KNOWN_SPENDERS: Record<string, SpenderInfo> = {
  // Ethereum Mainnet
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': {
    address: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
    name: 'Uniswap V2 Router',
    verified: true,
    category: 'dex',
    riskLevel: 'low',
  },
  '0xe592427a0aece92de3edee1f18e0157c05861564': {
    address: '0xe592427a0aece92de3edee1f18e0157c05861564',
    name: 'Uniswap V3 Router',
    verified: true,
    category: 'dex',
    riskLevel: 'low',
  },
  '0x1111111254eeb25477b68fb85ed929f73a960582': {
    address: '0x1111111254eeb25477b68fb85ed929f73a960582',
    name: '1inch Router',
    verified: true,
    category: 'dex',
    riskLevel: 'low',
  },
  '0x00000000006c3852cbef3e08e8df289169ede581': {
    address: '0x00000000006c3852cbef3e08e8df289169ede581',
    name: 'OpenSea Seaport',
    verified: true,
    category: 'nft',
    riskLevel: 'low',
  },
  '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9': {
    address: '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9',
    name: 'Aave V2',
    verified: true,
    category: 'lending',
    riskLevel: 'low',
  },
};

class TokenApprovalService {
  private provider: ethers.JsonRpcProvider | null = null;
  private walletAddress: string | null = null;
  private chainId: number = 1;

  /**
   * Initialize the service
   */
  initialize(provider: ethers.JsonRpcProvider, walletAddress: string, chainId: number): void {
    this.provider = provider;
    this.walletAddress = walletAddress;
    this.chainId = chainId;
  }

  /**
   * Scan for token approvals
   * In production, this would use an indexer service like Covalent or The Graph
   */
  async scanApprovals(tokenAddresses: string[]): Promise<ScanApprovalsResult> {
    if (!this.provider || !this.walletAddress) {
      throw new Error('Service not initialized');
    }

    const approvals: TokenApproval[] = [];

    for (const tokenAddress of tokenAddresses) {
      try {
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);

        // Get token info
        const [symbol, name, decimals] = await Promise.all([
          tokenContract.symbol().catch(() => 'UNKNOWN'),
          tokenContract.name().catch(() => 'Unknown Token'),
          tokenContract.decimals().catch(() => 18),
        ]);

        // Check allowances for known spenders
        for (const [spenderAddress, spenderInfo] of Object.entries(KNOWN_SPENDERS)) {
          try {
            const allowance = await tokenContract.allowance(this.walletAddress, spenderAddress);

            if (allowance > 0n) {
              const approval = this.createApproval(
                tokenAddress,
                symbol,
                name,
                decimals,
                spenderAddress,
                allowance.toString(),
                spenderInfo
              );
              approvals.push(approval);
            }
          } catch {
            // Skip if allowance check fails
          }
        }
      } catch {
        // Skip tokens that fail
      }
    }

    const highRiskCount = approvals.filter(
      a => a.riskLevel === 'high' || a.riskLevel === 'critical'
    ).length;
    const unlimitedCount = approvals.filter(a => a.isUnlimited).length;

    return {
      approvals,
      scannedAt: Date.now(),
      totalCount: approvals.length,
      highRiskCount,
      unlimitedCount,
    };
  }

  /**
   * Get mock approvals for demo mode
   */
  getMockApprovals(): TokenApproval[] {
    return [
      {
        id: 'approval_1',
        tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        tokenSymbol: 'USDC',
        tokenName: 'USD Coin',
        tokenDecimals: 6,
        spenderAddress: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
        spenderName: 'Uniswap V2 Router',
        allowance: UNLIMITED_THRESHOLD,
        allowanceFormatted: 'Unlimited',
        isUnlimited: true,
        chainId: 1,
        approvedAt: Date.now() - 86400000 * 30, // 30 days ago
        status: 'active',
        riskLevel: 'medium',
        riskReasons: ['Unlimited approval'],
      },
      {
        id: 'approval_2',
        tokenAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        tokenSymbol: 'USDT',
        tokenName: 'Tether USD',
        tokenDecimals: 6,
        spenderAddress: '0x1111111254eeb25477b68fb85ed929f73a960582',
        spenderName: '1inch Router',
        allowance: '10000000000', // 10,000 USDT
        allowanceFormatted: '10,000 USDT',
        isUnlimited: false,
        chainId: 1,
        approvedAt: Date.now() - 86400000 * 7, // 7 days ago
        status: 'active',
        riskLevel: 'low',
        riskReasons: [],
      },
      {
        id: 'approval_3',
        tokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
        tokenSymbol: 'DAI',
        tokenName: 'Dai Stablecoin',
        tokenDecimals: 18,
        spenderAddress: '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9',
        spenderName: 'Aave V2',
        allowance: UNLIMITED_THRESHOLD,
        allowanceFormatted: 'Unlimited',
        isUnlimited: true,
        chainId: 1,
        approvedAt: Date.now() - 86400000 * 90, // 90 days ago
        status: 'active',
        riskLevel: 'high',
        riskReasons: ['Unlimited approval', 'Not used in 90+ days'],
      },
      {
        id: 'approval_4',
        tokenAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
        tokenSymbol: 'WBTC',
        tokenName: 'Wrapped BTC',
        tokenDecimals: 8,
        spenderAddress: '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45',
        spenderName: 'Unknown Contract',
        allowance: UNLIMITED_THRESHOLD,
        allowanceFormatted: 'Unlimited',
        isUnlimited: true,
        chainId: 1,
        approvedAt: Date.now() - 86400000 * 180, // 180 days ago
        status: 'active',
        riskLevel: 'critical',
        riskReasons: [
          'Unlimited approval',
          'Unknown spender',
          'Not used in 90+ days',
          'High value token',
        ],
      },
    ];
  }

  /**
   * Revoke a token approval
   */
  async revokeApproval(params: RevokeApprovalParams, signer: ethers.Signer): Promise<string> {
    const tokenContract = new ethers.Contract(params.tokenAddress, ERC20_ABI, signer);

    // Approve 0 to revoke
    const tx = await tokenContract.approve(params.spenderAddress, 0);
    const receipt = await tx.wait();

    return receipt.hash;
  }

  /**
   * Create approval object
   */
  private createApproval(
    tokenAddress: string,
    symbol: string,
    name: string,
    decimals: number,
    spenderAddress: string,
    allowance: string,
    spenderInfo?: SpenderInfo
  ): TokenApproval {
    const isUnlimited = this.isUnlimitedAllowance(allowance);
    const allowanceFormatted = isUnlimited
      ? 'Unlimited'
      : this.formatAllowance(allowance, decimals, symbol);

    const riskAssessment = this.assessRisk(isUnlimited, spenderInfo, symbol);

    return {
      id: `${tokenAddress}_${spenderAddress}`,
      tokenAddress,
      tokenSymbol: symbol,
      tokenName: name,
      tokenDecimals: decimals,
      spenderAddress,
      spenderName: spenderInfo?.name || 'Unknown Contract',
      spenderLogo: spenderInfo?.logo,
      allowance,
      allowanceFormatted,
      isUnlimited,
      chainId: this.chainId,
      status: 'active',
      riskLevel: riskAssessment.level,
      riskReasons: riskAssessment.reasons,
    };
  }

  /**
   * Check if allowance is unlimited
   */
  private isUnlimitedAllowance(allowance: string): boolean {
    try {
      const value = BigInt(allowance);
      const threshold = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffff');
      return value > threshold;
    } catch {
      return false;
    }
  }

  /**
   * Format allowance for display
   */
  private formatAllowance(allowance: string, decimals: number, symbol: string): string {
    try {
      const formatted = ethers.formatUnits(allowance, decimals);
      const num = parseFloat(formatted);
      if (num >= 1000000) {
        return `${(num / 1000000).toFixed(2)}M ${symbol}`;
      } else if (num >= 1000) {
        return `${(num / 1000).toFixed(2)}K ${symbol}`;
      }
      return `${num.toFixed(2)} ${symbol}`;
    } catch {
      return allowance;
    }
  }

  /**
   * Assess approval risk
   */
  private assessRisk(
    isUnlimited: boolean,
    spenderInfo?: SpenderInfo,
    symbol?: string
  ): { level: ApprovalRiskLevel; reasons: string[] } {
    const reasons: string[] = [];
    let riskScore = 0;

    // Unlimited approval
    if (isUnlimited) {
      reasons.push('Unlimited approval');
      riskScore += 2;
    }

    // Unknown spender
    if (!spenderInfo || !spenderInfo.verified) {
      reasons.push('Unknown or unverified spender');
      riskScore += 3;
    }

    // High value tokens
    const highValueTokens = ['WBTC', 'WETH', 'ETH', 'BTC'];
    if (symbol && highValueTokens.includes(symbol.toUpperCase())) {
      reasons.push('High value token');
      riskScore += 1;
    }

    // Determine risk level
    let level: ApprovalRiskLevel = 'low';
    if (riskScore >= 5) {
      level = 'critical';
    } else if (riskScore >= 3) {
      level = 'high';
    } else if (riskScore >= 2) {
      level = 'medium';
    }

    return { level, reasons };
  }

  /**
   * Get spender info from database
   */
  getSpenderInfo(address: string): SpenderInfo | undefined {
    return KNOWN_SPENDERS[address.toLowerCase()];
  }

  /**
   * Calculate approval statistics
   */
  calculateStats(approvals: TokenApproval[]): ApprovalStats {
    const activeApprovals = approvals.filter(a => a.status === 'active');
    const revokedApprovals = approvals.filter(a => a.status === 'revoked');
    const unlimitedApprovals = activeApprovals.filter(a => a.isUnlimited);
    const highRiskApprovals = activeApprovals.filter(
      a => a.riskLevel === 'high' || a.riskLevel === 'critical'
    );

    return {
      totalApprovals: approvals.length,
      activeApprovals: activeApprovals.length,
      revokedApprovals: revokedApprovals.length,
      unlimitedApprovals: unlimitedApprovals.length,
      highRiskApprovals: highRiskApprovals.length,
      totalValueAtRisk: 'N/A', // Would require price data
    };
  }

  /**
   * Sort approvals by risk
   */
  sortByRisk(approvals: TokenApproval[]): TokenApproval[] {
    const riskOrder: Record<ApprovalRiskLevel, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    return [...approvals].sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);
  }
}

// Singleton instance
let tokenApprovalServiceInstance: TokenApprovalService | null = null;

export const getTokenApprovalService = (): TokenApprovalService => {
  if (!tokenApprovalServiceInstance) {
    tokenApprovalServiceInstance = new TokenApprovalService();
  }
  return tokenApprovalServiceInstance;
};

export default TokenApprovalService;
