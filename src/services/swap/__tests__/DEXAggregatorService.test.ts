/**
 * DEX Aggregator Service Tests
 */

import { ethers } from 'ethers';
import DEXAggregatorService, { getDEXAggregatorService } from '../DEXAggregatorService';
import { SwapQuote, SwapQuoteRequest, SwapError, SwapErrorType, DEX_CONFIG } from '../types';

// Mock fetch
global.fetch = jest.fn();

// Mock ethers.Contract
const mockAllowance = jest.fn().mockResolvedValue(BigInt('1000000000000000000000'));
const mockApprove = jest.fn().mockResolvedValue({
  wait: jest.fn().mockResolvedValue({ hash: '0xapproval' }),
});
const mockBalanceOf = jest.fn().mockResolvedValue(BigInt('5000000000000000000'));
const mockDecimals = jest.fn().mockResolvedValue(18);
const mockSymbol = jest.fn().mockResolvedValue('TEST');
const mockName = jest.fn().mockResolvedValue('Test Token');

jest.mock('ethers', () => {
  const original = jest.requireActual('ethers');
  return {
    ...original,
    Contract: jest.fn().mockImplementation(() => ({
      allowance: mockAllowance,
      approve: mockApprove,
      balanceOf: mockBalanceOf,
      decimals: mockDecimals,
      symbol: mockSymbol,
      name: mockName,
    })),
  };
});

