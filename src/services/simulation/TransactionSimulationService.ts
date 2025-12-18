/**
 * TransactionSimulationService
 * Service for simulating transactions before execution
 */

import { ethers } from 'ethers';
import {
  SimulationResult,
  SimulationRequest,
  SimulationStatus,
  TokenTransfer,
  NativeTransfer,
  ApprovalChange,
  BalanceChange,
  GasEstimation,
  SimulationWarning,
  SimulationRiskLevel,
  ContractInteraction,
  KNOWN_SIGNATURES,
  HIGH_RISK_SIGNATURES,
} from './types';

// ERC20 ABI for decoding
const ERC20_ABI = [
  'function transfer(address to, uint256 amount)',
  'function approve(address spender, uint256 amount)',
  'function transferFrom(address from, address to, uint256 amount)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
];

// Unlimited approval threshold
const UNLIMITED_THRESHOLD = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffff');

class TransactionSimulationService {
  private provider: ethers.JsonRpcProvider | null = null;
  private chainId: number = 1;
  private simulationCount: number = 0;

  /**
   * Initialize the service
   */
  initialize(provider: ethers.JsonRpcProvider, chainId: number): void {
    this.provider = provider;
    this.chainId = chainId;
  }

  /**
   * Simulate a transaction
   */
  async simulate(request: SimulationRequest): Promise<SimulationResult> {
    const id = `sim_${++this.simulationCount}_${Date.now()}`;

    try {
      // Get gas estimation
      const gasEstimation = await this.estimateGas(request);

      // Decode transaction data
      const decodedData = this.decodeTransactionData(request.data || '0x');

      // Analyze the transaction
      const analysis = await this.analyzeTransaction(request, decodedData);

      // Assess risk
      const { riskLevel, warnings } = this.assessRisk(request, analysis, decodedData);

      // Get block number
      const blockNumber = (await this.provider?.getBlockNumber()) || 0;

      return {
        id,
        status: 'success',
        success: true,
        from: request.from,
        to: request.to,
        value: request.value || '0',
        data: request.data || '0x',
        chainId: request.chainId,
        gasEstimation,
        tokenTransfers: analysis.tokenTransfers,
        nativeTransfers: analysis.nativeTransfers,
        approvalChanges: analysis.approvalChanges,
        balanceChanges: analysis.balanceChanges,
        contractInteraction: analysis.contractInteraction,
        riskLevel,
        warnings,
        simulatedAt: Date.now(),
        blockNumber,
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      const isRevert =
        errorMessage.includes('revert') || errorMessage.includes('execution reverted');

      return {
        id,
        status: isRevert ? 'revert' : 'error',
        success: false,
        from: request.from,
        to: request.to,
        value: request.value || '0',
        data: request.data || '0x',
        chainId: request.chainId,
        gasEstimation: {
          gasLimit: '0',
          gasPrice: '0',
          estimatedCost: '0',
        },
        tokenTransfers: [],
        nativeTransfers: [],
        approvalChanges: [],
        balanceChanges: [],
        riskLevel: 'high',
        warnings: [
          {
            type: 'revert',
            severity: 'high',
            message: isRevert ? 'Transaction will revert' : 'Simulation failed',
            details: this.extractRevertReason(errorMessage),
          },
        ],
        errorMessage,
        revertReason: this.extractRevertReason(errorMessage),
        simulatedAt: Date.now(),
        blockNumber: 0,
      };
    }
  }

  /**
   * Get mock simulation for demo mode
   */
  getMockSimulation(request: SimulationRequest): SimulationResult {
    const isApproval = request.data?.startsWith('0x095ea7b3');
    const isTransfer = request.data?.startsWith('0xa9059cbb');
    const isSwap = request.data?.startsWith('0x7ff36ab5') || request.data?.startsWith('0x38ed1739');

    const warnings: SimulationWarning[] = [];
    let riskLevel: SimulationRiskLevel = 'safe';

    if (isApproval) {
      warnings.push({
        type: 'approval',
        severity: 'medium',
        message: 'This transaction grants token approval',
        details: 'Make sure you trust the spender contract',
      });
      riskLevel = 'medium';
    }

    const value = request.value || '0';
    if (BigInt(value) > BigInt('1000000000000000000')) {
      warnings.push({
        type: 'value',
        severity: 'low',
        message: 'High value transaction',
        details: `Sending ${ethers.formatEther(value)} ETH`,
      });
      riskLevel = riskLevel === 'safe' ? 'low' : riskLevel;
    }

    return {
      id: `sim_mock_${Date.now()}`,
      status: 'success',
      success: true,
      from: request.from,
      to: request.to,
      value: value,
      data: request.data || '0x',
      chainId: request.chainId,
      gasEstimation: {
        gasLimit: isSwap ? '250000' : isApproval ? '50000' : '21000',
        gasPrice: '20000000000',
        maxFeePerGas: '25000000000',
        maxPriorityFeePerGas: '2000000000',
        estimatedCost: isSwap ? '0.005' : isApproval ? '0.001' : '0.00042',
        estimatedCostUSD: isSwap ? '$12.50' : isApproval ? '$2.50' : '$1.05',
      },
      tokenTransfers: isTransfer
        ? [
            {
              type: 'transfer_out',
              tokenAddress: request.to,
              tokenSymbol: 'USDC',
              tokenName: 'USD Coin',
              tokenDecimals: 6,
              amount: '100000000',
              amountFormatted: '100 USDC',
              from: request.from,
              to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
              isNFT: false,
            },
          ]
        : isSwap
          ? [
              {
                type: 'transfer_out',
                tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                tokenSymbol: 'USDC',
                tokenName: 'USD Coin',
                tokenDecimals: 6,
                amount: '100000000',
                amountFormatted: '100 USDC',
                from: request.from,
                to: request.to,
                isNFT: false,
              },
              {
                type: 'transfer_in',
                tokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                tokenSymbol: 'USDT',
                tokenName: 'Tether USD',
                tokenDecimals: 6,
                amount: '99500000',
                amountFormatted: '99.5 USDT',
                from: request.to,
                to: request.from,
                isNFT: false,
              },
            ]
          : [],
      nativeTransfers:
        BigInt(value) > 0n
          ? [
              {
                type: 'transfer_out',
                amount: value,
                amountFormatted: `${ethers.formatEther(value)} ETH`,
                from: request.from,
                to: request.to,
              },
            ]
          : [],
      approvalChanges: isApproval
        ? [
            {
              tokenAddress: request.to,
              tokenSymbol: 'USDC',
              spender: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
              spenderName: 'Uniswap V2 Router',
              currentAllowance: '0',
              newAllowance: 'unlimited',
              isUnlimited: true,
            },
          ]
        : [],
      balanceChanges: [
        {
          address: request.from,
          symbol: 'ETH',
          decimals: 18,
          before: '10.5',
          after: '10.495',
          change: '-0.005',
          changeFormatted: '-0.005 ETH',
          isPositive: false,
        },
      ],
      contractInteraction: {
        address: request.to,
        name: isSwap ? 'Uniswap V2 Router' : isApproval ? 'USDC Token' : undefined,
        method: isSwap
          ? 'swapExactTokensForTokens'
          : isApproval
            ? 'approve'
            : isTransfer
              ? 'transfer'
              : undefined,
        isVerified: true,
        isProxy: false,
      },
      riskLevel,
      warnings,
      simulatedAt: Date.now(),
      blockNumber: 18500000,
    };
  }

  /**
   * Estimate gas for transaction
   */
  private async estimateGas(request: SimulationRequest): Promise<GasEstimation> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const [gasLimit, feeData] = await Promise.all([
      this.provider.estimateGas({
        from: request.from,
        to: request.to,
        value: request.value ? BigInt(request.value) : 0n,
        data: request.data,
      }),
      this.provider.getFeeData(),
    ]);

    const gasPrice = feeData.gasPrice || 0n;
    const maxFeePerGas = feeData.maxFeePerGas || gasPrice;
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || 0n;

    const estimatedCost = gasLimit * maxFeePerGas;

    return {
      gasLimit: gasLimit.toString(),
      gasPrice: gasPrice.toString(),
      maxFeePerGas: maxFeePerGas.toString(),
      maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
      estimatedCost: ethers.formatEther(estimatedCost),
    };
  }

