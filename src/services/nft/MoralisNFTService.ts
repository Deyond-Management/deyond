/**
 * MoralisNFTService
 * Integration with Moralis NFT API
 */

import {
  NFTItem,
  NFTCollectionInfo,
  NFTQueryOptions,
  NFTPageResponse,
  NFTTransfer,
  NFT_CHAIN_CONFIG,
  NFTError,
  NFTErrorType,
  MoralisNFTResponse,
  MoralisNFT,
  SpamFilterOptions,
} from './types';

/**
 * Moralis API configuration
 */
interface MoralisConfig {
  apiKey: string;
}

/**
 * Moralis NFT Service
 */
class MoralisNFTService {
  private apiKey: string = '';
  private baseUrl: string = 'https://deep-index.moralis.io/api/v2.2';

  /**
   * Initialize the service with API key
   */
  initialize(config: MoralisConfig): void {
    this.apiKey = config.apiKey;
  }

  /**
   * Get Moralis chain identifier
   */
  private getChainParam(chainId: number): string {
    const config = NFT_CHAIN_CONFIG[chainId];
    if (!config?.moralisChain) {
      throw new NFTError(
        NFTErrorType.CHAIN_NOT_SUPPORTED,
        `Chain ${chainId} is not supported by Moralis NFT API`
      );
    }
    return config.moralisChain;
  }