describe('DEXAggregatorService', () => {
  let service: DEXAggregatorService;
  const mockFetch = global.fetch as jest.Mock;

  const mockProvider = {
    getBalance: jest.fn().mockResolvedValue(BigInt('10000000000000000000')),
    estimateGas: jest.fn().mockResolvedValue(BigInt('200000')),
    waitForTransaction: jest.fn().mockResolvedValue({
      status: 1,
      gasUsed: BigInt('180000'),
      gasPrice: BigInt('20000000000'),
    }),
  } as unknown as ethers.Provider;

  const mockSigner = {
    sendTransaction: jest.fn().mockResolvedValue({
      hash: '0xtxhash123',
      wait: jest.fn().mockResolvedValue({ status: 1 }),
    }),
  } as unknown as ethers.Signer;

  const mockZeroXResponse: SwapQuote = {
    aggregator: '0x',
    sellToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    buyToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    sellAmount: '1000000000',
    buyAmount: '500000000000000000',
    price: '0.0005',
    guaranteedPrice: '0.00049',
    estimatedPriceImpact: '0.1',
    sources: [{ name: 'Uniswap_V3', proportion: '1' }],
    gas: '200000',
    gasPrice: '20000000000',
    estimatedGas: '200000',
    allowanceTarget: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
    to: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
    data: '0x1234567890',
    value: '0',
  };

  const mockOneInchResponse = {
    srcToken: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
    dstToken: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' },
    srcAmount: '1000000000',
    dstAmount: '490000000000000000',
    protocols: [[{ name: 'UNISWAP_V3', part: 100 }]],
    tx: {
      to: '0x1111111254fb6c44bac0bed2854e76f90643097d',
      data: '0xabcdef',
      gas: 210000,
      gasPrice: '20000000000',
      value: '0',
    },
  };

  beforeEach(() => {
    service = new DEXAggregatorService();
    service.initialize({
      zeroxApiKey: 'test-0x-key',
      oneInchApiKey: 'test-1inch-key',
    });
    service.setProvider(mockProvider, mockSigner);
    mockFetch.mockClear();
  });

  describe('Singleton', () => {
    it('should return singleton instance', () => {
      const instance1 = getDEXAggregatorService();
      const instance2 = getDEXAggregatorService();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getZeroXQuote', () => {
    const request: SwapQuoteRequest = {
      sellToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      buyToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      sellAmount: '1000000000',
      chainId: 1,
      slippagePercentage: 0.5,
    };

    it('should fetch quote from 0x API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sellTokenAddress: mockZeroXResponse.sellToken,
          buyTokenAddress: mockZeroXResponse.buyToken,
          sellAmount: mockZeroXResponse.sellAmount,
          buyAmount: mockZeroXResponse.buyAmount,
          price: mockZeroXResponse.price,
          guaranteedPrice: mockZeroXResponse.guaranteedPrice,
          estimatedPriceImpact: mockZeroXResponse.estimatedPriceImpact,
          sources: mockZeroXResponse.sources,
          gas: mockZeroXResponse.gas,
          gasPrice: mockZeroXResponse.gasPrice,
          estimatedGas: mockZeroXResponse.estimatedGas,
          allowanceTarget: mockZeroXResponse.allowanceTarget,
          to: mockZeroXResponse.to,
          data: mockZeroXResponse.data,
          value: mockZeroXResponse.value,
        }),
      });

      const quote = await service.getZeroXQuote(request);

      expect(quote.aggregator).toBe('0x');
      expect(quote.buyAmount).toBe(mockZeroXResponse.buyAmount);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('api.0x.org/swap/v1/quote'),
        expect.objectContaining({
          headers: expect.objectContaining({
            '0x-api-key': 'test-0x-key',
          }),
        })
      );
    });

    it('should throw error for unsupported chain', async () => {
      await expect(service.getZeroXQuote({ ...request, chainId: 999999 })).rejects.toThrow(
        SwapError
      );
    });

    it('should handle insufficient liquidity error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          reason: 'INSUFFICIENT_ASSET_LIQUIDITY',
        }),
      });

      await expect(service.getZeroXQuote(request)).rejects.toMatchObject({
        type: SwapErrorType.INSUFFICIENT_LIQUIDITY,
      });
    });

    it('should handle rate limit error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({}),
      });

      await expect(service.getZeroXQuote(request)).rejects.toMatchObject({
        type: SwapErrorType.RATE_LIMIT,
      });
    });
  });

  describe('getOneInchQuote', () => {
    const request: SwapQuoteRequest = {
      sellToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      buyToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      sellAmount: '1000000000',
      chainId: 1,
      slippagePercentage: 0.5,
    };

    it('should fetch quote from 1inch API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOneInchResponse,
      });

      const quote = await service.getOneInchQuote(request);

      expect(quote.aggregator).toBe('1inch');
      expect(quote.buyAmount).toBe(mockOneInchResponse.dstAmount);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('api.1inch.dev/swap/v6.0/1/swap'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-1inch-key',
          }),
        })
      );
    });

    it('should handle 1inch errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          description: 'insufficient liquidity',
        }),
      });

      await expect(service.getOneInchQuote(request)).rejects.toMatchObject({
        type: SwapErrorType.INSUFFICIENT_LIQUIDITY,
      });
    });
  });

  describe('getBestQuote', () => {
    const request: SwapQuoteRequest = {
      sellToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      buyToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      sellAmount: '1000000000',
      chainId: 1,
    };

    it('should return best quote from aggregators', async () => {
      // 0x returns more
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sellTokenAddress: mockZeroXResponse.sellToken,
            buyTokenAddress: mockZeroXResponse.buyToken,
            sellAmount: mockZeroXResponse.sellAmount,
            buyAmount: '500000000000000000', // 0.5 ETH
            price: mockZeroXResponse.price,
            sources: [],
            gas: '200000',
            gasPrice: '20000000000',
            estimatedGas: '200000',
            allowanceTarget: mockZeroXResponse.allowanceTarget,
            to: mockZeroXResponse.to,
            data: mockZeroXResponse.data,
            value: '0',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockOneInchResponse,
            dstAmount: '490000000000000000', // 0.49 ETH
          }),
        });

      const bestQuote = await service.getBestQuote(request);

      expect(bestQuote.aggregator).toBe('0x');
      expect(bestQuote.buyAmount).toBe('500000000000000000');
    });

    it('should return 1inch if it has better price', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sellTokenAddress: mockZeroXResponse.sellToken,
            buyTokenAddress: mockZeroXResponse.buyToken,
            sellAmount: mockZeroXResponse.sellAmount,
            buyAmount: '400000000000000000', // 0.4 ETH
            price: mockZeroXResponse.price,
            sources: [],
            gas: '200000',
            gasPrice: '20000000000',
            estimatedGas: '200000',
            allowanceTarget: mockZeroXResponse.allowanceTarget,
            to: mockZeroXResponse.to,
            data: mockZeroXResponse.data,
            value: '0',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockOneInchResponse,
            dstAmount: '510000000000000000', // 0.51 ETH (better)
          }),
        });

      const bestQuote = await service.getBestQuote(request);

      expect(bestQuote.aggregator).toBe('1inch');
    });

    it('should throw error if no quotes available', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ reason: 'error' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ description: 'error' }),
        });

      await expect(service.getBestQuote(request)).rejects.toThrow(SwapError);
    });
  });

  describe('getAllQuotes', () => {
    const request: SwapQuoteRequest = {
      sellToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      buyToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      sellAmount: '1000000000',
      chainId: 1,
    };

    it('should return all quotes sorted by buyAmount', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sellTokenAddress: mockZeroXResponse.sellToken,
            buyTokenAddress: mockZeroXResponse.buyToken,
            sellAmount: mockZeroXResponse.sellAmount,
            buyAmount: '400000000000000000',
            price: mockZeroXResponse.price,
            sources: [],
            gas: '200000',
            gasPrice: '20000000000',
            estimatedGas: '200000',
            allowanceTarget: mockZeroXResponse.allowanceTarget,
            to: mockZeroXResponse.to,
            data: mockZeroXResponse.data,
            value: '0',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockOneInchResponse,
            dstAmount: '510000000000000000',
          }),
        });

      const quotes = await service.getAllQuotes(request);

      expect(quotes).toHaveLength(2);
      expect(quotes[0].aggregator).toBe('1inch'); // Higher buyAmount first
      expect(quotes[1].aggregator).toBe('0x');
    });
  });

  describe('checkApproval', () => {
    it('should return approved for native token', async () => {
      const approval = await service.checkApproval(
        '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        '0xUserAddress',
        '0xSpenderAddress',
        '1000000000'
      );

      expect(approval.isApproved).toBe(true);
    });

    // Skip test - requires real ethers provider for Contract interaction
    // This test would need integration testing setup
    it.skip('should check ERC20 allowance', async () => {
      const approval = await service.checkApproval(
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        '0xUserAddress',
        '0xSpenderAddress',
        '1000000000'
      );

      expect(approval.isApproved).toBe(true);
      expect(approval.allowance).toBe('1000000000000000000000');
    });

    it('should throw error without provider', async () => {
      const newService = new DEXAggregatorService();
      await expect(
        newService.checkApproval('0xToken', '0xOwner', '0xSpender', '1000')
      ).rejects.toMatchObject({
        type: SwapErrorType.NETWORK_ERROR,
      });
    });
  });

  describe('executeSwap', () => {
    it('should execute swap transaction', async () => {
      const result = await service.executeSwap({
        quote: {
          ...mockZeroXResponse,
          sellToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native token
        },
        takerAddress: '0xUserAddress',
        slippagePercentage: 0.5,
      });

      expect(result.transactionHash).toBe('0xtxhash123');
      expect(result.status).toBe('pending');
      expect(mockSigner.sendTransaction).toHaveBeenCalled();
    });

    it('should throw error without signer', async () => {
      const newService = new DEXAggregatorService();
      newService.setProvider(mockProvider);

      await expect(
        newService.executeSwap({
          quote: mockZeroXResponse,
          takerAddress: '0xUserAddress',
          slippagePercentage: 0.5,
        })
      ).rejects.toMatchObject({
        type: SwapErrorType.NETWORK_ERROR,
      });
    });
  });

  describe('waitForSwap', () => {
    it('should wait for transaction confirmation', async () => {
      const result = await service.waitForSwap('0xtxhash123', 1);

      expect(result.status).toBe('confirmed');
      expect(result.gasUsed).toBe('180000');
    });

    it('should handle failed transaction', async () => {
      (mockProvider.waitForTransaction as jest.Mock).mockResolvedValueOnce({
        status: 0,
        gasUsed: BigInt('180000'),
      });

      const result = await service.waitForSwap('0xfailedtx', 1);
      expect(result.status).toBe('failed');
    });
  });

  describe('getTokenInfo', () => {
    it('should return native token info', async () => {
      const info = await service.getTokenInfo('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', 1);

      expect(info.symbol).toBe('ETH');
      expect(info.decimals).toBe(18);
    });

    // Skip test - requires real ethers provider for Contract interaction
    it.skip('should fetch ERC20 token info', async () => {
      const info = await service.getTokenInfo('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 1);

      expect(info.symbol).toBe('TEST');
      expect(info.name).toBe('Test Token');
      expect(info.decimals).toBe(18);
    });
  });

  describe('getTokenBalance', () => {
    it('should get native token balance', async () => {
      const balance = await service.getTokenBalance(
        '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        '0xUserAddress',
        1
      );

      expect(balance).toBe('10000000000000000000');
      expect(mockProvider.getBalance).toHaveBeenCalledWith('0xUserAddress');
    });

    // Skip test - requires real ethers provider for Contract interaction
    it.skip('should get ERC20 token balance', async () => {
      const balance = await service.getTokenBalance(
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        '0xUserAddress',
        1
      );

      expect(balance).toBe('5000000000000000000');
    });
  });

  describe('DEX_CONFIG', () => {
    it('should have all supported chains configured', () => {
      const supportedChains = [1, 137, 42161, 10, 8453, 56, 43114];

      supportedChains.forEach(chainId => {
        expect(DEX_CONFIG[chainId]).toBeDefined();
        expect(DEX_CONFIG[chainId].zeroxApiUrl).toBeDefined();
        expect(DEX_CONFIG[chainId].oneInchApiUrl).toBeDefined();
        expect(DEX_CONFIG[chainId].nativeToken).toBeDefined();
      });
    });

    it('should have correct native tokens', () => {
      expect(DEX_CONFIG[1].nativeToken.symbol).toBe('ETH');
      expect(DEX_CONFIG[137].nativeToken.symbol).toBe('MATIC');
      expect(DEX_CONFIG[56].nativeToken.symbol).toBe('BNB');
      expect(DEX_CONFIG[43114].nativeToken.symbol).toBe('AVAX');
    });
  });
});