  /**
   * Decode transaction data
   */
  private decodeTransactionData(data: string): {
    signature: string;
    method?: string;
    args?: any[];
  } {
    if (!data || data === '0x') {
      return { signature: '0x' };
    }

    const signature = data.slice(0, 10);
    const method = KNOWN_SIGNATURES[signature];

    if (!method) {
      return { signature };
    }

    try {
      const iface = new ethers.Interface(ERC20_ABI);
      const decoded = iface.parseTransaction({ data });
      return {
        signature,
        method: decoded?.name,
        args: decoded?.args ? Array.from(decoded.args) : undefined,
      };
    } catch {
      return { signature, method };
    }
  }

  /**
   * Analyze transaction for transfers and approvals
   */
  private async analyzeTransaction(
    request: SimulationRequest,
    decodedData: { signature: string; method?: string; args?: any[] }
  ): Promise<{
    tokenTransfers: TokenTransfer[];
    nativeTransfers: NativeTransfer[];
    approvalChanges: ApprovalChange[];
    balanceChanges: BalanceChange[];
    contractInteraction?: ContractInteraction;
  }> {
    const tokenTransfers: TokenTransfer[] = [];
    const nativeTransfers: NativeTransfer[] = [];
    const approvalChanges: ApprovalChange[] = [];
    const balanceChanges: BalanceChange[] = [];

    // Native ETH transfer
    if (request.value && BigInt(request.value) > 0n) {
      nativeTransfers.push({
        type: 'transfer_out',
        amount: request.value,
        amountFormatted: `${ethers.formatEther(request.value)} ETH`,
        from: request.from,
        to: request.to,
      });
    }

    // Contract interaction
    const contractInteraction: ContractInteraction = {
      address: request.to,
      method: decodedData.method,
      methodSignature: decodedData.signature,
      isVerified: false,
      isProxy: false,
    };

    // Parse specific methods
    if (decodedData.method === 'approve' && decodedData.args) {
      const [spender, amount] = decodedData.args;
      const isUnlimited = BigInt(amount) > UNLIMITED_THRESHOLD;

      approvalChanges.push({
        tokenAddress: request.to,
        tokenSymbol: 'TOKEN',
        spender,
        currentAllowance: '0',
        newAllowance: isUnlimited ? 'unlimited' : amount.toString(),
        isUnlimited,
      });
    }

    if (decodedData.method === 'transfer' && decodedData.args) {
      const [to, amount] = decodedData.args;
      tokenTransfers.push({
        type: 'transfer_out',
        tokenAddress: request.to,
        tokenSymbol: 'TOKEN',
        tokenName: 'Token',
        tokenDecimals: 18,
        amount: amount.toString(),
        amountFormatted: ethers.formatUnits(amount, 18),
        from: request.from,
        to,
        isNFT: false,
      });
    }

    return {
      tokenTransfers,
      nativeTransfers,
      approvalChanges,
      balanceChanges,
      contractInteraction,
    };
  }

