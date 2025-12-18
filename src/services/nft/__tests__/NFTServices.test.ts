/**
 * NFT Services Tests
 */

import AlchemyNFTService, { getAlchemyNFTService } from '../AlchemyNFTService';
import MoralisNFTService, { getMoralisNFTService } from '../MoralisNFTService';
import { NFTError, NFTErrorType, NFT_CHAIN_CONFIG } from '../types';

// Mock fetch
global.fetch = jest.fn();

describe('AlchemyNFTService', () => {
  let service: AlchemyNFTService;
  const mockFetch = global.fetch as jest.Mock;

  const mockAlchemyResponse = {
    ownedNfts: [
      {
        contract: {
          address: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
          name: 'Bored Ape Yacht Club',
          symbol: 'BAYC',
          tokenType: 'ERC721',
          openSeaMetadata: {
            floorPrice: 15.5,
            collectionName: 'Bored Ape Yacht Club',
          },
        },
        tokenId: '1234',
        tokenType: 'ERC721',
        name: 'Bored Ape #1234',
        description: 'A unique ape',
        image: {
          cachedUrl: 'https://example.com/image.png',
          thumbnailUrl: 'https://example.com/thumb.png',
        },
        raw: {
          metadata: {
            attributes: [{ trait_type: 'Background', value: 'Blue' }],
          },
        },
        balance: '1',
      },
    ],
    pageKey: 'next-page-key',
    totalCount: 50,
  };

  beforeEach(() => {
    service = new AlchemyNFTService();
    service.initialize({ apiKey: 'test-api-key' });
    mockFetch.mockClear();
  });

  describe('Singleton', () => {
    it('should return singleton instance', () => {
      const instance1 = getAlchemyNFTService();
      const instance2 = getAlchemyNFTService();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getNFTsForOwner', () => {
    it('should fetch NFTs for owner', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAlchemyResponse,
      });

      const result = await service.getNFTsForOwner({
        owner: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });

      expect(result.nfts).toHaveLength(1);
      expect(result.nfts[0].name).toBe('Bored Ape #1234');
      expect(result.nfts[0].tokenId).toBe('1234');
      expect(result.pageKey).toBe('next-page-key');
      expect(result.totalCount).toBe(50);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('eth-mainnet.g.alchemy.com'));
    });

    it('should handle pagination', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAlchemyResponse,
      });

      await service.getNFTsForOwner({
        owner: '0x1234567890123456789012345678901234567890',
        chainId: 1,
        pageKey: 'some-page-key',
        pageSize: 50,
      });

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('pageKey=some-page-key'));
    });

    it('should throw error without API key', async () => {
      const newService = new AlchemyNFTService();
      await expect(
        newService.getNFTsForOwner({
          owner: '0x1234',
          chainId: 1,
        })
      ).rejects.toMatchObject({
        type: NFTErrorType.API_ERROR,
      });
    });

    it('should throw error for unsupported chain', async () => {
      await expect(
        service.getNFTsForOwner({
          owner: '0x1234',
          chainId: 56, // BSC not supported by Alchemy
        })
      ).rejects.toMatchObject({
        type: NFTErrorType.CHAIN_NOT_SUPPORTED,
      });
    });

    it('should handle rate limit error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ message: 'Rate limit' }),
      });

      await expect(
        service.getNFTsForOwner({
          owner: '0x1234',
          chainId: 1,
        })
      ).rejects.toMatchObject({
        type: NFTErrorType.RATE_LIMIT,
      });
    });
  });

  describe('getNFTMetadata', () => {
    it('should fetch NFT metadata', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAlchemyResponse.ownedNfts[0],
      });

      const result = await service.getNFTMetadata(
        '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
        '1234',
        1
      );

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Bored Ape #1234');
    });

    it('should return null for not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await service.getNFTMetadata('0x123', '999', 1);
      expect(result).toBeNull();
    });
  });

  describe('getContractMetadata', () => {
    it('should fetch contract metadata', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          address: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
          name: 'Bored Ape Yacht Club',
          symbol: 'BAYC',
          tokenType: 'ERC721',
          totalSupply: '10000',
          openSeaMetadata: {
            floorPrice: 15.5,
            safelistRequestStatus: 'verified',
          },
        }),
      });

      const result = await service.getContractMetadata(
        '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
        1
      );

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Bored Ape Yacht Club');
      expect(result?.verified).toBe(true);
    });
  });

  describe('getFloorPrice', () => {
    it('should fetch floor price', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          openSea: {
            floorPrice: 15.5,
            priceCurrency: 'ETH',
            collectionUrl: 'https://opensea.io/collection/bayc',
          },
        }),
      });

      const result = await service.getFloorPrice('0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D', 1);

      expect(result).not.toBeNull();
      expect(result?.floorPrice).toBe(15.5);
      expect(result?.marketplace).toBe('OpenSea');
    });
  });

  describe('verifyNFTOwnership', () => {
    it('should verify ownership', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAlchemyResponse,
      });

      const result = await service.verifyNFTOwnership(
        '0xOwner',
        '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
        '1234',
        1
      );

      expect(result).toBe(true);
    });

    it('should return false if not owned', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockAlchemyResponse, ownedNfts: [] }),
      });

      const result = await service.verifyNFTOwnership(
        '0xOwner',
        '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
        '9999',
        1
      );

      expect(result).toBe(false);
    });
  });

  describe('isChainSupported', () => {
    it('should return true for supported chains', () => {
      expect(service.isChainSupported(1)).toBe(true); // Ethereum
      expect(service.isChainSupported(137)).toBe(true); // Polygon
      expect(service.isChainSupported(42161)).toBe(true); // Arbitrum
    });

    it('should return false for unsupported chains', () => {
      expect(service.isChainSupported(56)).toBe(false); // BSC
      expect(service.isChainSupported(999999)).toBe(false);
    });
  });
});