  /**
   * Get NFTs owned by address
   */
  async getNFTsForOwner(options: NFTQueryOptions): Promise<NFTPageResponse> {
    const { owner, chainId = 1, pageKey, pageSize = 100, contractAddresses } = options;

    if (!this.apiKey) {
      throw new NFTError(NFTErrorType.API_ERROR, 'Moralis API key not configured');
    }

    const chain = this.getChainParam(chainId);
    const params = new URLSearchParams({
      chain,
      format: 'decimal',
      limit: String(pageSize),
      normalizeMetadata: 'true',
      media_items: 'true',
    });

    if (pageKey) {
      params.append('cursor', pageKey);
    }

    if (contractAddresses?.length) {
      params.append('token_addresses', contractAddresses.join(','));
    }

    try {
      const response = await fetch(`${this.baseUrl}/${owner}/nft?${params.toString()}`, {
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw await this.handleApiError(response);
      }

      const data: MoralisNFTResponse = await response.json();

      return {
        nfts: data.result.map(nft => this.parseMoralisNFT(nft, chainId)),
        pageKey: data.cursor,
        totalCount: undefined, // Moralis doesn't provide total count in v2
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
      throw new NFTError(NFTErrorType.API_ERROR, 'Moralis API key not configured');
    }

    const chain = this.getChainParam(chainId);
    const params = new URLSearchParams({
      chain,
      format: 'decimal',
      normalizeMetadata: 'true',
      media_items: 'true',
    });

    try {
      const response = await fetch(
        `${this.baseUrl}/nft/${contractAddress}/${tokenId}?${params.toString()}`,
        {
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw await this.handleApiError(response);
      }

      const data: MoralisNFT = await response.json();
      return this.parseMoralisNFT(data, chainId);
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
      throw new NFTError(NFTErrorType.API_ERROR, 'Moralis API key not configured');
    }

    const chain = this.getChainParam(chainId);
    const params = new URLSearchParams({
      chain,
      format: 'decimal',
      limit: String(pageSize),
      normalizeMetadata: 'true',
    });

    if (pageKey) {
      params.append('cursor', pageKey);
    }

    try {
      const response = await fetch(`${this.baseUrl}/nft/${contractAddress}?${params.toString()}`, {
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw await this.handleApiError(response);
      }

      const data: MoralisNFTResponse = await response.json();

      return {
        nfts: data.result.map(nft => this.parseMoralisNFT(nft, chainId)),
        pageKey: data.cursor,
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
   * Get contract/collection metadata
   */
  async getContractMetadata(
    contractAddress: string,
    chainId: number = 1
  ): Promise<NFTCollectionInfo | null> {
    if (!this.apiKey) {
      throw new NFTError(NFTErrorType.API_ERROR, 'Moralis API key not configured');
    }

    const chain = this.getChainParam(chainId);
    const params = new URLSearchParams({ chain });

    try {
      const response = await fetch(
        `${this.baseUrl}/nft/${contractAddress}/metadata?${params.toString()}`,
        {
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw await this.handleApiError(response);
      }

      const data = await response.json();

      return {
        contractAddress: data.token_address,
        name: data.name || 'Unknown',
        symbol: data.symbol,
        standard: data.contract_type || 'ERC721',
        totalSupply: undefined,
        ownedCount: 0,
        chainId,
        verified: data.verified_collection,
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
   * Get NFT transfers for address
   */
  async getTransfers(
    address: string,
    chainId: number = 1,
    options?: {
      direction?: 'both' | 'from' | 'to';
      fromBlock?: number;
      toBlock?: number;
      cursor?: string;
      limit?: number;
    }
  ): Promise<{ transfers: NFTTransfer[]; pageKey?: string }> {
    if (!this.apiKey) {
      throw new NFTError(NFTErrorType.API_ERROR, 'Moralis API key not configured');
    }

    const chain = this.getChainParam(chainId);
    const params = new URLSearchParams({
      chain,
      format: 'decimal',
      direction: options?.direction || 'both',
      limit: String(options?.limit || 100),
    });

    if (options?.fromBlock) {
      params.append('from_block', String(options.fromBlock));
    }
    if (options?.toBlock) {
      params.append('to_block', String(options.toBlock));
    }
    if (options?.cursor) {
      params.append('cursor', options.cursor);
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/${address}/nft/transfers?${params.toString()}`,
        {
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw await this.handleApiError(response);
      }

      const data = await response.json();

      const transfers: NFTTransfer[] = data.result.map((t: any) => ({
        tokenId: t.token_id,
        contractAddress: t.token_address,
        from: t.from_address,
        to: t.to_address,
        transactionHash: t.transaction_hash,
        blockNumber: parseInt(t.block_number),
        timestamp: new Date(t.block_timestamp).getTime(),
        value: t.value,
      }));

      return {
        transfers,
        pageKey: data.cursor,
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
   * Get NFT owners
   */
  async getNFTOwners(
    contractAddress: string,
    tokenId: string,
    chainId: number = 1
  ): Promise<string[]> {
    if (!this.apiKey) {
      throw new NFTError(NFTErrorType.API_ERROR, 'Moralis API key not configured');
    }

    const chain = this.getChainParam(chainId);
    const params = new URLSearchParams({
      chain,
      format: 'decimal',
    });

    try {
      const response = await fetch(
        `${this.baseUrl}/nft/${contractAddress}/${tokenId}/owners?${params.toString()}`,
        {
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.result.map((r: any) => r.owner_of);
    } catch {
      return [];
    }
  }

  /**
   * Search NFTs
   */
  async searchNFTs(
    query: string,
    chainId: number = 1,
    options?: {
      filter?: 'name' | 'description' | 'global';
      cursor?: string;
      limit?: number;
    }
  ): Promise<NFTPageResponse> {
    if (!this.apiKey) {
      throw new NFTError(NFTErrorType.API_ERROR, 'Moralis API key not configured');
    }

    const chain = this.getChainParam(chainId);
    const params = new URLSearchParams({
      chain,
      q: query,
      filter: options?.filter || 'global',
      limit: String(options?.limit || 20),
    });

    if (options?.cursor) {
      params.append('cursor', options.cursor);
    }

    try {
      const response = await fetch(`${this.baseUrl}/nft/search?${params.toString()}`, {
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw await this.handleApiError(response);
      }

      const data: MoralisNFTResponse = await response.json();

      return {
        nfts: data.result.map(nft => this.parseMoralisNFT(nft, chainId)),
        pageKey: data.cursor,
      };
    } catch (error: any) {
      if (error instanceof NFTError) {
        throw error;
      }
      throw new NFTError(
        NFTErrorType.NETWORK_ERROR,
        `Failed to search NFTs: ${error.message}`,
        error
      );
    }
  }

  /**
   * Resync NFT metadata
   */
  async resyncMetadata(
    contractAddress: string,
    tokenId: string,
    chainId: number = 1
  ): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    const chain = this.getChainParam(chainId);
    const params = new URLSearchParams({
      chain,
      flag: 'uri',
      mode: 'sync',
    });

    try {
      const response = await fetch(
        `${this.baseUrl}/nft/${contractAddress}/${tokenId}/metadata/resync?${params.toString()}`,
        {
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Parse Moralis NFT to standard format
   */
  private parseMoralisNFT(nft: MoralisNFT, chainId: number): NFTItem {
    // Parse metadata if string
    let metadata = nft.normalized_metadata;
    if (!metadata && nft.metadata) {
      try {
        metadata = JSON.parse(nft.metadata);
      } catch {
        metadata = undefined;
      }
    }

    return {
      id: `${nft.token_address}-${nft.token_id}`,
      tokenId: nft.token_id,
      contractAddress: nft.token_address,
      standard: nft.contract_type || 'ERC721',
      name: metadata?.name || nft.name || `#${nft.token_id}`,
      description: metadata?.description,
      imageUrl: metadata?.image || nft.media?.original_media_url,
      animationUrl: metadata?.animation_url,
      externalUrl: metadata?.external_link,
      attributes: metadata?.attributes,
      owner: nft.owner_of || '',
      balance: nft.amount || '1',
      collectionName: nft.name,
      collectionSymbol: nft.symbol,
      chainId,
      tokenUri: nft.token_uri,
      lastUpdated: nft.last_metadata_sync ? new Date(nft.last_metadata_sync).getTime() : undefined,
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
      message = details.message || message;
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
    return config?.supported === true && !!config.moralisChain;
  }
}

// Singleton instance
let moralisServiceInstance: MoralisNFTService | null = null;

export const getMoralisNFTService = (): MoralisNFTService => {
  if (!moralisServiceInstance) {
    moralisServiceInstance = new MoralisNFTService();
  }
  return moralisServiceInstance;
};

export default MoralisNFTService;