  /**
   * Assess transaction risk
   */
  private assessRisk(
    request: SimulationRequest,
    analysis: {
      tokenTransfers: TokenTransfer[];
      approvalChanges: ApprovalChange[];
    },
    decodedData: { signature: string; method?: string }
  ): { riskLevel: SimulationRiskLevel; warnings: SimulationWarning[] } {
    const warnings: SimulationWarning[] = [];
    let riskScore = 0;

    // Check for high-risk method signatures
    if (HIGH_RISK_SIGNATURES.includes(decodedData.signature)) {
      warnings.push({
        type: 'approval',
        severity: 'medium',
        message: 'This transaction modifies token approvals',
        details: 'Review the spender address carefully',
      });
      riskScore += 2;
    }

    // Check for unlimited approvals
    const unlimitedApprovals = analysis.approvalChanges.filter(a => a.isUnlimited);
    if (unlimitedApprovals.length > 0) {
      warnings.push({
        type: 'approval',
        severity: 'high',
        message: 'Unlimited token approval detected',
        details: 'This grants unlimited access to your tokens',
      });
      riskScore += 3;
    }

    // Check for high value transfers
    const value = BigInt(request.value || '0');
    if (value > ethers.parseEther('1')) {
      warnings.push({
        type: 'value',
        severity: 'medium',
        message: 'High value transaction',
        details: `Sending ${ethers.formatEther(value)} ETH`,
      });
      riskScore += 2;
    }

    // Determine risk level
    let riskLevel: SimulationRiskLevel = 'safe';
    if (riskScore >= 5) {
      riskLevel = 'critical';
    } else if (riskScore >= 4) {
      riskLevel = 'high';
    } else if (riskScore >= 2) {
      riskLevel = 'medium';
    } else if (riskScore >= 1) {
      riskLevel = 'low';
    }

    return { riskLevel, warnings };
  }

  /**
   * Extract revert reason from error message
   */
  private extractRevertReason(errorMessage: string): string | undefined {
    const revertMatch = errorMessage.match(/reverted with reason string '([^']+)'/);
    if (revertMatch) {
      return revertMatch[1];
    }

    const customErrorMatch = errorMessage.match(/reverted with custom error '([^']+)'/);
    if (customErrorMatch) {
      return customErrorMatch[1];
    }

    if (errorMessage.includes('insufficient funds')) {
      return 'Insufficient funds for gas';
    }

    return undefined;
  }
}

// Singleton instance
let simulationServiceInstance: TransactionSimulationService | null = null;

export const getTransactionSimulationService = (): TransactionSimulationService => {
  if (!simulationServiceInstance) {
    simulationServiceInstance = new TransactionSimulationService();
  }
  return simulationServiceInstance;
};

export default TransactionSimulationService;