describe('MoralisNFTService', () => {
  let service: MoralisNFTService;
  const mockFetch = global.fetch as jest.Mock;

  const mockMoralisResponse = {
    status: 'SYNCED',
    page: 0,
    page_size: 100,
    cursor: 'next-cursor',
    result: [
      {
        token_address: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
        token_id: '5678',
        amount: '1',
        owner_of: '0xOwnerAddress',
        contract_type: 'ERC721',
        name: 'Bored Ape Yacht Club',
        symbol: 'BAYC',
        token_uri: 'https://ipfs.io/ipfs/QmHash',
        normalized_metadata: {
          name: 'Bored Ape #5678',
          description: 'A unique ape',
          image: 'https://example.com/image.png',
          attributes: [{ trait_type: 'Background', value: 'Yellow' }],
        },
        verified_collection: true,
      },
    ],
  };

  beforeEach(() => {
    service = new MoralisNFTService();
    service.initialize({ apiKey: 'test-moralis-key' });
    mockFetch.mockClear();
  });

  describe('Singleton', () => {
    it('should return singleton instance', () => {
      const instance1 = getMoralisNFTService();
      const instance2 = getMoralisNFTService();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getNFTsForOwner', () => {
    it('should fetch NFTs for owner', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMoralisResponse,
      });

      const result = await service.getNFTsForOwner({
        owner: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      });

      expect(result.nfts).toHaveLength(1);
      expect(result.nfts[0].name).toBe('Bored Ape #5678');
      expect(result.nfts[0].tokenId).toBe('5678');
      expect(result.pageKey).toBe('next-cursor');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('deep-index.moralis.io'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Key': 'test-moralis-key',
          }),
        })
      );
    });

    it('should throw error without API key', async () => {
      const newService = new MoralisNFTService();
      await expect(
        newService.getNFTsForOwner({
          owner: '0x1234',
          chainId: 1,
        })
      ).rejects.toMatchObject({
        type: NFTErrorType.API_ERROR,
      });
    });

    it('should handle rate limit error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ message: 'Rate limit' }),
      });

      await expect(
        service.getNFTsForOwner({
          owner: '0x1234',
          chainId: 1,
        })
      ).rejects.toMatchObject({
        type: NFTErrorType.RATE_LIMIT,
      });
    });
  });

  describe('getNFTMetadata', () => {
    it('should fetch NFT metadata', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMoralisResponse.result[0],
      });

      const result = await service.getNFTMetadata(
        '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
        '5678',
        1
      );

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Bored Ape #5678');
    });
  });

  describe('getTransfers', () => {
    it('should fetch transfers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: [
            {
              token_id: '1234',
              token_address: '0xContract',
              from_address: '0xFrom',
              to_address: '0xTo',
              transaction_hash: '0xTxHash',
              block_number: '12345678',
              block_timestamp: '2024-01-01T00:00:00Z',
            },
          ],
          cursor: 'next',
        }),
      });

      const result = await service.getTransfers('0xAddress', 1);

      expect(result.transfers).toHaveLength(1);
      expect(result.transfers[0].tokenId).toBe('1234');
      expect(result.transfers[0].transactionHash).toBe('0xTxHash');
    });
  });

  describe('searchNFTs', () => {
    it('should search NFTs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMoralisResponse,
      });

      const result = await service.searchNFTs('Bored Ape', 1);

      expect(result.nfts).toHaveLength(1);
      // URLSearchParams uses + for spaces
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('q=Bored+Ape'),
        expect.any(Object)
      );
    });
  });

  describe('isChainSupported', () => {
    it('should return true for supported chains', () => {
      expect(service.isChainSupported(1)).toBe(true); // Ethereum
      expect(service.isChainSupported(137)).toBe(true); // Polygon
      expect(service.isChainSupported(56)).toBe(true); // BSC
    });

    it('should return false for unsupported chains', () => {
      expect(service.isChainSupported(999999)).toBe(false);
    });
  });
});

describe('NFT_CHAIN_CONFIG', () => {
  it('should have correct chain configurations', () => {
    expect(NFT_CHAIN_CONFIG[1].name).toBe('Ethereum');
    expect(NFT_CHAIN_CONFIG[1].alchemyNetwork).toBe('eth-mainnet');
    expect(NFT_CHAIN_CONFIG[1].moralisChain).toBe('eth');

    expect(NFT_CHAIN_CONFIG[137].name).toBe('Polygon');
    expect(NFT_CHAIN_CONFIG[56].name).toBe('BNB Chain');
  });

  it('should have Alchemy network for supported chains', () => {
    expect(NFT_CHAIN_CONFIG[1].alchemyNetwork).toBeTruthy();
    expect(NFT_CHAIN_CONFIG[137].alchemyNetwork).toBeTruthy();
    expect(NFT_CHAIN_CONFIG[42161].alchemyNetwork).toBeTruthy();
  });

  it('should have Moralis chain for all supported chains', () => {
    expect(NFT_CHAIN_CONFIG[1].moralisChain).toBeTruthy();
    expect(NFT_CHAIN_CONFIG[137].moralisChain).toBeTruthy();
    expect(NFT_CHAIN_CONFIG[56].moralisChain).toBeTruthy();
  });
});
