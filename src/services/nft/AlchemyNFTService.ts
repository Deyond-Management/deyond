/**
 * AlchemyNFTService
 * Integration with Alchemy NFT API v3
 */

import {
  NFTItem,
  NFTCollectionInfo,
  NFTQueryOptions,
  NFTPageResponse,
  NFTTransfer,
  NFTChainConfig,
  NFT_CHAIN_CONFIG,
  NFTError,
  NFTErrorType,
  AlchemyNFTResponse,
  AlchemyOwnedNFT,
  FloorPriceInfo,
  SpamFilterOptions,
} from './types';

/**
 * Alchemy API configuration
 */
interface AlchemyConfig {
  apiKey: string;
}

/**
 * Alchemy NFT Service
 */
class AlchemyNFTService {
  private apiKey: string = '';
  private baseUrls: Map<number, string> = new Map();

  /**
   * Initialize the service with API key
   */
  initialize(config: AlchemyConfig): void {
    this.apiKey = config.apiKey;
    this.setupBaseUrls();
  }

  /**
   * Setup base URLs for each supported chain
   */
  private setupBaseUrls(): void {
    Object.values(NFT_CHAIN_CONFIG).forEach(config => {
      if (config.alchemyNetwork) {
        this.baseUrls.set(
          config.chainId,
          `https://${config.alchemyNetwork}.g.alchemy.com/nft/v3/${this.apiKey}`
        );
      }
    });
  }

  /**
   * Get base URL for chain
   */
  private getBaseUrl(chainId: number): string {
    const baseUrl = this.baseUrls.get(chainId);
    if (!baseUrl) {
      const config = NFT_CHAIN_CONFIG[chainId];
      if (!config?.alchemyNetwork) {
        throw new NFTError(
          NFTErrorType.CHAIN_NOT_SUPPORTED,
          `Chain ${chainId} is not supported by Alchemy NFT API`
        );
      }
      // Dynamically construct URL if not cached
      return `https://${config.alchemyNetwork}.g.alchemy.com/nft/v3/${this.apiKey}`;
    }
    return baseUrl;
  }

  /**
   * Get NFTs owned by address
   */
  async getNFTsForOwner(options: NFTQueryOptions): Promise<NFTPageResponse> {
    const { owner, chainId = 1, pageKey, pageSize = 100, contractAddresses } = options;

    if (!this.apiKey) {
      throw new NFTError(NFTErrorType.API_ERROR, 'Alchemy API key not configured');
    }

    const baseUrl = this.getBaseUrl(chainId);
    const params = new URLSearchParams({
      owner,
      pageSize: String(pageSize),
      withMetadata: 'true',
    });

    if (pageKey) {
      params.append('pageKey', pageKey);
    }

    if (contractAddresses?.length) {
      contractAddresses.forEach(addr => {
        params.append('contractAddresses[]', addr);
      });
    }

    try {
      const response = await fetch(`${baseUrl}/getNFTsForOwner?${params.toString()}`);

      if (!response.ok) {
        throw await this.handleApiError(response);
      }

      const data: AlchemyNFTResponse = await response.json();

      return {
        nfts: data.ownedNfts.map(nft => this.parseAlchemyNFT(nft, chainId, owner)),
        pageKey: data.pageKey,
        totalCount: data.totalCount,
      };
    } catch (error: any) {
      if (error instanceof NFTError) {
        throw error;
      }
      throw new NFTError(
        NFTErrorType.NETWORK_ERROR,
        `Failed to fetch NFTs: ${error.message}`,
        error
      );
    }
  }

