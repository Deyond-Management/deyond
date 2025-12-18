/**
 * NFTService
 * Service for fetching and managing NFTs
 *
 * NOTE: This is a demo implementation. For production, use:
 * - Alchemy NFT API
 * - Moralis NFT API
 * - OpenSea API
 */

import { NFT, NFTCollection, NFTQueryParams, AlchemyNFT } from '../../types/nft';
import { getChainManager } from '../blockchain/ChainManager';
import AppConfig from '../../config/app.config';

export class NFTService {
  private cache: Map<string, NFT[]> = new Map();
  private cacheTimestamp: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 60000; // 1 minute
  private chainManager = getChainManager();

  /**
   * Get NFTs owned by address
   * Note: NFT service currently only supports EVM chains
   */
  async getNFTs(params: NFTQueryParams): Promise<NFT[]> {
    const { owner, chainId, page = 0, pageSize = 20 } = params;
    const rawChainId = chainId || this.chainManager.getChainId();
    // NFT service only supports EVM chains with numeric chainIds
    const currentChainId = typeof rawChainId === 'number' ? rawChainId : 1;

    // Check cache first
    const cacheKey = `${owner}:${currentChainId}:${page}`;
    const cached = this.getCachedNFTs(cacheKey);
    if (cached) {
      return cached;
    }

    // In demo mode, return mock NFTs
    if (AppConfig.demoMode) {
      const mockNFTs = this.generateMockNFTs(owner, currentChainId, page, pageSize);
      this.cacheNFTs(cacheKey, mockNFTs);
      return mockNFTs;
    }

    try {
      // TODO: In production, call Alchemy or Moralis API
      // const response = await fetch(
      //   `https://eth-mainnet.g.alchemy.com/nft/v2/${ALCHEMY_API_KEY}/getNFTs?owner=${owner}&pageSize=${pageSize}`
      // );
      // const data = await response.json();
      // return this.parseAlchemyNFTs(data.ownedNfts, currentChainId);

      return [];
    } catch (error) {
      console.error('Failed to fetch NFTs:', error);
      throw new Error('Failed to fetch NFTs');
    }
  }

  /**
   * Get NFT collections owned by address
   */
  async getCollections(owner: string, chainId?: number): Promise<NFTCollection[]> {
    const nfts = await this.getNFTs({ owner, chainId });

    // Group by contract address
    const collectionsMap = new Map<string, NFTCollection>();

    nfts.forEach(nft => {
      const existing = collectionsMap.get(nft.contractAddress);

      if (existing) {
        existing.ownedCount++;
      } else {
        collectionsMap.set(nft.contractAddress, {
          contractAddress: nft.contractAddress,
          name: nft.collectionName || 'Unknown Collection',
          symbol: nft.collectionSymbol || 'UNKNOWN',
          standard: nft.standard,
          ownedCount: 1,
          imageUrl: nft.imageUrl,
          chainId: nft.chainId,
        });
      }
    });

    return Array.from(collectionsMap.values());
  }

  /**
   * Get NFT by token ID and contract
   * Note: NFT service currently only supports EVM chains
   */
  async getNFT(contractAddress: string, tokenId: string, chainId?: number): Promise<NFT | null> {
    const rawChainId = chainId || this.chainManager.getChainId();
    // NFT service only supports EVM chains with numeric chainIds
    const currentChainId = typeof rawChainId === 'number' ? rawChainId : 1;

    if (AppConfig.demoMode) {
      return this.generateMockNFT(contractAddress, tokenId, currentChainId);
    }

    try {
      // TODO: In production, call Alchemy or Moralis API
      // const response = await fetch(
      //   `https://eth-mainnet.g.alchemy.com/nft/v2/${ALCHEMY_API_KEY}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${tokenId}`
      // );
      // const data = await response.json();
      // return this.parseAlchemyNFT(data, currentChainId);

      return null;
    } catch (error) {
      console.error('Failed to fetch NFT:', error);
      return null;
    }
  }

  /**
   * Clear NFT cache
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheTimestamp.clear();
  }

  /**
   * Get cached NFTs if valid
   */
  private getCachedNFTs(key: string): NFT[] | null {
    const timestamp = this.cacheTimestamp.get(key);
    if (!timestamp || Date.now() - timestamp > this.CACHE_DURATION) {
      return null;
    }

    return this.cache.get(key) || null;
  }

