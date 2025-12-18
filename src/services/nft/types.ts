/**
 * NFT API Types
 * Type definitions for NFT API integrations
 */

/**
 * NFT token standard
 */
export type NFTStandard = 'ERC721' | 'ERC1155';

/**
 * NFT API providers
 */
export type NFTProvider = 'alchemy' | 'moralis' | 'opensea';

/**
 * NFT metadata attribute
 */
export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

/**
 * Core NFT interface
 */
export interface NFTItem {
  id: string;
  tokenId: string;
  contractAddress: string;
  standard: NFTStandard;
  name: string;
  description?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  animationUrl?: string;
  externalUrl?: string;
  attributes?: NFTAttribute[];
  owner: string;
  balance?: string;
  collectionName?: string;
  collectionSymbol?: string;
  chainId: number;
  tokenUri?: string;
  lastUpdated?: number;
  floorPrice?: string;
  lastSalePrice?: string;
}

/**
 * NFT collection interface
 */
export interface NFTCollectionInfo {
  contractAddress: string;
  name: string;
  symbol?: string;
  standard: NFTStandard;
  totalSupply?: string;
  ownedCount: number;
  imageUrl?: string;
  bannerImageUrl?: string;
  description?: string;
  externalUrl?: string;
  chainId: number;
  floorPrice?: string;
  verified?: boolean;
}

/**
 * Query parameters for fetching NFTs
 */
export interface NFTQueryOptions {
  owner: string;
  chainId?: number;
  contractAddresses?: string[];
  pageKey?: string;
  pageSize?: number;
  includeMetadata?: boolean;
  excludeFilters?: string[];
  orderBy?: 'transferTime' | 'tokenId';
  orderDirection?: 'asc' | 'desc';
}

/**
 * Paginated NFT response
 */
export interface NFTPageResponse {
  nfts: NFTItem[];
  pageKey?: string;
  totalCount?: number;
}

/**
 * NFT transfer record
 */
export interface NFTTransfer {
  tokenId: string;
  contractAddress: string;
  from: string;
  to: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
  value?: string;
}

/**
 * Chain-specific API configuration
 */
export interface NFTChainConfig {
  chainId: number;
  name: string;
  alchemyNetwork: string;
  moralisChain: string;
  supported: boolean;
}

/**
 * NFT API configuration by chain
 */
export const NFT_CHAIN_CONFIG: Record<number, NFTChainConfig> = {
  1: {
    chainId: 1,
    name: 'Ethereum',
    alchemyNetwork: 'eth-mainnet',
    moralisChain: 'eth',
    supported: true,
  },
  137: {
    chainId: 137,
    name: 'Polygon',
    alchemyNetwork: 'polygon-mainnet',
    moralisChain: 'polygon',
    supported: true,
  },
  42161: {
    chainId: 42161,
    name: 'Arbitrum',
    alchemyNetwork: 'arb-mainnet',
    moralisChain: 'arbitrum',
    supported: true,
  },
  10: {
    chainId: 10,
    name: 'Optimism',
    alchemyNetwork: 'opt-mainnet',
    moralisChain: 'optimism',
    supported: true,
  },
  8453: {
    chainId: 8453,
    name: 'Base',
    alchemyNetwork: 'base-mainnet',
    moralisChain: 'base',
    supported: true,
  },
  56: {
    chainId: 56,
    name: 'BNB Chain',
    alchemyNetwork: '', // Alchemy doesn't support BSC
    moralisChain: 'bsc',
    supported: true,
  },
  43114: {
    chainId: 43114,
    name: 'Avalanche',
    alchemyNetwork: '', // Alchemy doesn't fully support
    moralisChain: 'avalanche',
    supported: true,
  },
  11155111: {
    chainId: 11155111,
    name: 'Sepolia',
    alchemyNetwork: 'eth-sepolia',
    moralisChain: 'sepolia',
    supported: true,
  },
};

/**
 * NFT API error types
 */
export enum NFTErrorType {
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  NOT_FOUND = 'NOT_FOUND',
  INVALID_TOKEN = 'INVALID_TOKEN',
  CHAIN_NOT_SUPPORTED = 'CHAIN_NOT_SUPPORTED',
  API_ERROR = 'API_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/**
 * NFT error class
 */
export class NFTError extends Error {
  type: NFTErrorType;
  details?: any;

  constructor(type: NFTErrorType, message: string, details?: any) {
    super(message);
    this.name = 'NFTError';
    this.type = type;
    this.details = details;
  }
}

/**
 * Alchemy NFT API response types
 */
export interface AlchemyNFTResponse {
  ownedNfts: AlchemyOwnedNFT[];
  pageKey?: string;
  totalCount: number;
}

export interface AlchemyOwnedNFT {
  contract: {
    address: string;
    name?: string;
    symbol?: string;
    totalSupply?: string;
    tokenType: 'ERC721' | 'ERC1155';
    contractDeployer?: string;
    deployedBlockNumber?: number;
    openSeaMetadata?: {
      floorPrice?: number;
      collectionName?: string;
      collectionSlug?: string;
      safelistRequestStatus?: string;
      imageUrl?: string;
      description?: string;
      externalUrl?: string;
      bannerImageUrl?: string;
    };
  };
  tokenId: string;
  tokenType: 'ERC721' | 'ERC1155';
  name?: string;
  description?: string;
  tokenUri?: string;
  image?: {
    cachedUrl?: string;
    thumbnailUrl?: string;
    pngUrl?: string;
    contentType?: string;
    size?: number;
    originalUrl?: string;
  };
  raw?: {
    tokenUri?: string;
    metadata?: any;
  };
  collection?: {
    name?: string;
    slug?: string;
    externalUrl?: string;
    bannerImageUrl?: string;
  };
  balance?: string;
  acquiredAt?: {
    blockTimestamp?: string;
    blockNumber?: number;
  };
}

/**
 * Moralis NFT API response types
 */
export interface MoralisNFTResponse {
  status: string;
  page: number;
  page_size: number;
  cursor?: string;
  result: MoralisNFT[];
}

export interface MoralisNFT {
  token_address: string;
  token_id: string;
  amount: string;
  owner_of: string;
  token_hash: string;
  block_number_minted: string;
  block_number: string;
  contract_type: 'ERC721' | 'ERC1155';
  name?: string;
  symbol?: string;
  token_uri?: string;
  metadata?: string;
  last_token_uri_sync?: string;
  last_metadata_sync?: string;
  minter_address?: string;
  possible_spam?: boolean;
  verified_collection?: boolean;
  normalized_metadata?: {
    name?: string;
    description?: string;
    image?: string;
    external_link?: string;
    animation_url?: string;
    attributes?: NFTAttribute[];
  };
  media?: {
    status?: string;
    mimetype?: string;
    original_media_url?: string;
  };
}

/**
 * NFT refresh result
 */
export interface NFTRefreshResult {
  success: boolean;
  tokenId: string;
  contractAddress: string;
  message?: string;
}

/**
 * Floor price info
 */
export interface FloorPriceInfo {
  floorPrice: number;
  priceCurrency: string;
  collectionUrl?: string;
  retrievedAt: number;
  marketplace: string;
}

/**
 * NFT spam filter options
 */
export interface SpamFilterOptions {
  excludeSpam: boolean;
  excludeUnverified: boolean;
  excludeNoImage: boolean;
}
