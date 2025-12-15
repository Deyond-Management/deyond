/**
 * NFT Types
 * Type definitions for NFT functionality
 */

export type NFTStandard = 'ERC721' | 'ERC1155';

export interface NFTMetadata {
  name: string;
  description?: string;
  image?: string;
  external_url?: string;
  attributes?: NFTAttribute[];
  animation_url?: string;
  background_color?: string;
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

export interface NFT {
  id: string;
  tokenId: string;
  contractAddress: string;
  standard: NFTStandard;
  name: string;
  description?: string;
  imageUrl?: string;
  animationUrl?: string;
  externalUrl?: string;
  attributes?: NFTAttribute[];
  owner: string;
  balance?: string; // For ERC1155
  collectionName?: string;
  collectionSymbol?: string;
  chainId: number;
}

export interface NFTCollection {
  contractAddress: string;
  name: string;
  symbol: string;
  standard: NFTStandard;
  totalSupply?: string;
  ownedCount: number;
  floorPrice?: string;
  imageUrl?: string;
  chainId: number;
}

export interface NFTTransfer {
  from: string;
  to: string;
  tokenId: string;
  contractAddress: string;
  transactionHash: string;
  timestamp: number;
  blockNumber: number;
}

/**
 * NFT API Response Types (OpenSea/Alchemy format)
 */
export interface AlchemyNFT {
  contract: {
    address: string;
  };
  id: {
    tokenId: string;
    tokenMetadata?: {
      tokenType: string;
    };
  };
  title: string;
  description?: string;
  tokenUri?: {
    gateway?: string;
    raw?: string;
  };
  media?: Array<{
    gateway?: string;
    thumbnail?: string;
    raw?: string;
    format?: string;
  }>;
  metadata?: {
    name?: string;
    description?: string;
    image?: string;
    external_url?: string;
    attributes?: NFTAttribute[];
    animation_url?: string;
  };
  timeLastUpdated?: string;
  contractMetadata?: {
    name?: string;
    symbol?: string;
    totalSupply?: string;
    tokenType?: string;
  };
  balance?: string;
}

export interface OpenSeaNFT {
  identifier: string;
  collection: string;
  contract: string;
  token_standard: string;
  name: string;
  description?: string;
  image_url?: string;
  metadata_url?: string;
  created_at: string;
  updated_at: string;
  is_disabled: boolean;
  is_nsfw: boolean;
}

/**
 * NFT Filter and Sort Options
 */
export type NFTSortOption = 'name' | 'date' | 'price';
export type NFTFilterOption = 'all' | 'images' | 'videos' | 'audio';

export interface NFTQueryParams {
  owner: string;
  chainId?: number;
  contractAddress?: string;
  page?: number;
  pageSize?: number;
}
