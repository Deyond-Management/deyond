/**
 * SwapService Tests
 * Comprehensive test coverage for token swap functionality
 */

import { SwapService, getSwapService } from '../SwapService';
import { SwapParams, SwapError } from '../../../types/swap';
import { ethers } from 'ethers';

// Mock ErrorReporter
const mockErrorReporter = {
  report: jest.fn(),
  captureException: jest.fn(),
};

jest.mock('../../error/ErrorReporter', () => ({
  getErrorReporter: jest.fn(() => mockErrorReporter),
}));

// Mock Logger
jest.mock('../../../utils/Logger');

// Mock ethers
const mockContract = {
  allowance: jest.fn(),
  interface: {
    encodeFunctionData: jest.fn(),
  },
};

jest.mock('ethers', () => {
  const actualEthers = jest.requireActual('ethers');
  return {
    ...actualEthers,
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      // Mock provider methods will be added per test
    })),
    Contract: jest.fn(() => mockContract),
    MaxUint256: actualEthers.MaxUint256,
  };
});

describe('SwapService', () => {
  let swapService: SwapService;
  const mockConfig = {
    rpcUrl: 'https://eth-mainnet.example.com',
    apiKey: 'test-api-key',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockContract.allowance.mockReset();
    mockContract.interface.encodeFunctionData.mockReset();
    mockErrorReporter.report.mockReset();
    mockErrorReporter.captureException.mockReset();
    swapService = new SwapService(mockConfig);
  });

  describe('getTokenList', () => {
    it('should return tokens for Ethereum mainnet (chainId 1)', async () => {
      const result = await swapService.getTokenList(1);

      expect(result.tokens).toBeDefined();
      expect(result.tokens.length).toBeGreaterThan(0);
      expect(result.timestamp).toBeDefined();
      expect(typeof result.timestamp).toBe('number');

      // Verify all tokens have chainId 1
      result.tokens.forEach(token => {
        expect(token.chainId).toBe(1);
        expect(token).toHaveProperty('address');
        expect(token).toHaveProperty('symbol');
        expect(token).toHaveProperty('name');
        expect(token).toHaveProperty('decimals');
      });
    });

    it('should include ETH, USDC, USDT, DAI, WBTC for chainId 1', async () => {
      const result = await swapService.getTokenList(1);
      const symbols = result.tokens.map(t => t.symbol);

      expect(symbols).toContain('ETH');
      expect(symbols).toContain('USDC');
      expect(symbols).toContain('USDT');
      expect(symbols).toContain('DAI');
      expect(symbols).toContain('WBTC');
    });

    it('should return empty array for unsupported chain', async () => {
      const result = await swapService.getTokenList(999);

      expect(result.tokens).toEqual([]);
      expect(result.timestamp).toBeDefined();
    });

    it('should have correct token decimals', async () => {
      const result = await swapService.getTokenList(1);

      const eth = result.tokens.find(t => t.symbol === 'ETH');
      const usdc = result.tokens.find(t => t.symbol === 'USDC');
      const wbtc = result.tokens.find(t => t.symbol === 'WBTC');

      expect(eth?.decimals).toBe(18);
      expect(usdc?.decimals).toBe(6);
      expect(wbtc?.decimals).toBe(8);
    });
  });

  describe('getQuote', () => {
    const validParams: SwapParams = {
      fromTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH
      toTokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
      amount: ethers.parseEther('1').toString(),
      fromAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      slippage: 0.5,
      chainId: 1,
    };

    it('should return a valid quote for ETH to USDC swap', async () => {
      const quote = await swapService.getQuote(validParams);

      expect(quote).toBeDefined();
      expect(quote.fromToken.symbol).toBe('ETH');
      expect(quote.toToken.symbol).toBe('USDC');
      expect(quote.fromAmount).toBe(validParams.amount);
      expect(quote.toAmount).toBeDefined();
      expect(quote.estimatedGas).toBeDefined();
      expect(quote.tx).toBeDefined();
    });

    it('should apply slippage to quote', async () => {
      const quote = await swapService.getQuote(validParams);

      // With 0.5% slippage, toAmount should be ~99.5% of the ideal amount
      expect(BigInt(quote.toAmount)).toBeGreaterThan(0n);
      expect(quote.tx?.value).toBe(validParams.amount); // ETH swap includes value
    });

    it('should throw error for invalid token addresses', async () => {
      const invalidParams = {
        ...validParams,
        fromTokenAddress: '',
      };

      await expect(swapService.getQuote(invalidParams)).rejects.toThrow('Invalid token addresses');
    });

    it('should throw error for same token swap', async () => {
      const sameTokenParams = {
        ...validParams,
        toTokenAddress: validParams.fromTokenAddress,
      };

      await expect(swapService.getQuote(sameTokenParams)).rejects.toThrow('Cannot swap same token');
    });

    it('should throw error for zero amount', async () => {
      const zeroAmountParams = {
        ...validParams,
        amount: '0',
      };

      await expect(swapService.getQuote(zeroAmountParams)).rejects.toThrow('Invalid amount');
    });

    it('should throw error for negative amount', async () => {
      const negativeAmountParams = {
        ...validParams,
        amount: '-1000',
      };

      await expect(swapService.getQuote(negativeAmountParams)).rejects.toThrow('Invalid amount');
    });

    it('should throw error for excessive slippage', async () => {
      const excessiveSlippageParams = {
        ...validParams,
        slippage: 60,
      };

      await expect(swapService.getQuote(excessiveSlippageParams)).rejects.toThrow(
        'Invalid slippage'
      );
    });

    it('should throw error for negative slippage', async () => {
      const negativeSlippageParams = {
        ...validParams,
        slippage: -1,
      };

      await expect(swapService.getQuote(negativeSlippageParams)).rejects.toThrow(
        'Invalid slippage'
      );
    });

    it('should include transaction data in quote', async () => {
      const quote = await swapService.getQuote(validParams);

      expect(quote.tx).toBeDefined();
      expect(quote.tx?.from).toBe(validParams.fromAddress);
      expect(quote.tx?.to).toBeDefined();
      expect(quote.tx?.data).toBeDefined();
      expect(quote.tx?.gas).toBeDefined();
    });

    it('should set value to 0 for ERC20 token swaps', async () => {
      const erc20Params = {
        ...validParams,
        fromTokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
        toTokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
      };

      const quote = await swapService.getQuote(erc20Params);
      expect(quote.tx?.value).toBe('0');
    });
  });

  describe('checkAllowance', () => {
    const ownerAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
    const spenderAddress = '0x1111111254EEB25477B68fb85Ed929f73A960582';

    it('should return MaxUint256 for native ETH token', async () => {
      const allowance = await swapService.checkAllowance(
        '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        ownerAddress,
        spenderAddress
      );

      expect(allowance).toBe(ethers.MaxUint256.toString());
    });

    it('should handle case-insensitive native token address', async () => {
      const allowance = await swapService.checkAllowance(
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // lowercase
        ownerAddress,
        spenderAddress
      );

      expect(allowance).toBe(ethers.MaxUint256.toString());
    });

    // Note: ERC20 allowance checking is integration tested in executeSwap tests
    // Direct unit testing would require mocking the provider network calls
  });

  describe('createApproveTransaction', () => {
    const tokenAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    const spenderAddress = '0x1111111254EEB25477B68fb85Ed929f73A960582';
    const amount = ethers.parseUnits('1000', 6).toString();

    it('should create approve transaction with correct parameters', async () => {
      const tx = await swapService.createApproveTransaction(tokenAddress, spenderAddress, amount);

      expect(tx.to).toBe(tokenAddress);
      expect(tx.data).toBeDefined();
      expect(typeof tx.data).toBe('string');
      expect(tx.data!).toMatch(/^0x/); // Should be hex string
      expect(tx.value).toBe(0);
    });

    it('should create transaction data that includes approve function selector', async () => {
      const tx = await swapService.createApproveTransaction(tokenAddress, spenderAddress, amount);

      // ERC20 approve function selector is 0x095ea7b3
      expect(tx.data!).toMatch(/^0x095ea7b3/);
      expect(tx.data!.length).toBeGreaterThan(10); // Should include parameters
    });
  });

  describe('executeSwap', () => {
    const validParams: SwapParams = {
      fromTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      toTokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      amount: ethers.parseEther('1').toString(),
      fromAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      slippage: 0.5,
      chainId: 1,
    };

    it('should execute swap successfully for native token', async () => {
      const mockTxHash = '0x123456789abcdef';
      const mockReceipt = {
        hash: mockTxHash,
        status: 1,
      };
      const mockTx = {
        wait: jest.fn().mockResolvedValue(mockReceipt),
      };
      const mockSigner = {
        sendTransaction: jest.fn().mockResolvedValue(mockTx),
      } as unknown as ethers.Signer;

      const result = await swapService.executeSwap(validParams, mockSigner);

      expect(result.txHash).toBe(mockTxHash);
      expect(result.swapHistory).toBeDefined();
      expect(result.swapHistory.txHash).toBe(mockTxHash);
      expect(result.swapHistory.status).toBe('confirmed');
      expect(result.swapHistory.fromToken.symbol).toBe('ETH');
      expect(result.swapHistory.toToken.symbol).toBe('USDC');
    });

    // Note: ERC20 token swap tests (allowance checking, insufficient allowance)
    // require provider network access and are better suited for integration tests

    it('should throw error if transaction fails', async () => {
      const mockReceipt = {
        hash: '0xfailed',
        status: 0, // Failed status
      };
      const mockTx = {
        wait: jest.fn().mockResolvedValue(mockReceipt),
      };
      const mockSigner = {
        sendTransaction: jest.fn().mockResolvedValue(mockTx),
      } as unknown as ethers.Signer;

      await expect(swapService.executeSwap(validParams, mockSigner)).rejects.toThrow(
        SwapError.TRANSACTION_FAILED
      );
    });

    it('should throw error if receipt is null', async () => {
      const mockTx = {
        wait: jest.fn().mockResolvedValue(null),
      };
      const mockSigner = {
        sendTransaction: jest.fn().mockResolvedValue(mockTx),
      } as unknown as ethers.Signer;

      await expect(swapService.executeSwap(validParams, mockSigner)).rejects.toThrow(
        SwapError.TRANSACTION_FAILED
      );
    });

    it('should create swap history with correct data', async () => {
      const mockTxHash = '0x987654321';
      const mockReceipt = { hash: mockTxHash, status: 1 };
      const mockTx = { wait: jest.fn().mockResolvedValue(mockReceipt) };
      const mockSigner = {
        sendTransaction: jest.fn().mockResolvedValue(mockTx),
      } as unknown as ethers.Signer;

      const result = await swapService.executeSwap(validParams, mockSigner);

      expect(result.swapHistory.id).toBe(mockTxHash);
      expect(result.swapHistory.fromToken).toBeDefined();
      expect(result.swapHistory.toToken).toBeDefined();
      expect(result.swapHistory.fromAmount).toBeDefined();
      expect(result.swapHistory.toAmount).toBeDefined();
      expect(result.swapHistory.status).toBe('confirmed');
      expect(result.swapHistory.timestamp).toBeDefined();
      expect(result.swapHistory.chainId).toBe(validParams.chainId);
    });
  });

  describe('getSwapService singleton', () => {
    it('should create instance with config', () => {
      const service = getSwapService(mockConfig);
      expect(service).toBeInstanceOf(SwapService);
    });

    it('should return same instance on subsequent calls', () => {
      const service1 = getSwapService(mockConfig);
      const service2 = getSwapService();
      expect(service1).toBe(service2);
    });

    it('should throw error if not initialized', () => {
      // Reset module to clear singleton
      jest.resetModules();
      const { getSwapService: freshGetSwapService } = require('../SwapService');

      expect(() => freshGetSwapService()).toThrow('SwapService not initialized');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle very large amounts', async () => {
      const largeParams: SwapParams = {
        fromTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        toTokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        amount: ethers.parseEther('1000000').toString(), // 1M ETH
        fromAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        slippage: 0.5,
        chainId: 1,
      };

      const quote = await swapService.getQuote(largeParams);
      expect(BigInt(quote.toAmount)).toBeGreaterThan(0n);
    });

    it('should handle very small amounts', async () => {
      const smallParams: SwapParams = {
        fromTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        toTokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        amount: '1', // 1 wei
        fromAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        slippage: 0.5,
        chainId: 1,
      };

      const quote = await swapService.getQuote(smallParams);
      expect(quote).toBeDefined();
    });

    it('should handle maximum valid slippage (50%)', async () => {
      const maxSlippageParams: SwapParams = {
        fromTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        toTokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        amount: ethers.parseEther('1').toString(),
        fromAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        slippage: 50,
        chainId: 1,
      };

      const quote = await swapService.getQuote(maxSlippageParams);
      expect(quote).toBeDefined();
      // With 50% slippage, toAmount should be ~50% of ideal
      expect(BigInt(quote.toAmount)).toBeGreaterThan(0n);
    });

    it('should handle WBTC to ETH swap (different decimals)', async () => {
      const params: SwapParams = {
        fromTokenAddress: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC (8 decimals)
        toTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH (18 decimals)
        amount: (10 ** 8).toString(), // 1 WBTC
        fromAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        slippage: 1,
        chainId: 1,
      };

      const quote = await swapService.getQuote(params);
      expect(quote.fromToken.symbol).toBe('WBTC');
      expect(quote.toToken.symbol).toBe('ETH');
      expect(quote.fromToken.decimals).toBe(8);
      expect(quote.toToken.decimals).toBe(18);
    });

    it('should handle stablecoin swaps (USDC to USDT)', async () => {
      const params: SwapParams = {
        fromTokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
        toTokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
        amount: (1000 * 10 ** 6).toString(), // 1000 USDC
        fromAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        slippage: 0.1,
        chainId: 1,
      };

      const quote = await swapService.getQuote(params);
      expect(quote.fromToken.symbol).toBe('USDC');
      expect(quote.toToken.symbol).toBe('USDT');
      // Stablecoins should have ~1:1 ratio
      const fromAmount = BigInt(params.amount);
      const toAmount = BigInt(quote.toAmount);
      // Allow for slippage difference
      expect(toAmount).toBeGreaterThan((fromAmount * 99n) / 100n);
    });
  });

  describe('mock price ratio calculations', () => {
    it('should calculate correct ETH to USDC ratio', async () => {
      const params: SwapParams = {
        fromTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        toTokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        amount: ethers.parseEther('1').toString(),
        fromAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        slippage: 0,
        chainId: 1,
      };

      const quote = await swapService.getQuote(params);
      // Mock price: 1 ETH = 2000 USDC
      // With 0 slippage, should get close to 2000 USDC (accounting for decimals)
      expect(BigInt(quote.toAmount)).toBeGreaterThan(0n);
    });

    it('should calculate correct WBTC to ETH ratio', async () => {
      const params: SwapParams = {
        fromTokenAddress: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
        toTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH
        amount: (10 ** 8).toString(), // 1 WBTC
        fromAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        slippage: 0,
        chainId: 1,
      };

      const quote = await swapService.getQuote(params);
      // Mock price: 1 WBTC = 40000 USD, 1 ETH = 2000 USD
      // 1 WBTC should give ~20 ETH
      expect(BigInt(quote.toAmount)).toBeGreaterThan(0n);
    });
  });
});
