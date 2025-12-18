/**
 * Token Approval Types
 * Type definitions for token approval management
 */

/**
 * Token approval risk levels
 */
export type ApprovalRiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Approval status
 */
export type ApprovalStatus = 'active' | 'revoked' | 'expired';

/**
 * Token approval information
 */
export interface TokenApproval {
  id: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenDecimals: number;
  spenderAddress: string;
  spenderName?: string;
  spenderLogo?: string;
  allowance: string; // Raw allowance value
  allowanceFormatted: string; // Human-readable format
  isUnlimited: boolean;
  chainId: number;
  approvedAt?: number;
  lastUsedAt?: number;
  transactionHash?: string;
  status: ApprovalStatus;
  riskLevel: ApprovalRiskLevel;
  riskReasons: string[];
}

/**
 * Spender information from known contract database
 */
export interface SpenderInfo {
  address: string;
  name: string;
  logo?: string;
  website?: string;
  verified: boolean;
  category: 'dex' | 'lending' | 'bridge' | 'nft' | 'game' | 'other' | 'unknown';
  riskLevel: ApprovalRiskLevel;
}

/**
 * Token approval state
 */
export interface TokenApprovalState {
  approvals: TokenApproval[];
  isLoading: boolean;
  isRevoking: boolean;
  error: string | null;
  lastScanned: number | null;
  selectedApproval: TokenApproval | null;
}

/**
 * Revoke approval parameters
 */
export interface RevokeApprovalParams {
  tokenAddress: string;
  spenderAddress: string;
  chainId: number;
}

/**
 * Scan approvals result
 */
export interface ScanApprovalsResult {
  approvals: TokenApproval[];
  scannedAt: number;
  totalCount: number;
  highRiskCount: number;
  unlimitedCount: number;
}

/**
 * Approval statistics
 */
export interface ApprovalStats {
  totalApprovals: number;
  activeApprovals: number;
  revokedApprovals: number;
  unlimitedApprovals: number;
  highRiskApprovals: number;
  totalValueAtRisk: string;
}

/**
 * Known spender categories
 */
export const SPENDER_CATEGORIES: Record<string, SpenderInfo['category']> = {
  uniswap: 'dex',
  sushiswap: 'dex',
  '1inch': 'dex',
  pancakeswap: 'dex',
  curve: 'dex',
  aave: 'lending',
  compound: 'lending',
  maker: 'lending',
  opensea: 'nft',
  blur: 'nft',
  looksrare: 'nft',
  bridge: 'bridge',
};

/**
 * Maximum safe allowance (18 decimals)
 */
export const MAX_UINT256 =
  '115792089237316195423570985008687907853269984665640564039457584007913129639935';

/**
 * Threshold for unlimited approval detection (99% of max uint256)
 */
export const UNLIMITED_THRESHOLD =
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

/**
 * Risk assessment thresholds
 */
export const RISK_THRESHOLDS = {
  HIGH_VALUE_USD: 10000, // $10k
  MEDIUM_VALUE_USD: 1000, // $1k
  STALE_DAYS: 90, // 90 days without use
};
