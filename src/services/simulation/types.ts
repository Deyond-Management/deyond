/**
 * Transaction Simulation Types
 * Type definitions for transaction simulation
 */

/**
 * Simulation status
 */
export type SimulationStatus = 'pending' | 'success' | 'revert' | 'error';

/**
 * Asset change type
 */
export type AssetChangeType = 'transfer_in' | 'transfer_out' | 'approval' | 'mint' | 'burn';

/**
 * Risk level
 */
export type SimulationRiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';

/**
 * Token transfer in simulation
 */
export interface TokenTransfer {
  type: AssetChangeType;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenDecimals: number;
  amount: string;
  amountFormatted: string;
  from: string;
  to: string;
  isNFT: boolean;
  tokenId?: string;
}

/**
 * Native currency transfer
 */
export interface NativeTransfer {
  type: AssetChangeType;
  amount: string;
  amountFormatted: string;
  from: string;
  to: string;
}

/**
 * Approval change in simulation
 */
export interface ApprovalChange {
  tokenAddress: string;
  tokenSymbol: string;
  spender: string;
  spenderName?: string;
  currentAllowance: string;
  newAllowance: string;
  isUnlimited: boolean;
}

/**
 * Balance change
 */
export interface BalanceChange {
  address: string;
  symbol: string;
  decimals: number;
  before: string;
  after: string;
  change: string;
  changeFormatted: string;
  isPositive: boolean;
}

/**
 * Contract interaction info
 */
export interface ContractInteraction {
  address: string;
  name?: string;
  method?: string;
  methodSignature?: string;
  isVerified: boolean;
  isProxy: boolean;
}

/**
 * Gas estimation result
 */
export interface GasEstimation {
  gasLimit: string;
  gasPrice: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  estimatedCost: string;
  estimatedCostUSD?: string;
}

/**
 * Warning in simulation
 */
export interface SimulationWarning {
  type: 'approval' | 'value' | 'revert' | 'gas' | 'contract' | 'phishing';
  severity: SimulationRiskLevel;
  message: string;
  details?: string;
}

/**
 * Full simulation result
 */
export interface SimulationResult {
  id: string;
  status: SimulationStatus;
  success: boolean;

  // Transaction info
  from: string;
  to: string;
  value: string;
  data: string;
  chainId: number;

  // Gas info
  gasEstimation: GasEstimation;

  // State changes
  tokenTransfers: TokenTransfer[];
  nativeTransfers: NativeTransfer[];
  approvalChanges: ApprovalChange[];
  balanceChanges: BalanceChange[];

  // Contract info
  contractInteraction?: ContractInteraction;

  // Risk assessment
  riskLevel: SimulationRiskLevel;
  warnings: SimulationWarning[];

  // Error info (if failed)
  errorMessage?: string;
  revertReason?: string;

  // Metadata
  simulatedAt: number;
  blockNumber: number;
}

/**
 * Transaction to simulate
 */
export interface SimulationRequest {
  from: string;
  to: string;
  value?: string;
  data?: string;
  chainId: number;
  gasLimit?: string;
  gasPrice?: string;
}

/**
 * Simulation state
 */
export interface SimulationState {
  currentSimulation: SimulationResult | null;
  isSimulating: boolean;
  error: string | null;
  history: SimulationResult[];
}

/**
 * Known contract signatures
 */
export const KNOWN_SIGNATURES: Record<string, string> = {
  '0xa9059cbb': 'transfer(address,uint256)',
  '0x095ea7b3': 'approve(address,uint256)',
  '0x23b872dd': 'transferFrom(address,address,uint256)',
  '0x7ff36ab5': 'swapExactETHForTokens',
  '0x18cbafe5': 'swapExactTokensForETH',
  '0x38ed1739': 'swapExactTokensForTokens',
  '0x8803dbee': 'swapTokensForExactTokens',
  '0x2e1a7d4d': 'withdraw(uint256)',
  '0xd0e30db0': 'deposit()',
  '0xf305d719': 'addLiquidityETH',
  '0xe8e33700': 'addLiquidity',
  '0xbaa2abde': 'removeLiquidity',
  '0x42842e0e': 'safeTransferFrom(address,address,uint256)',
  '0xb88d4fde': 'safeTransferFrom(address,address,uint256,bytes)',
};

/**
 * High-risk method signatures
 */
export const HIGH_RISK_SIGNATURES: string[] = [
  '0x095ea7b3', // approve
  '0x39509351', // increaseAllowance
  '0xa22cb465', // setApprovalForAll
];
