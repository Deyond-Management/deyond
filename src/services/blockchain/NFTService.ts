/**
 * NFTService
 * NFT management and display
 */

import { AppConfig } from '../../config/app.config';
import { MOCK_NFTS } from '../../mocks/mockData';

interface NFT {
  tokenId: string;
  contractAddress: string;
  name: string;
  description: string;
  imageUrl: string;
  collection: string;
  standard: 'ERC721' | 'ERC1155';
  attributes?: Array<{ trait_type: string; value: string }>;
}

interface NFTCollection {
  address: string;
  name: string;
  symbol: string;
  count: number;
}

export class NFTService {
  private cache: Map<string, NFT[]> = new Map();

  async getNFTs(address: string, chainId: number): Promise<NFT[]> {
    const cacheKey = `${chainId}:${address}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Use mock data in demo mode
    if (AppConfig.demoMode) {
      const mockNFTs: NFT[] = MOCK_NFTS.map(nft => ({
        tokenId: nft.tokenId,
        contractAddress: nft.contractAddress,
        name: nft.name,
        description: nft.description,
        imageUrl: nft.image,
        collection: nft.collection,
        standard: 'ERC721' as const,
      }));
      this.cache.set(cacheKey, mockNFTs);
      return mockNFTs;
    }

    // Real implementation - fetch from API (Alchemy, OpenSea, etc.)
    return [];
  }

  async getNFTMetadata(contractAddress: string, tokenId: string): Promise<NFT | null> {
    // Fetch metadata from contract or IPFS
    return null;
  }

  async getCollections(address: string): Promise<NFTCollection[]> {
    return [];
  }

  async transferNFT(params: {
    from: string;
    to: string;
    contractAddress: string;
    tokenId: string;
    standard: 'ERC721' | 'ERC1155';
  }): Promise<string> {
    // Build and return transaction data
    return '0x';
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const nftService = new NFTService();
export default NFTService;