  /**
   * Get NFT metadata by contract and token ID
   */
  async getNFTMetadata(
    contractAddress: string,
    tokenId: string,
    chainId: number = 1
  ): Promise<NFTItem | null> {
    if (!this.apiKey) {
      throw new NFTError(NFTErrorType.API_ERROR, 'Alchemy API key not configured');
    }

    const baseUrl = this.getBaseUrl(chainId);
    const params = new URLSearchParams({
      contractAddress,
      tokenId,
      refreshCache: 'false',
    });

    try {
      const response = await fetch(`${baseUrl}/getNFTMetadata?${params.toString()}`);

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw await this.handleApiError(response);
      }

      const data: AlchemyOwnedNFT = await response.json();
      return this.parseAlchemyNFT(data, chainId, '');
    } catch (error: any) {
      if (error instanceof NFTError) {
        throw error;
      }
      throw new NFTError(
        NFTErrorType.NETWORK_ERROR,
        `Failed to fetch NFT metadata: ${error.message}`,
        error
      );
    }
  }

  /**
   * Get NFTs for contract
   */
  async getNFTsForContract(
    contractAddress: string,
    chainId: number = 1,
    pageKey?: string,
    pageSize: number = 100
  ): Promise<NFTPageResponse> {
    if (!this.apiKey) {
      throw new NFTError(NFTErrorType.API_ERROR, 'Alchemy API key not configured');
    }

    const baseUrl = this.getBaseUrl(chainId);
    const params = new URLSearchParams({
      contractAddress,
      limit: String(pageSize),
      withMetadata: 'true',
    });

    if (pageKey) {
      params.append('startToken', pageKey);
    }

    try {
      const response = await fetch(`${baseUrl}/getNFTsForContract?${params.toString()}`);

      if (!response.ok) {
        throw await this.handleApiError(response);
      }

      const data = await response.json();

      return {
        nfts: data.nfts.map((nft: AlchemyOwnedNFT) => this.parseAlchemyNFT(nft, chainId, '')),
        pageKey: data.nextToken,
      };
    } catch (error: any) {
      if (error instanceof NFTError) {
        throw error;
      }
      throw new NFTError(
        NFTErrorType.NETWORK_ERROR,
        `Failed to fetch NFTs for contract: ${error.message}`,
        error
      );
    }
  }

  /**
   * Get contract metadata
   */
  async getContractMetadata(
    contractAddress: string,
    chainId: number = 1
  ): Promise<NFTCollectionInfo | null> {
    if (!this.apiKey) {
      throw new NFTError(NFTErrorType.API_ERROR, 'Alchemy API key not configured');
    }

    const baseUrl = this.getBaseUrl(chainId);
    const params = new URLSearchParams({ contractAddress });

    try {
      const response = await fetch(`${baseUrl}/getContractMetadata?${params.toString()}`);

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw await this.handleApiError(response);
      }

      const data = await response.json();

      return {
        contractAddress: data.address,
        name: data.name || 'Unknown',
        symbol: data.symbol,
        standard: data.tokenType || 'ERC721',
        totalSupply: data.totalSupply,
        ownedCount: 0,
        imageUrl: data.openSeaMetadata?.imageUrl,
        bannerImageUrl: data.openSeaMetadata?.bannerImageUrl,
        description: data.openSeaMetadata?.description,
        externalUrl: data.openSeaMetadata?.externalUrl,
        chainId,
        floorPrice: data.openSeaMetadata?.floorPrice?.toString(),
        verified: data.openSeaMetadata?.safelistRequestStatus === 'verified',
      };
    } catch (error: any) {
      if (error instanceof NFTError) {
        throw error;
      }
      throw new NFTError(
        NFTErrorType.NETWORK_ERROR,
        `Failed to fetch contract metadata: ${error.message}`,
        error
      );
    }
  }

  /**
   * Get floor price for collection
   */
  async getFloorPrice(
    contractAddress: string,
    chainId: number = 1
  ): Promise<FloorPriceInfo | null> {
    if (!this.apiKey) {
      throw new NFTError(NFTErrorType.API_ERROR, 'Alchemy API key not configured');
    }

    const baseUrl = this.getBaseUrl(chainId);
    const params = new URLSearchParams({ contractAddress });

    try {
      const response = await fetch(`${baseUrl}/getFloorPrice?${params.toString()}`);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      // Prefer OpenSea, then LooksRare
      const marketplace = data.openSea || data.looksRare;

      if (!marketplace) {
        return null;
      }

      return {
        floorPrice: marketplace.floorPrice,
        priceCurrency: marketplace.priceCurrency || 'ETH',
        collectionUrl: marketplace.collectionUrl,
        retrievedAt: Date.now(),
        marketplace: data.openSea ? 'OpenSea' : 'LooksRare',
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get NFT transfers for address
   */
  async getTransfers(
    address: string,
    chainId: number = 1,
    options?: {
      category?: ('erc721' | 'erc1155')[];
      fromBlock?: string;
      toBlock?: string;
      pageKey?: string;
    }
  ): Promise<{ transfers: NFTTransfer[]; pageKey?: string }> {
    if (!this.apiKey) {
      throw new NFTError(NFTErrorType.API_ERROR, 'Alchemy API key not configured');
    }

    const baseUrl = this.getBaseUrl(chainId).replace('/nft/v3/', '/v2/');

    const body: any = {
      toAddress: address,
      category: options?.category || ['erc721', 'erc1155'],
      withMetadata: true,
      maxCount: '0x64', // 100 in hex
    };

    if (options?.fromBlock) {
      body.fromBlock = options.fromBlock;
    }
    if (options?.toBlock) {
      body.toBlock = options.toBlock;
    }
    if (options?.pageKey) {
      body.pageKey = options.pageKey;
    }

    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'alchemy_getAssetTransfers',
          params: [body],
        }),
      });

      if (!response.ok) {
        throw await this.handleApiError(response);
      }

      const data = await response.json();
      const result = data.result;

      const transfers: NFTTransfer[] = result.transfers.map((t: any) => ({
        tokenId: t.tokenId || '',
        contractAddress: t.rawContract?.address || '',
        from: t.from,
        to: t.to,
        transactionHash: t.hash,
        blockNumber: parseInt(t.blockNum, 16),
        timestamp: 0, // Would need to fetch block timestamp
        value: t.value?.toString(),
      }));

      return {
        transfers,
        pageKey: result.pageKey,
      };
    } catch (error: any) {
      if (error instanceof NFTError) {
        throw error;
      }
      throw new NFTError(
        NFTErrorType.NETWORK_ERROR,
        `Failed to fetch transfers: ${error.message}`,
        error
      );
    }
  }

  /**
   * Refresh NFT metadata
   */
  async refreshMetadata(
    contractAddress: string,
    tokenId: string,
    chainId: number = 1
  ): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    const baseUrl = this.getBaseUrl(chainId);
    const params = new URLSearchParams({
      contractAddress,
      tokenId,
      refreshCache: 'true',
    });

    try {
      const response = await fetch(`${baseUrl}/getNFTMetadata?${params.toString()}`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Check if address owns NFT
   */
  async verifyNFTOwnership(
    owner: string,
    contractAddress: string,
    tokenId: string,
    chainId: number = 1
  ): Promise<boolean> {
    if (!this.apiKey) {
      throw new NFTError(NFTErrorType.API_ERROR, 'Alchemy API key not configured');
    }

    const baseUrl = this.getBaseUrl(chainId);
    const params = new URLSearchParams({
      owner,
      contractAddresses: contractAddress,
      withMetadata: 'false',
    });

    try {
      const response = await fetch(`${baseUrl}/getNFTsForOwner?${params.toString()}`);

      if (!response.ok) {
        return false;
      }

      const data: AlchemyNFTResponse = await response.json();
      return data.ownedNfts.some(
        nft =>
          nft.contract.address.toLowerCase() === contractAddress.toLowerCase() &&
          nft.tokenId === tokenId
      );
    } catch {
      return false;
    }
  }

  /**
   * Parse Alchemy NFT to standard format
   */
  private parseAlchemyNFT(nft: AlchemyOwnedNFT, chainId: number, owner: string): NFTItem {
    return {
      id: `${nft.contract.address}-${nft.tokenId}`,
      tokenId: nft.tokenId,
      contractAddress: nft.contract.address,
      standard: nft.tokenType || nft.contract.tokenType || 'ERC721',
      name: nft.name || nft.raw?.metadata?.name || `#${nft.tokenId}`,
      description: nft.description || nft.raw?.metadata?.description,
      imageUrl: nft.image?.cachedUrl || nft.image?.originalUrl || nft.raw?.metadata?.image,
      thumbnailUrl: nft.image?.thumbnailUrl,
      animationUrl: nft.raw?.metadata?.animation_url,
      externalUrl: nft.raw?.metadata?.external_url,
      attributes: nft.raw?.metadata?.attributes,
      owner,
      balance: nft.balance || '1',
      collectionName:
        nft.collection?.name || nft.contract.openSeaMetadata?.collectionName || nft.contract.name,
      collectionSymbol: nft.contract.symbol,
      chainId,
      tokenUri: nft.tokenUri || nft.raw?.tokenUri,
      lastUpdated: nft.acquiredAt?.blockTimestamp
        ? new Date(nft.acquiredAt.blockTimestamp).getTime()
        : undefined,
      floorPrice: nft.contract.openSeaMetadata?.floorPrice?.toString(),
    };
  }

  /**
   * Handle API error response
   */
  private async handleApiError(response: Response): Promise<NFTError> {
    let message = `API error (${response.status})`;
    let details: any = {};

    try {
      details = await response.json();
      message = details.error?.message || details.message || message;
    } catch {
      // Ignore JSON parse errors
    }

    if (response.status === 429) {
      return new NFTError(NFTErrorType.RATE_LIMIT, 'Rate limit exceeded', details);
    }

    if (response.status === 400) {
      return new NFTError(NFTErrorType.INVALID_ADDRESS, message, details);
    }

    if (response.status === 404) {
      return new NFTError(NFTErrorType.NOT_FOUND, 'NFT not found', details);
    }

    return new NFTError(NFTErrorType.API_ERROR, message, details);
  }

  /**
   * Filter NFTs based on spam options
   */
  filterNFTs(nfts: NFTItem[], options: SpamFilterOptions): NFTItem[] {
    return nfts.filter(nft => {
      if (options.excludeNoImage && !nft.imageUrl) {
        return false;
      }
      return true;
    });
  }

  /**
   * Check if chain is supported
   */
  isChainSupported(chainId: number): boolean {
    const config = NFT_CHAIN_CONFIG[chainId];
    return config?.supported === true && !!config.alchemyNetwork;
  }
}

// Singleton instance
let alchemyServiceInstance: AlchemyNFTService | null = null;

export const getAlchemyNFTService = (): AlchemyNFTService => {
  if (!alchemyServiceInstance) {
    alchemyServiceInstance = new AlchemyNFTService();
  }
  return alchemyServiceInstance;
};

export default AlchemyNFTService;