  /**
   * Cache NFTs
   */
  private cacheNFTs(key: string, nfts: NFT[]): void {
    this.cache.set(key, nfts);
    this.cacheTimestamp.set(key, Date.now());
  }

  /**
   * Parse Alchemy NFT response
   */
  private parseAlchemyNFTs(alchemyNFTs: AlchemyNFT[], chainId: number): NFT[] {
    return alchemyNFTs.map(nft => this.parseAlchemyNFT(nft, chainId));
  }

  /**
   * Parse single Alchemy NFT
   */
  private parseAlchemyNFT(nft: AlchemyNFT, chainId: number): NFT {
    const metadata = nft.metadata || {};
    const media = nft.media?.[0];

    return {
      id: `${nft.contract.address}-${nft.id.tokenId}`,
      tokenId: nft.id.tokenId,
      contractAddress: nft.contract.address,
      standard: (nft.id.tokenMetadata?.tokenType as any) || 'ERC721',
      name: metadata.name || nft.title || `#${nft.id.tokenId}`,
      description: metadata.description || nft.description,
      imageUrl: metadata.image || media?.gateway || media?.thumbnail,
      animationUrl: metadata.animation_url,
      externalUrl: metadata.external_url,
      attributes: metadata.attributes,
      owner: '', // Set by caller
      balance: nft.balance,
      collectionName: nft.contractMetadata?.name,
      collectionSymbol: nft.contractMetadata?.symbol,
      chainId,
    };
  }

  /**
   * Generate mock NFTs for demo
   */
  private generateMockNFTs(owner: string, chainId: number, page: number, pageSize: number): NFT[] {
    const mockCollections = [
      {
        name: 'Bored Ape Yacht Club',
        symbol: 'BAYC',
        contract: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
      },
      {
        name: 'CryptoPunks',
        symbol: 'PUNK',
        contract: '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB',
      },
      { name: 'Azuki', symbol: 'AZUKI', contract: '0xED5AF388653567Af2F388E6224dC7C4b3241C544' },
      { name: 'Doodles', symbol: 'DOODLE', contract: '0x8a90CAb2b38dba80c64b7734e58Ee1dB38B8992e' },
    ];

    const nfts: NFT[] = [];
    const startIndex = page * pageSize;

    for (let i = 0; i < pageSize; i++) {
      const index = startIndex + i;
      const collection = mockCollections[index % mockCollections.length];
      const tokenId = (1000 + index).toString();

      nfts.push({
        id: `${collection.contract}-${tokenId}`,
        tokenId,
        contractAddress: collection.contract,
        standard: 'ERC721',
        name: `${collection.name} #${tokenId}`,
        description: `A unique NFT from the ${collection.name} collection`,
        imageUrl: `https://via.placeholder.com/400x400.png?text=${collection.symbol}+%23${tokenId}`,
        owner,
        collectionName: collection.name,
        collectionSymbol: collection.symbol,
        chainId,
        attributes: [
          { trait_type: 'Background', value: ['Blue', 'Red', 'Green', 'Yellow'][index % 4] },
          { trait_type: 'Eyes', value: ['Laser', 'Normal', 'Sad', 'Happy'][index % 4] },
          { trait_type: 'Mouth', value: ['Smile', 'Frown', 'Neutral'][index % 3] },
        ],
      });
    }

    return nfts;
  }

  /**
   * Generate mock NFT for demo
   */
  private generateMockNFT(contractAddress: string, tokenId: string, chainId: number): NFT {
    return {
      id: `${contractAddress}-${tokenId}`,
      tokenId,
      contractAddress,
      standard: 'ERC721',
      name: `NFT #${tokenId}`,
      description: 'A demo NFT for testing',
      imageUrl: `https://via.placeholder.com/400x400.png?text=NFT+%23${tokenId}`,
      owner: '',
      chainId,
      attributes: [
        { trait_type: 'Rarity', value: 'Common' },
        { trait_type: 'Type', value: 'Demo' },
      ],
    };
  }
}

export default NFTService;
